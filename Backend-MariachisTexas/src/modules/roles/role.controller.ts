import { Request, Response } from 'express'
import * as roleService from './role.services'
import { AuthRequest } from '../../middlewares/Auth.middleware'
import { asyncHandler } from '../../middlewares/Asynchandler'

// ─── GET EMPLEADO ROLE ID (PÚBLICO) ───────────────────────────────────────────
export const getEmpleadoRolId = asyncHandler(async (_req: Request, res: Response) => {
  const rolId = await roleService.getRolIdByName('EMPLEADO')
  res.json({ rolId })
})

// ─── GET PUBLIC LIST (PÚBLICO) — id + nombre de roles activos ─────────────────
export const getPublicList = asyncHandler(async (_req: Request, res: Response) => {
  const roles = await roleService.getRoles()
  res.json(roles.map((r: any) => ({
    id:          r.id,
    name:        r.name,
    description: r.description,
    isActive:    r.isActive,
  })))
})
                
// ─── GET ALL ──────────────────────────────────────────────────────────────────
export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await roleService.getRoles())
})

// ─── GET PERMISOS ────────────────────────────────────────────────────────────
export const getPermisos = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await roleService.getPermisos())
})

// ─── GET BY ID ───────────────────────────────────────────────────────────────
export const getById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)
  res.json(await roleService.getRolById(id))
})

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.status(201).json(await roleService.createRol(req.body))
})

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)
  res.json(await roleService.updateRol(id, req.body))
})

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id)
  res.json(await roleService.deleteRol(id))
})