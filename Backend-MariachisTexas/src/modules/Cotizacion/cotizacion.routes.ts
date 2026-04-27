import { Router } from 'express'
import * as cotizacionController from './cotizacion.controller'
import { verifyToken } from '../../middlewares/Auth.middleware'
import { requireRole } from '../../middlewares/Role.middleware'

const router = Router()

// ─── PÚBLICAS — sin token ─────────────────────────────────────────────────────
// Formulario externo de cotización
router.post('/public', cotizacionController.create)

// Solo fecha/hora de cotizaciones EN_ESPERA — para el calendario del cliente
router.get('/public/disponibilidad', cotizacionController.getDisponibilidad)

// ─── PROTEGIDAS ───────────────────────────────────────────────────────────────
router.use(verifyToken)

router.get('/',    requireRole(['ADMIN', 'EMPLEADO']), cotizacionController.getAll)
router.get('/:id', requireRole(['ADMIN', 'EMPLEADO']), cotizacionController.getById)

router.put('/:id',             requireRole(['ADMIN', 'EMPLEADO']), cotizacionController.update)
router.patch('/:id/anular',    requireRole(['ADMIN', 'EMPLEADO']), cotizacionController.anular)
router.patch('/:id/convertir', requireRole(['ADMIN', 'EMPLEADO']), cotizacionController.convertir)

router.get('/:id/pdf', requireRole(['ADMIN', 'EMPLEADO']), cotizacionController.downloadPdf)

router.delete('/:id', requireRole(['ADMIN']), cotizacionController.remove)

export default router