import api from '@/shared/api/api'
import { Service } from '@/types'

export const servicesService = {

  getServices: async (buscar?: string): Promise<Service[]> => {
    const { data } = await api.get('/servicios', { params: { buscar } })
    
    return data.map((s: any) => ({ ...s, precio: Number(s.precio) }))
  },

  createService: async (data: Omit<Service, 'id' | 'estado'>): Promise<Service> => {
    try{ const { data: res } = await api.post('/servicios', {
      ...data,
      precio: Number(data.precio)  
    })
    return { ...res.servicio, precio: Number(res.servicio.precio) }
    
    }catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear servicio.')
    }
  },

updateService: async (id: string, data: Partial<Omit<Service, 'id' | 'estado'>>): Promise<Service> => {
  try {
    const { data: res } = await api.put(`/servicios/${id}`, {
      ...data,
      precio: data.precio !== undefined ? Number(data.precio) : undefined
    })
    return { ...res.servicio, precio: Number(res.servicio.precio) }
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al actualizar servicio.')
  }
},

  toggleEstado: async (id: string): Promise<Service> => {
    const { data } = await api.patch(`/servicios/${id}/estado`)
    return { ...data.servicio, precio: Number(data.servicio.precio) }
  },

  deleteService: async (id: string): Promise<void> => {
    await api.delete(`/servicios/${id}`)
  }
}