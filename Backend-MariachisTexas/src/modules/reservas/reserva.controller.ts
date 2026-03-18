import { Request, Response } from 'express'
import * as reservaService from './reserva.services'
import { AuthRequest } from '../../middlewares/Auth.middleware'
import { asyncHandler } from '../../middlewares/Asynchandler'
import prisma from '../../config/prisma'
//////Obtener todos las reservas
export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {const clienteId = req.user?.rol === 'CLIENTE' ? Number(req.user.id) : undefined
res.json(await reservaService.getReservas(clienteId))
})
//////Obtener calendario de reservas
export const getCalendario = asyncHandler(async (req: Request, res: Response) => {
res.json(await reservaService.getReservasCalendario())
})
//////Obtener horarios disponibles
export const getAvailableHours = asyncHandler(async (req: Request, res: Response) => {const date = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date
res.json(await reservaService.getAvailableHours(date))
})
//////Obtener reserva por ID
export const getById = asyncHandler(async (req: AuthRequest, res: Response) => {const id      = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
const reserva = await reservaService.getReservaById(Number(id))
  // ✅ Si es cliente, verificar que la reserva le pertenece
if (req.user?.rol === 'CLIENTE') {
    const usuario = await prisma.usuario.findUnique({ where: { id: Number(req.user.id) } })
    if (reserva.clientEmail !== usuario?.email) {
    return res.status(403).json({ message: 'No tienes permiso para ver esta reserva.' })
    }
}
res.json(reserva)
})
//////Crear nueva reserva
export const create = asyncHandler(async (req: AuthRequest, res: Response) => {const data = { ...req.body, clienteId: req.body.clienteId || req.user?.id }
res.status(201).json(await reservaService.createReserva(data))
})
//////Anular reserva
export const anular = asyncHandler(async (req: Request, res: Response) => {const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
res.json(await reservaService.anularReserva(Number(id), req.body.motivo))
})
//////Confirmar reserva
export const confirmar = asyncHandler(async (req: Request, res: Response) => {const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
res.json(await reservaService.confirmarReserva(Number(id)))
})

export const update = asyncHandler(async (req: Request, res: Response) => {const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
res.json(await reservaService.updateReserva(Number(id), req.body))
})
//////Eliminar reserva
export const remove = asyncHandler(async (req: Request, res: Response) => {const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
res.json(await reservaService.deleteReserva(Number(id)))
})