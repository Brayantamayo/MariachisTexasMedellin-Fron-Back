
import api from '@/shared/api/api'

export interface Sale {
    id: string;
    date: string;
    type: 'Por Reserva' | 'Directa';
    clientName: string;
    clientId?: string; // ID del cliente para filtrado
    concept: string; // Descripción o ID Reserva
    method: string;
    amount: number; // Monto del último pago o monto total si es directa
    totalAmount?: number; // Monto total de la reserva
    pendingAmount?: number; // Saldo pendiente
    reservationId?: string;
    reservationStatus?: 'Confirmado' | 'Finalizado';
    status: 'Completado' | 'Anulado';
}

export const ventaService = {
    getSales: async (): Promise<Sale[]> => {
        try {
            const { data } = await api.get('/ventas')
            return data
        } catch (err) {
            console.error('Error obteniendo ventas:', err)
            return []
        }
    },

    // Obtener reservas pendientes de pago para el select
    getPayableReservations: async (): Promise<any[]> => {
        const { data } = await api.get('/reservas')
        return data.filter((r: any) => r.status !== 'ANULADA' && r.paidAmount < r.totalAmount);
    },

    // Método principal para crear venta desde el módulo de Ventas
    createSale: async (data: any): Promise<Sale> => {
        // 1. Si es por reserva, actualizamos la reserva original
        if (data.type === 'Por Reserva' && data.reservationId) {
            await api.post(`/reservas/${data.reservationId}/abonos`, {
                amount: Number(data.amount),
                method: data.method,
                date: new Date().toISOString(),
                notes: 'Generado desde módulo Ventas'
            });
        }

        // 2. Crear registro de venta
        const payload = {
            reservaId: data.reservationId ? Number(data.reservationId) : null,
            clienteId: Number(data.clienteId),
            tipo: data.type === 'Por Reserva' ? 'RESERVA' : 'DIRECTA',
            estado: 'CONFIRMADO',
            montoTotal: Number(data.amount),
            montoPagado: Number(data.amount),
            fechaVenta: data.date,
            metodoPago: data.method
        }

        const { data: newSale } = await api.post('/ventas', payload)
        return newSale
    },

    updateSale: async (id: string, updates: Partial<Sale>): Promise<Sale> => {
        const { data } = await api.put(`/ventas/${id}`, updates)
        return data
    },

    // NUEVO MÉTODO: Registra una venta que viene de otro módulo (Abonos) sin llamar de nuevo a reservaService
    // Esto evita bucles infinitos o pagos duplicados.
    registerExternalSale: async (saleData: Omit<Sale, 'id' | 'status'>): Promise<Sale> => {
        const payload = {
            reservaId: saleData.reservationId ? Number(saleData.reservationId) : null,
            clienteId: Number(saleData.clientId),
            tipo: saleData.type === 'Por Reserva' ? 'RESERVA' : 'DIRECTA',
            estado: 'CONFIRMADO',
            montoTotal: saleData.amount,
            montoPagado: saleData.amount,
            fechaVenta: saleData.date,
            metodoPago: saleData.method
        }

        const { data } = await api.post('/ventas', payload)
        return data
    },

    downloadInvoice: async (saleId: string): Promise<boolean> => {
        return new Promise((resolve) => setTimeout(() => resolve(true), 1500));
    }
};
