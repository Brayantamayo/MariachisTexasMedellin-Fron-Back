import { Router } from 'express'
import * as usuarioController from '../usuarios/usuario.controller'
import { authMiddleware } from '../../middlewares/Auth.middleware'
import { roleMiddleware } from '../../middlewares/Role.middleware'

const router = Router()

// ─── RUTA PÚBLICA PARA REGISTRO ──────────────────────────────────────────────
// POST /api/usuarios/register
router.post('/register', usuarioController.register)

// ─── RUTAS PROTEGIDAS ─────────────────────────────────────────────────────────
// Todas las rutas requieren autenticación y permisos de admin

router.use(authMiddleware)
router.use(roleMiddleware(['ADMIN'])) // Solo admins pueden gestionar usuarios

// GET /api/usuarios
router.get('/', usuarioController.getAll)

// GET /api/usuarios/:id
router.get('/:id', usuarioController.getById)

// POST /api/usuarios
router.post('/', usuarioController.create)

// PUT /api/usuarios/:id
router.put('/:id', usuarioController.update)

// DELETE /api/usuarios/:id
router.delete('/:id', usuarioController.remove)

export default router