import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { authService } from '@/src/features/auth/pages/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // ✅ FIX 2: Iniciar en true para evitar flash de login al recargar
  const [isLoading, setIsLoading] = useState(true);

  // ✅ FIX 1 + 2: Recuperar sesión y adjuntar token a axios al arrancar
  useEffect(() => {
    const token    = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        // Restaurar usuario en estado
        setUser(JSON.parse(userData));

        // ✅ FIX 1: Adjuntar token a todas las peticiones futuras
        authService.setAuthToken(token);
      } catch {
        // Si el JSON está corrupto, limpiar
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    // ✅ FIX 2: Terminar loading una vez verificada la sesión
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const data = await authService.login(email, password);

      // Guardar token
      localStorage.setItem('token', data.token);

      // ✅ FIX 1: Adjuntar token a axios inmediatamente tras login
      authService.setAuthToken(data.token);

      // ✅ FIX 3: Mapear rol del backend al enum — ajusta los valores si tu backend
      // devuelve 'admin', 'ADMIN', 'cliente', etc.
      const rolMap: Record<string, UserRole> = {
        'ADMIN':    UserRole.ADMIN,
        'admin':    UserRole.ADMIN,
        'EMPLEADO': UserRole.EMPLEADO,
        'empleado': UserRole.EMPLEADO,
        'CLIENTE':  UserRole.CLIENTE,
        'cliente':  UserRole.CLIENTE,
      };

      const usuario: User = {
        id:             String(data.usuario.id),
        name:           data.usuario.nombre,
        lastName:       data.usuario.apellido  || '',
        email:          data.usuario.email,
        role:           rolMap[data.usuario.rol] ?? UserRole.CLIENTE,
        isActive:       true,
        documentType:   'CC',
        documentNumber: data.usuario.numeroDocumento || '',
        gender:         'M',
        birthDate:      data.usuario.fechaNacimiento || '',
        phone:          data.usuario.telefonoPrincipal || '',
        secondaryPhone: data.usuario.telefonoAlternativo || '',
        city:           data.usuario.ciudad || '',
        neighborhood:   data.usuario.barrio  || '',
        address:        data.usuario.direccion || '',
      };

      localStorage.setItem('user', JSON.stringify(usuario));
      setUser(usuario);
      return true;

    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // ✅ Limpiar token de axios al cerrar sesión
    authService.setAuthToken(null);
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
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};