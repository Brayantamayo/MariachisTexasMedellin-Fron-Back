
import { Reservation, Payment, ReservationStatus } from '@/types';
import { rehearsalService } from '../../ensayos/services/rehearsalService';
import { blockService } from '../../bloqueos/services/blockService';

// Mock Data Inicial
let mockReservations: Reservation[] = [
  {
    id: '1',
    clientName: 'Juan Pérez',
    clientPhone: '3001234567',
    eventType: 'Boda',
    eventDate: '2026-02-20',
    eventTime: '19:00',
    location: 'Salón Real',
    address: 'Calle 10 # 5-50',
    repertoireIds: [],
    totalAmount: 480000, 
    paidAmount: 240000,
    status: 'Confirmado',
    createdAt: '2026-02-01T10:00:00.000Z',
    payments: [
        { id: 'p1', amount: 240000, date: '2026-02-02T10:00:00.000Z', type: 'Abono Inicial', method: 'Transferencia' }
    ]
  },
  {
    id: '2',
    clientName: 'Maria Gomez',
    eventType: 'Cumpleaños',
    eventDate: '2026-03-15',
    eventTime: '21:00',
    location: 'Casa de Maria',
    address: 'Cra 43A # 10-10',
    repertoireIds: [],
    totalAmount: 480000,
    paidAmount: 0,
    status: 'Pendiente',
    createdAt: new Date().toISOString(),
    payments: []
  }
];

// Helper para obtener todas las horas dentro de un rango (Inicio -> Fin)
const getHoursInRange = (start: string, end: string): string[] => {
    const hours: string[] = [];
    const [startH] = start.split(':').map(Number);
    const [endH] = end.split(':').map(Number);
    
    // Si cruza la medianoche (ej: 23:00 a 02:00)
    if (endH < startH) {
        // Parte 1: Start hasta 23:00
        for (let i = startH; i <= 23; i++) {
            hours.push(`${i.toString().padStart(2, '0')}:00`);
        }
        // Parte 2: 00:00 hasta End
        for (let i = 0; i < endH; i++) {
            hours.push(`${i.toString().padStart(2, '0')}:00`);
        }
    } else {
        // Rango normal (ej: 08:00 a 12:00)
        // El bucle va hasta < endH porque la hora final exacta suele ser cuando termina el evento
        for (let i = startH; i < endH; i++) {
            hours.push(`${i.toString().padStart(2, '0')}:00`);
        }
    }
    return hours;
};

