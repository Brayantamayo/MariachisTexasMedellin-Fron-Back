import bcrypt from 'bcryptjs'
import prisma from '../../config/prisma'
import { AppError } from '../../utils/AppError'

export const getUsuarios = async () => {
  return await prisma.usuario.findMany({
    include: {
      rol: true,
      cliente: true,
    },
    orderBy: { createdAt: 'desc' }
  })
}

export const getUsuarioById = async (id: number) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    include: { rol: true, cliente: true }
  })
  if (!usuario) throw new AppError('Usuario no encontrado', 404)
  return usuario
}

interface CreateUsuarioInput {
  nombre: string
  email: string
  password: string
  rolId: number
  isActive?: boolean
}

export const createUsuario = async (data: CreateUsuarioInput) => {
  const existing = await prisma.usuario.findUnique({ where: { email: data.email } })
  if (existing) throw new AppError('Ya existe un usuario con ese correo', 409)

  const role = await prisma.rol.findUnique({ where: { id: data.rolId } })
  if (!role) throw new AppError('Rol no válido', 400)

  const hashedPassword = await bcrypt.hash(data.password, 10)

  return await prisma.usuario.create({
    data: {
      nombre: data.nombre,
      email: data.email,
      password: hashedPassword,
      rolId: data.rolId,
      estado: data.isActive ?? true,
    },
    include: { rol: true, cliente: true }
  })
}

interface UpdateUsuarioInput {
  nombre?: string
  email?: string
  password?: string
  rolId?: number
  isActive?: boolean
}

export const updateUsuario = async (id: number, data: UpdateUsuarioInput) => {
  const usuario = await prisma.usuario.findUnique({ where: { id } })
  if (!usuario) throw new AppError('Usuario no encontrado', 404)

  if (data.email && data.email !== usuario.email) {
    const sameEmail = await prisma.usuario.findUnique({ where: { email: data.email } })
    if (sameEmail) throw new AppError('El correo ya está en uso', 409)
  }

  const updateData: any = {}
  if (data.nombre !== undefined) updateData.nombre = data.nombre
  if (data.email !== undefined) updateData.email = data.email
  if (data.rolId !== undefined) {
    const role = await prisma.rol.findUnique({ where: { id: data.rolId } })
    if (!role) throw new AppError('Rol no válido', 400)
    updateData.rolId = data.rolId
  }
  if (data.password) updateData.password = await bcrypt.hash(data.password, 10)
  if (data.isActive !== undefined) updateData.estado = data.isActive

  return await prisma.usuario.update({
    where: { id },
    data: updateData,
    include: { rol: true, cliente: true }
  })
}

export const deleteUsuario = async (id: number) => {
  const usuario = await prisma.usuario.findUnique({ where: { id } })
  if (!usuario) throw new AppError('Usuario no encontrado', 404)

  await prisma.usuario.delete({ where: { id } })
  return { message: 'Usuario eliminado correctamente' }
}
