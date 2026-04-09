import { Router } from 'express'
import * as dashboardController from './dashboard.controller'
import { verifyToken } from '../../middlewares/Auth.middleware'
import { requireRole } from '../../middlewares/Role.middleware'

const router = Router()

router.use(verifyToken)
router.get('/stats', requireRole(['ADMIN', 'EMPLEADO']), dashboardController.getStats)

export default router
