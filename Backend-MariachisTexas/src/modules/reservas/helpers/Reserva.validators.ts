import prisma from '../../../config/prisma'
import { AppError } from '../../../utils/AppError'
import { toLocalTime, parseLocalDate, bloquearRango, dayRange } from '../../../utils/date.helpers'
import { EstadoEnsayo } from '../../../generated/prisma'


// ─── verificarDisponibilidadReserva ───────────────────────────────────────────
// Verifica que el horario de la reserva no conflictúe con:
//   1. Bloqueos de calendario
//   2. Cotizaciones activas del mismo día (excluyendo la cotización propia)
//   3. Reservas activas solapadas (con buffer de 1h)
//   4. Ensayos programados ese día
// Acepta excludeReservaId para ignorar la reserva actual en updates.
// Acepta excludeCotizacionId para ignorar la cotización propia en updates.
export const verificarDisponibilidadReserva = async (
  dateStr:              string,
  inicio:               Date,
  fin:                  Date,
  excludeReservaId?:    number,
  excludeCotizacionId?: number,   // ← NUEVO: excluye la cot. propia de la reserva
): Promise<void> => {
  const { dayStart, dayEnd } = dayRange(dateStr)
  const bufferInicio         = new Date(inicio.getTime() - 60 * 60 * 1000)

const [bloqueo, cotizaciones, reservas, ensayos] = await Promise.all([
  prisma.bloqueoCalendario.findFirst({
    where: { fechaInicio: { lte: fin }, fechaFin: { gte: inicio } },
  }),
  prisma.cotizacion.findMany({
    where: {
      fechaEvento: { gte: dayStart, lte: dayEnd },
      estado:      { in: ['EN_ESPERA', 'CONVERTIDA'] }, // ANULADA queda excluida automáticamente
      ...(excludeCotizacionId ? { id: { not: excludeCotizacionId } } : {}),
    },
  }),
  prisma.reserva.findMany({
    where: {
      estado:     { in: ['PENDIENTE', 'CONFIRMADA'] }, // ANULADA queda excluida automáticamente
      cotizacion: { fechaEvento: parseLocalDate(dateStr), horaInicio: { lt: fin }, horaFin: { gt: bufferInicio } },
      ...(excludeReservaId ? { id: { not: excludeReservaId } } : {}),
    },
    include: { cotizacion: true },
  }),
  prisma.ensayo.findMany({
  where: {
    fechaHora: { gte: dayStart, lte: dayEnd },
    estado:    { not: EstadoEnsayo.LISTO }, // ← era 'Completado', el enum real es LISTO
  },
}),
])

  if (bloqueo)
    throw new AppError(
      `Fecha bloqueada: ${bloqueo.motivo?.replace(/^[A-Z_]+:/, '').split('|')[0] || 'No disponible'}`,
      409
    )

  for (const cot of cotizaciones)
    if (inicio < cot.horaFin && fin > cot.horaInicio)
      throw new AppError(
        `Conflicto con cotización activa (${toLocalTime(cot.horaInicio)} - ${toLocalTime(cot.horaFin)})`,
        409
      )

  if (reservas.length > 0)
    throw new AppError('Ya existe una reserva en ese horario. Por favor elige otro horario.', 409)

  for (const e of ensayos) {
    const ensayoAntes   = new Date(e.fechaHora.getTime() - 60 * 60 * 1000)
    const ensayoDespues = new Date(e.fechaHora.getTime() + 60 * 60 * 1000)
    if (inicio < ensayoDespues && fin > ensayoAntes)
      throw new AppError(`Conflicto con ensayo programado a las ${toLocalTime(e.fechaHora)}`, 409)
  }
}

