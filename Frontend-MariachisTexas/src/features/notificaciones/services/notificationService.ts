import api from '@/shared/api/api'

export interface SystemNotification {
  id: string
  tipo: 'RESERVA' | 'COTIZACION' | 'ABONO'
  titulo: string
  descripcion: string
  fecha: string
  enlace: string
}

export const notificationService = {
  getNotifications: async (): Promise<SystemNotification[]> => {
    const { data } = await api.get('/notificaciones')
    return data
  }
}
