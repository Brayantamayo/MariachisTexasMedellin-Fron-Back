
import { Quotation, UserRole } from '@/types';
import { blockService } from '../../bloqueos/services/blockService';
import { userService } from '../../users/services/userService';

const STORAGE_KEY = 'mariachis_quotations';
const EVENT_KEY = 'quotations_updated';

// Datos Mock Iniciales
const initialMockQuotations: Quotation[] = [
  {
    id: 'COT-1001',
    clientName: 'Roberto Gómez',
    clientId: '5',
    clientPhone: '3112223344',
    clientEmail: 'roberto.m@hotmail.com',
    eventDate: '2024-08-20',
    eventType: 'Serenata',
    location: 'El Poblado - Apto 501',
    startTime: '20:00',
    endTime: '21:00',
    repertoireIds: ['1', '5', '10'], 
    repertoireNotes: 'Le gustan las rancheras clásicas.',
    totalAmount: 480000,
    status: 'En Espera',
    createdAt: '2024-05-10T09:00:00.000Z'
  },
  {
    id: 'COT-1002',
    clientName: 'Luisa Fernanda',
    clientPhone: '3009998877',
    clientEmail: 'luisa.f@gmail.com',
    eventDate: '2024-09-15',
    eventType: 'Boda',
    location: 'Hacienda Fizebad',
    startTime: '16:00',
    endTime: '17:00',
    repertoireIds: ['3', '6', '12'],
    repertoireNotes: 'Entrada de la novia.',
    totalAmount: 650000,
    status: 'Convertida',
    createdAt: '2024-05-12T14:30:00.000Z'
  }
];

// Helper para cargar desde localStorage
const loadFromStorage = (): Quotation[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        // Inicializar si no existe
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMockQuotations));
        return initialMockQuotations;
    } catch (e) {
        console.error("Error loading quotations from storage", e);
        return initialMockQuotations;
    }
};

// Helper para guardar en localStorage y notificar
const saveToStorage = (quotations: Quotation[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(quotations));
        // Disparar evento para la misma pestaña
        window.dispatchEvent(new Event(EVENT_KEY));
        // Disparar evento para otras pestañas (storage event se dispara auto, pero a veces es útil forzar algo si usamos custom hooks)
    } catch (e) {
        console.error("Error saving quotations to storage", e);
    }
};

// Helper para obtener todas las horas dentro de un rango
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

