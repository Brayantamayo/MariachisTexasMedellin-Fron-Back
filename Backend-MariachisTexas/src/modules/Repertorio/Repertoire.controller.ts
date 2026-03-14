import { Request, Response } from 'express'
import * as repertoireService from './Repertoire.services'

// GET /api/repertorio
export const getAll = async (req: Request, res: Response) => {
  try {
    res.json(await repertoireService.getSongs())
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// GET /api/repertorio/public
export const getPublic = async (req: Request, res: Response) => {
  try {
    res.json(await repertoireService.getSongsPublic())
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

// GET /api/repertorio/:id
export const getById = async (req: Request, res: Response) => {
  try {
    res.json(await repertoireService.getSongById(Number(req.params.id)))
  } catch (error: any) {
    res.status(404).json({ message: error.message })
  }
}

// POST /api/repertorio
export const create = async (req: Request, res: Response) => {
  try {
    res.status(201).json(await repertoireService.createSong(req.body))
  } catch (error: any) {
    res.status(400).json({ message: error.message })
  }
}

// PUT /api/repertorio/:id
export const update = async (req: Request, res: Response) => {
  try {
    res.json(await repertoireService.updateSong(Number(req.params.id), req.body))
  } catch (error: any) {
    res.status(400).json({ message: error.message })
  }
}

// PATCH /api/repertorio/:id/toggle
export const toggle = async (req: Request, res: Response) => {
  try {
    res.json(await repertoireService.toggleStatus(Number(req.params.id)))
  } catch (error: any) {
    res.status(400).json({ message: error.message })
  }
}

// DELETE /api/repertorio/:id
export const remove = async (req: Request, res: Response) => {
  try {
    res.json(await repertoireService.deleteSong(Number(req.params.id)))
  } catch (error: any) {
    res.status(404).json({ message: error.message })
  }
}