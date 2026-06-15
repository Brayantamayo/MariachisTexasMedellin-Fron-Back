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
  email?:               string
  apellido?:            string
  tipoDocumento?:       'CC' | 'CE' | 'TI' | 'PAS'
  numeroDocumento?:     string
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
   * El email sí se puede cambiar desde este formulario.
   * El tipo y número de documento siguen siendo editables según el backend.
   */
  actualizar: async (payload: ActualizarPerfilPayload): Promise<PerfilData> => {
    const { data } = await api.put('/perfil', payload)
    return data.data
  },
}
