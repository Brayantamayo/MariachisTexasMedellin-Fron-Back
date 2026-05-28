import prisma from '../../config/prisma'

export const getNotificaciones = async () => {
  // Consultar las últimas 5 Reservas en estado PENDIENTE o CONFIRMADA
  const reservas = await prisma.reserva.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      cotizacion: {
        include: {
          cliente: {
            include: {
              usuario: true
            }
          }
        }
      }
    }
  })

  // Consultar las últimas 5 Cotizaciones en estado EN_ESPERA (no reservas directas)
  const cotizaciones = await prisma.cotizacion.findMany({
    where: {
      esReservaDirecta: false,
      estado: 'EN_ESPERA'
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      cliente: {
        include: {
          usuario: true
        }
      }
    }
  })

  // Consultar los últimos 5 Abonos
  const abonos = await prisma.abono.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      cliente: {
        include: {
          usuario: true
        }
      },
      reserva: {
        include: {
          cotizacion: true
        }
      }
    }
  })

  // Mapear cada elemento a una estructura unificada
  const notificationsList = [
    ...reservas.map(r => {
      const clienteName = r.cotizacion?.cliente
        ? `${r.cotizacion.cliente.usuario?.nombre || ''} ${r.cotizacion.cliente.apellido || ''}`.trim()
        : r.cotizacion?.contactoNombre || 'Cliente'
      return {
        id: `reserva-${r.id}`,
        tipo: 'RESERVA' as const,
        titulo: 'Nueva Reserva Creada',
        descripcion: `Reserva #${r.id} de ${r.cotizacion?.tipoEvento || 'Serenata'} por ${clienteName}. Total: $${Number(r.totalValor).toLocaleString('es-CO')} COP`,
        fecha: r.createdAt.toISOString(),
        enlace: '/reservas',
      }
    }),
    ...cotizaciones.map(c => {
      const clienteName = c.cliente
        ? `${c.cliente.usuario?.nombre || ''} ${c.cliente.apellido || ''}`.trim()
        : c.contactoNombre || 'Cliente'
      return {
        id: `cotizacion-${c.id}`,
        tipo: 'COTIZACION' as const,
        titulo: 'Nueva Cotización Recibida',
        descripcion: `Cotización de ${c.tipoEvento || 'Serenata'} para ${clienteName} el día ${c.fechaEvento.toLocaleDateString('es-CO')}`,
        fecha: c.createdAt.toISOString(),
        enlace: '/cotizaciones',
      }
    }),
    ...abonos.map(a => {
      const clienteName = a.cliente
        ? `${a.cliente.usuario?.nombre || ''} ${a.cliente.apellido || ''}`.trim()
        : 'Cliente'
      return {
        id: `abono-${a.id}`,
        tipo: 'ABONO' as const,
        titulo: 'Nuevo Abono Registrado',
        descripcion: `Abono de $${Number(a.monto).toLocaleString('es-CO')} COP recibido para la Reserva #${a.reservaId} por ${clienteName}`,
        fecha: a.createdAt.toISOString(),
        enlace: '/ventas', // Dirige al módulo Ventas (o abonos en el submenú de ventas)
      }
    })
  ]

  // Ordenar cronológicamente descendente (más recientes primero)
  notificationsList.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

  // Devolver el top 10 general
  return notificationsList.slice(0, 10)
}
