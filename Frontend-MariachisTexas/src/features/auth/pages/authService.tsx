import api from '@/shared/api/api'

export const authService = {

  setAuthToken: (token: string | null) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete api.defaults.headers.common['Authorization']
    }
  },

  registro: async (data: {
    nombre:               string
    apellido:             string
    tipoDocumento:        string
    numeroDocumento:      string
    fechaNacimiento:      string
    email:                string
    telefonoPrincipal:    string
    telefonoAlternativo?: string
    ciudad:               string
    barrio:               string
    direccion:            string
    zonaServicio:         string
    password:             string
    passwordConfirmation: string
    foto?:                string  // ← URL de Cloudinary
  }) => {
    const { data: res } = await api.post('/auth/registro', data)
    return res
  },

  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },

  recuperarPassword: async (email: string) => {
    const { data } = await api.post('/auth/recuperar-password', { email })
    return data
  },

  verificarOtp: async (email: string, otp: string) => {
    const { data } = await api.post('/auth/verificar-otp', { email, otp })
    return data
  },

  resetearPassword: async (email: string, otp: string, nuevaPassword: string, confirmarPassword: string) => {
    const { data } = await api.post('/auth/reset-password', { email, otp, nuevaPassword, confirmarPassword })
    return data
  },

  // ─── TOKEN DE REGISTRO (viene del correo de cotización aprobada) ──────────
  getRegistroToken: async (token: string): Promise<{
    email:    string
    nombre:   string
    telefono: string
    telefono2: string
  }> => {
    const { data } = await api.get(`/auth/registro-token/${token}`)
    return data
  },

  marcarTokenUsado: async (token: string) => {
    const { data } = await api.patch(`/auth/registro-token/${token}/usar`)
    return data
  },
}