import { Request, Response } from 'express'
import * as ventaService from './venta.services'
import { VentaError } from './venta.services'
import { AuthRequest } from '../../middlewares/Auth.middleware'
import { asyncHandler } from '../../middlewares/Asynchandler'
import prisma from '../../config/prisma'
import { buildClientName } from '../../utils/date.helpers'
import {
  generateReservaReceiptPdf,
  generateVentaDetailPdf,
  generateVentasReportPdf,
} from './venta.pdf.service'

const ROLES_ADMIN = ['ADMIN', 'EMPLEADO'] as const

const handleServiceError = (
  err: unknown,
  res: Response,
  contextMsg = 'Error interno del servidor'
): Response => {
  if (err instanceof VentaError) {
    return res.status(err.status).json({
      ok: false,
      code: err.code,
      message: err.message,
    })
  }

  console.error('[VentaController]', err)
  return res.status(500).json({
    ok: false,
    code: 'ERROR_INTERNO',
    message: contextMsg,
  })
}

export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const rol = req.user?.rol
    if (rol && (ROLES_ADMIN as readonly string[]).includes(rol)) {
      const ventas = await ventaService.getVentas()
      return res.json({ ok: true, data: ventas, total: ventas.length })
    }

    const usuarioId = req.user?.id ? Number(req.user.id) : undefined
    const ventas = await ventaService.getVentas(usuarioId)
    return res.json({ ok: true, data: ventas, total: ventas.length })
  } catch (err) {
    console.error('[VentaController] ERROR COMPLETO:', err)
    console.error('[VentaController] STACK:', (err as Error).stack)
    return handleServiceError(err, res, 'Error al obtener las ventas')
  }
})

export const getById = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const id = Number(rawId)

    if (Number.isNaN(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        code: 'ID_INVALIDO',
        message: 'El ID debe ser un numero positivo',
      })
    }

    const ventas = await ventaService.getVentas()
    const venta = ventas.find(v => v.id === String(id) || v.id === `RES-${id}`)

    if (!venta) {
      return res.status(404).json({
        ok: false,
        code: 'VENTA_NO_ENCONTRADA',
        message: `Venta con ID ${id} no encontrada`,
      })
    }

    if (req.user?.rol === 'CLIENTE' && venta.clientId !== req.user.id) {
      return res.status(403).json({
        ok: false,
        code: 'SIN_PERMISO',
        message: 'No tienes permiso para ver esta venta',
      })
    }

    return res.json({ ok: true, data: venta })
  } catch (err) {
    return handleServiceError(err, res, 'Error al obtener la venta')
  }
})

export const getPayableReservations = asyncHandler(async (_req: Request, res: Response) => {
  try {
    const reservas = await ventaService.getPayableReservations()
    return res.json({ ok: true, data: reservas, total: reservas.length })
  } catch (err) {
    return handleServiceError(err, res, 'Error al obtener reservas pagables')
  }
})

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const { clienteId, tipo, montoTotal, montoPagado, fechaVenta, metodoPago } = req.body

    const camposFaltantes: string[] = []
    if (clienteId === undefined || clienteId === null) camposFaltantes.push('clienteId')
    if (!tipo) camposFaltantes.push('tipo')
    if (!montoTotal) camposFaltantes.push('montoTotal')
    if (montoPagado === undefined || montoPagado === null) camposFaltantes.push('montoPagado')
    if (!fechaVenta) camposFaltantes.push('fechaVenta')
    if (!metodoPago) camposFaltantes.push('metodoPago')

    if (camposFaltantes.length > 0) {
      return res.status(400).json({
        ok: false,
        code: 'CAMPOS_REQUERIDOS',
        message: `Faltan campos obligatorios: ${camposFaltantes.join(', ')}`,
        campos: camposFaltantes,
      })
    }

    const venta = await ventaService.createVenta(req.body)
    return res.status(201).json({
      ok: true,
      message: 'Venta registrada correctamente',
      data: venta,
    })
  } catch (err) {
    return handleServiceError(err, res, 'Error al crear la venta')
  }
})

