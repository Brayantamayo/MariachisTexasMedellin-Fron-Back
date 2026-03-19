import api from '@/shared/api/api'
import { Quotation } from '@/types'

export const cotizacionService = {

  getQuotations: async (): Promise<Quotation[]> => {
    const { data } = await api.get('/cotizaciones')
    return data
  },

  getQuotationById: async (id: string): Promise<Quotation> => {
    const { data } = await api.get(`/cotizaciones/${id}`)
    return data
  },

  createQuotation: async (formData: any): Promise<Quotation> => {
    const { data } = await api.post('/cotizaciones/public', mapToBackend(formData))
    return data
  },

  updateQuotation: async (id: string, formData: any): Promise<Quotation> => {
    const { data } = await api.put(`/cotizaciones/${id}`, mapToBackend(formData))
    return data
  },

  cancelQuotation: async (id: string): Promise<Quotation> => {
    const { data } = await api.patch(`/cotizaciones/${id}/anular`)
    return data
  },

  convertToReservation: async (id: string): Promise<{ quotation: Quotation; reservationId: string }> => {
    const { data } = await api.patch(`/cotizaciones/${id}/convertir`)
    return data
  },

  deleteQuotation: async (id: string): Promise<void> => {
    await api.delete(`/cotizaciones/${id}`)
  },

  // ✅ NUEVO — público, sin token
  // Devuelve solo fecha/hora de cotizaciones EN_ESPERA
  // Para mostrar slots bloqueados en el calendario del cliente
  getDisponibilidad: async (): Promise<{ date: string; startTime: string; endTime: string }[]> => {
    const { data } = await api.get('/cotizaciones/public/disponibilidad')
    return data
  },

  // PDF generado en el backend con Puppeteer
  downloadPdf: async (id: string): Promise<void> => {
    const token    = localStorage.getItem('token')
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/cotizaciones/${id}/pdf`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!response.ok) throw new Error('Error al generar el PDF')
    const blob = await response.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `Cotizacion-${id}-MariachisTexas.pdf`
    a.click()
    URL.revokeObjectURL(url)
  },
}

// ─── MAPPER ───────────────────────────────────────────────────────────────────
const mapToBackend = (form: any) => ({
  clientId:         form.clientId         || null,
  clientName:       form.clientName       || '',
  clientPhone:      form.clientPhone      || '',
  secondaryPhone:   form.secondaryPhone   || '',
  clientEmail:      form.clientEmail      || '',
  homenajeado:      form.homenajeado      || '',
  eventDate:        form.eventDate,
  eventType:        form.eventType,
  startTime:        form.startTime,
  endTime:          form.endTime,
  location:         form.location         || '',
  notes:            form.repertoireNotes  || form.notes || '',
  totalAmount:      Number(form.totalAmount) || 0,
  selectedServices: form.selectedServices || [],
  repertoireIds:    form.repertoireIds    || [],
})