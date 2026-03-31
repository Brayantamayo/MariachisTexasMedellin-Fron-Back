import api from '@/shared/api/api'
import { Rehearsal } from '@/types'

export const rehearsalService = {
getRehearsals: async (): Promise<Rehearsal[]> => {const { data } = await api.get('/ensayos')
return data
},

getRehearsalsPublic: async () => {const { data } = await api.get('/ensayos/public/disponibilidad')
return data
},

createRehearsal: async (payload: Omit<Partial<Rehearsal>, 'status' | 'id' | 'createdAt' | 'updatedAt'>): Promise<Rehearsal> => {const { data } = await api.post('/ensayos', payload)
return data
},

updateRehearsal: async (id: string, payload: Omit<Partial<Rehearsal>, 'status' | 'id' | 'createdAt' | 'updatedAt'>): Promise<Rehearsal> => {const { data } = await api.put(`/ensayos/${id}`, payload)
return data
},

toggleStatus: async (id: string): Promise<Rehearsal> => {const { data } = await api.patch(`/ensayos/${id}/toggle-estado`)
return data
},

deleteRehearsal: async (id: string): Promise<void> => {await api.delete(`/ensayos/${id}`)},
}