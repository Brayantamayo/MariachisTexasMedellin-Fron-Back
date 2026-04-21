import api from '@/shared/api/api'

export interface Sale {
    id: string;
    date: string;
    type: string;
    clientName: string;
    clientId?: string;
    clientEmail?: string;
    concept: string;
    method: string;
    amount: number;
    totalAmount?: number;
    pendingAmount?: number;
    paidAmount?: number;
    reservationId?: string;
    reservationStatus?: string;
    eventDate?: string;
    eventType?: string;
    status: string;
    abonos?: { id: string; amount: number; date: string; method: string; notes: string }[];
    eventTime?: string;
    eventEndTime?: string;
    eventLocation?: string;
    homenajeado?: string;
    notes?: string;
    services?: { nombre: string; cantidad: number; precio: number }[];
    repertoire?: { titulo: string; artista: string }[];
}

// ─── Helper: extrae el array sin importar si la respuesta es directa o envuelta ──
const unwrapList = (response: any): any[] => {
    if (Array.isArray(response)) return response
    if (response && Array.isArray(response.data)) return response.data
    return []
}

const unwrapItem = (response: any): any => {
    if (response && response.data !== undefined) return response.data
    return response
}

export const ventaService = {

    getSales: async (): Promise<Sale[]> => {
        try {
            const { data } = await api.get('/ventas')
            return unwrapList(data)
        } catch (err) {
            console.error('Error obteniendo ventas:', err)
            return []
        }
    },

    getPayableReservations: async (): Promise<any[]> => {
        try {
            const { data } = await api.get('/ventas/payable/reservations')
            return unwrapList(data)
        } catch (err) {
            console.error('Error obteniendo reservas pagables:', err)
            return []
        }
    },

    createSale: async (data: any): Promise<Sale> => {
        const payload = {
            reservaId:   data.reservationId ? Number(data.reservationId) : null,
            clienteId:   Number(data.clienteId),
            tipo:        data.type === 'Por Reserva' ? 'RESERVA' : 'DIRECTA',
            estado:      'CONFIRMADO',
            montoTotal:  Number(data.amount),
            montoPagado: Number(data.amount),
            fechaVenta:  data.date,
            metodoPago:  String(data.method).toUpperCase(),
        }
        const { data: res } = await api.post('/ventas', payload)
        return unwrapItem(res)
    },

    updateSale: async (id: string, updates: Partial<Sale>): Promise<Sale> => {
        const { data } = await api.put(`/ventas/${id}`, updates)
        return unwrapItem(data)
    },

    registerExternalSale: async (saleData: Omit<Sale, 'id' | 'status'>): Promise<Sale> => {
        const payload = {
            reservaId:   saleData.reservationId ? Number(saleData.reservationId) : null,
            clienteId:   Number(saleData.clientId),
            tipo:        saleData.type === 'Por Reserva' ? 'RESERVA' : 'DIRECTA',
            estado:      'CONFIRMADO',
            montoTotal:  saleData.amount,
            montoPagado: saleData.amount,
            fechaVenta:  saleData.date,
            metodoPago:  String(saleData.method).toUpperCase(),
        }
        const { data } = await api.post('/ventas', payload)
        return unwrapItem(data)
    },

    downloadInvoice: async (saleId: string): Promise<void> => {
        const response = await api.get(`/ventas/${saleId}/download/pdf`, { responseType: 'blob' })
        const blob = new Blob([response.data], { type: 'application/pdf' })
        const url  = window.URL.createObjectURL(blob)
        const a    = document.createElement('a')
        a.href     = url
        a.download = `factura-${saleId}.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
    },
}