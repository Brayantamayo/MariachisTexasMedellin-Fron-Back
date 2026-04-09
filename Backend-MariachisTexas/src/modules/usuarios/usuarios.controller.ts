import { Request, Response } from 'express'
import * as usuarioService from './usuarios.services'
import { asyncHandler } from '../../middlewares/Asynchandler'

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const usuarios = await usuarioService.getUsuarios()
  res.json(usuarios)
})

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const usuario = await usuarioService.getUsuarioById(Number(req.params.id))
  res.json(usuario)
})

export const create = asyncHandler(async (req: Request, res: Response) => {
  const usuario = await usuarioService.createUsuario(req.body)
  res.status(201).json(usuario)
})

export const update = asyncHandler(async (req: Request, res: Response) => {
  const usuario = await usuarioService.updateUsuario(Number(req.params.id), req.body)
  res.json(usuario)
})

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const result = await usuarioService.deleteUsuario(Number(req.params.id))
  res.json(result)
})