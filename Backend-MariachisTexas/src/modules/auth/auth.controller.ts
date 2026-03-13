import { Request, Response } from 'express'
import { registrarCliente, login, recuperarPassword, verificarOtp, resetearPassword } from './auth.services'


///////REGISTRAR////////////////////////////////////////////////////////////////////////////////
export const registro = async (req: Request, res: Response) => {
  try {
    const data = await registrarCliente(req.body)
    return res.status(201).json(data)
  } catch (error: any) {
    return res.status(400).json({ message: error.message })
  }
}


///////LOGIN////////////////////////////////////////////////////////////////////////////////
export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' })
    }
    const data = await login(email, password)
    return res.status(200).json(data)
  } catch (error: any) {
    return res.status(401).json({ message: error.message })
  }
}


///////RECUPERAR CONTRASEÑA (envía OTP al correo)////////////////////////////////////////////////////////////////////////////////
export const recuperar = async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'El email es requerido' })
    const data = await recuperarPassword(email)
    return res.status(200).json(data)
  } catch (error: any) {
    return res.status(400).json({ message: error.message })
  }
}


///////VERIFICAR OTP////////////////////////////////////////////////////////////////////////////////
export const verificar = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email y código son requeridos' })
    }
    const data = await verificarOtp(email, otp)
    return res.status(200).json(data)
  } catch (error: any) {
    return res.status(400).json({ message: error.message })
  }
}


///////RESETEAR CONTRASEÑA////////////////////////////////////////////////////////////////////////////////
export const resetear = async (req: Request, res: Response) => {
  try {
    const { email, otp, nuevaPassword, confirmarPassword } = req.body
    if (!email || !otp || !nuevaPassword || !confirmarPassword) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' })
    }
    const data = await resetearPassword(email, otp, nuevaPassword, confirmarPassword)
    return res.status(200).json(data)
  } catch (error: any) {
    return res.status(400).json({ message: error.message })
  }
}