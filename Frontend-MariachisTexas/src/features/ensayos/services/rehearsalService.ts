
import { Rehearsal } from '@/types';
import { blockService } from '../../bloqueos/services/blockService';

let mockRehearsals: Rehearsal[] = [
  {
    id: '1',
    title: 'Ensayo General Boda López',
    location: 'Sede Principal - Sala A',
    date: '2024-06-15',
    time: '14:00',
    notes: 'Revisar arreglos de "Si nos dejan" y vestuario de gala.',
    repertoireIds: ['1', '3'], 
    status: 'Programado'
  },
  {
    id: '2',
    title: 'Práctica de Nuevos Integrantes',
    location: 'Sede Norte',
    date: '2024-06-10',
    time: '09:00',
    notes: 'Enfoque en técnica vocal y desplazamiento escénico.',
    repertoireIds: ['2', '4'],
    status: 'Completado'
  }
];

// Helper para obtener horas ocupadas por rango
const getHoursInRange = (start: string, end: string): string[] => {
    const hours: string[] = [];
    const [startH] = start.split(':').map(Number);
    const [endH] = end.split(':').map(Number);
    
    if (endH < startH) {
        for (let i = startH; i <= 23; i++) hours.push(`${i.toString().padStart(2, '0')}:00`);
        for (let i = 0; i < endH; i++) hours.push(`${i.toString().padStart(2, '0')}:00`);
    } else {
        for (let i = startH; i < endH; i++) hours.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return hours;
};

const getPreviousHour = (time: string): string => {
    const [h, m] = time.split(':').map(Number);
    let prevH = h - 1;
    if (prevH < 0) prevH = 23;
    return `${prevH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const rehearsalService = {
  getRehearsals: async (): Promise<Rehearsal[]> => {
    return new Promise((resolve) => setTimeout(() => resolve([...mockRehearsals]), 500));
  },

  createRehearsal: async (rehearsal: Omit<Rehearsal, 'id'>): Promise<Rehearsal> => {
    // --- VALIDACIÓN DE DISPONIBILIDAD ---
    const date = rehearsal.date;
    const time = rehearsal.time;
    const prevTime = getPreviousHour(time);

    // 1. Verificar Bloqueos
    const blockStatus = await blockService.checkDateStatus(date);
    if (blockStatus.isBlocked) {
        throw new Error(`La fecha está bloqueada: ${blockStatus.reason}`);
    }
    if (blockStatus.hasPartialBlocks && blockStatus.blockedRanges) {
        const isBlocked = blockStatus.blockedRanges.some(range => time >= range.start && time < range.end);
        if (isBlocked) throw new Error('El horario seleccionado está bloqueado administrativamente.');
    }

    // 2. Verificar Reservas (Hora exacta o Buffer)
    const { reservaService } = await import('../../reservas/services/reservaService');
    const reservations = await reservaService.getReservations();
    const conflictRes = reservations.find(r => 
        r.eventDate === date && 
        r.status !== 'Anulado' &&
        (r.eventTime === time || r.eventTime === prevTime)
    );
    if (conflictRes) {
        throw new Error(`Horario ocupado por evento: ${conflictRes.eventType}.`);
    }

    // 3. Verificar Cotizaciones En Espera (RANGO COMPLETO)
    const { cotizacionService } = await import('../../cotizaciones/services/cotizacionService');
    const quotations = await cotizacionService.getQuotations();
    const activeQuotes = quotations.filter(q => q.eventDate === date && q.status === 'En Espera');
    
    for (const q of activeQuotes) {
        const occupiedHours = getHoursInRange(q.startTime, q.endTime);
        // Si la hora del ensayo cae dentro del rango de una cotización
        if (occupiedHours.includes(time)) {
            throw new Error(`Horario bloqueado por una cotización pendiente (${q.startTime} - ${q.endTime}).`);
        }
    }

    // 4. Verificar Otros Ensayos
    const conflictReh = mockRehearsals.find(r => 
        r.date === date && 
        r.status === 'Programado' &&
        (r.time === time || r.time === prevTime)
    );
    if (conflictReh) {
        throw new Error(`Ya existe otro ensayo programado en este horario o en su bloque de cierre.`);
    }
    // ------------------------------------

    return new Promise((resolve) => {
      const newRehearsal = { 
        ...rehearsal, 
        id: Math.random().toString(36).substr(2, 9),
        status: rehearsal.status || 'Programado'
      };
      mockRehearsals = [newRehearsal, ...mockRehearsals];
      setTimeout(() => resolve(newRehearsal), 500);
    });
  },

  updateRehearsal: async (id: string, updates: Partial<Rehearsal>): Promise<Rehearsal> => {
    return new Promise((resolve, reject) => {
      const index = mockRehearsals.findIndex(r => r.id === id);
      if (index === -1) {
        reject(new Error('Ensayo no encontrado'));
        return;
      }
      mockRehearsals[index] = { ...mockRehearsals[index], ...updates };
      setTimeout(() => resolve(mockRehearsals[index]), 500);
    });
  },

  deleteRehearsal: async (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
      mockRehearsals = mockRehearsals.filter(r => r.id !== id);
      setTimeout(() => resolve(true), 500);
    });
  }
};
