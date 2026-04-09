import { Router } from 'express'
import * as usuarioController from './usuarios.controller'
import { verifyToken } from '../../middlewares/Auth.middleware'
import { requireRole } from '../../middlewares/Role.middleware'

const router = Router()

router.use(verifyToken)
router.use(requireRole(['ADMIN']))

router.get('/', usuarioController.getAll)
router.get('/:id', usuarioController.getById)
router.post('/', usuarioController.create)
router.put('/:id', usuarioController.update)
router.delete('/:id', usuarioController.remove)

export default router
