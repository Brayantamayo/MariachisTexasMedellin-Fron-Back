
import api from '@/shared/api/api'
import { Role } from '@/types';

// Tipos para la API del backend
interface BackendRole {
  id: string
  name: string
  description: string
  permissions: string[]
  isActive: boolean
  createdAt: string
}

interface BackendPermission {
  id: string
  module: string
  label: string
  description: string
  isActive: boolean
}

export const roleService = {
  getRoles: async (): Promise<Role[]> => {
    try {
      const { data } = await api.get('/roles')
      return data as Role[]
    } catch (error) {
      console.error('Error fetching roles:', error)
      throw error
    }
  },

  getPermissions: async (): Promise<BackendPermission[]> => {
    try {
      const { data } = await api.get('/roles/permisos')
      return data as BackendPermission[]
    } catch (error) {
      console.error('Error fetching permissions:', error)
      throw error
    }
  },

  createRole: async (role: Omit<Role, 'id' | 'createdAt'>): Promise<Role> => {
    try {
      const payload = {
        nombre: role.name,
        descripcion: role.description || undefined,
        estado: role.isActive,
        permisos: role.permissions.map(p => parseInt(p)).filter(id => !isNaN(id))
      }

      const { data } = await api.post('/roles', payload)
      return data as Role
    } catch (error) {
      console.error('Error creating role:', error)
      throw error
    }
  },

  updateRole: async (id: string, updates: Partial<Role>): Promise<Role> => {
    try {
      const payload: any = {}

      if (updates.name !== undefined) payload.nombre = updates.name
      if (updates.description !== undefined) payload.descripcion = updates.description
      if (updates.isActive !== undefined) payload.estado = updates.isActive
      if (updates.permissions !== undefined) {
        payload.permisos = updates.permissions.map(p => parseInt(p)).filter(id => !isNaN(id))
      }

      const { data } = await api.put(`/roles/${id}`, payload)
      return data as Role
    } catch (error) {
      console.error('Error updating role:', error)
      throw error
    }
  },

  deleteRole: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/roles/${id}`)
      return true
    } catch (error) {
      console.error('Error deleting role:', error)
      throw error
    }
  }
};
