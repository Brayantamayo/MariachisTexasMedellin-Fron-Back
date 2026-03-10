
import { CalendarBlock } from '@/types';

let mockBlocks: CalendarBlock[] = [
  {
    id: '1',
    type: 'FULL_DATE',
    reason: 'Mantenimiento de Vehículos',
    description: 'La camioneta principal estará en el taller todo el día.',
    startDate: '2024-07-15',
    endDate: '2024-07-15',
    isActive: true
  },
  {
    id: '2',
    type: 'TIME_RANGE',
    reason: 'Clase Magistral',
    description: 'Capacitación de trompetas con el maestro invitado.',
    startDate: '2024-07-20',
    endDate: '2024-07-20',
    startTime: '08:00',
    endTime: '12:00',
    isActive: true
  },
  {
    id: '3',
    type: 'DATE_RANGE',
    reason: 'Vacaciones Colectivas',
    description: 'Semana de descanso para todo el grupo.',
    startDate: '2024-12-24',
    endDate: '2024-12-31',
    isActive: true
  }
];

export const blockService = {
  getBlocks: async (): Promise<CalendarBlock[]> => {
    return new Promise((resolve) => setTimeout(() => resolve([...mockBlocks]), 500));
  },

  createBlock: async (block: Omit<CalendarBlock, 'id'>): Promise<CalendarBlock> => {
    return new Promise((resolve) => {
      const newBlock = { 
        ...block, 
        id: Math.random().toString(36).substr(2, 9),
        isActive: true 
      };
      mockBlocks = [newBlock, ...mockBlocks];
      setTimeout(() => resolve(newBlock), 500);
    });
  },

  updateBlock: async (id: string, updates: Partial<CalendarBlock>): Promise<CalendarBlock> => {
    return new Promise((resolve, reject) => {
      const index = mockBlocks.findIndex(b => b.id === id);
      if (index === -1) {
        reject(new Error('Bloqueo no encontrado'));
        return;
      }
      mockBlocks[index] = { ...mockBlocks[index], ...updates };
      setTimeout(() => resolve(mockBlocks[index]), 500);
    });
  },

  deleteBlock: async (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
      mockBlocks = mockBlocks.filter(b => b.id !== id);
      setTimeout(() => resolve(true), 500);
    });
  },

  // Método Mejorado: Retorna detalles específicos de bloqueo
  checkDateStatus: async (dateStr: string): Promise<{ 
      isBlocked: boolean; 
      reason?: string; 
      type?: string; 
      hasPartialBlocks?: boolean;
      blockedRanges?: { start: string; end: string; reason: string }[] 
  }> => {
    return new Promise((resolve) => {
      // 1. Buscar todos los bloqueos activos para esta fecha
      const activeBlocks = mockBlocks.filter(b => {
        if (!b.isActive) return false;
        if (b.type === 'FULL_DATE' && b.startDate === dateStr) return true;
        if (b.type === 'DATE_RANGE' && dateStr >= b.startDate && dateStr <= b.endDate) return true;
        if (b.type === 'TIME_RANGE' && b.startDate === dateStr) return true;
        return false;
      });

      // 2. Prioridad: Si hay bloqueo total, bloquear todo el día
      const fullBlock = activeBlocks.find(b => b.type === 'FULL_DATE' || b.type === 'DATE_RANGE');
      if (fullBlock) {
        resolve({ 
            isBlocked: true, 
            reason: fullBlock.reason, 
            type: fullBlock.type 
        });
        return;
      }

      // 3. Si hay bloqueos parciales, recopilar rangos pero permitir abrir el form
      const timeBlocks = activeBlocks.filter(b => b.type === 'TIME_RANGE');
      if (timeBlocks.length > 0) {
          resolve({
              isBlocked: false, // Permitimos abrir, pero filtraremos horas
              hasPartialBlocks: true,
              blockedRanges: timeBlocks.map(b => ({
                  start: b.startTime || '00:00',
                  end: b.endTime || '23:59',
                  reason: b.reason
              }))
          });
          return;
      }

      // 4. Si no hay nada
      resolve({ isBlocked: false });
    });
  }
};
