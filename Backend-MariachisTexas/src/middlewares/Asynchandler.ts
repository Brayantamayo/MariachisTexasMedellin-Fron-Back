import { Request, Response, NextFunction } from 'express'

type AsyncFn = (req: any, res: Response, next: NextFunction) => Promise<any>

// ─── MAPEO DE MENSAJES → HTTP STATUS ─────────────────────────────────────────
const inferStatus = (message: string): number => {
  const msg = message.toLowerCase()

  // 404 — no encontrado
  if (msg.includes('no encontrad') || msg.includes('not found'))
    return 404

  // 409 — conflicto (duplicados, estado ya aplicado)
  if (
    msg.includes('ya exist') ||
    msg.includes('ya está registrad') ||
    msg.includes('ya está anulad') ||
    msg.includes('ya está confirmada') || // ✅ FIX: typo 'confirmd' → 'confirmada'
    msg.includes('el correo ya') ||
    msg.includes('el número de documento ya')
  ) return 409

  // 422 — error de validación / regla de negocio
  if (
    msg.includes('es requerido') ||
    msg.includes('no es válid') ||
    msg.includes('no puede ser') ||
    msg.includes('debe tener') ||
    msg.includes('debe ser mayor') ||
    msg.includes('formato') ||
    msg.includes('inválid') ||
    msg.includes('las contraseñas') ||
    msg.includes('debes seleccionar') ||
    msg.includes('el dominio')
  ) return 422

  // 401 — no autorizado
  if (
    msg.includes('credenciales') ||
    msg.includes('token') ||
    msg.includes('no autorizado')
  ) return 401

  // 403 — prohibido (reglas de negocio que bloquean la acción)
  if (
    msg.includes('solo se pueden') ||
    msg.includes('no se puede') ||
    msg.includes('no se puede eliminar') ||
    msg.includes('no se puede anular') ||
    msg.includes('no se puede desactivar') ||
    msg.includes('no tienes permiso')  // ✅ NUEVO: cubre mensajes de autorización
  ) return 403

  // 409 — conflicto de calendario
  if (
    msg.includes('bloqueada') ||
    msg.includes('conflicto de horario') ||
    msg.includes('no está disponible') ||
    msg.includes('ya existe una reserva') // ✅ NUEVO: cubre solapamiento de horario
  ) return 409

  // 400 — error genérico de cliente
  return 400
}

export const asyncHandler = (fn: AsyncFn) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // ─── Validar parámetros de la URL ─────────────────────────────────────
      for (const [key, value] of Object.entries(req.params)) {
        if (value === '' || value === undefined) {
          return res.status(400).json({ message: `El parámetro '${key}' es requerido` })
        }
        if (
          ['id', 'clienteId', 'reservaId', 'cotizacionId'].includes(key) &&
          isNaN(Number(value))
        ) {
          return res.status(400).json({ message: `El parámetro '${key}' debe ser un número válido` })
        }

       // ─── Validar parámetros de fecha ──────────────────────────────────
if (key === 'date') {
  const dateValue = Array.isArray(value) ? value[0] : value  // ✅ fix
  const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
  if (!dateRegex.test(dateValue)) {
    return res.status(400).json({
      message: 'Formato de fecha inválido. Use YYYY-MM-DD (ej: 2026-04-15)'
    })
  }
  const parsed = new Date(`${dateValue}T00:00:00`)
  if (isNaN(parsed.getTime())) {
    return res.status(400).json({ message: 'La fecha proporcionada no es válida' })
  }
}
      }

      await fn(req, res, next)

    } catch (e: any) {
      // ─── Errores de Prisma ────────────────────────────────────────────────
      if (e?.code) {
        switch (e.code) {
          case 'P2025':
            return res.status(404).json({ message: 'Registro no encontrado' })
          case 'P2002':
            return res.status(409).json({ message: 'Ya existe un registro con ese valor' })
          case 'P2003':
            return res.status(400).json({ message: 'El ID proporcionado no existe en la base de datos' })
          case 'P2000':
            return res.status(400).json({ message: 'El valor proporcionado es demasiado largo' })
          default:
            console.error('[Prisma Error]', e.code, e.message)
            return res.status(500).json({ message: 'Error en la base de datos' })
        }
      }

      // ─── Errores inesperados del servidor ─────────────────────────────────
      // Si no es un Error lanzado intencionalmente, loguear y retornar 500
      if (!(e instanceof Error)) {
        console.error('[Unexpected Error]', e)
        return res.status(500).json({ message: 'Error interno del servidor' })
      }

      // ─── Errores normales del negocio ─────────────────────────────────────
      const status = inferStatus(e.message ?? '')
      res.status(status).json({ message: e.message })
    }
  }