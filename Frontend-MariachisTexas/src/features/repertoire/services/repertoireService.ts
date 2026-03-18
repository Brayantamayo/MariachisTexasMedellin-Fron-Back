import axios from 'axios'
import { Song } from '@/types'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token') 
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Tipos Spotify ────────────────────────────────────────────────────────────
export interface SpotifySong {
  spotifyId:   string
  title:       string
  artist:      string
  album:       string
  coverImage:  string | null
  previewUrl:  string | null
  duration:    string
  durationMs:  number
  popularity:  number
  externalUrl: string
}
 
// ─── Repertorio + Spotify ─────────────────────────────────────────────────────
export const repertoireService = {
 
  // Módulo interno — todas las canciones (activas e inactivas)
  getSongs: async (): Promise<Song[]> => {
    const { data } = await api.get('/repertorio')
    return data
  },
 
  // Landing pública — solo activas
  getSongsPublic: async (): Promise<Song[]> => {
    const { data } = await api.get('/repertorio/public')
    return data
  },
 
  getSongById: async (id: string): Promise<Song> => {
    const { data } = await api.get(`/repertorio/${id}`)
    return data
  },
 
  createSong: async (song: Omit<Song, 'id'>): Promise<Song> => {
    const { data } = await api.post('/repertorio', song)
    return data
  },
 
  updateSong: async (id: string, updates: Partial<Song>): Promise<Song> => {
    const { data } = await api.put(`/repertorio/${id}`, updates)
    return data
  },
 
  // Activa/desactiva
  toggleStatus: async (id: string): Promise<Song> => {
    const { data } = await api.patch(`/repertorio/${id}/toggle`)
    return data
  },
 
  deleteSong: async (id: string): Promise<void> => {
    await api.delete(`/repertorio/${id}`)
  },
 
  // ─── Spotify ──────────────────────────────────────────────────────────────
  searchSpotify: async (query: string, limit = 8): Promise<SpotifySong[]> => {
    const { data } = await api.get('/spotify/search', {
      params: { q: query, limit }
    })
    return data
  }
}
 