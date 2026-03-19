import api from '@/shared/api/api'
import { Rehearsal } from '@/types'


export const rehearsalService = {
  // ─── ADMIN / EMPLEADO — datos completos con token ─────────────────────────
  getRehearsals: async (): Promise<Rehearsal[]> => {
    const { data } = await api.get('/ensayos')
    return data
  },

  // ─── CLIENTE — solo fecha y hora, sin token requerido ─────────────────────
  getRehearsalsPublic: async (): Promise<Pick<Rehearsal, 'date' | 'time'>[]> => {
    const { data } = await api.get('/ensayos/public/disponibilidad')
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