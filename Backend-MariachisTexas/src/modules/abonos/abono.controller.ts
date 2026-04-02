import { Request, Response } from 'express'
import * as abonoService from './abono.services'
import { AuthRequest } from '../../middlewares/Auth.middleware'
import { asyncHandler } from '../../middlewares/Asynchandler'

const ROLES_ADMIN = ['ADMIN', 'EMPLEADO', 'CLIENTE']

export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const usuarioId = req.user?.id ? Number(req.user.id) : undefined
  if (req.user?.rol && ROLES_ADMIN.includes(req.user.rol)) {
    return res.json(await abonoService.getAbonos(req.user.rol === 'CLIENTE' ? usuarioId : undefined))
  }
  return res.status(403).json({ message: 'No tienes permisos para ver abonos' })
})

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = Number(Array.isArray(req.body.reservaId) ? req.body.reservaId[0] : req.body.reservaId)
  const { amount, date, method, notes } = req.body
  if (!id || !amount || !date || !method) {
    return res.status(400).json({ message: 'Faltan datos obligatorios para crear abono' })
  }

  const created = await abonoService.createAbono(id, { amount, date, method, notes })
  res.status(201).json(created)
})

export const convertToVenta = asyncHandler(async (req: AuthRequest, res: Response) => {
  const reservaId = Number(Array.isArray(req.body.reservaId) ? req.body.reservaId[0] : req.body.reservaId)
  if (!reservaId) {
    return res.status(400).json({ message: 'Debe proporcionar el reservaId' })
  }

  if (req.user?.rol && ['ADMIN', 'EMPLEADO'].includes(req.user.rol)) {
    const venta = await abonoService.convertAbonosToVenta(reservaId)
    return res.status(201).json(venta)
  }
  return res.status(403).json({ message: 'No tienes permisos para convertir abonos a ventas' })
})
