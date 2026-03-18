import { Request, Response } from 'express'
import * as repertoireService from './Repertoire.services'
import { asyncHandler } from '../../middlewares/Asynchandler'
//////Obtener todos los repertorios
export const getAll    = asyncHandler(async (req: Request, res: Response) => { res.json(await repertoireService.getSongs()) })
/////Obtener repertorio público
export const getPublic = asyncHandler(async (req: Request, res: Response) => { res.json(await repertoireService.getSongsPublic()) })
//////Obtener repertorio por ID
export const getById   = asyncHandler(async (req: Request, res: Response) => { res.json(await repertoireService.getSongById(Number(req.params.id))) })
//////Crear nuevo repertorio
export const create    = asyncHandler(async (req: Request, res: Response) => { res.status(201).json(await repertoireService.createSong(req.body)) })
/////Actualizar repertorio
export const update    = asyncHandler(async (req: Request, res: Response) => { res.json(await repertoireService.updateSong(Number(req.params.id), req.body)) })
////Activar/desactivar repertorio
export const toggle    = asyncHandler(async (req: Request, res: Response) => { res.json(await repertoireService.toggleStatus(Number(req.params.id))) })
////Eliminar repertorio
export const remove    = asyncHandler(async (req: Request, res: Response) => { res.json(await repertoireService.deleteSong(Number(req.params.id))) })