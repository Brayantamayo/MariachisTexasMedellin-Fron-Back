import prisma from '../../config/prisma'

// ─── MAPEO ────────────────────────────────────────────────────────────────────
const mapToRehearsal = (e: any) => ({
  id:            String(e.id),
  title:         e.nombre,
  location:      e.lugar,
  address:       e.ubicacion ?? '',
  date:          e.fechaHora.toISOString().split('T')[0],
  time:          e.fechaHora.toISOString().split('T')[1].slice(0,5),
  notes:         '',
  repertoireIds: e.repertorios?.map((r: any) => String(r.repertorioId)) ?? [],
  status:        'Programado' as const,
  createdAt:     e.createdAt?.toISOString(),
  updatedAt:     e.updatedAt?.toISOString(),
})

// ─── VALIDAR DISPONIBILIDAD ───────────────────────────────────────────────────
const validateDisponibilidad = async (date: string, time: string, excludeId?: number) => {
  const fechaHora = new Date(`${date}T${time}:00`)
  const dayStart  = new Date(`${date}T00:00:00`)
  const dayEnd    = new Date(`${date}T23:59:59`)

  // 1. Bloqueos manuales
  const bloqueo = await prisma.bloqueoCalendario.findFirst({
    where: {
      fechaInicio: { lte: fechaHora },
      fechaFin:    { gte: fechaHora }
    }
  })
  if (bloqueo) throw new Error(`Fecha bloqueada: ${bloqueo.motivo?.split('|')[0]?.replace(/^[A-Z_]+:/, '')}`)

  // 2. Cotizaciones activas que se crucen
  const cotActivas = await prisma.cotizacion.findMany({
    where: {
      fechaEvento: { gte: dayStart, lte: dayEnd },
      estado: { in: ['EN_ESPERA', 'CONVERTIDA'] }
    }
  })
  for (const cot of cotActivas) {
    if (fechaHora >= cot.horaInicio && fechaHora < cot.horaFin)
      throw new Error(`Horario bloqueado por cotización activa (${cot.horaInicio.toISOString().split('T')[1].slice(0,5)} - ${cot.horaFin.toISOString().split('T')[1].slice(0,5)})`)
  }

  // 3. Otros ensayos
  const ensayoConflicto = await prisma.ensayo.findFirst({
    where: {
      fechaHora,
      id: excludeId ? { not: excludeId } : undefined
    }
  })
  if (ensayoConflicto) throw new Error(`Ya existe un ensayo programado a las ${time}`)
}

// ─── GET ALL ──────────────────────────────────────────────────────────────────
export const getEnsayos = async () => {
  const ensayos = await prisma.ensayo.findMany({
    include: { repertorios: true },
    orderBy: { fechaHora: 'desc' }
  })
  return ensayos.map(mapToRehearsal)
}

// ─── GET BY ID ────────────────────────────────────────────────────────────────
export const getEnsayoById = async (id: number) => {
  const ensayo = await prisma.ensayo.findUnique({
    where: { id },
    include: { repertorios: true }
  })
  if (!ensayo) throw new Error('Ensayo no encontrado')
  return mapToRehearsal(ensayo)
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const createEnsayo = async (data: any) => {
  if (!data.title?.trim())    throw new Error('El nombre es requerido')
  if (!data.location?.trim()) throw new Error('El lugar es requerido')
  if (!data.date)             throw new Error('La fecha es requerida')
  if (!data.time)             throw new Error('La hora es requerida')

  await validateDisponibilidad(data.date, data.time)

  const ensayo = await prisma.$transaction(async (tx) => {
    const e = await tx.ensayo.create({
      data: {
        nombre:    data.title,
        fechaHora: new Date(`${data.date}T${data.time}:00`),
        lugar:     data.location,
        ubicacion: data.address ?? null,
      },
      include: { repertorios: true }
    })

    if (data.repertoireIds?.length) {
      await tx.ensayoRepertorio.createMany({
        data: data.repertoireIds.map((rid: string) => ({
          ensayoId:     e.id,
          repertorioId: Number(rid)
        }))
      })
    }
    return e
  })

  return getEnsayoById(ensayo.id)
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────
export const updateEnsayo = async (id: number, data: any) => {
  const exists = await prisma.ensayo.findUnique({ where: { id } })
  if (!exists) throw new Error('Ensayo no encontrado')

  const date = data.date ?? exists.fechaHora.toISOString().split('T')[0]
  const time = data.time ?? exists.fechaHora.toISOString().split('T')[1].slice(0,5)

  if (data.date || data.time) await validateDisponibilidad(date, time, id)

  await prisma.$transaction(async (tx) => {
    await tx.ensayo.update({
      where: { id },
      data: {
        nombre:    data.title    ?? exists.nombre,
        fechaHora: new Date(`${date}T${time}:00`),
        lugar:     data.location ?? exists.lugar,
        ubicacion: data.address  ?? exists.ubicacion,
      }
    })

    if (data.repertoireIds !== undefined) {
      await tx.ensayoRepertorio.deleteMany({ where: { ensayoId: id } })
      if (data.repertoireIds.length) {
        await tx.ensayoRepertorio.createMany({
          data: data.repertoireIds.map((rid: string) => ({
            ensayoId:     id,
            repertorioId: Number(rid)
          }))
        })
      }
    }
  })

  return getEnsayoById(id)
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export const deleteEnsayo = async (id: number) => {
  const exists = await prisma.ensayo.findUnique({ where: { id } })
  if (!exists) throw new Error('Ensayo no encontrado')
  await prisma.ensayo.delete({ where: { id } })
  return { message: 'Ensayo eliminado correctamente' }
}