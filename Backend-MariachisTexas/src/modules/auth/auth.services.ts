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
/**
 * Registra un nuevo cliente en el sistema
 * 
 * PASOS:
 * Validar datos con Zod Schema
 * Verificar que email y documento sean únicos
 * Hashear contraseña
 * obtener rol CLIENTE
 * CREAR USUARIO (tabla principal) ← Usuario es la base
 * CREAR CLIENTE (tabla dependiente) ← Vinculado con usuarioId
 *incular cotizaciones por email
 * Enviar email de bienvenida
 */
export const registrarCliente = async (data: unknown) => {
  //  Validar datos con Zod
  const parsed = RegistroSchema.safeParse(data)
  if (!parsed.success) throw new AppError(zodError(parsed.error), 400)

  const { passwordConfirmation, ...datosCliente } = parsed.data

  // Verificar unicidad: email (Usuario) y documento (Cliente)
  const [correoExiste, cedulaExiste] = await Promise.all([
    prisma.usuario.findUnique({ where: { email: datosCliente.email } }),
    prisma.cliente.findUnique({ where: { numeroDocumento: datosCliente.numeroDocumento } }),
  ])
  if (correoExiste) throw new AppError('El correo ya está registrado', 409)
  if (cedulaExiste) throw new AppError('El número de documento ya está registrado', 409)

  // Hash de la contraseña
  const passwordHash = await bcrypt.hash(datosCliente.password, 10)

  // Obtener rol CLIENTE
  const rolCliente = await prisma.rol.findUnique({ where: { nombre: 'CLIENTE' } })
  if (!rolCliente) throw new AppError('Rol CLIENTE no encontrado, ejecuta el seed', 500)

  // CREAR USUARIO (tabla principal)
  const usuario = await prisma.usuario.create({
    data: {
      nombre:   datosCliente.nombre,
      email:    datosCliente.email,
      password: passwordHash,
      rolId:    rolCliente.id,
    },
  })

  // CREAR CLIENTE (tabla dependiente) - Vinculado por usuarioId
  const cliente = await prisma.cliente.create({
    data: {
      usuarioId:           usuario.id,                      // ← Clave: vinculación con Usuario
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

  // Vincular cotizaciones previas por email
  const cotizacionesVinculadas = await vincularCotizacionesPorEmail(cliente.email, cliente.id)
    .catch(err => {
      console.error('⚠️  Error vinculando cotizaciones:', err)
      return 0
    })

  //  Enviar email de bienvenida
  const base = (process.env.FRONTEND_URL ?? '').replace(/\/$/, '')
  const mail = emailBienvenida({
    nombre:                 usuario.nombre,
    loginUrl:               `${base}/login`,
    reservasUrl:            `${base}/reservas`,
    cotizacionesVinculadas,
  })

  await transporter.sendMail({ from: process.env.MAIL_FROM, to: usuario.email, ...mail })

  // Retornar datos del usuario creado
  return {
    message: 'Registro exitoso. Inicia sesión para continuar',
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
  }
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
/**
 * Autentica un usuario y retorna JWT + datos
 * 
 * PASOS:
 * Buscar USUARIO por email (incluir rol y cliente)
 * Validar que usuario exista y esté activo
 * Validar que password sea correcto
 * Si es CLIENTE: verificar que cliente.activo = true
 * Generar JWT con id, email, rol, permisos
 * Retornar token + datos del usuario
 */
export const login = async (email: string, password: string) => {
  // 1️⃣ Buscar USUARIO (tabla principal) include relaciones
  const usuario = await prisma.usuario.findUnique({
    where:   { email },
    include: {
      rol:     { include: { rolPermisos: { include: { permiso: true } } } },
      cliente: true,
    },
  })

  // Validar que usuario existe y está activo
  if (!usuario || !usuario.estado) throw new AppError('Credenciales inválidas', 401)

  // Validar contraseña
  const passwordValido = await bcrypt.compare(password, usuario.password)
  if (!passwordValido) throw new AppError('Credenciales inválidas', 401)

  //Si es CLIENTE: verificar que cliente existe y está activo
  if (usuario.rol.nombre === 'CLIENTE') {
    if (!usuario.cliente || !usuario.cliente.activo)
      throw new AppError('Se requiere verificación del cliente. Contacta al soporte.', 401)
  }

  //  Generar JWT
  const permisos = usuario.rol.rolPermisos.map(rp => rp.permiso.nombre)
  const token    = jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol.nombre, permisos },
    JWT_SECRET,
    { expiresIn: '8h' }
  )

  //Retornar token + datos del usuario
  return {
    token,
    usuario: {
      id:                  usuario.id,
      nombre:              usuario.nombre,
      email:               usuario.email,
      rol:                 usuario.rol.nombre,
      permisos,
      // Datos de Cliente (si existe)
      apellido:            usuario.cliente?.apellido            ?? '',
      telefonoPrincipal:   usuario.cliente?.telefonoPrincipal   ?? '',
      telefonoAlternativo: usuario.cliente?.telefonoAlternativo ?? '',
      ciudad:              usuario.cliente?.ciudad              ?? '',
      barrio:              usuario.cliente?.barrio              ?? '',
      direccion:           usuario.cliente?.direccion           ?? '',
    },
  }
}

// ─── RECUPERAR CONTRASEÑA ─────────────────────────────────────────────────────
/**
 * Genera OTP para recuperación de contraseña
 * Retorna mensaje genérico por seguridad (no confirma si email existe)
 */
export const recuperarPassword = async (email: string) => {
  const usuario = await prisma.usuario.findUnique({ where: { email } })
  if (!usuario) {
    // Retornar mensaje genérico por seguridad
    return { message: 'Si el correo está registrado, recibirás un código en tu bandeja.' }
  }

  // Generar OTP de 6 dígitos
  const otp       = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // Expira en 15 minutos

  // Marcar OTPs previos como utilizados
  await prisma.passwordResetOtp.updateMany({
    where:  { email, usado: false },
    data:   { usado: true }
  })

  // Crear nuevo OTP
  await prisma.passwordResetOtp.create({
    data: { email, otp, expiresAt }
  })

  // Enviar email
  const mail = emailOtp({ nombre: usuario.nombre, otp })
  await transporter.sendMail({ from: process.env.MAIL_FROM, to: usuario.email, ...mail })

  return { message: 'Si el correo está registrado, recibirás un código en tu bandeja.' }
}

// ─── VERIFICAR OTP ────────────────────────────────────────────────────────────
/**
 * Verifica que el OTP sea válido y no haya expirado
 */
export const verificarOtp = async (email: string, otp: string) => {
  const registro = await prisma.passwordResetOtp.findFirst({
    where: {
      email,
      otp,
      usado: false,
      expiresAt: { gt: new Date() }, // No expirado
    },
  })

  if (!registro) throw new AppError('El código es inválido o ha expirado.', 400)

  return { message: 'Código válido', email }
}

// ─── RESETEAR CONTRASEÑA ──────────────────────────────────────────────────────
/**
 * Cambia la contraseña del usuario después de verificar OTP
 * 
 * PASOS:
 * Validar datos con ResetPasswordSchema
 * Verificar que OTP sea válido y no haya expirado
 * Buscar usuario por email
 * Validar que nueva contraseña sea diferente de la actual
 * Hashear nueva contraseña
 * Actualizar contraseña en USUARIO y marcar OTP como usado
 */
export const resetearPassword = async (
  email:             string,
  otp:               string,
  nuevaPassword:     string,
  confirmarPassword: string
) => {
  // Validar datos con Zod
  const parsed = ResetPasswordSchema.safeParse({ email, otp, nuevaPassword, confirmarPassword })
  if (!parsed.success) throw new AppError(zodError(parsed.error), 400)

  // Verificar que OTP sea válido y no haya expirado
  const registro = await prisma.passwordResetOtp.findFirst({
    where: {
      email,
      otp,
      usado: false,
      expiresAt: { gt: new Date() },
    },
  })
  if (!registro) throw new AppError('El código es inválido o ha expirado.', 400)

  // Buscar USUARIO
  const usuario = await prisma.usuario.findUnique({ where: { email } })
  if (!usuario) throw new AppError('Usuario no encontrado', 404)

  // Validar que nueva contraseña sea diferente de la actual
  const mismaPassword = await bcrypt.compare(nuevaPassword, usuario.password)
  if (mismaPassword) throw new AppError('La nueva contraseña no puede ser igual a la actual', 400)

  // Hashear nueva contraseña
  const passwordHash = await bcrypt.hash(nuevaPassword, 10)

  // Actualizar contraseña y marcar OTP como usado
  await Promise.all([
    prisma.usuario.update({
      where: { email },
      data:  { password: passwordHash },
    }),
    prisma.passwordResetOtp.update({
      where: { id: registro.id },
      data:  { usado: true },
    }),
  ])

  return { message: 'Contraseña actualizada correctamente' }
}

// ─── REGISTRO COTIZACIÓN ──────────────────────────────────────────────────────
/**
 * Obtiene datos de un token de registro de cotización
 * Valida que el token sea válido y no haya expirado
 */
export const getRegistroToken = async (token: string) => {
  const registro = await prisma.registroToken.findUnique({ where: { token } })

  if (!registro)                    throw new AppError('Token inválido', 400)
  if (registro.usado)               throw new AppError('Este enlace ya fue utilizado', 410)
  if (registro.expiresAt < new Date()) throw new AppError('Este enlace ha expirado', 410)

  return {
    email:     registro.email,
    nombre:    registro.nombre,
    telefono:  registro.telefono,
    telefono2: registro.telefono2 ?? '',
  }
}

/**
 * Marca un token de registro como utilizado después del registro exitoso
 */
export const marcarTokenUsado = async (token: string) => {
  const registro = await prisma.registroToken.findUnique({ where: { token } })
  if (!registro) throw new AppError('Token no encontrado', 404)
  
  await prisma.registroToken.update({
    where: { token },
    data:  { usado: true },
  })

  return { message: 'Token marcado como utilizado' }
}
