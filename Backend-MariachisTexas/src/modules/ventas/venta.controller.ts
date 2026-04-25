import { Request, Response } from 'express'
import * as ventaService from './venta.services'
import { VentaError } from './venta.services'
import { AuthRequest } from '../../middlewares/Auth.middleware'
import { asyncHandler } from '../../middlewares/Asynchandler'
import PDFDocument from 'pdfkit'
import prisma from '../../config/prisma'
import { toLocalDate, toLocalTime, buildClientName } from '../../utils/date.helpers'

const ROLES_ADMIN = ['ADMIN', 'EMPLEADO'] as const

// ─── HELPER: Manejo centralizado de errores ───────────────────────────────────

const handleServiceError = (err: unknown, res: Response, contextMsg = 'Error interno del servidor'): Response => {
  if (err instanceof VentaError) {
    return res.status(err.status).json({
      ok:      false,
      code:    err.code,
      message: err.message,
    })
  }
  console.error('[VentaController]', err)
  return res.status(500).json({
    ok:      false,
    code:    'ERROR_INTERNO',
    message: contextMsg,
  })
}

// ─── GET ALL ──────────────────────────────────────────────────────────────────
export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const rol = req.user?.rol
    if (rol && (ROLES_ADMIN as readonly string[]).includes(rol)) {
      const ventas = await ventaService.getVentas()
      return res.json({ ok: true, data: ventas, total: ventas.length })
    }
    const usuarioId = req.user?.id ? Number(req.user.id) : undefined
    const ventas    = await ventaService.getVentas(usuarioId)
    return res.json({ ok: true, data: ventas, total: ventas.length })
  } catch (err) {
    console.error('[VentaController] ERROR COMPLETO:', err)
    console.error('[VentaController] STACK:', (err as Error).stack)
    return handleServiceError(err, res, 'Error al obtener las ventas')
  }
})

// ─── GET BY ID ────────────────────────────────────────────────────────────────
export const getById = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const rawId  = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const id     = Number(rawId)

    if (isNaN(id) || id <= 0)
      return res.status(400).json({ ok: false, code: 'ID_INVALIDO', message: 'El ID debe ser un número positivo' })

    const ventas = await ventaService.getVentas()
    const venta  = ventas.find(v => v.id === String(id) || v.id === `RES-${id}`)

    if (!venta)
      return res.status(404).json({ ok: false, code: 'VENTA_NO_ENCONTRADA', message: `Venta con ID ${id} no encontrada` })

    if (req.user?.rol === 'CLIENTE' && venta.clientId !== req.user.id)
      return res.status(403).json({ ok: false, code: 'SIN_PERMISO', message: 'No tienes permiso para ver esta venta' })

    return res.json({ ok: true, data: venta })
  } catch (err) {
    return handleServiceError(err, res, 'Error al obtener la venta')
  }
})

// ─── GET PAYABLE RESERVATIONS ─────────────────────────────────────────────────
export const getPayableReservations = asyncHandler(async (_req: Request, res: Response) => {
  try {
    const reservas = await ventaService.getPayableReservations()
    return res.json({ ok: true, data: reservas, total: reservas.length })
  } catch (err) {
    return handleServiceError(err, res, 'Error al obtener reservas pagables')
  }
})

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
      
    const { reservaId, clienteId, tipo, estado, montoTotal, montoPagado, fechaVenta, metodoPago } = req.body

    // Validaciones de campos requeridos
    const camposFaltantes: string[] = []
    if (clienteId  === undefined || clienteId  === null) camposFaltantes.push('clienteId')
    if (!tipo)       camposFaltantes.push('tipo')
    if (!montoTotal) camposFaltantes.push('montoTotal')
    if (montoPagado === undefined || montoPagado === null) camposFaltantes.push('montoPagado')
    if (!fechaVenta) camposFaltantes.push('fechaVenta')
    if (!metodoPago) camposFaltantes.push('metodoPago')

    if (camposFaltantes.length > 0) {
      return res.status(400).json({
        ok:      false,
        code:    'CAMPOS_REQUERIDOS',
        message: `Faltan campos obligatorios: ${camposFaltantes.join(', ')}`,
        campos:  camposFaltantes,
      })
    }

    const venta = await ventaService.createVenta(req.body)
    return res.status(201).json({
      ok:      true,
      message: 'Venta registrada correctamente',
      data:    venta,
    })
  } catch (err) {
    return handleServiceError(err, res, 'Error al crear la venta')
  }
})

