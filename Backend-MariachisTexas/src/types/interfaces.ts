// ─── ENSAYO ───────────────────────────────────────────────────────────────────
export interface EnsayoCreateInput {
  title:          string
  location:       string
  address?:       string | null
  date:           string
  time:           string
  status?:        'PENDIENTE' | 'LISTO'
  repertoireIds?: (string | number)[]
}

export interface EnsayoUpdateInput extends Partial<EnsayoCreateInput> {}

// ─── COTIZACIÓN ───────────────────────────────────────────────────────────────
export interface ServicioSeleccionado {
  serviceId: string | number
  quantity:  number
}

export interface CotizacionCreateInput {
  clientId?:        string | null
  clientName?:      string
  clientPhone:      string
  secondaryPhone?:  string | null
  clientEmail:      string
  homenajeado?:     string
  eventDate:        string
  eventType:        string
  startTime:        string
  endTime:          string
  location:         string
  notes?:           string | null
  repertoireNotes?: string | null
  totalAmount?:     number
  selectedServices: ServicioSeleccionado[]
  repertoireIds?:   (string | number)[]
}

export interface CotizacionUpdateInput extends Partial<CotizacionCreateInput> {}

// ─── RESERVA ──────────────────────────────────────────────────────────────────
export interface ReservaCreateInput {
  clienteId:         string | number
  eventDate:         string
  startTime:         string
  endTime:           string
  location:          string
  totalAmount:       number
  homenajeado?:      string
  eventType?:        string
  notes?:            string | null
  selectedServices?: ServicioSeleccionado[]
  repertoireIds?:    (string | number)[]
}

export interface ReservaUpdateInput {
  eventDate?:        string
  startTime?:        string
  endTime?:          string
  location?:         string
  homenajeado?:      string
  eventType?:        string
  notes?:            string | null
  totalAmount?:      number
  selectedServices?: ServicioSeleccionado[]
  repertoireIds?:    (string | number)[]
}

// ─── SERVICIO ─────────────────────────────────────────────────────────────────
export interface ServicioCreateInput {
  nombre:      string
  descripcion: string
  precio:      number
}

export interface ServicioUpdateInput extends Partial<ServicioCreateInput> {}

// ─── REPERTORIO ───────────────────────────────────────────────────────────────
export interface RepertorioCreateInput {
  title:       string
  artist:      string
  genre:       string
  category:    string
  duration:    string
  difficulty?: string
  lyrics?:     string | null
  coverImage?: string | null
  audioUrl?:   string | null
  isActive?:   boolean
}

export interface RepertorioUpdateInput extends Partial<RepertorioCreateInput> {}

// ─── BLOQUEO ──────────────────────────────────────────────────────────────────
export interface BloqueoCreateInput {
  type:         'TIME_RANGE' | 'FULL_DATE' | 'DATE_RANGE'
  reason:       string
  description?: string
  startDate:    string
  endDate?:     string
  startTime?:   string
  endTime?:     string
}

export interface BloqueoUpdateInput extends Partial<BloqueoCreateInput> {}

// ─── RESPUESTAS MAPEADAS ──────────────────────────────────────────────────────
export interface RehearsalResponse {
  id:            string
  title:         string
  location:      string
  address:       string
  date:          string
  time:          string
  notes:         string
  repertoireIds: string[]
  status:        'Pendiente' | 'Completado' | 'Programado'
  createdAt?:    string
  updatedAt?:    string
}

export interface PaymentResponse {
  id:     string
  amount: number
  date:   string
  method: string
  notes:  string
}

export interface ReservationResponse {
  id:               string
  cotizacionId:     string
  clientId:         string
  clientName:       string
  clientPhone:      string
  secondaryPhone:   string
  clientEmail:      string
  homenajeado:      string
  eventType:        string
  eventDate:        string
  eventTime:        string
  startTime:        string
  endTime:          string
  location:         string
  address:          string
  notes:            string
  repertoireIds:    string[]
  selectedServices: ServicioSeleccionado[]
  totalAmount:      number
  paidAmount:       number
  pendingBalance:   number
  status:           string
  payments:         PaymentResponse[]
  createdAt:        string
  updatedAt:        string
}

export interface SongResponse {
  id:         string
  title:      string
  artist:     string
  genre:      string
  category:   string
  lyrics:     string
  audioUrl:   string
  duration:   string
  difficulty: 'Baja' | 'Media' | 'Alta'
  coverImage: string
  isActive:   boolean
  createdAt?: string
  updatedAt?: string
}