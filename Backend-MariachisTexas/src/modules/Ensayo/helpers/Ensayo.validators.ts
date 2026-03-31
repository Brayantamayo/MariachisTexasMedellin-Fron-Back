import prisma from '../../../config/prisma'
import { AppError } from '../../../utils/AppError'
import { toLocalTime, dayRange } from '../../../utils/date.helpers'

// ─── validateDisponibilidad ───────────────────────────────────────────────────
// Verifica que la fecha/hora del ensayo no conflictúe con:
//   1. Bloqueos de calendario
//   2. Cotizaciones activas del mismo día
//   3. Reservas activas del mismo día
//   4. Otro ensayo en el rango de ±1 hora
export const validateDisponibilidad = async (
  date:       string,
  time:       string,
  excludeId?: number
): Promise<void> => {
  const fechaHora            = new Date(`${date}T${time}:00`)
  const { dayStart, dayEnd } = dayRange(date)
  const bufferAntes          = new Date(fechaHora.getTime() - 60 * 60 * 1000)
  const bufferDespues        = new Date(fechaHora.getTime() + 60 * 60 * 1000)

  // ✅ Verificaciones independientes en paralelo
  const [bloqueo, cotActivas, reservas, ensayoConflicto] = await Promise.all([
    prisma.bloqueoCalendario.findFirst({
      where: { fechaInicio: { lte: bufferDespues }, fechaFin: { gte: bufferAntes } },
    }),
    prisma.cotizacion.findMany({
      where: {
        fechaEvento: { gte: dayStart, lte: dayEnd },
        estado:      { in: ['EN_ESPERA', 'CONVERTIDA'] },
      },
    }),
    prisma.reserva.findMany({
      where: {
        estado:     { in: ['PENDIENTE', 'CONFIRMADA'] },
        cotizacion: { fechaEvento: { gte: dayStart, lte: dayEnd } },
      },
      include: { cotizacion: true },
    }),
    prisma.ensayo.findFirst({
      where: {
        estado:    'PENDIENTE',
        fechaHora: { gte: bufferAntes, lte: bufferDespues },
        id:        excludeId ? { not: excludeId } : undefined,
      },
    }),
  ])

  if (bloqueo)
    throw new AppError(
      `Fecha bloqueada: ${bloqueo.motivo?.replace(/^[A-Z_]+:/, '').split('|')[0] || 'No disponible'}`,
      409
    )

  for (const cot of cotActivas) {
    const unaHAntesDeInicio = new Date(cot.horaInicio.getTime() - 60 * 60 * 1000)
    if (fechaHora >= unaHAntesDeInicio && fechaHora < cot.horaFin)
      throw new AppError(
        `Conflicto con cotización activa (${toLocalTime(cot.horaInicio)} - ${toLocalTime(cot.horaFin)})`,
        409
      )
  }

  for (const r of reservas) {
    const unaHAntesDeInicio = new Date(r.cotizacion.horaInicio.getTime() - 60 * 60 * 1000)
    if (fechaHora >= unaHAntesDeInicio && fechaHora < r.cotizacion.horaFin)
      throw new AppError(
        `Conflicto con reserva existente (${toLocalTime(r.cotizacion.horaInicio)} - ${toLocalTime(r.cotizacion.horaFin)})`,
        409
      )
  }

  if (ensayoConflicto)
    throw new AppError(
      `Ya existe un ensayo programado a las ${toLocalTime(ensayoConflicto.fechaHora)}`,
      409
    )
}