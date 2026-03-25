import { Router } from 'express'
import { crear, listar, detalle, editar, cambiarEstado, eliminar } from './servicios.controller'
import { verifyToken } from '../../middlewares/Auth.middleware'

const router = Router()

// ─── PÚBLICAS (sin token) ─────────────────────────────────────────────────────
router.get('/',    listar)   // el formulario de cotización necesita ver servicios
router.get('/:id', detalle)

// ─── PROTEGIDAS (requieren token) ────────────────────────────────────────────
router.post('/',            verifyToken, crear)
router.put('/:id',          verifyToken, editar)
router.patch('/:id/estado', verifyToken, cambiarEstado)
router.delete('/:id',       verifyToken, eliminar)

export default router