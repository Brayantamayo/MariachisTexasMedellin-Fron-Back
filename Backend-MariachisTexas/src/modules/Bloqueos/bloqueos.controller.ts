import { Request, Response } from 'express'
import * as bloqueoService from './bloqueo.service'
import { asyncHandler } from '../../middlewares/Asynchandler'

export const getAll = asyncHandler(async (req: Request, res: Response) => {res.json(await bloqueoService.getBlocks())})

export const checkDate = asyncHandler(async (req: Request, res: Response) => {const date = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date
res.json(await bloqueoService.checkDateStatus(date))})

export const create = asyncHandler(async (req: Request, res: Response) => {res.status(201).json(await bloqueoService.createBlock(req.body))})

export const update = asyncHandler(async (req: Request, res: Response) => {const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
res.json(await bloqueoService.updateBlock(Number(id), req.body))})

export const remove = asyncHandler(async (req: Request, res: Response) => {const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
res.json(await bloqueoService.deleteBlock(Number(id)))})