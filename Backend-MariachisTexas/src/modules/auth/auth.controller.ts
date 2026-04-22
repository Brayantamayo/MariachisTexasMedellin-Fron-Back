import { Request, Response } from 'express'
import { registrarCliente, login, recuperarPassword, verificarOtp, resetearPassword, getRegistroToken as getRegistroTokenService, marcarTokenUsado } from './auth.services'
import { asyncHandler } from '../../middlewares/Asynchandler'

// POST /api/auth/registro
export const registro = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json(await registrarCliente(req.body))
})

// POST /api/auth/login
export const loginController = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ message: 'Email y contraseña son requeridos' })
  res.json(await login(email, password))
})

// POST /api/auth/recuperar
export const recuperar = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ message: 'El email es requerido' })
  res.json(await recuperarPassword(email))
})

// POST /api/auth/verificar
export const verificar = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body
  if (!email || !otp)
    return res.status(400).json({ message: 'Email y código son requeridos' })
  res.json(await verificarOtp(email, otp))
})

// POST /api/auth/resetear
export const resetear = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, nuevaPassword, confirmarPassword } = req.body
  if (!email || !otp || !nuevaPassword || !confirmarPassword)
    return res.status(400).json({ message: 'Todos los campos son requeridos' })
  res.json(await resetearPassword(email, otp, nuevaPassword, confirmarPassword))
})

export const getRegistroToken = asyncHandler(async (req: Request, res: Response) => {
  res.json(await getRegistroTokenService(req.params.token as string))  
})

export const marcarToken = asyncHandler(async (req: Request, res: Response) => {
  res.json(await marcarTokenUsado(req.params.token as string))  
})
