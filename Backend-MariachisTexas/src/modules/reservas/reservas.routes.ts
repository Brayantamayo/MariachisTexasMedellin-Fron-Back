import { Router } from 'express'
import * as reservaController from './reserva.controller'
import { verifyToken } from '../../middlewares/Auth.middleware'
import { requireRole } from '../../middlewares/Role.middleware'

const router = Router()

// ─── PÚBLICAS (sin token) ─────────────────────────────────────────────────────
router.get('/available-hours/:date', reservaController.getAvailableHours)

// ─── PROTEGIDAS ───────────────────────────────────────────────────────────────
router.use(verifyToken)

router.get('/calendario', reservaController.getCalendario)
router.get('/',    reservaController.getAll)
router.get('/:id', reservaController.getById)

router.post('/', requireRole(['ADMIN', 'CLIENTE']), reservaController.create)

router.patch('/:id/anular',    requireRole(['ADMIN']), reservaController.anular)
router.patch('/:id/confirmar', requireRole(['ADMIN']), reservaController.confirmar)
router.delete('/:id',          requireRole(['ADMIN']), reservaController.remove) // ✅ nuevo

export default router