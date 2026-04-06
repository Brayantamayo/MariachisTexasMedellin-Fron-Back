import { Router } from 'express'
import {
  registrarCliente,
  buscarCliente,
  listarCliente,
  verDetallesCliente,
  editarCliente,
  eliminarClienteController,
  cambiarEstadoClienteController,
} from './cliente.controller'
import { verifyToken } from '../../middlewares/Auth.middleware'
import { requireRole } from '../../middlewares/Role.middleware'

const router = Router()

// Todas las rutas requieren autenticación y rol ADMIN (asumiendo que solo admin puede gestionar clientes)
router.use(verifyToken)
router.use(requireRole(['ADMIN']))

// POST /api/clientes - Registrar cliente
router.post('/', registrarCliente)

// GET /api/clientes/buscar - Buscar clientes
router.get('/buscar', buscarCliente)

// GET /api/clientes - Listar clientes
router.get('/', listarCliente)

// GET /api/clientes/:id - Ver detalles
router.get('/:id', verDetallesCliente)

// PUT /api/clientes/:id - Editar cliente
router.put('/:id', editarCliente)

// DELETE /api/clientes/:id - Eliminar cliente
router.delete('/:id', eliminarClienteController)

// PATCH /api/clientes/:id/estado - Cambiar estado
router.patch('/:id/estado', cambiarEstadoClienteController)

export default router
