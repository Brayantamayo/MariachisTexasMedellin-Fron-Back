import prisma from '../../config/prisma'
import nodemailer from 'nodemailer'
import transporter from '../../config/mailer'
import { CotizacionCreateSchema, CotizacionUpdateSchema, zodError } from '../schemas'
import { toLocalDate, toLocalTime, parseLocalDate, buildDateTime, dayRange, validarAnticipacionMismoDia, buildClientName } from '../../utils/date.helpers'
import { mapEventType } from '../../utils/event.helpers'
import { emailCotizacionAprobada } from '../../utils/email.templates'
import { AppError } from '../../utils/AppError'
import type { CotizacionCreateInput, CotizacionUpdateInput, ServicioSeleccionado } from '../../types/interfaces'

interface QuotationResponse {
  id:                  string
  clientId?:           string
  clientName:          string
  clientPhone:         string
  secondaryPhone:      string
  clientEmail:         string
  homenajeado:         string
  eventDate:           string
  eventType:           string
  startTime:           string
  endTime:             string
  location:            string
  notes:               string
  totalAmount:         number
  isDirectReservation: boolean
  status:              string
  repertoireIds:       string[]
  selectedServices:    ServicioSeleccionado[]
  repertoireNotes:     string
  createdAt:           string
  updatedAt:           string
}

const mapToQuotation = (c: any): QuotationResponse => {
  const clientName     = c.clienteId
    ? buildClientName(c.cliente?.usuario?.nombre, c.cliente?.apellido)
    : c.contactoNombre || c.nombreHomenajeado || ''
  const clientPhone    = c.cliente?.telefonoPrincipal   || c.contactoTelefono  || ''
  const secondaryPhone = c.cliente?.telefonoAlternativo || c.contactoTelefono2 || ''
  const clientEmail    = c.cliente?.email               || c.contactoEmail     || ''

  return {
    id:                  String(c.id),
    clientId:            c.clienteId ? String(c.clienteId) : undefined,
    clientName, clientPhone, secondaryPhone, clientEmail,
    homenajeado:         c.nombreHomenajeado ?? '',
    eventDate:           c.fechaEvento ? toLocalDate(c.fechaEvento) : '',
    eventType:           c.tipoEvento  ?? '',
    startTime:           c.horaInicio  ? toLocalTime(c.horaInicio)  : '',
    endTime:             c.horaFin     ? toLocalTime(c.horaFin)     : '',
    location:            c.direccionEvento  ?? '',
    notes:               c.notasAdicionales ?? '',
    totalAmount:         Number(c.totalEstimado ?? 0),
    isDirectReservation: c.esReservaDirecta,
    status:              c.estado,
    repertoireIds:       c.repertorios?.map((r: any) => String(r.repertorioId)) ?? [],
    selectedServices:    c.servicios?.map((s: any) => ({ serviceId: String(s.servicioId), quantity: s.cantidad })) ?? [],
    repertoireNotes:     c.notasAdicionales ?? '',
    createdAt:           c.createdAt?.toISOString() ?? '',
    updatedAt:           c.updatedAt?.toISOString() ?? '',
  }
}

const cotizacionInclude = {
  cliente: { include: { usuario: true } },
  servicios: true,
  repertorios: true,
  reserva: true,
}

