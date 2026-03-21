import prisma from '../../config/prisma'
import { RepertorioCreateSchema, RepertorioUpdateSchema, zodError } from '../schemas'
import type { RepertorioCreateInput, RepertorioUpdateInput, SongResponse } from '../../types/interfaces'

// ─── MAPPERS ──────────────────────────────────────────────────────────────────
const mapToSong = (r: any): SongResponse => ({
  id:         String(r.id),
  title:      r.titulo,
  artist:     r.artista,
  genre:      r.genero,
  category:   r.categoria,
  lyrics:     r.letra      ?? '',
  audioUrl:   r.audioUrl   ?? '',
  duration:   r.duracion,
  difficulty: r.dificultad as 'Baja' | 'Media' | 'Alta',
  coverImage: r.portada    ?? '',
  isActive:   r.activa,
  createdAt:  r.createdAt?.toISOString(),
  updatedAt:  r.updatedAt?.toISOString(),
})

const mapToPrisma = (data: RepertorioCreateInput) => ({
  titulo:     data.title?.trim(),
  artista:    data.artist?.trim(),
  genero:     data.genre,
  categoria:  data.category,
  letra:      data.lyrics     || null,
  audioUrl:   data.audioUrl   || null,
  duracion:   data.duration?.trim(),
  dificultad: data.difficulty || 'Media',
  portada:    data.coverImage || null,
  activa:     data.isActive   ?? true,
})

// ─── QUERIES ──────────────────────────────────────────────────────────────────
export const getSongs = async (): Promise<SongResponse[]> => {
  const songs = await prisma.repertorio.findMany({ orderBy: { createdAt: 'desc' } })
  return songs.map(mapToSong)
}

export const getSongsPublic = async (): Promise<SongResponse[]> => {
  const songs = await prisma.repertorio.findMany({
    where:   { activa: true },
    orderBy: { titulo: 'asc' },
  })
  return songs.map(mapToSong)
}

export const getSongById = async (id: number): Promise<SongResponse> => {
  const song = await prisma.repertorio.findUnique({ where: { id } })
  if (!song) throw new Error('Canción no encontrada')
  return mapToSong(song)
}

export const createSong = async (data: RepertorioCreateInput): Promise<SongResponse> => {
  const parsed = RepertorioCreateSchema.safeParse(data)
  if (!parsed.success) throw new Error(zodError(parsed.error))
  const song = await prisma.repertorio.create({ data: mapToPrisma(parsed.data) })
  return mapToSong(song)
}

export const updateSong = async (id: number, data: RepertorioUpdateInput): Promise<SongResponse> => {
  const exists = await prisma.repertorio.findUnique({ where: { id } })
  if (!exists) throw new Error('Canción no encontrada')

  const parsed = RepertorioUpdateSchema.safeParse(data)
  if (!parsed.success) throw new Error(zodError(parsed.error))

  const updateData: Partial<ReturnType<typeof mapToPrisma>> = {}
  if (parsed.data.title      !== undefined) updateData.titulo     = parsed.data.title?.trim()
  if (parsed.data.artist     !== undefined) updateData.artista    = parsed.data.artist?.trim()
  if (parsed.data.genre      !== undefined) updateData.genero     = parsed.data.genre
  if (parsed.data.category   !== undefined) updateData.categoria  = parsed.data.category
  if (parsed.data.lyrics     !== undefined) updateData.letra      = parsed.data.lyrics || null
  if (parsed.data.audioUrl   !== undefined) updateData.audioUrl   = parsed.data.audioUrl || null
  if (parsed.data.duration   !== undefined) updateData.duracion   = parsed.data.duration?.trim()
  if (parsed.data.difficulty !== undefined) updateData.dificultad = parsed.data.difficulty
  if (parsed.data.coverImage !== undefined) updateData.portada    = parsed.data.coverImage || null
  if (parsed.data.isActive   !== undefined) updateData.activa     = parsed.data.isActive

  const song = await prisma.repertorio.update({ where: { id }, data: updateData })
  return mapToSong(song)
}

// ─── TOGGLE ACTIVA/INACTIVA ───────────────────────────────────────────────────
export const toggleStatus = async (id: number): Promise<SongResponse> => {
  const exists = await prisma.repertorio.findUnique({ where: { id } })
  if (!exists) throw new Error('Canción no encontrada')

  if (exists.activa) {
    const [enCotizacionActiva, enReservaActiva, enEnsayo] = await Promise.all([
      prisma.cotizacionRepertorio.findFirst({
        where: { repertorioId: id, cotizacion: { estado: { in: ['EN_ESPERA'] } } },
      }),
      prisma.cotizacionRepertorio.findFirst({
        where: {
          repertorioId: id,
          cotizacion: { estado: 'CONVERTIDA', reserva: { estado: { in: ['PENDIENTE', 'CONFIRMADA'] } } },
        },
      }),
      prisma.ensayoRepertorio.findFirst({ where: { repertorioId: id } }),
    ])

    if (enCotizacionActiva)
      throw new Error('No se puede desactivar: la canción está en una cotización pendiente de revisión.')
    if (enReservaActiva)
      throw new Error('No se puede desactivar: la canción está incluida en una reserva activa o confirmada.')
    if (enEnsayo)
      throw new Error('No se puede desactivar: la canción está programada en un ensayo.')
  }

  const song = await prisma.repertorio.update({ where: { id }, data: { activa: !exists.activa } })
  return mapToSong(song)
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const deleteSong = async (id: number) => {
  const exists = await prisma.repertorio.findUnique({ where: { id } })
  if (!exists) throw new Error('Canción no encontrada')

  const enUso = await prisma.cotizacionRepertorio.findFirst({
    where: { repertorioId: id, cotizacion: { estado: { in: ['EN_ESPERA', 'CONVERTIDA'] } } },
  })
  if (enUso) throw new Error('No se puede eliminar: la canción está asociada a una cotización activa.')

  await prisma.repertorio.delete({ where: { id } })
  return { message: 'Canción eliminada correctamente' }
}