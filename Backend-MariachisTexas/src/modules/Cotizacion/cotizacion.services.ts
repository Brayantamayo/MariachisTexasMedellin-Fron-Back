import prisma from '../../config/prisma'
import transporter from '../../config/mailer'
import { TipoEvento } from '../../generated/prisma'

// ─── HELPERS TIMEZONE ────────────────────────────────────────────────────────
const buildDateTime = (date: string, time: string) => new Date(`${date}T${time}:00`)

const mapEventType = (tipo: string): TipoEvento => {
  const map: Record<string, TipoEvento> = {
    'Serenata':'OTRO','Boda':'BODA','Cumpleaños':'CUMPLEANOS','Empresarial':'OTRO',
    'Fúnebre':'FUNERAL','Otro':'OTRO','BODA':'BODA','CUMPLEANOS':'CUMPLEANOS',
    'QUINCEANIOS':'QUINCEANIOS','FUNERAL':'FUNERAL','RECONCILIACION':'RECONCILIACION',
    'DIA_DE_MADRE':'DIA_DE_MADRE','OTRO':'OTRO',
  }
  return map[tipo] ?? 'OTRO'
}

// ─── MAPEO Prisma → Frontend ──────────────────────────────────────────────────
const mapToQuotation = (c: any) => {
  // Cliente registrado tiene prioridad, si no usar campos contacto*
  const clientName     = c.clienteId
    ? `${c.cliente?.nombre ?? ''} ${c.cliente?.apellido ?? ''}`.trim()
    : c.contactoNombre || c.nombreHomenajeado || ''
  const clientPhone    = c.cliente?.telefonoPrincipal   || c.contactoTelefono  || ''
  const secondaryPhone = c.cliente?.telefonoAlternativo || c.contactoTelefono2 || ''
  const clientEmail    = c.cliente?.email               || c.contactoEmail     || ''

  return {
    id:                  String(c.id),
    clientId:            c.clienteId ? String(c.clienteId) : undefined,
    clientName,
    clientPhone,
    secondaryPhone,
    clientEmail,
    homenajeado:         c.nombreHomenajeado ?? '',
    eventDate:           c.fechaEvento?.toISOString().split('T')[0]            ?? '',
    eventType:           c.tipoEvento                                           ?? '',
    startTime:           c.horaInicio?.toISOString().split('T')[1]?.slice(0,5) ?? '',
    endTime:             c.horaFin?.toISOString().split('T')[1]?.slice(0,5)    ?? '',
    location:            c.direccionEvento                                      ?? '',
    notes:               c.notasAdicionales ?? '',
    totalAmount:         Number(c.totalEstimado ?? 0),
    isDirectReservation: c.esReservaDirecta,
    status:              c.estado,
    repertoireIds:       c.repertorios?.map((r: any) => String(r.repertorioId)) ?? [],
    selectedServices:    c.servicios?.map((s: any) => ({
      serviceId: String(s.servicioId), quantity: s.cantidad
    })) ?? [],
    repertoireNotes: c.notasAdicionales ?? '',
    createdAt:       c.createdAt?.toISOString() ?? '',
    updatedAt:       c.updatedAt?.toISOString() ?? '',
  }
}

const cotizacionInclude = { cliente: true, servicios: true, repertorios: true, reserva: true }

// ─── VALIDACIONES ─────────────────────────────────────────────────────────────
const validateCotizacion = (data: any) => {
  const errors: string[] = []
  if (!data.clientName?.trim() && !data.clientId) errors.push('El nombre del cliente es requerido')
  if (!data.clientPhone?.trim())                  errors.push('El teléfono es requerido')
  if (!data.clientEmail?.trim())                  errors.push('El correo es requerido')
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.clientEmail)) errors.push('El correo no es válido')
  if (!data.eventDate)                            errors.push('La fecha es requerida')
  else if (new Date(data.eventDate) < new Date(new Date().toDateString())) errors.push('La fecha no puede ser en el pasado')
  if (!data.eventType)        errors.push('El tipo de evento es requerido')
  if (!data.startTime)        errors.push('La hora de inicio es requerida')
  if (!data.endTime)          errors.push('La hora de fin es requerida')
  if (!data.location?.trim()) errors.push('La dirección es requerida')
  if (!data.selectedServices?.length) errors.push('Debes seleccionar al menos un tipo de serenata')
  if (errors.length > 0) throw new Error(errors.join(' | '))
}

// ─── VINCULAR COTIZACIONES AL REGISTRARSE ────────────────────────────────────
// Cuando un cliente externo se registra, vincula sus cotizaciones por email
export const vincularCotizacionesPorEmail = async (email: string, clienteId: number) => {
  const result = await prisma.cotizacion.updateMany({
    where: {
      clienteId:     null,
      contactoEmail: email,
      estado:        { in: ['EN_ESPERA', 'CONVERTIDA'] }
    },
    data: { clienteId }
  })
  return result.count
}

