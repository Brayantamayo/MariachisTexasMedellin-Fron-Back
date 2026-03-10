import { Service } from '@/types';

let mockServices: Service[] = [
  {
    id: 'urbana',
    name: 'Serenata Urbana',
    description: 'Serenata en zona urbana.',
    price: 480000,
    unit: 'Evento',
    isActive: true
  },
  {
    id: 'rural',
    name: 'Serenata Rural',
    description: 'Serenata en zona rural.',
    price: 650000,
    unit: 'Evento',
    isActive: true
  },
  {
    id: '1',
    name: 'Hora Extra',
    description: 'Hora adicional de presentación del mariachi.',
    price: 350000,
    unit: 'Hora',
    isActive: true
  },
  {
    id: '2',
    name: 'Canción Extra',
    description: 'Canción adicional fuera del repertorio contratado.',
    price: 20000,
    unit: 'Canción',
    isActive: true
  },
  {
    id: '3',
    name: 'Show de Zapateo',
    description: 'Show especial de baile y zapateo.',
    price: 150000,
    unit: 'Evento',
    isActive: true
  }
];

export const servicesService = {
  getServices: async (): Promise<Service[]> => {
    return new Promise((resolve) => setTimeout(() => resolve([...mockServices]), 500));
  },

  createService: async (service: Omit<Service, 'id' | 'isActive'>): Promise<Service> => {
    return new Promise((resolve) => {
      const newService = { ...service, id: Math.random().toString(36).substr(2, 9), isActive: true };
      mockServices = [newService, ...mockServices];
      setTimeout(() => resolve(newService as Service), 500);
    });
  },

  updateService: async (id: string, updates: Partial<Service>): Promise<Service> => {
    return new Promise((resolve, reject) => {
      const index = mockServices.findIndex(s => s.id === id);
      if (index === -1) {
        reject(new Error('Servicio no encontrado'));
        return;
      }
      mockServices[index] = { ...mockServices[index], ...updates };
      setTimeout(() => resolve(mockServices[index]), 500);
    });
  },

  deleteService: async (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
      mockServices = mockServices.filter(s => s.id !== id);
      setTimeout(() => resolve(true), 500);
    });
  }
};
