import { Router } from 'express'
import * as abonoController from './abono.controller'
import { verifyToken } from '../../middlewares/Auth.middleware'
import { requireRole } from '../../middlewares/Role.middleware'

const router = Router()

router.use(verifyToken)

// ⚠️ IMPORTANTE: Rutas más específicas ANTES de rutas genéricas
router.post('/convert-to-venta', requireRole(['ADMIN', 'EMPLEADO']), abonoController.convertToVenta)

// Rutas genéricas
router.get('/', abonoController.getAll)
router.post('/', requireRole(['ADMIN', 'EMPLEADO', 'CLIENTE']), abonoController.create)

export default router
