import prisma from '../../config/prisma'
import transporter from '../../config/mailer'
import { ReservaCreateSchema, ReservaUpdateSchema, zodError } from '../schemas'
import { toLocalDate, toLocalTime, parseLocalDate, bloquearRango, dayRange, validarAnticipacionMismoDia } from '../../utils/date.helpers'
import { mapEventType } from '../../utils/event.helpers'
import { emailReservaCreada } from '../../utils/email.templates'
import type { ReservaCreateInput, ReservaUpdateInput, ServicioSeleccionado, ReservationResponse } from '../../types/interfaces'

const mapToReservation = (r: any): ReservationResponse => {
  const cot            = r.cotizacion
  const clientName     = cot?.cliente
    ? `${cot.cliente.usuario?.nombre ?? ''} ${cot.cliente.apellido}`.trim()
    : cot?.contactoNombre || cot?.nombreHomenajeado || ''
  const clientPhone    = cot?.cliente?.telefonoPrincipal   || cot?.contactoTelefono  || ''
  const secondaryPhone = cot?.cliente?.telefonoAlternativo || cot?.contactoTelefono2 || ''
  const clientEmail    = cot?.cliente?.email               || cot?.contactoEmail     || ''

  return {
    id:               String(r.id),
    cotizacionId:     String(r.cotizacionId),
    clientId:         String(cot?.clienteId ?? ''),
    clientName, clientPhone, secondaryPhone, clientEmail,
    homenajeado:      cot?.nombreHomenajeado ?? '',
    eventType:        cot?.tipoEvento        ?? '',
    eventDate:        cot?.fechaEvento  ? toLocalDate(cot.fechaEvento)  : '',
    eventTime:        cot?.horaInicio   ? toLocalTime(cot.horaInicio)   : '',
    startTime:        cot?.horaInicio   ? toLocalTime(cot.horaInicio)   : '',
    endTime:          cot?.horaFin      ? toLocalTime(cot.horaFin)      : '',
    location:         cot?.direccionEvento ?? '',
    address:          cot?.direccionEvento ?? '',
    notes:            cot?.notasAdicionales ?? '',
    repertoireIds:    cot?.repertorios?.map((rep: any) => String(rep.repertorioId)) ?? [],
    selectedServices: cot?.servicios?.map((s: any) => ({ serviceId: String(s.servicioId), quantity: s.cantidad })) ?? [],
    totalAmount:      Number(r.totalValor     ?? 0),
    paidAmount:       Number(r.totalValor     ?? 0) - Number(r.saldoPendiente ?? 0),
    pendingBalance:   Number(r.saldoPendiente ?? 0),
    status:           r.estado,
    payments:         r.abonos?.map((a: any) => ({
      id:     String(a.id),
      amount: Number(a.monto),
      date:   a.fechaPago?.toISOString() ?? '',
      method: a.metodoPago ?? '',
      notes:  a.notas ?? ''
    })) ?? [],
    createdAt: r.createdAt?.toISOString() ?? '',
    updatedAt: r.updatedAt?.toISOString() ?? '',
  }
}

const mapToPublicReservation = (r: any) => ({
  id:        String(r.id),
  clientId:  String(r.cotizacion?.clienteId ?? ''),
  eventDate: r.cotizacion?.fechaEvento ? toLocalDate(r.cotizacion.fechaEvento) : '',
  eventTime: r.cotizacion?.horaInicio  ? toLocalTime(r.cotizacion.horaInicio)  : '',
  startTime: r.cotizacion?.horaInicio  ? toLocalTime(r.cotizacion.horaInicio)  : '',
  endTime:   r.cotizacion?.horaFin     ? toLocalTime(r.cotizacion.horaFin)     : '',
  eventType: r.cotizacion?.tipoEvento  ?? '',
  status:    r.estado,
})

const reservaInclude = {
  cotizacion: {
    include: {
      cliente: { include: { usuario: true } },
      servicios: true,
      repertorios: true,
    }
  },
  abonos: true,
}

// ───Obtener reservas─────────────────────────────────────────────────────────────────
export const getReservas = async (usuarioId?: number): Promise<ReservationResponse[]> => {
  let where: any = { estado: { in: ['PENDIENTE', 'CONFIRMADA', 'ANULADA'] } }
  if (usuarioId) {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (usuario) {
      const cliente = await prisma.cliente.findUnique({ where: { email: usuario.email } })
      if (cliente) where = { cotizacion: { clienteId: cliente.id } }
    }
  }
  const reservas = await prisma.reserva.findMany({ where, include: reservaInclude, orderBy: { createdAt: 'desc' } })
  return reservas.map(mapToReservation)
}

