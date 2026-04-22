import { Request, Response } from 'express'
import * as empleadoService from './empleado.services'
import { EmpleadoCreateSchema, zodError } from '../schemas'
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
  // Validar con Zod schema
  const parsed = EmpleadoCreateSchema.safeParse(req.body)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    const firstError = Object.entries(fieldErrors)[0]
    if (firstError) {
      const [field, errors] = firstError
      return res.status(400).json({ message: `${field}: ${errors[0]}` })
    }
    return res.status(400).json({ message: 'Datos inválidos. Verifique los campos requeridos.' })
  }

  res.status(201).json(await empleadoService.createEmpleado(req.body))
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