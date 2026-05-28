import prisma from '../../config/prisma'
import sendMail from '../../config/mailer'
import { ReservaCreateSchema, ReservaUpdateSchema, zodError } from '../schemas'
import { toLocalDate, toLocalTime, parseLocalDate, validarAnticipacionMismoDia, buildClientName } from '../../utils/date.helpers'
import { mapEventType } from '../../utils/event.helpers'
import { emailReservaCreada, emailReservaAnulada } from '../../utils/email.templates'
import { AppError } from '../../utils/AppError'
import { mapToReservation, mapToPublicReservation } from './helpers/Reserva.mappers'
import { verificarDisponibilidadReserva, getAvailableHours, validarServiciosReserva } from './helpers/Reserva.validators'
import type { ReservaConRelaciones, ReservaPublica } from './helpers/Reserva.mappers'
import type { ReservaCreateInput, ReservaUpdateInput, ServicioSeleccionado, ReservationResponse } from '../../types/interfaces'
import type { EstadoReserva } from '../../generated/prisma'
import cron from 'node-cron'

// ─── QUERY ─────────────────────────────────────────────────────
const reservaInclude = {
  cotizacion: {
    include: {
      cliente: { include: { usuario: true } },
      servicios: { include: { servicio: true } },
      repertorios: { include: { repertorio: true } },
    },
  },
  abonos: true,
}

// ─── OBTENER ──────────────────────────────────────────────────────────────────
export const getReservas = async (usuarioId?: number): Promise<ReservationResponse[]> => {
  // Asegurar que las reservas estén actualizadas antes de devolverlas
  await anularReservasVencidas().catch(err => console.error('[Cleanup] Error anular:', err))
  await finalizarReservasPorHoraEvento().catch(err => console.error('[Cleanup] Error finalizar:', err))

  let where: any = {};

  if (usuarioId) {
    // Si hay usuarioId, es un cliente. Buscamos su registro de cliente primero.
    const cliente = await prisma.cliente.findUnique({ 
      where: { usuarioId },
      select: { id: true }
    });
    
    if (!cliente) return []; // Si no hay cliente asociado al usuario, no hay reservas.

    where = { 
      cotizacion: { clienteId: cliente.id },
      estado: { not: 'ANULADA' as EstadoReserva } // Al cliente no le mostramos las anuladas por defecto
    };
  } else {
    // Para el administrador/empleado:
    // Mostrar PENDIENTE, o ANULADA si no tiene venta ni abonos (anuladas en reservas)
    where = {
      OR: [
        { estado: 'PENDIENTE' as EstadoReserva },
        {
          estado: 'ANULADA' as EstadoReserva,
          venta: null,
          abonos: { none: {} }
        }
      ]
    };
  }

  const reservas = await prisma.reserva.findMany({
    where,
    include: reservaInclude,
    orderBy: { createdAt: 'desc' },
  })
  return reservas.map(r => mapToReservation(r as unknown as ReservaConRelaciones))
}