const validarDisponibilidad = async (
  eventDate:            string,
  horaInicio:           Date,
  horaFin:              Date,
  excludeCotizacionId?: number
) => {
  const { dayStart, dayEnd } = dayRange(eventDate)

  const bloqueo = await prisma.bloqueoCalendario.findFirst({
    where: { fechaInicio: { lte: horaFin }, fechaFin: { gte: horaInicio } }
  })
  if (bloqueo) throw new AppError(
    `Fecha bloqueada: ${bloqueo.motivo?.replace(/^[A-Z_]+:/, '').split('|')[0] || 'No disponible'}`,
    400
  )

  const cotActivas = await prisma.cotizacion.findMany({
    where: {
      fechaEvento: { gte: dayStart, lte: dayEnd },
      estado: { in: ['EN_ESPERA', 'CONVERTIDA'] },
      ...(excludeCotizacionId ? { id: { not: excludeCotizacionId } } : {})
    }
  })
  for (const cot of cotActivas)
    if (horaInicio < cot.horaFin && horaFin > cot.horaInicio)
      throw new AppError(`Conflicto con cotización existente (${toLocalTime(cot.horaInicio)} - ${toLocalTime(cot.horaFin)})`, 400)

  const bufferInicio = new Date(horaInicio.getTime() - 60 * 60 * 1000)
  const bufferFin    = new Date(horaFin.getTime()    + 60 * 60 * 1000)

  const reservaSolapada = await prisma.reserva.findFirst({
    where: {
      estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
      cotizacion: { fechaEvento: parseLocalDate(eventDate), horaInicio: { lt: bufferFin }, horaFin: { gt: bufferInicio } }
    }
  })
  if (reservaSolapada) throw new AppError('Conflicto con una reserva existente en ese horario.', 400)

  const ensayos = await prisma.ensayo.findMany({ where: { fechaHora: { gte: dayStart, lte: dayEnd } } })
  for (const e of ensayos) {
    const ensayoBefore = new Date(e.fechaHora.getTime() - 60 * 60 * 1000)
    const ensayoAfter  = new Date(e.fechaHora.getTime() + 60 * 60 * 1000)
    if (horaInicio < ensayoAfter && horaFin > ensayoBefore)
      throw new AppError(`Conflicto con ensayo programado a las ${toLocalTime(e.fechaHora)}`, 400)
  }
}

export const vincularCotizacionesPorEmail = async (email: string, clienteId: number) => {
  const result = await prisma.cotizacion.updateMany({
    where: { clienteId: null, contactoEmail: email, estado: { in: ['EN_ESPERA', 'CONVERTIDA'] } },
    data:  { clienteId }
  })
  return result.count
}

export const getCotizaciones = async (): Promise<QuotationResponse[]> => {
  const cotizaciones = await prisma.cotizacion.findMany({
    where: { esReservaDirecta: false }, include: cotizacionInclude, orderBy: { createdAt: 'desc' }
  })
  return cotizaciones.map(mapToQuotation)
}

