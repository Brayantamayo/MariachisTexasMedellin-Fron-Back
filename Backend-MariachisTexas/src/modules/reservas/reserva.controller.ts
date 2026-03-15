import { Request, Response } from 'express'
import * as reservaService from './reserva.services'
import { AuthRequest } from '../../middlewares/Auth.middleware'
import { asyncHandler } from '../../middlewares/Asynchandler'

// GET /api/reservas — cliente ve las suyas, admin/empleado ven todas
export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {const clienteId = req.user?.rol === 'CLIENTE' ? Number(req.user.id) : undefined
res.json(await reservaService.getReservas(clienteId))
}, 500)

// GET /api/reservas/calendario — todas activas sin datos privados
export const getCalendario = asyncHandler(async (req: Request, res: Response) => {res.json(await reservaService.getReservasCalendario())
}, 500)

// GET /api/reservas/available-hours/:date — pública
export const getAvailableHours = asyncHandler(async (req: Request, res: Response) => {const date = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date
res.json(await reservaService.getAvailableHours(date))
}, 500)

export const getById = asyncHandler(async (req: Request, res: Response) => {const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
res.json(await reservaService.getReservaById(Number(id)))
}, 404)

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {const data = { ...req.body, clienteId: req.body.clienteId || req.user?.id }
res.status(201).json(await reservaService.createReserva(data))
})

export const anular = asyncHandler(async (req: Request, res: Response) => {const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
res.json(await reservaService.anularReserva(Number(id), req.body.motivo))
})

export const confirmar = asyncHandler(async (req: Request, res: Response) => {const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
res.json(await reservaService.confirmarReserva(Number(id)))
})

export const remove = asyncHandler(async (req: Request, res: Response) => {const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
res.json(await reservaService.deleteReserva(Number(id)))
})