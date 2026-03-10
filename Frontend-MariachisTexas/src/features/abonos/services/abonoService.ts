
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

    // Ordenar por fecha descendente
    return abonos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  // Obtener reservas activas para el dropdown del formulario
  getPayableReservations: async (): Promise<Reservation[]> => {
      const all = await reservaService.getReservations();
      // Solo mostramos reservas que no estén anuladas ni pagadas al 100%
      return all.filter(r => r.status !== 'Anulado' && r.paidAmount < r.totalAmount);
  },

  // Registrar nuevo abono
  createAbono: async (data: { reservationId: string, amount: number, date: string, method: string, notes?: string }): Promise<EnrichedPayment> => {
      
      const methodCast = data.method as any; 

      // 1. Actualizar la reserva real (Saldo y Estado)
      const updatedReserva = await reservaService.addPayment(data.reservationId, {
          amount: data.amount,
          method: methodCast,
          date: data.date, // Usar la fecha del formulario
          type: 'Abono Parcial',
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

      // 3. SINCRONIZACIÓN: Registrar también en el módulo de Ventas
      await ventaService.registerExternalSale({
          date: data.date,
          type: 'Por Reserva',
          clientName: updatedReserva.clientName,
          concept: `Abono a Reserva #${updatedReserva.id} (${updatedReserva.eventType})`,
          method: data.method,
          amount: data.amount,
          reservationId: updatedReserva.id
      });
      
      return new Promise((resolve) => setTimeout(() => resolve(newPayment), 600));
  },

  // Simular descarga de PDF
  downloadComprobante: async (paymentId: string): Promise<boolean> => {
      return new Promise((resolve) => setTimeout(() => resolve(true), 1500));
  }
};
