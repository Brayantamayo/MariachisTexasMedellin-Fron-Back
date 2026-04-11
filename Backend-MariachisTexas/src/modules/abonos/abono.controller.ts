import { Request, Response } from 'express'
import * as abonoService from './abono.services'
import { AuthRequest } from '../../middlewares/Auth.middleware'
import { asyncHandler } from '../../middlewares/Asynchandler'
import PDFDocument from 'pdfkit'
import prisma from '../../config/prisma'

const ROLES_ADMIN = ['ADMIN', 'EMPLEADO', 'CLIENTE']

// ─── GET ALL ──────────────────────────────────────────────────────────────────
export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id

  let usuarioId: number | undefined
  if (userId !== undefined && userId !== null) {
    const numId = Number(userId)
    if (!isNaN(numId) && numId > 0) {
      usuarioId = numId
    } else {
      return res.status(400).json({ message: 'ID de usuario inválido' })
    }
  }

  if (req.user?.rol && ROLES_ADMIN.includes(req.user.rol)) {
    return res.json(
      await abonoService.getAbonos(req.user.rol === 'CLIENTE' ? usuarioId : undefined)
    )
  }
  return res.status(403).json({ message: 'No tienes permisos para ver abonos' })
})

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const reservaId = Number(
    Array.isArray(req.body.reservaId) ? req.body.reservaId[0] : req.body.reservaId
  )
  const { amount, date, method, notes } = req.body

  if (!reservaId || !amount || !date || !method) {
    return res.status(400).json({ message: 'Faltan datos obligatorios: reservaId, amount, date, method' })
  }

  const result = await abonoService.createAbono(reservaId, { amount, date, method, notes })
  return res.status(201).json(result)
})

// ─── CONVERTIR EN VENTA  ─────────────────────────────────────────────────────────
export const convertToVenta = asyncHandler(async (req: AuthRequest, res: Response) => {
  let reservaId = req.body.reservaId
  if (Array.isArray(reservaId)) reservaId = reservaId[0]
  reservaId = Number(reservaId)

  if (!reservaId || isNaN(reservaId)) {
    return res.status(400).json({ message: 'Debe proporcionar un reservaId válido' })
  }
  if (!req.user?.rol || !['ADMIN', 'EMPLEADO'].includes(req.user.rol)) {
    return res.status(403).json({ message: 'No tienes permisos para convertir abonos a ventas' })
  }

  const venta = await abonoService.convertAbonosToVenta(reservaId)
  return res.status(201).json(venta)
})

// ─── DOWNLOAD PDF (todos) ─────────────────────────────────────────────────────
export const downloadPdf = asyncHandler(async (req: AuthRequest, res: Response) => {
  const usuarioId = req.user?.id ? Number(req.user.id) : undefined
  const abonos    = await abonoService.getAbonos(
    req.user?.rol === 'CLIENTE' ? usuarioId : undefined
  )

  const doc = new PDFDocument()
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename="abonos.pdf"')
  doc.pipe(res)

  doc.fontSize(20).text('Reporte de Abonos', { align: 'center' })
  doc.moveDown()
  abonos.forEach((abono, index) => {
    doc.fontSize(12).text(
      `${index + 1}. ${abono.clientName} - $${abono.amount} - ${abono.date} - Reserva #${abono.reservationId}`
    )
    doc.moveDown(0.5)
  })
  doc.end()
})

// ─── DOWNLOAD PDF (uno) ───────────────────────────────────────────────────────
export const downloadAbonoPdf = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id }    = req.params
  const usuarioId = req.user?.id ? Number(req.user.id) : undefined
  const abonos    = await abonoService.getAbonos(
    req.user?.rol === 'CLIENTE' ? usuarioId : undefined
  )
  const abono = abonos.find(a => a.id === id)

  if (!abono) return res.status(404).json({ message: 'Abono no encontrado' })

  const doc = new PDFDocument()
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="abono-${id}.pdf"`)
  doc.pipe(res)

  doc.fontSize(20).text('Comprobante de Abono', { align: 'center' })
  doc.moveDown()
  doc.fontSize(12).text(`Cliente: ${abono.clientName}`)
  doc.moveDown(0.5)
  doc.text(`Monto: $${abono.amount}`)
  doc.moveDown(0.5)
  doc.text(`Fecha: ${abono.date}`)
  doc.moveDown(0.5)
  doc.text(`Método: ${abono.method}`)
  doc.moveDown(0.5)
  doc.text(`Reserva ID: ${abono.reservationId}`)
  doc.moveDown(0.5)
  if (abono.notes) {
    doc.text(`Notas: ${abono.notes}`)
    doc.moveDown(0.5)
  }
  doc.end()
})

// ─── PAYABLE RESERVATIONS ─────────────────────────────────────────────────────
export const getPayableReservations = async (req: Request, res: Response) => {
  try {
    const reservas = await prisma.reserva.findMany({
      where: {
        saldoPendiente: { gt: 0.01 },
        estado:         { notIn: ['ANULADA'] as any },
      },
      include: {
        cotizacion: {
          include: {
            cliente: { include: { usuario: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = (reservas as any[]).map(r => {
      const total   = Number(r.totalValor)
      const pending = Number(r.saldoPendiente)
      const paid    = total - pending

      return {
        id:         String(r.id),
        clientName: r.cotizacion?.cliente
          ? `${r.cotizacion.cliente.usuario?.nombre ?? ''} ${r.cotizacion.cliente.apellido ?? ''}`.trim()
          : 'Sin cliente',
        total,
        paid,
        pending,
      }
    })

    return res.json(result)
  } catch (err) {
    console.error('getPayableReservations error:', err)
    return res.status(500).json({ error: 'Error obteniendo reservas disponibles' })
  }
}