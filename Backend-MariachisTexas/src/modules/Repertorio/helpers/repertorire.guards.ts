import prisma from '../../../config/prisma'
import { AppError } from '../../../utils/AppError'

// ─── verificarCancionEnUso ────────────────────────────────────────────────────
// Verifica si la canción está vinculada a cotizaciones o reservas activas.
// contexto 'desactivar' incluye además la verificación de ensayos.
// Todas las queries corren en paralelo con Promise.all.

type ContextoCancion = 'editar' | 'desactivar'

export const verificarCancionEnUso = async (
  id:       number,
  contexto: ContextoCancion
): Promise<void> => {
  const prefijo = contexto === 'editar' ? 'editar' : 'desactivar'

  const checks: Promise<unknown>[] = [
    prisma.cotizacionRepertorio.findFirst({
      where: {
        repertorioId: id,
        cotizacion: { estado: { in: ['EN_ESPERA'] } },
      },
    }),
    prisma.cotizacionRepertorio.findFirst({
      where: {
        repertorioId: id,
        cotizacion: {
          estado:  'CONVERTIDA',
          reserva: { estado: { in: ['PENDIENTE', 'CONFIRMADA'] } },
        },
      },
    }),
  ]

  if (contexto === 'desactivar') {
    checks.push(
      prisma.ensayoRepertorio.findFirst({ where: { repertorioId: id } })
    )
  }

  const [enCotizacion, enReserva, enEnsayo] = await Promise.all(checks)

  if (enCotizacion)
    throw new AppError(
      `No se puede ${prefijo}: la canción está en una cotización pendiente de revisión.`,
      409
    )
  if (enReserva)
    throw new AppError(
      `No se puede ${prefijo}: la canción está incluida en una reserva activa o confirmada.`,
      409
    )
  if (enEnsayo)
    throw new AppError('No se puede desactivar: la canción está programada en un ensayo.', 409)
}