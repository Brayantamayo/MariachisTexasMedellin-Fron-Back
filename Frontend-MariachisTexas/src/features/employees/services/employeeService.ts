import { User, UserRole } from '@/types';
import api from '@/shared/api/api';

// Cache para el rol EMPLEADO
let empleadoRolId: number | null = null;

// ─── OBTENER ROL EMPLEADO ───────────────────────────────────────────────────
const getEmpleadoRolId = async (): Promise<number> => {
  if (empleadoRolId) return empleadoRolId;
  
  try {
    // Intentar obtener del endpoint público
    const response = await api.get('/roles/public/empleado-rol-id');
    empleadoRolId = response.data.rolId;
    return empleadoRolId;
  } catch (err) {
    console.warn('No se pudo obtener rol EMPLEADO del servidor, usando fallback');
    // Fallback: asumir rolId 2
    empleadoRolId = 2;
    return empleadoRolId;
  }
};

// ─── MAPEAR DE BACKEND A FRONTEND ────────────────────────────────────────────
const mapFromBackend = (backend: any): User => {
  const nombreCompleto = backend.nombre || '';
  const nombreParts = nombreCompleto.split(' ');
  
  return {
  id: String(backend.id),
  name: nombreParts[0] || '',
  lastName: nombreParts.slice(1).join(' ') || '',
  email: backend.email || '',
  role: backend.rol?.nombre as UserRole,
  isActive: backend.estado ?? false,
  documentType: backend.empleado?.tipoDocumento || 'CC',
  documentNumber: backend.empleado?.numeroDocumento || '',
  gender: 'M', // Default - no almacenado en backend
  birthDate: backend.empleado?.fechaNacimiento ? new Date(backend.empleado.fechaNacimiento).toISOString().split('T')[0] : '',
  phone: backend.empleado?.telefonoPrincipal || '',
  secondaryPhone: backend.empleado?.telefonoAlternativo || '',
  city: backend.empleado?.ciudad || '',
  neighborhood: backend.empleado?.barrio || '',
  address: backend.empleado?.direccion || '',
  serviceZone: backend.empleado?.zonaServicio || 'URBANA',
  // Campos adicionales para empleados
  mainInstrument: backend.empleado?.instrumentoPrincipal || '',
  otherInstruments: backend.empleado?.otrosInstrumentos ? backend.empleado.otrosInstrumentos.split(', ').filter((i: string) => i.trim()) : [],
  experienceYears: backend.empleado?.anosExperiencia || 0,
  avatar: backend.empleado?.foto || '',
  password: undefined // No devolver password
  };
};

// ─── MAPEAR DE FRONTEND A BACKEND ────────────────────────────────────────────
const mapToBackend = async (user: Omit<User, 'id'>) => {
  // Combinar nombre y lastName en un solo campo "nombre"
  const nombre = `${user.name} ${user.lastName}`.trim();
  const rolId = await getEmpleadoRolId();

  if (!user.password) {
    throw new Error('Contraseña es requerida');
  }

  return {
    nombre,
    email: user.email,
    password: user.password,
    rolId,
    // Datos adicionales del empleado
    tipoDocumento: user.documentType || 'CC',
    numeroDocumento: user.documentNumber,
    fechaNacimiento: user.birthDate,
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
  };
};

export const employeeService = {
  getEmployees: async (): Promise<User[]> => {
    const response = await api.get('/empleados');
    return response.data.map(mapFromBackend);
  },

  createEmployee: async (employee: Omit<User, 'id'>): Promise<User> => {
    const data = await mapToBackend(employee);
    const response = await api.post('/empleados', data);
    return mapFromBackend(response.data);
  },

  updateEmployee: async (id: string, updates: Partial<User>): Promise<User> => {
    const nombre = updates.name ? `${updates.name} ${updates.lastName || ''}`.trim() : undefined;
    
    const data = {
      ...(nombre && { nombre }),
      ...(updates.email && { email: updates.email }),
      ...(updates.isActive !== undefined && { estado: updates.isActive }),
    };
    
    const response = await api.put(`/empleados/${id}`, data);
    return mapFromBackend(response.data);
  },

  deleteEmployee: async (id: string): Promise<boolean> => {
    await api.delete(`/empleados/${id}`);
    return true;
  }
};