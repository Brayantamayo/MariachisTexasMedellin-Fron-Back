// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { authService } from '@/src/features/auth/pages/authService';
import { profileService, PerfilData } from '@/shared/services/perfilservices.ts';

interface AuthContextType {
  user:            User | null;
  isLoading:       boolean;
  login:           (email: string, password: string) => Promise<boolean>;
  logout:          () => void;
  isAuthenticated: boolean;
  /** Llámalo después de actualizar el perfil para sincronizar el contexto */
  refreshUser:     () => Promise<void>;
  /** Actualización optimista directa (sin llamada al servidor) */
  updateUser:      (partial: Partial<User>) => void;
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

/** Convierte un PerfilData (API) → User (frontend) */
const perfilToUser = (perfil: PerfilData): User => ({
  id:             String(perfil.id),
  name:           perfil.nombre,
  lastName:       perfil.apellido,
  email:          perfil.email,
  role:           ROL_MAP[perfil.rol] ?? UserRole.CLIENTE,
  isActive:       true,
  documentType:   perfil.tipoDocumento,
  documentNumber: perfil.numeroDocumento,
  gender:         'M',
  birthDate:      perfil.fechaNacimiento,
  phone:          perfil.telefonoPrincipal,
  secondaryPhone: perfil.telefonoAlternativo,
  city:           perfil.ciudad,
  neighborhood:   perfil.barrio,
  address:        perfil.direccion,
  avatar:         perfil.foto ?? undefined,
})

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

  /**
   * Recarga el perfil desde el servidor y actualiza el contexto + localStorage.
   * Úsalo en ProfilePage después de un PUT exitoso.
   */
  const refreshUser = async (): Promise<void> => {
    try {
      const perfil  = await profileService.obtener()
      const updated = perfilToUser(perfil)
      const token   = localStorage.getItem(SESSION_KEYS.TOKEN) || ''
      setSession(token, updated)
      setUser(updated)
    } catch (error) {
      console.error('refreshUser error:', error)
    }
  }

  /**
   * Actualización optimista: modifica el contexto y el localStorage sin llamar al servidor.
   * Útil para reflejar cambios inmediatamente en la UI mientras el PUT ya se ejecutó.
   */
  const updateUser = (partial: Partial<User>): void => {
    setUser(prev => {
      if (!prev) return prev
      const updated = { ...prev, ...partial }
      const token   = localStorage.getItem(SESSION_KEYS.TOKEN) || ''
      setSession(token, updated)
      return updated
    })
  }

  const logout = () => {
    clearSession()
    authService.setAuthToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      isLoading,
      refreshUser,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}