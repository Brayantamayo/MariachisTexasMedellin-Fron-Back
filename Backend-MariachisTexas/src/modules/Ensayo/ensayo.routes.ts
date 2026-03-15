import { Router } from 'express'
import * as ensayoController from './ensayo.controller'
import { verifyToken } from '../../middlewares/Auth.middleware'
import { requireRole } from '../../middlewares/Role.middleware'

const router = Router()

router.use(verifyToken)
router.use(requireRole(['ADMIN', 'EMPLEADO']))

router.get('/',    ensayoController.getAll)
router.get('/:id', ensayoController.getById)
router.post('/',   requireRole(['ADMIN', 'EMPLEADO']), ensayoController.create)
router.put('/:id', requireRole(['ADMIN', 'EMPLEADO']), ensayoController.update)
router.delete('/:id', requireRole(['ADMIN']),           ensayoController.remove)

export default router