import prisma from '../../config/prisma'

// ─── HELPERS TIMEZONE ────────────────────────────────────────────────────────
const toLocalDate = (d: Date): string => {
  if (!d) return ''
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
const toLocalTime = (d: Date): string => {
  if (!d) return ''
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const mapEventType = (tipo: string): string => {
  const map: Record<string, string> = {
    'Serenata':'OTRO','Boda':'BODA','Cumpleaños':'CUMPLEANOS','Empresarial':'OTRO',
    'Fúnebre':'FUNERAL','Otro':'OTRO','BODA':'BODA','CUMPLEANOS':'CUMPLEANOS',
    'QUINCEANIOS':'QUINCEANIOS','FUNERAL':'FUNERAL','RECONCILIACION':'RECONCILIACION',
    'DIA_DE_MADRE':'DIA_DE_MADRE','OTRO':'OTRO',
  }
  return map[tipo] ?? 'OTRO'
}

// ─── MAPEO Prisma → Frontend ──────────────────────────────────────────────────
const mapToReservation = (r: any) => {
  const cot = r.cotizacion

  // ✅ Cliente registrado tiene prioridad, si no usar campos contacto*
  const clientName     = cot?.cliente
    ? `${cot.cliente.nombre} ${cot.cliente.apellido}`.trim()
    : cot?.contactoNombre || cot?.nombreHomenajeado || ''
  const clientPhone    = cot?.cliente?.telefonoPrincipal   || cot?.contactoTelefono  || ''
  const secondaryPhone = cot?.cliente?.telefonoAlternativo || cot?.contactoTelefono2 || ''
  const clientEmail    = cot?.cliente?.email               || cot?.contactoEmail     || ''

  return {
    id:             String(r.id),
    cotizacionId:   String(r.cotizacionId),
    clientId:       String(cot?.clienteId ?? ''),
    clientName,
    clientPhone,
    secondaryPhone,
    clientEmail,
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
    selectedServices: cot?.servicios?.map((s: any) => ({
      serviceId: String(s.servicioId),
      quantity:  s.cantidad
    })) ?? [],
    totalAmount:    Number(r.totalValor      ?? 0),
    paidAmount:     Number(r.totalValor ?? 0) - Number(r.saldoPendiente ?? 0),
    pendingBalance: Number(r.saldoPendiente  ?? 0),
    status:         r.estado,
    payments:       r.abonos?.map((a: any) => ({
      id:     String(a.id),
      amount: Number(a.monto),
      date:   a.fechaPago?.toISOString() ?? '',
      method: a.metodoPago ?? '',
      notes:  a.notas ?? '',
    })) ?? [],
    createdAt: r.createdAt?.toISOString() ?? '',
    updatedAt: r.updatedAt?.toISOString() ?? '',
  }
}

// ─── MAPEO PÚBLICO ────────────────────────────────────────────────────────────
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
    include: { cliente: true, servicios: true, repertorios: true }
  },
  abonos: true,
}

// ─── GET ALL ──────────────────────────────────────────────────────────────────
export const getReservas = async (usuarioId?: number) => {
  let where: any = { estado: { in: ['PENDIENTE', 'CONFIRMADA', 'ANULADA'] } }

  if (usuarioId) {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (usuario) {
      const cliente = await prisma.cliente.findUnique({ where: { email: usuario.email } })
      if (cliente) where = { cotizacion: { clienteId: cliente.id } }
    }
  }

  const reservas = await prisma.reserva.findMany({
    where,
    include: reservaInclude,
    orderBy: { createdAt: 'desc' }
  })
  return reservas.map(mapToReservation)
}

