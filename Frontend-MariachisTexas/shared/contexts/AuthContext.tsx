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

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const SESSION_KEYS = { TOKEN: 'token', USER: 'user' } as const

const getSession = () => ({
  token:    localStorage.getItem(SESSION_KEYS.TOKEN),
  userData: localStorage.getItem(SESSION_KEYS.USER),
})

const setSession = (token: string, user: User) => {
  localStorage.setItem(SESSION_KEYS.TOKEN, token)
  localStorage.setItem(SESSION_KEYS.USER, JSON.stringify(user))
}

const clearSession = () => {
  localStorage.removeItem(SESSION_KEYS.TOKEN)
  localStorage.removeItem(SESSION_KEYS.USER)
}

const ROL_MAP: Record<string, UserRole> = {
  ADMIN:    UserRole.ADMIN,
  admin:    UserRole.ADMIN,
  EMPLEADO: UserRole.EMPLEADO,
  empleado: UserRole.EMPLEADO,
  CLIENTE:  UserRole.CLIENTE,
  cliente:  UserRole.CLIENTE,
}

// ─── PROVIDER ─────────────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser]           = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { token, userData } = getSession()

    if (token && userData) {
      try {
        const parsed = JSON.parse(userData) as User
        setUser(parsed)
        authService.setAuthToken(token)
      } catch {
        clearSession()
      }
    }

    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const data = await authService.login(email, password)

      // ✅ nombre viene de Usuario, datos extra vienen de Cliente (solo si es CLIENTE)
      const usuario: User = {
        id:             String(data.usuario.id),
        name:           data.usuario.nombre,
        lastName:       data.usuario.apellido            || '',
        email:          data.usuario.email,
        role:           ROL_MAP[data.usuario.rol]        ?? UserRole.CLIENTE,
        isActive:       true,
        documentType:   'CC',
        documentNumber: '',
        gender:         'M',
        birthDate:      '',
        phone:          data.usuario.telefonoPrincipal   || '',
        secondaryPhone: data.usuario.telefonoAlternativo || '',
        city:           data.usuario.ciudad              || '',
        neighborhood:   data.usuario.barrio              || '',
        address:        data.usuario.direccion           || '',
      }

      setSession(data.token, usuario)
      authService.setAuthToken(data.token)
      setUser(usuario)
      return true

    } catch (error) {
      console.error('Login error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    clearSession()
    authService.setAuthToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}