import prisma from '../../config/prisma'
import * as reservaService from '../reservas/reserva.services'
import * as ventaService from '../ventas/venta.services'
import { AbonoCreateSchema, zodError } from '../schemas'
import { AppError } from '../../utils/AppError'

export const getAbonos = async (usuarioId?: number) => {
  return reservaService.getAbonos(usuarioId)
}

export const createAbono = async (
  reservaId: number,
  data: { amount: number; date: string; method: string; notes?: string }
) => {
  // ─── 1. Validar con Zod ───────────────────────────────────────────────────
  const parsed = AbonoCreateSchema.safeParse({ reservaId, ...data })
  if (!parsed.success) throw new AppError(zodError(parsed.error), 400)

  const d = parsed.data

  // ─── 2. Validar que la reserva existe ─────────────────────────────────────
  const reserva = await prisma.reserva.findUnique({
    where:   { id: d.reservaId },
    include: { abonos: true, cotizacion: { include: { cliente: true } }, venta: true }
  })

  if (!reserva)
    throw new AppError('Reserva no encontrada', 404)

  // ─── 3. Validar estado de la reserva ──────────────────────────────────────
  if (reserva.estado === 'ANULADA')
    throw new AppError('No se puede registrar un abono en una reserva anulada', 400)

  if (reserva.venta && Number(reserva.saldoPendiente) <= 0.01)
    throw new AppError('Esta reserva ya fue pagada en su totalidad y tiene una venta registrada', 400)

  // ─── 4. Validar cliente asociado ──────────────────────────────────────────
  if (!reserva.cotizacion?.clienteId)
    throw new AppError('La reserva no tiene un cliente asociado', 400)

  // ─── 5. Calcular montos y validar regla de negocio 50% ───────────────────
  const totalValor   = Number(reserva.totalValor)
  const saldoActual  = Number(reserva.saldoPendiente)
  const pagadoActual = totalValor - saldoActual
  const anticipo50   = Math.ceil(totalValor / 2)
  const monto        = Number(d.amount)

  // Validar que el monto no exceda el saldo pendiente
  if (monto > saldoActual + 0.01)
    throw new AppError(
      `El monto ($${monto.toLocaleString('es-CO')}) supera el saldo pendiente ($${saldoActual.toLocaleString('es-CO')})`,
      400
    )

  // Primer abono: debe ser exactamente el 50%
  if (pagadoActual === 0) {
    if (monto !== anticipo50)
      throw new AppError(
        `El primer abono debe ser exactamente el 50% del total: $${anticipo50.toLocaleString('es-CO')} COP`,
        400
      )
  } else {
    // Segundo abono: debe ser exactamente el saldo pendiente
    if (monto !== saldoActual)
      throw new AppError(
        `El segundo abono debe ser exactamente el saldo pendiente: $${saldoActual.toLocaleString('es-CO')} COP`,
        400
      )
  }

  // ─── 6. Validar que no haya más de 2 abonos ───────────────────────────────
  if (reserva.abonos.length >= 2)
    throw new AppError('Esta reserva ya tiene los 2 abonos registrados (anticipo + pago final)', 400)

  // ─── 7. Normalizar método de pago ─────────────────────────────────────────
  const metodoPago = d.method.toUpperCase() as any
  const nuevoSaldo = Number((saldoActual - monto).toFixed(2))
  const clienteId  = reserva.cotizacion.clienteId

  // ─── 8. Crear abono ───────────────────────────────────────────────────────
  await prisma.abono.create({
    data: {
      reservaId:  d.reservaId,
      clienteId,
      monto,
      fechaPago:  new Date(d.date),
      metodoPago,
      notas:      d.notes ?? null,
      nuevoSaldo
    }
  })

  // ─── 9. Actualizar saldo de la reserva ────────────────────────────────────
  await prisma.reserva.update({
    where: { id: d.reservaId },
    data:  { saldoPendiente: nuevoSaldo }
  })

  // ─── 10. Confirmar reserva tras el primer abono (50%) ─────────────────────
  if (pagadoActual === 0 && nuevoSaldo > 0) {
    await prisma.reserva.update({
      where: { id: d.reservaId },
      data:  { estado: 'CONFIRMADA' }
    })
  }

  // ─── 11. Crear venta al completar el pago ────────────────────────────────
  if (nuevoSaldo <= 0.01 && !reserva.venta) {
    const totalAbonos = reserva.abonos.reduce((sum, a) => sum + Number(a.monto), 0) + monto
    await prisma.venta.create({
      data: {
        reservaId:   d.reservaId,
        clienteId,
        tipo:        'RESERVA',
        estado:      'FINALIZADO',
        montoTotal:  totalValor,
        montoPagado: totalAbonos,
        fechaVenta:  new Date(),
        metodoPago
      }
    })
  }

  // ─── 12. Retornar mensaje de éxito con resumen ────────────────────────────
  const esUltimoPago = nuevoSaldo <= 0.01
  return {
    message:  esUltimoPago
      ? 'Pago final registrado. Reserva completamente pagada y venta generada.'
      : 'Anticipo del 50% registrado. Reserva confirmada.',
  }
}

export const convertAbonosToVenta = async (reservaId: number): Promise<any> => {
  const reserva = await prisma.reserva.findUnique({
    where: { id: reservaId },
    include: {
      cotizacion: { include: { cliente: true } },
      abonos:     true,
      venta:      true
    }
  })

  if (!reserva)
    throw new AppError('Reserva no encontrada', 404)
  if (reserva.venta)
    throw new AppError('Esta reserva ya tiene una venta registrada', 400)
  if (!reserva.cotizacion?.cliente)
    throw new AppError('Reserva sin cliente asociado', 400)

  const saldoPendiente = Number(reserva.saldoPendiente)
  const totalValor     = Number(reserva.totalValor)

  if (saldoPendiente > 0.01)
    throw new AppError(
      `La reserva aún tiene saldo pendiente: $${saldoPendiente.toLocaleString('es-CO')}. Completa el pago antes de convertir a venta.`,
      400
    )
  if (reserva.abonos.length === 0)
    throw new AppError('La reserva no tiene abonos registrados', 400)

  const montoPagado = reserva.abonos.reduce((sum, a) => sum + Number(a.monto), 0)
  const ultimoAbono = reserva.abonos[reserva.abonos.length - 1]
  const metodoPago  = ultimoAbono?.metodoPago || 'OTRO'

  const venta = await ventaService.createVenta({
    reservaId,
    clienteId:   reserva.cotizacion.cliente.id,
    tipo:        'RESERVA',
    estado:      'FINALIZADO',
    montoTotal:  totalValor,
    montoPagado,
    fechaVenta:  new Date().toISOString().split('T')[0],
    metodoPago: metodoPago
  })

  return venta
}