// Helper para calcular hora anterior (Buffer)
const getPreviousHour = (time: string): string => {
    const [h, m] = time.split(':').map(Number);
    let prevH = h - 1;
    if (prevH < 0) prevH = 23;
    return `${prevH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const reservaService = {
  getReservations: async (): Promise<Reservation[]> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockReservations]), 500);
    });
  },

  checkAndProcessPastEvents: async (): Promise<void> => {
      const now = new Date();
      
      mockReservations.forEach(res => {
          if (res.status === 'Finalizado' || res.status === 'Anulado') return;
          const eventDateObj = new Date(`${res.eventDate}T${res.eventTime}:00`);

          if (eventDateObj < now) {
              res.status = 'Finalizado';
              // ELIMINADO: Cobro automático de saldo. 
              // Solo el usuario puede registrar pagos manualmente.
          }
      });
      return Promise.resolve();
  },

  getAvailableHours: async (date: string): Promise<string[]> => {
      // 1. Obtener datos externos
      const rehearsals = await rehearsalService.getRehearsals();
      const { cotizacionService } = await import('../../cotizaciones/services/cotizacionService');
      const quotations = await cotizacionService.getQuotations();
      const blockStatus = await blockService.checkDateStatus(date);

      // Generar Horas: 08:00 AM hasta 12:00 AM (00:00)
      const allHours = [];
      for (let i = 8; i <= 23; i++) {
          allHours.push(`${i.toString().padStart(2, '0')}:00`);
      }
      allHours.push('00:00'); // Medianoche

      // Si el día está totalmente bloqueado, retornar vacío
      if (blockStatus.isBlocked) return [];

      const blockedHours = new Set<string>();

      // Bloqueos parciales manuales
      if (blockStatus.hasPartialBlocks && blockStatus.blockedRanges) {
          blockStatus.blockedRanges.forEach(range => {
              allHours.forEach(h => {
                  if (h >= range.start && h < range.end) blockedHours.add(h);
              });
          });
      }
      
      // Reservas Existentes
      const existingRes = mockReservations.filter(r => r.eventDate === date && r.status !== 'Anulado');
      existingRes.forEach(res => {
          const hour = parseInt(res.eventTime.split(':')[0]);
          blockedHours.add(res.eventTime); // Hora exacta
          
          // Hora siguiente (Buffer) - Manejo especial para medianoche
          let nextH = hour + 1;
          if (nextH === 24) nextH = 0;
          blockedHours.add(`${nextH.toString().padStart(2, '0')}:00`); 
      });

      // Cotizaciones "En Espera" (BLOQUEO DE RANGO COMPLETO)
      const activeQuotes = quotations.filter(q => q.eventDate === date && q.status === 'En Espera');
      activeQuotes.forEach(q => {
          // Bloquear todas las horas entre inicio y fin seleccionados en la cotización
          const hoursInRange = getHoursInRange(q.startTime, q.endTime);
          hoursInRange.forEach(h => blockedHours.add(h));
      });

      // Ensayos Existentes
      const existingReh = rehearsals.filter(r => r.date === date && r.status === 'Programado');
      existingReh.forEach(reh => {
          const hour = parseInt(reh.time.split(':')[0]);
          blockedHours.add(reh.time); // Hora exacta
          
          let nextH = hour + 1;
          if (nextH === 24) nextH = 0;
          blockedHours.add(`${nextH.toString().padStart(2, '0')}:00`); 
      });

      return allHours.filter(h => !blockedHours.has(h));
  },

  createReservation: async (data: Omit<Reservation, 'id' | 'paidAmount' | 'payments' | 'status' | 'createdAt'>): Promise<Reservation> => {
    // --- VALIDACIÓN DE DISPONIBILIDAD ---
    const date = data.eventDate;
    const time = data.eventTime;
    const prevTime = getPreviousHour(time);

    // 0. Validar Fecha Pasada
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
        throw new Error("No se permiten reservas en fechas pasadas.");
    }

    // 1. Verificar Bloqueos
    const blockStatus = await blockService.checkDateStatus(date);
    if (blockStatus.isBlocked) {
        throw new Error(`La fecha está bloqueada: ${blockStatus.reason}`);
    }
    if (blockStatus.hasPartialBlocks && blockStatus.blockedRanges) {
        const isBlocked = blockStatus.blockedRanges.some(range => time >= range.start && time < range.end);
        if (isBlocked) throw new Error('El horario seleccionado está bloqueado administrativamente.');
    }

    // 2. Verificar Reservas (Hora exacta o Buffer de la anterior)
    const conflictRes = mockReservations.find(r => 
        r.eventDate === date && 
        r.status !== 'Anulado' &&
        (r.eventTime === time || r.eventTime === prevTime)
    );
    if (conflictRes) {
        throw new Error(`Horario ocupado por otro evento (${conflictRes.eventType}) o su tiempo de montaje.`);
    }

    // 3. Verificar Cotizaciones En Espera (RANGO COMPLETO)
    const { cotizacionService } = await import('../../cotizaciones/services/cotizacionService');
    const quotations = await cotizacionService.getQuotations();
    const activeQuotes = quotations.filter(q => q.eventDate === date && q.status === 'En Espera');
    
    // Verificar si la hora solicitada cae dentro del rango de alguna cotización
    for (const q of activeQuotes) {
        const occupiedHours = getHoursInRange(q.startTime, q.endTime);
        // Si la hora de la reserva choca con alguna hora de la cotización O es la hora de buffer de una cotización
        if (occupiedHours.includes(time) || occupiedHours.includes(prevTime)) {
             throw new Error(`Horario bloqueado por cotización pendiente de ${q.startTime} a ${q.endTime} (Cliente: ${q.clientName}).`);
        }
    }

    // 4. Verificar Ensayos
    const rehearsals = await rehearsalService.getRehearsals();
    const conflictReh = rehearsals.find(r => 
        r.date === date &&
        r.status === 'Programado' &&
        (r.time === time || r.time === prevTime)
    );
    if (conflictReh) {
        throw new Error(`Horario ocupado por un ensayo programado.`);
    }
    // ------------------------------------

    return new Promise((resolve) => {
      const maxId = mockReservations.reduce((max, r) => {
        const numId = parseInt(r.id, 10);
        return !isNaN(numId) && numId > max ? numId : max;
      }, 0);
      
      const newId = (maxId + 1).toString();

      const newRes: Reservation = {
        ...data,
        id: newId,
        paidAmount: 0,
        payments: [],
        status: 'Pendiente',
        createdAt: new Date().toISOString()
      };
      mockReservations = [newRes, ...mockReservations];
      setTimeout(() => resolve(newRes), 600);
    });
  },

  updateReservation: async (id: string, updates: Partial<Reservation>): Promise<Reservation> => {
    return new Promise((resolve, reject) => {
      const index = mockReservations.findIndex(r => r.id === id);
      if (index === -1) {
        reject('Reserva no encontrada');
        return;
      }
      mockReservations[index] = { ...mockReservations[index], ...updates };
      setTimeout(() => resolve(mockReservations[index]), 500);
    });
  },

  addPayment: async (reservaId: string, paymentData: Omit<Payment, 'id'>): Promise<Reservation> => {
    return new Promise((resolve, reject) => {
        const index = mockReservations.findIndex(r => r.id === reservaId);
        if (index === -1) {
            reject('Reserva no encontrada');
            return;
        }

        const reserva = mockReservations[index];
        const newPayment: Payment = {
            ...paymentData,
            id: Math.random().toString(36).substr(2, 9)
        };

        let newPaidAmount = reserva.paidAmount + newPayment.amount;
        if (newPaidAmount > reserva.totalAmount) {
            newPaidAmount = reserva.totalAmount;
        }

        let newStatus = reserva.status;
        if (newPaidAmount >= reserva.totalAmount) {
            newStatus = 'Finalizado';
        } else if (reserva.status === 'Pendiente' && newPaidAmount >= (reserva.totalAmount * 0.5)) {
            newStatus = 'Confirmado';
        }
        
        mockReservations[index] = {
            ...reserva,
            payments: [...reserva.payments, newPayment],
            paidAmount: newPaidAmount,
            status: newStatus
        };

        setTimeout(() => resolve(mockReservations[index]), 600);
    });
  },

  finalizeReservation: async (id: string): Promise<Reservation> => {
      return new Promise((resolve, reject) => {
          const index = mockReservations.findIndex(r => r.id === id);
          if (index === -1) {
              reject('Reserva no encontrada');
              return;
          }
          mockReservations[index] = {
              ...mockReservations[index],
              status: 'Finalizado'
          };
          setTimeout(() => resolve(mockReservations[index]), 500);
      });
  },

  cancelReservation: async (id: string, reason: string): Promise<Reservation> => {
      return new Promise((resolve, reject) => {
          const index = mockReservations.findIndex(r => r.id === id);
          if (index === -1) {
              reject('Reserva no encontrada');
              return;
          }
          mockReservations[index] = {
              ...mockReservations[index],
              status: 'Anulado',
              notes: (mockReservations[index].notes || '') + ` [Anulado: ${reason}]`
          };
          setTimeout(() => resolve(mockReservations[index]), 500);
      });
  }
};
