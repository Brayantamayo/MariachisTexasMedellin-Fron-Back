import prisma from '../../config/prisma'

// ─── HELPERS DE FECHA ─────────────────────────────────────────────────────────
const toLocalDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const toLocalTime = (d: Date): string =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

// ─── MAPEO ────────────────────────────────────────────────────────────────────
const mapToRehearsal = (e: any) => ({
  id:            String(e.id),
  title:         e.nombre,
  location:      e.lugar,
  address:       e.ubicacion ?? '',
  date:          toLocalDate(e.fechaHora),
  time:          toLocalTime(e.fechaHora),
  notes:         '',
  repertoireIds: e.repertorios?.map((r: any) => String(r.repertorioId)) ?? [],
  status:        'Programado' as const,
  createdAt:     e.createdAt?.toISOString(),
  updatedAt:     e.updatedAt?.toISOString(),
})

// ─── VALIDAR DISPONIBILIDAD COMPLETA ─────────────────────────────────────────
// Valida contra: bloqueos, cotizaciones, reservas y otros ensayos
const validateDisponibilidad = async (date: string, time: string, excludeId?: number) => {
  const fechaHora = new Date(`${date}T${time}:00`)
  const dayStart  = new Date(`${date}T00:00:00`)
  const dayEnd    = new Date(`${date}T23:59:59`)

  // Buffer de 1 hora antes y después del ensayo
  const bufferAntes   = new Date(fechaHora.getTime() - 60 * 60 * 1000)
  const bufferDespues = new Date(fechaHora.getTime() + 60 * 60 * 1000)

  // 1. Bloqueos manuales
  const bloqueo = await prisma.bloqueoCalendario.findFirst({
    where: {
      fechaInicio: { lte: bufferDespues },
      fechaFin:    { gte: bufferAntes }
    }
  })
  if (bloqueo) throw new Error(
    `Fecha bloqueada: ${bloqueo.motivo?.replace(/^[A-Z_]+:/, '').split('|')[0] || 'No disponible'}`
  )

  // ✅ 2. Cotizaciones activas que se crucen (con buffer)
  const cotActivas = await prisma.cotizacion.findMany({
    where: {
      fechaEvento: { gte: dayStart, lte: dayEnd },
      estado: { in: ['EN_ESPERA', 'CONVERTIDA'] }
    }
  })
  for (const cot of cotActivas) {
    // El ensayo no puede estar dentro del rango de la cotización ni en sus buffers
    if (fechaHora >= bufferAntes && fechaHora <= bufferDespues) {
      if (bufferAntes < cot.horaFin && bufferDespues > cot.horaInicio) {
        throw new Error(
          `Conflicto con cotización activa (${toLocalTime(cot.horaInicio)} - ${toLocalTime(cot.horaFin)})`
        )
      }
    }
    if (fechaHora >= cot.horaInicio && fechaHora < cot.horaFin) {
      throw new Error(
        `Horario bloqueado por cotización activa (${toLocalTime(cot.horaInicio)} - ${toLocalTime(cot.horaFin)})`
      )
    }
  }

  // ✅ 3. Reservas activas que se crucen (con buffer de 1 hora)
  const reservas = await prisma.reserva.findMany({
    where: {
      estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
      cotizacion: { fechaEvento: { gte: dayStart, lte: dayEnd } }
    },
    include: { cotizacion: true }
  })
  for (const r of reservas) {
    const reservaInicio = r.cotizacion.horaInicio
    const reservaFin    = r.cotizacion.horaFin
    // Ensayo no puede estar dentro del rango de la reserva ni en su buffer
    const reservaBufferAntes   = new Date(reservaInicio.getTime() - 60 * 60 * 1000)
    const reservaBufferDespues = new Date(reservaFin.getTime()    + 60 * 60 * 1000)
    if (fechaHora >= reservaBufferAntes && fechaHora < reservaBufferDespues) {
      throw new Error(
        `Conflicto con reserva existente (${toLocalTime(reservaInicio)} - ${toLocalTime(reservaFin)})`
      )
    }
  }

  // 4. Otros ensayos en el mismo horario
  const ensayoConflicto = await prisma.ensayo.findFirst({
    where: {
      fechaHora: {
        gte: bufferAntes,
        lte: bufferDespues,
      },
      id: excludeId ? { not: excludeId } : undefined
    }
  })
  if (ensayoConflicto) throw new Error(
    `Ya existe un ensayo programado a las ${toLocalTime(ensayoConflicto.fechaHora)}`
  )
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

// ─── GET DISPONIBILIDAD PÚBLICA ───────────────────────────────────────────────
export const getDisponibilidadPublica = async () => {
  const ensayos = await prisma.ensayo.findMany({
    orderBy: { fechaHora: 'asc' }
  })
  return ensayos.map(e => ({
    fecha: toLocalDate(e.fechaHora),
    hora:  toLocalTime(e.fechaHora),
  }))
}

// ─── CREATE ───────────────────────────────────────────────────────────────────
export const createEnsayo = async (data: any) => {
  if (!data.title?.trim())    throw new Error('El nombre es requerido')
  if (!data.location?.trim()) throw new Error('El lugar es requerido')
  if (!data.date)             throw new Error('La fecha es requerida')
  if (!data.time)             throw new Error('La hora es requerida')

  // ✅ Validación completa: bloqueos + cotizaciones + reservas + otros ensayos
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

  const date = data.date ?? toLocalDate(exists.fechaHora)
  const time = data.time ?? toLocalTime(exists.fechaHora)

  // ✅ Validar disponibilidad completa al editar, excluyendo el ensayo actual
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