import { Request, Response } from 'express'
import { searchSongs } from './spotify.service'
import { asyncHandler } from '../../middlewares/Asynchandler'

// GET /api/spotify/search?q=el+rey&limit=10
export const search = asyncHandler(async (req: Request, res: Response) => {
  const q     = req.query.q as string
  const limit = Math.min(Number(req.query.limit) || 10, 20)

  if (!q?.trim()) {
    return res.status(400).json({ message: 'El parámetro q es requerido' })
  }

  const songs = await searchSongs(q, limit)
  res.json(songs)
})