export const getCotizacionById = async (id: number): Promise<QuotationResponse> => {
  const c = await prisma.cotizacion.findUnique({ where: { id }, include: cotizacionInclude })
  if (!c) throw new AppError('Cotización no encontrada', 404)
  return mapToQuotation(c)
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const createCotizacion = async (data: CotizacionCreateInput): Promise<QuotationResponse> => {
  const parsed = CotizacionCreateSchema.safeParse({ ...data, totalAmount: Number(data.totalAmount) || 0 })
  if (!parsed.success) throw new AppError(zodError(parsed.error), 400)

  const d = parsed.data

  // ✅ Validar 6h de anticipación si es hoy
  validarAnticipacionMismoDia(d.eventDate, d.startTime)

  const horaInicio = buildDateTime(d.eventDate, d.startTime)
  const horaFin    = buildDateTime(d.eventDate, d.endTime)

  await validarDisponibilidad(d.eventDate, horaInicio, horaFin)

  const cot = await prisma.cotizacion.create({
    data: {
      clienteId:         d.clientId ? Number(d.clientId) : null,
      nombreHomenajeado: d.homenajeado || d.clientName || 'Sin especificar',
      tipoEvento:        mapEventType(d.eventType),
      fechaEvento:       parseLocalDate(d.eventDate),
      horaInicio, horaFin,
      direccionEvento:   d.location,
      notasAdicionales:  d.notes || d.repertoireNotes || null,
      totalEstimado:     d.totalAmount || 0,
      esReservaDirecta:  false,
      estado:            'EN_ESPERA',
      contactoNombre:    d.clientId ? null : (d.clientName     || null),
      contactoTelefono:  d.clientId ? null : (d.clientPhone    || null),
      contactoTelefono2: d.clientId ? null : (d.secondaryPhone || null),
      contactoEmail:     d.clientId ? null : (d.clientEmail    || null),
    }
  })

  if (d.selectedServices?.length)
    await prisma.cotizacionServicio.createMany({
      data: d.selectedServices.map((s: ServicioSeleccionado) => ({
        cotizacionId: cot.id, servicioId: Number(s.serviceId), cantidad: s.quantity
      }))
    })

  if (d.repertoireIds?.length)
    await prisma.cotizacionRepertorio.createMany({
      data: d.repertoireIds.map((id: string | number, i: number) => ({
        cotizacionId: cot.id, repertorioId: Number(id), orden: i
      }))
    })

  return getCotizacionById(cot.id)
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const updateCotizacion = async (id: number, data: CotizacionUpdateInput): Promise<QuotationResponse> => {
  const exists = await prisma.cotizacion.findUnique({ where: { id } })
  if (!exists) throw new AppError('Cotización no encontrada', 404)
  if (exists.estado !== 'EN_ESPERA') throw new AppError('Solo se pueden editar cotizaciones en estado En Espera', 400)

  const parsed = CotizacionUpdateSchema.safeParse(data)
  if (!parsed.success) throw new AppError(zodError(parsed.error), 400)

  const d          = parsed.data
  const date       = d.eventDate ?? toLocalDate(exists.fechaEvento)
  const horaInicio = d.startTime ? buildDateTime(date, d.startTime) : exists.horaInicio
  const horaFin    = d.endTime   ? buildDateTime(date, d.endTime)   : exists.horaFin

  if (d.startTime || d.endTime || d.eventDate) {
    // ✅ Validar 6h si es hoy y se cambia la hora
    if (d.startTime) validarAnticipacionMismoDia(date, d.startTime)
    await validarDisponibilidad(date, horaInicio, horaFin, id)
  }

  await prisma.cotizacion.update({
    where: { id },
    data: {
      clienteId:         d.clientId      ? Number(d.clientId)        : undefined,
      nombreHomenajeado: d.homenajeado   || d.clientName             || undefined,
      tipoEvento:        d.eventType     ? mapEventType(d.eventType)  : undefined,
      fechaEvento:       d.eventDate     ? parseLocalDate(d.eventDate): undefined,
      horaInicio, horaFin,
      direccionEvento:   d.location      || undefined,
      notasAdicionales:  d.notes !== undefined ? (d.notes || null)   : undefined,
      totalEstimado:     d.totalAmount   !== undefined ? d.totalAmount : undefined,
      contactoNombre:    d.clientName    !== undefined ? (d.clientName     || null) : undefined,
      contactoTelefono:  d.clientPhone   !== undefined ? (d.clientPhone    || null) : undefined,
      contactoTelefono2: d.secondaryPhone !== undefined ? (d.secondaryPhone || null) : undefined,
      contactoEmail:     d.clientEmail   !== undefined ? (d.clientEmail    || null) : undefined,
    }
  })

  if (d.selectedServices) {
    await prisma.cotizacionServicio.deleteMany({ where: { cotizacionId: id } })
    if (d.selectedServices.length)
      await prisma.cotizacionServicio.createMany({
        data: d.selectedServices.map((s: ServicioSeleccionado) => ({
          cotizacionId: id, servicioId: Number(s.serviceId), cantidad: s.quantity
        }))
      })
  }

  if (d.repertoireIds) {
    await prisma.cotizacionRepertorio.deleteMany({ where: { cotizacionId: id } })
    if (d.repertoireIds.length)
      await prisma.cotizacionRepertorio.createMany({
        data: d.repertoireIds.map((rid: string | number, i: number) => ({
          cotizacionId: id, repertorioId: Number(rid), orden: i
        }))
      })
  }

  return getCotizacionById(id)
}

// ─── ANULAR / DELETE ──────────────────────────────────────────────────────────
export const anularCotizacion = async (id: number): Promise<QuotationResponse> => {
  const exists = await prisma.cotizacion.findUnique({ where: { id } })
  if (!exists) throw new AppError('Cotización no encontrada', 404)
  if (exists.estado === 'ANULADA')    throw new AppError('La cotización ya está anulada', 400)
  if (exists.estado === 'CONVERTIDA') throw new AppError('No se puede anular una cotización ya convertida', 400)
  await prisma.cotizacion.update({ where: { id }, data: { estado: 'ANULADA' } })
  return getCotizacionById(id)
}

export const deleteCotizacion = async (id: number) => {
  const exists = await prisma.cotizacion.findUnique({ where: { id } })
  if (!exists) throw new AppError('Cotización no encontrada', 404)
  if (exists.estado !== 'ANULADA') throw new AppError('Solo se pueden eliminar cotizaciones anuladas', 400)
  await prisma.cotizacion.delete({ where: { id } })
  return { message: 'Cotización eliminada correctamente' }
}

// ─── CONVERTIR ────────────────────────────────────────────────────────────────
export const convertirCotizacion = async (id: number) => {
  const cotizacion = await prisma.cotizacion.findUnique({ where: { id }, include: cotizacionInclude })
  if (!cotizacion) throw new AppError('Cotización no encontrada', 404)
  if (cotizacion.estado !== 'EN_ESPERA') throw new AppError('Solo se pueden convertir cotizaciones En Espera', 400)
  if (!cotizacion.totalEstimado || Number(cotizacion.totalEstimado) === 0)
    throw new AppError('La cotización debe tener un valor estimado para convertirse', 400)

  // ─── DEBUG: ver qué email tiene la cotización ─────────────────────────────
  console.log('📋 Convirtiendo cotización ID:', id)
  console.log('   clienteId:', cotizacion.clienteId)
  console.log('   cliente.email:', cotizacion.cliente?.email)
  console.log('   contactoEmail:', cotizacion.contactoEmail)
  console.log('   contactoNombre:', cotizacion.contactoNombre)
  const emailDestinoPre = cotizacion.cliente?.email || cotizacion.contactoEmail || ''
  console.log('   emailDestino resuelto:', emailDestinoPre || '⚠️ VACÍO — no se enviará correo')

  await prisma.cotizacion.update({ where: { id }, data: { estado: 'CONVERTIDA' } })
  const reserva = await prisma.reserva.create({
    data: {
      cotizacionId:   id,
      totalValor:     cotizacion.totalEstimado!,
      saldoPendiente: cotizacion.totalEstimado!,
      estado:         'PENDIENTE'
    }
  })

  const emailDestino  = cotizacion.cliente?.email || cotizacion.contactoEmail || ''
  const nombreCliente = cotizacion.cliente
    ? buildClientName(cotizacion.cliente.usuario?.nombre, cotizacion.cliente.apellido)
    : cotizacion.contactoNombre || 'Cliente'
  const telefono  = cotizacion.cliente?.telefonoPrincipal   || cotizacion.contactoTelefono  || ''
  const telefono2 = cotizacion.cliente?.telefonoAlternativo || cotizacion.contactoTelefono2 || ''

  if (emailDestino) {
    const { randomUUID } = await import('crypto')
    const token = randomUUID()

    await prisma.registroToken.create({
      data: {
        token,
        email:     emailDestino,
        nombre:    nombreCliente,
        telefono,
        telefono2: telefono2 || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
        usado:     false,
      }
    })

    const base        = (process.env.FRONTEND_URL ?? '').replace(/\/$/, '')
    const registerUrl = `${base}/registro?token=${token}`
    const loginUrl    = `${base}/login`

    const horaInicioStr = toLocalTime(cotizacion.horaInicio)
    const horaFinStr    = toLocalTime(cotizacion.horaFin)
    const fechaStr      = cotizacion.fechaEvento.toLocaleDateString('es-CO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })

    const mail = emailCotizacionAprobada({
      nombreCliente, fechaStr,
      horaInicio:    horaInicioStr,
      horaFin:       horaFinStr,
      totalEstimado: Number(cotizacion.totalEstimado),
      registerUrl,   loginUrl,
    })
    await transporter.sendMail({ from: process.env.MAIL_FROM, to: emailDestino, ...mail })
      .then(info => {
        console.log('Correo cotización aprobada enviado a:', emailDestino)
        // En Ethereal, muestra la URL de preview para ver el correo
        const previewUrl = (nodemailer as any).getTestMessageUrl?.(info)
        if (previewUrl) console.log('📧 Preview URL:', previewUrl)
      })
      .catch(err => console.error('❌ Error enviando correo cotización aprobada:', err))
  }

  return { quotation: await getCotizacionById(id), reservationId: String(reserva.id) }
}

