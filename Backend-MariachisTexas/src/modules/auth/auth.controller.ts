import { Request, Response } from 'express'
import { registrarCliente, login, recuperarPassword, verificarOtp, resetearPassword } from './auth.services'
import { asyncHandler } from '../../middlewares/Asynchandler'

export const registro = asyncHandler(async (req: Request, res: Response) => {
  const data = await registrarCliente(req.body)
  res.status(201).json(data)
}, 400)

export const loginController = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password)
    return res.status(400).json({ message: 'Email y contraseña son requeridos' })
  const data = await login(email, password)
  res.status(200).json(data)
}, 401)

export const recuperar = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ message: 'El email es requerido' })
  const data = await recuperarPassword(email)
  res.status(200).json(data)
})

export const verificar = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body
  if (!email || !otp)
    return res.status(400).json({ message: 'Email y código son requeridos' })
  const data = await verificarOtp(email, otp)
  res.status(200).json(data)
})

export const resetear = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp, nuevaPassword, confirmarPassword } = req.body
  if (!email || !otp || !nuevaPassword || !confirmarPassword)
    return res.status(400).json({ message: 'Todos los campos son requeridos' })
  const data = await resetearPassword(email, otp, nuevaPassword, confirmarPassword)
  res.status(200).json(data)
})