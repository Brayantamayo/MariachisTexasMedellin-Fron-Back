import prisma from '../../config/prisma'
import { UsuarioCreateSchema, UsuarioUpdateSchema, zodError } from '../schemas'
import type { UsuarioCreateInput, UsuarioUpdateInput, UsuarioResponse } from '../../types/interfaces'
import bcrypt from 'bcryptjs'
import { AppError } from '../../utils/AppError'

// ─── MAPEAR A USUARIO RESPONSE ───────────────────────────────────────────────
const mapToUsuario = (u: any): UsuarioResponse => ({
  id: u.id,
  nombre: u.nombre,
  email: u.email,
  estado: u.estado,
  rolId: u.rolId,
  rol: {
  id: u.rol.id,
  nombre: u.rol.nombre,
  descripcion: u.rol.descripcion
  },
  cliente: u.cliente || undefined,
  empleado: u.empleado || undefined,
  createdAt: u.createdAt.toISOString(),
  updatedAt: u.updatedAt.toISOString()
})

// ─── OBTENER TODOS LOS USUARIOS ──────────────────────────────────────────────
export const getUsuarios = async (): Promise<UsuarioResponse[]> => {
  const usuarios = await prisma.usuario.findMany({
    include: {
      rol: true,
      cliente: true,
      empleado: true
    },
    orderBy: { createdAt: 'desc' }
  })

  // Contar reservas activas por cliente en una sola consulta
  const clienteIds = usuarios
    .map(u => u.cliente?.id)
    .filter((id): id is number => id !== undefined)

  const reservasActivas = await prisma.reserva.findMany({
    where: {
      cotizacion: { clienteId: { in: clienteIds } },
      estado: { in: ['PENDIENTE', 'CONFIRMADA'] }
    },
    select: { cotizacion: { select: { clienteId: true } } }
  })

  const clientesConReservas = new Set(
    reservasActivas.map(r => r.cotizacion.clienteId).filter(Boolean)
  )

  return usuarios.map(u => ({
    ...mapToUsuario(u),
    hasActiveReservations: u.cliente
      ? clientesConReservas.has(u.cliente.id)
      : false
  }))
}

// ─── OBTENER USUARIO POR ID ──────────────────────────────────────────────────
export const getUsuarioById = async (id: number): Promise<UsuarioResponse> => {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    include: {
      rol: true,
      cliente: true,
      empleado: true
    }
  })

  if (!usuario) throw new AppError('Usuario no encontrado', 404)

  return mapToUsuario(usuario)
}

// ─── REGISTRAR USUARIO (PÚBLICO) ───────────────────────────────────────────
export const registerUsuario = async (data: Omit<UsuarioCreateInput, 'rolId'> & { clienteData: any }): Promise<UsuarioResponse> => {
  // Buscar el ID del rol CLIENTE dinámicamente
  const rolCliente = await prisma.rol.findUnique({ where: { nombre: 'CLIENTE' } })
  if (!rolCliente) throw new AppError('Rol CLIENTE no encontrado en la base de datos', 500)

  const dataWithRol = { ...data, rolId: rolCliente.id }

  const parsed = UsuarioCreateSchema.safeParse(dataWithRol)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    const firstError = Object.entries(fieldErrors)[0]
    if (firstError) {
      const [field, errors] = firstError
      throw new AppError(`${field}: ${errors[0]}`, 400)
    }
    throw new AppError('Datos inválidos. Verifique los campos requeridos.', 400)
  }

  const { password, clienteData, empleadoData, ...d } = parsed.data

  // Verificar si el email ya existe
  const existing = await prisma.usuario.findUnique({
    where: { email: d.email }
  })
  if (existing) throw new AppError('El email ya está registrado', 409)

  // Hash de la contraseña
  const hashedPassword = await bcrypt.hash(password, 10)

  // Crear usuario en transacción
  const result = await prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.create({
      data: {
        nombre: d.nombre,
        email: d.email,
        password: hashedPassword,
        rolId: d.rolId
      },
      include: {
        rol: true
      }
    })

    // Crear cliente (siempre para registro público)
    if (clienteData) {
      const { fechaNacimiento, activo, ...restCliente } = clienteData
      if (!fechaNacimiento) throw new AppError('La fecha de nacimiento es requerida', 400)
      await tx.cliente.create({
        data: {
          usuarioId: usuario.id,
          email: d.email,
          fechaNacimiento: new Date(fechaNacimiento),
          activo: activo ?? true,
          ...restCliente
        }
      })
    }

    return usuario
  })

  // Obtener el usuario completo con relaciones
  const usuarioCompleto = await prisma.usuario.findUnique({
    where: { id: result.id },
    include: {
      rol: true,
      cliente: true,
      empleado: true
    }
  })

  return mapToUsuario(usuarioCompleto!)
}

