import api from '@/shared/api/api'
import { User } from '@/types'

// ─── INTERFACES ───────────────────────────────────────────────────────────────

interface ClienteAPI {
  id: number
  email: string
  apellido: string
  tipoDocumento: 'CC' | 'CE' | 'TI' | 'PAS'
  numeroDocumento: string
  fechaNacimiento: string
  telefonoPrincipal: string
  telefonoAlternativo?: string
  ciudad: string
  barrio: string
  direccion: string
  zonaServicio: 'URBANA' | 'RURAL'
  activo: boolean
  foto?: string
  createdAt: string
  updatedAt: string
  usuario?: {
    nombre: string
    email: string
  }
  _count?: {
    cotizaciones: number
    abonos: number
    ventas: number
  }
}

interface ListResponse {
  clientes: ClienteAPI[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface SearchResponse {
  clientes: ClienteAPI[]
}

// ─── MAPPERS ──────────────────────────────────────────────────────────────────

// API → User (frontend)
const mapClienteToUser = (cliente: ClienteAPI): User => {
  const nombreCompleto = cliente.usuario?.nombre || 'Sin nombre'
  const apellido = (cliente.apellido || '').trim()

  // usuario.nombre puede venir como "Juan García" (nombre + apellido juntos).
  // Extraemos solo el primer nombre eliminando el apellido del final,
  // usando comparación case-insensitive y tolerando espacios extra.
  let nombre = nombreCompleto.trim()
  if (apellido) {
    const suffix = ' ' + apellido
    const lower  = nombre.toLowerCase()
    const sfxLow = suffix.toLowerCase()
    if (lower.endsWith(sfxLow)) {
      nombre = nombre.slice(0, nombre.length - suffix.length).trim()
    }
  }

  return {
    id: cliente.id.toString(),
    name: nombre || nombreCompleto,
    lastName: apellido,
    email: cliente.email,
    role: 'CLIENTE' as any,
    isActive: cliente.activo,
    documentType: cliente.tipoDocumento,
    documentNumber: cliente.numeroDocumento,
    gender: 'O' as any,
    birthDate: cliente.fechaNacimiento.split('T')[0],
    phone: cliente.telefonoPrincipal,
    secondaryPhone: cliente.telefonoAlternativo,
    city: cliente.ciudad,
    neighborhood: cliente.barrio,
    address: cliente.direccion,
    serviceZone: cliente.zonaServicio === 'URBANA' ? 'Urbano' : 'Rural',
    avatar: cliente.foto,
    hasActiveReservations: (cliente as any).hasActiveReservations ?? false,
  }
}

// User (frontend) → API (CREATE)
const mapUserToClienteCreate = (user: Partial<Omit<User, 'id'>>) => {
  const nombre = `${user.name || ''} ${user.lastName || ''}`.trim()
  return {
    nombre,
    apellido:          user.lastName?.trim() || '',
    email:             user.email,
    tipoDocumento:     user.documentType || 'CC',
    numeroDocumento:   user.documentNumber,
    fechaNacimiento:   user.birthDate,
    telefonoPrincipal: user.phone,
    ...(user.secondaryPhone?.trim() && { telefonoAlternativo: user.secondaryPhone }),
    ciudad:            user.city || 'Medellín',
    barrio:            user.neighborhood,
    direccion:         user.address,
    zonaServicio:      user.serviceZone === 'Rural' ? 'RURAL' : 'URBANA',
    ...(user.avatar?.startsWith('http') && { foto: user.avatar }),
  }
}

// User (frontend) → API (UPDATE)
const mapUserToClienteUpdate = (user: Partial<Omit<User, 'id'>>) => {
  const data: Record<string, any> = {}

  // nombreUsuario sincroniza el nombre en la tabla usuario
  if (user.name !== undefined || user.lastName !== undefined) {
    const nombre = `${user.name || ''} ${user.lastName || ''}`.trim()
    if (nombre) data.nombreUsuario = nombre
  }

  if (user.email !== undefined)          data.email             = user.email
  if (user.lastName !== undefined)       data.apellido          = user.lastName
  if (user.documentType !== undefined)   data.tipoDocumento     = user.documentType
  if (user.documentNumber !== undefined) data.numeroDocumento   = user.documentNumber
  if (user.birthDate !== undefined)      data.fechaNacimiento   = user.birthDate
  if (user.phone !== undefined)          data.telefonoPrincipal = user.phone
  if (user.city !== undefined)           data.ciudad            = user.city
  if (user.neighborhood !== undefined)   data.barrio            = user.neighborhood
  if (user.address !== undefined)        data.direccion         = user.address

  if (user.serviceZone !== undefined && user.serviceZone !== null && user.serviceZone.trim() !== '') {
    const zone = user.serviceZone.trim()
    data.zonaServicio = zone === 'Urbano' ? 'URBANA' : zone === 'Rural' ? 'RURAL' : 'URBANA'
  }

  if (user.secondaryPhone?.trim())
    data.telefonoAlternativo = user.secondaryPhone

  if (user.avatar?.startsWith('http'))
    data.foto = user.avatar

  return data
}

// ─── SERVICE ──────────────────────────────────────────────────────────────────

export const clientService = {

  // GET /clientes  →  { clientes: [...], pagination: {...} }
  getClients: async (): Promise<{ clients: User[]; pagination: any }> => {
    const response = await api.get<ListResponse>('/clientes')
    return {
      clients: response.data.clientes.map(mapClienteToUser),
      pagination: response.data.pagination,
    }
  },

  // GET /clientes/buscar?query=  →  ClienteAPI[]  (retorna wrapper)
  searchClients: async (query: string): Promise<User[]> => {
    const response = await api.get<SearchResponse>(
      `/clientes/buscar?query=${encodeURIComponent(query)}`
    )
    return response.data.clientes.map(mapClienteToUser)
  },

  // GET /clientes/:id  →  ClienteAPI  (retorna objeto directo)
  getClientById: async (id: string): Promise<User> => {
    const response = await api.get<ClienteAPI>(`/clientes/${id}`)
    return mapClienteToUser(response.data)
  },

  // POST /clientes  →  ClienteAPI  (retorna objeto directo)
  createClient: async (client: Omit<User, 'id'>): Promise<User> => {
    const response = await api.post<ClienteAPI | { message: string; cliente: ClienteAPI }>('/clientes', mapUserToClienteCreate(client))
    const result = 'cliente' in response.data ? response.data.cliente : response.data
    return mapClienteToUser(result)
  },

  // PUT /clientes/:id  →  ClienteAPI  (retorna objeto directo)
  updateClient: async (id: string, updates: Partial<User>): Promise<User> => {
    const response = await api.put<ClienteAPI | { message: string; cliente: ClienteAPI }>(`/clientes/${id}`, mapUserToClienteUpdate(updates))
    const result = 'cliente' in response.data ? response.data.cliente : response.data
    return mapClienteToUser(result)
  },

  // DELETE /clientes/:id  →  { message: string }
  deleteClient: async (id: string): Promise<boolean> => {
    await api.delete(`/clientes/${id}`)
    return true
  },

  // PATCH /clientes/:id/estado  →  ClienteAPI  (retorna objeto directo o wrapper)
  toggleClientStatus: async (id: string, active: boolean): Promise<User> => {
    const response = await api.patch<ClienteAPI | { message: string; cliente: ClienteAPI }>(
      `/clientes/${id}/estado`,
      { activo: active }
    )
    const result = 'cliente' in response.data ? response.data.cliente : response.data
    return mapClienteToUser(result)
  },
}