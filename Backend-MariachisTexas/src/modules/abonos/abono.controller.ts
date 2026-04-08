import { Request, Response } from 'express'
import * as abonoService from './abono.services'
import { AuthRequest } from '../../middlewares/Auth.middleware'
import { asyncHandler } from '../../middlewares/Asynchandler'
import PDFDocument from 'pdfkit'

const ROLES_ADMIN = ['ADMIN', 'EMPLEADO', 'CLIENTE']

export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const usuarioId = req.user?.id ? Number(req.user.id) : undefined
  if (req.user?.rol && ROLES_ADMIN.includes(req.user.rol)) {
    return res.json(await abonoService.getAbonos(req.user.rol === 'CLIENTE' ? usuarioId : undefined))
  }
  return res.status(403).json({ message: 'No tienes permisos para ver abonos' })
})

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = Number(Array.isArray(req.body.reservaId) ? req.body.reservaId[0] : req.body.reservaId)
  const { amount, date, method, notes } = req.body
  if (!id || !amount || !date || !method) {
    return res.status(400).json({ message: 'Faltan datos obligatorios para crear abono' })
  }

  const created = await abonoService.createAbono(id, { amount, date, method, notes })
  res.status(201).json(created)
})

export const convertToVenta = asyncHandler(async (req: AuthRequest, res: Response) => {
  const reservaId = Number(Array.isArray(req.body.reservaId) ? req.body.reservaId[0] : req.body.reservaId)
  if (!reservaId) {
    return res.status(400).json({ message: 'Debe proporcionar el reservaId' })
  }

  if (req.user?.rol && ['ADMIN', 'EMPLEADO'].includes(req.user.rol)) {
    const venta = await abonoService.convertAbonosToVenta(reservaId)
    return res.status(201).json(venta)
  }
  return res.status(403).json({ message: 'No tienes permisos para convertir abonos a ventas' })
})

// ─── DOWNLOAD PDF ─────────────────────────────────────────────────────────────
export const downloadPdf = asyncHandler(async (req: AuthRequest, res: Response) => {
  const usuarioId = req.user?.id ? Number(req.user.id) : undefined
  const abonos = await abonoService.getAbonos(req.user?.rol === 'CLIENTE' ? usuarioId : undefined)

  const doc = new PDFDocument()
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename="abonos.pdf"')
  doc.pipe(res)

  doc.fontSize(20).text('Reporte de Abonos', { align: 'center' })
  doc.moveDown()

  abonos.forEach((abono, index) => {
    doc.fontSize(12).text(`${index + 1}. ${abono.clientName} - $${abono.amount} - ${abono.date} - Reserva #${abono.reservationId}`)
    doc.moveDown(0.5)
  })

  doc.end()
})

export const downloadAbonoPdf = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const usuarioId = req.user?.id ? Number(req.user.id) : undefined
  const abonos = await abonoService.getAbonos(req.user?.rol === 'CLIENTE' ? usuarioId : undefined)
  const abono = abonos.find(a => a.id === id)

  if (!abono) {
    return res.status(404).json({ message: 'Abono no encontrado' })
  }

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
