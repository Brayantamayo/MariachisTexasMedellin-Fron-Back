import api from '@/shared/api/api'
import { Role } from '@/types';

export interface BackendPermission {
  id: string
  module: string
  label: string
  description: string
  isActive: boolean
}

// Cache para no pedir permisos en cada operación
let permissionsCache: BackendPermission[] | null = null

const fetchPermissionsCache = async (): Promise<BackendPermission[]> => {
  if (permissionsCache) return permissionsCache
  const { data } = await api.get('/roles/permisos')
  permissionsCache = data as BackendPermission[]
  return permissionsCache
}

// Traduce nombres de módulo ["dashboard", "clientes"] → IDs numéricos [1, 3]
const resolvePermisosIds = async (nombres: string[]): Promise<number[]> => {
  if (!nombres.length) return []
  const perms = await fetchPermissionsCache()
  return nombres
    .map(nombre => perms.find(p => p.module === nombre)?.id)
    .filter(Boolean)
    .map(Number)
}

export const roleService = {
  getRoles: async (): Promise<Role[]> => {
    const { data } = await api.get('/roles')
    return data as Role[]
  },

  getPermissions: async (): Promise<BackendPermission[]> => {
    return fetchPermissionsCache()
  },

  createRole: async (role: any): Promise<Role> => {
    // role.permisos es string[] de nombres de módulo
    const permisos = await resolvePermisosIds(role.permisos ?? [])
    const payload = {
      nombre:      role.nombre,
      descripcion: role.descripcion ?? undefined,
      estado:      role.estado ?? true,
      permisos,
    }
    const { data } = await api.post('/roles', payload)
    return data as Role
  },

  updateRole: async (id: string, updates: any): Promise<Role> => {
    const payload: any = {}
    if (updates.nombre      !== undefined) payload.nombre      = updates.nombre
    if (updates.name        !== undefined) payload.nombre      = updates.name
    if (updates.descripcion !== undefined) payload.descripcion = updates.descripcion
    if (updates.description !== undefined) payload.descripcion = updates.description
    if (updates.estado      !== undefined) payload.estado      = updates.estado
    if (updates.isActive    !== undefined) payload.estado      = updates.isActive

    if (updates.permisos !== undefined) {
      payload.permisos = await resolvePermisosIds(updates.permisos)
    } else if (updates.permissions !== undefined) {
      payload.permisos = await resolvePermisosIds(updates.permissions)
    }

    const { data } = await api.put(`/roles/${id}`, payload)
    return data as Role
  },

  deleteRole: async (id: string): Promise<boolean> => {
    await api.delete(`/roles/${id}`)
    return true
  },

  clearPermissionsCache: () => { permissionsCache = null },
}
