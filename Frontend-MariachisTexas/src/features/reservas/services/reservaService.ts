import api from '@/shared/api/api'
import { Reservation } from '@/types'

export const reservaService = {

  getReservations: async (): Promise<Reservation[]> => {
    const { data } = await api.get('/reservas')
    return data
  },

  getReservationsForCalendar: async (): Promise<Reservation[]> => {
    const { data } = await api.get('/reservas/calendario')
    return data
  },
  
/////posible error 
  // excludeReservaId — excluye la reserva actual al editar para liberar sus horas
  getAvailableHours: async (date: string, excludeReservaId?: string): Promise<string[]> => {
    const params = excludeReservaId ? { excludeId: excludeReservaId } : {}
    const { data } = await api.get(`/reservas/available-hours/${date}`, { params })
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

  addPayment: async (reservationId: string, payment: { amount: number; method: string; date: string; notes?: string; type?: string }): Promise<Reservation> => {
    const { data } = await api.post(`/reservas/${reservationId}/abonos`, payment)
    return data
  },

  finalizeReservation: async (id: string): Promise<Reservation> => {
    const { data } = await api.patch(`/reservas/${id}/confirmar`)
    return data
  },

  reprogramarReservation: async (
    id: string,
    data: { eventDate: string; startTime: string; endTime: string }
  ): Promise<Reservation> => {
    const { data: res } = await api.patch(`/reservas/${id}/reprogramar`, data)
    return res
  },

  checkAndProcessPastEvents: async (): Promise<void> => Promise.resolve(),
}