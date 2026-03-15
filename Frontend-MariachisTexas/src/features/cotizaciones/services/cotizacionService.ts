import axios from 'axios'
import { Quotation } from '@/types'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token') // ✅ era localStorage
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const cotizacionService = {

  // GET todas — admin/empleado ven todas, cliente solo las suyas
  getQuotations: async (): Promise<Quotation[]> => {
    const { data } = await api.get('/cotizaciones')
    return data
  },

  // GET por ID
  getQuotationById: async (id: string): Promise<Quotation> => {
    const { data } = await api.get(`/cotizaciones/${id}`)
    return data
  },

  // POST — módulo interno (admin/empleado crean cotización)
  createQuotation: async (formData: any): Promise<Quotation> => {
    const { data } = await api.post('/cotizaciones/public', mapToBackend(formData))
    return data
  },

  // PUT — editar cotización EN_ESPERA
  updateQuotation: async (id: string, formData: any): Promise<Quotation> => {
    const { data } = await api.put(`/cotizaciones/${id}`, mapToBackend(formData))
    return data
  },

  // PATCH — anular
  cancelQuotation: async (id: string): Promise<Quotation> => {
    const { data } = await api.patch(`/cotizaciones/${id}/anular`)
    return data
  },

  // PATCH — convertir a reserva (admin)
  convertToReservation: async (id: string): Promise<{ quotation: Quotation; reservationId: string }> => {
    const { data } = await api.patch(`/cotizaciones/${id}/convertir`)
    return data
  },

  deleteQuotation: async (id: string): Promise<void> => {
  await api.delete(`/cotizaciones/${id}`)
},

  // PDF — pendiente implementar
  downloadPdf: async (id: string): Promise<boolean> => {
    // TODO: implementar descarga de PDF
    console.log('Descarga PDF cotización:', id)
    return true
  }
}

// ─── MAPEO Frontend → Backend ─────────────────────────────────────────────────
// El frontend usa campos del form (clientName, location, etc.)
// El backend espera los mismos campos — el servicio hace la traducción interna
const mapToBackend = (form: any) => ({
  clientId:         form.clientId       || null,
  clientName:       form.clientName     || '',
  clientPhone:      form.clientPhone    || '',
  secondaryPhone:   form.secondaryPhone || '',
  clientEmail:      form.clientEmail    || '',
  homenajeado:      form.homenajeado    || '',
  eventDate:        form.eventDate,
  eventType:        form.eventType,
  startTime:        form.startTime,
  endTime:          form.endTime,
  location:         form.location       || '',
  notes:            form.repertoireNotes || form.notes || '',
  totalAmount:      Number(form.totalAmount) || 0,
  selectedServices: form.selectedServices || [],
  repertoireIds:    form.repertoireIds   || [],
})