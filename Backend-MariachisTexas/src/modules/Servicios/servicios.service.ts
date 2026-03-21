import prisma from '../../config/prisma'
import { ServicioCreateSchema, ServicioUpdateSchema, zodError } from '../schemas'
import type { ServicioCreateInput, ServicioUpdateInput } from '../../types/interfaces'

// ─── HELPER: verifica si el servicio está en uso para ELIMINAR ────────────────
const verificarServicioParaEliminar = async (id: number) => {
  // ✅ En cotización EN_ESPERA (pendiente de confirmar)
  const enCotizacionPendiente = await prisma.cotizacionServicio.findFirst({
    where: {
      servicioId: id,
      cotizacion: { estado: 'EN_ESPERA' }
    }
  })
  if (enCotizacionPendiente) {
    throw new Error('No se permite eliminar el servicio porque está en una cotización pendiente')
  }

  // ✅ En cotización CONVERTIDA cuya reserva sigue activa (PENDIENTE o CONFIRMADA)
  const enReservaActiva = await prisma.cotizacionServicio.findFirst({
    where: {
      servicioId: id,
      cotizacion: {
        estado: 'CONVERTIDA',
        reserva: {
          estado: { in: ['PENDIENTE', 'CONFIRMADA'] }
        }
      }
    }
  })
  if (enReservaActiva) {
    throw new Error('No se permite eliminar el servicio porque está en una reserva activa')
  }
}

// ─── HELPER: verifica si el servicio está en uso para EDITAR ─────────────────
const verificarServicioParaEditar = async (id: number) => {
  const enCotizacionPendiente = await prisma.cotizacionServicio.findFirst({
    where: {
      servicioId: id,
      cotizacion: { estado: 'EN_ESPERA' }
    }
  })
  if (enCotizacionPendiente) {
    throw new Error('No se puede modificar un servicio que está en una cotización pendiente')
  }

  const enReservaActiva = await prisma.cotizacionServicio.findFirst({
    where: {
      servicioId: id,
      cotizacion: {
        estado: 'CONVERTIDA',
        reserva: {
          estado: { in: ['PENDIENTE', 'CONFIRMADA'] }
        }
      }
    }
  })
  if (enReservaActiva) {
    throw new Error('No se puede modificar un servicio que está en una reserva activa')
  }
}

// ─── CREAR ────────────────────────────────────────────────────────────────────
export const crearServicio = async (data: ServicioCreateInput) => {
  const trimmed = {
    ...data,
    nombre:      typeof data.nombre      === 'string' ? data.nombre.trim()      : data.nombre,
    descripcion: typeof data.descripcion === 'string' ? data.descripcion.trim() : data.descripcion,
  }

  if (!trimmed.nombre) throw new Error('El nombre del servicio no puede estar vacío o contener solo espacios')

  const parsed = ServicioCreateSchema.safeParse(trimmed)
  if (!parsed.success) throw new Error(zodError(parsed.error))

  const existe = await prisma.servicio.findUnique({ where: { nombre: parsed.data.nombre } })
  if (existe) throw new Error('Ya existe un servicio con ese nombre')

  const servicio = await prisma.servicio.create({ data: parsed.data })
  return { message: 'Servicio creado correctamente', servicio }
}

// ─── LISTAR ───────────────────────────────────────────────────────────────────
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

// ─── VER UNO ──────────────────────────────────────────────────────────────────
export const verServicio = async (id: number) => {
  const servicio = await prisma.servicio.findUnique({ where: { id } })
  if (!servicio) throw new Error('Servicio no encontrado')
  return servicio
}

// ─── EDITAR ───────────────────────────────────────────────────────────────────
export const editarServicio = async (id: number, data: ServicioUpdateInput) => {
  const trimmed = {
    ...data,
    nombre:      typeof data.nombre      === 'string' ? data.nombre.trim()      : data.nombre,
    descripcion: typeof data.descripcion === 'string' ? data.descripcion.trim() : data.descripcion,
  }

  if (trimmed.nombre !== undefined && !trimmed.nombre)
    throw new Error('El nombre del servicio no puede estar vacío o contener solo espacios')

  const parsed = ServicioUpdateSchema.safeParse(trimmed)
  if (!parsed.success) throw new Error(zodError(parsed.error))

  const servicio = await prisma.servicio.findUnique({ where: { id } })
  if (!servicio) throw new Error('Servicio no encontrado')

  if (parsed.data.nombre && parsed.data.nombre !== servicio.nombre) {
    const existe = await prisma.servicio.findUnique({ where: { nombre: parsed.data.nombre } })
    if (existe) throw new Error('Ya existe un servicio con ese nombre')
  }

  await verificarServicioParaEditar(id)

  const actualizado = await prisma.servicio.update({ where: { id }, data: parsed.data })
  return { message: 'Servicio actualizado correctamente', servicio: actualizado }
}

// ─── CAMBIAR ESTADO ───────────────────────────────────────────────────────────
export const cambiarEstadoServicio = async (id: number) => {
  const servicio = await prisma.servicio.findUnique({ where: { id } })
  if (!servicio) throw new Error('Servicio no encontrado')

  await verificarServicioParaEditar(id)

  const actualizado = await prisma.servicio.update({
    where: { id },
    data:  { estado: !servicio.estado }
  })
  return {
    message:  `Servicio ${actualizado.estado ? 'activado' : 'desactivado'} correctamente`,
    servicio: actualizado
  }
}

// ─── ELIMINAR ─────────────────────────────────────────────────────────────────
export const eliminarServicio = async (id: number) => {
  const servicio = await prisma.servicio.findUnique({ where: { id } })
  if (!servicio) throw new Error('Servicio no encontrado')

  await verificarServicioParaEliminar(id)

  await prisma.servicio.delete({ where: { id } })
  return { message: 'Servicio eliminado correctamente' }
}