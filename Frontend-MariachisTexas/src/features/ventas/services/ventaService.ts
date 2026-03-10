
import { Payment, Reservation } from '@/types';
import { reservaService } from '../../reservas/services/reservaService';

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

// Mock Data
let mockSales: Sale[] = [
    {
        id: 'V-001',
        date: '2026-02-02',
        type: 'Por Reserva',
        clientName: 'Juan Pérez',
        concept: 'Abono Reserva #1 - Boda',
        method: 'Transferencia',
        amount: 240000,
        reservationId: '1',
        status: 'Completado'
    },
    {
        id: 'V-002',
        date: '2026-02-05',
        type: 'Directa',
        clientName: 'Cliente Ocasional',
        concept: 'Venta de Recordatorios',
        method: 'Efectivo',
        amount: 50000,
        status: 'Completado'
    }
];

export const ventaService = {
    getSales: async (): Promise<Sale[]> => {
        return new Promise((resolve) => setTimeout(() => resolve([...mockSales]), 600));
    },

    // Obtener reservas pendientes de pago para el select
    getPayableReservations: async (): Promise<Reservation[]> => {
        const all = await reservaService.getReservations();
        return all.filter(r => r.status !== 'Anulado' && r.paidAmount < r.totalAmount);
    },

    // Método principal para crear venta desde el módulo de Ventas
    createSale: async (data: any): Promise<Sale> => {
        // 1. Si es por reserva, actualizamos la reserva original
        if (data.type === 'Por Reserva' && data.reservationId) {
            await reservaService.addPayment(data.reservationId, {
                amount: Number(data.amount),
                method: data.method as any,
                date: new Date().toISOString(),
                type: 'Abono Parcial',
                notes: 'Generado desde módulo Ventas'
            });
        }

        // 2. Crear registro de venta
        const newSale: Sale = {
            id: `V-${Math.floor(Math.random() * 10000)}`,
            date: data.date,
            type: data.type,
            clientName: data.clientName,
            concept: data.concept,
            method: data.method,
            amount: Number(data.amount),
            reservationId: data.reservationId,
            status: 'Completado'
        };

        mockSales = [newSale, ...mockSales];
        return new Promise((resolve) => setTimeout(() => resolve(newSale), 600));
    },

    updateSale: async (id: string, updates: Partial<Sale>): Promise<Sale> => {
        return new Promise((resolve, reject) => {
            const index = mockSales.findIndex(s => s.id === id);
            if (index === -1) {
                reject(new Error('Venta no encontrada'));
                return;
            }
            // Nota: En un sistema real, editar una venta vinculada a reserva requeriría
            // lógica compleja de reversión de saldos. Aquí simulamos solo edición de datos básicos.
            mockSales[index] = { ...mockSales[index], ...updates };
            setTimeout(() => resolve(mockSales[index]), 500);
        });
    },

    // NUEVO MÉTODO: Registra una venta que viene de otro módulo (Abonos) sin llamar de nuevo a reservaService
    // Esto evita bucles infinitos o pagos duplicados.
    registerExternalSale: async (saleData: Omit<Sale, 'id' | 'status'>): Promise<Sale> => {
        const newSale: Sale = {
            ...saleData,
            id: `V-${Math.floor(Math.random() * 10000)}`,
            status: 'Completado'
        };
        mockSales = [newSale, ...mockSales];
        return new Promise((resolve) => resolve(newSale));
    },

    downloadInvoice: async (saleId: string): Promise<boolean> => {
        return new Promise((resolve) => setTimeout(() => resolve(true), 1500));
    }
};
