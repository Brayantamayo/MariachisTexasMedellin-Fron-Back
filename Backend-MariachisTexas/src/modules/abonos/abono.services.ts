import prisma from '../../config/prisma'
import * as reservaService from '../reservas/reserva.services'
import * as ventaService from '../ventas/venta.services'

export const getAbonos = async (usuarioId?: number) => {
  return reservaService.getAbonos(usuarioId)
}

export const createAbono = async (reservaId: number, data: { amount: number; date: string; method: string; notes?: string }) => {
  return reservaService.createAbono(reservaId, data)
}

/**
 * Convierte los abonos de una reserva en una venta.
 * Valida que el saldo pendiente sea 0 (es decir, que esté completamente pagada).
 * Crea una venta con el monto total pagado.
 */
export const convertAbonosToVenta = async (reservaId: number): Promise<any> => {
  const reserva = await prisma.reserva.findUnique({
    where: { id: reservaId },
    include: {
      cotizacion: { include: { cliente: true } },
      abonos: true,
      venta: true
    }
  })

  if (!reserva) throw new Error('Reserva no encontrada')
  if (reserva.venta) throw new Error('Esta reserva ya tiene una venta registrada')
  if (!reserva.cotizacion?.cliente) throw new Error('Reserva sin cliente asociado')

  const saldoPendiente = Number(reserva.saldoPendiente)
  const totalValor = Number(reserva.totalValor)

  if (saldoPendiente > 0.01) throw new Error(`La reserva aún tiene saldo pendiente: $${saldoPendiente}. Completa el pago antes de convertir a venta.`)
  if (reserva.abonos.length === 0) throw new Error('La reserva no tiene abonos registrados')

  // Calcular total pagado a partir de los abonos
  const montoPagado = reserva.abonos.reduce((sum, abono) => sum + Number(abono.monto), 0)

  // Utilizar el último método de pago registrado en los abonos
  const ultimoAbono = reserva.abonos[reserva.abonos.length - 1]
  const metodoPago = ultimoAbono?.metodoPago || 'OTRO'

  // Crear la venta con la información de la reserva
  const venta = await ventaService.createVenta({
    reservaId: reservaId,
    clienteId: reserva.cotizacion.cliente.id,
    tipo: 'RESERVA',
    estado: 'FINALIZADO',
    montoTotal: totalValor,
    montoPagado: montoPagado,
    fechaVenta: new Date().toISOString().split('T')[0],
    metodoPago
  })

  return venta
}
