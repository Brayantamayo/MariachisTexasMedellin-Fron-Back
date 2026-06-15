import prisma from '../../config/prisma'
import { AppError } from '../../utils/AppError'
import { toLocalDate, toLocalTime } from '../../utils/date.helpers'

// ─── MAPEO Prisma → Frontend ──────────────────────────────────────────────────
const mapToBlock = (b: any) => {
  const isTimeRange = b.motivo?.startsWith('TIME_RANGE:')
  const reasonWithPrefix = b.motivo?.split('|')[0] ?? ''
  const prefix = reasonWithPrefix.split(':')[0]
  const type = isTimeRange ? 'TIME_RANGE' : (prefix === 'FULL_DATE' ? 'FULL_DATE' : (prefix === 'DATE_RANGE' ? 'DATE_RANGE' : 'FULL_DATE'))
  
  return {
    id:          String(b.id),
    type,
    reason:      reasonWithPrefix.replace(/^(TIME_RANGE:|FULL_DATE:|DATE_RANGE:)/, ''),
    description: b.motivo?.split('|')[1] ?? '',
    startDate:   toLocalDate(b.fechaInicio),
    endDate:     toLocalDate(b.fechaFin),
    startTime:   isTimeRange ? toLocalTime(b.fechaInicio) : undefined,
    endTime:   isTimeRange ? toLocalTime(b.fechaFin) : undefined,
    isActive:    true,
    createdAt:   b.createdAt?.toISOString(),
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const buildDates = (data: any) => {
  if (data.type === 'TIME_RANGE') {
    return {
      fechaInicio: new Date(`${data.startDate}T${data.startTime}:00`),
      fechaFin:    new Date(`${data.startDate}T${data.endTime}:00`),
      motivo:      `TIME_RANGE:${data.reason}|${data.description ?? ''}`
    }
  }
  // DATE_RANGE / FULL_DATE: store range start to end of day in local/server time
  return {
    fechaInicio: new Date(`${data.startDate}T00:00:00`),
    fechaFin:    new Date(`${data.endDate ?? data.startDate}T23:59:59`),
    motivo:      `${data.type}:${data.reason}|${data.description ?? ''}`
  }
}

// ─── VALIDATE CONFLICTS ───────────────────────────────────────────────────────
const checkForConflicts = async (
  startDate: string,
  endDate: string,
  type: string,
  startTime: string | undefined,
  fechaInicio: Date,
  fechaFin: Date
) => {
  const now = new Date()
  const todayStr = toLocalDate(now)

  if (startDate < todayStr) {
    throw new AppError('No se puede crear el bloqueo en fechas pasadas.', 400)
  }

  if (type === 'TIME_RANGE' && startDate === todayStr && startTime) {
    const currentHHMM = toLocalTime(now)
    if (startTime < currentHHMM) {
      throw new AppError('No se puede crear el bloqueo en horas pasadas.', 400)
    }
  }

  // Define block range in local/server date reference
  const blockStart = fechaInicio
  const blockEnd = fechaFin

  // 1. Reservas activas (estado !== 'ANULADA')
  const activeReservas = await prisma.reserva.findMany({
    where: {
      estado: { not: 'ANULADA' }
    },
    include: { cotizacion: true }
  })

  for (const res of activeReservas) {
    if (res.cotizacion) {
      const start = res.cotizacion.horaInicio
      const end = res.cotizacion.horaFin < start ? new Date(res.cotizacion.horaFin.getTime() + 24 * 60 * 60 * 1000) : res.cotizacion.horaFin
      const bufferStart = new Date(start.getTime() - 60 * 60 * 1000)
      const bufferEnd   = new Date(end.getTime() + 60 * 60 * 1000)

      if (blockStart < bufferEnd && blockEnd > bufferStart) {
        throw new AppError('No se puede crear el bloqueo ya que hay reservas en el rango que escogiste.', 400)
      }
    }
  }

  // 2. Cotizaciones en espera (estado === 'EN_ESPERA')
  const activeCotizaciones = await prisma.cotizacion.findMany({
    where: {
      estado: 'EN_ESPERA',
      reserva: null
    }
  })

  for (const cot of activeCotizaciones) {
    const start = cot.horaInicio
    const end = cot.horaFin < start ? new Date(cot.horaFin.getTime() + 24 * 60 * 60 * 1000) : cot.horaFin
    const bufferStart = new Date(start.getTime() - 60 * 60 * 1000)
    const bufferEnd   = new Date(end.getTime() + 60 * 60 * 1000)

    if (blockStart < bufferEnd && blockEnd > bufferStart) {
      throw new AppError('No se puede crear el bloqueo ya que hay reservas en el rango que escogiste.', 400)
    }
  }

  // 3. Ensayos pendientes (estado !== 'LISTO')
  const activeEnsayos = await prisma.ensayo.findMany({
    where: {
      estado: { not: 'LISTO' }
    }
  })

  for (const ensayo of activeEnsayos) {
    const start = ensayo.fechaHora
    const bufferStart = new Date(start.getTime() - 60 * 60 * 1000)
    const bufferEnd   = new Date(start.getTime() + 60 * 60 * 1000)

    if (blockStart < bufferEnd && blockEnd > bufferStart) {
      throw new AppError('No se puede crear el bloqueo ya que hay reservas en el rango que escogiste.', 400)
    }
  }
}

// ─── GET ALL ──────────────────────────────────────────────────────────────────
export const getBlocks = async () => {
  const blocks = await prisma.bloqueoCalendario.findMany({
    orderBy: { fechaInicio: 'desc' }
  })
  return blocks.map(mapToBlock)
}

// ─── CHECK DATE STATUS ────────────────────────────────────────────────────────
export const checkDateStatus = async (dateStr: string) => {
  const dayStart = new Date(`${dateStr}T00:00:00`)
  const dayEnd   = new Date(`${dateStr}T23:59:59`)

  const blocks = await prisma.bloqueoCalendario.findMany({
    where: {
      fechaInicio: { lte: dayEnd },
      fechaFin:    { gte: dayStart }
    }
  })

  if (!blocks.length) return { isBlocked: false }

  // Bloqueos totales
  const fullBlocks = blocks.filter(b => !b.motivo?.startsWith('TIME_RANGE:'))
  if (fullBlocks.length) {
    const reason = fullBlocks[0].motivo?.replace(/^(FULL_DATE:|DATE_RANGE:)/, '').split('|')[0]
    return { isBlocked: true, reason, type: fullBlocks[0].motivo?.split(':')[0] }
  }

  // Bloqueos parciales
  const timeBlocks = blocks.filter(b => b.motivo?.startsWith('TIME_RANGE:'))
  if (timeBlocks.length) {
    return {
      isBlocked: false,
      hasPartialBlocks: true,
      blockedRanges: timeBlocks.map(b => ({
        start:  toLocalTime(b.fechaInicio),
        end:    toLocalTime(b.fechaFin),
        reason: b.motivo?.replace('TIME_RANGE:', '').split('|')[0] ?? ''
      }))
    }
  }

  return { isBlocked: false }
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const createBlock = async (data: any) => {
  if (!data.reason?.trim())   throw new Error('El motivo es requerido')
  if (!data.startDate)        throw new Error('La fecha de inicio es requerida')
  if (!data.endDate && data.type !== 'TIME_RANGE') data.endDate = data.startDate
  if (data.type === 'TIME_RANGE' && (!data.startTime || !data.endTime))
    throw new Error('Las horas de inicio y fin son requeridas para bloqueos por horas')

  const { fechaInicio, fechaFin, motivo } = buildDates(data)

  await checkForConflicts(data.startDate, data.endDate ?? data.startDate, data.type, data.startTime, fechaInicio, fechaFin)

  const block = await prisma.bloqueoCalendario.create({
    data: { fechaInicio, fechaFin, motivo }
  })
  return mapToBlock(block)
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const updateBlock = async (id: number, data: any) => {
  const exists = await prisma.bloqueoCalendario.findUnique({ where: { id } })
  if (!exists) throw new Error('Bloqueo no encontrado')

  // Reconstruir con datos merged
  const merged = { ...mapToBlock(exists), ...data }
  const { fechaInicio, fechaFin, motivo } = buildDates(merged)

  await checkForConflicts(merged.startDate, merged.endDate ?? merged.startDate, merged.type, merged.startTime, fechaInicio, fechaFin)

  const block = await prisma.bloqueoCalendario.update({
    where: { id },
    data:  { fechaInicio, fechaFin, motivo }
  })
  return mapToBlock(block)
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const deleteBlock = async (id: number) => {
  const exists = await prisma.bloqueoCalendario.findUnique({ where: { id } })
  if (!exists) throw new Error('Bloqueo no encontrado')
  await prisma.bloqueoCalendario.delete({ where: { id } })
  return { message: 'Bloqueo eliminado correctamente' }
}