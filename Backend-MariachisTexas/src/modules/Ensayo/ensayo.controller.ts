import { Request, Response } from 'express'
import * as ensayoService from './ensayo.service'
import { asyncHandler } from '../../middlewares/Asynchandler'

// ─── PÚBLICA ──────────────────────────────────────────────────────────────────
export const getDisponibilidad = asyncHandler(async (req: Request, res: Response) => {const data = await ensayoService.getDisponibilidadPublica()
res.json(data)
})

// ─── CRUD ─────────────────────────────────────────────────────────────────────
///Obtenemos todos los ensayos
export const getAll = asyncHandler(async (req: Request, res: Response) => {res.json(await ensayoService.getEnsayos())})
//Obtenemos un ensayo por su ID
export const getById = asyncHandler(async (req: Request, res: Response) => {res.json(await ensayoService.getEnsayoById(Number(req.params.id)))})
//Creamos un nuevo ensayo
export const create = asyncHandler(async (req: Request, res: Response) => {res.status(201).json(await ensayoService.createEnsayo(req.body))})
//Actualizamos un ensayo existente
export const update = asyncHandler(async (req: Request, res: Response) => {res.json(await ensayoService.updateEnsayo(Number(req.params.id), req.body))})
///Eliminamos un ensayo existente
export const remove = asyncHandler(async (req: Request, res: Response) => {res.json(await ensayoService.deleteEnsayo(Number(req.params.id)))})

// ─── TOGGLE ESTADO ────────────────────────────────────────────────────────────
export const toggleEstado = asyncHandler(async (req: Request, res: Response) => {res.json(await ensayoService.toggleEstadoEnsayo(Number(req.params.id)))})