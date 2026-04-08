  import prisma from '../../config/prisma'
import transporter from '../../config/mailer'
import { ReservaCreateSchema, ReservaUpdateSchema, zodError } from '../schemas'
import { toLocalDate, toLocalTime, parseLocalDate, validarAnticipacionMismoDia } from '../../utils/date.helpers'
import { mapEventType } from '../../utils/event.helpers'
import { emailReservaCreada } from '../../utils/email.templates'
import { AppError } from '../../utils/AppError'
import { mapToReservation, mapToPublicReservation } from './helpers/Reserva.mappers'
import { verificarDisponibilidadReserva, getAvailableHours, validarServiciosReserva } from './helpers/Reserva.validators'
import type { ReservaConRelaciones, ReservaPublica } from './helpers/Reserva.mappers'
import type { ReservaCreateInput, ReservaUpdateInput, ServicioSeleccionado, ReservationResponse } from '../../types/interfaces'
import type { EstadoReserva } from '../../generated/prisma'

// ─── QUERY ─────────────────────────────────────────────────────
const reservaInclude = {
  cotizacion: {
    include: {
      cliente:     { include: { usuario: true } },
      servicios:   true,
      repertorios: true,
    },
  },
  abonos: true,
}

// ─── OBTENER ──────────────────────────────────────────────────────────────────
export const getReservas = async (usuarioId?: number): Promise<ReservationResponse[]> => {
  const where = usuarioId
    ? { cotizacion: { cliente: { usuario: { id: usuarioId } } } }
    : { estado: { in: ['PENDIENTE', 'CONFIRMADA', 'ANULADA'] as EstadoReserva[] } }

  const reservas = await prisma.reserva.findMany({
    where,
    include:  reservaInclude,
    orderBy:  { createdAt: 'desc' },
  })
  return reservas.map(r => mapToReservation(r as unknown as ReservaConRelaciones))
}

