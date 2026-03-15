import axios from 'axios'
import { Reservation } from '@/types'

const api = axios.create({ baseURL: 'http://localhost:3000/api' })
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token') // ✅ era localStorage
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const reservaService = {

  // Lista propia del cliente / todas para admin-empleado (con datos privados)
  getReservations: async (): Promise<Reservation[]> => {
    const { data } = await api.get('/reservas')
    return data
  },

  // Todas las reservas activas SIN datos privados — para pintar el calendario
  // El cliente usa esto para saber qué fechas/horas están ocupadas
  getReservationsForCalendar: async (): Promise<Reservation[]> => {
    const { data } = await api.get('/reservas/calendario')
    return data
  },

  // Pública — no necesita token
  getAvailableHours: async (date: string): Promise<string[]> => {
    const { data } = await axios.get(`http://localhost:3000/api/reservas/available-hours/${date}`)
    return data
  },

  getReservationById: async (id: string): Promise<Reservation> => {
    const { data } = await api.get(`/reservas/${id}`)
    return data
  },

  createReservation: async (reservationData: any): Promise<Reservation> => {
    const { data } = await api.post('/reservas', reservationData)
    return data
  },

  cancelReservation: async (id: string, reason: string): Promise<Reservation> => {
    const { data } = await api.patch(`/reservas/${id}/anular`, { motivo: reason })
    return data
  },

  confirmReservation: async (id: string): Promise<Reservation> => {
    const { data } = await api.patch(`/reservas/${id}/confirmar`)
    return data
  },

  updateReservation: async (id: string, updates: Partial<Reservation>): Promise<Reservation> => {
    const { data } = await api.put(`/reservas/${id}`, updates)
    return data
  },

  deleteReservation: async (id: string): Promise<void> => {
  await api.delete(`/reservas/${id}`)
},

  // Compatibilidad
  checkAndProcessPastEvents: async (): Promise<void> => Promise.resolve(),

  finalizeReservation: async (id: string): Promise<Reservation> => {
    const { data } = await api.patch(`/reservas/${id}/confirmar`)
    return data
  },
}