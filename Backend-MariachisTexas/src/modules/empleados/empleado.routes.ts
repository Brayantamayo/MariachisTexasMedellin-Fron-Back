import { Router } from 'express'
import * as empleadoController from './empleado.controller'
import { authMiddleware } from '../../middlewares/Auth.middleware'
import { roleMiddleware } from '../../middlewares/Role.middleware'

const router = Router()

// ─── RUTAS PROTEGIDAS ─────────────────────────────────────────────────────────
router.use(authMiddleware)

// Lectura permitida para ADMIN y EMPLEADO
router.get('/', roleMiddleware(['ADMIN', 'EMPLEADO']), empleadoController.getAll)
router.get('/:id', roleMiddleware(['ADMIN', 'EMPLEADO']), empleadoController.getById)

// Escritura solo para ADMIN
router.post('/', roleMiddleware(['ADMIN']), empleadoController.create)
router.put('/:id', roleMiddleware(['ADMIN']), empleadoController.update)
router.delete('/:id', roleMiddleware(['ADMIN']), empleadoController.remove)

export default router