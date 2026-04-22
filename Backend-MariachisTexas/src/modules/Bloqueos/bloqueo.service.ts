import prisma from '../../config/prisma'

// ─── MAPEO Prisma → Frontend ──────────────────────────────────────────────────
const mapToBlock = (b: any) => ({
  id:          String(b.id),
  type:        b.motivo?.startsWith('TIME_RANGE:') ? 'TIME_RANGE'
  : b.fechaInicio.toISOString().split('T')[0] === b.fechaFin.toISOString().split('T')[0]
  ? 'FULL_DATE' : 'DATE_RANGE',
  reason:      b.motivo?.replace(/^(TIME_RANGE:|FULL_DATE:|DATE_RANGE:)/, '').split('|')[0] ?? '',
  description: b.motivo?.split('|')[1] ?? '',
  startDate:   b.fechaInicio.toISOString().split('T')[0],
  endDate:     b.fechaFin.toISOString().split('T')[0],
  startTime:   b.motivo?.startsWith('TIME_RANGE:') ? b.fechaInicio.toISOString().split('T')[1].slice(0,5) : undefined,
  endTime:     b.motivo?.startsWith('TIME_RANGE:') ? b.fechaFin.toISOString().split('T')[1].slice(0,5) : undefined,
  isActive:    true,
  createdAt:   b.createdAt?.toISOString(),
})

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const buildDates = (data: any) => {
  if (data.type === 'TIME_RANGE') {
    return {
      fechaInicio: new Date(`${data.startDate}T${data.startTime}:00`),
      fechaFin:    new Date(`${data.startDate}T${data.endTime}:00`),
      motivo:      `TIME_RANGE:${data.reason}|${data.description ?? ''}`
    }
  }
  return {
    fechaInicio: new Date(`${data.startDate}T00:00:00`),
    fechaFin:    new Date(`${data.endDate}T23:59:59`),
    motivo:      `${data.type}:${data.reason}|${data.description ?? ''}`
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
        start:  b.fechaInicio.toISOString().split('T')[1].slice(0,5),
        end:    b.fechaFin.toISOString().split('T')[1].slice(0,5),
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