export const addFinalAbono = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const rawId = Array.isArray(req.params.reservaId) ? req.params.reservaId[0] : req.params.reservaId
    const reservaId = Number(rawId)

    if (Number.isNaN(reservaId) || reservaId <= 0 || !Number.isInteger(reservaId)) {
      return res.status(400).json({
        ok: false,
        code: 'ID_INVALIDO',
        message: 'El ID de reserva debe ser un numero entero positivo',
      })
    }

    const { amount, date, method, notes } = req.body

    const camposFaltantes: string[] = []
    if (amount === undefined || amount === null) camposFaltantes.push('amount')
    if (!date) camposFaltantes.push('date')
    if (!method) camposFaltantes.push('method')

    if (camposFaltantes.length > 0) {
      return res.status(400).json({
        ok: false,
        code: 'CAMPOS_REQUERIDOS',
        message: `Faltan campos obligatorios: ${camposFaltantes.join(', ')}`,
        campos: camposFaltantes,
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

export const downloadReservaPdf = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const rawId = Array.isArray(req.params.reservaId) ? req.params.reservaId[0] : req.params.reservaId
    const reservaId = Number(rawId)

    if (Number.isNaN(reservaId) || reservaId <= 0) {
      return res.status(400).json({
        ok: false,
        code: 'ID_INVALIDO',
        message: 'El ID de reserva es invalido',
      })
    }

    const reserva = await prisma.reserva.findUnique({
      where: { id: reservaId },
      include: {
        abonos: true,
        cotizacion: {
          include: {
            cliente: { include: { usuario: true } },
            servicios: { include: { servicio: true } },
            repertorios: { include: { repertorio: true } },
          },
        },
      },
    })

    if (!reserva) {
      return res.status(404).json({
        ok: false,
        code: 'RESERVA_NO_ENCONTRADA',
        message: `Reserva #${reservaId} no encontrada`,
      })
    }

    if (req.user?.rol === 'CLIENTE') {
      const clienteDeReserva = reserva.cotizacion?.clienteId
      const usuarioCliente = await prisma.cliente.findFirst({
        where: { usuarioId: Number(req.user.id) },
      })

      if (!usuarioCliente || clienteDeReserva !== usuarioCliente.id) {
        return res.status(403).json({
          ok: false,
          code: 'SIN_PERMISO',
          message: 'No tienes permiso para descargar este PDF',
        })
      }
    }

    const cot = reserva.cotizacion
    const cliente = cot?.cliente
    const nombreCliente = cliente
      ? buildClientName(cliente.usuario?.nombre, cliente.apellido)
      : 'Cliente'

    const pdfBuffer = await generateReservaReceiptPdf(reserva, nombreCliente)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="Reserva-${reservaId}-MariachisTexas.pdf"`)
    res.setHeader('Content-Length', pdfBuffer.length)
    res.send(pdfBuffer)
  } catch (err) {
    return handleServiceError(err, res, 'Error al generar el PDF de la reserva')
  }
})

export const downloadPdf = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const rol = req.user?.rol
    const ventas = (rol && (ROLES_ADMIN as readonly string[]).includes(rol))
      ? await ventaService.getVentas()
      : await ventaService.getVentas(req.user?.id ? Number(req.user.id) : undefined)

    const pdfBuffer = await generateVentasReportPdf(ventas)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="ventas.pdf"')
    res.setHeader('Content-Length', pdfBuffer.length)
    res.send(pdfBuffer)
  } catch (err) {
    return handleServiceError(err, res, 'Error al generar el reporte PDF')
  }
})

export const downloadVentaPdf = asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    if (!id || Number.isNaN(Number(id))) {
      return res.status(400).json({
        ok: false,
        code: 'ID_INVALIDO',
        message: 'El ID de venta es invalido',
      })
    }

    const ventas = await ventaService.getVentas()
    const venta = ventas.find(v => v.id === id)

    if (!venta) {
      return res.status(404).json({
        ok: false,
        code: 'VENTA_NO_ENCONTRADA',
        message: `Venta con ID ${id} no encontrada`,
      })
    }

    if (req.user?.rol === 'CLIENTE' && venta.clientId !== String(req.user.id)) {
      return res.status(403).json({
        ok: false,
        code: 'SIN_PERMISO',
        message: 'No tienes permiso para descargar esta factura',
      })
    }

    const pdfBuffer = await generateVentaDetailPdf(venta)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="factura-${id}.pdf"`)
    res.setHeader('Content-Length', pdfBuffer.length)
    res.send(pdfBuffer)
  } catch (err) {
    return handleServiceError(err, res, 'Error al generar la factura PDF')
  }
})
