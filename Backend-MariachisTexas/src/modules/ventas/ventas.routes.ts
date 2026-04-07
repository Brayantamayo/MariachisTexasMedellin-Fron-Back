import { Router } from 'express'
import * as ventaController from './venta.controller'
import { verifyToken } from '../../middlewares/Auth.middleware'
import { requireRole } from '../../middlewares/Role.middleware'

const router = Router()

// ─── PROTEGIDAS ───────────────────────────────────────────────────────────────
router.use(verifyToken)

// ⚠️ IMPORTANTE: Rutas más específicas ANTES de rutas con parámetros
router.get('/payable/reservations', ventaController.getPayableReservations)

// Lectura — Admin, Empleado y Cliente (cada uno filtra lo suyo en el controller)
router.get('/',    ventaController.getAll)
router.get('/:id', ventaController.getById)

// Crear — Admin y Empleado
router.post('/', requireRole(['ADMIN', 'EMPLEADO']), ventaController.create)

// Editar — Admin y Empleado
router.put('/:id', requireRole(['ADMIN', 'EMPLEADO']), ventaController.update)

// Eliminar — Admin
router.delete('/:id', requireRole(['ADMIN']), ventaController.remove)

export default router