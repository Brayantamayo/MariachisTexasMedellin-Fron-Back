// src/modules/auth/perfil.controller.ts
import { Response }                        from 'express'
import { asyncHandler }                    from '../../middlewares/Asynchandler'
import { obtenerPerfil, actualizarPerfil } from './perfil.services'
import type { ActualizarPerfilDatos }      from '../../types/interfaces'

// Extender el tipo de Request para incluir el usuario del JWT
interface AuthRequest extends Request {
user?: { id: number; rol: string; permisos: string[] }
}


export const obtenerPerfilHandler = asyncHandler(async (req: AuthRequest, res: Response) => {const usuarioId = req.user!.id
const perfil    = await obtenerPerfil(usuarioId)
res.json({ ok: true, data: perfil })
})


export const actualizarPerfilHandler = asyncHandler(async (req: AuthRequest, res: Response) => {const usuarioId = req.user!.id

// Desestructuramos para excluir campos prohibidos
const { email, password, passwordConfirmation, rolId, ...datos } = req.body as
    ActualizarPerfilDatos & { email?: string; password?: string; passwordConfirmation?: string; rolId?: number }

const actualizado = await actualizarPerfil(usuarioId, datos)
res.json({ ok: true, data: actualizado, message: 'Perfil actualizado correctamente' })
})