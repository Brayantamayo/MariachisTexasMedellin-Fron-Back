import api from '@/shared/api/api'

export interface DashboardStats {
  totalClients: number
  totalReservas: number
  confirmedReservas: number
  pendingReservas: number
  cancelledReservas: number
  totalCotizaciones: number
  convertedCotizaciones: number
  pendingCotizaciones: number
  totalVentas: number
  totalRevenue: number
  totalPendingBalance: number
  upcomingReservations: Array<{ id: number; eventDate: string; status: string; totalValue: number }>
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get<DashboardStats>('/dashboard/stats')
    return data
  }
}
