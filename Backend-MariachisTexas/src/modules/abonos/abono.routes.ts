import { Router } from 'express'
import * as abonoController from './abono.controller'
import { verifyToken } from '../../middlewares/Auth.middleware'
import { requireRole } from '../../middlewares/Role.middleware'

const router = Router()

router.use(verifyToken)

router.get('/', abonoController.getAll)
router.get('/download/pdf', abonoController.downloadPdf)
router.post('/', requireRole(['ADMIN', 'EMPLEADO', 'CLIENTE']), abonoController.create)
router.post('/convert-to-venta', requireRole(['ADMIN', 'EMPLEADO']), abonoController.convertToVenta)

export default router
