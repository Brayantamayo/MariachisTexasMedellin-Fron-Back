import prisma from '../../config/prisma'

// ─── MAPEO Prisma → Frontend (español → inglés) ───────────────────────────────
const mapToSong = (r: any) => ({
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

// ─── MAPEO Frontend → Prisma (inglés → español) ───────────────────────────────
const mapToPrisma = (data: any) => ({
  titulo:     data.title,
  artista:    data.artist,
  genero:     data.genre,
  categoria:  data.category,
  letra:      data.lyrics     ?? null,
  audioUrl:   data.audioUrl   ?? null,
  duracion:   data.duration,
  dificultad: data.difficulty,
  portada:    data.coverImage ?? null,
  activa:     data.isActive   ?? true,
})

// ─── GET ALL ──────────────────────────────────────────────────────────────────
export const getSongs = async () => {
  const songs = await prisma.repertorio.findMany({
    orderBy: { createdAt: 'desc' }
  })
  return songs.map(mapToSong)
}

// ─── GET PUBLIC — solo activas (landing) ─────────────────────────────────────
export const getSongsPublic = async () => {
  const songs = await prisma.repertorio.findMany({
    where:   { activa: true },
    orderBy: { titulo: 'asc' }
  })
  return songs.map(mapToSong)
}

// ─── GET BY ID ────────────────────────────────────────────────────────────────
export const getSongById = async (id: number) => {
  const song = await prisma.repertorio.findUnique({ where: { id } })
  if (!song) throw new Error('Canción no encontrada')
  return mapToSong(song)
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const createSong = async (data: any) => {
  // Validaciones
  if (!data.title?.trim())    throw new Error('El título es requerido')
  if (!data.artist?.trim())   throw new Error('El artista es requerido')
  if (!data.genre?.trim())    throw new Error('El género es requerido')
  if (!data.category?.trim()) throw new Error('La categoría es requerida')
  if (!data.duration?.trim()) throw new Error('La duración es requerida')
  if (!['Baja', 'Media', 'Alta'].includes(data.difficulty)) {
    throw new Error('La dificultad debe ser Baja, Media o Alta')
  }

  const song = await prisma.repertorio.create({ data: mapToPrisma(data) })
  return mapToSong(song)
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const updateSong = async (id: number, data: any) => {
  const exists = await prisma.repertorio.findUnique({ where: { id } })
  if (!exists) throw new Error('Canción no encontrada')

  // Solo actualizar campos enviados
  const updateData: any = {}
  if (data.title      !== undefined) updateData.titulo     = data.title
  if (data.artist     !== undefined) updateData.artista    = data.artist
  if (data.genre      !== undefined) updateData.genero     = data.genre
  if (data.category   !== undefined) updateData.categoria  = data.category
  if (data.lyrics     !== undefined) updateData.letra      = data.lyrics
  if (data.audioUrl   !== undefined) updateData.audioUrl   = data.audioUrl
  if (data.duration   !== undefined) updateData.duracion   = data.duration
  if (data.difficulty !== undefined) updateData.dificultad = data.difficulty
  if (data.coverImage !== undefined) updateData.portada    = data.coverImage
  if (data.isActive   !== undefined) updateData.activa     = data.isActive

  const song = await prisma.repertorio.update({ where: { id }, data: updateData })
  return mapToSong(song)
}

// ─── TOGGLE ACTIVA ────────────────────────────────────────────────────────────
export const toggleStatus = async (id: number) => {
  const exists = await prisma.repertorio.findUnique({ where: { id } })
  if (!exists) throw new Error('Canción no encontrada')

  const song = await prisma.repertorio.update({
    where: { id },
    data:  { activa: !exists.activa }
  })
  return mapToSong(song)
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const deleteSong = async (id: number) => {
  const exists = await prisma.repertorio.findUnique({ where: { id } })
  if (!exists) throw new Error('Canción no encontrada')

  await prisma.repertorio.delete({ where: { id } })
  return { message: 'Canción eliminada correctamente' }
}