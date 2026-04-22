import { Router } from 'express'
import * as ensayoController from './ensayo.controller'
import { verifyToken } from '../../middlewares/Auth.middleware'
import { requireRole } from '../../middlewares/Role.middleware'

const router = Router()

// ─── PÚBLICA — sin autenticación ─────────────────────────────────────────────
router.get('/public/disponibilidad', ensayoController.getDisponibilidad)

// ─── PROTEGIDAS ───────────────────────────────────────────────────────────────
router.use(verifyToken)
router.use(requireRole(['ADMIN', 'EMPLEADO']))

router.get('/',                        ensayoController.getAll)
router.get('/:id',                     ensayoController.getById)
router.post('/',                       ensayoController.create)
router.patch('/:id/toggle-estado',     ensayoController.toggleEstado)  
router.put('/:id',                     ensayoController.update)

// ─── SOLO ADMIN ───────────────────────────────────────────────────────────────
router.delete('/:id', requireRole(['ADMIN']), ensayoController.remove)

export default router