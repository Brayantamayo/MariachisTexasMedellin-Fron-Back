import { Request, Response, NextFunction } from 'express'

// Rutas no encontradas (404)
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `No existe el endpoint: ${req.method} ${req.originalUrl}`,
    statusCode: 404
  })
}

// Errores generales (500)
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err)
  res.status(err.status ?? 500).json({
    error: err.message ?? 'Error interno del servidor',
    statusCode: err.status ?? 500
  })
}