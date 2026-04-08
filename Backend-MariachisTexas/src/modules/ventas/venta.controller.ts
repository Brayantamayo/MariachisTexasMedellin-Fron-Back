import { Request, Response } from 'express'
import * as ventaService from './venta.services'
import { AuthRequest } from '../../middlewares/Auth.middleware'
import { asyncHandler } from '../../middlewares/Asynchandler'
import PDFDocument from 'pdfkit'

const ROLES_ADMIN = ['ADMIN', 'EMPLEADO']

// ─── GET ALL ──────────────────────────────────────────────────────────────────
export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const rol = req.user?.rol
  if (rol && ROLES_ADMIN.includes(rol)) {
    return res.json(await ventaService.getVentas())
  }
  const usuarioId = req.user?.id ? Number(req.user.id) : undefined
  return res.json(await ventaService.getVentas(usuarioId))
})

// ─── GET BY ID ────────────────────────────────────────────────────────────────
export const getById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)
  const ventas = await ventaService.getVentas()
  const venta = ventas.find(v => v.id === String(id))
  if (!venta) return res.status(404).json({ message: 'Venta no encontrada' })

  if (req.user?.rol === 'CLIENTE' && venta.clientId !== req.user.id) {
    return res.status(403).json({ message: 'No tienes permiso para ver esta venta.' })
  }

  res.json(venta)
})

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.status(201).json(await ventaService.createVenta(req.body))
})

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)
  res.json(await ventaService.updateVenta(id, req.body))
})

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const remove = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)
  res.json(await ventaService.deleteVenta(id))
})

// ─── DOWNLOAD PDF ─────────────────────────────────────────────────────────────
export const downloadPdf = asyncHandler(async (req: AuthRequest, res: Response) => {
  const rol = req.user?.rol
  let ventas: any[]
  if (rol && ROLES_ADMIN.includes(rol)) {
    ventas = await ventaService.getVentas()
  } else {
    const usuarioId = req.user?.id ? Number(req.user.id) : undefined
    ventas = await ventaService.getVentas(usuarioId)
  }

  const doc = new PDFDocument()
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename="ventas.pdf"')
  doc.pipe(res)

  doc.fontSize(20).text('Reporte de Ventas', { align: 'center' })
  doc.moveDown()

  ventas.forEach((venta, index) => {
    doc.fontSize(12).text(`${index + 1}. ${venta.concept} - ${venta.clientName} - $${venta.amount} - ${venta.date}`)
    doc.moveDown(0.5)
  })

  doc.end()
})