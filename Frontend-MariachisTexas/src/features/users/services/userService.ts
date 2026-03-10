
import { User, UserRole } from '@/types';

let mockUsers: User[] = [
  {
    id: '1',
    name: 'Juan',
    lastName: 'Pérez Admin',
    email: 'admin@texas.com',
    role: UserRole.ADMIN,
    isActive: true,
    documentType: 'CC',
    documentNumber: '10203040',
    gender: 'M',
    birthDate: '1985-06-15',
    phone: '3001234567',
    city: 'Medellín',
    neighborhood: 'Poblado',
    address: 'Calle 10 # 5-50',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: '2',
    name: 'Carlos',
    lastName: 'Guitarra',
    email: 'empleado@texas.com',
    role: UserRole.EMPLEADO,
    isActive: true,
    documentType: 'CC',
    documentNumber: '98765432',
    gender: 'M',
    birthDate: '1992-03-20',
    phone: '3109876543',
    city: 'Medellín',
    neighborhood: 'Laureles',
    address: 'Av Nutibara # 70-10',
    mainInstrument: 'Guitarra',
    otherInstruments: ['Voz', 'Vihuela'],
    experienceYears: 5,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  },
  {
    id: '3',
    name: 'María',
    lastName: 'Cliente VIP',
    email: 'cliente@texas.com',
    role: UserRole.CLIENTE,
    isActive: true,
    documentType: 'CC',
    documentNumber: '43215678',
    gender: 'F',
    birthDate: '1990-11-05',
    phone: '3205556677',
    city: 'Envigado',
    neighborhood: 'Jardines',
    address: 'Cra 43A # 25S-10',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
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
  }
];

export const userService = {
  getUsers: async (): Promise<User[]> => {
    return new Promise((resolve) => setTimeout(() => resolve([...mockUsers]), 600));
  },

  createUser: async (user: Omit<User, 'id'>): Promise<User> => {
    return new Promise((resolve) => {
      const newUser = { ...user, id: Math.random().toString(36).substr(2, 9), isActive: true };
      mockUsers = [newUser, ...mockUsers];
      setTimeout(() => resolve(newUser), 600);
    });
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
    return new Promise((resolve, reject) => {
      const index = mockUsers.findIndex(u => u.id === id);
      if (index === -1) {
        reject(new Error('Usuario no encontrado'));
        return;
      }
      mockUsers[index] = { ...mockUsers[index], ...updates };
      setTimeout(() => resolve(mockUsers[index]), 600);
    });
  },

  deleteUser: async (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
      mockUsers = mockUsers.filter(u => u.id !== id);
      setTimeout(() => resolve(true), 600);
    });
  }
};
