import { Router } from 'express'
import * as serviciosController from './servicios.controller'
import { verifyToken } from '../../middlewares/Auth.middleware'
import { requireRole } from '../../middlewares/Role.middleware'
const router = Router()

// ─── PÚBLICAS (sin token) ─────────────────────────────────────────────────────
router.get('/',   serviciosController.listar)   // el formulario de cotización necesita ver servicios
router.get('/:id', serviciosController.detalle) 

// ─── PROTEGIDAS (requieren token) ────────────────────────────────────────────
router.use(verifyToken) /////A partir de aquí, todas las rutas necesitan un token válido

router.post('/',         requireRole(['ADMIN'])   , serviciosController.crear)
router.put('/:id',         requireRole(['ADMIN'])   , serviciosController.editar)
router.patch('/:id/estado', requireRole(['ADMIN'])   , serviciosController.cambiarEstado)
router.delete('/:id',        requireRole(['ADMIN'])   , serviciosController.eliminar)

export default router