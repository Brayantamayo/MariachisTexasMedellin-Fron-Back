import { Request, Response } from 'express'
import * as repertoireService from './Repertoire.services'
import { asyncHandler } from '../../middlewares/Asynchandler'

export const getAll = asyncHandler(async (req: Request, res: Response) => {res.json(await repertoireService.getSongs())
}, 500)

export const getPublic = asyncHandler(async (req: Request, res: Response) => {res.json(await repertoireService.getSongsPublic())
}, 500)

export const getById = asyncHandler(async (req: Request, res: Response) => {res.json(await repertoireService.getSongById(Number(req.params.id)))
}, 404)

export const create = asyncHandler(async (req: Request, res: Response) => {res.status(201).json(await repertoireService.createSong(req.body))
})

export const update = asyncHandler(async (req: Request, res: Response) => {res.json(await repertoireService.updateSong(Number(req.params.id), req.body))
})

export const toggle = asyncHandler(async (req: Request, res: Response) => {res.json(await repertoireService.toggleStatus(Number(req.params.id)))
})

export const remove = asyncHandler(async (req: Request, res: Response) => {res.json(await repertoireService.deleteSong(Number(req.params.id)))
}, 404)