// ─── GET ALL ──────────────────────────────────────────────────────────────────
export const getCotizaciones = async () => {
  const cotizaciones = await prisma.cotizacion.findMany({
    where:   { esReservaDirecta: false },
    include: cotizacionInclude,
    orderBy: { createdAt: 'desc' }
  })
  return cotizaciones.map(mapToQuotation)
}

// ─── GET BY ID ────────────────────────────────────────────────────────────────
export const getCotizacionById = async (id: number) => {
  const c = await prisma.cotizacion.findUnique({ where: { id }, include: cotizacionInclude })
  if (!c) throw new Error('Cotización no encontrada')
  return mapToQuotation(c)
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const createCotizacion = async (data: any) => {
  validateCotizacion(data)

  const horaInicio = buildDateTime(data.eventDate, data.startTime)
  const horaFin    = buildDateTime(data.eventDate, data.endTime)

  // Validar bloqueos de calendario
  const bloqueo = await prisma.bloqueoCalendario.findFirst({
    where: { fechaInicio: { lte: horaFin }, fechaFin: { gte: horaInicio } }
  })
  if (bloqueo) throw new Error(`Fecha bloqueada: ${bloqueo.motivo || 'No disponible'}`)

  // Validar conflicto de horario
  const cotActivas = await prisma.cotizacion.findMany({
    where: {
      fechaEvento: {
        gte: new Date(data.eventDate),
        lt:  new Date(new Date(data.eventDate).getTime() + 86400000)
      },
      estado: { in: ['EN_ESPERA', 'CONVERTIDA'] }
    }
  })
  for (const cot of cotActivas) {
    if (horaInicio < cot.horaFin && horaFin > cot.horaInicio)
      throw new Error(
        `Conflicto de horario: ya hay un evento de ` +
        `${cot.horaInicio.toISOString().split('T')[1].slice(0,5)} a ` +
        `${cot.horaFin.toISOString().split('T')[1].slice(0,5)}`
      )
  }

  const cot = await prisma.cotizacion.create({
    data: {
      clienteId:         data.clientId ? Number(data.clientId) : null,
      nombreHomenajeado: data.homenajeado || data.clientName || 'Sin especificar',
      tipoEvento:        mapEventType(data.eventType),
      fechaEvento:       new Date(data.eventDate),
      horaInicio,
      horaFin,
      direccionEvento:   data.location,
      notasAdicionales:  data.notes || data.repertoireNotes || null,
      totalEstimado:     data.totalAmount || 0,
      esReservaDirecta:  false,
      estado:            'EN_ESPERA',
      // ✅ Campos limpios para cliente externo
      contactoNombre:    data.clientId ? null : (data.clientName   || null),
      contactoTelefono:  data.clientId ? null : (data.clientPhone  || null),
      contactoTelefono2: data.clientId ? null : (data.secondaryPhone || null),
      contactoEmail:     data.clientId ? null : (data.clientEmail  || null),
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
      data: data.repertoireIds.map((id: string, i: number) => ({
        cotizacionId: cot.id, repertorioId: Number(id), orden: i
      }))
    })
  }

  return getCotizacionById(cot.id)
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const updateCotizacion = async (id: number, data: any) => {
  const exists = await prisma.cotizacion.findUnique({ where: { id } })
  if (!exists) throw new Error('Cotización no encontrada')
  if (exists.estado !== 'EN_ESPERA') throw new Error('Solo se pueden editar cotizaciones en estado En Espera')

  const date       = data.eventDate ?? exists.fechaEvento.toISOString().split('T')[0]
  const horaInicio = data.startTime ? buildDateTime(date, data.startTime) : exists.horaInicio
  const horaFin    = data.endTime   ? buildDateTime(date, data.endTime)   : exists.horaFin

  await prisma.cotizacion.update({
    where: { id },
    data: {
      clienteId:         data.clientId ? Number(data.clientId) : undefined,
      nombreHomenajeado: data.homenajeado || data.clientName   || undefined,
      tipoEvento:        data.eventType  ? mapEventType(data.eventType) : undefined,
      fechaEvento:       data.eventDate  ? new Date(data.eventDate)     : undefined,
      horaInicio,
      horaFin,
      direccionEvento:   data.location   || undefined,
      // ✅ Notas simples — sin reconstruir nada
      notasAdicionales:  data.notes !== undefined ? (data.notes || null) : undefined,
      totalEstimado:     data.totalAmount !== undefined ? data.totalAmount : undefined,
      // ✅ Actualizar campos de contacto si vienen
      contactoNombre:    data.clientName    !== undefined ? (data.clientName    || null) : undefined,
      contactoTelefono:  data.clientPhone   !== undefined ? (data.clientPhone   || null) : undefined,
      contactoTelefono2: data.secondaryPhone !== undefined ? (data.secondaryPhone || null) : undefined,
      contactoEmail:     data.clientEmail   !== undefined ? (data.clientEmail   || null) : undefined,
    }
  })

  if (data.selectedServices) {
    await prisma.cotizacionServicio.deleteMany({ where: { cotizacionId: id } })
    if (data.selectedServices.length)
      await prisma.cotizacionServicio.createMany({
        data: data.selectedServices.map((s: any) => ({
          cotizacionId: id, servicioId: Number(s.serviceId), cantidad: s.quantity
        }))
      })
  }
  if (data.repertoireIds) {
    await prisma.cotizacionRepertorio.deleteMany({ where: { cotizacionId: id } })
    if (data.repertoireIds.length)
      await prisma.cotizacionRepertorio.createMany({
        data: data.repertoireIds.map((rid: string, i: number) => ({
          cotizacionId: id, repertorioId: Number(rid), orden: i
        }))
      })
  }

  return getCotizacionById(id)
}

// ─── ANULAR ───────────────────────────────────────────────────────────────────
export const anularCotizacion = async (id: number) => {
  const exists = await prisma.cotizacion.findUnique({ where: { id } })
  if (!exists) throw new Error('Cotización no encontrada')
  if (exists.estado === 'ANULADA')    throw new Error('La cotización ya está anulada')
  if (exists.estado === 'CONVERTIDA') throw new Error('No se puede anular una cotización ya convertida')
  await prisma.cotizacion.update({ where: { id }, data: { estado: 'ANULADA' } })
  return getCotizacionById(id)
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const deleteCotizacion = async (id: number) => {
  const exists = await prisma.cotizacion.findUnique({ where: { id } })
  if (!exists) throw new Error('Cotización no encontrada')
  if (exists.estado !== 'ANULADA')
    throw new Error('Solo se pueden eliminar cotizaciones anuladas')
  await prisma.cotizacion.delete({ where: { id } })
  return { message: 'Cotización eliminada correctamente' }
}

// ─── CONVERTIR A RESERVA ─────────────────────────────────────────────────────
export const convertirCotizacion = async (id: number) => {
  const cotizacion = await prisma.cotizacion.findUnique({
    where: { id }, include: cotizacionInclude
  })
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

  // ✅ Leer datos de contacto desde campos limpios
  const emailDestino  = cotizacion.cliente?.email    || cotizacion.contactoEmail    || ''
  const nombreCliente = cotizacion.cliente?.nombre   || cotizacion.contactoNombre   || 'Cliente'
  const telefono      = cotizacion.cliente?.telefonoPrincipal   || cotizacion.contactoTelefono  || ''
  const telefono2     = cotizacion.cliente?.telefonoAlternativo || cotizacion.contactoTelefono2 || ''

  if (emailDestino) {
    const params = new URLSearchParams({ email: emailDestino, nombre: nombreCliente, telefono, telefono2 })
    const base        = (process.env.FRONTEND_URL ?? '').replace(/\/$/, '')
    const registerUrl = `${base}/registro?${params.toString()}`
    const loginUrl    = `${base}/login`

    await transporter.sendMail({
      from:    process.env.MAIL_FROM,
      to:      emailDestino,
      subject: '¡Tu cotización fue aprobada! — Mariachis Texas 🎺',
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:28px;background:#0a0a0a;color:#fff;border-radius:12px;">
          <div style="text-align:center;margin-bottom:20px;">
            <h1 style="color:#c0392b;margin:0;">🎺 Mariachis Texas</h1>
          </div>
          <h2 style="color:#fff;">¡Buenas noticias, ${nombreCliente}! 🎉</h2>
          <p style="color:#aaa;line-height:1.6;">
            Tu cotización ha sido <strong style="color:#fff">aprobada</strong> y convertida en una reserva oficial.
          </p>
          <div style="background:#1a1a1a;border:1px solid #c0392b;border-radius:10px;padding:16px;margin:20px 0;">
            <p style="color:#aaa;margin:0 0 6px;font-size:13px;">📅 Fecha: <strong style="color:#fff">${cotizacion.fechaEvento.toLocaleDateString('es-CO')}</strong></p>
            <p style="color:#aaa;margin:0 0 6px;font-size:13px;">⏰ Horario: <strong style="color:#fff">${cotizacion.horaInicio.toISOString().split('T')[1].slice(0,5)} - ${cotizacion.horaFin.toISOString().split('T')[1].slice(0,5)}</strong></p>
            <p style="color:#aaa;margin:0;font-size:13px;">💰 Valor: <strong style="color:#fff">$${Number(cotizacion.totalEstimado).toLocaleString('es-CO')} COP</strong></p>
          </div>
          <p style="color:#aaa;line-height:1.6;">Para ver tu reserva y hacer seguimiento, crea tu cuenta con este mismo correo:</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${registerUrl}" style="background:#c0392b;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">
              Crear mi cuenta →
            </a>
          </div>
          <p style="color:#555;font-size:12px;text-align:center;">
            ¿Ya tienes cuenta? <a href="${loginUrl}" style="color:#c0392b;">Inicia sesión aquí</a>
          </p>
          <hr style="border:none;border-top:1px solid #222;margin:20px 0;" />
          <p style="color:#555;font-size:11px;text-align:center;">Mariachis Texas • Medellín, Colombia</p>
        </div>
      `
    }).catch(err => console.error('Error enviando correo:', err))
  }

  return {
    quotation:     await getCotizacionById(id),
    reservationId: String(reserva.id)
  }
}