import type { Repertorio } from '../../../generated/prisma'
import type { RepertorioCreateInput, SongResponse } from '../../../types/interfaces'

// ─── mapToSong ────────────────────────────────────────────────────────────────
// Convierte el modelo Prisma → DTO de salida (SongResponse)
export const mapToSong = (r: Repertorio): SongResponse => ({
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

// ─── mapToPrisma ──────────────────────────────────────────────────────────────
// Convierte el DTO de entrada (RepertorioCreateInput) → modelo Prisma
export const mapToPrisma = (data: RepertorioCreateInput) => ({
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