import prisma from '../../config/prisma'
import { EnsayoCreateSchema, EnsayoUpdateSchema, zodError } from '../schemas'
import { toLocalDate, toLocalTime, dayRange } from '../../utils/date.helpers'
import type { EnsayoCreateInput, EnsayoUpdateInput, RehearsalResponse } from '../../types/interfaces'

// ─── MAPEO ────────────────────────────────────────────────────────────────────
const mapToRehearsal = (e: any): RehearsalResponse => ({
  id:            String(e.id),
  title:         e.nombre,
  location:      e.lugar,
  address:       e.ubicacion ?? '',
  date:          toLocalDate(e.fechaHora),
  time:          toLocalTime(e.fechaHora),
  notes:         '',
  repertoireIds: e.repertorios?.map((r: any) => String(r.repertorioId)) ?? [],
  status:        e.estado === 'LISTO' ? 'Completado' : 'Pendiente',
  createdAt:     e.createdAt?.toISOString(),
  updatedAt:     e.updatedAt?.toISOString(),
})

// ─── VALIDAR DISPONIBILIDAD COMPLETA ─────────────────────────────────────────
const validateDisponibilidad = async (date: string, time: string, excludeId?: number) => {
  const fechaHora            = new Date(`${date}T${time}:00`)
  const { dayStart, dayEnd } = dayRange(date)
  const bufferAntes          = new Date(fechaHora.getTime() - 60 * 60 * 1000)
  const bufferDespues        = new Date(fechaHora.getTime() + 60 * 60 * 1000)

  const bloqueo = await prisma.bloqueoCalendario.findFirst({
    where: { fechaInicio: { lte: bufferDespues }, fechaFin: { gte: bufferAntes } }
  })
  if (bloqueo) throw new Error(
    `Fecha bloqueada: ${bloqueo.motivo?.replace(/^[A-Z_]+:/, '').split('|')[0] || 'No disponible'}`
  )

  const cotActivas = await prisma.cotizacion.findMany({
    where: { fechaEvento: { gte: dayStart, lte: dayEnd }, estado: { in: ['EN_ESPERA', 'CONVERTIDA'] } }
  })
  for (const cot of cotActivas) {
    if (bufferAntes < cot.horaFin && bufferDespues > cot.horaInicio)
      throw new Error(`Conflicto con cotización activa (${toLocalTime(cot.horaInicio)} - ${toLocalTime(cot.horaFin)})`)
  }

  const reservas = await prisma.reserva.findMany({
    where: {
      estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
      cotizacion: { fechaEvento: { gte: dayStart, lte: dayEnd } }
    },
    include: { cotizacion: true }
  })
  for (const r of reservas) {
    const rBufferAntes   = new Date(r.cotizacion.horaInicio.getTime() - 60 * 60 * 1000)
    const rBufferDespues = new Date(r.cotizacion.horaFin.getTime()    + 60 * 60 * 1000)
    if (fechaHora >= rBufferAntes && fechaHora < rBufferDespues)
      throw new Error(`Conflicto con reserva existente (${toLocalTime(r.cotizacion.horaInicio)} - ${toLocalTime(r.cotizacion.horaFin)})`)
  }

  const ensayoConflicto = await prisma.ensayo.findFirst({
    where: {
      // ✅ Solo validar conflicto contra ensayos PENDIENTES — los LISTOS ya no ocupan espacio
      estado: 'PENDIENTE',
      fechaHora: { gte: bufferAntes, lte: bufferDespues },
      id: excludeId ? { not: excludeId } : undefined
    }
  })
  if (ensayoConflicto) throw new Error(
    `Ya existe un ensayo programado a las ${toLocalTime(ensayoConflicto.fechaHora)}`
  )
}

// ─── GET ALL ──────────────────────────────────────────────────────────────────
export const getEnsayos = async (): Promise<RehearsalResponse[]> => {
  const ensayos = await prisma.ensayo.findMany({
    include:  { repertorios: true },
    orderBy:  { fechaHora: 'desc' }
  })
  return ensayos.map(mapToRehearsal)
}

// ─── GET BY ID ────────────────────────────────────────────────────────────────
export const getEnsayoById = async (id: number): Promise<RehearsalResponse> => {
  const ensayo = await prisma.ensayo.findUnique({ where: { id }, include: { repertorios: true } })
  if (!ensayo) throw new Error('Ensayo no encontrado')
  return mapToRehearsal(ensayo)
}

