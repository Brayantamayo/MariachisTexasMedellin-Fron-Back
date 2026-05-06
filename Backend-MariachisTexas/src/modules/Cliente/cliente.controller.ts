import { Request, Response } from 'express'
import {
  crearCliente,
  buscarClientes,
  listarClientes,
  obtenerClientePorId,
  actualizarCliente,
  eliminarCliente,
  cambiarEstadoCliente,
} from './cliente.services'
import { asyncHandler } from '../../middlewares/Asynchandler'

// POST /api/clientes
export const registrarCliente = asyncHandler(async (req: Request, res: Response) => {
  const cliente = await crearCliente(req.body)
  res.status(201).json(cliente)
})

// GET /api/clientes/buscar?query=...
export const buscarCliente = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.query
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ message: 'Parámetro query requerido' })
  }
  const clientes = await buscarClientes(query)
  res.json({ clientes })
})

// GET /api/clientes?page=1&limit=10
export const listarCliente = asyncHandler(async (req: Request, res: Response) => {
  const page = req.query.page !== undefined ? parseInt(req.query.page as string) : undefined
  const limit = req.query.limit !== undefined ? parseInt(req.query.limit as string) : undefined
  const result = await listarClientes(page, limit)
  res.json(result)
})

// GET /api/clientes/:id
export const verDetallesCliente = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' })
  const cliente = await obtenerClientePorId(id)
  res.json({ cliente })
})

// PUT /api/clientes/:id
export const editarCliente = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' })
  const cliente = await actualizarCliente(id, req.body)
  res.json({ message: 'Cliente actualizado exitosamente', cliente })
})

// DELETE /api/clientes/:id
export const eliminarClienteController = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' })
  const result = await eliminarCliente(id)
  res.json(result)
})

// PATCH /api/clientes/:id/estado
export const cambiarEstadoClienteController = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' })
  const { activo } = req.body
  if (typeof activo !== 'boolean') {
    return res.status(400).json({ message: 'Campo activo requerido (boolean)' })
  }
  const cliente = await cambiarEstadoCliente(id, activo)
  res.json({ message: 'Estado del cliente actualizado', cliente })
})
