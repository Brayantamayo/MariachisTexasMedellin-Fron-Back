
import { User, UserRole } from '@/types';

// Datos simulados para clientes
let mockClients: User[] = [
  {
    id: '3', // ID debe coincidir o ser único respecto a usuarios
    name: 'María',
    lastName: 'González',
    email: 'maria.g@gmail.com',
    role: UserRole.CLIENTE,
    isActive: true,
    documentType: 'CC',
    documentNumber: '43215678',
    gender: 'F',
    birthDate: '1990-11-05',
    phone: '3205556677',
    secondaryPhone: '6044445566',
    city: 'Envigado',
    neighborhood: 'Jardines',
    address: 'Cra 43A # 25S-10',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: '5',
    name: 'Roberto',
    lastName: 'Martínez',
    email: 'roberto.m@hotmail.com',
    role: UserRole.CLIENTE,
    isActive: true,
    documentType: 'CC',
    documentNumber: '70809010',
    gender: 'M',
    birthDate: '1985-02-14',
    phone: '3112223344',
    city: 'Medellín',
    neighborhood: 'Poblado',
    address: 'Calle 10 # 30-50',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: '6',
    name: 'Finca La Florida',
    lastName: '(Eventos)',
    email: 'admin@laflorida.com',
    role: UserRole.CLIENTE,
    isActive: false,
    documentType: 'CE',
    documentNumber: '900123123',
    gender: 'O',
    birthDate: '2000-01-01',
    phone: '3156667788',
    city: 'Rionegro',
    neighborhood: 'Vereda Cabeceras',
    address: 'Km 5 Vía Llanogrande',
  },
  {
    id: '4',
    name: 'Brayan',
    lastName: 'Castañeda',
    email: 'brayan@texas.com',
    role: UserRole.CLIENTE,
    isActive: true,
    documentType: 'CC',
    documentNumber: '1152433654',
    gender: 'M',
    birthDate: '1998-11-20',
    phone: '3219876543',
    city: 'Medellín',
    neighborhood: 'Robledo',
    address: 'Calle 65 # 80-20',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: 'cli-directa',
    name: 'Cliente',
    lastName: 'Directa',
    email: 'ventas_mostrador@texas.com',
    role: UserRole.CLIENTE,
    isActive: true,
    documentType: 'NIT',
    documentNumber: '222222222',
    gender: 'O',
    birthDate: '2000-01-01',
    phone: '0000000000',
    city: 'Medellín',
    neighborhood: 'Sede Principal',
    address: 'Venta por Mostrador',
    avatar: 'https://ui-avatars.com/api/?name=Cliente+Directa&background=dc2626&color=fff&bold=true'
  }
];

export const clientService = {
  getClients: async (): Promise<User[]> => {
    return new Promise((resolve) => setTimeout(() => resolve([...mockClients]), 500));
  },

  createClient: async (client: Omit<User, 'id'>): Promise<User> => {
    return new Promise((resolve) => {
      const newClient = { 
        ...client, 
        id: Math.random().toString(36).substr(2, 9),
        role: UserRole.CLIENTE, // Asegurar rol
        isActive: true 
      };
      mockClients = [newClient, ...mockClients];
      setTimeout(() => resolve(newClient), 500);
    });
  },

  updateClient: async (id: string, updates: Partial<User>): Promise<User> => {
    return new Promise((resolve, reject) => {
      const index = mockClients.findIndex(c => c.id === id);
      if (index === -1) {
        reject(new Error('Cliente no encontrado'));
        return;
      }
      mockClients[index] = { ...mockClients[index], ...updates };
      setTimeout(() => resolve(mockClients[index]), 500);
    });
  },

  deleteClient: async (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
      mockClients = mockClients.filter(c => c.id !== id);
      setTimeout(() => resolve(true), 500);
    });
  }
};
