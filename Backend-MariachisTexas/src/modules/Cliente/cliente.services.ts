import prisma from '../../config/prisma'
import { TipoDocumento, ZonaServicio } from '../../generated/prisma'
import { AppError } from '../../utils/AppError'
import { z } from 'zod'

// ─── ESQUEMAS ─────────────────────────────────────────────────────────────────

const ClienteCreateSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase().trim(),
  apellido: z.string().trim().min(2, 'Apellido requerido'),
  tipoDocumento: z.enum(['CC', 'CE', 'PAS']),
  numeroDocumento: z.string().trim().regex(/^\d{6,12}$/, 'Documento inválido'),
  fechaNacimiento: z.string().refine(d => !isNaN(Date.parse(d)), 'Fecha inválida'),
  telefonoPrincipal: z.string().trim().regex(/^3\d{9}$/, 'Teléfono inválido'),
  telefonoAlternativo: z.string().optional(),
  ciudad: z.string().trim().min(2, 'Ciudad requerida'),
  barrio: z.string().trim().min(2, 'Barrio requerido'),
  direccion: z.string().trim().min(5, 'Dirección requerida'),
  zonaServicio: z.enum(['URBANA', 'RURAL']),
  foto: z.string().url().optional(),
})

const ClienteUpdateSchema = ClienteCreateSchema.partial()

// ─── FUNCIONES ───────────────────────────────────────────────────────────────

// Registrar cliente (sin usuario, para admin)
export const crearCliente = async (data: unknown) => {
  const parsed = ClienteCreateSchema.safeParse(data)
  if (!parsed.success) throw new AppError('Datos inválidos', 400)

  const { email, numeroDocumento } = parsed.data

  const [emailExiste, documentoExiste] = await Promise.all([
    prisma.cliente.findUnique({ where: { email } }),
    prisma.cliente.findUnique({ where: { numeroDocumento } }),
  ])

  if (emailExiste) throw new AppError('Email ya registrado', 409)
  if (documentoExiste) throw new AppError('Documento ya registrado', 409)

  const cliente = await prisma.cliente.create({
    data: {
      ...parsed.data,
      tipoDocumento: parsed.data.tipoDocumento as TipoDocumento,
      zonaServicio: parsed.data.zonaServicio as ZonaServicio,
      fechaNacimiento: new Date(parsed.data.fechaNacimiento),
    },
  })

  return cliente
}

// Buscar clientes (por query en nombre, apellido, email, documento)
export const buscarClientes = async (query: string) => {
  if (!query || query.trim().length < 2) throw new AppError('Query demasiado corta', 400)

  const clientes = await prisma.cliente.findMany({
    where: {
      OR: [
        { apellido: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { numeroDocumento: { contains: query } },
      ],
      activo: true,
    },
    include: {
      usuario: { select: { nombre: true, email: true } },
      _count: { select: { cotizaciones: true, abonos: true, ventas: true } },
    },
  })

  return clientes
}

// Listar clientes (con paginación)
export const listarClientes = async (page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit

  const [clientes, total] = await Promise.all([
    prisma.cliente.findMany({
      where: { activo: true },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        usuario: { select: { nombre: true, email: true } },
        _count: { select: { cotizaciones: true, abonos: true, ventas: true } },
      },
    }),
    prisma.cliente.count({ where: { activo: true } }),
  ])

  return {
    clientes,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }
}

// Ver detalles de cliente
export const obtenerClientePorId = async (id: number) => {
  const cliente = await prisma.cliente.findUnique({
    where: { id, activo: true },
    include: {
      usuario: { select: { nombre: true, email: true, estado: true } },
      cotizaciones: {
        select: {
          id: true,
          estado: true,
          totalEstimado: true,
          fechaEvento: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      abonos: {
        select: {
          id: true,
          monto: true,
          fechaPago: true,
          metodoPago: true,
        },
        orderBy: { fechaPago: 'desc' },
        take: 5,
      },
      ventas: {
        select: {
          id: true,
          estado: true,
          montoTotal: true,
          fechaVenta: true,
        },
        orderBy: { fechaVenta: 'desc' },
        take: 5,
      },
      _count: { select: { cotizaciones: true, abonos: true, ventas: true } },
    },
  })

  if (!cliente) throw new AppError('Cliente no encontrado', 404)

  return cliente
}

// Editar cliente
export const actualizarCliente = async (id: number, data: unknown) => {
  const parsed = ClienteUpdateSchema.safeParse(data)
  if (!parsed.success) throw new AppError('Datos inválidos', 400)

  const clienteExiste = await prisma.cliente.findUnique({ where: { id, activo: true } })
  if (!clienteExiste) throw new AppError('Cliente no encontrado', 404)

  // Verificar unicidad si se cambia email o documento
  if (parsed.data.email && parsed.data.email !== clienteExiste.email) {
    const emailExiste = await prisma.cliente.findUnique({ where: { email: parsed.data.email } })
    if (emailExiste) throw new AppError('Email ya registrado', 409)
  }

  if (parsed.data.numeroDocumento && parsed.data.numeroDocumento !== clienteExiste.numeroDocumento) {
    const documentoExiste = await prisma.cliente.findUnique({ where: { numeroDocumento: parsed.data.numeroDocumento } })
    if (documentoExiste) throw new AppError('Documento ya registrado', 409)
  }

  const updateData: any = { ...parsed.data }
  if (parsed.data.fechaNacimiento) updateData.fechaNacimiento = new Date(parsed.data.fechaNacimiento)
  if (parsed.data.tipoDocumento) updateData.tipoDocumento = parsed.data.tipoDocumento as TipoDocumento
  if (parsed.data.zonaServicio) updateData.zonaServicio = parsed.data.zonaServicio as ZonaServicio

  const cliente = await prisma.cliente.update({
    where: { id },
    data: updateData,
  })

  return cliente
}

// Eliminar cliente (soft delete)
export const eliminarCliente = async (id: number) => {
  const cliente = await prisma.cliente.findUnique({ where: { id, activo: true } })
  if (!cliente) throw new AppError('Cliente no encontrado', 404)

  await prisma.cliente.update({
    where: { id },
    data: { activo: false },
  })

  return { message: 'Cliente eliminado exitosamente' }
}

// Cambiar estado de cliente
export const cambiarEstadoCliente = async (id: number, activo: boolean) => {
  const cliente = await prisma.cliente.findUnique({ where: { id } })
  if (!cliente) throw new AppError('Cliente no encontrado', 404)

  const updatedCliente = await prisma.cliente.update({
    where: { id },
    data: { activo },
  })

  return updatedCliente
}
