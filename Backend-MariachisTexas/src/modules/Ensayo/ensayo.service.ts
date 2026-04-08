import prisma from '../../config/prisma'
import { EnsayoCreateSchema, EnsayoUpdateSchema, zodError } from '../schemas'
import { validarAnticipacionMismoDia, toLocalDate, toLocalTime } from '../../utils/date.helpers'
import { AppError } from '../../utils/AppError'
import { mapToRehearsal }           from './helpers/Ensayo.mappers'
import { validateDisponibilidad }   from './helpers/Ensayo.validators'
import type { EnsayoConRelaciones } from './helpers/Ensayo.mappers'
import type { EnsayoCreateInput, EnsayoUpdateInput, RehearsalResponse } from '../../types/interfaces'

// ─── OBTENER ──────────────────────────────────────────────────────────────────
export const getEnsayos = async (): Promise<RehearsalResponse[]> => {
  const ensayos = await prisma.ensayo.findMany({
    include:  { repertorios: true },
    orderBy:  { fechaHora: 'desc' },
  })
  return ensayos.map(e => mapToRehearsal(e as EnsayoConRelaciones))
}
// ─── BUSCAR POR ID──────────────────────────────────────────────────────────────────
export const getEnsayoById = async (id: number): Promise<RehearsalResponse> => {
  const ensayo = await prisma.ensayo.findUnique({
    where:   { id },
    include: { repertorios: true },
  })
  if (!ensayo) throw new AppError('Ensayo no encontrado', 404)
  return mapToRehearsal(ensayo as EnsayoConRelaciones)
}
/// ─── OBTENER DISPONIBILIDAD PUBLICA PARA COTIZACION───────────────────────────────────────────────────────────
export const getDisponibilidadPublica = async () => {
  const ensayos = await prisma.ensayo.findMany({
    where:   { estado: 'PENDIENTE' },
    orderBy: { fechaHora: 'asc' },
  })
  return ensayos.map(e => ({ fecha: toLocalDate(e.fechaHora), hora: toLocalTime(e.fechaHora) }))
}

// ─── CREAR ───────────────────────────────────────────────────────────────────
export const createEnsayo = async (data: EnsayoCreateInput): Promise<RehearsalResponse> => {
  //  Zod ya hace trim y valida vacío — no se necesita trim manual
  const parsed = EnsayoCreateSchema.safeParse(data)
  if (!parsed.success) throw new AppError(zodError(parsed.error), 400)

  const { title, location, address, date, time, repertoireIds } = parsed.data

  validarAnticipacionMismoDia(date, time)
  await validateDisponibilidad(date, time)

  // ✅ Transacción + include en el create: evita la query extra de getEnsayoById
  const ensayo = await prisma.$transaction(async (tx) => {
    const e = await tx.ensayo.create({
      data: {
        nombre:    title,
        fechaHora: new Date(`${date}T${time}:00`),
        lugar:     location,
        ubicacion: address ?? null,
        estado:    'PENDIENTE',
      },
      include: { repertorios: true },
    })

    if (repertoireIds?.length) {
      await tx.ensayoRepertorio.createMany({
        data: repertoireIds.map((rid: string | number) => ({
          ensayoId:     e.id,
          repertorioId: Number(rid),
        })),
      })

      // ✅ Retornar con las relaciones ya creadas para no hacer query extra
      return tx.ensayo.findUnique({
        where:   { id: e.id },
        include: { repertorios: true },
      })
    }

    return e
  })

  return mapToRehearsal(ensayo as EnsayoConRelaciones)
}

// ─── ACTUALIZAR ───────────────────────────────────────────────────────────────────
export const updateEnsayo = async (id: number, data: EnsayoUpdateInput): Promise<RehearsalResponse> => {
  const exists = await prisma.ensayo.findUnique({ where: { id } })
  if (!exists) throw new AppError('Ensayo no encontrado', 404)

  if (exists.estado === 'LISTO') {
    const soloEstado = Object.keys(data).every(k => k === 'status')
    if (!soloEstado)
      throw new AppError(
        'No se puede editar un ensayo completado. Solo puedes cambiar su estado o eliminarlo.',
        409
      )
  }

  // ✅ Zod ya hace trim y valida vacío — no se necesita trim manual
  const parsed = EnsayoUpdateSchema.safeParse(data)
  if (!parsed.success) throw new AppError(zodError(parsed.error), 400)

  const date = parsed.data.date ?? toLocalDate(exists.fechaHora)
  const time = parsed.data.time ?? toLocalTime(exists.fechaHora)

  if (parsed.data.date || parsed.data.time) {
    validarAnticipacionMismoDia(date, time)
    await validateDisponibilidad(date, time, id)
  }

  const estadoDB = parsed.data.status === 'LISTO'     ? 'LISTO'
                : parsed.data.status === 'PENDIENTE' ? 'PENDIENTE'
                : undefined

  await prisma.$transaction(async (tx) => {
    await tx.ensayo.update({
      where: { id },
      data: {
        nombre:    parsed.data.title    ?? exists.nombre,
        fechaHora: new Date(`${date}T${time}:00`),
        lugar:     parsed.data.location ?? exists.lugar,
        ubicacion: parsed.data.address  ?? exists.ubicacion,
        ...(estadoDB !== undefined ? { estado: estadoDB } : {}),
      },
    })

    if (parsed.data.repertoireIds !== undefined) {
      await tx.ensayoRepertorio.deleteMany({ where: { ensayoId: id } })
      if (parsed.data.repertoireIds.length) {
        await tx.ensayoRepertorio.createMany({
          data: parsed.data.repertoireIds.map((rid: string | number) => ({
            ensayoId:     id,
            repertorioId: Number(rid),
          })),
        })
      }
    }
  })

  return getEnsayoById(id)
}

// ─── CAMBIAR DE ESTADO ────────────────────────────────────────────────────────────
export const toggleEstadoEnsayo = async (id: number): Promise<RehearsalResponse> => {
  const exists = await prisma.ensayo.findUnique({ where: { id } })
  if (!exists) throw new AppError('Ensayo no encontrado', 404)

  const nuevoEstado = exists.estado === 'PENDIENTE' ? 'LISTO' : 'PENDIENTE'
  const ensayo = await prisma.ensayo.update({
    where:   { id },
    data:    { estado: nuevoEstado },
    include: { repertorios: true },
  })
  return mapToRehearsal(ensayo as EnsayoConRelaciones)
}

// ─── ELIMININAR ───────────────────────────────────────────────────────────────────
export const deleteEnsayo = async (id: number) => {
  const exists = await prisma.ensayo.findUnique({ where: { id } })
  if (!exists) throw new AppError('Ensayo no encontrado', 404)

  await prisma.ensayo.delete({ where: { id } })
  return { message: 'Ensayo eliminado correctamente' }
}