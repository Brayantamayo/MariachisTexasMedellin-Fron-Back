import { Request, Response } from 'express'
import * as cotizacionService from './cotizacion.services'
import { generateCotizacionPdf } from './cotizacion.pdf.service'
import { AuthRequest } from '../../middlewares/Auth.middleware'
import { asyncHandler } from '../../middlewares/Asynchandler'

// ─── PÚBLICA — solo fecha/hora de cotizaciones EN_ESPERA ──────────────────────
// El cliente ve el slot como bloqueado sin datos del solicitante
export const getDisponibilidad = asyncHandler(async (req: Request, res: Response) => {const cotizaciones = await cotizacionService.getCotizaciones()
  const data = cotizaciones
    .filter((c: any) => c.status === 'EN_ESPERA')
    .map((c: any) => ({
      date:      c.eventDate,
      startTime: c.startTime,
      endTime:   c.endTime,
    }))
  res.json(data)
})

export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {res.json(await cotizacionService.getCotizaciones())})

export const getById = asyncHandler(async (req: Request, res: Response) => {res.json(await cotizacionService.getCotizacionById(Number(req.params.id)))})

export const create = asyncHandler(async (req: Request, res: Response) => {res.status(201).json(await cotizacionService.createCotizacion(req.body))})

export const update = asyncHandler(async (req: Request, res: Response) => {res.json(await cotizacionService.updateCotizacion(Number(req.params.id), req.body))})

export const anular = asyncHandler(async (req: Request, res: Response) => {res.json(await cotizacionService.anularCotizacion(Number(req.params.id)))})

export const convertir = asyncHandler(async (req: Request, res: Response) => {res.json(await cotizacionService.convertirCotizacion(Number(req.params.id)))})

export const remove = asyncHandler(async (req: Request, res: Response) => {res.json(await cotizacionService.deleteCotizacion(Number(req.params.id)))})


export const downloadPdf = asyncHandler(async (req: Request, res: Response) => {const id        = Number(req.params.id)
const pdfBuffer = await generateCotizacionPdf(id)
res.setHeader('Content-Type', 'application/pdf')
res.setHeader('Content-Disposition', `attachment; filename="Cotizacion-${id}-MariachisTexas.pdf"`)
res.setHeader('Content-Length', pdfBuffer.length)
res.send(pdfBuffer)
})