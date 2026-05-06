import { Router } from 'express'
import * as roleController from './role.controller'
import { verifyToken } from '../../middlewares/Auth.middleware'
import { requireRole } from '../../middlewares/Role.middleware'

const router = Router()

// ─── PÚBLICAS ──────────────────────────────────────────────────────────────────
// Endpoint público para obtener el ID del rol EMPLEADO
router.get('/public/empleado-rol-id', roleController.getEmpleadoRolId)
// Lista pública de roles activos — usada en formularios de creación de usuarios
router.get('/public/list',            roleController.getPublicList)

// ─── PROTEGIDAS ───────────────────────────────────────────────────────────────
router.use(verifyToken)

// Lectura — Solo Admin
router.get('/',         requireRole(['ADMIN']), roleController.getAll)
router.get('/permisos', requireRole(['ADMIN']), roleController.getPermisos)
router.get('/:id',      requireRole(['ADMIN']), roleController.getById)

// Crear — Solo Admin
router.post('/', requireRole(['ADMIN']), roleController.create)

// Editar — Solo Admin
router.put('/:id', requireRole(['ADMIN']), roleController.update)

// Eliminar — Solo Admin
router.delete('/:id', requireRole(['ADMIN']), roleController.remove)

export default router