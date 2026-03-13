import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

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

  // Verifica el OTP ingresado por el usuario
  verificarOtp: async (email: string, otp: string) => {
    const { data } = await api.post('/auth/verificar-otp', { email, otp })
    return data
  },

  // Resetea la contraseña usando email + otp (sin token en URL)
  resetearPassword: async (email: string, otp: string, nuevaPassword: string, confirmarPassword: string) => {
    const { data } = await api.post('/auth/reset-password', { email, otp, nuevaPassword, confirmarPassword })
    return data
  }
}