import axios from 'axios'
import { CalendarBlock } from '@/types'

const api = axios.create({ baseURL: 'http://localhost:3000/api' })

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token') 
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const blockService = {
  getBlocks: async (): Promise<CalendarBlock[]> => {
    const { data } = await api.get('/bloqueos')
    return data
  },

  checkDateStatus: async (dateStr: string): Promise<{
    isBlocked: boolean
    reason?: string
    type?: string
    hasPartialBlocks?: boolean
    blockedRanges?: { start: string; end: string; reason: string }[]
  }> => {
    const { data } = await axios.get(`http://localhost:3000/api/bloqueos/check/${dateStr}`)
    return data
  },

  createBlock: async (block: Omit<CalendarBlock, 'id'>): Promise<CalendarBlock> => {
    const { data } = await api.post('/bloqueos', block)
    return data
  },

  updateBlock: async (id: string, updates: Partial<CalendarBlock>): Promise<CalendarBlock> => {
    const { data } = await api.put(`/bloqueos/${id}`, updates)
    return data
  },

  deleteBlock: async (id: string): Promise<boolean> => {
    await api.delete(`/bloqueos/${id}`)
    return true
  }
}