// ─── getAvailableHours ────────────────────────────────────────────────────────
export const getAvailableHours = async (dateStr: string, excludeId?: number): Promise<string[]> => {
  const allHours: string[] = []
  for (let i = 8; i <= 23; i++) allHours.push(`${i.toString().padStart(2, '0')}:00`)
  allHours.push('00:00')

  const { dayStart, dayEnd } = dayRange(dateStr)
  const blocked              = new Set<string>()

  const [bloqueos, cotizaciones, reservas, ensayos] = await Promise.all([
  prisma.bloqueoCalendario.findMany({
    where: { fechaInicio: { lte: dayEnd }, fechaFin: { gte: dayStart } },
  }),
  prisma.cotizacion.findMany({
    where: {
      fechaEvento: { gte: dayStart, lte: dayEnd },
      estado:      { in: ['EN_ESPERA', 'CONVERTIDA'] }, // ANULADA excluida
    },
  }),
  prisma.reserva.findMany({
    where: {
      estado:     { in: ['PENDIENTE', 'CONFIRMADA'] }, // ANULADA excluida
      cotizacion: { fechaEvento: { gte: dayStart, lte: dayEnd } },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    include: { cotizacion: true },
  }),
   prisma.ensayo.findMany({
  where: {
    fechaHora: { gte: dayStart, lte: dayEnd },
    estado:    { not: EstadoEnsayo.LISTO }, // ← era 'Completado', el enum real es LISTO
  },
}),
])

  for (const b of bloqueos) {
    if (!b.motivo?.startsWith('TIME_RANGE:')) return []
    const start = toLocalTime(b.fechaInicio)
    const end   = toLocalTime(b.fechaFin)
    allHours.forEach(h => { if (h >= start && h < end) blocked.add(h) })
  }

  for (const c of cotizaciones)
    bloquearRango(allHours, blocked, toLocalTime(c.horaInicio), toLocalTime(c.horaFin))

  for (const r of reservas)
    bloquearRango(allHours, blocked, toLocalTime(r.cotizacion.horaInicio), toLocalTime(r.cotizacion.horaFin))

  for (const e of ensayos) {
    const time = toLocalTime(e.fechaHora)
    const [h]  = time.split(':').map(Number)
    blocked.add(time)
    blocked.add(`${((h - 1 + 24) % 24).toString().padStart(2, '0')}:00`)
  }

  const hoy = new Date().toISOString().split('T')[0]
  if (dateStr === hoy) {
    const limiteMs = new Date().getTime() + 6 * 60 * 60 * 1000
    return allHours.filter(h => !blocked.has(h) && new Date(`${dateStr}T${h}:00`).getTime() >= limiteMs)
  }

  return allHours.filter(h => !blocked.has(h))
}

// ─── validarServiciosReserva ──────────────────────────────────────────────────
export const validarServiciosReserva = async (
  selectedServices: { serviceId: string | number; quantity: number }[],
  serviciosDB:      { id: number; nombre: string; precio: unknown }[],
  repertoireIds:    (string | number)[] | undefined,
  totalAmount:      number,
  startTime:        string,
  endTime:          string,
): Promise<void> => {
  const CANCIONES_INCLUIDAS  = 7
  const PRECIO_CANCION_EXTRA = 10000
  const SERENATA_KEYWORDS    = ['serenata urbana', 'serenata rural']
  const HORA_EXTRA_KEYWORD   = 'hora extra'

  const normalize = (str: string) =>
    str.trim()
       .toLowerCase()
       .normalize('NFD')
       .replace(/[\u0300-\u036f]/g, '')
       .replace(/[^a-z0-9\s]/g, '')
       .trim()

  // ── 1. Serenata: máximo una y quantity = 1 ────────────────────────────────
  const serenatas = selectedServices.filter(item => {
    const srv = serviciosDB.find(s => s.id === Number(item.serviceId))
    return srv && SERENATA_KEYWORDS.some(k => normalize(srv.nombre).includes(k))
  })

  if (serenatas.length > 1)
    throw new AppError('Solo puedes seleccionar un tipo de serenata (urbana o rural) por reserva.', 400)

  if (serenatas.some(s => s.quantity > 1))
    throw new AppError('La serenata solo puede seleccionarse una vez por reserva.', 400)

  // ── 2. Validar duración según horas extra ─────────────────────────────────
  const horaExtraService = serviciosDB.find(s => normalize(s.nombre).includes(HORA_EXTRA_KEYWORD))
  const horasExtra       = horaExtraService
    ? (selectedServices.find(s => Number(s.serviceId) === horaExtraService.id)?.quantity ?? 0)
    : 0

  const duracionEsperadaMin = (1 + horasExtra) * 60

  const [startH, startM] = startTime.split(':').map(Number)
  const [endH,   endM]   = endTime.split(':').map(Number)

  const startTotalMin = startH * 60 + startM
  const endTotalMin   = endH   * 60 + endM
  const duracionReal  = endTotalMin >= startTotalMin
    ? endTotalMin - startTotalMin
    : (24 * 60 - startTotalMin) + endTotalMin

  if (duracionReal !== duracionEsperadaMin)
    throw new AppError(
      `La duración no es válida. Con ${horasExtra} hora(s) extra, la reserva debe durar ${1 + horasExtra} hora(s). ` +
      `Inicio: ${startTime}, Fin esperado: ${calcularEndTime(startTime, 1 + horasExtra)}.`,
      400
    )

  // ── 3. Calcular y verificar total ─────────────────────────────────────────
  const costoServicios = selectedServices.reduce((total, item) => {
    const srv = serviciosDB.find(s => s.id === Number(item.serviceId))
    return total + (Number(srv!.precio) * item.quantity)
  }, 0)

  const cancionesExtra = (repertoireIds?.length ?? 0) > CANCIONES_INCLUIDAS
    ? ((repertoireIds?.length ?? 0) - CANCIONES_INCLUIDAS) * PRECIO_CANCION_EXTRA
    : 0

  const totalCalculado = costoServicios + cancionesExtra

  if (totalCalculado === 0)
    throw new AppError('El total debe ser mayor a cero. Selecciona un tipo de serenata.', 400)

  if (Number(totalAmount) !== totalCalculado)
    throw new AppError(
      `El total no coincide. Esperado: $${totalCalculado.toLocaleString('es-CO')}, recibido: $${Number(totalAmount).toLocaleString('es-CO')}`,
      400
    )
}

const calcularEndTime = (startTime: string, horas: number): string => {
  const [h, m]       = startTime.split(':').map(Number)
  const totalMinutes = h * 60 + m + horas * 60
  const newH         = Math.floor(totalMinutes / 60) % 24
  const newM         = totalMinutes % 60
  return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`
}