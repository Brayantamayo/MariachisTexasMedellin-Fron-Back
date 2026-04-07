
import { User, UserRole } from '@/types';
import api from '@/shared/api/api';

// ─── MAPEAR DE BACKEND A FRONTEND ────────────────────────────────────────────
const mapFromBackend = (backend: any): User => {
  const nombreCompleto = backend.nombre || '';
  const nombreParts = nombreCompleto.split(' ');
  
  const empleado = backend.empleado;
  const cliente = backend.cliente;

  return {
  id: String(backend.id),
  name: nombreParts[0] || '',
  lastName: nombreParts.slice(1).join(' ') || '',
  email: backend.email || '',
  role: backend.rol?.nombre as UserRole,
  isActive: backend.estado ?? false,
  documentType: empleado?.tipoDocumento || cliente?.tipoDocumento || 'CC',
  documentNumber: empleado?.numeroDocumento || cliente?.numeroDocumento || '',
  gender: 'M', // Default
  birthDate: empleado?.fechaNacimiento || cliente?.fechaNacimiento ? new Date(empleado?.fechaNacimiento || cliente?.fechaNacimiento).toISOString().split('T')[0] : '',
  phone: empleado?.telefonoPrincipal || cliente?.telefonoPrincipal || '',
  secondaryPhone: empleado?.telefonoAlternativo || cliente?.telefonoAlternativo || '',
  city: empleado?.ciudad || cliente?.ciudad || '',
  neighborhood: empleado?.barrio || cliente?.barrio || '',
  address: empleado?.direccion || cliente?.direccion || '',
  serviceZone: empleado?.zonaServicio || cliente?.zonaServicio || 'URBANA',
  // Campos específicos de empleado
  mainInstrument: empleado?.instrumentoPrincipal || '',
  otherInstruments: empleado?.otrosInstrumentos ? empleado.otrosInstrumentos.split(', ').filter((i: string) => i.trim()) : [],
  experienceYears: empleado?.anosExperiencia || 0,
  avatar: empleado?.foto || cliente?.foto || '',
  };
};

// ─── MAPEAR DE FRONTEND A BACKEND ────────────────────────────────────────────
const mapToBackend = (user: Omit<User, 'id'>) => ({
  nombre: `${user.name || ''} ${user.lastName || ''}`.trim() || 'Usuario',
  email: user.email,
  password: user.password || 'defaultpassword',
  rolId: user.role === UserRole.ADMIN ? 1 : user.role === UserRole.EMPLEADO ? 2 : 3, // Asumir ids
  ...(user.role === UserRole.EMPLEADO && {
    empleadoData: {
      tipoDocumento: user.documentType || 'CC',
      numeroDocumento: user.documentNumber,
      fechaNacimiento: user.birthDate ? new Date(user.birthDate) : null,
      telefonoPrincipal: user.phone,
      telefonoAlternativo: user.secondaryPhone || null,
      ciudad: user.city || 'Medellín',
      barrio: user.neighborhood,
      direccion: user.address,
      zonaServicio: user.serviceZone || 'URBANA',
      instrumentoPrincipal: user.mainInstrument,
      otrosInstrumentos: user.otherInstruments ? user.otherInstruments.join(', ') : null,
      anosExperiencia: user.experienceYears || 0,
      foto: user.avatar || null
    }
  }),
  ...(user.role === UserRole.CLIENTE && {
    clienteData: {
      apellido: user.lastName,
      foto: user.avatar || null,
      tipoDocumento: user.documentType || 'CC',
      numeroDocumento: user.documentNumber,
      fechaNacimiento: user.birthDate ? new Date(user.birthDate) : null,
      telefonoPrincipal: user.phone,
      telefonoAlternativo: user.secondaryPhone || null,
      ciudad: user.city || 'Medellín',
      barrio: user.neighborhood,
      direccion: user.address,
      zonaServicio: user.serviceZone || 'URBANA',
      activo: user.isActive
    }
  })
});

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/usuarios');
    return response.data.map(mapFromBackend);
  },

  createUser: async (user: Omit<User, 'id'>): Promise<User> => {
    const data = mapToBackend(user);
    const response = await api.post('/usuarios', data);
    return mapFromBackend(response.data);
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
    const nombre = updates.name ? `${updates.name} ${updates.lastName || ''}`.trim() : undefined;
    
    const data = {
      ...(nombre && { nombre }),
      ...(updates.email && { email: updates.email }),
      ...(updates.isActive !== undefined && { estado: updates.isActive }),
      ...(updates.role && { rolId: updates.role === UserRole.ADMIN ? 1 : updates.role === UserRole.EMPLEADO ? 2 : 3 }),
      ...(updates.role === UserRole.EMPLEADO && {
        empleadoData: {
          tipoDocumento: updates.documentType,
          numeroDocumento: updates.documentNumber,
          fechaNacimiento: updates.birthDate ? new Date(updates.birthDate) : undefined,
          telefonoPrincipal: updates.phone,
          telefonoAlternativo: updates.secondaryPhone,
          ciudad: updates.city,
          barrio: updates.neighborhood,
          direccion: updates.address,
          zonaServicio: updates.serviceZone,
          instrumentoPrincipal: updates.mainInstrument,
          otrosInstrumentos: updates.otherInstruments ? updates.otherInstruments.join(', ') : undefined,
          anosExperiencia: updates.experienceYears,
          foto: updates.avatar
        }
      }),
      ...(updates.role === UserRole.CLIENTE && {
        clienteData: {
          apellido: updates.lastName,
          foto: updates.avatar,
          tipoDocumento: updates.documentType,
          numeroDocumento: updates.documentNumber,
          fechaNacimiento: updates.birthDate ? new Date(updates.birthDate) : undefined,
          telefonoPrincipal: updates.phone,
          telefonoAlternativo: updates.secondaryPhone,
          ciudad: updates.city,
          barrio: updates.neighborhood,
          direccion: updates.address,
          zonaServicio: updates.serviceZone,
          activo: updates.isActive
        }
      })
    };
    const response = await api.put(`/usuarios/${id}`, data);
    return mapFromBackend(response.data);
  },

  deleteUser: async (id: string): Promise<boolean> => {
    await api.delete(`/usuarios/${id}`);
    return true;
  }
};
