import { Router } from 'express'
import { registro, loginController, recuperar, verificar, resetear, getRegistroToken, marcarToken, verificarDisponibilidad } from './auth.controller'

const router = Router()

///verifica si el emial no existe en la base de datos
router.get('/verificar-disponibilidad', verificarDisponibilidad)
// Registro y login
router.post('/registro', registro)
////Registro por cotizacion
router.get('/registro-token/:token', getRegistroToken)          
router.patch('/registro-token/:token/usar', marcarToken)   
// Login
router.post('/login',    loginController)

// Recuperar contraseña
router.post('/recuperar-password', recuperar)
router.post('/verificar-otp',     verificar)
router.post('/reset-password',     resetear)

export default router