///Obtener reservas para el calendario
export const getReservasCalendario = async () => {
  // Asegurar que las reservas estén actualizadas antes de devolverlas
  await anularReservasVencidas().catch(err => console.error('[Cleanup] Error anular:', err))
  await finalizarReservasPorHoraEvento().catch(err => console.error('[Cleanup] Error finalizar:', err))

  const reservaWhere = { estado: { not: 'ANULADA' as EstadoReserva } }

  const [reservas, ensayos, cotizaciones, ventasFinalizadas] = await Promise.all([
    prisma.reserva.findMany({
      where: reservaWhere,
      include: {
        cotizacion: {
          select: {
            clienteId: true,
            fechaEvento: true,
            horaInicio: true,
            horaFin: true,
            tipoEvento: true,
            cliente: {
              select: {
                email: true,
                apellido: true,
                usuario: { select: { nombre: true } }, // ← nuevo
              }
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),

    prisma.ensayo.findMany({
      where: { estado: 'PENDIENTE' },
      orderBy: { fechaHora: 'asc' },
    }),

    prisma.cotizacion.findMany({
      where: {
        estado: 'EN_ESPERA',
        esReservaDirecta: false,
      },
      include: {
        cliente: { select: { email: true } },
      },
      orderBy: { fechaEvento: 'asc' },
    }),

    // Ventas DIRECTAS (sin reserva) que no estén canceladas
    prisma.venta.findMany({
      where: { 
        estado: { not: 'CANCELADA' },
        reservaId: null // Crucial: evitar duplicados si ya vienen de la tabla Reserva
      },
      include: {
        reserva: {
          include: {
            cotizacion: {
              select: {
                clienteId: true,
                fechaEvento: true,
                horaInicio: true,
                horaFin: true,
                tipoEvento: true,
                nombreHomenajeado: true,
                direccionEvento: true,
                cliente: {
                  select: {
                    email: true,
                    usuario: { select: { nombre: true } },
                    apellido: true,
                    telefonoPrincipal: true,
                    telefonoAlternativo: true,
                  }
                },
              },
            },
            // ← abonos para mostrar el historial de pagos en el detalle
            abonos: {
              orderBy: { fechaPago: 'asc' },
            },
          },
        },
        cliente: {
          select: {
            email: true,
            usuario: { select: { nombre: true } },
            apellido: true,
            telefonoPrincipal: true,
            telefonoAlternativo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const reservasMapped = reservas.map(r => {
    const cli = r.cotizacion?.cliente as any
    const nombre = cli?.usuario?.nombre ?? ''
    const apellido = cli?.apellido ?? ''
    // Construir nombre completo: "Brayan" + " " + "Tamayo" = "Brayan Tamayo"
    const fullName = nombre && apellido
      ? `${nombre} ${apellido}`
      : nombre || apellido || ''

    return {
      ...mapToPublicReservation(r as unknown as ReservaPublica),
      clientEmail: cli?.email ?? '',
      clientName: fullName,
    }
  })

  const ensayosMapped = ensayos.map(e => ({
    id: String(e.id),
    eventDate: toLocalDate(e.fechaHora),
    eventTime: toLocalTime(e.fechaHora),
    startTime: toLocalTime(e.fechaHora),
    endTime: toLocalTime(new Date(e.fechaHora.getTime() + 60 * 60 * 1000)),
    eventType: 'ENSAYO',
    status: e.estado,
    title: e.nombre,
  }))

  const cotizacionesMapped = cotizaciones.map(c => ({
    id: String(c.id),
    clientId: c.clienteId ? String(c.clienteId) : null,
    eventDate: toLocalDate(c.fechaEvento),
    eventTime: toLocalTime(c.horaInicio),
    startTime: toLocalTime(c.horaInicio),
    endTime: toLocalTime(c.horaFin),
    eventType: 'COTIZACION',
    status: c.estado,
    clientEmail: c.cliente?.email ?? c.contactoEmail ?? '',
  }))

  // ─── Ventas FINALIZADAS - siempre aparecen en calendario ───
  const ventasFinalizadasMapped = ventasFinalizadas
    .filter(v => {
      // Solo incluir si tiene fecha (de cualquier fuente)
      const cot = (v.reserva as any)?.cotizacion
      const fechaEvento = cot?.fechaEvento || v.fechaVenta
      return !!fechaEvento // Solo incluir si tiene fecha
    })
    .map(v => {
      const cot = (v.reserva as any)?.cotizacion
      const cliente = (cot?.cliente as any) || (v.cliente as any)
      const nombreCliente = cliente
        ? buildClientName(cliente.usuario?.nombre, cliente.apellido)
        : 'Cliente'

      // Usar fecha de cotización si existe, sino usar fechaVenta
      const fechaEvento = cot?.fechaEvento || v.fechaVenta
      const horaInicio = cot?.horaInicio
      const horaFin = cot?.horaFin

      // Mapear los abonos de la reserva como payments
      const abonos = (v.reserva as any)?.abonos ?? []
      const payments = abonos.map((a: any) => ({
        id: String(a.id),
        amount: Number(a.monto),
        date: a.fechaPago?.toISOString() ?? '',
        method: a.metodoPago ?? '',
        notes: a.notas ?? '',
      }))

      return {
        id: `VENTA-${v.id}`,
        cotizacionId: v.reservaId ? String(v.reservaId) : undefined,
        clientName: nombreCliente,
        clientId: String(v.clienteId),
        clientPhone: cliente?.telefonoPrincipal ?? '',
        secondaryPhone: cliente?.telefonoAlternativo ?? '',
        clientEmail: cliente?.email ?? '',
        homenajeado: cot?.nombreHomenajeado ?? 'Sin especificar',
        eventType: cot?.tipoEvento ?? 'Venta Finalizada',
        eventDate: toLocalDate(fechaEvento as Date),
        eventTime: horaInicio ? toLocalTime(horaInicio) : '08:00',
        startTime: horaInicio ? toLocalTime(horaInicio) : '08:00',
        endTime: horaFin ? toLocalTime(horaFin) : '23:00',
        location: cot?.direccionEvento ?? 'Sin especificar',
        address: cot?.direccionEvento ?? 'Sin especificar',
        neighborhood: '',
        repertoireIds: [],
        selectedServices: [],
        totalAmount: Number(v.montoTotal),
        paidAmount: Number(v.montoPagado),
        pendingAmount: Number(v.montoTotal) - Number(v.montoPagado),
        payments,
        status: v.estado === 'FINALIZADO' ? 'FINALIZADO' : 'CONFIRMADA',
      }
    })

  return [...reservasMapped, ...ensayosMapped, ...cotizacionesMapped, ...ventasFinalizadasMapped]
}
export { getAvailableHours }

// ─── OBTENER POR ID ───────────────────────────────────────────────────────────────────
export const getReservaById = async (id: number): Promise<ReservationResponse> => {
  const r = await prisma.reserva.findUnique({ where: { id }, include: reservaInclude })
  if (!r) throw new AppError('Reserva no encontrada', 404)
  return mapToReservation(r as unknown as ReservaConRelaciones)
}

// ─── CREAR ────────────────────────────────────────────────────────────────────
export const createReserva = async (data: ReservaCreateInput, isAdmin = false): Promise<ReservationResponse> => {
  const parsed = ReservaCreateSchema.safeParse({ ...data, totalAmount: Number(data.totalAmount) })
  if (!parsed.success) throw new AppError(zodError(parsed.error), 400)

  const d = parsed.data

  validarAnticipacionMismoDia(d.eventDate, d.startTime, isAdmin)

  // 1. Validar que haya al menos un servicio
  if (!d.selectedServices?.length)
    throw new AppError('Debes seleccionar al menos un tipo de serenata', 400)

  // 2. Traer servicios de la DB
  const serviceIds = d.selectedServices.map(s => Number(s.serviceId))
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
  const clienteNumerico = Number(d.clienteId)

  let cliente = await prisma.cliente.findUnique({
    where: { id: clienteNumerico },
    include: { usuario: true },
  })

  // Si no se encontró por cliente.id, intentar por usuarioId
  // (el frontend puede enviar el ID del usuario en lugar del ID del cliente)
  if (!cliente) {
    cliente = await prisma.cliente.findUnique({
      where: { usuarioId: clienteNumerico },
      include: { usuario: true },
    })
  }

  if (!cliente) throw new AppError('Cliente no encontrado', 404)
  if (!cliente.usuario) throw new AppError('Usuario no encontrado para este cliente', 404)

  const usuario = cliente.usuario
  const nuevaInicio = new Date(`${d.eventDate}T${d.startTime}:00`)
  const nuevaFin = new Date(`${d.eventDate}T${d.endTime}:00`)
  if (nuevaFin < nuevaInicio) nuevaFin.setDate(nuevaFin.getDate() + 1)

  // 5. Verificar disponibilidad (sin excludes porque es nueva)
  await verificarDisponibilidadReserva(d.eventDate, nuevaInicio, nuevaFin)

  const horas = await getAvailableHours(d.eventDate)
  if (!horas.includes(d.startTime))
    throw new AppError(`La hora ${d.startTime} no está disponible`, 409)

  // 6. Crear en transacción
  const reserva = await prisma.$transaction(async (tx) => {
    const cot = await tx.cotizacion.create({
      data: {
        clienteId: cliente.id,
        nombreHomenajeado: d.homenajeado || 'Sin especificar',
        tipoEvento: mapEventType(d.eventType ?? 'OTRO'),
        fechaEvento: parseLocalDate(d.eventDate),
        horaInicio: nuevaInicio,
        horaFin: nuevaFin,
        direccionEvento: d.location,
        notasAdicionales: d.notes ?? null,
        totalEstimado: d.totalAmount,
        esReservaDirecta: true,
        estado: 'CONVERTIDA',
        contactoNombre: null,
        contactoTelefono: null,
        contactoTelefono2: null,
        contactoEmail: null,
      },
    })

    if (d.selectedServices?.length)
      await tx.cotizacionServicio.createMany({
        data: d.selectedServices.map((s: ServicioSeleccionado) => ({
          cotizacionId: cot.id,
          servicioId: Number(s.serviceId),
          cantidad: s.quantity,
        })),
      })

    if (d.repertoireIds?.length)
      await tx.cotizacionRepertorio.createMany({
        data: d.repertoireIds.map((rid: string | number, i: number) => ({
          cotizacionId: cot.id,
          repertorioId: Number(rid),
          orden: i,
        })),
      })

    return tx.reserva.create({
      data: {
        cotizacionId: cot.id,
        totalValor: d.totalAmount,
        saldoPendiente: d.totalAmount,
        estado: 'PENDIENTE',
      },
    })
  })

  // 7. Email fuera de la transacción
  const anticipo = Math.ceil(d.totalAmount / 2)
  const fechaFormateada = parseLocalDate(d.eventDate).toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const mail = emailReservaCreada({
    nombreCliente: `${usuario.nombre} ${cliente.apellido}`.trim(),
    fechaFormateada,
    startTime: d.startTime,
    endTime: d.endTime,
    location: d.location,
    eventType: d.eventType ?? 'Serenata',
    totalAmount: d.totalAmount,
    anticipo,
    loginUrl: `${(process.env.FRONTEND_URL ?? '').replace(/\/$/, '')}/login`,
  })
  try {
    await sendMail({ to: cliente.email, subject: mail.subject, html: mail.html })
    console.log('Correo reserva enviado a:', cliente.email)
  } catch (err) {
    console.error('Error correo reserva:', err)
  }

  // Alerta de nueva reserva al administrador
  try {
    const adminEmail = process.env.MAIL_FROM_ADDRESS || 'infomarriachistexas@gmail.com'
    const nombreCliente = `${usuario.nombre} ${cliente.apellido}`.trim()
    await sendMail({
      to: adminEmail,
      subject: `[Nueva Reserva] Reserva registrada - ${nombreCliente}`,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #ce1126;">Nueva reserva registrada en el sistema</h2>
          <p><b>Cliente:</b> ${nombreCliente}</p>
          <p><b>Email Cliente:</b> ${cliente.email}</p>
          <p><b>Teléfono:</b> ${cliente.telefonoPrincipal || 'No especificado'}</p>
          <p><b>Fecha del Evento:</b> ${fechaFormateada}</p>
          <p><b>Horario:</b> ${d.startTime} - ${d.endTime}</p>
          <p><b>Dirección:</b> ${d.location}</p>
          <p><b>Tipo de Evento:</b> ${d.eventType ?? 'Serenata'}</p>
          <p><b>Valor Total:</b> $${d.totalAmount.toLocaleString('es-CO')} COP</p>
          <p><b>Anticipo del 50% requerido:</b> $${anticipo.toLocaleString('es-CO')} COP</p>
          <p style="margin-top: 20px; font-size: 13px; color: #666;">Por favor, ingresa al panel de administración para revisarla.</p>
        </div>
      `
    })
    console.log('Notificación de reserva enviada al administrador:', adminEmail)
  } catch (adminMailErr) {
    console.error('Error al enviar alerta de reserva al administrador:', adminMailErr)
  }

  return getReservaById(reserva.id)
}

// ─── EDITAR ───────────────────────────────────────────────────────────────────
export const updateReserva = async (id: number, data: ReservaUpdateInput, isAdmin = false): Promise<ReservationResponse> => {

  const r = await prisma.reserva.findUnique({
    where: { id },
    include: {
      cotizacion: {
        include: {
          repertorios: true,
        }
      },
      venta: true
    }
  })

  if (!r) throw new AppError('Reserva no encontrada', 404)
  if (r.estado === 'ANULADA') throw new AppError('No se puede editar una reserva anulada', 409)

  const parsed = ReservaUpdateSchema.safeParse(data)
  if (!parsed.success) throw new AppError(zodError(parsed.error), 400)

  const d = parsed.data
  const date = d.eventDate ?? toLocalDate(r.cotizacion.fechaEvento)
  const horaInicio = d.startTime ? new Date(`${date}T${d.startTime}:00`) : r.cotizacion.horaInicio
  const horaFin = d.endTime ? new Date(`${date}T${d.endTime}:00`) : r.cotizacion.horaFin
  if (horaFin < horaInicio) horaFin.setDate(horaFin.getDate() + 1)

  // ── No permitir editar a fecha/hora pasada ─────────────────────────────────
  if (horaInicio < new Date()) {
    throw new AppError('No se puede programar una reserva en una fecha u hora que ya pasó', 400)
  }

  // ── Validar servicios si se envían ────────────────────────────────────────
  if (d.selectedServices?.length) {
    const serviceIds = d.selectedServices.map(s => Number(s.serviceId))
    const serviciosDB = await prisma.servicio.findMany({
      where: { id: { in: serviceIds }, estado: true },
    })

    if (serviciosDB.length !== serviceIds.length)
      throw new AppError('Uno o más servicios seleccionados no existen o están inactivos', 400)

    const startTime = d.startTime ?? toLocalTime(r.cotizacion.horaInicio)
    const endTime = d.endTime ?? toLocalTime(r.cotizacion.horaFin)

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
    if (d.startTime) validarAnticipacionMismoDia(date, d.startTime, isAdmin)

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
        tipoEvento: d.eventType ? mapEventType(d.eventType) : undefined,
        fechaEvento: d.eventDate ? parseLocalDate(d.eventDate) : undefined,
        horaInicio,
        horaFin,
        direccionEvento: d.location || undefined,
        notasAdicionales: d.notes !== undefined ? (d.notes || null) : undefined,
      },
    })

    if (d.totalAmount !== undefined) {
      const nuevoTotal = Number(d.totalAmount)
      if (!isNaN(nuevoTotal) && nuevoTotal > 0) {
        const pagado = Number(r.totalValor) - Number(r.saldoPendiente)
        const nuevoSaldo = Math.max(0, nuevoTotal - pagado)
        
        let nuevoEstado = r.estado;
        if (r.estado === 'FINALIZADO' && nuevoSaldo > 0.01) {
          nuevoEstado = 'CONFIRMADA';
        }

        await tx.reserva.update({
          where: { id },
          data: { 
            totalValor: nuevoTotal, 
            saldoPendiente: nuevoSaldo,
            estado: nuevoEstado as any 
          },
        })

        if (r.venta) {
          const estadoVenta = nuevoEstado === 'CONFIRMADA' ? 'CONFIRMADO' : nuevoEstado;
          await tx.venta.update({
            where: { id: r.venta.id },
            data: { 
              montoTotal: nuevoTotal,
              estado: estadoVenta as any 
            }
          })
        }
      }
    }

    if (d.selectedServices) {
      await tx.cotizacionServicio.deleteMany({ where: { cotizacionId: r.cotizacionId } })
      if (d.selectedServices.length)
        await tx.cotizacionServicio.createMany({
          data: d.selectedServices.map((s: ServicioSeleccionado) => ({
            cotizacionId: r.cotizacionId,
            servicioId: Number(s.serviceId),
            cantidad: s.quantity,
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
            orden: i,
          })),
        })
    }
  })

  return getReservaById(id)
}

// ─── ANULAR ───────────────────────────────────────────────────────────────────
export const anularReserva = async (id: number, motivo?: string): Promise<ReservationResponse> => {
  const r = await prisma.reserva.findUnique({
    where: { id },
    include: {
      cotizacion: { include: { cliente: true } },
      abonos: true,
      venta: true,
    }
  })
  if (!r) throw new AppError('Reserva no encontrada', 404)
  if (r.estado === 'ANULADA') throw new AppError('La reserva ya está anulada', 409)

  const notasActualizadas = motivo
    ? `${r.cotizacion.notasAdicionales ?? ''} [Anulada: ${motivo}]`.trim()
    : r.cotizacion.notasAdicionales

  await prisma.$transaction(async (tx) => {
    const totalPagado = r.abonos.reduce((sum, a) => sum + Number(a.monto), 0)
    
    // 1. Marcar reserva y cotización como ANULADA, ajustando el valor total a lo pagado y perdonando la deuda
    await tx.reserva.update({ 
      where: { id }, 
      data: { 
        estado: 'ANULADA',
        saldoPendiente: 0,
        totalValor: r.abonos.length > 0 ? totalPagado : Number(r.totalValor)
      } 
    })
    await tx.cotizacion.update({
      where: { id: r.cotizacionId },
      data: { estado: 'ANULADA', notasAdicionales: notasActualizadas },
    })

    // 2. Si ya existe una Venta asociada, marcarla como CANCELADA
    if (r.venta) {
      await tx.venta.update({
        where: { id: r.venta.id },
        data: { estado: 'CANCELADA', montoTotal: totalPagado },
      })
    }
    // 3. Si no hay Venta pero sí hay abonos, crear una Venta CANCELADA para el registro
    else if (r.abonos.length > 0) {
      const totalPagado = r.abonos.reduce((sum, a) => sum + Number(a.monto), 0)
      const metodoPago = r.abonos[r.abonos.length - 1].metodoPago ?? 'EFECTIVO'


      if (!r.cotizacion.clienteId) {
        throw new Error('La cotización no tiene clienteId');
      }

      await tx.venta.create({
        data: {
          reservaId: id,
          clienteId: r.cotizacion.clienteId,
          tipo: 'RESERVA',
          estado: 'CANCELADA',
          montoTotal: totalPagado,
          montoPagado: totalPagado,
          fechaVenta: new Date(),
          metodoPago: metodoPago as any,
        },
      })
    }
  })

  // 4. Enviar correo de notificación
  try {
    const cliente = r.cotizacion.cliente as any;
    if (cliente) {
      const mail = emailReservaAnulada({
        nombreCliente: buildClientName(cliente.usuario?.nombre, cliente.apellido),
        reservaId: String(r.id),
        motivo: motivo || 'Anulada por solicitud del administrador o cliente.'
      });
      await sendMail({ to: cliente.email, subject: mail.subject, html: mail.html });
    }
  } catch (err) {
    console.error(`Error enviando correo de anulacion para reserva ${id}:`, err);
  }

  return getReservaById(id)
}


// ─── ELIMINAR ─────────────────────────────────────────────────────────────────
export const deleteReserva = async (id: number) => {
  const r = await prisma.reserva.findUnique({ where: { id }, include: { abonos: true } })
  if (!r) throw new AppError('Reserva no encontrada', 404)
  if (r.estado !== 'ANULADA') throw new AppError('Solo se pueden eliminar reservas anuladas', 409)
  if (r.abonos.length > 0) throw new AppError('No se puede eliminar una reserva con abonos registrados', 409)

  await prisma.$transaction(async (tx) => {
    await tx.reserva.delete({ where: { id } })
    await tx.cotizacion.delete({ where: { id: r.cotizacionId } })
  })

  return { message: 'Reserva eliminada correctamente' }
}


// ─── ABONOS ────────────────────────────────────────────────────────────────────
export const getAbonos = async (usuarioId?: number) => {
  // Validate usuarioId
  if (usuarioId !== undefined && (typeof usuarioId !== 'number' || isNaN(usuarioId) || usuarioId <= 0)) {
    throw new Error('ID de usuario inválido')
  }

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

  return abonos.map((a: any) => {
    if (!a.id) {
      throw new Error('Abono sin ID válido')
    }
    return {
      id: String(a.id),
      amount: Number(a.monto || 0),
      date: a.fechaPago?.toISOString() ?? '',
      type: 'Abono Parcial',
      method: a.metodoPago || '',
      notes: a.notas ?? '',
      reservationId: String(a.reservaId || ''),
      reservationStatus: a.reserva?.estado ?? null,
      clientId: String(a.clienteId || ''),
      clientEmail: a.cliente?.email ?? a.reserva?.cotizacion?.cliente?.email ?? '',
      clientName: buildClientName(a.cliente?.usuario?.nombre, a.cliente?.apellido),
      reservationTotal: Number(a.reserva?.totalValor ?? 0),
      newBalance: Number(a.nuevoSaldo ?? 0),
    }
  })

}

//  CREATE ABONO - 50% OR 100% ALLOWED 
export const createAbono = async (reservaId: number, data: { amount: number; date: string; method: string; notes?: string }) => {

  const reserva = await prisma.reserva.findUnique({
    where: { id: reservaId },
    include: { cotizacion: { include: { cliente: true } }, abonos: true, venta: true }
  })

  if (!reserva) throw new AppError('Reserva no encontrada', 404)

  if (reserva.estado === 'ANULADA') throw new AppError('No se puede registrar abono en una reserva anulada', 400)

  const monto = Number(data.amount)
  if (isNaN(monto) || monto <= 0) throw new AppError('Monto de abono inválido', 400)

  const totalValor = Number(reserva.totalValor)
  const saldoActual = Number(reserva.saldoPendiente)
  const pagadoActual = totalValor - saldoActual
  const anticipo50 = Math.ceil(totalValor / 2)

  // Primer abono: puede ser 50% o 100% del total
  if (pagadoActual === 0) {
    if (monto !== anticipo50 && monto !== saldoActual) {
      throw new AppError(
        `El primer abono debe ser el 50% ($${anticipo50.toLocaleString('es-CO')} COP) o el total completo ($${saldoActual.toLocaleString('es-CO')} COP)`,
        400
      )
    }

  } else {
    // Segundo abono: debe ser exactamente el saldo pendiente
    if (monto !== saldoActual) {
      throw new AppError(
        `El abono debe ser exactamente el saldo pendiente: $${saldoActual.toLocaleString('es-CO')} COP`,
        400
      )
    }
  }

  const metodoPagoRaw = String(data.method ?? '').trim().toUpperCase()
  const allowedMetodoPago = ['EFECTIVO', 'TRANSFERENCIA', 'NEQUI', 'DAVIPLATA', 'OTRO']
  if (!allowedMetodoPago.includes(metodoPagoRaw)) throw new AppError('Metodo de pago invalido', 400)

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

  // Actualizar saldo
  await prisma.reserva.update({ where: { id: reservaId }, data: { saldoPendiente: nuevoSaldo } })

  // Si queda saldo > 0 despues del primer abono (50%)  confirmar reserva y crear venta
  if (pagadoActual === 0 && nuevoSaldo > 0.01) {
    await prisma.reserva.update({ where: { id: reservaId }, data: { estado: 'CONFIRMADA' } })

    // Crear venta CONFIRMADO — la reserva pasa automáticamente al módulo Ventas
    if (!reserva.venta) {
      const totalAbonos = reserva.abonos.reduce((sum, a) => sum + Number(a.monto), 0) + monto
      await prisma.venta.create({
        data: {
          reservaId,
          clienteId,
          tipo: 'RESERVA',
          estado: 'CONFIRMADO',
          montoTotal: totalValor,
          montoPagado: totalAbonos,
          fechaVenta: new Date(),
          metodoPago: metodoPagoRaw as any
        }
      })
    }
  }

  // Si saldo = 0  crear venta FINALIZADO o actualizar existente
  if (nuevoSaldo <= 0.01) {
    const totalAbonos = reserva.abonos.reduce((sum, a) => sum + Number(a.monto), 0) + monto
    if (!reserva.venta) {
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
    } else {
      await prisma.venta.update({
        where: { id: reserva.venta.id },
        data: { estado: 'FINALIZADO', montoPagado: totalAbonos },
      })
    }
    // Marcar reserva como FINALIZADO (si vino de pago 100% directo estaba PENDIENTE)
    await prisma.reserva.update({ where: { id: reservaId }, data: { estado: 'FINALIZADO' } })
  }

  const esUltimoPago = nuevoSaldo <= 0.01
  return {
    message: esUltimoPago
      ? 'Pago total registrado. Reserva completamente pagada y venta generada.'
      : 'Anticipo del 50% registrado. Reserva confirmada.',
  }
}






// ─── FINALIZAR (MANUAL) ──────────────────────────────────────────────────────
export const finalizeReserva = async (id: number): Promise<ReservationResponse> => {
  const r = await prisma.reserva.findUnique({
    where: { id },
    include: {
      cotizacion: { include: { cliente: true } },
      abonos: true,
      venta: true,
    },
  })

  if (!r) throw new AppError('Reserva no encontrada', 404)
  if (r.estado === 'ANULADA') throw new AppError('No se puede finalizar una reserva anulada', 400)
  if (r.estado === 'FINALIZADO') return getReservaById(id)

  const saldoPendiente = Number(r.saldoPendiente)
  const totalValor = Number(r.totalValor)
  const clienteId = r.cotizacion?.clienteId

  if (!clienteId) throw new AppError('Reserva sin cliente asociado', 400)

  await prisma.$transaction(async (tx) => {
    // 1. Si hay saldo pendiente, registrar un abono simbólico o ajustar saldo
    if (saldoPendiente > 0) {
      await tx.abono.create({
        data: {
          reservaId: id,
          clienteId,
          monto: saldoPendiente,
          fechaPago: new Date(),
          metodoPago: 'EFECTIVO', // Por defecto si se finaliza manualmente
          notas: 'Abono de cierre por finalización manual',
          nuevoSaldo: 0,
        },
      })
    }

    // 2. Actualizar reserva
    await tx.reserva.update({
      where: { id },
      data: { estado: 'FINALIZADO', saldoPendiente: 0 },
    })

    // 3. Crear venta si no existe
    if (!r.venta) {
      const totalPagado = r.abonos.reduce((sum, a) => sum + Number(a.monto), 0) + saldoPendiente
      await tx.venta.create({
        data: {
          reservaId: id,
          clienteId,
          tipo: 'RESERVA',
          estado: 'FINALIZADO',
          montoTotal: totalValor,
          montoPagado: totalPagado,
          fechaVenta: new Date(),
          metodoPago: r.abonos[0]?.metodoPago ?? 'EFECTIVO',
        },
      })
    } else if (r.venta.estado !== 'FINALIZADO') {
      await tx.venta.update({
        where: { id: r.venta.id },
        data: { estado: 'FINALIZADO', montoPagado: totalValor },
      })
    }
  })

  return getReservaById(id)
}

// ─── CRON: ANULAR RESERVAS VENCIDAS O PASADAS ───────────────────────────
export const anularReservasVencidas = async (): Promise<number> => {
  const ahora = new Date()
  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const reservas = await prisma.reserva.findMany({
    where: {
      estado: 'PENDIENTE',
      OR: [
        { createdAt: { lt: hace24h } },
        { cotizacion: { horaInicio: { lt: ahora } } }
      ]
    },
    include: { abonos: true, cotizacion: true },
  })

  let count = 0
  for (const r of reservas) {
    // Solo anular si no tiene abonos o si la hora ya pasó (lo que invalida la reserva)
    if (r.abonos.length === 0 || r.cotizacion.horaInicio < ahora) {
      const motivo = r.cotizacion.horaInicio < ahora 
        ? 'La hora de inicio del evento ha transcurrido sin confirmacion de la reserva.'
        : 'No se registro el pago del anticipo dentro de las 24 horas posteriores a la creacion de la reserva.'
        
      await prisma.$transaction(async (tx) => {
        const totalPagado = r.abonos.reduce((sum, a) => sum + Number(a.monto), 0)
        
        await tx.reserva.update({ 
          where: { id: r.id }, 
          data: { 
            estado: 'ANULADA',
            saldoPendiente: 0,
            totalValor: r.abonos.length > 0 ? totalPagado : Number(r.totalValor)
          } 
        })

        if (r.abonos.length > 0 && r.cotizacion.clienteId) {
          const metodoPago = r.abonos[r.abonos.length - 1].metodoPago ?? 'EFECTIVO'
          await tx.venta.create({
            data: {
              reservaId: r.id,
              clienteId: r.cotizacion.clienteId,
              tipo: 'RESERVA',
              estado: 'CANCELADA',
              montoTotal: totalPagado,
              montoPagado: totalPagado,
              fechaVenta: new Date(),
              metodoPago: metodoPago as any,
            },
          })
        }
        await tx.cotizacion.update({
          where: { id: r.cotizacionId },
          data: { estado: 'ANULADA', notasAdicionales: `${r.cotizacion.notasAdicionales ?? ''} [Anulada automáticamente: ${r.cotizacion.horaInicio < ahora ? 'evento pasado' : 'sin pago en 24h'}]`.trim() },
        })
      })
      count++

      // Enviar correo de anulación automática
      try {
        const c = r.cotizacion as any;
        const cliente = await prisma.cliente.findUnique({ where: { id: c.clienteId }, include: { usuario: true } });
        if (cliente) {
          const mail = emailReservaAnulada({
            nombreCliente: buildClientName(cliente.usuario?.nombre, cliente.apellido),
            reservaId: String(r.id),
            motivo
          });
          await sendMail({ to: cliente.email, subject: mail.subject, html: mail.html });
        }
      } catch (err) {
        console.error(`[Scheduler] Error enviando correo de anulacion para reserva ${r.id}:`, err);
      }
    }
  }

  if (count > 0) console.log(`[Scheduler] ${count} reserva(s) anulada(s) por vencimiento o fecha pasada`)
  return count
}

// ─── CRON: FINALIZAR RESERVAS POR HORA DE EVENTO ─────────────────────────────
export const finalizarReservasPorHoraEvento = async (): Promise<number> => {
  const ahora = new Date()

  // Buscar reservas CONFIRMADA cuya fecha+hora de fin ya pasó
  const reservasConfirmadas = await prisma.reserva.findMany({
    where: {
      estado: 'CONFIRMADA',
    },
    include: {
      cotizacion: { include: { cliente: true } },
      abonos: true,
      venta: true,
    },
  })

  let count = 0
  for (const r of reservasConfirmadas) {
    const horaFin = r.cotizacion.horaFin
    if (!horaFin || horaFin > ahora) continue  // Aún no ha pasado la hora del evento

    const saldoPendiente = Number(r.saldoPendiente)
    const totalValor = Number(r.totalValor)
    const clienteId = r.cotizacion?.clienteId
    if (!clienteId) continue

    await prisma.$transaction(async (tx) => {
      // Generar abono del saldo restante si hay pendiente
      if (saldoPendiente > 0) {
        await tx.abono.create({
          data: {
            reservaId: r.id,
            clienteId,
            monto: saldoPendiente,
            fechaPago: ahora,
            metodoPago: 'EFECTIVO',
            notas: 'Saldo completado automáticamente al finalizar evento',
            nuevoSaldo: 0,
          },
        })
      }

      // Marcar reserva como finalizada
      await tx.reserva.update({
        where: { id: r.id },
        data: { estado: 'FINALIZADO', saldoPendiente: 0 },
      })

      // Actualizar o crear venta como FINALIZADO
      const totalAbonos = r.abonos.reduce((sum, a) => sum + Number(a.monto), 0) + saldoPendiente
      if (r.venta) {
        await tx.venta.update({
          where: { id: r.venta.id },
          data: { estado: 'FINALIZADO', montoPagado: totalAbonos },
        })
      } else {
        await tx.venta.create({
          data: {
            reservaId: r.id,
            clienteId,
            tipo: 'RESERVA',
            estado: 'FINALIZADO',
            montoTotal: totalValor,
            montoPagado: totalAbonos,
            fechaVenta: ahora,
            metodoPago: r.abonos[0]?.metodoPago ?? 'EFECTIVO',
          },
        })
      }
    })
    count++
  }

  if (count > 0) console.log(`[Scheduler] ${count} reserva(s) finalizada(s) automáticamente por hora de evento`)
  return count
}

// ─── INICIAR SCHEDULER ───────────────────────────────────────────────────────
export const startScheduler = () => {
  // Ejecutar cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    try {
      await anularReservasVencidas()
      await finalizarReservasPorHoraEvento()
    } catch (err) {
      console.error('[Scheduler] Error en tareas automáticas:', err)
    }
  })

  console.log('[Scheduler] Tareas automáticas iniciadas (cada 5 minutos)')

  // Ejecutar inmediatamente al iniciar
  anularReservasVencidas().catch(console.error)
  finalizarReservasPorHoraEvento().catch(console.error)
}
