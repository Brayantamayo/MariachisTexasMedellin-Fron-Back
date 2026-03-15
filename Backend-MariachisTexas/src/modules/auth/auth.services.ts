import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../../config/prisma'
import transporter from '../../config/mailer'
import { TipoDocumento, ZonaServicio } from '../../generated/prisma'
import validator from 'validator'
import { vincularCotizacionesPorEmail } from '../Cotizacion/cotizacion.services'

// ─── REGISTRO CLIENTE ─────────────────────────────────────────────────────────
export const registrarCliente = async (data: {
  foto?:                string
  nombre:               string
  apellido:             string
  tipoDocumento:        TipoDocumento
  numeroDocumento:      string
  fechaNacimiento:      string
  email:                string
  telefonoPrincipal:    string
  telefonoAlternativo?: string
  ciudad:               string
  barrio:               string
  direccion:            string
  zonaServicio:         ZonaServicio
  password:             string
  passwordConfirmation: string
}) => {

  if (data.password !== data.passwordConfirmation)
    throw new Error('Las contraseñas no coinciden')

  if (!validator.isEmail(data.email))
    throw new Error('El correo electrónico no es válido')

  const dominiosValidos = ['gmail.com','hotmail.com','outlook.com','yahoo.com','icloud.com','live.com','protonmail.com']
  const dominio = data.email.split('@')[1]
  if (!dominiosValidos.includes(dominio))
    throw new Error('El dominio del correo no es válido')

  const correoExiste = await prisma.cliente.findUnique({ where: { email: data.email } })
  if (correoExiste) throw new Error('El correo ya está registrado')

  const cedulaExiste = await prisma.cliente.findUnique({ where: { numeroDocumento: data.numeroDocumento } })
  if (cedulaExiste) throw new Error('El número de documento ya está registrado')

  if (!/^\d{6,10}$/.test(data.numeroDocumento))
    throw new Error('El número de documento no es válido, debe tener entre 6 y 10 dígitos')

  if (!/^3\d{9}$/.test(data.telefonoPrincipal))
    throw new Error('El teléfono principal no es válido, debe iniciar con 3 y tener 10 dígitos')

  const passwordSegura = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\-_])[A-Za-z\d@$!%*?&\-_]{6,}$/
  if (!passwordSegura.test(data.password))
    throw new Error('La contraseña debe tener mínimo 6 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&-_)')

  const passwordHash = await bcrypt.hash(data.password, 10)

  const rolCliente = await prisma.rol.findUnique({ where: { nombre: 'CLIENTE' } })
  if (!rolCliente) throw new Error('Rol CLIENTE no encontrado, ejecuta el seed')

  const { passwordConfirmation, ...datosCliente } = data
  const cliente = await prisma.cliente.create({
    data: {
      ...datosCliente,
      password:        passwordHash,
      fechaNacimiento: new Date(data.fechaNacimiento)
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

  // ── Vincular cotizaciones/reservas que el cliente haya hecho antes de registrarse
  const cotizacionesVinculadas = await vincularCotizacionesPorEmail(cliente.email, cliente.id)
    .catch(err => { console.error('Error vinculando cotizaciones:', err); return 0 })

  const loginUrl   = `${process.env.FRONTEND_URL}login`
  const reservasUrl = `${process.env.FRONTEND_URL}reservas`

  // ── Correo de bienvenida — con o sin reservas vinculadas
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
        <p style="color:#aaa;line-height:1.6;">
          Tu registro fue exitoso. Ya puedes iniciar sesión y disfrutar de todos los beneficios de tener una cuenta.
        </p>

        ${cotizacionesVinculadas > 0 ? `
        <div style="background:#1a1a1a;border:1px solid #c0392b;border-radius:10px;padding:16px;margin:20px 0;">
          <p style="color:#fff;font-weight:bold;margin:0 0 8px;">🎉 ¡Buenas noticias!</p>
          <p style="color:#aaa;margin:0;font-size:14px;">
            Encontramos <strong style="color:#fff">${cotizacionesVinculadas} reserva(s)</strong> asociadas a tu correo.
            Ya están disponibles en tu cuenta.
          </p>
        </div>
        <div style="text-align:center;margin:20px 0;">
          <a href="${reservasUrl}" style="background:#c0392b;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">
            Ver mis Reservas
          </a>
        </div>
        ` : `
        <div style="text-align:center;margin:24px 0;">
          <a href="${loginUrl}" style="background:#c0392b;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">
            Iniciar Sesión
          </a>
        </div>
        `}

        <hr style="border:none;border-top:1px solid #222;margin:24px 0;" />
        <p style="color:#555;font-size:12px;text-align:center;">
          ¡Gracias por confiar en Mariachis Texas! • Medellín, Colombia
        </p>
      </div>
    `
  })

  return {
    message: 'Registro exitoso. Inicia sesión para continuar',
    cliente: {
      id:     cliente.id,
      nombre: cliente.nombre,
      email:  cliente.email
    }
  }
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const login = async (email: string, password: string) => {
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: {
      rol: {
        include: { rolPermisos: { include: { permiso: true } } }
      }
    }
  })

  if (!usuario || !usuario.estado) throw new Error('Credenciales inválidas')

  const passwordValido = await bcrypt.compare(password, usuario.password)
  if (!passwordValido) throw new Error('Credenciales inválidas')

  if (usuario.rol.nombre === 'CLIENTE') {
    const cliente = await prisma.cliente.findUnique({ where: { email } })
    if (!cliente || !cliente.activo) throw new Error('Credenciales inválidas')
  }

  const permisos = usuario.rol.rolPermisos.map(rp => rp.permiso.nombre)

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol.nombre, permisos },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  )

  return {
    token,
    usuario: {
      id:       usuario.id,
      nombre:   usuario.nombre,
      email:    usuario.email,
      rol:      usuario.rol.nombre,
      permisos
    }
  }
}

// ─── RECUPERAR CONTRASEÑA CON OTP ─────────────────────────────────────────────
export const recuperarPassword = async (email: string) => {
  const usuario = await prisma.usuario.findUnique({ where: { email } })
  if (!usuario) return { message: 'Si el correo está registrado, recibirás un código en tu bandeja.' }

  const otp       = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  await prisma.passwordResetOtp.updateMany({
    where: { email, usado: false },
    data:  { usado: true }
  })

  await prisma.passwordResetOtp.create({ data: { email, otp, expiresAt } })

  await transporter.sendMail({
    from:    process.env.MAIL_FROM,
    to:      usuario.email,
    subject: 'Código de recuperación - Mariachis Texas 🎺',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0a0a0a;color:#fff;border-radius:12px;">
        <h2 style="color:#c0392b;">Recuperar contraseña</h2>
        <p style="color:#aaa;">Hola <strong style="color:#fff">${usuario.nombre}</strong>, recibimos una solicitud para restablecer tu contraseña.</p>
        <p style="color:#aaa;">Tu código de verificación es:</p>
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
  email: string, otp: string, nuevaPassword: string, confirmarPassword: string
) => {
  if (nuevaPassword !== confirmarPassword)
    throw new Error('Las contraseñas no coinciden')

  const passwordSegura = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\-_])[A-Za-z\d@$!%*?&\-_]{6,}$/
  if (!passwordSegura.test(nuevaPassword))
    throw new Error('La contraseña debe tener mínimo 6 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&-_)')

  const registro = await prisma.passwordResetOtp.findFirst({
    where: { email, otp, usado: false, expiresAt: { gt: new Date() } }
  })
  if (!registro) throw new Error('El código es inválido o ha expirado.')

  const usuario = await prisma.usuario.findUnique({ where: { email } })
  if (!usuario) throw new Error('Usuario no encontrado')

  const mismaPassword = await bcrypt.compare(nuevaPassword, usuario.password)
  if (mismaPassword) throw new Error('La nueva contraseña no puede ser igual a la actual')

  const passwordHash = await bcrypt.hash(nuevaPassword, 10)

  await prisma.usuario.update({ where: { email }, data: { password: passwordHash } })

  const cliente = await prisma.cliente.findUnique({ where: { email } })
  if (cliente) await prisma.cliente.update({ where: { email }, data: { password: passwordHash } })

  await prisma.passwordResetOtp.update({ where: { id: registro.id }, data: { usado: true } })

  return { message: 'Contraseña actualizada correctamente' }
}