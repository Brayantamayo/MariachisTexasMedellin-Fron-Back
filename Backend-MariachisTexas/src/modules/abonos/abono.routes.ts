import { Router } from 'express'
import * as abonoController from './abono.controller'
import { verifyToken } from '../../middlewares/Auth.middleware'
import { requireRole } from '../../middlewares/Role.middleware'

const router = Router()

router.use(verifyToken)

// Rutas estáticas PRIMERO (antes de /:id)
/// Todos los abonos
router.get('/',                      abonoController.getAll)
/// Reservas pagables
router.get('/payable-reservations',  requireRole(['ADMIN', 'EMPLEADO']), abonoController.getPayableReservations)
/// Descargar PDF de todos los abonos (Admin, Empleado y Cliente)
router.get('/download/pdf',          abonoController.downloadPdf)

// Rutas con parámetro DESPUÉS
router.get('/:id/download/pdf',      abonoController.downloadAbonoPdf)

// Mutaciones
router.post('/',                     requireRole(['ADMIN', 'EMPLEADO']), abonoController.create)
/// Convertir a Venta — Admin y Empleado
router.post('/convert-to-venta',     requireRole(['ADMIN', 'EMPLEADO']), abonoController.convertToVenta)

export default router