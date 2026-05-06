import { Request, Response } from 'express'
import * as reservaService from './reserva.services'
import { AuthRequest } from '../../middlewares/Auth.middleware'
import { asyncHandler } from '../../middlewares/Asynchandler'
import prisma from '../../config/prisma'

const ROLES_ADMIN = ['ADMIN', 'EMPLEADO']

// ─── OBTENER TODOS LOS RESERVAS ───────────────────────────────────────────────────────────
export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const rol = req.user?.rol
  if (rol && ROLES_ADMIN.includes(rol)) {
    return res.json(await reservaService.getReservas())
  }
  const usuarioId = req.user?.id ? Number(req.user.id) : undefined
  return res.json(await reservaService.getReservas(usuarioId))
})

// ─── GET CALENDARIO ───────────────────────────────────────────────────────────
export const getCalendario = asyncHandler(async (req: AuthRequest, res: Response) => {
  const rol = req.user?.rol
  const usuarioId = req.user?.id ? Number(req.user.id) : undefined

  // Si es cliente, solo mostrar sus propias reservas
  // Si es admin/empleado, mostrar todas las reservas activas
  const isCliente = rol === 'CLIENTE'

  res.json(await reservaService.getReservasCalendario())
})

// ─── GET ABONOS ───────────────────────────────────────────────────────────────
export const getAbonos = asyncHandler(async (req: AuthRequest, res: Response) => {
  const usuarioId = req.user?.id ? Number(req.user.id) : undefined
  res.json(await reservaService.getAbonos(usuarioId))
})

// ─── AGREGAR ABONO A RESERVA ───────────────────────────────────────────────────
export const addAbono = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)
  const { amount, date, method, notes } = req.body
  res.status(201).json(await reservaService.createAbono(id, { amount, date, method, notes }))
})

// ─── OBTENER HORAS DISPONIBLES ──────────────────────────────────────────────────────
export const getAvailableHours = asyncHandler(async (req: Request, res: Response) => {
  const date = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date

  // ─── Validar formato YYYY-MM-DD ───────────────────────────────────────────
  const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
  if (!dateRegex.test(date)) {
    return res.status(400).json({
      message: 'Formato de fecha inválido. Use YYYY-MM-DD (ej: 2026-04-15)'
    })
  }

  // ─── Validar que sea una fecha real (ej: no 2026-02-31) ───────────────────
  const parsed = new Date(`${date}T00:00:00`)
  if (isNaN(parsed.getTime())) {
    return res.status(400).json({
      message: 'La fecha proporcionada no es válida'
    })
  }

  const excludeId = req.query.excludeId ? Number(req.query.excludeId) : undefined
  res.json(await reservaService.getAvailableHours(date, excludeId))
})

// ─── OBTENER POR ID  ────────────────────────────────────────────────────────────────
export const getById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const reserva = await reservaService.getReservaById(Number(id))
  if (req.user?.rol === 'CLIENTE') {
    const usuario = await prisma.usuario.findUnique({ where: { id: Number(req.user.id) } })
    if (reserva.clientEmail !== usuario?.email) {
      return res.status(403).json({ message: 'No tienes permiso para ver esta reserva.' })
    }
  }
  res.json(reserva)
})

// ─── CREAR ───────────────────────────────────────────────────────────────────
export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Admin envía clienteId explícitamente; Cliente solo puede crear para sí mismo
  const clienteId = req.body.clienteId || (req.user?.rol === 'CLIENTE' ? req.user?.id : undefined)
  if (!clienteId) {
    return res.status(400).json({ message: 'clienteId es requerido' })
  }
  const isAdmin = ['ADMIN', 'EMPLEADO'].includes(req.user?.rol ?? '')
  const data = { ...req.body, clienteId }
  res.status(201).json(await reservaService.createReserva(data, isAdmin))
})

// ─── ACTUALIZAR ───────────────────────────────────────────────────────────────────
export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const isAdmin = ['ADMIN', 'EMPLEADO'].includes(req.user?.rol ?? '')
  res.json(await reservaService.updateReserva(Number(id), req.body, isAdmin))
})

// ─── ANULAR ───────────────────────────────────────────────────────────────────
export const anular = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  res.json(await reservaService.anularReserva(Number(id), req.body.motivo))
})


// ─── DELETE ───────────────────────────────────────────────────────────────────
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  res.json(await reservaService.deleteReserva(Number(id)))
})

// ─── REPROGRAMAR ───────────────────────────────────────────────────────────────
export const reprogramar = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id      = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  const isAdmin = ['ADMIN', 'EMPLEADO'].includes(req.user?.rol ?? '')
  const { eventDate, startTime, endTime } = req.body
 
  res.json(await reservaService.reprogramarReserva(Number(id), { eventDate, startTime, endTime }, isAdmin))
})

// ─── FINALIZAR ────────────────────────────────────────────────────────────────
export const finalize = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
  res.json(await reservaService.finalizeReserva(Number(id)))
})