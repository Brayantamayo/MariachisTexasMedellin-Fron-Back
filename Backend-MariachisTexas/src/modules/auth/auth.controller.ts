import { Request, Response } from 'express'
import { registrarCliente, login, recuperarPassword, resetearPassword } from './auth.services'


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
    const { email, password } = req.body  ////// TODO: validar email y contraseña
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' })
    }
    const data = await login(email, password)
    return res.status(200).json(data) ////// TODO: verificar que el usuario esté activo
  } catch (error: any) {
    return res.status(401).json({ message: error.message })
  }
}


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

export const resetear = async (req: Request, res: Response) => {
  try {
    const { token, nuevaPassword, confirmarPassword } = req.body
    if (!token || !nuevaPassword || !confirmarPassword) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' })
    }
    const data = await resetearPassword(token, nuevaPassword, confirmarPassword)
    return res.status(200).json(data)
  } catch (error: any) {
    return res.status(400).json({ message: error.message })
  }
}