import { Request, Response } from 'express'
import * as ensayoService from './ensayo.service'
import { asyncHandler } from '../../middlewares/Asynchandler'

export const getAll = asyncHandler(async (req: Request, res: Response) => {res.json(await ensayoService.getEnsayos())
}, 500)

export const getById = asyncHandler(async (req: Request, res: Response) => {res.json(await ensayoService.getEnsayoById(Number(req.params.id)))
}, 404)

export const create = asyncHandler(async (req: Request, res: Response) => {res.status(201).json(await ensayoService.createEnsayo(req.body))
})

export const update = asyncHandler(async (req: Request, res: Response) => {res.json(await ensayoService.updateEnsayo(Number(req.params.id), req.body))
})

export const remove = asyncHandler(async (req: Request, res: Response) => {res.json(await ensayoService.deleteEnsayo(Number(req.params.id)))
}, 404)