export const getReservasCalendario = async () => {
  const [reservas, ensayos, cotizaciones] = await Promise.all([
    prisma.reserva.findMany({
      where: { estado: { in: ['PENDIENTE', 'CONFIRMADA'] as EstadoReserva[] } },
      include: {
        cotizacion: {
          select: {
            clienteId:   true,
            fechaEvento: true,
            horaInicio:  true,
            horaFin:     true,
            tipoEvento:  true,
            cliente:     { select: { email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),

    prisma.ensayo.findMany({
      where:   { estado: 'PENDIENTE' },
      orderBy: { fechaHora: 'asc' },
    }),

    prisma.cotizacion.findMany({
      where: {
        estado:           'EN_ESPERA',
        esReservaDirecta: false,
      },
      include: {
        cliente: { select: { email: true } },
      },
      orderBy: { fechaEvento: 'asc' },
    }),
  ])

  const reservasMapped = reservas.map(r => ({
    ...mapToPublicReservation(r as unknown as ReservaPublica),
    clientEmail: r.cotizacion?.cliente?.email ?? '',
  }))

  const ensayosMapped = ensayos.map(e => ({
    id:        String(e.id),
    eventDate: toLocalDate(e.fechaHora),
    eventTime: toLocalTime(e.fechaHora),
    startTime: toLocalTime(e.fechaHora),
    endTime:   toLocalTime(new Date(e.fechaHora.getTime() + 60 * 60 * 1000)),
    eventType: 'ENSAYO',
    status:    e.estado,
    title:     e.nombre,
  }))

  const cotizacionesMapped = cotizaciones.map(c => ({
    id:          String(c.id),
    clientId:    c.clienteId ? String(c.clienteId) : null,
    eventDate:   toLocalDate(c.fechaEvento),
    eventTime:   toLocalTime(c.horaInicio),
    startTime:   toLocalTime(c.horaInicio),
    endTime:     toLocalTime(c.horaFin),
    eventType:   'COTIZACION',
    status:      c.estado,
    clientEmail: c.cliente?.email ?? c.contactoEmail ?? '',
  }))

  return [...reservasMapped, ...ensayosMapped, ...cotizacionesMapped] 
}
export { getAvailableHours }

// ─── OBTENER POR ID ───────────────────────────────────────────────────────────────────
export const getReservaById = async (id: number): Promise<ReservationResponse> => {
  const r = await prisma.reserva.findUnique({ where: { id }, include: reservaInclude })
  if (!r) throw new AppError('Reserva no encontrada', 404)
  return mapToReservation(r as unknown as ReservaConRelaciones)
}

// ─── CREAR ────────────────────────────────────────────────────────────────────
export const createReserva = async (data: ReservaCreateInput): Promise<ReservationResponse> => {
  const parsed = ReservaCreateSchema.safeParse({ ...data, totalAmount: Number(data.totalAmount) })
  if (!parsed.success) throw new AppError(zodError(parsed.error), 400)

  const d = parsed.data

  validarAnticipacionMismoDia(d.eventDate, d.startTime)

  // 1. Validar que haya al menos un servicio
  if (!d.selectedServices?.length)
    throw new AppError('Debes seleccionar al menos un tipo de serenata', 400)

  // 2. Traer servicios de la DB
  const serviceIds  = d.selectedServices.map(s => Number(s.serviceId))
  const serviciosDB = await prisma.servicio.findMany({
    where: { id: { in: serviceIds }, estado: true },
  })

  if (serviciosDB.length !== serviceIds.length)
    throw new AppError('Uno o más servicios seleccionados no existen o están inactivos', 400)

  // 3. Validar reglas de negocio y total
  await validarServiciosReserva(
    d.selectedServices,
    serviciosDB,
    d.repertoireIds,
    d.totalAmount,
    d.startTime,
    d.endTime,
  )

  // 4. Buscar cliente → usuario
  const cliente = await prisma.cliente.findUnique({
    where:   { id: Number(d.clienteId) },
    include: { usuario: true },
  })
  if (!cliente)         throw new AppError('Cliente no encontrado', 404)
  if (!cliente.usuario) throw new AppError('Usuario no encontrado para este cliente', 404)

  const usuario     = cliente.usuario
  const nuevaInicio = new Date(`${d.eventDate}T${d.startTime}:00`)
  const nuevaFin    = new Date(`${d.eventDate}T${d.endTime}:00`)

  // 5. Verificar disponibilidad (sin excludes porque es nueva)
  await verificarDisponibilidadReserva(d.eventDate, nuevaInicio, nuevaFin)

  const horas = await getAvailableHours(d.eventDate)
  if (!horas.includes(d.startTime))
    throw new AppError(`La hora ${d.startTime} no está disponible`, 409)

  // 6. Crear en transacción
  const reserva = await prisma.$transaction(async (tx) => {
    const cot = await tx.cotizacion.create({
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
        contactoNombre:    null,
        contactoTelefono:  null,
        contactoTelefono2: null,
        contactoEmail:     null,
      },
    })

    if (d.selectedServices?.length)
      await tx.cotizacionServicio.createMany({
        data: d.selectedServices.map((s: ServicioSeleccionado) => ({
          cotizacionId: cot.id,
          servicioId:   Number(s.serviceId),
          cantidad:     s.quantity,
        })),
      })

    if (d.repertoireIds?.length)
      await tx.cotizacionRepertorio.createMany({
        data: d.repertoireIds.map((rid: string | number, i: number) => ({
          cotizacionId: cot.id,
          repertorioId: Number(rid),
          orden:        i,
        })),
      })

    return tx.reserva.create({
      data: {
        cotizacionId:   cot.id,
        totalValor:     d.totalAmount,
        saldoPendiente: d.totalAmount,
        estado:         'PENDIENTE',
      },
    })
  })

  // 7. Email fuera de la transacción
  const anticipo        = Math.ceil(d.totalAmount / 2)
  const fechaFormateada = parseLocalDate(d.eventDate).toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const mail = emailReservaCreada({
    nombreCliente: `${usuario.nombre} ${cliente.apellido}`.trim(),
    fechaFormateada,
    startTime:     d.startTime,
    endTime:       d.endTime,
    location:      d.location,
    eventType:     d.eventType ?? 'Serenata',
    totalAmount:   d.totalAmount,
    anticipo,
    loginUrl:      `${(process.env.FRONTEND_URL ?? '').replace(/\/$/, '')}/login`,
  })
  await transporter.sendMail({ from: process.env.MAIL_FROM, to: cliente.email, ...mail })
    .catch(err => console.error('Error enviando correo de reserva:', err))

  return getReservaById(reserva.id)
}

// ─── EDITAR ───────────────────────────────────────────────────────────────────
export const updateReserva = async (id: number, data: ReservaUpdateInput): Promise<ReservationResponse> => {

  const r = await prisma.reserva.findUnique({
  where:   { id },
  include: {
    cotizacion: {
      include: {
        repertorios: true,
      }
    }
  }
})

  if (!r)                     throw new AppError('Reserva no encontrada', 404)
  if (r.estado === 'ANULADA') throw new AppError('No se puede editar una reserva anulada', 409)

  const parsed = ReservaUpdateSchema.safeParse(data)
  if (!parsed.success) throw new AppError(zodError(parsed.error), 400)

  const d          = parsed.data
  const date       = d.eventDate ?? toLocalDate(r.cotizacion.fechaEvento)
  const horaInicio = d.startTime ? new Date(`${date}T${d.startTime}:00`) : r.cotizacion.horaInicio
  const horaFin    = d.endTime   ? new Date(`${date}T${d.endTime}:00`)   : r.cotizacion.horaFin

  // ── Validar servicios si se envían ────────────────────────────────────────
  if (d.selectedServices?.length) {
    const serviceIds  = d.selectedServices.map(s => Number(s.serviceId))
    const serviciosDB = await prisma.servicio.findMany({
      where: { id: { in: serviceIds }, estado: true },
    })

    if (serviciosDB.length !== serviceIds.length)
      throw new AppError('Uno o más servicios seleccionados no existen o están inactivos', 400)

    const startTime = d.startTime ?? toLocalTime(r.cotizacion.horaInicio)
    const endTime   = d.endTime   ?? toLocalTime(r.cotizacion.horaFin)

    // Usar repertoireIds nuevos si se envían, si no los actuales de la cotización
    const repertoireIds = d.repertoireIds !== undefined
      ? d.repertoireIds
      : r.cotizacion.repertorios?.map((rep: any) => rep.repertorioId) ?? []

    const totalAmount = d.totalAmount ?? Number(r.totalValor)

    await validarServiciosReserva(
      d.selectedServices,
      serviciosDB,
      repertoireIds,
      totalAmount,
      startTime,
      endTime,
    )
  }

  // ── Validar disponibilidad si cambia fecha/hora ────────────────────────────
  if (d.startTime || d.endTime || d.eventDate) {
    if (d.startTime) validarAnticipacionMismoDia(date, d.startTime)

    // ✅ Clave: excluir tanto la reserva como su propia cotización para no bloquearse
    await verificarDisponibilidadReserva(
      date,
      horaInicio,
      horaFin,
      id,                    // excludeReservaId
      r.cotizacionId,        // excludeCotizacionId ← NUEVO
    )
  }

  await prisma.$transaction(async (tx) => {
    await tx.cotizacion.update({
      where: { id: r.cotizacionId },
      data: {
        nombreHomenajeado: d.homenajeado || undefined,
        tipoEvento:        d.eventType  ? mapEventType(d.eventType) : undefined,
        fechaEvento:       d.eventDate  ? parseLocalDate(d.eventDate) : undefined,
        horaInicio,
        horaFin,
        direccionEvento:   d.location   || undefined,
        notasAdicionales:  d.notes !== undefined ? (d.notes || null) : undefined,
      },
    })

    if (d.totalAmount !== undefined) {
      const nuevoTotal = Number(d.totalAmount)
      if (!isNaN(nuevoTotal) && nuevoTotal > 0) {
        const pagado     = Number(r.totalValor) - Number(r.saldoPendiente)
        const nuevoSaldo = Math.max(0, nuevoTotal - pagado)
        await tx.reserva.update({
          where: { id },
          data:  { totalValor: nuevoTotal, saldoPendiente: nuevoSaldo },
        })
      }
    }

    if (d.selectedServices) {
      await tx.cotizacionServicio.deleteMany({ where: { cotizacionId: r.cotizacionId } })
      if (d.selectedServices.length)
        await tx.cotizacionServicio.createMany({
          data: d.selectedServices.map((s: ServicioSeleccionado) => ({
            cotizacionId: r.cotizacionId,
            servicioId:   Number(s.serviceId),
            cantidad:     s.quantity,
          })),
        })
    }

    if (d.repertoireIds) {
      await tx.cotizacionRepertorio.deleteMany({ where: { cotizacionId: r.cotizacionId } })
      if (d.repertoireIds.length)
        await tx.cotizacionRepertorio.createMany({
          data: d.repertoireIds.map((rid: string | number, i: number) => ({
            cotizacionId: r.cotizacionId,
            repertorioId: Number(rid),
            orden:        i,
          })),
        })
    }
  })

  return getReservaById(id)
}

// ─── ANULAR ───────────────────────────────────────────────────────────────────
export const anularReserva = async (id: number, motivo?: string): Promise<ReservationResponse> => {
  const r = await prisma.reserva.findUnique({ where: { id }, include: { cotizacion: true } })
  if (!r)                     throw new AppError('Reserva no encontrada', 404)
  if (r.estado === 'ANULADA') throw new AppError('La reserva ya está anulada', 409)

  await Promise.all([
    prisma.reserva.update({ where: { id }, data: { estado: 'ANULADA' } }),
    prisma.cotizacion.update({
      where: { id: r.cotizacionId },
      data: {
        estado:           'ANULADA',
        notasAdicionales: motivo
          ? `${r.cotizacion.notasAdicionales ?? ''} [Anulada: ${motivo}]`.trim()
          : r.cotizacion.notasAdicionales,
      },
    }),
  ])

  return getReservaById(id)
}

// ─── CONFIRMAR ────────────────────────────────────────────────────────────────
export const confirmarReserva = async (id: number): Promise<ReservationResponse> => {
  const r = await prisma.reserva.findUnique({ where: { id } })
  if (!r) throw new AppError('Reserva no encontrada', 404)
  if (r.estado !== 'PENDIENTE')
    throw new AppError('Solo se pueden confirmar reservas pendientes', 409)

  await prisma.reserva.update({ where: { id }, data: { estado: 'CONFIRMADA' } })
  return getReservaById(id)
}

// ─── ELIMINAR ─────────────────────────────────────────────────────────────────
export const deleteReserva = async (id: number) => {
  const r = await prisma.reserva.findUnique({ where: { id }, include: { abonos: true } })
  if (!r)                     throw new AppError('Reserva no encontrada', 404)
  if (r.estado !== 'ANULADA') throw new AppError('Solo se pueden eliminar reservas anuladas', 409)
  if (r.abonos.length > 0)    throw new AppError('No se puede eliminar una reserva con abonos registrados', 409)

  await prisma.$transaction(async (tx) => {
    await tx.reserva.delete({ where: { id } })
    await tx.cotizacion.delete({ where: { id: r.cotizacionId } })
  })

  return { message: 'Reserva eliminada correctamente' }
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
      reserva: { include: { cotizacion: { include: { cliente: { include: { usuario: true } } } } } },
      cliente: { include: { usuario: true } }
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
    clientEmail: a.cliente?.email ?? a.reserva?.cotizacion?.cliente?.email ?? '',
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

  if (!reserva) throw new AppError('Reserva no encontrada', 404)
  if (reserva.estado === 'ANULADA') throw new AppError('No se puede registrar abono en una reserva anulada', 400)

  const monto = Number(data.amount)
  if (isNaN(monto) || monto <= 0) throw new AppError('Monto de abono inválido', 400)

  const saldoActual = Number(reserva.saldoPendiente)
  if (monto > saldoActual) throw new AppError('El monto de abono supera el saldo pendiente', 400)

  const metodoPagoRaw = String(data.method ?? '').trim().toUpperCase()
  const allowedMetodoPago = ['EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'NEQUI', 'DAVIPLATA', 'OTRO']
  if (!allowedMetodoPago.includes(metodoPagoRaw)) throw new AppError('Método de pago inválido', 400)

  const nuevoSaldo = Number((saldoActual - monto).toFixed(2))

  const clienteId = reserva.cotizacion?.clienteId
  if (!clienteId) throw new AppError('Reserva sin cliente asociado', 400)

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
}
