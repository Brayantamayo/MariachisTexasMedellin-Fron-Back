import { Request, Response } from 'express'
import * as abonoService from './abono.services'
import { AuthRequest } from '../../middlewares/Auth.middleware'
import { asyncHandler } from '../../middlewares/Asynchandler'
import prisma from '../../config/prisma'
import { buildClientName } from '../../utils/date.helpers'
import { generateAbonoDetailPdf, generateAbonosReportPdf } from './abono.pdf.service'

const ROLES_ADMIN = ['ADMIN', 'EMPLEADO', 'CLIENTE']

////Obtener Abonos (todos para admin/empleado, solo propios para cliente)────────────────────────────────────────────────────────
export const getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id

  let usuarioId: number | undefined
  if (userId !== undefined && userId !== null) {
    const numId = Number(userId)
    if (!Number.isNaN(numId) && numId > 0) {
      usuarioId = numId
    } else {
      return res.status(400).json({ message: 'ID de usuario invalido' })
    }
  }

  if (req.user?.rol && ROLES_ADMIN.includes(req.user.rol)) {
    return res.json(
      await abonoService.getAbonos(req.user.rol === 'CLIENTE' ? usuarioId : undefined)
    )
  }

  return res.status(403).json({ message: 'No tienes permisos para ver abonos' })
})

////Crear Abono
export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const reservaId = Number(
    Array.isArray(req.body.reservaId) ? req.body.reservaId[0] : req.body.reservaId
  )
  const { amount, date, method, notes } = req.body

  if (!reservaId || !amount || !date || !method) {
    return res.status(400).json({ message: 'Faltan datos obligatorios: reservaId, amount, date, method' })
  }

  const result = await abonoService.createAbono(reservaId, { amount, date, method, notes })
  return res.status(201).json(result)
})


///Convertir Abonos a Venta (solo para admin/empleado)────────────────────────────────────────────────────────
export const convertToVenta = asyncHandler(async (req: AuthRequest, res: Response) => {
  let reservaId = req.body.reservaId
  if (Array.isArray(reservaId)) reservaId = reservaId[0]
  reservaId = Number(reservaId)

  if (!reservaId || Number.isNaN(reservaId)) {
    return res.status(400).json({ message: 'Debe proporcionar un reservaId valido' })
  }
  if (!req.user?.rol || !['ADMIN', 'EMPLEADO'].includes(req.user.rol)) {
    return res.status(403).json({ message: 'No tienes permisos para convertir abonos a ventas' })
  }

  const venta = await abonoService.convertAbonosToVenta(reservaId)
  return res.status(201).json(venta)
})
///////////////////////////////////////////////////

////Descargar PDF de Abonos (solo para admin/empleado)────────────────────────────────────────────────────────
export const downloadPdf = asyncHandler(async (req: AuthRequest, res: Response) => {
  const usuarioId = req.user?.id ? Number(req.user.id) : undefined
  const abonos = await abonoService.getAbonos(
    req.user?.rol === 'CLIENTE' ? usuarioId : undefined
  )

  const pdfBuffer = await generateAbonosReportPdf(abonos)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename="abonos.pdf"')
  res.setHeader('Content-Length', pdfBuffer.length)
  res.send(pdfBuffer)
})
/////////////////////////////////////////////////////////////

///Descargar PDF de detalle de un Abono (solo para admin/empleado o cliente dueño del abono)────────────────────────────────────────────────────────
export const downloadAbonoPdf = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const usuarioId = req.user?.id ? Number(req.user.id) : undefined
  const abonos = await abonoService.getAbonos(
    req.user?.rol === 'CLIENTE' ? usuarioId : undefined
  )
  const abonoAccesible = abonos.find(a => a.id === id)

  if (!abonoAccesible) {
    return res.status(404).json({ message: 'Abono no encontrado' })
  }

  const abono = await prisma.abono.findUnique({
    where: { id: Number(id) },
    include: {
      cliente: { include: { usuario: true } },
      reserva: {
        include: {
          abonos: { orderBy: { fechaPago: 'asc' } },
          cotizacion: {
            include: {
              cliente: { include: { usuario: true } },
              servicios: { include: { servicio: true } },   // ✅ AGREGAR
              repertorios: { include: { repertorio: true } },
            },
          },
        },
      },
    },
  })

  if (!abono) {
    return res.status(404).json({ message: 'Abono no encontrado' })
  }

  const cliente = abono.cliente ?? abono.reserva?.cotizacion?.cliente
  const clienteNombre = cliente
    ? buildClientName(cliente.usuario?.nombre, cliente.apellido)
    : abonoAccesible.clientName

  const pdfBuffer = await generateAbonoDetailPdf({
    ...abono,
    clienteNombre,
  })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="abono-${id}.pdf"`)
  res.setHeader('Content-Length', pdfBuffer.length)
  res.send(pdfBuffer)
})

export const getPayableReservations = async (req: Request, res: Response) => {
  try {
    const reservas = await prisma.reserva.findMany({
      where: {
        saldoPendiente: { gt: 0.01 },
        estado: { notIn: ['ANULADA'] as any },
      },
      include: {
        cotizacion: {
          include: {
            cliente: { include: { usuario: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = (reservas as any[]).map(r => {
      const total = Number(r.totalValor)
      const pending = Number(r.saldoPendiente)
      const paid = total - pending

      return {
        id: String(r.id),
        clientName: r.cotizacion?.cliente
          ? buildClientName(r.cotizacion.cliente.usuario?.nombre, r.cotizacion.cliente.apellido)
          : 'Sin cliente',
        total,
        paid,
        pending,
      }
    })

    return res.json(result)
  } catch (err) {
    console.error('getPayableReservations error:', err)
    return res.status(500).json({ error: 'Error obteniendo reservas disponibles' })
  }
}
