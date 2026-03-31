import prisma from '../../../config/prisma'
import { normalizar } from '../../../utils/normalizar'
import { AppError } from '../../../utils/AppError'

// ─── verificarNombreDuplicado ─────────────────────────────────────────────────
// Verifica que no exista otro servicio con el mismo nombre (normalizado).
// Acepta excludeId para ignorar el registro actual en updates.
export const verificarNombreDuplicado = async (
  nombre:     string,
  excludeId?: number
): Promise<void> => {
  const todos = await prisma.servicio.findMany({
    where:  excludeId ? { id: { not: excludeId } } : {},
    select: { nombre: true },
  })
  const nombreNormalizado = normalizar(nombre)
  const similar = todos.find(s => normalizar(s.nombre) === nombreNormalizado)
  if (similar)
    throw new AppError(`Ya existe un servicio con un nombre similar: "${similar.nombre}"`, 409)
}