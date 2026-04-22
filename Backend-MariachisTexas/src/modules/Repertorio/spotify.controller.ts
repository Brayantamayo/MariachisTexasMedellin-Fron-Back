// src/modules/spotify/spotify.controller.ts
import { Request, Response } from 'express';
import { searchSongs } from './spotify.service';

export const search = async (req: Request, res: Response) => {
  try {
    const { q, limit = 10, market = 'CO' } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Se requiere el parámetro "q" (búsqueda)' });
    }

    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : 10;
    const marketStr = typeof market === 'string' ? market : 'CO';

    const songs = await searchSongs(q, limitNum, marketStr);
    res.json(songs);
  } catch (error: any) {
    console.error('Error en búsqueda de Spotify:', error);
    res.status(500).json({ error: error.message || 'Error al buscar en Spotify' });
  }
};