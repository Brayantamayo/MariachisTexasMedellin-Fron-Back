import prisma from '../../config/prisma'
import { ServicioCreateSchema, ServicioUpdateSchema, zodError } from '../schemas'

export const crearServicio = async (data: any) => {
  const parsed = ServicioCreateSchema.safeParse(data)
  if (!parsed.success) throw new Error(zodError(parsed.error))

  const existe = await prisma.servicio.findUnique({ where: { nombre: parsed.data.nombre } })
  if (existe) throw new Error('Ya existe un servicio con ese nombre')

  const servicio = await prisma.servicio.create({ data: parsed.data })
  return { message: 'Servicio creado correctamente', servicio }
}

export const listarServicios = async (buscar?: string) => {
  return prisma.servicio.findMany({
    where: buscar ? {
      OR: [
        { nombre:      { contains: buscar, mode: 'insensitive' } },
        { descripcion: { contains: buscar, mode: 'insensitive' } }
      ]
    } : {},
    orderBy: { createdAt: 'desc' }
  })
}

export const verServicio = async (id: number) => {
  const servicio = await prisma.servicio.findUnique({ where: { id } })
  if (!servicio) throw new Error('Servicio no encontrado')
  return servicio
}

export const editarServicio = async (id: number, data: any) => {
  const parsed = ServicioUpdateSchema.safeParse(data)
  if (!parsed.success) throw new Error(zodError(parsed.error))

  const servicio = await prisma.servicio.findUnique({ where: { id } })
  if (!servicio) throw new Error('Servicio no encontrado')

  if (parsed.data.nombre && parsed.data.nombre !== servicio.nombre) {
    const existe = await prisma.servicio.findUnique({ where: { nombre: parsed.data.nombre } })
    if (existe) throw new Error('Ya existe un servicio con ese nombre')
  }

  const actualizado = await prisma.servicio.update({ where: { id }, data: parsed.data })
  return { message: 'Servicio actualizado correctamente', servicio: actualizado }
}

export const cambiarEstadoServicio = async (id: number) => {
  const servicio = await prisma.servicio.findUnique({ where: { id } })
  if (!servicio) throw new Error('Servicio no encontrado')
  const actualizado = await prisma.servicio.update({ where: { id }, data: { estado: !servicio.estado } })
  return { message: `Servicio ${actualizado.estado ? 'activado' : 'desactivado'} correctamente`, servicio: actualizado }
}

export const eliminarServicio = async (id: number) => {
  const servicio = await prisma.servicio.findUnique({ where: { id } })
  if (!servicio) throw new Error('Servicio no encontrado')
  await prisma.servicio.delete({ where: { id } })
  return { message: 'Servicio eliminado correctamente' }
}