// ─── ADD ABONO FINAL ──────────────────────────────────────────────────────────
export const addFinalAbono = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const rawId     = Array.isArray(req.params.reservaId) ? req.params.reservaId[0] : req.params.reservaId
    const reservaId = Number(rawId)

    if (isNaN(reservaId) || reservaId <= 0 || !Number.isInteger(reservaId))
      return res.status(400).json({ ok: false, code: 'ID_INVALIDO', message: 'El ID de reserva debe ser un número entero positivo' })

    const { amount, date, method, notes } = req.body

    // Validar campos requeridos
    const camposFaltantes: string[] = []
    if (amount === undefined || amount === null) camposFaltantes.push('amount')
    if (!date)   camposFaltantes.push('date')
    if (!method) camposFaltantes.push('method')

    if (camposFaltantes.length > 0) {
      return res.status(400).json({
        ok:      false,
        code:    'CAMPOS_REQUERIDOS',
        message: `Faltan campos obligatorios: ${camposFaltantes.join(', ')}`,
        campos:  camposFaltantes,
      })
    }

    const resultado = await ventaService.addAbonoFromVentas(reservaId, {
      amount: Number(amount),
      date,
      method,
      notes,
    })

    return res.status(201).json({ ok: true, ...resultado })
  } catch (err) {
    return handleServiceError(err, res, 'Error al registrar el abono final')
  }
})


// ─── DOWNLOAD PDF (reserva individual) ───────────────────────────────────────
export const downloadReservaPdf = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const rawId     = Array.isArray(req.params.reservaId) ? req.params.reservaId[0] : req.params.reservaId
    const reservaId = Number(rawId)

    if (isNaN(reservaId) || reservaId <= 0)
      return res.status(400).json({ ok: false, code: 'ID_INVALIDO', message: 'El ID de reserva es inválido' })

    const reserva = await prisma.reserva.findUnique({
      where:   { id: reservaId },
      include: {
        abonos:     true,
        cotizacion: {
          include: {
            cliente:     { include: { usuario: true } },
            servicios:   { include: { servicio: true } },
            repertorios: { include: { repertorio: true } },
          },
        },
      },
    })

    if (!reserva)
      return res.status(404).json({ ok: false, code: 'RESERVA_NO_ENCONTRADA', message: `Reserva #${reservaId} no encontrada` })

    // Si el usuario es cliente, verificar que la reserva le pertenece
    if (req.user?.rol === 'CLIENTE') {
      const clienteDeReserva = reserva.cotizacion?.clienteId
      const usuarioCliente   = await prisma.cliente.findFirst({ where: { usuarioId: Number(req.user.id) } })
      if (!usuarioCliente || clienteDeReserva !== usuarioCliente.id) {
        return res.status(403).json({ ok: false, code: 'SIN_PERMISO', message: 'No tienes permiso para descargar este PDF' })
      }
    }

    const cot           = reserva.cotizacion
    const cliente       = cot?.cliente
    const nombreCliente = cliente
      ? buildClientName(cliente.usuario?.nombre, cliente.apellido)
      : 'Cliente'

    const totalValor  = Number(reserva.totalValor)
    const pagado      = totalValor - Number(reserva.saldoPendiente)
    const isPagado    = Number(reserva.saldoPendiente) <= 0.01
    const fechaEvento = cot?.fechaEvento
      ? new Date(cot.fechaEvento).toLocaleDateString('es-CO', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })
      : ''

    const doc = new PDFDocument({ margin: 50 })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="Reserva-${reservaId}-MariachisTexas.pdf"`)
    doc.pipe(res)

    // Título
    doc.fontSize(20).font('Helvetica-Bold').text('MARIACHIS TEXAS', { align: 'center' })
    doc.fontSize(10).font('Helvetica').text('Medellín, Antioquia, Colombia', { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(16).font('Helvetica-Bold').text(`Comprobante de Reserva #${reservaId}`, { align: 'center' })
    doc.moveDown()
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
    doc.moveDown()

    // Estado
    doc.fontSize(12).font('Helvetica-Bold')
      .fillColor(isPagado ? '#16a34a' : '#1d4ed8')
      .text(`Estado: ${isPagado ? 'FINALIZADO - PAGADO COMPLETAMENTE' : 'CONFIRMADO - ANTICIPO PAGADO'}`)
      .fillColor('black')
    doc.moveDown()

    // Información del cliente
    doc.fontSize(13).font('Helvetica-Bold').text('Información del Cliente')
    doc.fontSize(11).font('Helvetica')
    doc.text(`Nombre: ${nombreCliente}`)
    if (cliente?.email)              doc.text(`Email: ${cliente.email}`)
    if (cliente?.telefonoPrincipal)  doc.text(`Teléfono: ${cliente.telefonoPrincipal}`)
    doc.moveDown()

    // Detalles del evento
    doc.fontSize(13).font('Helvetica-Bold').text('Detalles del Evento')
    doc.fontSize(11).font('Helvetica')
    if (fechaEvento)           doc.text(`Fecha: ${fechaEvento}`)
    if (cot?.horaInicio)       doc.text(`Horario: ${toLocalTime(cot.horaInicio)} - ${toLocalTime(cot.horaFin)}`)
    if (cot?.tipoEvento)       doc.text(`Tipo: ${cot.tipoEvento}`)
    if (cot?.direccionEvento)  doc.text(`Lugar: ${cot.direccionEvento}`)
    doc.moveDown()

    // Resumen financiero
    doc.fontSize(13).font('Helvetica-Bold').text('Resumen Financiero')
    doc.fontSize(11).font('Helvetica')
    doc.text(`Total del Servicio: $${totalValor.toLocaleString('es-CO')} COP`)
    doc.text(`Total Pagado:       $${pagado.toLocaleString('es-CO')} COP`)
    if (!isPagado)
      doc.text(`Saldo Pendiente:  $${Number(reserva.saldoPendiente).toLocaleString('es-CO')} COP`)
    doc.moveDown()

    // Historial de pagos
    if (reserva.abonos.length > 0) {
      doc.fontSize(13).font('Helvetica-Bold').text('Historial de Pagos')
      doc.fontSize(11).font('Helvetica')
      reserva.abonos.forEach((abono, idx) => {
        const label = idx === 0 ? '1er Abono (Anticipo 50%)' : '2do Abono (Saldo Final)'
        const fecha = new Date(abono.fechaPago).toLocaleDateString('es-CO')
        doc.text(`${label}: $${Number(abono.monto).toLocaleString('es-CO')} COP — ${abono.metodoPago} — ${fecha}`)
      })
      doc.moveDown()
    }

    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
    doc.moveDown(0.5)
    doc.fontSize(9).fillColor('#666')
      .text('Mariachis Texas  •  312-237-3486  •  texasmariachi@gmail.com', { align: 'center' })
      .text(`Generado el ${new Date().toLocaleDateString('es-CO')}`, { align: 'center' })

    doc.end()
  } catch (err) {
    return handleServiceError(err, res, 'Error al generar el PDF de la reserva')
  }
})


