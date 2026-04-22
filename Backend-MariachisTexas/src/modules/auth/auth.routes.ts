import { Router } from 'express'
import { registro, loginController, recuperar, verificar, resetear, getRegistroToken, marcarToken } from './auth.controller'

const router = Router()

router.post('/registro', registro)
router.get('/registro-token/:token', getRegistroToken)          
router.patch('/registro-token/:token/usar', marcarToken)   
router.post('/login',    loginController)

router.post('/recuperar-password', recuperar)
router.post('/verificar-otp',     verificar)
router.post('/reset-password',     resetear)

export default router