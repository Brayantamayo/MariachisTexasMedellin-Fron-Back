import { Request, Response } from 'express'
import * as cotizacionService from './cotizacion.services'
import { AuthRequest } from '../../middlewares/Auth.middleware'
import { asyncHandler } from '../../middlewares/Asynchandler'

export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {res.json(await cotizacionService.getCotizaciones())
})

export const getById = asyncHandler(async (req: Request, res: Response) => {res.json(await cotizacionService.getCotizacionById(Number(req.params.id)))
})

export const create = asyncHandler(async (req: Request, res: Response) => {res.status(201).json(await cotizacionService.createCotizacion(req.body))
})

export const update = asyncHandler(async (req: Request, res: Response) => {res.json(await cotizacionService.updateCotizacion(Number(req.params.id), req.body))
})

export const anular = asyncHandler(async (req: Request, res: Response) => {res.json(await cotizacionService.anularCotizacion(Number(req.params.id)))
})

export const convertir = asyncHandler(async (req: Request, res: Response) => {res.json(await cotizacionService.convertirCotizacion(Number(req.params.id)))
})

export const remove = asyncHandler(async (req: Request, res: Response) => {res.json(await cotizacionService.deleteCotizacion(Number(req.params.id)))
})