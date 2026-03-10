
// Definición de Roles (Enum existente)
export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLEADO = 'EMPLEADO', // Se usa para Músicos
  CLIENTE = 'CLIENTE',
  GUEST = 'GUEST'
}

// Interfaz de Usuario
export interface User {
  id: string;
  // Datos de Cuenta
  email: string;
  role: UserRole;
  isActive: boolean;
  password?: string; // Solo para creación/edición, no se suele devolver en listas
  avatar?: string;

  // Datos Personales
  name: string; // Nombres
  lastName: string; // Apellidos
  documentType: 'CC' | 'CE' | 'TI' | 'PAS' | 'NIT';
  documentNumber: string;
  gender: 'M' | 'F' | 'O';
  birthDate: string;

  // Contacto y Ubicación
  phone: string;
  secondaryPhone?: string;
  city: string;
  neighborhood: string;
  address: string;
  serviceZone?: 'Urbano' | 'Rural';
  
  // Datos Específicos de Músico (Solo si role === EMPLEADO)
  mainInstrument?: string;
  otherInstruments?: string[];
  experienceYears?: number;
}

// Interfaz de Canción (Repertorio)
export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string; // Ranchera, Bolero, Son, Corrido, etc.
  category: string; // Boda, Serenata, Cumpleaños, Fúnebre
  lyrics: string;
  audioUrl?: string; // URL del demo o pista
  duration: string; // "3:45"
  difficulty: 'Baja' | 'Media' | 'Alta';
  coverImage?: string;
  isActive: boolean;
}

// Interfaz de Ensayo
export interface Rehearsal {
  id: string;
  title: string;
  location: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  notes: string;
  repertoireIds: string[]; // IDs de las canciones seleccionadas
  status: 'Programado' | 'Completado';
}

// --- NUEVO: SISTEMA DE RESERVAS ---

export type ReservationStatus = 'Pendiente' | 'Confirmado' | 'Finalizado' | 'Anulado';

export interface Payment {
    id: string;
    amount: number;
    date: string; // ISO Date
    type: 'Abono Inicial' | 'Abono Parcial' | 'Saldo Final' | 'Pago Total';
    method: 'Transferencia' | 'Efectivo' | 'Tarjeta';
    notes?: string;
}

export interface Reservation {
    id: string;
    clientName: string; 
    clientId?: string;
    clientPhone?: string;     // Nuevo
    secondaryPhone?: string;  // Nuevo
    clientEmail?: string;     // Nuevo
    
    // Detalles Evento
    homenajeado?: string;     // Nuevo
    eventType: string;        // Ocasión
    eventDate: string;        // YYYY-MM-DD
    eventTime: string;        // HH:MM (Legacy)
    startTime?: string;       // Nuevo: Hora inicio
    endTime?: string;         // Nuevo: Hora fin
    
    // Ubicación y Costos
    location: string;         // Nombre del lugar (ej: Casa, Salón)
    address?: string;
    neighborhood?: string;    // Nuevo
    
    // Repertorio
    repertoireIds: string[];  // Nuevo: canciones elegidas
    selectedServices?: { serviceId: string; quantity: number }[]; // Nuevo: Servicios extra seleccionados
    
    // Económico
    totalAmount: number;
    paidAmount: number; 
    payments: Payment[];
    
    status: ReservationStatus;
    createdAt: string; 
    notes?: string;
}

// --- NUEVO: SISTEMA DE COTIZACIONES ---
export type QuotationStatus = 'En Espera' | 'Convertida' | 'Anulada';

export interface Quotation {
    id: string;
    clientName: string;
    clientId?: string; // Opcional, si se vincula a un usuario existente
    clientPhone: string;
    secondaryPhone?: string;
    clientEmail: string;
    
    homenajeado?: string;
    eventDate: string;
    eventType: string;
    location: string; // Ubicación general o dirección
    
    startTime: string; // Hora inicio rango
    endTime: string;   // Hora fin rango
    
    repertoireIds: string[]; // IDs de canciones
    selectedServices?: { serviceId: string; quantity: number }[]; // Servicios extra seleccionados
    repertoireNotes?: string; // Notas adicionales
    totalAmount: number; // Valor calculado
    
    status: QuotationStatus;
    createdAt: string;
}

// --- NUEVO: SISTEMA DE BLOQUEOS DE AGENDA ---
export interface CalendarBlock {
  id: string;
  type: string; // 'FULL_DATE' | 'TIME_RANGE' | 'DATE_RANGE'
  reason: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startTime?: string; // HH:MM (Opcional, solo para TIME_RANGE)
  endTime?: string;   // HH:MM (Opcional, solo para TIME_RANGE)
  isActive: boolean;
}

// Interfaz de Servicio (Extra)
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: 'Hora' | 'Canción' | 'Evento' | 'Unidad';
  isActive: boolean;
}

// Módulos definidos en el requerimiento
export type ModuleName = 
  | 'home'
  | 'dashboard'
  | 'auth'
  | 'usuarios'
  | 'roles'
  | 'empleados'
  | 'repertorio'
  | 'ensayos'
  | 'ventas'
  | 'cotizaciones'
  | 'abonos'
  | 'reservas'
  | 'clientes'
  | 'perfil'
  | 'bloqueos'
  | 'servicios';

// Definición de Rutas para el sistema
export interface AppRoute {
  path: string;
  label: string;
  module: ModuleName;
  roles: UserRole[]; // Roles permitidos para esta ruta
  icon?: string;
}

// --- NUEVOS TIPOS PARA ROLES Y PERMISOS ---

export interface Permission {
  id: string;
  module: ModuleName;
  label: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Array de IDs de permisos
  isActive: boolean;
  createdAt: string;
}
