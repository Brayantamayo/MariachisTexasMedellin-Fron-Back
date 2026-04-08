import api from '@/shared/api/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Cliente {
  id: number
  nombre?: string
  apellido: string
  email: string
  tipoDocumento: 'CC' | 'CE' | 'PAS'
  numeroDocumento: string
  telefonoPrincipal: string
  ciudad: string
  barrio: string
  activo: boolean
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

export interface ClienteListResponse {
  clientes: Cliente[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const clienteService = {
  /**
   * Listar clientes con paginación
   */
  listar: async (page: number = 1, limit: number = 50): Promise<ClienteListResponse> => {
    const { data } = await api.get('/clientes', { params: { page, limit } })
    return data
  },

  /**
   * Buscar clientes por query
   */
  buscar: async (query: string): Promise<Cliente[]> => {
    const { data } = await api.get('/clientes/buscar', { params: { query } })
    return data.clientes
  },

  /**
   * Obtener cliente por ID
   */
  obtenerPorId: async (id: number): Promise<Cliente> => {
    const { data } = await api.get(`/clientes/${id}`)
    return data.cliente
  },
}