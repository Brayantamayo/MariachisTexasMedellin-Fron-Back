import { Router } from 'express'
import * as cotizacionController from './cotizacion.controller'
import { verifyToken } from '../../middlewares/Auth.middleware'
import { requireRole } from '../../middlewares/Role.middleware'

const router = Router()

// ─── PÚBLICA — formulario landing ─────────────────────────────────────────────
router.post('/public', cotizacionController.create)

// ─── PROTEGIDAS — solo ADMIN ──────────────────────────────────────────────────
router.use(verifyToken)
router.use(requireRole(['ADMIN']))

router.get('/',    cotizacionController.getAll)
router.get('/:id', cotizacionController.getById)
router.put('/:id',             cotizacionController.update)
router.patch('/:id/anular',    cotizacionController.anular)
router.patch('/:id/convertir', cotizacionController.convertir)
router.delete('/:id',          cotizacionController.remove) // ✅ nuevo

export default router