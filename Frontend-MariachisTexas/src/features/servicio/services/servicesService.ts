import api from '@/shared/api/api'
import { Service } from '@/types'

export const servicesService = {
  getServices: async (buscar?: string): Promise<Service[]> => {
    const { data } = await api.get('/servicios', { params: { buscar } })
    return data
  },

  createService: async (data: Omit<Service, 'id' | 'estado'>): Promise<Service> => {
    const { data: res } = await api.post('/servicios', data)
    return res.servicio
  },

  updateService: async (id: string, data: Partial<Omit<Service, 'id' | 'estado'>>): Promise<Service> => {
    const { data: res } = await api.put(`/servicios/${id}`, data)
    return res.servicio
  },

  toggleEstado: async (id: string): Promise<Service> => {
    const { data } = await api.patch(`/servicios/${id}/estado`)
    return data.servicio
  },

  deleteService: async (id: string): Promise<void> => {
    await api.delete(`/servicios/${id}`)
  }
}