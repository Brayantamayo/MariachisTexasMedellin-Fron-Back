import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../../config/prisma'
import transporter from '../../config/mailer'
import { TipoDocumento, ZonaServicio } from '../../generated/prisma'
import { RegistroSchema, ResetPasswordSchema, zodError } from '../schemas'
import { vincularCotizacionesPorEmail } from '../Cotizacion/cotizacion.services'
import { emailBienvenida, emailOtp } from '../../utils/email.templates'
import { AppError } from '../../utils/AppError'
import { JWT_SECRET } from './helpers/Auth.guards'

// ─── REGISTRO CLIENTE ─────────────────────────────────────────────────────────
export const registrarCliente = async (data: unknown) => {
  const parsed = RegistroSchema.safeParse(data)
  if (!parsed.success) throw new AppError(zodError(parsed.error), 400)

  const { passwordConfirmation, ...datosCliente } = parsed.data

  const [correoExiste, cedulaExiste] = await Promise.all([
    prisma.usuario.findUnique({ where: { email: datosCliente.email } }),
    prisma.cliente.findUnique({ where: { numeroDocumento: datosCliente.numeroDocumento } }),
  ])
  if (correoExiste) throw new AppError('El correo ya está registrado', 409)
  if (cedulaExiste) throw new AppError('El número de documento ya está registrado', 409)

  const passwordHash = await bcrypt.hash(datosCliente.password, 10)

  const rolCliente = await prisma.rol.findUnique({ where: { nombre: 'CLIENTE' } })
  if (!rolCliente) throw new AppError('Rol CLIENTE no encontrado, ejecuta el seed', 500)

  const usuario = await prisma.usuario.create({
    data: {
      nombre:   datosCliente.nombre,
      email:    datosCliente.email,
      password: passwordHash,
      rolId:    rolCliente.id,
    },
  })

  const cliente = await prisma.cliente.create({
    data: {
      email:               datosCliente.email,
      apellido:            datosCliente.apellido,
      tipoDocumento:       datosCliente.tipoDocumento as TipoDocumento,
      numeroDocumento:     datosCliente.numeroDocumento,
      fechaNacimiento:     new Date(datosCliente.fechaNacimiento),
      telefonoPrincipal:   datosCliente.telefonoPrincipal,
      telefonoAlternativo: datosCliente.telefonoAlternativo || null,
      ciudad:              datosCliente.ciudad,
      barrio:              datosCliente.barrio,
      direccion:           datosCliente.direccion,
      zonaServicio:        datosCliente.zonaServicio as ZonaServicio,
      foto:                datosCliente.foto || null,
    },
  })

  //  Capturamos el conteo para incluirlo en el email de bienvenida
  const cotizacionesVinculadas = await vincularCotizacionesPorEmail(cliente.email, cliente.id)
    .catch(err => {
      console.error('Error vinculando cotizaciones:', err)
      return 0
    })

  const base = (process.env.FRONTEND_URL ?? '').replace(/\/$/, '')
  const mail = emailBienvenida({
    nombre:                 usuario.nombre,
    loginUrl:               `${base}/login`,
    reservasUrl:            `${base}/reservas`,
    cotizacionesVinculadas,
  })

  await transporter.sendMail({ from: process.env.MAIL_FROM, to: usuario.email, ...mail })

  return {
    message: 'Registro exitoso. Inicia sesión para continuar',
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
  }
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const login = async (email: string, password: string) => {
  const usuario = await prisma.usuario.findUnique({
    where:   { email },
    include: {
      rol:     { include: { rolPermisos: { include: { permiso: true } } } },
      cliente: true,
    },
  })

  if (!usuario || !usuario.estado) throw new AppError('Credenciales inválidas', 401)

  const passwordValido = await bcrypt.compare(password, usuario.password)
  if (!passwordValido) throw new AppError('Credenciales inválidas', 401)

  if (usuario.rol.nombre === 'CLIENTE') {
    if (!usuario.cliente || !usuario.cliente.activo)
      throw new AppError('Credenciales inválidas', 401)
  }

  const permisos = usuario.rol.rolPermisos.map(rp => rp.permiso.nombre)
  const token    = jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol.nombre, permisos },
    JWT_SECRET,
    { expiresIn: '8h' }
  )

  return {
    token,
    usuario: {
      id:                  usuario.id,
      nombre:              usuario.nombre,
      apellido:            usuario.cliente?.apellido            ?? '',
      telefonoPrincipal:   usuario.cliente?.telefonoPrincipal   ?? '',
      telefonoAlternativo: usuario.cliente?.telefonoAlternativo ?? '',
      ciudad:              usuario.cliente?.ciudad              ?? '',
      barrio:              usuario.cliente?.barrio              ?? '',
      direccion:           usuario.cliente?.direccion           ?? '',
      email:               usuario.email,
      rol:                 usuario.rol.nombre,
      permisos,
    },
  }
}

