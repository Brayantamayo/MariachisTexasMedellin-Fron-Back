import { Router } from 'express'
import { registro, loginController, recuperar, verificar ,resetear } from './auth.controller'

const router = Router()

router.post('/registro', registro)
router.post('/login',    loginController)

router.post('/recuperar-password', recuperar)
router.post('/verificar-otp',     verificar)
router.post('/reset-password',     resetear)

export default router