import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../../config/prisma'
import transporter from '../../config/mailer'
import { TipoDocumento, ZonaServicio } from '../../generated/prisma'
import validator from 'validator'


// ─── REGISTRO CLIENTE ────────────────────────────────────
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

  // 1. Validar contraseñas coinciden
  if (data.password !== data.passwordConfirmation) {
    throw new Error('Las contraseñas no coinciden')
  }

  // 2. Validar formato correo
  if (!validator.isEmail(data.email)) {
    throw new Error('El correo electrónico no es válido')
  }

  // 3. Validar dominio correo
  const dominiosValidos = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com', 'protonmail.com']
  const dominio = data.email.split('@')[1]
  if (!dominiosValidos.includes(dominio)) {
    throw new Error('El dominio del correo no es válido')
  }

  // 4. Validar correo no duplicado
  const correoExiste = await prisma.cliente.findUnique({ where: { email: data.email } })
  if (correoExiste) throw new Error('El correo ya está registrado')

  // 5. Validar cédula no duplicada
  const cedulaExiste = await prisma.cliente.findUnique({ where: { numeroDocumento: data.numeroDocumento } })
  if (cedulaExiste) throw new Error('El número de documento ya está registrado')

  // 6. Validar formato cédula colombiana
  if (!/^\d{6,10}$/.test(data.numeroDocumento)) {
    throw new Error('El número de documento no es válido, debe tener entre 6 y 10 dígitos')
  }

  // 7. Validar teléfono colombiano
  if (!/^3\d{9}$/.test(data.telefonoPrincipal)) {
    throw new Error('El teléfono principal no es válido, debe iniciar con 3 y tener 10 dígitos')
  }

  // 8. Validar contraseña segura
  const passwordSegura = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\-_])[A-Za-z\d@$!%*?&\-_]{6,}$/
  if (!passwordSegura.test(data.password)) {
    throw new Error('La contraseña debe tener mínimo 6 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&-_)')
  }

  // 9. Encriptar contraseña
  const passwordHash = await bcrypt.hash(data.password, 10)

  // 10. Buscar rol CLIENTE
  const rolCliente = await prisma.rol.findUnique({ where: { nombre: 'CLIENTE' } })
  if (!rolCliente) throw new Error('Rol CLIENTE no encontrado, ejecuta el seed')

  // 11. Guardar en cliente
  const { passwordConfirmation, ...datosCliente } = data
  const cliente = await prisma.cliente.create({
    data: {
      ...datosCliente,
      password: passwordHash,
      fechaNacimiento: new Date(data.fechaNacimiento)
    }
  })

  // 12. Guardar en usuario
  await prisma.usuario.create({
    data: {
      nombre:   cliente.nombre,
      email:    cliente.email,
      password: passwordHash,
      rolId:    rolCliente.id
    }
  })

  // 13. Enviar correo de bienvenida
  await transporter.sendMail({
    from:    process.env.MAIL_FROM,
    to:      cliente.email,
    subject: '¡Bienvenido a Mariachis Texas! 🎺',
    html: `
      <h2>Hola ${cliente.nombre} ${cliente.apellido} 👋</h2>
      <p>Tu registro fue exitoso. Ya puedes iniciar sesión.</p>
      <p><strong>Correo:</strong> ${cliente.email}</p>
      <br/>
      <p>¡Gracias por confiar en Mariachis Texas!</p>
    `
  })

  return {
    message: 'Registro exitoso, Inicia sesión para continuar',
    cliente: {
      id:     cliente.id,
      nombre: cliente.nombre,
      email:  cliente.email
    }
  }
}

// ─── LOGIN ───────────────────────────────────────────────
export const login = async (email: string, password: string) => {

  // 1. Buscar en usuario con rol y permisos
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: {
      rol: {
        include: {
          rolPermisos: {
            include: { permiso: true }
          }
        }
      }
    }
  })

  if (!usuario || !usuario.estado) throw new Error('Credenciales inválidas')

  // 2. Verificar contraseña
  const passwordValido = await bcrypt.compare(password, usuario.password)
  if (!passwordValido) throw new Error('Credenciales inválidas')

  // 3. Si es CLIENTE verificar que exista en tabla cliente
  if (usuario.rol.nombre === 'CLIENTE') {
    const cliente = await prisma.cliente.findUnique({ where: { email } })
    if (!cliente || !cliente.activo) throw new Error('Credenciales inválidas')
  }

  // 4. Extraer permisos del rol
  const permisos = usuario.rol.rolPermisos.map(rp => rp.permiso.nombre)

  // 5. Generar token
  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol.nombre, permisos },
    process.env.JWT_SECRET!,
    { expiresIn: '8h' }
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

