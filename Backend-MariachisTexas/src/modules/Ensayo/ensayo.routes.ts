import { Router } from 'express'
import * as ensayoController from './ensayo.controller'
import { verifyToken } from '../../middlewares/Auth.middleware'
import { requireRole } from '../../middlewares/Role.middleware'
import { asyncHandler } from '../../middlewares/Asynchandler'

const router = Router()

// ─── PÚBLICA — solo fecha/hora para el calendario ─────────────────────────────
router.get('/public/disponibilidad', asyncHandler(ensayoController.getDisponibilidad))

// ─── PROTEGIDAS ───────────────────────────────────────────────────────────────
router.use(verifyToken)
router.use(requireRole(['ADMIN', 'EMPLEADO']))

router.get('/',    asyncHandler(ensayoController.getAll))
router.get('/:id', asyncHandler(ensayoController.getById))
router.post('/',   asyncHandler(ensayoController.create))
router.put('/:id', asyncHandler(ensayoController.update))

router.delete('/:id', requireRole(['ADMIN']), asyncHandler(ensayoController.remove))

export default router