// ─── RECUPERAR CONTRASEÑA ─────────────────────────────────────────────────────
export const recuperarPassword = async (email: string) => {
  const usuario = await prisma.usuario.findUnique({ where: { email } })
  if (!usuario) return { message: 'Si el correo está registrado, recibirás un código en tu bandeja.' }

  const otp       = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  await prisma.passwordResetOtp.updateMany({ where: { email, usado: false }, data: { usado: true } })
  await prisma.passwordResetOtp.create({ data: { email, otp, expiresAt } })

  const mail = emailOtp({ nombre: usuario.nombre, otp })
  await transporter.sendMail({ from: process.env.MAIL_FROM, to: usuario.email, ...mail })

  return { message: 'Si el correo está registrado, recibirás un código en tu bandeja.' }
}

// ─── VERIFICAR OTP ────────────────────────────────────────────────────────────
export const verificarOtp = async (email: string, otp: string) => {
  const registro = await prisma.passwordResetOtp.findFirst({
    where: { email, otp, usado: false, expiresAt: { gt: new Date() } },
  })
  if (!registro) throw new AppError('El código es inválido o ha expirado.', 400)
  return { message: 'Código válido', email }
}

// ─── RESETEAR CONTRASEÑA ──────────────────────────────────────────────────────
export const resetearPassword = async (
  email:             string,
  otp:               string,
  nuevaPassword:     string,
  confirmarPassword: string
) => {
  const parsed = ResetPasswordSchema.safeParse({ email, otp, nuevaPassword, confirmarPassword })
  if (!parsed.success) throw new AppError(zodError(parsed.error), 400)

  const registro = await prisma.passwordResetOtp.findFirst({
    where: { email, otp, usado: false, expiresAt: { gt: new Date() } },
  })
  if (!registro) throw new AppError('El código es inválido o ha expirado.', 400)

  const usuario = await prisma.usuario.findUnique({ where: { email } })
  if (!usuario) throw new AppError('Usuario no encontrado', 404)

  const mismaPassword = await bcrypt.compare(nuevaPassword, usuario.password)
  if (mismaPassword) throw new AppError('La nueva contraseña no puede ser igual a la actual', 400)

  const passwordHash = await bcrypt.hash(nuevaPassword, 10)

  await Promise.all([
    prisma.usuario.update({ where: { email }, data: { password: passwordHash } }),
    prisma.passwordResetOtp.update({ where: { id: registro.id }, data: { usado: true } }),
  ])

  return { message: 'Contraseña actualizada correctamente' }
}
////////// REGISTRO COTIZACION //////////

export const getRegistroToken = async (token: string) => {
  const registro = await prisma.registroToken.findUnique({ where: { token } })

  if (!registro)                    throw new Error('Token inválido')
  if (registro.usado)               throw new Error('Este enlace ya fue utilizado')
  if (registro.expiresAt < new Date()) throw new Error('Este enlace ha expirado')

  return {
    email:    registro.email,
    nombre:   registro.nombre,
    telefono: registro.telefono,
    telefono2: registro.telefono2 ?? '',
  }
}

// Llama esto cuando el registro sea exitoso
export const marcarTokenUsado = async (token: string) => {
  await prisma.registroToken.update({ where: { token }, data: { usado: true } })
}