// ─── RECUPERAR CONTRASEÑA ────────────────────────────────
// ─── RECUPERAR CONTRASEÑA CON OTP ───────────────────────
export const recuperarPassword = async (email: string) => {

  const usuario = await prisma.usuario.findUnique({ where: { email } })

  // Seguridad: no revelar si el correo existe o no
  if (!usuario) {
    return { message: 'Si el correo está registrado, recibirás un código en tu bandeja.' }
  }

  // 1. Generar OTP de 6 dígitos
  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  // 2. Expiración: 15 minutos
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  // 3. Invalidar OTPs anteriores del mismo email
  await prisma.passwordResetOtp.updateMany({
    where: { email, usado: false },
    data:  { usado: true }
  })

  // 4. Guardar nuevo OTP
  await prisma.passwordResetOtp.create({
    data: { email, otp, expiresAt }
  })

  // 5. Enviar correo con el código
  await transporter.sendMail({
    from:    process.env.MAIL_FROM,
    to:      usuario.email,
    subject: 'Código de recuperación - Mariachis Texas 🎺',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0a0a0a;color:#fff;border-radius:12px;">
        <h2 style="color:#c0392b;margin-bottom:8px;">Recuperar contraseña</h2>
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

// ─── VERIFICAR OTP ───────────────────────────────────────
export const verificarOtp = async (email: string, otp: string) => {

  const registro = await prisma.passwordResetOtp.findFirst({
    where: {
      email,
      otp,
      usado: false,
      expiresAt: { gt: new Date() }
    }
  })

  if (!registro) throw new Error('El código es inválido o ha expirado.')

  return { message: 'Código válido', email }
}

// ─── RESETEAR CONTRASEÑA CON OTP ─────────────────────────
export const resetearPassword = async (email: string, otp: string, nuevaPassword: string, confirmarPassword: string) => {

  // 1. Validar que las contraseñas coinciden
  if (nuevaPassword !== confirmarPassword) {
    throw new Error('Las contraseñas no coinciden')
  }

  // 2. Validar contraseña segura
  const passwordSegura = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\-_])[A-Za-z\d@$!%*?&\-_]{6,}$/
  if (!passwordSegura.test(nuevaPassword)) {
    throw new Error('La contraseña debe tener mínimo 6 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&-_)')
  }

  // 3. Verificar OTP válido y no usado
  const registro = await prisma.passwordResetOtp.findFirst({
    where: {
      email,
      otp,
      usado: false,
      expiresAt: { gt: new Date() }
    }
  })

  if (!registro) throw new Error('El código es inválido o ha expirado.')

  // 4. Buscar usuario
  const usuario = await prisma.usuario.findUnique({ where: { email } })
  if (!usuario) throw new Error('Usuario no encontrado')

  // 5. Verificar que la nueva contraseña no sea igual a la actual
  const mismaPassword = await bcrypt.compare(nuevaPassword, usuario.password)
  if (mismaPassword) throw new Error('La nueva contraseña no puede ser igual a la actual')

  // 6. Encriptar y actualizar
  const passwordHash = await bcrypt.hash(nuevaPassword, 10)

  await prisma.usuario.update({
    where: { email },
    data:  { password: passwordHash }
  })

  // 7. Si es cliente actualizar también en cliente
  const cliente = await prisma.cliente.findUnique({ where: { email } })
  if (cliente) {
    await prisma.cliente.update({
      where: { email },
      data:  { password: passwordHash }
    })
  }

  // 8. Marcar OTP como usado
  await prisma.passwordResetOtp.update({
    where: { id: registro.id },
    data:  { usado: true }
  })

  return { message: 'Contraseña actualizada correctamente' }
}