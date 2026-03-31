import prisma from '../../../config/prisma'
import { normalizar } from '../../../utils/normalizar'
import { AppError } from '../../../utils/AppError'

// ─── validarDuracion ──────────────────────────────────────────────────────────
// Valida que la duración sea coherente: no 0:00 y no más de 15 minutos.
// Usado en createSong y updateSong.
export const validarDuracion = (duracion: string): void => {
  const [minStr, secStr] = duracion.split(':')
  const minutos  = Number(minStr)
  const segundos = Number(secStr)
  if (minutos === 0 && segundos === 0) throw new AppError('La duración no puede ser 0:00', 400)
  if (minutos > 15)                    throw new AppError('La duración no puede superar 15 minutos', 400)
}

// ─── verificarDuplicado ───────────────────────────────────────────────────────
// Verifica que no exista otra canción con el mismo título + artista (normalizado).
// Acepta excludeId para ignorar el registro actual en updates.
export const verificarDuplicado = async (
  titulo:    string,
  artista:   string,
  excludeId?: number
): Promise<void> => {
  const canciones = await prisma.repertorio.findMany({
    where:  excludeId ? { id: { not: excludeId } } : {},
    select: { titulo: true, artista: true },
  })
  const tituloNorm  = normalizar(titulo)
  const artistaNorm = normalizar(artista)
  const duplicada   = canciones.find(
    c => normalizar(c.titulo) === tituloNorm && normalizar(c.artista) === artistaNorm
  )
  if (duplicada)
    throw new AppError(
      `Ya existe la canción "${duplicada.titulo}" de "${duplicada.artista}" en el repertorio`,
      409
    )
}