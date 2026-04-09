import { User, UserRole } from '@/types';
import api from '@/shared/api/api';

interface BackendUsuario {
  id: number
  nombre: string
  email: string
  estado: boolean
  rolId: number
  rol: { id: number; nombre: string }
  cliente: any | null
}

const mapBackendUsuarioToUser = (usuario: BackendUsuario): User => ({
  id: usuario.id.toString(),
  email: usuario.email,
  role:
    usuario.rol.nombre === 'ADMIN' ? UserRole.ADMIN :
    usuario.rol.nombre === 'EMPLEADO' ? UserRole.EMPLEADO :
    usuario.rol.nombre === 'CLIENTE' ? UserRole.CLIENTE :
    UserRole.GUEST,
  isActive: usuario.estado,
  name: usuario.nombre,
  lastName: '',
  documentType: 'CC',
  documentNumber: '',
  gender: 'O',
  birthDate: '',
  phone: '',
  city: '',
  neighborhood: '',
  address: '',
});

const mapUserToBackendPayload = (user: Partial<User>) => {
  const payload: any = {}
  if (user.name) payload.nombre = user.name
  if (user.email) payload.email = user.email
  if (user.role) payload.rolId =
    user.role === UserRole.ADMIN ? 1 :
    user.role === UserRole.EMPLEADO ? 2 :
    user.role === UserRole.CLIENTE ? 3 : 4
  if ((user as any).password) payload.password = (user as any).password
  if (user.isActive !== undefined) payload.isActive = user.isActive
  return payload
}

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get<BackendUsuario[]>('/usuarios')
    return response.data.map(mapBackendUsuarioToUser)
  },

  createUser: async (user: Omit<User, 'id'>): Promise<User> => {
    const payload = mapUserToBackendPayload(user)
    const response = await api.post<BackendUsuario>('/usuarios', payload)
    return mapBackendUsuarioToUser(response.data)
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
    const payload = mapUserToBackendPayload(updates)
    const response = await api.put<BackendUsuario>(`/usuarios/${id}`, payload)
    return mapBackendUsuarioToUser(response.data)
  },

  deleteUser: async (id: string): Promise<boolean> => {
    await api.delete(`/usuarios/${id}`)
    return true
  },
}
