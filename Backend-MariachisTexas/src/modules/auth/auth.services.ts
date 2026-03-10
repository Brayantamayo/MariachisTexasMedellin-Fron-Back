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
export const recuperarPassword = async (email: string) => {

  const usuario = await prisma.usuario.findUnique({ where: { email } })
  if (!usuario) throw new Error('El correo no está registrado')

  const token = jwt.sign(
    { email: usuario.email },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  )

  const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

  await transporter.sendMail({
    from:    process.env.MAIL_FROM,
    to:      usuario.email,
    subject: 'Recuperar contraseña - Mariachis Texas 🎺',
    html: `
      <h2>Recuperar contraseña</h2>
      <p>Hola ${usuario.nombre}, recibimos una solicitud para restablecer tu contraseña.</p>
      <a href="${link}" style="background:#c0392b;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0;">
        Restablecer contraseña
      </a>
      <p>Este link expira en <strong>15 minutos</strong>.</p>
      <p>Si no solicitaste esto, ignora este correo.</p>
    `
  })

  return { message: 'Correo de recuperación enviado, revisa tu bandeja' }
}

// ─── RESETEAR CONTRASEÑA ─────────────────────────────────
export const resetearPassword = async (token: string, nuevaPassword: string, confirmarPassword: string) => {

  // 1. Validar que las contraseñas coinciden
  if (nuevaPassword !== confirmarPassword) {
    throw new Error('Las contraseñas no coinciden')
  }

  // 2. Validar contraseña segura
  const passwordSegura = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\-_])[A-Za-z\d@$!%*?&\-_]{6,}$/
  if (!passwordSegura.test(nuevaPassword)) {
    throw new Error('La contraseña debe tener mínimo 6 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&-_)')
  }

  // 3. Verificar token
  let payload: any
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!)
  } catch (error) {
    throw new Error('El link ha expirado o no es válido')
  }

  // 4. Buscar usuario
  const usuario = await prisma.usuario.findUnique({ where: { email: payload.email } })
  if (!usuario) throw new Error('Usuario no encontrado')

  // 5. Verificar que la nueva contraseña no sea igual a la actual
  const mismaPassword = await bcrypt.compare(nuevaPassword, usuario.password)
  if (mismaPassword) throw new Error('La nueva contraseña no puede ser igual a la actual')

  // 6. Encriptar y actualizar
  const passwordHash = await bcrypt.hash(nuevaPassword, 10)

  await prisma.usuario.update({
    where: { email: payload.email },
    data:  { password: passwordHash }
  })

  // 7. Si es cliente actualizar también en cliente
  const cliente = await prisma.cliente.findUnique({ where: { email: payload.email } })
  if (cliente) {
    await prisma.cliente.update({
      where: { email: payload.email },
      data:  { password: passwordHash }
    })
  }

  return { message: 'Contraseña actualizada correctamente' }
}