import prisma from '../../config/prisma'

export interface DashboardStats {
  totalClients: number
  totalReservas: number
  confirmedReservas: number
  pendingReservas: number
  cancelledReservas: number
  totalCotizaciones: number
  convertedCotizaciones: number
  pendingCotizaciones: number
  totalVentas: number
  totalRevenue: number
  totalPendingBalance: number
  upcomingReservations: Array<{ id: number; eventDate: string; status: string; totalValue: number; }>
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const [
    totalClients,
    totalReservas,
    confirmedReservas,
    pendingReservas,
    cancelledReservas,
    totalCotizaciones,
    convertedCotizaciones,
    pendingCotizaciones,
    totalVentas,
    ventasAggregate,
    pendingBalanceAggregate,
    upcomingReservations
  ] = await Promise.all([
    prisma.cliente.count(),
    prisma.reserva.count(),
    prisma.reserva.count({ where: { estado: 'CONFIRMADA' } }),
    prisma.reserva.count({ where: { estado: 'PENDIENTE' } }),
    prisma.reserva.count({ where: { estado: 'ANULADA' } }),
    prisma.cotizacion.count(),
    prisma.cotizacion.count({ where: { estado: 'CONVERTIDA' } }),
    prisma.cotizacion.count({ where: { estado: 'EN_ESPERA' } }),
    prisma.venta.count(),
    prisma.venta.aggregate({ _sum: { montoPagado: true } }),
    prisma.reserva.aggregate({ _sum: { saldoPendiente: true } }),
    prisma.reserva.findMany({
      where: {
        estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
        cotizacion: {
          fechaEvento: { gte: new Date() }
        }
      },
      include: { cotizacion: true },
      orderBy: { cotizacion: { fechaEvento: 'asc' } },
      take: 5
    })
  ])

  const totalRevenue = Number(ventasAggregate._sum.montoPagado ?? 0)
  const totalPendingBalance = Number(pendingBalanceAggregate._sum.saldoPendiente ?? 0)

  return {
    totalClients,
    totalReservas,
    confirmedReservas,
    pendingReservas,
    cancelledReservas,
    totalCotizaciones,
    convertedCotizaciones,
    pendingCotizaciones,
    totalVentas,
    totalRevenue,
    totalPendingBalance,
    upcomingReservations: upcomingReservations.map((r) => ({
      id: r.id,
      eventDate: r.cotizacion?.fechaEvento?.toISOString() ?? '',
      status: r.estado,
      totalValue: Number(r.totalValor ?? 0)
    }))
  }
}
