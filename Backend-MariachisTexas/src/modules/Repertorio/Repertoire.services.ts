import prisma from '../../config/prisma'
import { RepertorioCreateSchema, RepertorioUpdateSchema, zodError } from '../schemas'
import type { RepertorioCreateInput, RepertorioUpdateInput, SongResponse } from '../../types/interfaces'

// ─── HELPER: normaliza texto para comparación ─────────────────────────────────
const normalizar = (s: string) =>
  s.trim()
   .toLowerCase()
   .normalize('NFD')
   .replace(/[\u0300-\u036f]/g, '')
   .replace(/\s+/g, ' ')

// ─── HELPER: detecta texto gibberish ─────────────────────────────────────────
const esTextoGibberish = (texto: string): boolean => {
  const lower = texto.toLowerCase().replace(/\s/g, '')
  if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(lower)) return true
  if (/(.)\1{4,}/.test(lower))                     return true
  if (lower.length > 10) {
    const vocales = (lower.match(/[aeiouáéíóú]/g) || []).length
    if (vocales / lower.length < 0.10)             return true
  }
  return false
}

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
  if (!Number.isInteger(id) || id <= 0)
    throw new Error('El ID de la canción no es válido')

  const song = await prisma.repertorio.findUnique({ where: { id } })
  if (!song) throw new Error('Canción no encontrada')
  return mapToSong(song)
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const createSong = async (data: RepertorioCreateInput): Promise<SongResponse> => {
  const trimmed = {
    ...data,
    title:  typeof data.title  === 'string' ? data.title.trim()  : data.title,
    artist: typeof data.artist === 'string' ? data.artist.trim() : data.artist,
    lyrics: typeof data.lyrics === 'string' ? data.lyrics.trim() : data.lyrics,
  }

  if (!trimmed.title)  throw new Error('El título no puede estar vacío o contener solo espacios')
  if (!trimmed.artist) throw new Error('El artista no puede estar vacío o contener solo espacios')

  if (esTextoGibberish(trimmed.title))
    throw new Error('El título parece contener texto sin sentido. Por favor ingresa un título real')
  if (esTextoGibberish(trimmed.artist))
    throw new Error('El artista parece contener texto sin sentido. Por favor ingresa un artista real')

  const parsed = RepertorioCreateSchema.safeParse(trimmed)
  if (!parsed.success) throw new Error(zodError(parsed.error))

  // ✅ Verificar canción duplicada (mismo título + artista, normalizado)
  const canciones = await prisma.repertorio.findMany({ select: { titulo: true, artista: true } })
  const tituloNorm  = normalizar(parsed.data.title)
  const artistaNorm = normalizar(parsed.data.artist)
  const duplicada   = canciones.find(
    c => normalizar(c.titulo) === tituloNorm && normalizar(c.artista) === artistaNorm
  )
  if (duplicada)
    throw new Error(`Ya existe la canción "${duplicada.titulo}" de "${duplicada.artista}" en el repertorio`)

  // ✅ Validar duración coherente
  const [minStr, secStr] = parsed.data.duration.split(':')
  const minutos  = Number(minStr)
  const segundos = Number(secStr)
  if (minutos === 0 && segundos === 0) throw new Error('La duración no puede ser 0:00')
  if (minutos > 15)                    throw new Error('La duración no puede superar 15 minutos')

  const song = await prisma.repertorio.create({ data: mapToPrisma(parsed.data) })
  return mapToSong(song)
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const updateSong = async (id: number, data: RepertorioUpdateInput): Promise<SongResponse> => {
  if (!Number.isInteger(id) || id <= 0)
    throw new Error('El ID de la canción no es válido')

  const exists = await prisma.repertorio.findUnique({ where: { id } })
  if (!exists) throw new Error('Canción no encontrada')

  // ✅ No permitir editar si está desactivada
  if (!exists.activa)
    throw new Error('No se puede editar una canción desactivada. Actívala primero para poder modificarla')

  const trimmed = {
    ...data,
    title:  typeof data.title  === 'string' ? data.title.trim()  : data.title,
    artist: typeof data.artist === 'string' ? data.artist.trim() : data.artist,
    lyrics: typeof data.lyrics === 'string' ? data.lyrics.trim() : data.lyrics,
  }

  if (trimmed.title  !== undefined && !trimmed.title)  throw new Error('El título no puede quedar vacío')
  if (trimmed.artist !== undefined && !trimmed.artist) throw new Error('El artista no puede quedar vacío')

  if (trimmed.title  && esTextoGibberish(trimmed.title))
    throw new Error('El título parece contener texto sin sentido')
  if (trimmed.artist && esTextoGibberish(trimmed.artist))
    throw new Error('El artista parece contener texto sin sentido')

  const parsed = RepertorioUpdateSchema.safeParse(trimmed)
  if (!parsed.success) throw new Error(zodError(parsed.error))

  // ✅ Si cambia título o artista, verificar duplicado normalizado
  if (parsed.data.title || parsed.data.artist) {
    const nuevoTitulo  = normalizar(parsed.data.title  ?? exists.titulo)
    const nuevoArtista = normalizar(parsed.data.artist ?? exists.artista)
    const canciones    = await prisma.repertorio.findMany({
      where:  { id: { not: id } },
      select: { titulo: true, artista: true }
    })
    const duplicada = canciones.find(
      c => normalizar(c.titulo) === nuevoTitulo && normalizar(c.artista) === nuevoArtista
    )
    if (duplicada)
      throw new Error(`Ya existe la canción "${duplicada.titulo}" de "${duplicada.artista}" en el repertorio`)
  }

  // ✅ Validar duración si se actualiza
  if (parsed.data.duration) {
    const [minStr, secStr] = parsed.data.duration.split(':')
    const minutos  = Number(minStr)
    const segundos = Number(secStr)
    if (minutos === 0 && segundos === 0) throw new Error('La duración no puede ser 0:00')
    if (minutos > 15)                    throw new Error('La duración no puede superar 15 minutos')
  }

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
  if (!Number.isInteger(id) || id <= 0)
    throw new Error('El ID de la canción no es válido')

  const exists = await prisma.repertorio.findUnique({ where: { id } })
  if (!exists) throw new Error('Canción no encontrada')

  // ✅ Solo verificar uso si se va a DESACTIVAR (no al activar)
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
  if (!Number.isInteger(id) || id <= 0)
    throw new Error('El ID de la canción no es válido')

  const exists = await prisma.repertorio.findUnique({ where: { id } })
  if (!exists) throw new Error('Canción no encontrada')

  // ✅ Solo se puede eliminar si está desactivada
  if (exists.activa)
    throw new Error('Debes desactivar la canción antes de eliminarla')

  const enUso = await prisma.cotizacionRepertorio.findFirst({
    where: { repertorioId: id, cotizacion: { estado: { in: ['EN_ESPERA', 'CONVERTIDA'] } } },
  })
  if (enUso) throw new Error('No se puede eliminar: la canción está asociada a una cotización activa.')

  await prisma.repertorio.delete({ where: { id } })
  return { message: 'Canción eliminada correctamente' }
}