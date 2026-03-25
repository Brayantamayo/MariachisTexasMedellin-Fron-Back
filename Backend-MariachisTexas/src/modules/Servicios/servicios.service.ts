import prisma from '../../config/prisma'
import { ServicioCreateSchema, ServicioUpdateSchema, zodError } from '../schemas'
import type { ServicioCreateInput, ServicioUpdateInput } from '../../types/interfaces'

// ─── HELPER: normaliza texto para comparación ─────────────────────────────────
const normalizar = (s: string) =>
  s.trim()
   .toLowerCase()
   .normalize('NFD')
   .replace(/[\u0300-\u036f]/g, '')
   .replace(/\s+/g, ' ')

// ─── HELPER: verifica si el servicio está en uso para ELIMINAR ────────────────
const verificarServicioParaEliminar = async (id: number) => {
  const enCotizacionPendiente = await prisma.cotizacionServicio.findFirst({
    where: { servicioId: id, cotizacion: { estado: 'EN_ESPERA' } }
  })
  if (enCotizacionPendiente)
    throw new Error('No se permite eliminar el servicio porque está en una cotización pendiente')

  const enReservaActiva = await prisma.cotizacionServicio.findFirst({
    where: {
      servicioId: id,
      cotizacion: { estado: 'CONVERTIDA', reserva: { estado: { in: ['PENDIENTE', 'CONFIRMADA'] } } }
    }
  })
  if (enReservaActiva)
    throw new Error('No se permite eliminar el servicio porque está en una reserva activa')
}

// ─── HELPER: verifica si el servicio está en uso para EDITAR ─────────────────
const verificarServicioParaEditar = async (id: number) => {
  const enCotizacionPendiente = await prisma.cotizacionServicio.findFirst({
    where: { servicioId: id, cotizacion: { estado: 'EN_ESPERA' } }
  })
  if (enCotizacionPendiente)
    throw new Error('No se puede modificar un servicio que está en una cotización pendiente')

  const enReservaActiva = await prisma.cotizacionServicio.findFirst({
    where: {
      servicioId: id,
      cotizacion: { estado: 'CONVERTIDA', reserva: { estado: { in: ['PENDIENTE', 'CONFIRMADA'] } } }
    }
  })
  if (enReservaActiva)
    throw new Error('No se puede modificar un servicio que está en una reserva activa')
}

// ─── CREAR ────────────────────────────────────────────────────────────────────
export const crearServicio = async (data: ServicioCreateInput) => {
  const trimmed = {
    ...data,
    nombre:      typeof data.nombre      === 'string' ? data.nombre.trim()      : data.nombre,
    descripcion: typeof data.descripcion === 'string' ? data.descripcion.trim() : data.descripcion,
  }

  if (!trimmed.nombre)
    throw new Error('El nombre del servicio no puede estar vacío o contener solo espacios')

  const parsed = ServicioCreateSchema.safeParse(trimmed)
  if (!parsed.success) throw new Error(zodError(parsed.error))

  // ✅ Verificar nombre duplicado exacto
  const existe = await prisma.servicio.findUnique({ where: { nombre: parsed.data.nombre } })
  if (existe) throw new Error('Ya existe un servicio con ese nombre')

  // ✅ Verificar nombre similar normalizado
  const todos = await prisma.servicio.findMany({ select: { nombre: true } })
  const nombreNormalizado = normalizar(parsed.data.nombre)
  const similar = todos.find(s => normalizar(s.nombre) === nombreNormalizado)
  if (similar)
    throw new Error(`Ya existe un servicio con un nombre similar: "${similar.nombre}"`)

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
        { descripcion: { contains: buscarSanitizado, mode: 'insensitive' } }
      ]
    } : {},
    orderBy: { createdAt: 'desc' }
  })
}

// ─── VER UNO ──────────────────────────────────────────────────────────────────
export const verServicio = async (id: number) => {
  if (!Number.isInteger(id) || id <= 0)
    throw new Error('El ID del servicio no es válido')

  const servicio = await prisma.servicio.findUnique({ where: { id } })
  if (!servicio) throw new Error('Servicio no encontrado')
  return servicio
}

// ─── EDITAR ───────────────────────────────────────────────────────────────────
export const editarServicio = async (id: number, data: ServicioUpdateInput) => {
  if (!Number.isInteger(id) || id <= 0)
    throw new Error('El ID del servicio no es válido')

  const servicio = await prisma.servicio.findUnique({ where: { id } })
  if (!servicio) throw new Error('Servicio no encontrado')

  // ✅ No permitir editar si está desactivado
  if (!servicio.estado)
    throw new Error('No se puede editar un servicio desactivado. Actívalo primero para poder modificarlo')

  const trimmed = {
    ...data,
    nombre:      typeof data.nombre      === 'string' ? data.nombre.trim()      : data.nombre,
    descripcion: typeof data.descripcion === 'string' ? data.descripcion.trim() : data.descripcion,
  }

  if (trimmed.nombre !== undefined && !trimmed.nombre)
    throw new Error('El nombre del servicio no puede estar vacío o contener solo espacios')

  const parsed = ServicioUpdateSchema.safeParse(trimmed)
  if (!parsed.success) throw new Error(zodError(parsed.error))

  // ✅ Verificar nombre duplicado exacto (excluyendo el mismo)
  if (parsed.data.nombre && parsed.data.nombre !== servicio.nombre) {
    const existe = await prisma.servicio.findUnique({ where: { nombre: parsed.data.nombre } })
    if (existe) throw new Error('Ya existe un servicio con ese nombre')

    // ✅ Verificar nombre similar normalizado
    const todos = await prisma.servicio.findMany({
      where:  { id: { not: id } },
      select: { nombre: true }
    })
    const nombreNormalizado = normalizar(parsed.data.nombre)
    const similar = todos.find(s => normalizar(s.nombre) === nombreNormalizado)
    if (similar)
      throw new Error(`Ya existe un servicio con un nombre similar: "${similar.nombre}"`)
  }

  // ✅ No permitir bajar el precio más de un 90% de golpe
  if (parsed.data.precio !== undefined) {
    const precioActual = Number(servicio.precio)
    const nuevoPrecio  = parsed.data.precio
    if (nuevoPrecio < precioActual * 0.1)
      throw new Error('No puedes reducir el precio más de un 90% en una sola edición')
  }

  await verificarServicioParaEditar(id)

  const actualizado = await prisma.servicio.update({ where: { id }, data: parsed.data })
  return { message: 'Servicio actualizado correctamente', servicio: actualizado }
}

// ─── CAMBIAR ESTADO ───────────────────────────────────────────────────────────
export const cambiarEstadoServicio = async (id: number) => {
  if (!Number.isInteger(id) || id <= 0)
    throw new Error('El ID del servicio no es válido')

  const servicio = await prisma.servicio.findUnique({ where: { id } })
  if (!servicio) throw new Error('Servicio no encontrado')

  // ✅ Solo verificar uso si se va a DESACTIVAR (no al activar)
  if (servicio.estado) {
    await verificarServicioParaEditar(id)
  }

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
  if (!Number.isInteger(id) || id <= 0)
    throw new Error('El ID del servicio no es válido')

  const servicio = await prisma.servicio.findUnique({ where: { id } })
  if (!servicio) throw new Error('Servicio no encontrado')

  // ✅ Solo se puede eliminar si está desactivado
  if (servicio.estado)
    throw new Error('Debes desactivar el servicio antes de eliminarlo')

  await verificarServicioParaEliminar(id)

  await prisma.servicio.delete({ where: { id } })
  return { message: 'Servicio eliminado correctamente' }
}