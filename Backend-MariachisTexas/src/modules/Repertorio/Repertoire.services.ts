import prisma from '../../config/prisma'
import { RepertorioCreateSchema, RepertorioUpdateSchema, zodError } from '../schemas'
import { AppError } from '../../utils/AppError'
import { mapToSong, mapToPrisma }           from './helpers/repertoire.mappers'
import { validarDuracion, verificarDuplicado } from './helpers/repertoire.validators'
import { verificarCancionEnUso }             from './helpers/repertorire.guards'
import type { RepertorioCreateInput, RepertorioUpdateInput, SongResponse } from '../../types/interfaces'

// ───OBTENER CANCION──────────────────────────────────────────────────────────────────
export const getSongs = async (): Promise<SongResponse[]> => {
  const songs = await prisma.repertorio.findMany({ orderBy: { createdAt: 'desc' } })
  return songs.map(mapToSong)
}
// ─── OBTENER PUBLICAMENTE PARA EL REPERTORIO PUBLICO──────────────────────────────────────────────────────────────────
export const getSongsPublic = async (): Promise<SongResponse[]> => {
  const songs = await prisma.repertorio.findMany({
    where:   { activa: true },
    orderBy: { titulo: 'asc' },
  })
  return songs.map(mapToSong)
}
// ─── BUSCAR POR ID──────────────────────────────────────────────────────────────────
export const getSongById = async (id: number): Promise<SongResponse> => {
  if (!Number.isInteger(id) || id <= 0)
    throw new AppError('El ID de la canción no es válido', 400)

  const song = await prisma.repertorio.findUnique({ where: { id } })
  if (!song) throw new AppError('Canción no encontrada', 404)
  return mapToSong(song)
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const createSong = async (data: RepertorioCreateInput): Promise<SongResponse> => {
  const parsed = RepertorioCreateSchema.safeParse(data)
  if (!parsed.success) throw new AppError(zodError(parsed.error), 400)

  await verificarDuplicado(parsed.data.title, parsed.data.artist)
  validarDuracion(parsed.data.duration)

  const song = await prisma.repertorio.create({ data: mapToPrisma(parsed.data) })
  return mapToSong(song)
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const updateSong = async (id: number, data: RepertorioUpdateInput): Promise<SongResponse> => {
  if (!Number.isInteger(id) || id <= 0)
    throw new AppError('El ID de la canción no es válido', 400)

  const exists = await prisma.repertorio.findUnique({ where: { id } })
  if (!exists) throw new AppError('Canción no encontrada', 404)

  if (!exists.activa)
    throw new AppError('No se puede editar una canción desactivada. Actívala primero para poder modificarla', 409)

  await verificarCancionEnUso(id, 'editar')

  const parsed = RepertorioUpdateSchema.safeParse(data)
  if (!parsed.success) throw new AppError(zodError(parsed.error), 400)

  if (parsed.data.title || parsed.data.artist) {
    await verificarDuplicado(
      parsed.data.title  ?? exists.titulo,
      parsed.data.artist ?? exists.artista,
      id
    )
  }

  if (parsed.data.duration) validarDuracion(parsed.data.duration)

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

// ─── CAMBIO DE ESTADO  ───────────────────────────────────────────────────
export const toggleStatus = async (id: number): Promise<SongResponse> => {
  if (!Number.isInteger(id) || id <= 0)
    throw new AppError('El ID de la canción no es válido', 400)

  const exists = await prisma.repertorio.findUnique({ where: { id } })
  if (!exists) throw new AppError('Canción no encontrada', 404)

  if (exists.activa) await verificarCancionEnUso(id, 'desactivar')

  const song = await prisma.repertorio.update({ where: { id }, data: { activa: !exists.activa } })
  return mapToSong(song)
}

// ─── ELIMINAR ───────────────────────────────────────────────────────────────────
export const deleteSong = async (id: number) => {
  if (!Number.isInteger(id) || id <= 0)
    throw new AppError('El ID de la canción no es válido', 400)

  const exists = await prisma.repertorio.findUnique({ where: { id } })
  if (!exists) throw new AppError('Canción no encontrada', 404)

  if (exists.activa)
    throw new AppError('Debes desactivar la canción antes de eliminarla', 409)

  const enUso = await prisma.cotizacionRepertorio.findFirst({
    where: {
      repertorioId: id,
      cotizacion: { estado: { in: ['EN_ESPERA', 'CONVERTIDA'] } },
    },
  })
  if (enUso)
    throw new AppError('No se puede eliminar: la canción está asociada a una cotización activa.', 409)

  await prisma.$transaction([
    prisma.cotizacionRepertorio.deleteMany({ where: { repertorioId: id } }),
    prisma.ensayoRepertorio.deleteMany({ where: { repertorioId: id } }),
    prisma.repertorio.delete({ where: { id } }),
  ])

  return { message: 'Canción eliminada correctamente' }
}