///
export const getReservasCalendario = async () => {
  const reservas = await prisma.reserva.findMany({
    where: { estado: { in: ['PENDIENTE', 'CONFIRMADA'] as any } },
    include: {
      cotizacion: {
        select: {
          clienteId: true, fechaEvento: true, horaInicio: true,
          horaFin: true, tipoEvento: true,
          cliente: { select: { email: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  return reservas.map(r => ({
    ...mapToPublicReservation(r),
    clientEmail: r.cotizacion?.cliente?.email ?? ''
  }))
}

// ─── ABONOS ────────────────────────────────────────────────────────────────────
export const getAbonos = async (usuarioId?: number) => {
  const where: any = {}

  if (usuarioId) {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (usuario) {
      const cliente = await prisma.cliente.findUnique({ where: { email: usuario.email } })
      if (cliente) where.clienteId = cliente.id
    }
  }

  const abonos = await prisma.abono.findMany({
    where,
    include: {
      reserva: { include: { cotizacion: { include: { cliente: true } } } },
      cliente: true
    },
    orderBy: { fechaPago: 'desc' }
  })

  return abonos.map((a: any) => ({
    id: String(a.id),
    amount: Number(a.monto),
    date: a.fechaPago?.toISOString() ?? '',
    type: 'Abono Parcial',
    method: a.metodoPago,
    notes: a.notas ?? '',
    reservationId: String(a.reservaId),
    clientId: String(a.clienteId),
    clientName: `${a.cliente?.usuario?.nombre ?? ''} ${a.cliente?.apellido ?? ''}`.trim(),
    reservationTotal: Number(a.reserva?.totalValor ?? 0),
    newBalance: Number(a.nuevoSaldo ?? 0)
  }))
}

export const createAbono = async (reservaId: number, data: { amount: number; date: string; method: string; notes?: string }) => {
  const reserva = await prisma.reserva.findUnique({
    where: { id: reservaId },
    include: { cotizacion: { include: { cliente: true } }, abonos: true, venta: true }
  })

  if (!reserva) throw new Error('Reserva no encontrada')
  if (reserva.estado === 'ANULADA') throw new Error('No se puede registrar abono en una reserva anulada')

  const monto = Number(data.amount)
  if (isNaN(monto) || monto <= 0) throw new Error('Monto de abono inválido')

  const saldoActual = Number(reserva.saldoPendiente)
  if (monto > saldoActual) throw new Error('El monto de abono supera el saldo pendiente')

  const metodoPagoRaw = String(data.method ?? '').trim().toUpperCase()
  const allowedMetodoPago = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'NEQUI', 'DAVIPLATA', 'OTRO']
  if (!allowedMetodoPago.includes(metodoPagoRaw)) throw new Error('Método de pago inválido')

  const nuevoSaldo = Number((saldoActual - monto).toFixed(2))

  const clienteId = reserva.cotizacion?.clienteId
  if (!clienteId) throw new Error('Reserva sin cliente asociado')

  await prisma.abono.create({
    data: {
      reservaId,
      clienteId,
      monto,
      fechaPago: new Date(data.date),
      metodoPago: metodoPagoRaw as any,
      notas: data.notes ?? null,
      nuevoSaldo
    }
  })

  await prisma.reserva.update({ where: { id: reservaId }, data: { saldoPendiente: nuevoSaldo } })

  // ✅ Si el saldo llega a 0, crear automáticamente la venta
  if (nuevoSaldo <= 0.01 && !reserva.venta) {
    const totalValor = Number(reserva.totalValor)
    const totalAbonos = reserva.abonos.reduce((sum, a) => sum + Number(a.monto), 0) + monto

    await prisma.venta.create({
      data: {
        reservaId,
        clienteId,
        tipo: 'RESERVA',
        estado: 'FINALIZADO',
        montoTotal: totalValor,
        montoPagado: totalAbonos,
        fechaVenta: new Date(),
        metodoPago: metodoPagoRaw as any
      }
    })
  }

  return getReservaById(reservaId)
}

// ─── OBTENER HORAS DISPONIBLES ────────────────────────────────────────────────────
export const getAvailableHours = async (dateStr: string, excludeId?: number): Promise<string[]> => {
  const allHours: string[] = []
  for (let i = 8; i <= 23; i++) allHours.push(`${i.toString().padStart(2, '0')}:00`)
  allHours.push('00:00')
  const { dayStart, dayEnd } = dayRange(dateStr)
  const blocked = new Set<string>()

  const bloqueos = await prisma.bloqueoCalendario.findMany({
    where: { fechaInicio: { lte: dayEnd }, fechaFin: { gte: dayStart } }
  })
  for (const b of bloqueos) {
    if (!b.motivo?.startsWith('TIME_RANGE:')) return []
    const start = toLocalTime(b.fechaInicio)
    const end   = toLocalTime(b.fechaFin)
    allHours.forEach(h => { if (h >= start && h < end) blocked.add(h) })
  }

  const cotizaciones = await prisma.cotizacion.findMany({
    where: { fechaEvento: { gte: dayStart, lte: dayEnd }, estado: { in: ['EN_ESPERA', 'CONVERTIDA'] } }
  })
  for (const c of cotizaciones)
    bloquearRango(allHours, blocked, toLocalTime(c.horaInicio), toLocalTime(c.horaFin))

  const reservas = await prisma.reserva.findMany({
    where: {
      estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
      cotizacion: { fechaEvento: { gte: dayStart, lte: dayEnd } },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    include: { cotizacion: true }
  })
  for (const r of reservas)
    bloquearRango(allHours, blocked, toLocalTime(r.cotizacion.horaInicio), toLocalTime(r.cotizacion.horaFin))

  const ensayos = await prisma.ensayo.findMany({ where: { fechaHora: { gte: dayStart, lte: dayEnd } } })
  for (const e of ensayos) {
    const time = toLocalTime(e.fechaHora)
    const [h]  = time.split(':').map(Number)
    blocked.add(time)
    blocked.add(`${((h - 1 + 24) % 24).toString().padStart(2, '0')}:00`)
  }

  //  Si es hoy filtrar horas con menos de 6h de anticipación para evitar problemas de horarios
  const hoy = new Date().toISOString().split('T')[0]
  if (dateStr === hoy) {
    const limiteMs = new Date().getTime() + 6 * 60 * 60 * 1000
    return allHours.filter(h => {
      if (blocked.has(h)) return false
      return new Date(`${dateStr}T${h}:00`).getTime() >= limiteMs
    })
  }

  return allHours.filter(h => !blocked.has(h))
}

// ─── OBTENER POR  ID ────────────────────────────────────────────────────────────────
export const getReservaById = async (id: number): Promise<ReservationResponse> => {
  const r = await prisma.reserva.findUnique({ where: { id }, include: reservaInclude })
  if (!r) throw new Error('Reserva no encontrada')
  return mapToReservation(r)
}

// ─── CREAR RESERVAS ───────────────────────────────────────────────────────────────────
export const createReserva = async (data: ReservaCreateInput): Promise<ReservationResponse> => {
  const parsed = ReservaCreateSchema.safeParse({ ...data, totalAmount: Number(data.totalAmount) })
  if (!parsed.success) throw new Error(zodError(parsed.error))

  const d = parsed.data

  // ✅ Validar 6h de anticipación si es hoy
  validarAnticipacionMismoDia(d.eventDate, d.startTime)

  const usuario = await prisma.usuario.findUnique({ where: { id: Number(d.clienteId) } })
  if (!usuario) throw new Error('Usuario no encontrado')

  const cliente = await prisma.cliente.findUnique({ where: { email: usuario.email } })
  if (!cliente) throw new Error('Cliente no encontrado. Asegúrate de completar tu perfil.')

  const nuevaInicio  = new Date(`${d.eventDate}T${d.startTime}:00`)
  const nuevaFin     = new Date(`${d.eventDate}T${d.endTime}:00`)
  const bufferInicio = new Date(nuevaInicio.getTime() - 60 * 60 * 1000)
  const bufferFin    = nuevaFin

  const reservaSolapada = await prisma.reserva.findFirst({
    where: {
      estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
      cotizacion: {
        fechaEvento: parseLocalDate(d.eventDate),
        horaInicio:  { lt: bufferFin },
        horaFin:     { gt: bufferInicio },
      }
    }
  })
  if (reservaSolapada) throw new Error('Ya existe una reserva en ese horario. Por favor elige otro horario.')

  const cotizacionSolapada = await prisma.cotizacion.findFirst({
    where: {
      estado:      { in: ['EN_ESPERA', 'CONVERTIDA'] },
      fechaEvento: parseLocalDate(d.eventDate),
      horaInicio:  { lt: bufferFin },
      horaFin:     { gt: bufferInicio },
    }
  })
  if (cotizacionSolapada) throw new Error('Ya hay una solicitud pendiente en ese horario. Por favor elige otro horario.')

  const horas = await getAvailableHours(d.eventDate)
  if (!horas.includes(d.startTime)) throw new Error(`La hora ${d.startTime} no está disponible`)

  const cot = await prisma.cotizacion.create({
    data: {
      clienteId:         cliente.id,
      nombreHomenajeado: d.homenajeado || 'Sin especificar',
      tipoEvento:        mapEventType(d.eventType ?? 'OTRO'),
      fechaEvento:       parseLocalDate(d.eventDate),
      horaInicio:        nuevaInicio,
      horaFin:           nuevaFin,
      direccionEvento:   d.location,
      notasAdicionales:  d.notes ?? null,
      totalEstimado:     d.totalAmount,
      esReservaDirecta:  true,
      estado:            'CONVERTIDA',
      contactoNombre:    null, contactoTelefono:  null,
      contactoTelefono2: null, contactoEmail:     null,
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
      data: d.repertoireIds.map((rid: string | number, i: number) => ({
        cotizacionId: cot.id, repertorioId: Number(rid), orden: i
      }))
    })

  const reserva = await prisma.reserva.create({
    data: { cotizacionId: cot.id, totalValor: d.totalAmount, saldoPendiente: d.totalAmount, estado: 'PENDIENTE' }
  })

  const anticipo        = Math.ceil(d.totalAmount / 2)
  const fechaFormateada = parseLocalDate(d.eventDate).toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
  const base          = (process.env.FRONTEND_URL ?? '').replace(/\/$/, '')
  const loginUrl      = `${base}/login`
  const nombreCliente = `${usuario.nombre} ${cliente.apellido}`.trim()

  const mail = emailReservaCreada({
    nombreCliente, fechaFormateada,
    startTime:   d.startTime,
    endTime:     d.endTime,
    location:    d.location,
    eventType:   d.eventType ?? 'Serenata',
    totalAmount: d.totalAmount,
    anticipo,    loginUrl,
  })
  await transporter.sendMail({ from: process.env.MAIL_FROM, to: cliente.email, ...mail })
    .catch(err => console.error('Error enviando correo de reserva:', err))

  return getReservaById(reserva.id)
}

// ─── EDITAR ───────────────────────────────────────────────────────────────────
export const updateReserva = async (id: number, data: ReservaUpdateInput): Promise<ReservationResponse> => {
  const r = await prisma.reserva.findUnique({ where: { id }, include: { cotizacion: true } })
  if (!r) throw new Error('Reserva no encontrada')
  if (r.estado === 'ANULADA') throw new Error('No se puede editar una reserva anulada')

  const parsed = ReservaUpdateSchema.safeParse(data)
  if (!parsed.success) throw new Error(zodError(parsed.error))
  const d = parsed.data

  const date       = d.eventDate ?? toLocalDate(r.cotizacion.fechaEvento)
  const horaInicio = d.startTime ? new Date(`${date}T${d.startTime}:00`) : r.cotizacion.horaInicio
  const horaFin    = d.endTime   ? new Date(`${date}T${d.endTime}:00`)   : r.cotizacion.horaFin

  if (d.startTime || d.endTime || d.eventDate) {
    // ✅ Validar 6h si es hoy y se está cambiando la hora
    if (d.startTime) validarAnticipacionMismoDia(date, d.startTime)

    const bufferInicio = new Date(horaInicio.getTime() - 60 * 60 * 1000)
    const bufferFin    = horaFin

    const reservaSolapada = await prisma.reserva.findFirst({
      where: {
        id:     { not: id },
        estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
        cotizacion: {
          fechaEvento: parseLocalDate(date),
          horaInicio:  { lt: bufferFin },
          horaFin:     { gt: bufferInicio },
        }
      }
    })
    if (reservaSolapada) throw new Error('Ya existe una reserva en ese horario. Por favor elige otro horario.')
  }

  await prisma.cotizacion.update({
    where: { id: r.cotizacionId },
    data: {
      nombreHomenajeado: d.homenajeado || undefined,
      tipoEvento:        d.eventType  ? mapEventType(d.eventType) : undefined,
      fechaEvento:       d.eventDate  ? parseLocalDate(d.eventDate) : undefined,
      horaInicio, horaFin,
      direccionEvento:   d.location   || undefined,
      notasAdicionales:  d.notes !== undefined ? (d.notes || null) : undefined,
    }
  })

  if (d.totalAmount !== undefined) {
    const nuevoTotal = Number(d.totalAmount)
    if (!isNaN(nuevoTotal) && nuevoTotal > 0) {
      const pagado     = Number(r.totalValor) - Number(r.saldoPendiente)
      const nuevoSaldo = Math.max(0, nuevoTotal - pagado)
      await prisma.reserva.update({ where: { id }, data: { totalValor: nuevoTotal, saldoPendiente: nuevoSaldo } })
    }
  }

  if (d.selectedServices) {
    await prisma.cotizacionServicio.deleteMany({ where: { cotizacionId: r.cotizacionId } })
    if (d.selectedServices.length)
      await prisma.cotizacionServicio.createMany({
        data: d.selectedServices.map((s: ServicioSeleccionado) => ({
          cotizacionId: r.cotizacionId, servicioId: Number(s.serviceId), cantidad: s.quantity
        }))
      })
  }

  if (d.repertoireIds) {
    await prisma.cotizacionRepertorio.deleteMany({ where: { cotizacionId: r.cotizacionId } })
    if (d.repertoireIds.length)
      await prisma.cotizacionRepertorio.createMany({
        data: d.repertoireIds.map((rid: string | number, i: number) => ({
          cotizacionId: r.cotizacionId, repertorioId: Number(rid), orden: i
        }))
      })
  }

  return getReservaById(id)
}

// ─── ANULAR ───────────────────────────────────────────────────────────────────
/**
 * Marca una reserva y su cotizacion asociada como ANULADA.
 * Opcionalmente registra el motivo de anulación al final de las notas
 * existentes en la cotización (formato: "[Anulada: motivo]").
 * Usa Promise.all para ejecutar ambas actualizaciones en paralelo.
 */
export const anularReserva = async (id: number, motivo?: string): Promise<ReservationResponse> => {
  const r = await prisma.reserva.findUnique({ where: { id }, include: { cotizacion: true } })
  if (!r) throw new Error('Reserva no encontrada')
  if (r.estado === 'ANULADA') throw new Error('La reserva ya está anulada')

  await Promise.all([
    prisma.reserva.update({ where: { id }, data: { estado: 'ANULADA' } }),
    prisma.cotizacion.update({
      where: { id: r.cotizacionId },
      data: {
        estado: 'ANULADA',
        notasAdicionales: motivo
          ? `${r.cotizacion.notasAdicionales ?? ''} [Anulada: ${motivo}]`.trim()
          : r.cotizacion.notasAdicionales
      }
    })
  ])
  return getReservaById(id)
}

// ─── CONFIRMAR RESERVA ────────────────────────────────────────────────────────────────
/**
 * Cambia el estado de una reserva PENDIENTE a CONFIRMADA.
 * Acción típicamente ejecutada por el administrador tras verificar
 * el pago del anticipo o aprobar manualmente la solicitud.
 */

export const confirmarReserva = async (id: number): Promise<ReservationResponse> => {
  const r = await prisma.reserva.findUnique({ where: { id } })
  if (!r) throw new Error('Reserva no encontrada')
  await prisma.reserva.update({ where: { id }, data: { estado: 'CONFIRMADA' } })
  return getReservaById(id)
}

// ─── ELIMINAR RESERVA ───────────────────────────────────────────────────────────────────
/**
 * Elimina físicamente una reserva de la base de datos.
 * Solo se permite si la reserva está ANULADA y no tiene abonos registrados,
 * para proteger el historial financiero y evitar eliminaciones accidentales.
 */
export const deleteReserva = async (id: number) => {
  const r = await prisma.reserva.findUnique({ where: { id }, include: { abonos: true } })
  if (!r) throw new Error('Reserva no encontrada')
  if (r.estado !== 'ANULADA')  throw new Error('Solo se pueden eliminar reservas anuladas')
  if (r.abonos.length > 0)     throw new Error('No se puede eliminar una reserva con abonos registrados')
  await prisma.reserva.delete({ where: { id } })
  return { message: 'Reserva eliminada correctamente' }
}