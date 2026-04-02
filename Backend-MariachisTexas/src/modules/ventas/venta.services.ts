import prisma from '../../config/prisma'
import { VentaCreateSchema, VentaUpdateSchema, zodError } from '../schemas'
import type { VentaCreateInput, VentaUpdateInput } from '../../types/interfaces'

const mapToSale = (v: any) => ({
  id: String(v.id),
  date: v.fechaVenta?.toISOString() ?? '',
  type: v.tipo,
  clientName: v.cliente ? `${v.cliente.usuario?.nombre ?? ''} ${v.cliente.apellido ?? ''}`.trim() : '',
  clientId: String(v.clienteId),
  concept: v.reservaId ? `Reserva #${v.reservaId}` : 'Venta Directa',
  method: v.metodoPago,
  amount: Number(v.montoTotal),
  totalAmount: Number(v.montoTotal),
  pendingAmount: Number(v.montoTotal) - Number(v.montoPagado),
  reservationId: v.reservaId ? String(v.reservaId) : undefined,
  reservationStatus: v.reserva?.estado === 'CONFIRMADA' ? 'Confirmado' : 'Finalizado',
  status: v.estado === 'CONFIRMADO' ? 'Completado' : 'Anulado'
})

// ─── OBTENER VENTAS ───────────────────────────────────────────────────────────
export const getVentas = async (usuarioId?: number): Promise<any[]> => {
  let where: any = {}
  if (usuarioId) {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (usuario) {
      const cliente = await prisma.cliente.findUnique({ where: { email: usuario.email } })
      if (cliente) where.clienteId = cliente.id
    }
  }

  const ventas = await prisma.venta.findMany({
    where,
    include: {
      cliente: { include: { usuario: true } },
      reserva: true
    },
    orderBy: { createdAt: 'desc' }
  })

  return ventas.map(mapToSale)
}

// ─── CREAR VENTA ──────────────────────────────────────────────────────────────
export const createVenta = async (data: VentaCreateInput): Promise<any> => {
  const parsed = VentaCreateSchema.safeParse(data)
  if (!parsed.success) throw new Error(zodError(parsed.error))

  const d = parsed.data

  // Validar cliente existe
  const cliente = await prisma.cliente.findUnique({ where: { id: Number(d.clienteId) } })
  if (!cliente) throw new Error('Cliente no encontrado')

  // Si es por reserva, validar que existe y actualizar estado
  let reserva = null
  if (d.reservaId) {
    reserva = await prisma.reserva.findUnique({ where: { id: Number(d.reservaId) } })
    if (!reserva) throw new Error('Reserva no encontrada')
    if (reserva.estado === 'ANULADA') throw new Error('No se puede crear venta para reserva anulada')
  }

  const venta = await prisma.venta.create({
    data: {
      reservaId: d.reservaId ? Number(d.reservaId) : null,
      clienteId: Number(d.clienteId),
      tipo: d.tipo,
      estado: 'CONFIRMADO',
      montoTotal: d.montoTotal,
      montoPagado: d.montoPagado,
      fechaVenta: new Date(d.fechaVenta),
      metodoPago: d.metodoPago
    },
    include: {
      cliente: { include: { usuario: true } },
      reserva: true
    }
  })

  return mapToSale(venta)
}

// ─── ACTUALIZAR VENTA ─────────────────────────────────────────────────────────
export const updateVenta = async (id: number, data: VentaUpdateInput): Promise<any> => {
  const venta = await prisma.venta.findUnique({ where: { id } })
  if (!venta) throw new Error('Venta no encontrada')

  const parsed = VentaUpdateSchema.safeParse(data)
  if (!parsed.success) throw new Error(zodError(parsed.error))

  const d = parsed.data

  const updated = await prisma.venta.update({
    where: { id },
    data: {
      tipo: d.tipo,
      estado: d.estado,
      montoTotal: d.montoTotal,
      montoPagado: d.montoPagado,
      fechaVenta: d.fechaVenta ? new Date(d.fechaVenta) : undefined,
      metodoPago: d.metodoPago
    },
    include: {
      cliente: { include: { usuario: true } },
      reserva: true
    }
  })

  return mapToSale(updated)
}

// ─── ELIMINAR VENTA ───────────────────────────────────────────────────────────
export const deleteVenta = async (id: number) => {
  const venta = await prisma.venta.findUnique({ where: { id } })
  if (!venta) throw new Error('Venta no encontrada')

  await prisma.venta.delete({ where: { id } })
  return { message: 'Venta eliminada correctamente' }
}