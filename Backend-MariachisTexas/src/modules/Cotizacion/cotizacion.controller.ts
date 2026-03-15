import { Request, Response } from 'express'
import * as cotizacionService from './cotizacion.services'
import { AuthRequest } from '../../middlewares/Auth.middleware'
import { asyncHandler } from '../../middlewares/Asynchandler'

// GET /api/cotizaciones
export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {res.json(await cotizacionService.getCotizaciones())
}, 500)

// GET /api/cotizaciones/:id
export const getById = asyncHandler(async (req: Request, res: Response) => {res.json(await cotizacionService.getCotizacionById(Number(req.params.id)))
}, 404)

// POST /api/cotizaciones/public — formulario landing
export const create = asyncHandler(async (req: Request, res: Response) => {res.status(201).json(await cotizacionService.createCotizacion(req.body))
})

// PUT /api/cotizaciones/:id
export const update = asyncHandler(async (req: Request, res: Response) => {res.json(await cotizacionService.updateCotizacion(Number(req.params.id), req.body))
})

// PATCH /api/cotizaciones/:id/anular
export const anular = asyncHandler(async (req: Request, res: Response) => {res.json(await cotizacionService.anularCotizacion(Number(req.params.id)))
})

// PATCH /api/cotizaciones/:id/convertir
export const convertir = asyncHandler(async (req: Request, res: Response) => {res.json(await cotizacionService.convertirCotizacion(Number(req.params.id)))
})

// DELETE /api/cotizaciones/:id
export const remove = asyncHandler(async (req: Request, res: Response) => {res.json(await cotizacionService.deleteCotizacion(Number(req.params.id)))
})