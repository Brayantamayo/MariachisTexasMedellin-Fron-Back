// src/modules/auth/perfil.routes.ts
import { Router }             from 'express'
import * as perfilController  from './perfil.controller'
import { verifyToken }        from '../../middlewares/Auth.middleware'

const router = Router()

router.use(verifyToken)

router.get('/', perfilController.obtenerPerfilHandler)
router.put('/', perfilController.actualizarPerfilHandler)

export default router