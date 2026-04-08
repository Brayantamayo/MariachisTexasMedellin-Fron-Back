import { Request, Response } from 'express'
import * as empleadoService from './empleado.services'
import { AuthRequest } from '../../middlewares/Auth.middleware'
import { asyncHandler } from '../../middlewares/Asynchandler'

// ─── GET ALL ──────────────────────────────────────────────────────────────────
export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await empleadoService.getEmpleados())
})

// ─── GET BY ID ───────────────────────────────────────────────────────────────
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)
  res.json(await empleadoService.getEmpleadoById(id))
})

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Validar campos requeridos adicionales
  const data = req.body

  if (!data.numeroDocumento) {
    return res.status(400).json({ message: 'Número de documento es requerido' })
  }

  if (!data.fechaNacimiento) {
    return res.status(400).json({ message: 'Fecha de nacimiento es requerida' })
  }

  if (!data.telefonoPrincipal) {
    return res.status(400).json({ message: 'Teléfono principal es requerido' })
  }

  if (!data.barrio) {
    return res.status(400).json({ message: 'Barrio es requerido' })
  }

  if (!data.direccion) {
    return res.status(400).json({ message: 'Dirección es requerida' })
  }

  if (!data.instrumentoPrincipal) {
    return res.status(400).json({ message: 'Instrumento principal es requerido' })
  }

  res.status(201).json(await empleadoService.createEmpleado(data))
})

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)
  res.json(await empleadoService.updateEmpleado(id, req.body))
})

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)
  await empleadoService.deleteEmpleado(id)
  res.status(204).send()
})