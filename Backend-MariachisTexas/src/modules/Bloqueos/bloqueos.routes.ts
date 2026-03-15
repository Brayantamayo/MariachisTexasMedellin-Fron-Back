import { Router } from 'express'
import * as bloqueoController from './bloqueos.controller'
import { verifyToken } from '../../middlewares/Auth.middleware'
import { requireRole } from '../../middlewares/Role.middleware'

const router = Router()

// Pública — verificar estado de fecha (para formulario de cotización)
router.get('/check/:date', bloqueoController.checkDate)

// Protegidas
router.use(verifyToken)
router.get('/', bloqueoController.getAll)

// Solo ADMIN gestiona bloqueos
router.post('/',    requireRole(['ADMIN']), bloqueoController.create)
router.put('/:id',  requireRole(['ADMIN']), bloqueoController.update)
router.delete('/:id', requireRole(['ADMIN']), bloqueoController.remove)

export default router