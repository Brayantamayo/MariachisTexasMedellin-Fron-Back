import { Router } from 'express'
import * as repertoireController from './Repertoire.controller'
import { verifyToken } from '../../middlewares/Auth.middleware'
import { requireRole } from '../../middlewares/Role.middleware'

const router = Router()

// ─── PÚBLICA ──────────────────────────────────────────────────────────────────
router.get('/public', repertoireController.getPublic)

// ─── PROTEGIDAS ───────────────────────────────────────────────────────────────
router.use(verifyToken)

router.get('/',    repertoireController.getAll)
router.get('/:id', repertoireController.getById)

router.post('/',            requireRole(['ADMIN', 'EMPLEADO']), repertoireController.create)
router.put('/:id',          requireRole(['ADMIN', 'EMPLEADO']), repertoireController.update)
router.patch('/:id/toggle', requireRole(['ADMIN', 'EMPLEADO']), repertoireController.toggle)
router.delete('/:id',       requireRole(['ADMIN']),             repertoireController.remove)

export default router