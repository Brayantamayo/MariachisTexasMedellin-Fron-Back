import api from '@/shared/api/api'
import { CalendarBlock } from '@/types'

export const blockService = {

  getBlocks: async (): Promise<CalendarBlock[]> => {
    const { data } = await api.get('/bloqueos')
    return data
  },

  // ✅ FIX: usaba axios.get() directo con URL hardcodeada
  // Ahora usa el cliente centralizado igual que el resto
  checkDateStatus: async (dateStr: string): Promise<{
    isBlocked:        boolean
    reason?:          string
    type?:            string
    hasPartialBlocks?: boolean
    blockedRanges?:   { start: string; end: string; reason: string }[]
  }> => {
    const { data } = await api.get(`/bloqueos/check/${dateStr}`)
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
  },
}