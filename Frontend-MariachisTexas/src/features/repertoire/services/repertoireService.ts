import api from '@/shared/api/api'
import { Song } from '@/types'

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

searchSpotify: async (query: string, limit = 8): Promise<SpotifySong[]> => {
  try {
    const { data } = await api.get('/spotify/search', {
      params: { q: query, limit }
    });
    return data;
  } catch (error) {
    console.error('Error en búsqueda de Spotify:', error);
    // Puedes lanzar un error personalizado o mostrar notificación
    throw new Error('No se pudo buscar en Spotify. Verifica tu conexión o permisos.');
  }
}
}