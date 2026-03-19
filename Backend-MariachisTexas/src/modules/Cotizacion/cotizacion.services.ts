import prisma from '../../config/prisma'
import transporter from '../../config/mailer'
import { TipoEvento } from '../../generated/prisma'
import { CotizacionCreateSchema, CotizacionUpdateSchema, zodError } from '../schemas'

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const parseLocalDate = (dateStr: string): Date => new Date(`${dateStr}T00:00:00`)
const buildDateTime  = (date: string, time: string) => new Date(`${date}T${time}:00`)

const toLocalDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const toLocalTime = (d: Date) => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`

const mapEventType = (tipo: string): TipoEvento => {
  const map: Record<string, TipoEvento> = {
    'Serenata':'OTRO','Boda':'BODA','Cumpleaños':'CUMPLEANOS','Empresarial':'OTRO',
    'Fúnebre':'FUNERAL','Otro':'OTRO','BODA':'BODA','CUMPLEANOS':'CUMPLEANOS',
    'QUINCEANIOS':'QUINCEANIOS','FUNERAL':'FUNERAL','RECONCILIACION':'RECONCILIACION',
    'DIA_DE_MADRE':'DIA_DE_MADRE','OTRO':'OTRO',
  }
  return map[tipo] ?? 'OTRO'
}

const mapToQuotation = (c: any) => {
  const clientName     = c.clienteId ? `${c.cliente?.nombre ?? ''} ${c.cliente?.apellido ?? ''}`.trim() : c.contactoNombre || c.nombreHomenajeado || ''
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

const cotizacionInclude = { cliente: true, servicios: true, repertorios: true, reserva: true }

// ─── VALIDACIÓN COMPLETA DE DISPONIBILIDAD ────────────────────────────────────
// Valida contra: cotizaciones, reservas, ensayos y bloqueos
const validarDisponibilidad = async (
  eventDate: string,
  horaInicio: Date,
  horaFin: Date,
  excludeCotizacionId?: number
) => {
  const dayStart = parseLocalDate(eventDate)
  const dayEnd   = new Date(`${eventDate}T23:59:59`)

  // 1. Bloqueos manuales
  const bloqueo = await prisma.bloqueoCalendario.findFirst({
    where: { fechaInicio: { lte: horaFin }, fechaFin: { gte: horaInicio } }
  })
  if (bloqueo) throw new Error(`Fecha bloqueada: ${bloqueo.motivo?.replace(/^[A-Z_]+:/, '').split('|')[0] || 'No disponible'}`)

  // 2. Otras cotizaciones activas que se solapen
  const cotActivas = await prisma.cotizacion.findMany({
    where: {
      fechaEvento: { gte: dayStart, lte: dayEnd },
      estado: { in: ['EN_ESPERA', 'CONVERTIDA'] },
      ...(excludeCotizacionId ? { id: { not: excludeCotizacionId } } : {})
    }
  })
  for (const cot of cotActivas) {
    if (horaInicio < cot.horaFin && horaFin > cot.horaInicio)
      throw new Error(
        `Conflicto con cotización existente (${toLocalTime(cot.horaInicio)} - ${toLocalTime(cot.horaFin)})`
      )
  }

  // ✅ 3. Reservas activas que se solapen (con buffer de 1 hora)
  const bufferInicio = new Date(horaInicio.getTime() - 60 * 60 * 1000)
  const bufferFin    = new Date(horaFin.getTime()    + 60 * 60 * 1000)

  const reservaSolapada = await prisma.reserva.findFirst({
    where: {
      estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
      cotizacion: {
        fechaEvento: parseLocalDate(eventDate),
        horaInicio:  { lt: bufferFin },
        horaFin:     { gt: bufferInicio },
      }
    }
  })
  if (reservaSolapada) throw new Error(`Conflicto con una reserva existente en ese horario.`)

  // ✅ 4. Ensayos programados que se solapen
  const ensayos = await prisma.ensayo.findMany({
    where: { fechaHora: { gte: dayStart, lte: dayEnd } }
  })
  for (const e of ensayos) {
    const ensayoTime = e.fechaHora
    const ensayoBefore = new Date(ensayoTime.getTime() - 60 * 60 * 1000)
    const ensayoAfter  = new Date(ensayoTime.getTime() + 60 * 60 * 1000)
    if (horaInicio < ensayoAfter && horaFin > ensayoBefore) {
      throw new Error(
        `Conflicto con ensayo programado a las ${toLocalTime(ensayoTime)}`
      )
    }
  }
}

// ─── VINCULAR ─────────────────────────────────────────────────────────────────
export const vincularCotizacionesPorEmail = async (email: string, clienteId: number) => {
  const result = await prisma.cotizacion.updateMany({
    where: { clienteId: null, contactoEmail: email, estado: { in: ['EN_ESPERA', 'CONVERTIDA'] } },
    data:  { clienteId }
  })
  return result.count
}

// ─── GET ALL / GET BY ID ──────────────────────────────────────────────────────
export const getCotizaciones = async () => {
  const cotizaciones = await prisma.cotizacion.findMany({
    where: { esReservaDirecta: false }, include: cotizacionInclude, orderBy: { createdAt: 'desc' }
  })
  return cotizaciones.map(mapToQuotation)
}

export const getCotizacionById = async (id: number) => {
  const c = await prisma.cotizacion.findUnique({ where: { id }, include: cotizacionInclude })
  if (!c) throw new Error('Cotización no encontrada')
  return mapToQuotation(c)
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const createCotizacion = async (data: any) => {
  const parsed = CotizacionCreateSchema.safeParse({
    ...data,
    totalAmount: Number(data.totalAmount) || 0
  })
  if (!parsed.success) throw new Error(zodError(parsed.error))

  const d          = parsed.data
  const horaInicio = buildDateTime(d.eventDate, d.startTime)
  const horaFin    = buildDateTime(d.eventDate, d.endTime)

  // ✅ Validación completa: cotizaciones + reservas + ensayos + bloqueos
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
      contactoNombre:    d.clientId ? null : (d.clientName    || null),
      contactoTelefono:  d.clientId ? null : (d.clientPhone   || null),
      contactoTelefono2: d.clientId ? null : (d.secondaryPhone || null),
      contactoEmail:     d.clientId ? null : (d.clientEmail   || null),
    }
  })

  if (d.selectedServices?.length)
    await prisma.cotizacionServicio.createMany({
      data: d.selectedServices.map(s => ({ cotizacionId: cot.id, servicioId: Number(s.serviceId), cantidad: s.quantity }))
    })

  if (d.repertoireIds?.length)
    await prisma.cotizacionRepertorio.createMany({
      data: d.repertoireIds.map((id, i) => ({ cotizacionId: cot.id, repertorioId: Number(id), orden: i }))
    })

  return getCotizacionById(cot.id)
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const updateCotizacion = async (id: number, data: any) => {
  const exists = await prisma.cotizacion.findUnique({ where: { id } })
  if (!exists) throw new Error('Cotización no encontrada')
  if (exists.estado !== 'EN_ESPERA') throw new Error('Solo se pueden editar cotizaciones en estado En Espera')

  const parsed = CotizacionUpdateSchema.safeParse(data)
  if (!parsed.success) throw new Error(zodError(parsed.error))

  const d          = parsed.data
  const date       = d.eventDate ?? toLocalDate(exists.fechaEvento)
  const horaInicio = d.startTime ? buildDateTime(date, d.startTime) : exists.horaInicio
  const horaFin    = d.endTime   ? buildDateTime(date, d.endTime)   : exists.horaFin

  // ✅ Validar disponibilidad al editar, excluyendo la cotización actual
  if (d.startTime || d.endTime || d.eventDate) {
    await validarDisponibilidad(date, horaInicio, horaFin, id)
  }

  await prisma.cotizacion.update({
    where: { id },
    data: {
      clienteId:         d.clientId ? Number(d.clientId) : undefined,
      nombreHomenajeado: d.homenajeado || d.clientName   || undefined,
      tipoEvento:        d.eventType  ? mapEventType(d.eventType) : undefined,
      fechaEvento:       d.eventDate  ? parseLocalDate(d.eventDate) : undefined,
      horaInicio, horaFin,
      direccionEvento:   d.location   || undefined,
      notasAdicionales:  d.notes !== undefined ? (d.notes || null) : undefined,
      totalEstimado:     d.totalAmount !== undefined ? d.totalAmount : undefined,
      contactoNombre:    d.clientName     !== undefined ? (d.clientName     || null) : undefined,
      contactoTelefono:  d.clientPhone    !== undefined ? (d.clientPhone    || null) : undefined,
      contactoTelefono2: d.secondaryPhone !== undefined ? (d.secondaryPhone || null) : undefined,
      contactoEmail:     d.clientEmail    !== undefined ? (d.clientEmail    || null) : undefined,
    }
  })

  if (d.selectedServices) {
    await prisma.cotizacionServicio.deleteMany({ where: { cotizacionId: id } })
    if (d.selectedServices.length)
      await prisma.cotizacionServicio.createMany({
        data: d.selectedServices.map(s => ({ cotizacionId: id, servicioId: Number(s.serviceId), cantidad: s.quantity }))
      })
  }
  if (d.repertoireIds) {
    await prisma.cotizacionRepertorio.deleteMany({ where: { cotizacionId: id } })
    if (d.repertoireIds.length)
      await prisma.cotizacionRepertorio.createMany({
        data: d.repertoireIds.map((rid, i) => ({ cotizacionId: id, repertorioId: Number(rid), orden: i }))
      })
  }

  return getCotizacionById(id)
}

// ─── ANULAR / DELETE ──────────────────────────────────────────────────────────
export const anularCotizacion = async (id: number) => {
  const exists = await prisma.cotizacion.findUnique({ where: { id } })
  if (!exists) throw new Error('Cotización no encontrada')
  if (exists.estado === 'ANULADA')    throw new Error('La cotización ya está anulada')
  if (exists.estado === 'CONVERTIDA') throw new Error('No se puede anular una cotización ya convertida')
  await prisma.cotizacion.update({ where: { id }, data: { estado: 'ANULADA' } })
  return getCotizacionById(id)
}

export const deleteCotizacion = async (id: number) => {
  const exists = await prisma.cotizacion.findUnique({ where: { id } })
  if (!exists) throw new Error('Cotización no encontrada')
  if (exists.estado !== 'ANULADA') throw new Error('Solo se pueden eliminar cotizaciones anuladas')
  await prisma.cotizacion.delete({ where: { id } })
  return { message: 'Cotización eliminada correctamente' }
}

// ─── CONVERTIR ────────────────────────────────────────────────────────────────
export const convertirCotizacion = async (id: number) => {
  const cotizacion = await prisma.cotizacion.findUnique({ where: { id }, include: cotizacionInclude })
  if (!cotizacion) throw new Error('Cotización no encontrada')
  if (cotizacion.estado !== 'EN_ESPERA') throw new Error('Solo se pueden convertir cotizaciones En Espera')
  if (!cotizacion.totalEstimado || Number(cotizacion.totalEstimado) === 0)
    throw new Error('La cotización debe tener un valor estimado para convertirse')

  await prisma.cotizacion.update({ where: { id }, data: { estado: 'CONVERTIDA' } })
  const reserva = await prisma.reserva.create({
    data: {
      cotizacionId:   id,
      totalValor:     cotizacion.totalEstimado!,
      saldoPendiente: cotizacion.totalEstimado!,
      estado:         'PENDIENTE'
    }
  })

  const emailDestino  = cotizacion.cliente?.email          || cotizacion.contactoEmail    || ''
  const nombreCliente = cotizacion.cliente?.nombre         || cotizacion.contactoNombre   || 'Cliente'
  const telefono      = cotizacion.cliente?.telefonoPrincipal   || cotizacion.contactoTelefono  || ''
  const telefono2     = cotizacion.cliente?.telefonoAlternativo || cotizacion.contactoTelefono2 || ''

  if (emailDestino) {
    const params      = new URLSearchParams({ email: emailDestino, nombre: nombreCliente, telefono, telefono2 })
    const base        = (process.env.FRONTEND_URL ?? '').replace(/\/$/, '')
    const registerUrl = `${base}/registro?${params.toString()}`
    const loginUrl    = `${base}/login`

    const horaInicioStr = toLocalTime(cotizacion.horaInicio)
    const horaFinStr    = toLocalTime(cotizacion.horaFin)
    const fechaStr      = cotizacion.fechaEvento.toLocaleDateString('es-CO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })

    await transporter.sendMail({
      from:    process.env.MAIL_FROM,
      to:      emailDestino,
      subject: '¡Tu cotización fue aprobada! — Mariachis Texas 🎺',
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:28px;background:#0a0a0a;color:#fff;border-radius:12px;">
          <div style="text-align:center;margin-bottom:20px;"><h1 style="color:#c0392b;margin:0;">🎺 Mariachis Texas</h1></div>
          <h2 style="color:#fff;">¡Buenas noticias, ${nombreCliente}! 🎉</h2>
          <p style="color:#aaa;line-height:1.6;">Tu cotización ha sido <strong style="color:#fff">aprobada</strong> y convertida en una reserva oficial.</p>
          <div style="background:#1a1a1a;border:1px solid #c0392b;border-radius:10px;padding:16px;margin:20px 0;">
            <p style="color:#aaa;margin:0 0 6px;font-size:13px;">📅 Fecha: <strong style="color:#fff">${fechaStr}</strong></p>
            <p style="color:#aaa;margin:0 0 6px;font-size:13px;">⏰ Horario: <strong style="color:#fff">${horaInicioStr} - ${horaFinStr}</strong></p>
            <p style="color:#aaa;margin:0;font-size:13px;">💰 Valor: <strong style="color:#fff">$${Number(cotizacion.totalEstimado).toLocaleString('es-CO')} COP</strong></p>
          </div>
          <p style="color:#aaa;line-height:1.6;">Para ver tu reserva y hacer seguimiento, crea tu cuenta con este mismo correo:</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${registerUrl}" style="background:#c0392b;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">Crear mi cuenta →</a>
          </div>
          <p style="color:#555;font-size:12px;text-align:center;">¿Ya tienes cuenta? <a href="${loginUrl}" style="color:#c0392b;">Inicia sesión aquí</a></p>
          <hr style="border:none;border-top:1px solid #222;margin:20px 0;" />
          <p style="color:#555;font-size:11px;text-align:center;">Mariachis Texas • Medellín, Colombia</p>
        </div>
      `
    }).catch(err => console.error('Error enviando correo:', err))
  }

  return { quotation: await getCotizacionById(id), reservationId: String(reserva.id) }
}