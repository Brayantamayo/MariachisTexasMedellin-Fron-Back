import { User, UserRole } from '@/types';

// Datos simulados iniciales para Empleados
let mockEmployees: User[] = [
  {
    id: '2',
    name: 'Carlos',
    lastName: 'Guitarra',
    email: 'carlos@texas.com',
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
    id: '4',
    name: 'Pedro',
    lastName: 'Trompeta',
    email: 'pedro@texas.com',
    role: UserRole.EMPLEADO,
    isActive: true,
    documentType: 'CC',
    documentNumber: '71231231',
    gender: 'M',
    birthDate: '1988-07-12',
    phone: '3001112233',
    city: 'Medellín',
    neighborhood: 'Belen',
    address: 'Cra 76 # 30-20',
    mainInstrument: 'Trompeta',
    otherInstruments: ['Coros'],
    experienceYears: 8,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  }
];

export const employeeService = {
  getEmployees: async (): Promise<User[]> => {
    return new Promise((resolve) => setTimeout(() => resolve([...mockEmployees]), 600));
  },

  createEmployee: async (employee: Omit<User, 'id'>): Promise<User> => {
    return new Promise((resolve) => {
      const newEmployee = { 
        ...employee, 
        id: Math.random().toString(36).substr(2, 9),
        role: UserRole.EMPLEADO, // Forzar rol
        isActive: true 
      };
      mockEmployees = [newEmployee, ...mockEmployees];
      setTimeout(() => resolve(newEmployee), 600);
    });
  },

  updateEmployee: async (id: string, updates: Partial<User>): Promise<User> => {
    return new Promise((resolve, reject) => {
      const index = mockEmployees.findIndex(u => u.id === id);
      if (index === -1) {
        reject(new Error('Empleado no encontrado'));
        return;
      }
      mockEmployees[index] = { ...mockEmployees[index], ...updates };
      setTimeout(() => resolve(mockEmployees[index]), 600);
    });
  },

  deleteEmployee: async (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
      mockEmployees = mockEmployees.filter(u => u.id !== id);
      setTimeout(() => resolve(true), 600);
    });
  }
};