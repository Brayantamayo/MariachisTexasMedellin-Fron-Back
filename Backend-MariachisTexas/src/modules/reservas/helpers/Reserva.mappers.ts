import type { ReservationResponse } from '../../../types/interfaces'
import { toLocalDate, toLocalTime, buildClientName } from '../../../utils/date.helpers'

// ─── Tipo inferido de Prisma para Reserva con relaciones ─────────────────────
// Se define aquí para tipar correctamente los mappers sin usar any
export type ReservaConRelaciones = {
    id:            number
    cotizacionId:  number
    totalValor:    unknown
    saldoPendiente: unknown
    estado:        string
    createdAt:     Date
    updatedAt:     Date
    cotizacion: {
    clienteId:         number | null
    nombreHomenajeado: string
    tipoEvento:        string
    fechaEvento:       Date
    horaInicio:        Date
    horaFin:           Date
    direccionEvento:   string
    notasAdicionales:  string | null
    cliente: {
      email:               string
      apellido:            string
      telefonoPrincipal:   string
      telefonoAlternativo: string | null
      usuario: { nombre: string } | null
    } | null
    contactoNombre:    string | null
    contactoTelefono:  string | null
    contactoTelefono2: string | null
    contactoEmail:     string | null
    servicios:   { servicioId: number; cantidad: number }[]
    repertorios: { repertorioId: number }[]
  }
  abonos: {
    id:         number
    monto:      unknown
    fechaPago:  Date
    metodoPago: string
    notas:      string | null
  }[]
}

export type ReservaPublica = {
  id:         number
  estado:     string
  cotizacion: {
    clienteId:   number | null
    fechaEvento: Date
    horaInicio:  Date
    horaFin:     Date
    tipoEvento:  string
    cliente:     { 
      email:    string
      apellido: string                    // ← nuevo
      usuario:  { nombre: string } | null // ← nuevo
    } | null
  } | null
}

// ─── mapToReservation ─────────────────────────────────────────────────────────
// Convierte modelo Prisma → DTO de salida (ReservationResponse)
export const mapToReservation = (r: ReservaConRelaciones): ReservationResponse => {
  const cot            = r.cotizacion
  const clientName     = cot.cliente
    ? buildClientName(cot.cliente.usuario?.nombre, cot.cliente.apellido)
    : cot.contactoNombre || cot.nombreHomenajeado || ''
  const clientPhone    = cot.cliente?.telefonoPrincipal   || cot.contactoTelefono  || ''
  const secondaryPhone = cot.cliente?.telefonoAlternativo || cot.contactoTelefono2 || ''
  const clientEmail    = cot.cliente?.email               || cot.contactoEmail     || ''

  return {
    id:               String(r.id),
    cotizacionId:     String(r.cotizacionId),
    clientId:         String(cot.clienteId ?? ''),
    clientName,       clientPhone, secondaryPhone, clientEmail,
    homenajeado:      cot.nombreHomenajeado ?? '',
    eventType:        cot.tipoEvento        ?? '',
    eventDate:        toLocalDate(cot.fechaEvento),
    eventTime:        toLocalTime(cot.horaInicio),
    startTime:        toLocalTime(cot.horaInicio),
    endTime:          toLocalTime(cot.horaFin),
    location:         cot.direccionEvento   ?? '',
    address:          cot.direccionEvento   ?? '',
    notes:            cot.notasAdicionales  ?? '',
    repertoireIds:    cot.repertorios.map(rep => String(rep.repertorioId)),
    selectedServices: cot.servicios.map(s => ({ serviceId: String(s.servicioId), quantity: s.cantidad })),
    totalAmount:      Number(r.totalValor      ?? 0),
    paidAmount:       Number(r.totalValor      ?? 0) - Number(r.saldoPendiente ?? 0),
    pendingBalance:   Number(r.saldoPendiente  ?? 0),
    status:           r.estado,
    payments:         r.abonos.map(a => ({
      id:     String(a.id),
      amount: Number(a.monto),
      date:   a.fechaPago?.toISOString() ?? '',
      method: a.metodoPago ?? '',
      notes:  a.notas      ?? '',
    })),
    createdAt: r.createdAt?.toISOString() ?? '',
    updatedAt: r.updatedAt?.toISOString() ?? '',
  }
}

// ─── mapToPublicReservation ───────────────────────────────────────────────────
// Versión reducida para el calendario — no expone datos sensibles
export const mapToPublicReservation = (r: ReservaPublica) => ({
  id:          String(r.id),
  clientId:    String(r.cotizacion?.clienteId ?? ''),
  clientName:  r.cotizacion?.cliente
    ? buildClientName(r.cotizacion.cliente.usuario?.nombre, r.cotizacion.cliente.apellido)
    : '',
  clientEmail: r.cotizacion?.cliente?.email ?? '', // ← nuevo
  eventDate:   r.cotizacion?.fechaEvento ? toLocalDate(r.cotizacion.fechaEvento) : '',
  eventTime:   r.cotizacion?.horaInicio  ? toLocalTime(r.cotizacion.horaInicio)  : '',
  startTime:   r.cotizacion?.horaInicio  ? toLocalTime(r.cotizacion.horaInicio)  : '',
  endTime:     r.cotizacion?.horaFin     ? toLocalTime(r.cotizacion.horaFin)     : '',
  eventType:   r.cotizacion?.tipoEvento  ?? '',
  status:      r.estado,
})