// ─── DOWNLOAD PDF (listado general) ─────────────────────────────────────────
export const downloadPdf = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const rol  = req.user?.rol
    const ventas = (rol && (ROLES_ADMIN as readonly string[]).includes(rol))
      ? await ventaService.getVentas()
      : await ventaService.getVentas(req.user?.id ? Number(req.user.id) : undefined)

    const doc = new PDFDocument()
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="ventas.pdf"')
    doc.pipe(res)

    doc.fontSize(20).text('Reporte de Ventas', { align: 'center' })
    doc.moveDown()

    if (ventas.length === 0) {
      doc.fontSize(12).text('No hay ventas registradas.', { align: 'center' })
    } else {
      ventas.forEach((venta, index) => {
        doc.fontSize(12).text(
          `${index + 1}. ${venta.concept} — ${venta.clientName} — $${venta.amount.toLocaleString('es-CO')} — ${new Date(venta.date).toLocaleDateString('es-CO')}`
        )
        doc.moveDown(0.5)
      })
    }

    doc.end()
  } catch (err) {
    return handleServiceError(err, res, 'Error al generar el reporte PDF')
  }
})

// ─── DOWNLOAD PDF (venta individual) ────────────────────────────────────────
export const downloadVentaPdf = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    if (!id || isNaN(Number(id)))
      return res.status(400).json({ ok: false, code: 'ID_INVALIDO', message: 'El ID de venta es inválido' })

    const ventas = await ventaService.getVentas()
    const venta  = ventas.find(v => v.id === id)

    if (!venta)
      return res.status(404).json({ ok: false, code: 'VENTA_NO_ENCONTRADA', message: `Venta con ID ${id} no encontrada` })

    if (req.user?.rol === 'CLIENTE' && venta.clientId !== String(req.user.id))
      return res.status(403).json({ ok: false, code: 'SIN_PERMISO', message: 'No tienes permiso para descargar esta factura' })

    const doc = new PDFDocument()
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="factura-${id}.pdf"`)
    doc.pipe(res)

    doc.fontSize(20).text('Factura de Venta', { align: 'center' })
    doc.moveDown()
    doc.fontSize(12).text(`Cliente:  ${venta.clientName}`)
    doc.text(`Concepto: ${venta.concept}`)
    doc.text(`Monto:    $${venta.amount.toLocaleString('es-CO')} COP`)
    doc.text(`Fecha:    ${new Date(venta.date).toLocaleDateString('es-CO')}`)
    doc.text(`Método:   ${venta.method}`)
    if (venta.reservationId) doc.text(`Reserva:  #${venta.reservationId}`)

    doc.end()
  } catch (err) {
    return handleServiceError(err, res, 'Error al generar la factura PDF')
  }
})