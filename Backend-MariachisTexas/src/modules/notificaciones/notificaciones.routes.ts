import { Router } from 'express'
import { verifyToken } from '../../middlewares/Auth.middleware'
import { requireRole } from '../../middlewares/Role.middleware'
import * as notificacionesController from './notificaciones.controller'

const router = Router()

// Proteger la ruta para administradores y empleados únicamente
router.use(verifyToken)
router.get('/', requireRole(['ADMIN', 'EMPLEADO']), notificacionesController.getAll)

export default router
