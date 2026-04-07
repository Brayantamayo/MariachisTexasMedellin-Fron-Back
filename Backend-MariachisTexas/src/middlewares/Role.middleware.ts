import { Response, NextFunction } from 'express'
import { AuthRequest } from './Auth.middleware'

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' })
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' })
    }

    next()
  }
}
export const roleMiddleware = requireRole