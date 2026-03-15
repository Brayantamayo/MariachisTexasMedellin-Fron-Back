import prisma from '../../config/prisma'

// ─── CONSTANTES DE VALIDACIÓN ─────────────────────────────────────────────────
const GENEROS_VALIDOS      = ['Ranchera', 'Bolero', 'Son', 'Corrido', 'Huapango', 'Balada']
const CATEGORIAS_VALIDAS   = ['Serenata', 'Boda', 'Cumpleaños', 'Fúnebre', 'Show', 'Clásicos']
const DIFICULTADES_VALIDAS = ['Baja', 'Media', 'Alta']
const CLOUDINARY_DOMAIN    = 'res.cloudinary.com'
const IMAGE_EXTENSIONS     = ['.jpg', '.jpeg', '.png', '.webp']
const AUDIO_EXTENSIONS     = ['.mp3', '.wav', '.ogg', '.mp4', '.mpeg']

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const isValidUrl = (url: string): boolean => {
  try { new URL(url); return true } catch { return false }
}

const isValidImageUrl = (url: string): boolean => {
  if (!isValidUrl(url)) return false
  const lower = url.toLowerCase()
  return url.includes(CLOUDINARY_DOMAIN) || IMAGE_EXTENSIONS.some(ext => lower.includes(ext))
}

const isValidAudioUrl = (url: string): boolean => {
  if (!isValidUrl(url)) return false
  const lower = url.toLowerCase()
  return url.includes(CLOUDINARY_DOMAIN) || AUDIO_EXTENSIONS.some(ext => lower.includes(ext))
}

const isValidDuration = (d: string): boolean => /^\d{1,2}:\d{2}$/.test(d.trim())

// ─── VALIDACIÓN CREAR ─────────────────────────────────────────────────────────
const validateCreate = (data: any) => {
  const errors: string[] = []

  // Título
  if (!data.title?.trim())
    errors.push('El título es requerido')
  else if (data.title.trim().length < 2)
    errors.push('El título debe tener al menos 2 caracteres')
  else if (data.title.trim().length > 100)
    errors.push('El título no puede superar 100 caracteres')
  else if (data.title.trim().match(/^\d+$/))
    errors.push('El título no puede ser solo números')

  // Artista
  if (!data.artist?.trim())
    errors.push('El artista es requerido')
  else if (data.artist.trim().length < 2)
    errors.push('El artista debe tener al menos 2 caracteres')
  else if (data.artist.trim().length > 80)
    errors.push('El artista no puede superar 80 caracteres') 
  else if (data.artist.trim().match(/^\d+$/))
    errors.push('El artista no puede ser solo números')

  // Género
  if (!data.genre?.trim())
    errors.push('El género es requerido')
  else if (!GENEROS_VALIDOS.includes(data.genre))
    errors.push(`Género inválido. Opciones: ${GENEROS_VALIDOS.join(', ')}`)

  // Categoría
  if (!data.category?.trim())
    errors.push('La categoría es requerida')
  else if (!CATEGORIAS_VALIDAS.includes(data.category))
    errors.push(`Categoría inválida. Opciones: ${CATEGORIAS_VALIDAS.join(', ')}`)

  // Duración
  if (!data.duration?.trim())
    errors.push('La duración es requerida')
  else if (!isValidDuration(data.duration))
    errors.push('Formato de duración inválido. Usa M:SS (ej: 3:45)')

  // Dificultad
  if (data.difficulty && !DIFICULTADES_VALIDAS.includes(data.difficulty))
    errors.push(`Dificultad inválida. Opciones: ${DIFICULTADES_VALIDAS.join(', ')}`)

  // Portada — opcional, si viene debe ser URL de imagen válida
  if (data.coverImage?.trim() && !isValidImageUrl(data.coverImage))
    errors.push('La portada debe ser una URL válida de imagen (JPG, PNG, WEBP) o de Cloudinary')

  // Audio — opcional, si viene debe ser URL de audio válida
  if (data.audioUrl?.trim() && !isValidAudioUrl(data.audioUrl))
    errors.push('El audio debe ser una URL válida (MP3, WAV, OGG) o de Cloudinary')

  // Letra — opcional, máximo 5000 caracteres
  if (data.lyrics && data.lyrics.length > 5000)
    errors.push('La letra no puede superar 5000 caracteres')
  else if (data.lyrics && data.lyrics.match(/^\d+$/))
    errors.push('La letra no puede ser solo números')

  if (errors.length > 0) throw new Error(errors.join(' | '))
}

