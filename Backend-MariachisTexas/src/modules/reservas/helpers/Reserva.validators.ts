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
  const bufferInicio = new Date(inicio.getTime() - 60 * 60 * 1000)
  const bufferFin    = new Date(fin.getTime() + 60 * 60 * 1000)

  const [bloqueo, cotizaciones, reservas, ensayos] = await Promise.all([
    // 1. Bloqueos manuales
    prisma.bloqueoCalendario.findFirst({
      where: { fechaInicio: { lt: fin }, fechaFin: { gt: inicio } },
    }),
    // 2. Cotizaciones activas (con buffer de 1h antes y después)
    prisma.cotizacion.findMany({
      where: {
        estado:     { in: ['EN_ESPERA', 'CONVERTIDA'] },
        horaInicio: { lt: bufferFin },
        horaFin:    { gt: bufferInicio },
        ...(excludeCotizacionId ? { id: { not: excludeCotizacionId } } : {}),
        reserva:    null, // Ignorar las que ya son reservas para no duplicar
      },
    }),
    // 3. Reservas activas (con buffer de 1h antes y después)
    prisma.reserva.findMany({
      where: {
        estado:     { in: ['PENDIENTE', 'CONFIRMADA'] },
        cotizacion: {
          horaInicio: { lt: bufferFin },
          horaFin:    { gt: bufferInicio }
        },
        ...(excludeReservaId ? { id: { not: excludeReservaId } } : {}),
      },
      include: { cotizacion: true },
    }),
    // 4. Ensayos (con buffer de 1h antes y después)
    prisma.ensayo.findMany({
      where: {
        estado:    { not: EstadoEnsayo.LISTO },
        fechaHora: { lt: bufferFin, gt: bufferInicio }, // Los ensayos son una hora puntual, el buffer los cubre
      },
    }),
  ])

  if (bloqueo)
    throw new AppError(
      `Fecha bloqueada: ${bloqueo.motivo?.replace(/^[A-Z_]+:/, '').split('|')[0] || 'No disponible'}`,
      409
    )

  for (const cot of cotizaciones) {
    const realFin = cot.horaFin < cot.horaInicio ? new Date(cot.horaFin.getTime() + 24 * 60 * 60 * 1000) : cot.horaFin
    if (inicio < realFin && fin > cot.horaInicio)
      throw new AppError(
        `Conflicto con cotización activa (${toLocalTime(cot.horaInicio)} - ${toLocalTime(cot.horaFin)})`,
        409
      )
  }

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
  for (let i = 0; i <= 23; i++) allHours.push(`${i.toString().padStart(2, '0')}:00`)

  const { dayStart, dayEnd } = dayRange(dateStr)
  // Expandir el rango de búsqueda 3 horas antes y después para capturar solapamientos de días vecinos (duración + buffers)
  const searchStart = new Date(dayStart.getTime() - 4 * 60 * 60 * 1000)
  const searchEnd   = new Date(dayEnd.getTime() + 4 * 60 * 60 * 1000)

  const blocked = new Set<string>()

  const [bloqueos, cotizaciones, reservas, ensayos] = await Promise.all([
    prisma.bloqueoCalendario.findMany({
      where: { fechaInicio: { lt: searchEnd }, fechaFin: { gt: searchStart } },
    }),
    prisma.cotizacion.findMany({
      where: {
        estado:     { in: ['EN_ESPERA', 'CONVERTIDA'] },
        horaInicio: { lt: searchEnd },
        horaFin:    { gt: searchStart },
        reserva:    null,
      },
    }),
    prisma.reserva.findMany({
      where: {
        estado:     { in: ['PENDIENTE', 'CONFIRMADA'] },
        cotizacion: { horaInicio: { lt: searchEnd }, horaFin: { gt: searchStart } },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      include: { cotizacion: true },
    }),
    prisma.ensayo.findMany({
      where: {
        estado:    { not: EstadoEnsayo.LISTO },
        fechaHora: { lt: searchEnd, gt: searchStart },
      },
    }),
  ])

  // Bloquear horas que se solapen con cualquier evento encontrado
  allHours.forEach(h => {
    const hourDate = new Date(`${dateStr}T${h}:00`)
    
    // Check bloqueos manuales
    for (const b of bloqueos) {
      if (hourDate >= b.fechaInicio && hourDate < b.fechaFin) {
        blocked.add(h)
        break
      }
    }
    if (blocked.has(h)) return

    // Check cotizaciones y reservas (con buffer 1h antes y 1h después)
    const checkOverlap = (start: Date, end: Date) => {
      const realEnd = end < start ? new Date(end.getTime() + 24 * 60 * 60 * 1000) : end;
      const bufferStart = new Date(start.getTime() - 60 * 60 * 1000)
      const bufferEnd   = new Date(realEnd.getTime() + 60 * 60 * 1000)
      return hourDate >= bufferStart && hourDate < bufferEnd
    }

    for (const c of cotizaciones) {
      if (checkOverlap(c.horaInicio, c.horaFin)) {
        blocked.add(h)
        break
      }
    }
    if (blocked.has(h)) return

    for (const r of reservas) {
      if (r.cotizacion && checkOverlap(r.cotizacion.horaInicio, r.cotizacion.horaFin)) {
        blocked.add(h)
        break
      }
    }
    if (blocked.has(h)) return

    // Check ensayos (buffer 1h antes y 1h después)
    for (const e of ensayos) {
      const bStart = new Date(e.fechaHora.getTime() - 60 * 60 * 1000)
      const bEnd   = new Date(e.fechaHora.getTime() + 60 * 60 * 1000)
      if (hourDate >= bStart && hourDate < bEnd) {
        blocked.add(h)
        break
      }
    }
  })

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
  const PRECIO_CANCION_EXTRA  = 10000
  const SERENATA_KEYWORDS     = ['serenata urbana', 'serenata rural']
  const HORA_EXTRA_KEYWORD    = 'hora extra'
  const CANCION_EXTRA_KEYWORD = 'cancion extra'

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

  const cancionExtraService = serviciosDB.find(s => normalize(s.nombre).includes(CANCION_EXTRA_KEYWORD))
  const cancionesExtraQty   = cancionExtraService
    ? (selectedServices.find(s => Number(s.serviceId) === cancionExtraService.id)?.quantity ?? 0)
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

  // Canciones incluidas: 7 por cada hora de servicio
  const cancionesIncluidasTotal = (1 + horasExtra) * 7
  
  // Total permitido = incluidas + compradas como servicio adicional
  const totalCancionesPermitidas = cancionesIncluidasTotal + cancionesExtraQty
  const cancionesSeleccionadas   = repertoireIds?.length ?? 0

  // Si se excede el total permitido, se cobra cada una al precio de canción extra
  const cancionesExceso = cancionesSeleccionadas > totalCancionesPermitidas
    ? (cancionesSeleccionadas - totalCancionesPermitidas) * PRECIO_CANCION_EXTRA
    : 0

  const totalCalculado = costoServicios + cancionesExceso

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