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

// ─── MAPPERS ──────────────────────────────────────────────────────────────────

// API → User (frontend)
const mapClienteToUser = (cliente: ClienteAPI): User => ({
  id: cliente.id.toString(),
  name: cliente.usuario?.nombre || 'Sin nombre',
  lastName: cliente.apellido,
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
})

// User (frontend) → API
const mapUserToCliente = (user: Partial<Omit<User, 'id'>>) => {
  const data: Record<string, any> = {}

  if (user.email !== undefined)        data.email             = user.email
  if (user.lastName !== undefined)     data.apellido          = user.lastName
  if (user.documentType !== undefined) data.tipoDocumento     = user.documentType
  if (user.documentNumber !== undefined) data.numeroDocumento = user.documentNumber
  if (user.birthDate !== undefined)    data.fechaNacimiento   = user.birthDate
  if (user.phone !== undefined)        data.telefonoPrincipal = user.phone
  if (user.city !== undefined)         data.ciudad            = user.city
  if (user.neighborhood !== undefined) data.barrio            = user.neighborhood
  if (user.address !== undefined)      data.direccion         = user.address

  if (user.serviceZone !== undefined)
    data.zonaServicio = user.serviceZone === 'Urbano' ? 'URBANA' : 'RURAL'

  // Opcionales — solo se envían si tienen valor real
  if (user.secondaryPhone?.trim())
    data.telefonoAlternativo = user.secondaryPhone

  if (user.avatar?.startsWith('http'))
    data.foto = user.avatar

  return data
}

// ─── SERVICE ──────────────────────────────────────────────────────────────────

export const clientService = {

  // GET /clientes?page=&limit=  →  { clientes: [...], pagination: {...} }
  getClients: async (page = 1, limit = 10): Promise<{ clients: User[]; pagination: any }> => {
    const response = await api.get<ListResponse>(`/clientes?page=${page}&limit=${limit}`)
    return {
      clients: response.data.clientes.map(mapClienteToUser),
      pagination: response.data.pagination,
    }
  },

  // GET /clientes/buscar?query=  →  ClienteAPI[]  (retorna array directo)
  searchClients: async (query: string): Promise<User[]> => {
    const response = await api.get<ClienteAPI[]>(
      `/clientes/buscar?query=${encodeURIComponent(query)}`
    )
    return response.data.map(mapClienteToUser)
  },

  // GET /clientes/:id  →  ClienteAPI  (retorna objeto directo)
  getClientById: async (id: string): Promise<User> => {
    const response = await api.get<ClienteAPI>(`/clientes/${id}`)
    return mapClienteToUser(response.data)
  },

  // POST /clientes  →  ClienteAPI  (retorna objeto directo)
  createClient: async (client: Omit<User, 'id'>): Promise<User> => {
    const response = await api.post<ClienteAPI>('/clientes', mapUserToCliente(client))
    return mapClienteToUser(response.data)
  },

  // PUT /clientes/:id  →  ClienteAPI  (retorna objeto directo)
  updateClient: async (id: string, updates: Partial<User>): Promise<User> => {
    const response = await api.put<ClienteAPI>(`/clientes/${id}`, mapUserToCliente(updates))
    return mapClienteToUser(response.data)
  },

  // DELETE /clientes/:id  →  { message: string }
  deleteClient: async (id: string): Promise<boolean> => {
    await api.delete(`/clientes/${id}`)
    return true
  },

  // PATCH /clientes/:id/estado  →  ClienteAPI  (retorna objeto directo)
  toggleClientStatus: async (id: string, active: boolean): Promise<User> => {
    const response = await api.patch<ClienteAPI>(
      `/clientes/${id}/estado`,
      { activo: active }
    )
    return mapClienteToUser(response.data)
  },
}