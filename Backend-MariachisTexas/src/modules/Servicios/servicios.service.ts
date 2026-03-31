import prisma from '../../config/prisma'
import { ServicioCreateSchema, ServicioUpdateSchema, zodError } from '../schemas'
import { AppError } from '../../utils/AppError'
import { verificarNombreDuplicado } from './helpers/Servicios.validators'
import { verificarServicioEnUso }   from './helpers/Servicios.guards'
import type { ServicioCreateInput, ServicioUpdateInput } from '../../types/interfaces'

// ─── CREAR ────────────────────────────────────────────────────────────────────
export const crearServicio = async (data: ServicioCreateInput) => {
  const parsed = ServicioCreateSchema.safeParse(data)
  if (!parsed.success) throw new AppError(zodError(parsed.error), 400)

  await verificarNombreDuplicado(parsed.data.nombre)

  const servicio = await prisma.servicio.create({ data: parsed.data })
  return { message: 'Servicio creado correctamente', servicio }
}

// ─── LISTAR ───────────────────────────────────────────────────────────────────
export const listarServicios = async (buscar?: string) => {
  const buscarSanitizado = buscar?.trim().replace(/[<>{}[\]\\]/g, '') || undefined

  return prisma.servicio.findMany({
    where: buscarSanitizado ? {
      OR: [
        { nombre:      { contains: buscarSanitizado, mode: 'insensitive' } },
        { descripcion: { contains: buscarSanitizado, mode: 'insensitive' } },
      ],
    } : {},
    orderBy: { createdAt: 'desc' },
  })
}

// ─── BUSCAR POR ID──────────────────────────────────────────────────────────────────
export const verServicio = async (id: number) => {
  if (!Number.isInteger(id) || id <= 0)
    throw new AppError('El ID del servicio no es válido', 400)

  const servicio = await prisma.servicio.findUnique({ where: { id } })
  if (!servicio) throw new AppError('Servicio no encontrado', 404)
  return servicio
}

// ─── EDITAR ───────────────────────────────────────────────────────────────────
export const editarServicio = async (id: number, data: ServicioUpdateInput) => {
  if (!Number.isInteger(id) || id <= 0)
    throw new AppError('El ID del servicio no es válido', 400)

  const servicio = await prisma.servicio.findUnique({ where: { id } })
  if (!servicio) throw new AppError('Servicio no encontrado', 404)

  if (!servicio.estado)
    throw new AppError('No se puede editar un servicio desactivado. Actívalo primero para poder modificarlo', 409)

  const parsed = ServicioUpdateSchema.safeParse(data)
  if (!parsed.success) throw new AppError(zodError(parsed.error), 400)

  if (parsed.data.nombre && parsed.data.nombre !== servicio.nombre) {
    await verificarNombreDuplicado(parsed.data.nombre, id)
  }

  if (parsed.data.precio !== undefined) {
    const precioActual = Number(servicio.precio)
    const nuevoPrecio  = parsed.data.precio
    if (nuevoPrecio < precioActual * 0.1)
      throw new AppError('No puedes reducir el precio más de un 90% en una sola edición', 400)
  }

  await verificarServicioEnUso(id, 'editar')

  const actualizado = await prisma.servicio.update({ where: { id }, data: parsed.data })
  return { message: 'Servicio actualizado correctamente', servicio: actualizado }
}

// ─── CAMBIAR ESTADO ───────────────────────────────────────────────────────────
export const cambiarEstadoServicio = async (id: number) => {
  if (!Number.isInteger(id) || id <= 0)
    throw new AppError('El ID del servicio no es válido', 400)

  const servicio = await prisma.servicio.findUnique({ where: { id } })
  if (!servicio) throw new AppError('Servicio no encontrado', 404)

  if (servicio.estado) await verificarServicioEnUso(id, 'editar')

  const actualizado = await prisma.servicio.update({
    where: { id },
    data:  { estado: !servicio.estado },
  })
  return {
    message:  `Servicio ${actualizado.estado ? 'activado' : 'desactivado'} correctamente`,
    servicio: actualizado,
  }
}

// ─── ELIMINAR ─────────────────────────────────────────────────────────────────
export const eliminarServicio = async (id: number) => {
  if (!Number.isInteger(id) || id <= 0)
    throw new AppError('El ID del servicio no es válido', 400)

  const servicio = await prisma.servicio.findUnique({ where: { id } })
  if (!servicio) throw new AppError('Servicio no encontrado', 404)

  await verificarServicioEnUso(id, 'eliminar')

  await prisma.$transaction([
    prisma.cotizacionServicio.deleteMany({ where: { servicioId: id } }),
    prisma.servicio.delete({ where: { id } }),
  ])

  return { message: 'Servicio eliminado correctamente' }
}