// ─── CREAR USUARIO ───────────────────────────────────────────────────────────
export const createUsuario = async (data: UsuarioCreateInput): Promise<UsuarioResponse> => {
  const parsed = UsuarioCreateSchema.safeParse(data)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    const firstError = Object.entries(fieldErrors)[0]
    if (firstError) {
      const [field, errors] = firstError
      throw new AppError(`${field}: ${errors[0]}`, 400)
    }
    throw new AppError('Datos inválidos. Verifique los campos requeridos.', 400)
  }

  const { password, clienteData, empleadoData, apellido, ...d } = parsed.data

  // El frontend ya envía nombre completo (nombre + apellido) en el campo nombre,
  // así que no concatenamos apellido para evitar duplicarlo
  const nombreCompleto = d.nombre.replace(/\s+/g, ' ').trim()

  // Verificar si el email ya existe
  const existing = await prisma.usuario.findUnique({ where: { email: d.email } })
  if (existing) throw new AppError('El email ya está registrado', 409)

  // Verificar si el rol existe
  const rol = await prisma.rol.findUnique({ where: { id: d.rolId } })
  if (!rol) throw new AppError('Rol no encontrado', 404)

  // Hash de la contraseña
  const hashedPassword = await bcrypt.hash(password, 10)

  // Crear usuario en transacción con posibles relaciones
  const result = await prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.create({
      data: {
        nombre: nombreCompleto,
        email: d.email,
        password: hashedPassword,
        rolId: d.rolId
      },
      include: { rol: true }
    })

    // Si es empleado y hay datos, crear empleado
    if (rol.nombre === 'EMPLEADO' && empleadoData) {
      const { fechaNacimiento, ...restEmpleado } = empleadoData
      if (!fechaNacimiento) throw new AppError('La fecha de nacimiento del empleado es requerida', 400)
      await tx.empleado.create({
        data: {
          usuarioId: usuario.id,
          fechaNacimiento: new Date(fechaNacimiento),
          ...restEmpleado
        }
      })
    }

    // Para cualquier rol que NO sea EMPLEADO, guardar datos en cliente
    if (rol.nombre !== 'EMPLEADO' && clienteData) {
      const { fechaNacimiento, activo, ...restCliente } = clienteData
      if (!fechaNacimiento) throw new AppError('La fecha de nacimiento es requerida', 400)
      await tx.cliente.create({
        data: {
          usuarioId: usuario.id,
          email:     d.email,
          fechaNacimiento: new Date(fechaNacimiento),
          activo: activo ?? true,
          ...restCliente
        }
      })
    }

    return usuario
  })

  const usuarioCompleto = await prisma.usuario.findUnique({
    where: { id: result.id },
    include: { rol: true, cliente: true, empleado: true }
  })

  return mapToUsuario(usuarioCompleto!)
}

