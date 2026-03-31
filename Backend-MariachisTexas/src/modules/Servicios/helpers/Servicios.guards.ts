import prisma from '../../../config/prisma'
import { AppError } from '../../../utils/AppError'

// ─── verificarServicioEnUso ───────────────────────────────────────────────────
// Verifica si el servicio está vinculado a cotizaciones o reservas activas.
// Las dos queries corren en paralelo con Promise.all.

type ContextoServicio = 'editar' | 'eliminar'

export const verificarServicioEnUso = async (
  id:       number,
  contexto: ContextoServicio
): Promise<void> => {
  const mensajes = {
    editar: {
      cotizacion: 'No se puede modificar un servicio que está en una cotización pendiente',
      reserva:    'No se puede modificar un servicio que está en una reserva activa',
    },
    eliminar: {
      cotizacion: 'No se permite eliminar el servicio porque está en una cotización pendiente',
      reserva:    'No se permite eliminar el servicio porque está en una reserva activa',
    },
  }

  const [enCotizacion, enReserva] = await Promise.all([
    prisma.cotizacionServicio.findFirst({
      where: {
        servicioId: id,
        cotizacion: { estado: 'EN_ESPERA' },
      },
    }),
    prisma.cotizacionServicio.findFirst({
      where: {
        servicioId: id,
        cotizacion: {
          estado:  'CONVERTIDA',
          reserva: { estado: { in: ['PENDIENTE', 'CONFIRMADA'] } },
        },
      },
    }),
  ])

  if (enCotizacion) throw new AppError(mensajes[contexto].cotizacion, 409)
  if (enReserva)    throw new AppError(mensajes[contexto].reserva, 409)
}