export const cotizacionService = {
  getQuotations: async (): Promise<Quotation[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return loadFromStorage();
  },

  createQuotation: async (data: Omit<Quotation, 'id' | 'status' | 'createdAt'>): Promise<Quotation> => {
    const currentQuotations = loadFromStorage();

    // --- VALIDACIÓN DE DISPONIBILIDAD ESTRICTA (RANGO COMPLETO) ---
    const date = data.eventDate;
    const newStart = data.startTime;
    const newEnd = data.endTime;
    
    // Obtener todas las horas que esta nueva cotización ocuparía
    const newRequestedHours = getHoursInRange(newStart, newEnd);

    // 1. Verificar Bloqueos
    const blockStatus = await blockService.checkDateStatus(date);
    if (blockStatus.isBlocked) {
        throw new Error(`No se puede cotizar: La fecha está bloqueada (${blockStatus.reason}).`);
    }
    if (blockStatus.hasPartialBlocks && blockStatus.blockedRanges) {
        // Verificar si alguna de las horas solicitadas choca con bloqueos
        const isBlocked = newRequestedHours.some(h => 
            blockStatus.blockedRanges!.some(r => h >= r.start && h < r.end)
        );
        if (isBlocked) throw new Error('No se puede cotizar: El horario coincide con un bloqueo administrativo.');
    }

    // 2. Verificar Reservas Existentes
    const { reservaService } = await import('../../reservas/services/reservaService');
    const reservations = await reservaService.getReservations();
    const activeReservations = reservations.filter(r => r.eventDate === date && r.status !== 'Anulado');
    
    for (const res of activeReservations) {
        // Asumimos reserva dura 1 hora + buffer si no hay endTime explicito, pero mejor verificamos colisión directa
        const resTime = res.eventTime;
        const resPrevTime = getPreviousHour(resTime);
        
        // Si alguna hora solicitada es igual a la hora de una reserva o su hora anterior (buffer)
        if (newRequestedHours.includes(resTime) || newRequestedHours.includes(resPrevTime)) {
             throw new Error(`Horario no disponible. Ya existe un evento: ${res.eventType} a las ${res.eventTime}.`);
        }
    }

    // 3. Verificar Otras Cotizaciones En Espera (COLISIÓN DE RANGOS)
    const activeQuotes = currentQuotations.filter(q => q.eventDate === date && q.status === 'En Espera');
    
    for (const q of activeQuotes) {
        const existingOccupiedHours = getHoursInRange(q.startTime, q.endTime);
        
        // Verificar intersección de horas
        const overlap = newRequestedHours.some(h => existingOccupiedHours.includes(h));
        
        if (overlap) {
            throw new Error(`Conflicto de horario. Ya existe una cotización de ${q.startTime} a ${q.endTime}.`);
        }
    }

    // 4. Verificar Ensayos
    const { rehearsalService } = await import('../../ensayos/services/rehearsalService');
    const rehearsals = await rehearsalService.getRehearsals();
    const activeRehearsals = rehearsals.filter(r => r.date === date && r.status === 'Programado');
    
    for (const r of activeRehearsals) {
        if (newRequestedHours.includes(r.time)) {
             throw new Error(`Horario no disponible. Hay un ensayo programado a las ${r.time}.`);
        }
    }
    // ---------------------------------------------

    await new Promise(resolve => setTimeout(resolve, 600));
    const newQuotation: Quotation = {
      ...data,
      id: `COT-${Math.floor(Math.random() * 9000) + 1000}`,
      status: 'En Espera',
      createdAt: new Date().toISOString()
    };
    
    const updatedQuotations = [newQuotation, ...currentQuotations];
    saveToStorage(updatedQuotations);
    
    return newQuotation;
  },

  updateQuotation: async (id: string, updates: Partial<Quotation>): Promise<Quotation> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const currentQuotations = loadFromStorage();
    const index = currentQuotations.findIndex(q => q.id === id);
    
    if (index === -1) {
      throw new Error('Cotización no encontrada');
    }
    
    currentQuotations[index] = { ...currentQuotations[index], ...updates };
    saveToStorage(currentQuotations);
    
    return currentQuotations[index];
  },

  cancelQuotation: async (id: string): Promise<Quotation> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const currentQuotations = loadFromStorage();
      const index = currentQuotations.findIndex(q => q.id === id);
      
      if (index === -1) {
          throw new Error('Cotización no encontrada');
      }
      
      const updatedQuote = { ...currentQuotations[index], status: 'Anulada' as const };
      currentQuotations[index] = updatedQuote;
      saveToStorage(currentQuotations);
      
      return updatedQuote;
  },

  convertToReservation: async (id: string): Promise<{ quotation: Quotation, reservationId: string }> => {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const currentQuotations = loadFromStorage();
      const index = currentQuotations.findIndex(q => q.id === id);
      
      if (index === -1) {
          throw new Error('Cotización no encontrada');
      }
      
      const quote = currentQuotations[index];
      const originalStatus = quote.status;
      
      // Liberamos temporalmente para permitir que la reserva ocupe el espacio
      currentQuotations[index] = { ...quote, status: 'Convertida' as const }; 
      // Guardamos temporalmente para que la validación de reserva pase (si valida contra cotizaciones)
      saveToStorage(currentQuotations);

      try {
          // 1. Verificar si el usuario existe o crearlo
          let clientId = quote.clientId;
          
          // Si no tiene ID o queremos asegurar que exista por email
          if (!clientId || clientId === '') {
             const users = await userService.getUsers();
             const existingUser = users.find(u => u.email === quote.clientEmail);
             
             if (existingUser) {
                 clientId = existingUser.id;
             } else {
                 // Crear nuevo usuario
                 const nameParts = quote.clientName.split(' ');
                 const firstName = nameParts[0];
                 const lastName = nameParts.slice(1).join(' ') || 'Usuario';

                 const newUser = await userService.createUser({
                     name: firstName,
                     lastName: lastName,
                     email: quote.clientEmail,
                     role: UserRole.CLIENTE,
                     phone: quote.clientPhone,
                     city: 'Medellín',
                     address: quote.location,
                     isActive: true,
                     documentType: 'CC',
                     documentNumber: '',
                     gender: 'O',
                     birthDate: '',
                     neighborhood: ''
                 });
                 clientId = newUser.id;
             }
          }

          const { reservaService } = await import('../../reservas/services/reservaService');
          const newReservation = await reservaService.createReservation({
              clientName: quote.clientName,
              clientId: clientId,
              clientPhone: quote.clientPhone,
              clientEmail: quote.clientEmail,
              eventType: quote.eventType,
              eventDate: quote.eventDate,
              eventTime: quote.startTime, 
              location: quote.location, 
              address: quote.location, 
              neighborhood: '',
              repertoireIds: quote.repertoireIds,
              totalAmount: Number(quote.totalAmount) || 0, 
              notes: `Origen: Cotización #${quote.id}. ${quote.repertoireNotes ? 'Notas: ' + quote.repertoireNotes : ''}`,
              homenajeado: ''
          });
          
          return { quotation: currentQuotations[index], reservationId: newReservation.id };

      } catch (error) {
          // Revertir si falla
          currentQuotations[index] = { ...quote, status: originalStatus };
          saveToStorage(currentQuotations);
          throw error;
      }
  },

  downloadPdf: async (id: string): Promise<boolean> => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return true;
  }
};