// ─── VALIDACIÓN ACTUALIZAR ────────────────────────────────────────────────────
const validateUpdate = (data: any) => {
  const errors: string[] = []

  if (data.title !== undefined) {
    if (!data.title?.trim())               errors.push('El título no puede estar vacío')
    else if (data.title.trim().length < 2) errors.push('El título debe tener al menos 2 caracteres')
    else if (data.title.trim().length > 100) errors.push('El título no puede superar 100 caracteres')
      else if (data.title.trim().match(/^\d+$/)) errors.push('El título no puede ser solo números')
  }

  if (data.artist !== undefined) {
    if (!data.artist?.trim())               errors.push('El artista no puede estar vacío')
    else if (data.artist.trim().length < 2) errors.push('El artista debe tener al menos 2 caracteres')
    else if (data.artist.trim().length > 80) errors.push('El artista no puede superar 80 caracteres')
    else if (data.artist.trim().match(/^\d+$/)) errors.push('El artista no puede ser solo números')
  }

  if (data.genre !== undefined && !GENEROS_VALIDOS.includes(data.genre))
    errors.push(`Género inválido. Opciones: ${GENEROS_VALIDOS.join(', ')}`)

  if (data.category !== undefined && !CATEGORIAS_VALIDAS.includes(data.category))
    errors.push(`Categoría inválida. Opciones: ${CATEGORIAS_VALIDAS.join(', ')}`)

  if (data.duration !== undefined) {
    if (!data.duration?.trim())           errors.push('La duración no puede estar vacía')
    else if (!isValidDuration(data.duration)) errors.push('Formato de duración inválido. Usa M:SS (ej: 3:45)')
  }

  if (data.difficulty !== undefined && !DIFICULTADES_VALIDAS.includes(data.difficulty))
    errors.push(`Dificultad inválida. Opciones: ${DIFICULTADES_VALIDAS.join(', ')}`)

  if (data.coverImage?.trim() && !isValidImageUrl(data.coverImage))
    errors.push('La portada debe ser una URL válida de imagen (JPG, PNG, WEBP) o de Cloudinary')

  if (data.audioUrl?.trim() && !isValidAudioUrl(data.audioUrl))
    errors.push('El audio debe ser una URL válida (MP3, WAV, OGG) o de Cloudinary')

  if (data.lyrics !== undefined && data.lyrics.length > 5000)
    errors.push('La letra no puede superar 5000 caracteres')

  if (errors.length > 0) throw new Error(errors.join(' | '))
}

// ─── MAPEO Prisma → Frontend ──────────────────────────────────────────────────
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

// ─── MAPEO Frontend → Prisma ──────────────────────────────────────────────────
const mapToPrisma = (data: any) => ({
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

// ─── GET ALL ──────────────────────────────────────────────────────────────────
export const getSongs = async () => {
  const songs = await prisma.repertorio.findMany({ orderBy: { createdAt: 'desc' } })
  return songs.map(mapToSong)
}

// ─── GET PUBLIC ───────────────────────────────────────────────────────────────
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
  validateCreate(data)
  const song = await prisma.repertorio.create({ data: mapToPrisma(data) })
  return mapToSong(song)
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const updateSong = async (id: number, data: any) => {
  const exists = await prisma.repertorio.findUnique({ where: { id } })
  if (!exists) throw new Error('Canción no encontrada')

  validateUpdate(data)

  const updateData: any = {}
  if (data.title      !== undefined) updateData.titulo     = data.title.trim()
  if (data.artist     !== undefined) updateData.artista    = data.artist.trim()
  if (data.genre      !== undefined) updateData.genero     = data.genre
  if (data.category   !== undefined) updateData.categoria  = data.category
  if (data.lyrics     !== undefined) updateData.letra      = data.lyrics || null
  if (data.audioUrl   !== undefined) updateData.audioUrl   = data.audioUrl || null
  if (data.duration   !== undefined) updateData.duracion   = data.duration.trim()
  if (data.difficulty !== undefined) updateData.dificultad = data.difficulty
  if (data.coverImage !== undefined) updateData.portada    = data.coverImage || null
  if (data.isActive   !== undefined) updateData.activa     = data.isActive

  const song = await prisma.repertorio.update({ where: { id }, data: updateData })
  return mapToSong(song)
}

// ─── TOGGLE ACTIVA ────────────────────────────────────────────────────────────
export const toggleStatus = async (id: number) => {
  const exists = await prisma.repertorio.findUnique({ where: { id } })
  if (!exists) throw new Error('Canción no encontrada')
    
  
  // Si se intenta DESACTIVAR, verificar que no esté en cotizaciones o reservas activas
  if (exists.activa) {
    const enCotizacion = await prisma.cotizacionRepertorio.findFirst({
      where: {
        repertorioId: id,
        cotizacion: { estado: { in: ['EN_ESPERA', 'CONVERTIDA'] } }
      }
    })
    if (enCotizacion) {
      throw new Error('No se puede desactivar: la canción está en una cotización activa o convertida')
    }
 
    const enEnsayo = await prisma.ensayoRepertorio.findFirst({
      where: { repertorioId: id }
    })
    if (enEnsayo) {
      throw new Error('No se puede desactivar: la canción está programada en un ensayo')
    }
  }

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

  // No eliminar si está en una cotización activa
  const enUso = await prisma.cotizacionRepertorio.findFirst({
    where: {
      repertorioId: id,
      cotizacion: { estado: { in: ['EN_ESPERA', 'CONVERTIDA'] } }
    }
  })
  if (enUso) throw new Error('No se puede eliminar: la canción está asociada a una cotización activa')

  await prisma.repertorio.delete({ where: { id } })
  return { message: 'Canción eliminada correctamente' }
}