// ─── ACTUALIZAR USUARIO ──────────────────────────────────────────────────────
export const updateUsuario = async (id: number, data: UsuarioUpdateInput): Promise<UsuarioResponse> => {
  const parsed = UsuarioUpdateSchema.safeParse(data)
  if (!parsed.success) throw new AppError(zodError(parsed.error), 400)

  const { clienteData, empleadoData, apellido, passwordConfirmation, ...d } = parsed.data

  // Construir objeto de actualización limpio (sin undefined)
  const updateData: any = {}
  if (d.nombre !== undefined) updateData.nombre = d.nombre
  if (d.email  !== undefined) updateData.email  = d.email
  if (d.estado !== undefined) updateData.estado = d.estado
  if (d.rolId  !== undefined) updateData.rolId  = d.rolId
  if (d.password !== undefined) {
    updateData.password = await bcrypt.hash(d.password, 10)
  }

  // Verificar si el usuario existe
  const existing = await prisma.usuario.findUnique({
    where: { id },
    include: { rol: true, cliente: true, empleado: true }
  })
  if (!existing) throw new AppError('Usuario no encontrado', 404)

  // Si se actualiza email, verificar que no exista
  if (updateData.email && updateData.email !== existing.email) {
    const emailExists = await prisma.usuario.findUnique({ where: { email: updateData.email } })
    if (emailExists) throw new AppError('El email ya está registrado', 409)
  }

  // Si se actualiza rolId, verificar que exista
  if (updateData.rolId) {
    const rol = await prisma.rol.findUnique({ where: { id: updateData.rolId } })
    if (!rol) throw new AppError('Rol no encontrado', 404)
  }

  // Si se intenta desactivar el usuario, verificar que no tenga reservas activas
  if (updateData.estado === false) {
    const reservasCount = await prisma.reserva.count({
      where: {
        cotizacion: { cliente: { usuario: { id } } },
        estado: { in: ['PENDIENTE', 'CONFIRMADA'] }
      }
    })
    if (reservasCount > 0)
      throw new AppError('No se puede desactivar el usuario porque tiene reservas activas', 400)
  }

  // Actualizar en transacción
  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({ where: { id }, data: updateData })

    // Sincronizar estado entre usuario y cliente
    if (existing.cliente) {
      if (updateData.estado !== undefined) {
        await tx.cliente.update({ where: { usuarioId: id }, data: { activo: updateData.estado } })
      }
      if (clienteData?.activo !== undefined) {
        await tx.usuario.update({ where: { id }, data: { estado: clienteData.activo } })
      }
    }

    // Actualizar empleado si existe y hay datos
    if (existing.empleado && empleadoData) {
      await tx.empleado.update({ where: { usuarioId: id }, data: empleadoData })
    }

    // Actualizar cliente si existe y hay datos
    if (existing.cliente && clienteData) {
      const { activo, ...clienteDataSinActivo } = clienteData
      if (Object.keys(clienteDataSinActivo).length > 0) {
        await tx.cliente.update({ where: { usuarioId: id }, data: clienteDataSinActivo })
      }
    }

    // Si no tiene cliente ni empleado pero llegan clienteData, crear cliente (rol personalizado)
    if (!existing.cliente && !existing.empleado && clienteData) {
      const { fechaNacimiento, activo, ...restCliente } = clienteData
      if (fechaNacimiento) {
        await tx.cliente.create({
          data: {
            usuarioId: id,
            email: existing.email,
            fechaNacimiento: new Date(fechaNacimiento),
            activo: activo ?? true,
            ...restCliente
          }
        })
      }
    }
  })

  // Obtener usuario actualizado
  const usuarioActualizado = await prisma.usuario.findUnique({
    where: { id },
    include: {
      rol: true,
      cliente: true,
      empleado: true
    }
  })

  return mapToUsuario(usuarioActualizado!)
}

// ─── ELIMINAR USUARIO ────────────────────────────────────────────────────────
export const deleteUsuario = async (id: number): Promise<void> => {
  const existing = await prisma.usuario.findUnique({
    where: { id },
    include: { rol: true }
  })
  if (!existing) throw new AppError('Usuario no encontrado', 404)

  // Proteger al administrador del sistema
  if (existing.email === 'admin@mariachistexas.com') {
    throw new AppError('No se puede eliminar el usuario administrador del sistema', 403)
  }

  // Verificar si el usuario tiene reservas activas
  const reservasCount = await prisma.reserva.count({
    where: {
      cotizacion: {
        cliente: {
          usuario: {
            id: id
          }
        }
      },
      estado: { in: ['PENDIENTE', 'CONFIRMADA'] }
    }
  })

  if (reservasCount > 0) {
    throw new AppError('No se puede eliminar el usuario porque tiene reservas activas', 400)
  }

  await prisma.usuario.delete({
    where: { id }
  })
}