import { Response } from 'express'
import { AuthRequest } from '../../middlewares/Auth.middleware'
import { asyncHandler } from '../../middlewares/Asynchandler'
import * as notificacionesServices from './notificaciones.services'

export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const list = await notificacionesServices.getNotificaciones()
  res.json(list)
})
