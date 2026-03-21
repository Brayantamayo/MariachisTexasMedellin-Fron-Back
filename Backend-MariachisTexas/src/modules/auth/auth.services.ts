import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../../config/prisma'
import transporter from '../../config/mailer'
import { TipoDocumento, ZonaServicio } from '../../generated/prisma'
import { RegistroSchema, ResetPasswordSchema, zodError } from '../schemas'
import { vincularCotizacionesPorEmail } from '../Cotizacion/cotizacion.services'
import { emailBienvenida, emailOtp } from '../../utils/email.templates'

// ─── REGISTRO CLIENTE ─────────────────────────────────────────────────────────
export const registrarCliente = async (data: any) => {
  const parsed = RegistroSchema.safeParse(data)
  if (!parsed.success) throw new Error(zodError(parsed.error))

  const { passwordConfirmation, ...datosCliente } = parsed.data

  const [correoExiste, cedulaExiste] = await Promise.all([
    prisma.cliente.findUnique({ where: { email: datosCliente.email } }),
    prisma.cliente.findUnique({ where: { numeroDocumento: datosCliente.numeroDocumento } })
  ])
  if (correoExiste) throw new Error('El correo ya está registrado')
  if (cedulaExiste) throw new Error('El número de documento ya está registrado')

  const passwordHash = await bcrypt.hash(datosCliente.password, 10)

  const rolCliente = await prisma.rol.findUnique({ where: { nombre: 'CLIENTE' } })
  if (!rolCliente) throw new Error('Rol CLIENTE no encontrado, ejecuta el seed')

  const cliente = await prisma.cliente.create({
    data: {
      nombre:              datosCliente.nombre,
      apellido:            datosCliente.apellido,
      tipoDocumento:       datosCliente.tipoDocumento as TipoDocumento,
      numeroDocumento:     datosCliente.numeroDocumento,
      fechaNacimiento:     new Date(datosCliente.fechaNacimiento),
      email:               datosCliente.email,
      telefonoPrincipal:   datosCliente.telefonoPrincipal,
      telefonoAlternativo: datosCliente.telefonoAlternativo || null,
      ciudad:              datosCliente.ciudad,
      barrio:              datosCliente.barrio,
      direccion:           datosCliente.direccion,
      zonaServicio:        datosCliente.zonaServicio as ZonaServicio,
      password:            passwordHash,
      foto:                datosCliente.foto || null,
    }
  })

  await prisma.usuario.create({
    data: {
      nombre:   cliente.nombre,
      email:    cliente.email,
      password: passwordHash,
      rolId:    rolCliente.id
    }
  })

  const cotizacionesVinculadas = await vincularCotizacionesPorEmail(cliente.email, cliente.id)
    .catch(err => { console.error('Error vinculando cotizaciones:', err); return 0 })

  const base        = (process.env.FRONTEND_URL ?? '').replace(/\/$/, '')
  const mail        = emailBienvenida({
    nombre:                 cliente.nombre,
    loginUrl:               `${base}/login`,
    reservasUrl:            `${base}/reservas`,
    cotizacionesVinculadas,
  })

  await transporter.sendMail({ from: process.env.MAIL_FROM, to: cliente.email, ...mail })

  return {
    message: 'Registro exitoso. Inicia sesión para continuar',
    cliente: { id: cliente.id, nombre: cliente.nombre, email: cliente.email }
  }
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const login = async (email: string, password: string) => {
  const usuario = await prisma.usuario.findUnique({
    where:   { email },
    include: { rol: { include: { rolPermisos: { include: { permiso: true } } } } }
  })

  if (!usuario || !usuario.estado) throw new Error('Credenciales inválidas')

  const passwordValido = await bcrypt.compare(password, usuario.password)
  if (!passwordValido) throw new Error('Credenciales inválidas')

  let datosCliente = null
  if (usuario.rol.nombre === 'CLIENTE') {
    const cliente = await prisma.cliente.findUnique({ where: { email } })
    if (!cliente || !cliente.activo) throw new Error('Credenciales inválidas')
    datosCliente = cliente
  }

  const permisos = usuario.rol.rolPermisos.map(rp => rp.permiso.nombre)
  const token    = jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol.nombre, permisos },
    process.env.JWT_SECRET!,
    { expiresIn: '8h' }
  )

  return {
    token,
    usuario: {
      id:                  usuario.id,
      nombre:              usuario.nombre,
      apellido:            datosCliente?.apellido            || '',
      telefonoPrincipal:   datosCliente?.telefonoPrincipal   || '',
      telefonoAlternativo: datosCliente?.telefonoAlternativo || '',
      direccion:           datosCliente?.direccion           || '',
      email:               usuario.email,
      rol:                 usuario.rol.nombre,
      permisos
    }
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
    where: { email, otp, usado: false, expiresAt: { gt: new Date() } }
  })
  if (!registro) throw new Error('El código es inválido o ha expirado.')
  return { message: 'Código válido', email }
}

// ─── RESETEAR CONTRASEÑA ──────────────────────────────────────────────────────
export const resetearPassword = async (
  email: string, otp: string,
  nuevaPassword: string, confirmarPassword: string
) => {
  const parsed = ResetPasswordSchema.safeParse({ email, otp, nuevaPassword, confirmarPassword })
  if (!parsed.success) throw new Error(zodError(parsed.error))

  const registro = await prisma.passwordResetOtp.findFirst({
    where: { email, otp, usado: false, expiresAt: { gt: new Date() } }
  })
  if (!registro) throw new Error('El código es inválido o ha expirado.')

  const usuario = await prisma.usuario.findUnique({ where: { email } })
  if (!usuario) throw new Error('Usuario no encontrado')

  const mismaPassword = await bcrypt.compare(nuevaPassword, usuario.password)
  if (mismaPassword) throw new Error('La nueva contraseña no puede ser igual a la actual')

  const passwordHash = await bcrypt.hash(nuevaPassword, 10)

  await Promise.all([
    prisma.usuario.update({ where: { email }, data: { password: passwordHash } }),
    prisma.cliente.findUnique({ where: { email } }).then(c =>
      c ? prisma.cliente.update({ where: { email }, data: { password: passwordHash } }) : null
    ),
    prisma.passwordResetOtp.update({ where: { id: registro.id }, data: { usado: true } })
  ])

  return { message: 'Contraseña actualizada correctamente' }
}