import axios from 'axios'
import { Song } from '@/types'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

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

  // Activa/desactiva — reemplaza updateSong({ isActive })
  toggleStatus: async (id: string): Promise<Song> => {
    const { data } = await api.patch(`/repertorio/${id}/toggle`)
    return data
  },

  deleteSong: async (id: string): Promise<void> => {
    await api.delete(`/repertorio/${id}`)
  }
}