// ─── GET DISPONIBILIDAD PÚBLICA — solo PENDIENTES ─────────────────────────────
export const getDisponibilidadPublica = async () => {
  const ensayos = await prisma.ensayo.findMany({
    // ✅ Los ensayos LISTOS no bloquean el calendario público
    where:   { estado: 'PENDIENTE' },
    orderBy: { fechaHora: 'asc' }
  })
  return ensayos.map(e => ({ fecha: toLocalDate(e.fechaHora), hora: toLocalTime(e.fechaHora) }))
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const createEnsayo = async (data: EnsayoCreateInput): Promise<RehearsalResponse> => {
  const trimmed = {
    ...data,
    title:    typeof data.title    === 'string' ? data.title.trim()    : data.title,
    location: typeof data.location === 'string' ? data.location.trim() : data.location,
    address:  typeof data.address  === 'string' ? data.address.trim()  : data.address,
  }

  if (!trimmed.title)    throw new Error('El título del ensayo no puede estar vacío o contener solo espacios')
  if (!trimmed.location) throw new Error('El lugar del ensayo no puede estar vacío o contener solo espacios')

  const parsed = EnsayoCreateSchema.safeParse(trimmed)
  if (!parsed.success) throw new Error(zodError(parsed.error))

  const { title, location, address, date, time, repertoireIds } = parsed.data

  await validateDisponibilidad(date, time)

  const ensayo = await prisma.$transaction(async (tx) => {
    const e = await tx.ensayo.create({
      data: {
        nombre:    title,
        fechaHora: new Date(`${date}T${time}:00`),
        lugar:     location,
        ubicacion: address ?? null,
        estado:    'PENDIENTE', // ← siempre inicia como PENDIENTE
      },
      include: { repertorios: true }
    })
    if (repertoireIds?.length)
      await tx.ensayoRepertorio.createMany({
        data: repertoireIds.map((rid: string | number) => ({
          ensayoId:     e.id,
          repertorioId: Number(rid)
        }))
      })
    return e
  })

  return getEnsayoById(ensayo.id)
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const updateEnsayo = async (id: number, data: EnsayoUpdateInput): Promise<RehearsalResponse> => {
  const exists = await prisma.ensayo.findUnique({ where: { id } })
  if (!exists) throw new Error('Ensayo no encontrado')

  // ✅ No permitir editar un ensayo LISTO (solo cambiar estado o eliminar)
  if (exists.estado === 'LISTO') {
    // Si la única actualización es el estado, la permitimos
    const soloEstado = Object.keys(data).every(k => k === 'status')
    if (!soloEstado)
      throw new Error('No se puede editar un ensayo completado. Solo puedes cambiar su estado o eliminarlo.')
  }

  const trimmed = {
    ...data,
    title:    typeof data.title    === 'string' ? data.title.trim()    : data.title,
    location: typeof data.location === 'string' ? data.location.trim() : data.location,
    address:  typeof data.address  === 'string' ? data.address.trim()  : data.address,
  }

  if (trimmed.title    !== undefined && !trimmed.title)    throw new Error('El título no puede estar vacío')
  if (trimmed.location !== undefined && !trimmed.location) throw new Error('El lugar no puede estar vacío')

  const parsed = EnsayoUpdateSchema.safeParse(trimmed)
  if (!parsed.success) throw new Error(zodError(parsed.error))

  const date = parsed.data.date ?? toLocalDate(exists.fechaHora)
  const time = parsed.data.time ?? toLocalTime(exists.fechaHora)

  if (parsed.data.date || parsed.data.time) await validateDisponibilidad(date, time, id)

  // Convertir status del frontend → enum de BD
  const estadoDB = parsed.data.status === 'LISTO'   ? 'LISTO'
                : parsed.data.status === 'PENDIENTE' ? 'PENDIENTE'
                : undefined

  await prisma.$transaction(async (tx) => {
    await tx.ensayo.update({
      where: { id },
      data: {
        nombre:    parsed.data.title    ?? exists.nombre,
        fechaHora: new Date(`${date}T${time}:00`),
        lugar:     parsed.data.location ?? exists.lugar,
        ubicacion: parsed.data.address  ?? exists.ubicacion,
        ...(estadoDB !== undefined ? { estado: estadoDB } : {}),
      }
    })
    if (parsed.data.repertoireIds !== undefined) {
      await tx.ensayoRepertorio.deleteMany({ where: { ensayoId: id } })
      if (parsed.data.repertoireIds.length)
        await tx.ensayoRepertorio.createMany({
          data: parsed.data.repertoireIds.map((rid: string | number) => ({
            ensayoId:     id,
            repertorioId: Number(rid)
          }))
        })
    }
  })

  return getEnsayoById(id)
}

// ─── TOGGLE ESTADO (PENDIENTE ↔ LISTO) ───────────────────────────────────────
export const toggleEstadoEnsayo = async (id: number): Promise<RehearsalResponse> => {
  const exists = await prisma.ensayo.findUnique({ where: { id } })
  if (!exists) throw new Error('Ensayo no encontrado')

  const nuevoEstado = exists.estado === 'PENDIENTE' ? 'LISTO' : 'PENDIENTE'

  await prisma.ensayo.update({ where: { id }, data: { estado: nuevoEstado } })
  return getEnsayoById(id)
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const deleteEnsayo = async (id: number) => {
  const exists = await prisma.ensayo.findUnique({ where: { id } })
  if (!exists) throw new Error('Ensayo no encontrado')
  await prisma.ensayo.delete({ where: { id } })
  return { message: 'Ensayo eliminado correctamente' }
}