// ─── GET CALENDARIO ───────────────────────────────────────────────────────────
export const getReservasCalendario = async () => {
  const reservas = await prisma.reserva.findMany({
    where: { estado: { in: ['PENDIENTE', 'CONFIRMADA'] as any } },
    include: {
      cotizacion: {
        select: {
          clienteId: true, fechaEvento: true,
          horaInicio: true, horaFin: true, tipoEvento: true,
          cliente: { select: { email: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  return reservas.map(r => ({
    ...mapToPublicReservation(r),
    clientEmail: r.cotizacion?.cliente?.email ?? '',
  }))
}

// ─── GET AVAILABLE HOURS ──────────────────────────────────────────────────────
export const getAvailableHours = async (dateStr: string): Promise<string[]> => {
  const allHours: string[] = []
  for (let i = 8; i <= 23; i++) allHours.push(`${i.toString().padStart(2,'0')}:00`)
  allHours.push('00:00')

  const dayStart = new Date(`${dateStr}T00:00:00`)
  const dayEnd   = new Date(`${dateStr}T23:59:59`)
  const blocked  = new Set<string>()

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
    where: {
      fechaEvento: { gte: dayStart, lte: dayEnd },
      estado: { in: ['EN_ESPERA', 'CONVERTIDA'] }
    }
  })
  for (const c of cotizaciones) {
    const start = toLocalTime(c.horaInicio)
    const end   = toLocalTime(c.horaFin)
    allHours.forEach(h => { if (h >= start && h < end) blocked.add(h) })
    const [sh] = start.split(':').map(Number)
    blocked.add(`${((sh - 1 + 24) % 24).toString().padStart(2,'0')}:00`)
  }

  const reservas = await prisma.reserva.findMany({
    where: {
      estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
      cotizacion: { fechaEvento: { gte: dayStart, lte: dayEnd } }
    },
    include: { cotizacion: true }
  })
  for (const r of reservas) {
    const start = toLocalTime(r.cotizacion.horaInicio)
    const end   = toLocalTime(r.cotizacion.horaFin)
    allHours.forEach(h => { if (h >= start && h < end) blocked.add(h) })
    const [sh] = start.split(':').map(Number)
    blocked.add(`${((sh - 1 + 24) % 24).toString().padStart(2,'0')}:00`)
  }

  const ensayos = await prisma.ensayo.findMany({
    where: { fechaHora: { gte: dayStart, lte: dayEnd } }
  })
  for (const e of ensayos) {
    const time = toLocalTime(e.fechaHora)
    blocked.add(time)
    const [h] = time.split(':').map(Number)
    blocked.add(`${((h + 1) % 24).toString().padStart(2,'0')}:00`)
  }

  return allHours.filter(h => !blocked.has(h))
}

// ─── GET BY ID ────────────────────────────────────────────────────────────────
export const getReservaById = async (id: number) => {
  const r = await prisma.reserva.findUnique({ where: { id }, include: reservaInclude })
  if (!r) throw new Error('Reserva no encontrada')
  return mapToReservation(r)
}

// ─── CREATE (reserva directa desde calendario) ────────────────────────────────
export const createReserva = async (data: any) => {
  if (!data.clienteId)        throw new Error('El cliente es requerido')
  if (!data.eventDate)        throw new Error('La fecha es requerida')
  if (!data.startTime)        throw new Error('La hora de inicio es requerida')
  if (!data.endTime)          throw new Error('La hora de fin es requerida')
  if (!data.location?.trim()) throw new Error('La dirección es requerida')
  if (!data.totalAmount || data.totalAmount <= 0) throw new Error('El valor total es requerido')

  const usuario = await prisma.usuario.findUnique({ where: { id: Number(data.clienteId) } })
  if (!usuario) throw new Error('Usuario no encontrado')

  const cliente = await prisma.cliente.findUnique({ where: { email: usuario.email } })
  if (!cliente) throw new Error('Cliente no encontrado. Asegúrate de completar tu perfil.')

  const horas = await getAvailableHours(data.eventDate)
  if (!horas.includes(data.startTime))
    throw new Error(`La hora ${data.startTime} no está disponible`)

  const fechaEvento = new Date(data.eventDate)
  const horaInicio  = new Date(`${data.eventDate}T${data.startTime}:00`)
  const horaFin     = new Date(`${data.eventDate}T${data.endTime}:00`)

  const cot = await prisma.cotizacion.create({
    data: {
      clienteId:         cliente.id,
      nombreHomenajeado: data.homenajeado || 'Sin especificar',
      tipoEvento:        mapEventType(data.eventType ?? 'OTRO') as any,
      fechaEvento,
      horaInicio,
      horaFin,
      direccionEvento:   data.location,
      notasAdicionales:  data.notes ?? null,
      totalEstimado:     data.totalAmount,
      esReservaDirecta:  true,
      estado:            'CONVERTIDA',
      // Cliente registrado — campos contacto* quedan null
      contactoNombre:    null,
      contactoTelefono:  null,
      contactoTelefono2: null,
      contactoEmail:     null,
    }
  })

  if (data.selectedServices?.length) {
    await prisma.cotizacionServicio.createMany({
      data: data.selectedServices.map((s: any) => ({
        cotizacionId: cot.id, servicioId: Number(s.serviceId), cantidad: s.quantity
      }))
    })
  }
  if (data.repertoireIds?.length) {
    await prisma.cotizacionRepertorio.createMany({
      data: data.repertoireIds.map((rid: string, i: number) => ({
        cotizacionId: cot.id, repertorioId: Number(rid), orden: i
      }))
    })
  }

  const reserva = await prisma.reserva.create({
    data: {
      cotizacionId:   cot.id,
      totalValor:     data.totalAmount,
      saldoPendiente: data.totalAmount,
      estado:         'PENDIENTE',
    }
  })

  return getReservaById(reserva.id)
}

// ─── ANULAR ───────────────────────────────────────────────────────────────────
export const anularReserva = async (id: number, motivo?: string) => {
  const r = await prisma.reserva.findUnique({ where: { id }, include: { cotizacion: true } })
  if (!r) throw new Error('Reserva no encontrada')
  if (r.estado === 'ANULADA') throw new Error('La reserva ya está anulada')

  await prisma.reserva.update({ where: { id }, data: { estado: 'ANULADA' } })
  await prisma.cotizacion.update({
    where: { id: r.cotizacionId },
    data:  {
      estado: 'ANULADA',
      // ✅ Agregar motivo a notas sin tocar campos contacto*
      notasAdicionales: motivo
        ? `${r.cotizacion.notasAdicionales ?? ''} [Anulada: ${motivo}]`.trim()
        : r.cotizacion.notasAdicionales
    }
  })
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
  if (r.estado !== 'ANULADA')
    throw new Error('Solo se pueden eliminar reservas anuladas')
  if (r.abonos.length > 0)
    throw new Error('No se puede eliminar una reserva con abonos registrados')
  await prisma.reserva.delete({ where: { id } })
  return { message: 'Reserva eliminada correctamente' }
}