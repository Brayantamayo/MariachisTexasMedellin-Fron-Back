import { Request, Response } from 'express'
import * as reservaService from './reserva.services'
import { AuthRequest } from '../../middlewares/Auth.middleware'
import { asyncHandler } from '../../middlewares/Asynchandler'
import prisma from '../../config/prisma'

const ROLES_ADMIN = ['ADMIN', 'EMPLEADO']

// ─── GET ALL ──────────────────────────────────────────────────────────────────
export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const rol = req.user?.rol
  if (rol && ROLES_ADMIN.includes(rol)) {
    return res.json(await reservaService.getReservas())
  }
  const usuarioId = req.user?.id ? Number(req.user.id) : undefined
  return res.json(await reservaService.getReservas(usuarioId))
})

// ─── GET CALENDARIO ───────────────────────────────────────────────────────────
export const getCalendario = asyncHandler(async (_req: Request, res: Response) => {res.json(await reservaService.getReservasCalendario())
})

// ─── GET AVAILABLE HOURS ──────────────────────────────────────────────────────
export const getAvailableHours = asyncHandler(async (req: Request, res: Response) => {const date = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date

const excludeId = req.query.excludeId ? Number(req.query.excludeId) : undefined

  res.json(await reservaService.getAvailableHours(date, excludeId))
})

// ─── GET BY ID ────────────────────────────────────────────────────────────────
export const getById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id      = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const reserva = await reservaService.getReservaById(Number(id))

  if (req.user?.rol === 'CLIENTE') {
    const usuario = await prisma.usuario.findUnique({ where: { id: Number(req.user.id) } })
    if (reserva.clientEmail !== usuario?.email) {
      return res.status(403).json({ message: 'No tienes permiso para ver esta reserva.' })
    }
  }

  res.json(reserva)
})

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = { ...req.body, clienteId: req.body.clienteId || req.user?.id }
  res.status(201).json(await reservaService.createReserva(data))
})

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  res.json(await reservaService.updateReserva(Number(id), req.body))
})

// ─── ANULAR ───────────────────────────────────────────────────────────────────
export const anular = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  res.json(await reservaService.anularReserva(Number(id), req.body.motivo))
})

// ─── CONFIRMAR ────────────────────────────────────────────────────────────────
export const confirmar = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  res.json(await reservaService.confirmarReserva(Number(id)))
})

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  res.json(await reservaService.deleteReserva(Number(id)))
})