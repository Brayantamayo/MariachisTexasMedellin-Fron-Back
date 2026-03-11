import prisma from '../../config/prisma'


// ─── CREAR SERVICIO ──────────────────────────────────────
export const crearServicio = async (data: {
  nombre:      string
  descripcion: string
  precio:      number
}) => {
  // 1. Validar campos obligatorios
  if (!data.nombre?.trim())      throw new Error('El nombre es obligatorio')
  if (!data.descripcion?.trim()) throw new Error('La descripción es obligatoria')
  if (!data.precio)              throw new Error('El precio es obligatorio')
  if (data.precio <= 0)          throw new Error('El precio debe ser mayor a 0')

  // 2. Validar nombre duplicado
  const existe = await prisma.servicio.findUnique({ where: { nombre: data.nombre } })
  if (existe) throw new Error('Ya existe un servicio con ese nombre')

  const servicio = await prisma.servicio.create({ data })

  return { message: 'Servicio creado correctamente', servicio }
}

// ─── LISTAR SERVICIOS ────────────────────────────────────
export const listarServicios = async (buscar?: string) => {
  const servicios = await prisma.servicio.findMany({
    where: buscar ? {
      OR: [
        { nombre:      { contains: buscar, mode: 'insensitive' } },
        { descripcion: { contains: buscar, mode: 'insensitive' } }
      ]
    } : {},
    orderBy: { createdAt: 'desc' }
  })

  return servicios
}

// ─── VER DETALLE ─────────────────────────────────────────
export const verServicio = async (id: number) => {
  const servicio = await prisma.servicio.findUnique({ where: { id } })
  if (!servicio) throw new Error('Servicio no encontrado')
  return servicio
}

// ─── EDITAR SERVICIO ─────────────────────────────────────
export const editarServicio = async (id: number, data: {
  nombre?:      string
  descripcion?: string
  precio?:      number
}) => {
  const servicio = await prisma.servicio.findUnique({ where: { id } })
  if (!servicio) throw new Error('Servicio no encontrado')

  if (data.precio !== undefined && data.precio <= 0) {
    throw new Error('El precio debe ser mayor a 0')
  }

  // Validar nombre duplicado si se cambia
  if (data.nombre && data.nombre !== servicio.nombre) {
    const existe = await prisma.servicio.findUnique({ where: { nombre: data.nombre } })
    if (existe) throw new Error('Ya existe un servicio con ese nombre')
  }

  const actualizado = await prisma.servicio.update({
    where: { id },
    data
  })

  return { message: 'Servicio actualizado correctamente', servicio: actualizado }
}

// ─── CAMBIAR ESTADO ──────────────────────────────────────
export const cambiarEstadoServicio = async (id: number) => {
  const servicio = await prisma.servicio.findUnique({ where: { id } })
  if (!servicio) throw new Error('Servicio no encontrado')

  const actualizado = await prisma.servicio.update({
    where: { id },
    data: { estado: !servicio.estado }
  })

  return {
    message: `Servicio ${actualizado.estado ? 'activado' : 'desactivado'} correctamente`,
    servicio: actualizado
  }
}

// ─── ELIMINAR SERVICIO ───────────────────────────────────
export const eliminarServicio = async (id: number) => {
  const servicio = await prisma.servicio.findUnique({ where: { id } })
  if (!servicio) throw new Error('Servicio no encontrado')

  await prisma.servicio.delete({ where: { id } })

  return { message: 'Servicio eliminado correctamente' }
}