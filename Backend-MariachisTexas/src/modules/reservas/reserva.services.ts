import prisma from '../../config/prisma'
import transporter from '../../config/mailer'
import { ReservaCreateSchema, zodError } from '../schemas'

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const toLocalDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const toLocalTime = (d: Date) => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`

// ✅ FIX ZONA HORARIA: parsear fecha como local, no UTC
const parseLocalDate = (dateStr: string): Date => new Date(`${dateStr}T00:00:00`)

const mapEventType = (tipo: string): string => {
  const map: Record<string, string> = {
    'Serenata':'OTRO','Boda':'BODA','Cumpleaños':'CUMPLEANOS','Empresarial':'OTRO',
    'Fúnebre':'FUNERAL','Otro':'OTRO','BODA':'BODA','CUMPLEANOS':'CUMPLEANOS',
    'QUINCEANIOS':'QUINCEANIOS','FUNERAL':'FUNERAL','RECONCILIACION':'RECONCILIACION',
    'DIA_DE_MADRE':'DIA_DE_MADRE','OTRO':'OTRO',
  }
  return map[tipo] ?? 'OTRO'
}

// ✅ Helper para bloquear un rango de horas + buffers usando comparación numérica
const bloquearRango = (
  allHours: string[],
  blocked: Set<string>,
  startTime: string,
  endTime: string
) => {
  const [sh] = startTime.split(':').map(Number)
  const [eh] = endTime.split(':').map(Number)

  // Buffer ANTES
  blocked.add(`${((sh - 1 + 24) % 24).toString().padStart(2,'0')}:00`)

  // Todo el rango de inicio a fin inclusive (comparación numérica)
  allHours.forEach(h => {
    const [hh] = h.split(':').map(Number)
    if (hh >= sh && hh <= eh) blocked.add(h)
  })

  // Buffer DESPUÉS
  blocked.add(`${((eh + 1) % 24).toString().padStart(2,'0')}:00`)
}

const mapToReservation = (r: any) => {
  const cot            = r.cotizacion
  const clientName     = cot?.cliente ? `${cot.cliente.nombre} ${cot.cliente.apellido}`.trim() : cot?.contactoNombre || cot?.nombreHomenajeado || ''
  const clientPhone    = cot?.cliente?.telefonoPrincipal   || cot?.contactoTelefono  || ''
  const secondaryPhone = cot?.cliente?.telefonoAlternativo || cot?.contactoTelefono2 || ''
  const clientEmail    = cot?.cliente?.email               || cot?.contactoEmail     || ''

  return {
    id:             String(r.id),
    cotizacionId:   String(r.cotizacionId),
    clientId:       String(cot?.clienteId ?? ''),
    clientName, clientPhone, secondaryPhone, clientEmail,
    homenajeado:    cot?.nombreHomenajeado ?? '',
    eventType:      cot?.tipoEvento        ?? '',
    eventDate:      cot?.fechaEvento  ? toLocalDate(cot.fechaEvento) : '',
    eventTime:      cot?.horaInicio   ? toLocalTime(cot.horaInicio)  : '',
    startTime:      cot?.horaInicio   ? toLocalTime(cot.horaInicio)  : '',
    endTime:        cot?.horaFin      ? toLocalTime(cot.horaFin)     : '',
    location:       cot?.direccionEvento ?? '',
    address:        cot?.direccionEvento ?? '',
    notes:          cot?.notasAdicionales ?? '',
    repertoireIds:  cot?.repertorios?.map((rep: any) => String(rep.repertorioId)) ?? [],
    selectedServices: cot?.servicios?.map((s: any) => ({ serviceId: String(s.servicioId), quantity: s.cantidad })) ?? [],
    totalAmount:    Number(r.totalValor      ?? 0),
    paidAmount:     Number(r.totalValor ?? 0) - Number(r.saldoPendiente ?? 0),
    pendingBalance: Number(r.saldoPendiente  ?? 0),
    status:         r.estado,
    payments:       r.abonos?.map((a: any) => ({
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
  cotizacion: { include: { cliente: true, servicios: true, repertorios: true } },
  abonos: true,
}

export const getReservas = async (usuarioId?: number) => {
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

// ✅ excludeId — excluye una reserva específica del cálculo (para edición)
export const getAvailableHours = async (dateStr: string, excludeId?: number): Promise<string[]> => {
  const allHours: string[] = []
  for (let i = 8; i <= 23; i++) allHours.push(`${i.toString().padStart(2,'0')}:00`)
  allHours.push('00:00')

  const dayStart = new Date(`${dateStr}T00:00:00`)
  const dayEnd   = new Date(`${dateStr}T23:59:59`)
  const blocked  = new Set<string>()

  // ─── Bloqueos manuales ────────────────────────────────────────────────────
  const bloqueos = await prisma.bloqueoCalendario.findMany({
    where: { fechaInicio: { lte: dayEnd }, fechaFin: { gte: dayStart } }
  })
  for (const b of bloqueos) {
    if (!b.motivo?.startsWith('TIME_RANGE:')) return []
    const start = toLocalTime(b.fechaInicio)
    const end   = toLocalTime(b.fechaFin)
    allHours.forEach(h => { if (h >= start && h < end) blocked.add(h) })
  }

  // ─── Cotizaciones activas ─────────────────────────────────────────────────
  const cotizaciones = await prisma.cotizacion.findMany({
    where: { fechaEvento: { gte: dayStart, lte: dayEnd }, estado: { in: ['EN_ESPERA', 'CONVERTIDA'] } }
  })
  for (const c of cotizaciones) {
    bloquearRango(allHours, blocked, toLocalTime(c.horaInicio), toLocalTime(c.horaFin))
  }

  // ─── Reservas — ✅ excluir la que se está editando ────────────────────────
  const reservas = await prisma.reserva.findMany({
    where: {
      estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
      cotizacion: { fechaEvento: { gte: dayStart, lte: dayEnd } },
      ...(excludeId ? { id: { not: excludeId } } : {}), // ✅ excluir reserva actual
    },
    include: { cotizacion: true }
  })
  for (const r of reservas) {
    bloquearRango(allHours, blocked, toLocalTime(r.cotizacion.horaInicio), toLocalTime(r.cotizacion.horaFin))
  }

  // ─── Ensayos ──────────────────────────────────────────────────────────────
  const ensayos = await prisma.ensayo.findMany({ where: { fechaHora: { gte: dayStart, lte: dayEnd } } })
  for (const e of ensayos) {
    const time = toLocalTime(e.fechaHora)
    const [h]  = time.split(':').map(Number)
    blocked.add(time)
    blocked.add(`${((h - 1 + 24) % 24).toString().padStart(2,'0')}:00`)
    blocked.add(`${((h + 1) % 24).toString().padStart(2,'0')}:00`)
  }

  return allHours.filter(h => !blocked.has(h))
}

export const getReservaById = async (id: number) => {
  const r = await prisma.reserva.findUnique({ where: { id }, include: reservaInclude })
  if (!r) throw new Error('Reserva no encontrada')
  return mapToReservation(r)
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const createReserva = async (data: any) => {
  const parsed = ReservaCreateSchema.safeParse({ ...data, totalAmount: Number(data.totalAmount) })
  if (!parsed.success) throw new Error(zodError(parsed.error))

  const d       = parsed.data
  const usuario = await prisma.usuario.findUnique({ where: { id: Number(d.clienteId) } })
  if (!usuario) throw new Error('Usuario no encontrado')

  const cliente = await prisma.cliente.findUnique({ where: { email: usuario.email } })
  if (!cliente) throw new Error('Cliente no encontrado. Asegúrate de completar tu perfil.')

  // ─── VALIDACIÓN DE SOLAPAMIENTO ───────────────────────────────────────────
  const nuevaInicio  = new Date(`${d.eventDate}T${d.startTime}:00`)
  const nuevaFin     = new Date(`${d.eventDate}T${d.endTime}:00`)
  const bufferInicio = new Date(nuevaInicio.getTime() - 60 * 60 * 1000)
  const bufferFin    = new Date(nuevaFin.getTime()    + 60 * 60 * 1000)

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
  if (reservaSolapada) throw new Error(`Ya existe una reserva en ese horario. Por favor elige otro horario.`)

  const cotizacionSolapada = await prisma.cotizacion.findFirst({
    where: {
      estado:      { in: ['EN_ESPERA', 'CONVERTIDA'] },
      fechaEvento: parseLocalDate(d.eventDate),
      horaInicio:  { lt: bufferFin },
      horaFin:     { gt: bufferInicio },
    }
  })
  if (cotizacionSolapada) throw new Error(`Ya hay una solicitud pendiente en ese horario. Por favor elige otro horario.`)
  // ─────────────────────────────────────────────────────────────────────────

  const horas = await getAvailableHours(d.eventDate)
  if (!horas.includes(d.startTime)) throw new Error(`La hora ${d.startTime} no está disponible`)

  const cot = await prisma.cotizacion.create({
    data: {
      clienteId:         cliente.id,
      nombreHomenajeado: d.homenajeado || 'Sin especificar',
      tipoEvento:        mapEventType(d.eventType ?? 'OTRO') as any,
      fechaEvento:       parseLocalDate(d.eventDate),
      horaInicio:        new Date(`${d.eventDate}T${d.startTime}:00`),
      horaFin:           new Date(`${d.eventDate}T${d.endTime}:00`),
      direccionEvento:   d.location,
      notasAdicionales:  d.notes ?? null,
      totalEstimado:     d.totalAmount,
      esReservaDirecta:  true,
      estado:            'CONVERTIDA',
      contactoNombre: null, contactoTelefono: null,
      contactoTelefono2: null, contactoEmail: null,
    }
  })

  if (d.selectedServices?.length)
    await prisma.cotizacionServicio.createMany({
      data: d.selectedServices.map(s => ({
        cotizacionId: cot.id, servicioId: Number(s.serviceId), cantidad: s.quantity
      }))
    })

  if (d.repertoireIds?.length)
    await prisma.cotizacionRepertorio.createMany({
      data: d.repertoireIds.map((rid, i) => ({
        cotizacionId: cot.id, repertorioId: Number(rid), orden: i
      }))
    })

  const reserva = await prisma.reserva.create({
    data: { cotizacionId: cot.id, totalValor: d.totalAmount, saldoPendiente: d.totalAmount, estado: 'PENDIENTE' }
  })

  // ─── CORREO ───────────────────────────────────────────────────────────────
  const anticipo        = Math.ceil(d.totalAmount / 2)
  const fechaFormateada = parseLocalDate(d.eventDate).toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
  const base     = (process.env.FRONTEND_URL ?? '').replace(/\/$/, '')
  const loginUrl = `${base}/login`

  await transporter.sendMail({
    from:    process.env.MAIL_FROM,
    to:      cliente.email,
    subject: '¡Reserva creada exitosamente! — Mariachis Texas 🎺',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:28px;background:#0a0a0a;color:#fff;border-radius:12px;">
        <div style="text-align:center;margin-bottom:20px;"><h1 style="color:#c0392b;margin:0;">🎺 Mariachis Texas</h1></div>
        <h2 style="color:#fff;">¡Hola ${cliente.nombre}! 🎉</h2>
        <p style="color:#aaa;line-height:1.6;">Tu reserva ha sido creada exitosamente. A continuación los detalles:</p>
        <div style="background:#1a1a1a;border:1px solid #c0392b;border-radius:10px;padding:16px;margin:20px 0;">
          <p style="color:#aaa;margin:0 0 8px;font-size:13px;">📅 Fecha: <strong style="color:#fff">${fechaFormateada}</strong></p>
          <p style="color:#aaa;margin:0 0 8px;font-size:13px;">⏰ Horario: <strong style="color:#fff">${d.startTime} - ${d.endTime}</strong></p>
          <p style="color:#aaa;margin:0 0 8px;font-size:13px;">📍 Lugar: <strong style="color:#fff">${d.location}</strong></p>
          <p style="color:#aaa;margin:0 0 8px;font-size:13px;">🎭 Evento: <strong style="color:#fff">${d.eventType ?? 'Serenata'}</strong></p>
          <p style="color:#aaa;margin:0;font-size:13px;">💰 Valor Total: <strong style="color:#fff">$${Number(d.totalAmount).toLocaleString('es-CO')} COP</strong></p>
        </div>
        <div style="background:#1a1a1a;border:1px solid #27ae60;border-radius:10px;padding:20px;margin:20px 0;text-align:center;">
          <p style="color:#aaa;margin:0 0 8px;font-size:13px;">💳 Para confirmar tu reserva debes pagar el <strong style="color:#fff">50% de anticipo:</strong></p>
          <p style="font-size:32px;font-weight:900;color:#27ae60;margin:12px 0;letter-spacing:2px;">$${anticipo.toLocaleString('es-CO')} COP</p>
          <p style="color:#aaa;margin:0;font-size:12px;">Saldo restante al finalizar el evento: $${(Number(d.totalAmount) - anticipo).toLocaleString('es-CO')} COP</p>
        </div>
        <div style="background:#1a1a1a;border:1px solid #333;border-radius:10px;padding:16px;margin:20px 0;">
          <p style="color:#fff;font-weight:bold;margin:0 0 8px;font-size:14px;">📞 Comunícate con nosotros para realizar el pago:</p>
          <p style="color:#c0392b;font-size:24px;font-weight:900;margin:8px 0;text-align:center;letter-spacing:2px;">312 237 3486</p>
          <p style="color:#aaa;font-size:12px;margin:0;text-align:center;">Aceptamos: Transferencia bancaria, Nequi, Daviplata o Efectivo</p>
        </div>
        <p style="color:#aaa;line-height:1.6;font-size:13px;">
          ⚠️ <strong style="color:#fff">Importante:</strong> Tu reserva quedará en estado
          <strong style="color:#f39c12">Pendiente</strong> hasta que registremos tu pago del anticipo.
          Una vez confirmado el pago pasará a estado <strong style="color:#27ae60">Confirmada</strong>.
        </p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${loginUrl}" style="background:#c0392b;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">Ver mi Reserva →</a>
        </div>
        <hr style="border:none;border-top:1px solid #222;margin:20px 0;" />
        <p style="color:#555;font-size:11px;text-align:center;">Mariachis Texas • Medellín, Colombia</p>
      </div>
    `
  }).catch(err => console.error('Error enviando correo de reserva:', err))

  return getReservaById(reserva.id)
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const updateReserva = async (id: number, data: any) => {
  const r = await prisma.reserva.findUnique({ where: { id }, include: { cotizacion: true } })
  if (!r) throw new Error('Reserva no encontrada')
  if (r.estado === 'ANULADA') throw new Error('No se puede editar una reserva anulada')

  const date       = data.eventDate ?? toLocalDate(r.cotizacion.fechaEvento)
  const horaInicio = data.startTime ? new Date(`${date}T${data.startTime}:00`) : r.cotizacion.horaInicio
  const horaFin    = data.endTime   ? new Date(`${date}T${data.endTime}:00`)   : r.cotizacion.horaFin

  // ─── VALIDACIÓN DE SOLAPAMIENTO ───────────────────────────────────────────
  if (data.startTime || data.endTime || data.eventDate) {
    const bufferInicio = new Date(horaInicio.getTime() - 60 * 60 * 1000)
    const bufferFin    = new Date(horaFin.getTime()    + 60 * 60 * 1000)

    const reservaSolapada = await prisma.reserva.findFirst({
      where: {
        id:     { not: id }, // ✅ excluir la reserva actual
        estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
        cotizacion: {
          fechaEvento: parseLocalDate(date),
          horaInicio:  { lt: bufferFin },
          horaFin:     { gt: bufferInicio },
        }
      }
    })
    if (reservaSolapada) throw new Error(`Ya existe una reserva en ese horario. Por favor elige otro horario.`)
  }
  // ─────────────────────────────────────────────────────────────────────────

  await prisma.cotizacion.update({
    where: { id: r.cotizacionId },
    data: {
      nombreHomenajeado: data.homenajeado || undefined,
      tipoEvento:        data.eventType  ? mapEventType(data.eventType) as any : undefined,
      fechaEvento:       data.eventDate  ? parseLocalDate(data.eventDate) : undefined,
      horaInicio, horaFin,
      direccionEvento:   data.location   || undefined,
      notasAdicionales:  data.notes !== undefined ? (data.notes || null) : undefined,
    }
  })

  if (data.totalAmount !== undefined) {
    const nuevoTotal = Number(data.totalAmount)
    if (!isNaN(nuevoTotal) && nuevoTotal > 0) {
      const pagado     = Number(r.totalValor) - Number(r.saldoPendiente)
      const nuevoSaldo = Math.max(0, nuevoTotal - pagado)
      await prisma.reserva.update({
        where: { id },
        data: { totalValor: nuevoTotal, saldoPendiente: nuevoSaldo }
      })
    }
  }

  if (data.selectedServices) {
    await prisma.cotizacionServicio.deleteMany({ where: { cotizacionId: r.cotizacionId } })
    if (data.selectedServices.length)
      await prisma.cotizacionServicio.createMany({
        data: data.selectedServices.map((s: any) => ({
          cotizacionId: r.cotizacionId, servicioId: Number(s.serviceId), cantidad: s.quantity
        }))
      })
  }

  if (data.repertoireIds) {
    await prisma.cotizacionRepertorio.deleteMany({ where: { cotizacionId: r.cotizacionId } })
    if (data.repertoireIds.length)
      await prisma.cotizacionRepertorio.createMany({
        data: data.repertoireIds.map((rid: string, i: number) => ({
          cotizacionId: r.cotizacionId, repertorioId: Number(rid), orden: i
        }))
      })
  }

  return getReservaById(id)
}

// ─── ANULAR ───────────────────────────────────────────────────────────────────
export const anularReserva = async (id: number, motivo?: string) => {
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

// ─── CONFIRMAR ────────────────────────────────────────────────────────────────
export const confirmarReserva = async (id: number) => {
  const r = await prisma.reserva.findUnique({ where: { id } })
  if (!r) throw new Error('Reserva no encontrada')
  await prisma.reserva.update({ where: { id }, data: { estado: 'CONFIRMADA' } })
  return getReservaById(id)
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const deleteReserva = async (id: number) => {
  const r = await prisma.reserva.findUnique({ where: { id }, include: { abonos: true } })
  if (!r) throw new Error('Reserva no encontrada')
  if (r.estado !== 'ANULADA')  throw new Error('Solo se pueden eliminar reservas anuladas')
  if (r.abonos.length > 0)     throw new Error('No se puede eliminar una reserva con abonos registrados')
  await prisma.reserva.delete({ where: { id } })
  return { message: 'Reserva eliminada correctamente' }
}