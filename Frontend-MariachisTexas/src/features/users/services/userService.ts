
import { User, UserRole } from '@/types';
import api from '@/shared/api/api';

// ─── MAPEAR DE BACKEND A FRONTEND ────────────────────────────────────────────
const mapFromBackend = (backend: any): User => {
  const nombreCompleto = (backend.nombre || '').trim()
  const empleado = backend.empleado
  const cliente  = backend.cliente

  // apellido real guardado en la tabla cliente (empleados no tienen campo apellido)
  const apellido = (cliente?.apellido || '').trim()

  // Si hay apellido separado (cliente), quitarlo del final del nombre completo
  let nombre = nombreCompleto
  if (apellido) {
    const suffix = ' ' + apellido
    if (nombre.toLowerCase().endsWith(suffix.toLowerCase()))
      nombre = nombre.slice(0, nombre.length - suffix.length).trim()
  }

  // Separar por primer espacio para obtener nombre y apellido
  const spaceIdx  = nombre.indexOf(' ')
  const firstName = spaceIdx >= 0 ? nombre.slice(0, spaceIdx) : nombre
  const lastNameFb = apellido || (spaceIdx >= 0 ? nombre.slice(spaceIdx + 1) : '')

  return {
  id: String(backend.id),
  name: firstName,
  lastName: lastNameFb,
  email: backend.email || '',
  role: backend.rol?.nombre as UserRole,
  isActive: backend.estado ?? false,
  documentType: empleado?.tipoDocumento || cliente?.tipoDocumento || 'CC',
  documentNumber: empleado?.numeroDocumento || cliente?.numeroDocumento || '',
  gender: 'M',
  birthDate: empleado?.fechaNacimiento || cliente?.fechaNacimiento ? new Date(empleado?.fechaNacimiento || cliente?.fechaNacimiento).toISOString().split('T')[0] : '',
  phone: empleado?.telefonoPrincipal || cliente?.telefonoPrincipal || '',
  secondaryPhone: empleado?.telefonoAlternativo || cliente?.telefonoAlternativo || '',
  city: empleado?.ciudad || cliente?.ciudad || '',
  neighborhood: empleado?.barrio || cliente?.barrio || '',
  address: empleado?.direccion || cliente?.direccion || '',
  serviceZone: empleado?.zonaServicio || cliente?.zonaServicio || 'URBANA',
  mainInstrument: empleado?.instrumentoPrincipal || '',
  otherInstruments: empleado?.otrosInstrumentos ? empleado.otrosInstrumentos.split(', ').filter((i: string) => i.trim()) : [],
  experienceYears: empleado?.anosExperiencia || 0,
  avatar: empleado?.foto || cliente?.foto || '',
  hasActiveReservations: backend.hasActiveReservations ?? false,
  };
};

// ─── MAPEAR DE FRONTEND A BACKEND ────────────────────────────────────────────
// user puede traer roleId (string numérico del select dinámico) o role (nombre del enum)
const mapToBackend = (user: any) => {
  // Priorizar siempre roleId del select dinámico; solo usar fallback si no hay roleId
  const rolId = user.roleId
    ? Number(user.roleId)
    : user.role === UserRole.ADMIN ? 1 : user.role === UserRole.EMPLEADO ? 2 : 3;

  // isEmpleado: usar el nombre del rol resuelto (puede venir como 'EMPLEADO' desde el modal)
  const roleName = (user.role || '').toString().toUpperCase();
  const isEmpleado = roleName === 'EMPLEADO' || roleName === UserRole.EMPLEADO;

  return {
    nombre: `${user.name?.trim() || ''} ${user.lastName?.trim() || ''}`.trim() || 'Usuario',
    email: user.email,
    password: user.password || 'defaultpassword',
    rolId,
    ...(isEmpleado ? {
      empleadoData: {
        tipoDocumento: user.documentType || 'CC',
        numeroDocumento: user.documentNumber,
        fechaNacimiento: user.birthDate || null,
        telefonoPrincipal: user.phone,
        telefonoAlternativo: user.secondaryPhone || null,
        ciudad: user.city || 'Medellín',
        barrio: user.neighborhood,
        direccion: user.address,
        zonaServicio: user.serviceZone || 'URBANA',
        instrumentoPrincipal: user.mainInstrument,
        otrosInstrumentos: user.otherInstruments ? user.otherInstruments.join(', ') : null,
        anosExperiencia: Number(user.experienceYears) || 0,
        foto: user.avatar || null
      }
    } : {
      // CLIENTE y cualquier rol personalizado guardan datos en clienteData
      clienteData: {
        apellido: user.lastName?.trim() || '',
        foto: user.avatar || null,
        tipoDocumento: user.documentType || 'CC',
        numeroDocumento: user.documentNumber,
        fechaNacimiento: user.birthDate || null,
        telefonoPrincipal: user.phone,
        telefonoAlternativo: user.secondaryPhone || null,
        ciudad: user.city || 'Medellín',
        barrio: user.neighborhood,
        direccion: user.address,
        zonaServicio: user.serviceZone || 'URBANA',
        activo: user.isActive ?? true
      }
    })
  };
};

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/usuarios');
    return response.data.map(mapFromBackend);
  },

  createUser: async (user: any): Promise<User> => {
    const data = mapToBackend(user);
    console.log('📤 createUser payload:', JSON.stringify({ rolId: data.rolId, role: user.role, roleId: user.roleId }));
    const response = await api.post('/usuarios', data);
    return mapFromBackend(response.data);
  },

  updateUser: async (id: string, updates: any): Promise<User> => {
    const nombre = updates.name
      ? `${updates.name} ${updates.lastName || ''}`.replace(/\s+/g, ' ').trim()
      : undefined;

    const rolId = updates.roleId
      ? Number(updates.roleId)
      : updates.role
        ? (updates.role === UserRole.ADMIN ? 1 : updates.role === UserRole.EMPLEADO ? 2 : 3)
        : undefined;

    const roleName = (updates.role || '').toString().toUpperCase();
    const isEmpleado = roleName === 'EMPLEADO' || roleName === UserRole.EMPLEADO;
    // Hay datos de contacto si viene teléfono o documento
    const hasContactData = updates.phone || updates.documentNumber;

    const data = {
      ...(nombre                          && { nombre }),
      ...(updates.email                   && { email: updates.email }),
      ...(updates.isActive !== undefined  && { estado: updates.isActive }),
      ...(rolId !== undefined             && { rolId }),
      ...(isEmpleado && hasContactData ? {
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
          anosExperiencia: updates.experienceYears !== undefined ? Number(updates.experienceYears) : undefined,
          foto: updates.avatar
        }
      } : !isEmpleado && hasContactData ? {
        // Para CLIENTE y roles personalizados, siempre enviar clienteData si hay datos
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
      } : {})
    };
    const response = await api.put(`/usuarios/${id}`, data);
    return mapFromBackend(response.data);
  },

  deleteUser: async (id: string): Promise<boolean> => {
    await api.delete(`/usuarios/${id}`);
    return true;
  }
};
