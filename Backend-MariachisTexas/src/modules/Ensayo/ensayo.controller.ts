import { Request, Response } from 'express'
import * as ensayoService from './ensayo.service'
import { asyncHandler } from '../../middlewares/Asynchandler'

// ─── PÚBLICA — solo expone fecha y hora, sin datos internos ───────────────────
// ✅ FIX: usa date/time en vez de fecha/hora para ser consistente
// con el tipo Rehearsal del frontend y el resto de mappers del sistema
export const getDisponibilidad = asyncHandler(async (req: Request, res: Response) => {
const ensayos = await ensayoService.getEnsayos()
const data = ensayos.map(e => ({
    date: e.date,
    time: e.time,
}))
res.json(data)
})

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  res.json(await ensayoService.getEnsayos())
})

export const getById = asyncHandler(async (req: Request, res: Response) => {
  res.json(await ensayoService.getEnsayoById(Number(req.params.id)))
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(await ensayoService.createEnsayo(req.body))
})

export const update = asyncHandler(async (req: Request, res: Response) => {
  res.json(await ensayoService.updateEnsayo(Number(req.params.id), req.body))
})

export const remove = asyncHandler(async (req: Request, res: Response) => {
  res.json(await ensayoService.deleteEnsayo(Number(req.params.id)))
})