
import api from '@/shared/api/api'
import { User } from '@/types'

// Interfaces para la API
interface ClienteAPI {
  id: number
  email: string
  apellido: string
  tipoDocumento: 'CC' | 'CE' | 'PAS'
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

// Convertir de API a User
const mapClienteToUser = (cliente: ClienteAPI): User => ({
  id: cliente.id.toString(),
  name: cliente.usuario?.nombre || 'Sin nombre',
  lastName: cliente.apellido,
  email: cliente.email,
  role: 'CLIENTE' as any,
  isActive: cliente.activo,
  documentType: cliente.tipoDocumento,
  documentNumber: cliente.numeroDocumento,
  gender: 'O' as any, // No hay gender en API
  birthDate: cliente.fechaNacimiento.split('T')[0],
  phone: cliente.telefonoPrincipal,
  secondaryPhone: cliente.telefonoAlternativo,
  city: cliente.ciudad,
  neighborhood: cliente.barrio,
  address: cliente.direccion,
  serviceZone: cliente.zonaServicio === 'URBANA' ? 'Urbano' : 'Rural',
  avatar: cliente.foto,
})

// Convertir de User a API
const mapUserToCliente = (user: Omit<User, 'id'>) => ({
  email: user.email,
  apellido: user.lastName,
  tipoDocumento: user.documentType,
  numeroDocumento: user.documentNumber,
  fechaNacimiento: user.birthDate,
  telefonoPrincipal: user.phone,
  telefonoAlternativo: user.secondaryPhone,
  ciudad: user.city,
  barrio: user.neighborhood,
  direccion: user.address,
  zonaServicio: user.serviceZone === 'Urbano' ? 'URBANA' : 'RURAL',
  foto: user.avatar,
})

export const clientService = {
  getClients: async (page: number = 1, limit: number = 10): Promise<{ clients: User[], pagination: any }> => {
    const response = await api.get<ListResponse>(`/clientes?page=${page}&limit=${limit}`)
    const clients = response.data.clientes.map(mapClienteToUser)
    return { clients, pagination: response.data.pagination }
  },

  searchClients: async (query: string): Promise<User[]> => {
    const response = await api.get<{ clientes: ClienteAPI[] }>(`/clientes/buscar?query=${encodeURIComponent(query)}`)
    return response.data.clientes.map(mapClienteToUser)
  },

  getClientById: async (id: string): Promise<User> => {
    const response = await api.get<{ cliente: ClienteAPI }>(`/clientes/${id}`)
    return mapClienteToUser(response.data.cliente)
  },

  createClient: async (client: Omit<User, 'id'>): Promise<User> => {
    const data = mapUserToCliente(client)
    const response = await api.post<{ cliente: ClienteAPI }>('/clientes', data)
    return mapClienteToUser(response.data.cliente)
  },

  updateClient: async (id: string, updates: Partial<User>): Promise<User> => {
    const data = mapUserToCliente(updates as Omit<User, 'id'>)
    const response = await api.put<{ cliente: ClienteAPI }>(`/clientes/${id}`, data)
    return mapClienteToUser(response.data.cliente)
  },

  deleteClient: async (id: string): Promise<boolean> => {
    await api.delete(`/clientes/${id}`)
    return true
  },

  toggleClientStatus: async (id: string, active: boolean): Promise<User> => {
    const response = await api.patch<{ cliente: ClienteAPI }>(`/clientes/${id}/estado`, { activo: active })
    return mapClienteToUser(response.data.cliente)
  }
}
