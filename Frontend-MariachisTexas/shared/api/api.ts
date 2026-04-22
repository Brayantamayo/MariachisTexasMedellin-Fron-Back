import axios, { AxiosInstance } from 'axios'

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ─── REQUEST — adjunta token en cada llamada ──────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || ''
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── RESPONSE — manejo global de errores ─────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Sesión expirada → redirigir
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // ✅ Extraer el mensaje real del backend y lanzarlo como Error limpio
    const data = error.response?.data
    const message =
      (typeof data === 'string' ? data : null) ??
      data?.message ??
      data?.error ??
      data?.detail ??
      error.message ??
      'Error inesperado'

    return Promise.reject(new Error(message))
  }
)

export default api