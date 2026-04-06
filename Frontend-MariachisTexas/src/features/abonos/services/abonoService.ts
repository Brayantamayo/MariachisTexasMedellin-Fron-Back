
import api from '@/shared/api/api'
import { Payment, Reservation } from '@/types';
import { reservaService } from '../../reservas/services/reservaService';
import { ventaService } from '../../ventas/services/ventaService';

// Extendemos Payment para incluir datos visuales en la tabla (Cliente, Reserva ID)
export interface EnrichedPayment extends Payment {
    reservationId: string;
    clientId?: string;
    clientName: string;
    reservationTotal: number;
}

// Mock inicial vacío o con datos que no choquen con IDs bajos de reservas nuevas
let localPayments: EnrichedPayment[] = [];

export const abonoService = {
  // Obtener todos los abonos enriquecidos con datos del cliente
  getAbonos: async (): Promise<EnrichedPayment[]> => {
    try {
      const { data } = await api.get('/abonos')
      return data as EnrichedPayment[]
    } catch (err) {
      // Si /abonos falla, intentar endpoint antiguo
      try {
        const { data } = await api.get('/reservas/abonos')
        return data as EnrichedPayment[]
      } catch (_) {
        const reservations = await reservaService.getReservations();
        const abonos: EnrichedPayment[] = [];
        reservations.forEach(res => {
          res.payments.forEach(p => {
            abonos.push({
              ...p,
              reservationId: res.id,
              clientId: res.clientId,
              clientName: res.clientName,
              reservationTotal: res.totalAmount
            });
          });
        });

        return abonos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    }
  },

  // Obtener reservas activas para el dropdown del formulario
  getPayableReservations: async (): Promise<Reservation[]> => {
      const all = await reservaService.getReservations();
      // Solo mostramos reservas que no estén anuladas ni pagadas al 100%
      return all.filter(r => r.status !== 'Anulado' && r.paidAmount < r.totalAmount);
  },

  // Registrar nuevo abono
  createAbono: async (data: { reservationId: string, amount: number, date: string, method: string, notes?: string }): Promise<EnrichedPayment> => {
      const methodMap: Record<string, string> = {
        transferencia: 'TRANSFERENCIA',
        efectivo: 'EFECTIVO',
        tarjeta: 'TARJETA',
        nequi: 'NEQUI',
        daviplata: 'DAVIPLATA',
        otro: 'OTRO'
      };
      const methodKey = String(data.method ?? '').trim().toLowerCase();
      const normalizedMethod = methodMap[methodKey] || 'OTRO';

      // 1. Crear abono a través del nuevo endpoint de módulo abonos
      const { data: updatedReserva } = await api.post(`/abonos`, {
          reservaId: data.reservationId,
          amount: data.amount,
          method: normalizedMethod,
          date: data.date,
          notes: data.notes
      });

      // 2. Obtener el último pago agregado para retornar
      const lastPayment = updatedReserva.payments[updatedReserva.payments.length - 1];

      const newPayment: EnrichedPayment = {
          ...lastPayment,
          reservationId: updatedReserva.id,
          clientId: updatedReserva.clientId,
          clientName: updatedReserva.clientName,
          reservationTotal: updatedReserva.totalAmount
      };

      // 3. SINCRONIZACIÓN: Registrar también en el módulo de Ventas (no interrumpe el abono si falla)
      try {
        await ventaService.registerExternalSale({
            date: data.date,
            type: 'Por Reserva',
            clientName: updatedReserva.clientName,
            concept: `Abono a Reserva #${updatedReserva.id} (${updatedReserva.eventType})`,
            method: normalizedMethod,
            amount: data.amount,
            reservationId: updatedReserva.id
        });
      } catch (err) {
        console.warn('No se pudo registrar venta automática de abono:', err);
      }

      return new Promise((resolve) => setTimeout(() => resolve(newPayment), 600));
  },

  // Simular descarga de PDF
  downloadComprobante: async (paymentId: string): Promise<boolean> => {
      return new Promise((resolve) => setTimeout(() => resolve(true), 1500));
  }
};
