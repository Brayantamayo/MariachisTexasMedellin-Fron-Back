import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import prisma from '../../config/prisma'
import { TipoDocumento, ZonaServicio } from '../../generated/prisma'
import { AppError } from '../../utils/AppError'
import { ClienteCreateSchema, ClienteUpdateSchema } from '../schemas'


// ─── FUNCIONES ───────────────────────────────────────────────────────────────

const generatePassword = () => randomBytes(8).toString('hex')

// Registrar cliente (sin usuario, para admin)
export const crearCliente = async (data: unknown) => {
  const parsed = ClienteCreateSchema.safeParse(data)
  if (!parsed.success) throw new AppError('Datos inválidos', 400)

  const { nombre, email, numeroDocumento, apellido } = parsed.data

  const [emailExisteUsuario, emailExisteCliente, documentoExiste] = await Promise.all([
    prisma.usuario.findUnique({ where: { email } }),
    prisma.cliente.findUnique({ where: { email } }),
    prisma.cliente.findUnique({ where: { numeroDocumento } }),
  ])

  if (emailExisteUsuario || emailExisteCliente) throw new AppError('Email ya registrado', 409)
  if (documentoExiste) throw new AppError('Documento ya registrado', 409)

  const password = generatePassword()
  const hashedPassword = await bcrypt.hash(password, 10)

  const cliente = await prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        rolId: 3,
      }
    })

    return tx.cliente.create({
      data: {
        usuarioId: usuario.id,
        email,
        apellido,
        tipoDocumento: parsed.data.tipoDocumento as TipoDocumento,
        numeroDocumento,
        fechaNacimiento: new Date(parsed.data.fechaNacimiento),
        telefonoPrincipal: parsed.data.telefonoPrincipal,
        telefonoAlternativo: parsed.data.telefonoAlternativo,
        ciudad: parsed.data.ciudad,
        barrio: parsed.data.barrio,
        direccion: parsed.data.direccion,
        zonaServicio: parsed.data.zonaServicio as ZonaServicio,
        foto: parsed.data.foto,
      },
      include: {
        usuario: {
          select: {
            nombre: true,
            email: true,
            estado: true,
          }
        }
      }
    })
  })

  return cliente
}

// Buscar clientes (por query en nombre, apellido, email, documento)
export const buscarClientes = async (query: string) => {
  if (!query || query.trim().length < 2) throw new AppError('Query demasiado corta', 400)

  const clientes = await prisma.cliente.findMany({
    where: {
      OR: [
        { usuario: { nombre: { contains: query, mode: 'insensitive' } } },
        { apellido: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { numeroDocumento: { contains: query } },
      ],
    },
    include: {
      usuario: { select: { nombre: true, email: true, estado: true } },
      _count: { select: { cotizaciones: true, abonos: true, ventas: true } },
    },
  })

  return clientes
}

// Listar clientes (sin paginación cuando no se envían page/limit)
export const listarClientes = async (page?: number, limit?: number) => {
  const include = {
    usuario: { select: { nombre: true, email: true, estado: true } },
    _count: { select: { cotizaciones: true, abonos: true, ventas: true } },
  }

  if (!limit || limit <= 0) {
    const clientes = await prisma.cliente.findMany({
      orderBy: { createdAt: 'desc' },
      include,
    })
    return {
      clientes,
      pagination: {
        page: 1,
        limit: clientes.length,
        total: clientes.length,
        pages: 1,
      },
    }
  }

  const skip = (page && page > 1) ? (page - 1) * limit : 0

  const [clientes, total] = await Promise.all([
    prisma.cliente.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include,
    }),
    prisma.cliente.count(),
  ])

  return {
    clientes,
    pagination: {
      page: page || 1,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }
}

// Ver detalles de cliente
export const obtenerClientePorId = async (id: number) => {
  const cliente = await prisma.cliente.findUnique({
    where: { id },
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

  const clienteExiste = await prisma.cliente.findUnique({ where: { id } })
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

  // Si se intenta desactivar el cliente, verificar que no tenga reservas activas
  if (parsed.data.activo === false) {
    const reservasCount = await prisma.reserva.count({
      where: {
        cotizacion: {
          clienteId: id
        },
        estado: { in: ['PENDIENTE', 'CONFIRMADA'] }
      }
    })

    if (reservasCount > 0) {
      throw new AppError('No se puede desactivar el cliente porque tiene reservas activas', 400)
    }
  }

  const updateData: any = { ...parsed.data }
  if (parsed.data.fechaNacimiento) updateData.fechaNacimiento = new Date(parsed.data.fechaNacimiento)
  if (parsed.data.tipoDocumento) updateData.tipoDocumento = parsed.data.tipoDocumento as TipoDocumento
  if (parsed.data.zonaServicio) updateData.zonaServicio = parsed.data.zonaServicio as ZonaServicio

  // Actualizar cliente y sincronizar estado del usuario si cambió activo
  await prisma.$transaction(async (tx) => {
    await tx.cliente.update({
      where: { id },
      data: updateData,
    })

    // Si cambió el estado del cliente y tiene usuario asociado, sincronizar
    if (parsed.data.activo !== undefined && clienteExiste.usuarioId) {
      await tx.usuario.update({
        where: { id: clienteExiste.usuarioId },
        data: { estado: parsed.data.activo },
      })
    }
  })

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: { usuario: { select: { nombre: true, email: true, estado: true } } },
  })

  return cliente
}

// Eliminar cliente (soft delete)
export const eliminarCliente = async (id: number) => {
  const cliente = await prisma.cliente.findUnique({ where: { id } })
  if (!cliente) throw new AppError('Cliente no encontrado', 404)

  const reservasCount = await prisma.reserva.count({
    where: {
      cotizacion: {
        clienteId: id
      },
      estado: { in: ['PENDIENTE', 'CONFIRMADA'] }
    }
  })

  if (reservasCount > 0) {
    throw new AppError('No se puede eliminar el cliente porque tiene reservas activas', 400)
  }

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

  // Si se intenta desactivar el cliente, verificar que no tenga reservas activas
  if (!activo) {
    const reservasCount = await prisma.reserva.count({
      where: {
        cotizacion: {
          clienteId: id
        },
        estado: { in: ['PENDIENTE', 'CONFIRMADA'] }
      }
    })

    if (reservasCount > 0) {
      throw new AppError('No se puede desactivar el cliente porque tiene reservas activas', 400)
    }
  }

  // Actualizar cliente y sincronizar estado del usuario
  await prisma.$transaction(async (tx) => {
    await tx.cliente.update({
      where: { id },
      data: { activo },
    })

    // Si el cliente tiene usuario asociado, sincronizar estado
    if (cliente.usuarioId) {
      await tx.usuario.update({
        where: { id: cliente.usuarioId },
        data: { estado: activo },
      })
    }
  })

  const updatedCliente = await prisma.cliente.findUnique({
    where: { id },
    include: { usuario: { select: { nombre: true, email: true, estado: true } } },
  })

  return updatedCliente
}
