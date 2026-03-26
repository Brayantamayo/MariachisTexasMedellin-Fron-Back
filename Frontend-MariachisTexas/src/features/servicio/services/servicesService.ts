import api from '@/shared/api/api'
import { Service } from '@/types'

export const servicesService = {

  getServices: async (): Promise<Service[]> => {
    const { data } = await api.get('/servicios')
    return data
  },

  getServiceById: async (id: string): Promise<Service> => {
    const { data } = await api.get(`/servicios/${id}`)
    return data
  },

  createService: async (service: Omit<Service, 'id' | 'estado'>): Promise<Service> => {
    const { data } = await api.post('/servicios', service)
    return data.servicio ?? data
  },

  updateService: async (id: string, updates: Partial<Service>): Promise<Service> => {
    const { data } = await api.put(`/servicios/${id}`, updates)
    return data.servicio ?? data
  },

  // Activa/desactiva
  toggleEstado: async (id: string): Promise<Service> => {
    const { data } = await api.patch(`/servicios/${id}/estado`)
    return data.servicio ?? data
  },

  
  // Elimina el servicio — el backend gestiona la desactivación internamente
deleteService: async (id: string): Promise<void> => {
  await api.delete(`/servicios/${id}`)
},
}