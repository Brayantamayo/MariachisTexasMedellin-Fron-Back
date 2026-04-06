import api from '@/shared/api/api'

export const authService = {

  setAuthToken: (token: string | null) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete api.defaults.headers.common['Authorization']
    }
  },

  // nombre va al backend y se guarda en Usuario
  // sin password en los datos de cliente — el backend lo maneja solo en Usuario
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
  }
}