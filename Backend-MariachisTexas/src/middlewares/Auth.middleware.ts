import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Extender Request para incluir el usuario decodificado
export interface AuthRequest extends Request {
  user?: {
    id:       number
    email:    string
    rol:      string
    permisos: string[]
  }
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token no proporcionado' })
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id:       number
      email:    string
      rol:      string
      permisos: string[]
    }

    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' })
  }
}
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
export const authMiddleware = verifyToken