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

  return usuarios.map(mapToUsuario)
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

// ─── CREAR USUARIO ───────────────────────────────────────────────────────────
export const createUsuario = async (data: UsuarioCreateInput): Promise<UsuarioResponse> => {
  const parsed = UsuarioCreateSchema.safeParse(data)
  if (!parsed.success) {
    // Obtener el primer error específico del campo
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

  // Verificar si el rol existe
  const rol = await prisma.rol.findUnique({
    where: { id: d.rolId }
  })
  if (!rol) throw new AppError('Rol no encontrado', 404)

  // Hash de la contraseña
  const hashedPassword = await bcrypt.hash(password, 10)

  // Crear usuario en transacción con posibles relaciones
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

    // Si es empleado y hay datos, crear empleado
    if (d.rolId === 2 && empleadoData) {
      await tx.empleado.create({
        data: {
          usuarioId: usuario.id,
          ...empleadoData
        }
      })
    }

    // Si es cliente y hay datos, crear cliente
    if (d.rolId === 3 && clienteData) {
      await tx.cliente.create({
        data: {
          email: d.email,
          ...clienteData
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

// ─── ACTUALIZAR USUARIO ──────────────────────────────────────────────────────
export const updateUsuario = async (id: number, data: UsuarioUpdateInput): Promise<UsuarioResponse> => {
  const parsed = UsuarioUpdateSchema.safeParse(data)
  if (!parsed.success) throw new AppError(zodError(parsed.error), 400)

  const { clienteData, empleadoData, ...d } = parsed.data

  // Verificar si el usuario existe
  const existing = await prisma.usuario.findUnique({
    where: { id },
    include: { rol: true, cliente: true, empleado: true }
  })
  if (!existing) throw new AppError('Usuario no encontrado', 404)

  // Si se actualiza email, verificar que no exista
  if (d.email && d.email !== existing.email) {
    const emailExists = await prisma.usuario.findUnique({
      where: { email: d.email }
    })
    if (emailExists) throw new AppError('El email ya está registrado', 409)
  }

  // Si se actualiza rolId, verificar que exista
  if (d.rolId) {
    const rol = await prisma.rol.findUnique({
      where: { id: d.rolId }
    })
    if (!rol) throw new AppError('Rol no encontrado', 404)
  }

  // Actualizar en transacción
  await prisma.$transaction(async (tx) => {
    // Actualizar usuario
    await tx.usuario.update({
      where: { id },
      data: d
    })

    // Actualizar empleado si existe y hay datos
    if (existing.empleado && empleadoData) {
      await tx.empleado.update({
        where: { usuarioId: id },
        data: empleadoData
      })
    }

    // Actualizar cliente si existe y hay datos
    if (existing.cliente && clienteData) {
      await tx.cliente.update({
        where: { email: existing.email },
        data: clienteData
      })
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
    where: { id }
  })
  if (!existing) throw new AppError('Usuario no encontrado', 404)

  await prisma.usuario.delete({
    where: { id }
  })
}