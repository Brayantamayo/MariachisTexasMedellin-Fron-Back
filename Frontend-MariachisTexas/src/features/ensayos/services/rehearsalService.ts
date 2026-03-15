import axios from 'axios'
import { Rehearsal } from '@/types'

const api = axios.create({ baseURL: 'http://localhost:3000/api' })

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token') 
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const rehearsalService = {
  getRehearsals: async (): Promise<Rehearsal[]> => {
    const { data } = await api.get('/ensayos')
    return data
  },
  createRehearsal: async (rehearsal: Omit<Rehearsal, 'id'>): Promise<Rehearsal> => {
    const { data } = await api.post('/ensayos', rehearsal)
    return data
  },
  updateRehearsal: async (id: string, updates: Partial<Rehearsal>): Promise<Rehearsal> => {
    const { data } = await api.put(`/ensayos/${id}`, updates)
    return data
  },
  deleteRehearsal: async (id: string): Promise<boolean> => {
    await api.delete(`/ensayos/${id}`)
    return true
  }
}