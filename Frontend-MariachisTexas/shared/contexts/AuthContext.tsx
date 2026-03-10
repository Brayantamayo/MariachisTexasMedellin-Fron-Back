
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '../../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean; // Nuevo estado
  login: (email: string, password: string) => Promise<boolean>; // Ahora devuelve una promesa
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Lógica de Login con credenciales de prueba
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulamos un delay de red para mostrar la pantalla de carga (2 segundos)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Validación de contraseña general para pruebas
    if (password === '123456') {
      
      // Admin
      if (email === 'admin@texas.com') {
        setUser({
          id: '1',
          name: 'Administrador',
          lastName: 'Principal',
          email: email,
          role: UserRole.ADMIN,
          isActive: true,
          documentType: 'CC',
          documentNumber: '1000000001',
          gender: 'M',
          birthDate: '1980-01-01',
          phone: '3001234567',
          city: 'Medellín',
          neighborhood: 'El Poblado',
          address: 'Calle 10 # 5-51',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        });
        setIsLoading(false);
        return true;
      }
      
      // Músico / Empleado
      if (email === 'empleado@texas.com') {
        setUser({
          id: '2',
          name: 'Músico',
          lastName: 'Staff',
          email: email,
          role: UserRole.EMPLEADO,
          isActive: true,
          documentType: 'CC',
          documentNumber: '1000000002',
          gender: 'M',
          birthDate: '1992-05-15',
          phone: '3007654321',
          city: 'Medellín',
          neighborhood: 'Laureles',
          address: 'Av Nutibara # 70-10',
          mainInstrument: 'Trompeta',
          experienceYears: 5,
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        });
        setIsLoading(false);
        return true;
      }

      // Cliente 1
      if (email === 'cliente@texas.com') {
        setUser({
          id: '3',
          name: 'Cliente',
          lastName: 'VIP',
          email: email,
          role: UserRole.CLIENTE,
          isActive: true,
          documentType: 'CC',
          documentNumber: '1000000003',
          gender: 'F',
          birthDate: '1995-08-20',
          phone: '3101112233',
          city: 'Envigado',
          neighborhood: 'Jardines',
          address: 'Cra 43A # 25S-15',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        });
        setIsLoading(false);
        return true;
      }

      // Cliente 2: Brayan Castañeda
      if (email === 'brayan@texas.com') {
        setUser({
          id: '4',
          name: 'Brayan',
          lastName: 'Castañeda',
          email: email,
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
        });
        setIsLoading(false);
        return true;
      }
    }

    // Si falla
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
