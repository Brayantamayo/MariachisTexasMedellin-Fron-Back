
import { Role } from '@/types';

// Datos iniciales simulados con nombres de módulos
let mockRoles: Role[] = [
  {
    id: '1',
    name: 'Administrador Maestro',
    description: 'Acceso total a todos los módulos del sistema.',
    permissions: [
        'dashboard', 
        'usuarios', 
        'roles', 
        'empleados', 
        'clientes', 
        'reservas', 
        'repertorio', 
        'ensayos', 
        'bloqueos', 
        'ventas', 
        'cotizaciones', 
        'abonos'
    ],
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Músico Líder',
    description: 'Gestión de repertorio y visualización de ensayos.',
    permissions: ['repertorio', 'ensayos', 'reservas'],
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Vendedor',
    description: 'Encargado de reservas, cotizaciones y clientes.',
    permissions: ['reservas', 'cotizaciones', 'ventas', 'clientes', 'abonos'],
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

export const roleService = {
  getRoles: async (): Promise<Role[]> => {
    // Simulamos delay de red
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockRoles]), 500);
    });
  },

  createRole: async (role: Omit<Role, 'id' | 'createdAt'>): Promise<Role> => {
    return new Promise((resolve) => {
      const newRole: Role = {
        ...role,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      };
      mockRoles = [newRole, ...mockRoles];
      setTimeout(() => resolve(newRole), 500);
    });
  },

  updateRole: async (id: string, updates: Partial<Role>): Promise<Role> => {
    return new Promise((resolve, reject) => {
      const index = mockRoles.findIndex(r => r.id === id);
      if (index === -1) {
        reject(new Error('Rol no encontrado'));
        return;
      }
      mockRoles[index] = { ...mockRoles[index], ...updates };
      setTimeout(() => resolve(mockRoles[index]), 500);
    });
  },

  deleteRole: async (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
      mockRoles = mockRoles.filter(r => r.id !== id);
      setTimeout(() => resolve(true), 500);
    });
  }
};
