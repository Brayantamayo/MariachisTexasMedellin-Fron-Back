// src/features/profile/services/profileService.ts
import api from '@/shared/api/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PerfilData {
  id:                  number
  nombre:              string
  email:               string
  rol:                 string
  apellido:            string
  tipoDocumento:       'CC' | 'CE' | 'TI' | 'PAS'
  numeroDocumento:     string
  fechaNacimiento:     string          // 'YYYY-MM-DD'
  telefonoPrincipal:   string
  telefonoAlternativo: string
  ciudad:              string
  barrio:              string
  direccion:           string
  zonaServicio:        'URBANA' | 'RURAL'
  foto:                string | null
  clienteId:           number | null
}

export interface ActualizarPerfilPayload {
  nombre?:              string
  apellido?:            string
  telefonoPrincipal?:   string
  telefonoAlternativo?: string
  ciudad?:              string
  barrio?:              string
  direccion?:           string
  zonaServicio?:        'URBANA' | 'RURAL'
  fechaNacimiento?:     string
  foto?:                string | null
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const profileService = {
  /**
   * Obtiene el perfil completo del usuario autenticado.
   * Combina datos de la tabla `usuario` y `cliente`.
   */
  obtener: async (): Promise<PerfilData> => {
    const { data } = await api.get('/perfil')
    return data.data
  },

  /**
   * Actualiza los datos editables del perfil.
   * El email y la contraseña NO se pueden cambiar aquí.
   * El tipo y número de documento son de sólo lectura.
   */
  actualizar: async (payload: ActualizarPerfilPayload): Promise<PerfilData> => {
    const { data } = await api.put('/perfil', payload)
    return data.data
  },
}