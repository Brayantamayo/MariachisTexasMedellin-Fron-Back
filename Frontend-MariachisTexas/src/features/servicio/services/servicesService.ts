import axios from 'axios'
import { Service } from '@/types'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

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