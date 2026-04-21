import { Request, Response } from 'express'
import * as usuarioService from '../usuarios/usuario.services'
import { AuthRequest } from '../../middlewares/Auth.middleware'
import { asyncHandler } from '../../middlewares/Asynchandler'

// ─── REGISTER (PÚBLICO) ──────────────────────────────────────────────────────
export const register = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(await usuarioService.registerUsuario(req.body))
})

// ─── GET ALL ──────────────────────────────────────────────────────────────────
export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await usuarioService.getUsuarios())
})

// ─── GET BY ID ───────────────────────────────────────────────────────────────
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)
  res.json(await usuarioService.getUsuarioById(id))
})

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.status(201).json(await usuarioService.createUsuario(req.body))
})

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)
  res.json(await usuarioService.updateUsuario(id, req.body))
})

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)
  await usuarioService.deleteUsuario(id)
  res.status(204).send()
})