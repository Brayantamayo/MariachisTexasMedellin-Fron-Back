// ─── ROLES ────────────────────────────────────────────────────────────────────
export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLEADO = 'EMPLEADO',
  CLIENTE = 'CLIENTE',
  GUEST = 'GUEST'
}


// ─── TIPOS DE EVENTO (sincronizado con enum TipoEvento de Prisma) ─────────────
export const TIPOS_EVENTO = [
  'Boda',
  'Cumpleaños',
  'Quinceaños',
  'Funeral',
  'Reconciliación',
  'Día de la Madre',
  'Amor',
  'Aniversario',
  'Padres',
  'Fiesta',
  'Otro',
] as const

export type TipoEvento = typeof TIPOS_EVENTO[number]



// ─── USUARIO ──────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  role: UserRole
  isActive: boolean
  password?: string
  avatar?: string

  // Personales
  name: string
  lastName: string
  documentType: 'CC' | 'CE' | 'TI' | 'PAS'
  documentNumber: string
  gender: 'M' | 'F' | 'O'
  birthDate: string

  // Contacto
  phone: string
  secondaryPhone?: string
  city: string
  neighborhood: string
  address: string
  serviceZone?: 'Urbano' | 'Rural'

  // Solo EMPLEADO
  mainInstrument?: string
  otherInstruments?: string[]
  experienceYears?: number

  // Control de eliminación
  hasActiveReservations?: boolean
}

// ─── CANCIÓN ──────────────────────────────────────────────────────────────────
export interface Song {
  id: string
  title: string
  artist: string
  genre: string
  category: string
  lyrics: string
  audioUrl?: string
  duration: string
  difficulty: 'Baja' | 'Media' | 'Alta'
  coverImage?: string
  isActive: boolean
}

// ─── ENSAYO ───────────────────────────────────────────────────────────────────
export interface Rehearsal {
  id: string
  title: string
  location: string
  date: string    // YYYY-MM-DD — admin
  time: string    // HH:MM — admin
  notes: string
  hora?: string    // HH:MM — cliente (ruta pública)
  fecha?: string    // YYYY-MM-DD — cliente (ruta pública)
  repertoireIds: string[]
  status: 'PENDIENTE' | 'LISTO'
}

// ─── PAGOS ────────────────────────────────────────────────────────────────────
export interface Payment {
  id: string
  amount: number
  date: string
  type: 'Abono Inicial' | 'Abono Parcial' | 'Saldo Final' | 'Pago Total'
  method: 'Transferencia' | 'Efectivo'
  notes?: string
}

// ─── RESERVA ──────────────────────────────────────────────────────────────────
export interface Reservation {
  id: string
  cotizacionId?: string

  // Cliente
  clientName: string
  clientId?: string
  clientPhone?: string
  secondaryPhone?: string
  clientEmail?: string

  // Evento
  homenajeado?: string
  eventType: string
  eventDate: string   // YYYY-MM-DD
  eventTime: string   // HH:MM (legacy)
  startTime?: string
  endTime?: string

  // Ubicación
  location: string
  address?: string
  neighborhood?: string

  // Repertorio y servicios
  repertoireIds: string[]
  selectedServices?: { serviceId: string; quantity: number }[]

  // Económico
  totalAmount: number
  paidAmount: number
  pendingBalance?: number
  payments: Payment[]

  // Meta
  status: string   // PENDIENTE | CONFIRMADA | ANULADA (backend en mayúsculas)
  notes?: string
  createdAt: string
  updatedAt?: string
}

// ─── COTIZACIÓN ───────────────────────────────────────────────────────────────
export interface Quotation {
  id: string

  // Cliente
  clientName: string
  clientId?: string
  clientPhone: string
  secondaryPhone?: string
  clientEmail: string

  // Evento
  homenajeado?: string
  eventDate: string
  eventType: string
  location: string
  startTime: string
  endTime: string

  // Repertorio y servicios
  repertoireIds: string[]
  selectedServices?: { serviceId: string; quantity: number }[]
  repertoireNotes?: string
  notes?: string

  // Económico
  totalAmount: number
  isDirectReservation?: boolean

  // Meta
  status: string   // EN_ESPERA | CONVERTIDA | ANULADA (backend en mayúsculas)
  createdAt: string
  updatedAt?: string
}

// ─── BLOQUEO DE CALENDARIO ────────────────────────────────────────────────────
export interface CalendarBlock {
  id: string
  type: string   // FULL_DATE | TIME_RANGE | DATE_RANGE
  reason: string
  description?: string
  startDate: string   // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  startTime?: string   // HH:MM — solo TIME_RANGE
  endTime?: string   // HH:MM — solo TIME_RANGE
  isActive: boolean
}

// ─── SERVICIO ─────────────────────────────────────────────────────────────────
export interface Service {
  id: string
  nombre: string
  descripcion: string
  precio: number
  estado: boolean
}

// ─── MÓDULOS Y RUTAS ──────────────────────────────────────────────────────────
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
  | 'servicios'

export interface AppRoute {
  path: string
  label: string
  module: ModuleName
  roles: UserRole[]
  icon?: string
}

// ─── ROLES Y PERMISOS ─────────────────────────────────────────────────────────
export interface Permission {
  id: string
  module: ModuleName
  label: string
  description: string
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  isActive: boolean
  isSystem?: boolean
  createdAt: string
}

