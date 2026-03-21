import axios, { AxiosInstance } from 'axios'

// ─── CLIENTE HTTP CENTRALIZADO ────────────────────────────────────────────────
// Un solo lugar para baseURL, headers y token.
// Todos los services importan este archivo — nunca crean su propio axios.create()

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

// ─── RESPONSE — manejo global de sesión expirada ──────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api