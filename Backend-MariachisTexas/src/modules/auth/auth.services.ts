import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../../config/prisma'
import transporter from '../../config/mailer'
import { TipoDocumento, ZonaServicio } from '../../generated/prisma'
import { RegistroSchema, ResetPasswordSchema, zodError } from '../schemas'
import { vincularCotizacionesPorEmail } from '../Cotizacion/cotizacion.services'

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
      tipoDocumento:       datosCliente.tipoDocumento as TipoDocumento,  // ✅ cast correcto
      numeroDocumento:     datosCliente.numeroDocumento,
      fechaNacimiento:     new Date(datosCliente.fechaNacimiento),
      email:               datosCliente.email,
      telefonoPrincipal:   datosCliente.telefonoPrincipal,
      telefonoAlternativo: datosCliente.telefonoAlternativo || null,
      ciudad:              datosCliente.ciudad,
      barrio:              datosCliente.barrio,
      direccion:           datosCliente.direccion,
      zonaServicio:        datosCliente.zonaServicio as ZonaServicio,    // ✅ cast correcto
      password:            passwordHash,
      foto:                datosCliente.foto || null,
    }
  })

  await prisma.usuario.create({
    data: {
      nombre:  cliente.nombre,
      email:   cliente.email,
      password: passwordHash,
      rolId:   rolCliente.id
    }
  })

  const cotizacionesVinculadas = await vincularCotizacionesPorEmail(cliente.email, cliente.id)
    .catch(err => { console.error('Error vinculando cotizaciones:', err); return 0 })

  const base        = (process.env.FRONTEND_URL ?? '').replace(/\/$/, '')
  const loginUrl    = `${base}/login`
  const reservasUrl = `${base}/reservas`

  await transporter.sendMail({
    from:    process.env.MAIL_FROM,
    to:      cliente.email,
    subject: '¡Bienvenido a Mariachis Texas! 🎺',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:28px;background:#0a0a0a;color:#fff;border-radius:12px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#c0392b;font-size:28px;margin:0;">🎺 Mariachis Texas</h1>
        </div>
        <h2 style="color:#fff;margin-bottom:8px;">¡Hola ${cliente.nombre}! 👋</h2>
        <p style="color:#aaa;line-height:1.6;">Tu registro fue exitoso. Ya puedes iniciar sesión y disfrutar de todos los beneficios de tener una cuenta.</p>
        ${cotizacionesVinculadas > 0 ? `
        <div style="background:#1a1a1a;border:1px solid #c0392b;border-radius:10px;padding:16px;margin:20px 0;">
          <p style="color:#fff;font-weight:bold;margin:0 0 8px;">🎉 ¡Buenas noticias!</p>
          <p style="color:#aaa;margin:0;font-size:14px;">Encontramos <strong style="color:#fff">${cotizacionesVinculadas} reserva(s)</strong> asociadas a tu correo. Ya están disponibles en tu cuenta.</p>
        </div>
        <div style="text-align:center;margin:20px 0;">
          <a href="${reservasUrl}" style="background:#c0392b;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">Ver mis Reservas</a>
        </div>
        ` : `
        <div style="text-align:center;margin:24px 0;">
          <a href="${loginUrl}" style="background:#c0392b;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">Iniciar Sesión</a>
        </div>
        `}
        <hr style="border:none;border-top:1px solid #222;margin:24px 0;" />
        <p style="color:#555;font-size:12px;text-align:center;">¡Gracias por confiar en Mariachis Texas! • Medellín, Colombia</p>
      </div>
    `
  })

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

  // ✅ Buscar datos completos del cliente para pre-llenar formularios
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

  await transporter.sendMail({
    from:    process.env.MAIL_FROM,
    to:      usuario.email,
    subject: 'Código de recuperación - Mariachis Texas 🎺',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0a0a0a;color:#fff;border-radius:12px;">
        <h2 style="color:#c0392b;">Recuperar contraseña</h2>
        <p style="color:#aaa;">Hola <strong style="color:#fff">${usuario.nombre}</strong>, recibimos una solicitud para restablecer tu contraseña.</p>
        <div style="background:#1a1a1a;border:2px solid #c0392b;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
          <span style="font-size:42px;font-weight:900;letter-spacing:12px;color:#fff;">${otp}</span>
        </div>
        <p style="color:#aaa;font-size:13px;">Este código expira en <strong style="color:#fff">15 minutos</strong>.</p>
        <p style="color:#aaa;font-size:13px;">Si no solicitaste esto, ignora este correo.</p>
      </div>
    `
  })

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