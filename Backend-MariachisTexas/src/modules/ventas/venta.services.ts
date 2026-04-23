import prisma from '../../config/prisma'
import { VentaCreateSchema, zodError } from '../schemas'
import type { VentaCreateInput } from '../../types/interfaces'
import { toLocalTime, buildClientName } from '../../utils/date.helpers'

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const mapToSale = (v: any) => {
  const reserva = v.reserva
  const cotizacion = reserva?.cotizacion
  const cliente = v.cliente ?? cotizacion?.cliente
  const clienteName = cliente
    ? buildClientName(cliente.usuario?.nombre, cliente.apellido)
    : ''

  const ventaFinalizada = v.estado === 'FINALIZADO'
  const ventaCancelada = v.estado === 'CANCELADA'
  const pendingAmount = reserva
    ? (ventaFinalizada || ventaCancelada ? 0 : Number(reserva.saldoPendiente))
    : 0
  const isFullyPaid = ventaFinalizada || pendingAmount <= 0.01

  return {
    id: String(v.id),
    date: v.fechaVenta?.toISOString() ?? '',
    type: v.tipo === 'DIRECTA' ? 'Directa' : 'Por Reserva',
    clientName: clienteName,
    clientId: String(v.clienteId),
    clientEmail: cliente?.email ?? '',
    concept: v.reservaId ? `Reserva #${v.reservaId}` : 'Venta Directa',
    method: v.metodoPago,
    amount: Number(v.montoTotal),
    totalAmount: Number(v.montoTotal),
    pendingAmount,
    paidAmount: Number(v.montoPagado),
    reservationId: v.reservaId ? String(v.reservaId) : undefined,
    reservationStatus: ventaCancelada ? 'CANCELADA' : isFullyPaid ? 'FINALIZADO' : 'CONFIRMADO',
    eventDate: cotizacion?.fechaEvento
      ? cotizacion.fechaEvento.toISOString().split('T')[0]
      : undefined,
    eventType: cotizacion?.tipoEvento ?? '',
    status: ventaCancelada ? 'Cancelada' : isFullyPaid ? 'Finalizado' : 'Confirmado',
    abonos: reserva?.abonos?.map((a: any) => ({
      id: String(a.id),
      amount: Number(a.monto),
      date: a.fechaPago?.toISOString() ?? '',
      method: a.metodoPago ?? '',
      notes: a.notas ?? '',
    })) ?? [],
    // ─── Nuevos campos ──────────────────────────────────────────────────────
    eventTime: cotizacion?.horaInicio ? toLocalTime(cotizacion.horaInicio) : undefined,
    eventEndTime: cotizacion?.horaFin ? toLocalTime(cotizacion.horaFin) : undefined,
    eventLocation: cotizacion?.direccionEvento ?? undefined,
    homenajeado: cotizacion?.nombreHomenajeado ?? undefined,
    notes: cotizacion?.notasAdicionales ?? undefined,
    services: cotizacion?.servicios?.map((s: any) => ({
      nombre: s.servicio.nombre,
      cantidad: s.cantidad,
      precio: Number(s.servicio.precio),
    })) ?? [],
    repertoire: cotizacion?.repertorios?.map((r: any) => ({
      titulo: r.repertorio.titulo,
      artista: r.repertorio.artista,
    })) ?? [],
  }
}

// ─── ERRORES TIPADOS ──────────────────────────────────────────────────────────

export class VentaError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 400
  ) {
    super(message)
    this.name = 'VentaError'
  }
}

const METODOS_PAGO_VALIDOS = ['EFECTIVO', 'TRANSFERENCIA', 'NEQUI', 'DAVIPLATA', 'OTRO'] as const
type MetodoPago = typeof METODOS_PAGO_VALIDOS[number]

const validarMetodoPago = (metodo: string): MetodoPago => {
  const upper = metodo.trim().toUpperCase()
  if (!METODOS_PAGO_VALIDOS.includes(upper as MetodoPago))
    throw new VentaError(
      `Método de pago inválido: "${metodo}". Opciones: ${METODOS_PAGO_VALIDOS.join(', ')}`,
      'METODO_PAGO_INVALIDO'
    )
  return upper as MetodoPago
}

const validarMonto = (monto: any, campo: string): number => {
  const valor = Number(monto)
  if (isNaN(valor) || !isFinite(valor))
    throw new VentaError(`El campo "${campo}" debe ser un número válido`, 'MONTO_INVALIDO')
  if (valor <= 0)
    throw new VentaError(`El campo "${campo}" debe ser mayor a 0`, 'MONTO_INVALIDO')
  if (valor > 10_000_000)
    throw new VentaError(`El campo "${campo}" supera el límite de $10.000.000`, 'MONTO_INVALIDO')
  if ((valor * 100) % 1 !== 0)
    throw new VentaError(`El campo "${campo}" no puede tener más de 2 decimales`, 'MONTO_INVALIDO')
  return valor
}

const validarFecha = (fecha: any, campo: string, soloHoy = false): string => {
  if (!fecha || typeof fecha !== 'string')
    throw new VentaError(`El campo "${campo}" es requerido`, 'FECHA_INVALIDA')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha.trim()))
    throw new VentaError(`El campo "${campo}" debe tener formato YYYY-MM-DD`, 'FECHA_INVALIDA')
  if (isNaN(Date.parse(fecha)))
    throw new VentaError(`El campo "${campo}" no es una fecha válida`, 'FECHA_INVALIDA')
  if (soloHoy) {
    const hoy = new Date().toISOString().split('T')[0]
    if (fecha.trim() !== hoy)
      throw new VentaError(`El campo "${campo}" debe ser la fecha de hoy (${hoy})`, 'FECHA_NO_HOY')
  }
  return fecha.trim()
}

// ─── INCLUDE REUTILIZABLE ─────────────────────────────────────────────────────

const cotizacionInclude = {
  cliente: { include: { usuario: true } },
  servicios: { include: { servicio: true } },
  repertorios: { include: { repertorio: true } },
}

const reservaInclude = {
  abonos: true,
  cotizacion: { include: cotizacionInclude },
}

// ─── OBTENER VENTAS ───────────────────────────────────────────────────────────

export const getVentas = async (usuarioId?: number): Promise<any[]> => {
  let where: any = {}

  if (usuarioId) {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } })
    if (!usuario)
      throw new VentaError('Usuario no encontrado', 'USUARIO_NO_ENCONTRADO', 404)
    const cliente = await prisma.cliente.findUnique({ where: { email: usuario.email } })
    if (cliente) where.clienteId = cliente.id
  }

  const ventas = await prisma.venta.findMany({
    where,
    include: {
      cliente: { include: { usuario: true } },
      reserva: { include: reservaInclude },
    },
    orderBy: { createdAt: 'desc' },
  })

  const reservaConVentaIds = ventas.filter(v => v.reservaId).map(v => v.reservaId!)

  const reservasSinVenta = await prisma.reserva.findMany({
    where: {
      estado: { in: ['CONFIRMADA', 'REPROGRAMADA'] },
      id: { notIn: reservaConVentaIds },
      ...(usuarioId
        ? { cotizacion: { cliente: { usuario: { id: usuarioId } } } }
        : {}),
    },
    include: reservaInclude,
    orderBy: { createdAt: 'desc' },
  })

  const ventasMapped = ventas.map(mapToSale)

  const reservasMapped = reservasSinVenta.map((r: any) => {
    const cot = r.cotizacion
    const cliente = cot?.cliente
    const pagado = Number(r.totalValor) - Number(r.saldoPendiente)

    return {
      id: `RES-${r.id}`,
      date: r.createdAt?.toISOString() ?? '',
      type: 'Por Reserva',
      clientName: cliente
        ? buildClientName(cliente.usuario?.nombre, cliente.apellido)
        : '',
      clientId: String(cot?.clienteId ?? ''),
      clientEmail: cliente?.email ?? '',
      concept: `Reserva #${r.id}`,
      method: r.abonos[0]?.metodoPago ?? 'TRANSFERENCIA',
      amount: Number(r.totalValor),
      totalAmount: Number(r.totalValor),
      pendingAmount: Number(r.saldoPendiente),
      paidAmount: pagado,
      reservationId: String(r.id),
      reservationStatus: 'CONFIRMADO',
      eventDate: cot?.fechaEvento
        ? new Date(cot.fechaEvento).toISOString().split('T')[0]
        : undefined,
      eventType: cot?.tipoEvento ?? '',
      status: 'Confirmado',
      abonos: r.abonos.map((a: any) => ({
        id: String(a.id),
        amount: Number(a.monto),
        date: a.fechaPago?.toISOString() ?? '',
        method: a.metodoPago ?? '',
        notes: a.notas ?? '',
      })),
      // ─── Nuevos campos ────────────────────────────────────────────────────
      eventTime: cot?.horaInicio ? toLocalTime(cot.horaInicio) : undefined,
      eventEndTime: cot?.horaFin ? toLocalTime(cot.horaFin) : undefined,
      eventLocation: cot?.direccionEvento ?? undefined,
      homenajeado: cot?.nombreHomenajeado ?? undefined,
      notes: cot?.notasAdicionales ?? undefined,
      services: cot?.servicios?.map((s: any) => ({
        nombre: s.servicio.nombre,
        cantidad: s.cantidad,
        precio: Number(s.servicio.precio),
      })) ?? [],
      repertoire: cot?.repertorios?.map((r: any) => ({
        titulo: r.repertorio.titulo,
        artista: r.repertorio.artista,
      })) ?? [],
    }
  })

  return [...reservasMapped, ...ventasMapped]
}

// ─── CREAR VENTA ──────────────────────────────────────────────────────────────

export const createVenta = async (data: VentaCreateInput): Promise<any> => {
  const parsed = VentaCreateSchema.safeParse(data)
  if (!parsed.success)
    throw new VentaError(zodError(parsed.error), 'VALIDACION_FALLIDA', 400)

  const d = parsed.data

  if (d.tipo === 'DIRECTA' && d.reservaId)
    throw new VentaError('Una venta directa no puede tener un ID de reserva.', 'DIRECTA_CON_RESERVA', 400)
  if (d.tipo === 'RESERVA' && !d.reservaId)
    throw new VentaError('Una venta de tipo RESERVA debe incluir un ID de reserva.', 'RESERVA_SIN_ID', 400)

  const cliente = await prisma.cliente.findUnique({
    where: { id: Number(d.clienteId) },
    include: { usuario: true },
  })
  if (!cliente)
    throw new VentaError(`Cliente con ID ${d.clienteId} no encontrado.`, 'CLIENTE_NO_ENCONTRADO', 404)

  if (!d.reservaId) {
    const venta = await prisma.venta.create({
      data: {
        reservaId: null,
        clienteId: Number(d.clienteId),
        tipo: 'DIRECTA',
        estado: 'FINALIZADO',
        montoTotal: Number(d.montoTotal),
        montoPagado: Number(d.montoTotal),
        fechaVenta: new Date(d.fechaVenta),
        metodoPago: d.metodoPago,
      },
      include: {
        cliente: { include: { usuario: true } },
        reserva: { include: reservaInclude },
      },
    })
    return mapToSale(venta)
  }

  const reserva = await prisma.reserva.findUnique({
    where: { id: Number(d.reservaId) },
    include: {
      cotizacion: { include: cotizacionInclude },
      abonos: true,
      venta: true,
    },
  })

  if (!reserva)
    throw new VentaError(`Reserva #${d.reservaId} no encontrada.`, 'RESERVA_NO_ENCONTRADA', 404)
  if (reserva.estado === 'ANULADA')
    throw new VentaError(`Reserva #${d.reservaId} está anulada.`, 'RESERVA_ANULADA', 409)
  if (reserva.estado === 'PENDIENTE')
    throw new VentaError(`Reserva #${d.reservaId} aún no tiene el anticipo pagado.`, 'RESERVA_SIN_ANTICIPO', 409)
  if (reserva.venta)
    throw new VentaError(
      `Ya existe una venta (ID ${reserva.venta.id}) para la reserva #${d.reservaId}.`,
      'VENTA_DUPLICADA', 409
    )

  const montoTotalFinal = Number(reserva.totalValor)
  const saldoPendiente = Number(reserva.saldoPendiente)
  const abonosAnteriores = reserva.abonos.reduce((sum, a) => sum + Number(a.monto), 0)
  const montoPagadoFinal = abonosAnteriores + saldoPendiente

  const clienteId = reserva.cotizacion?.clienteId
  if (!clienteId)
    throw new VentaError('La reserva no tiene un cliente asociado.', 'SIN_CLIENTE', 422)

  const venta = await prisma.$transaction(async (tx) => {
    await tx.abono.create({
      data: {
        reservaId: Number(d.reservaId),
        clienteId,
        monto: saldoPendiente,
        fechaPago: new Date(d.fechaVenta),
        metodoPago: d.metodoPago as any,
        notas: null,
        nuevoSaldo: 0,
      },
    })

    await tx.reserva.update({
      where: { id: Number(d.reservaId) },
      data: { saldoPendiente: 0, estado: 'FINALIZADO' },
    })

    return tx.venta.create({
      data: {
        reservaId: Number(d.reservaId),
        clienteId: Number(d.clienteId),
        tipo: 'RESERVA',
        estado: 'FINALIZADO',
        montoTotal: montoTotalFinal,
        montoPagado: montoPagadoFinal,
        fechaVenta: new Date(d.fechaVenta),
        metodoPago: d.metodoPago,
      },
      include: {
        cliente: { include: { usuario: true } },
        reserva: { include: reservaInclude },
      },
    })
  })

  return mapToSale(venta)
}

// ─── ADD ABONO FINAL ──────────────────────────────────────────────────────────

export const addAbonoFromVentas = async (
  reservaId: number,
  data: { amount: number; date: string; method: string; notes?: string }
): Promise<{ message: string; reservaId: number; monto: number }> => {

  if (!Number.isInteger(reservaId) || reservaId <= 0)
    throw new VentaError('El ID de reserva debe ser un número entero positivo', 'ID_INVALIDO', 400)

  const monto = validarMonto(data.amount, 'amount')
  const fecha = validarFecha(data.date, 'date', true)
  const metodo = validarMetodoPago(data.method)

  if (data.notes && data.notes.trim().length > 500)
    throw new VentaError('Las notas no pueden superar 500 caracteres', 'NOTAS_MUY_LARGAS', 400)
  if (data.notes && /[<>{}[\]\\]/.test(data.notes))
    throw new VentaError('Las notas contienen caracteres no permitidos', 'NOTAS_INVALIDAS', 400)

  const reserva = await prisma.reserva.findUnique({
    where: { id: reservaId },
    include: { cotizacion: { include: { cliente: true } }, abonos: true, venta: true },
  })

  if (!reserva)
    throw new VentaError(`Reserva #${reservaId} no encontrada`, 'RESERVA_NO_ENCONTRADA', 404)
  if (reserva.estado === 'ANULADA')
    throw new VentaError('No se puede registrar un abono en una reserva anulada', 'RESERVA_ANULADA', 409)
  if (reserva.estado === 'PENDIENTE')
    throw new VentaError('La reserva aún no tiene el anticipo del 50% pagado', 'RESERVA_SIN_ANTICIPO', 409)
  if (reserva.estado === 'FINALIZADO')
    throw new VentaError('La reserva ya está completamente pagada', 'RESERVA_FINALIZADA', 409)

  const totalValor = Number(reserva.totalValor)
  const saldoActual = Number(reserva.saldoPendiente)

  if (saldoActual <= 0.01)
    throw new VentaError('Esta reserva ya se encuentra completamente pagada', 'RESERVA_YA_PAGADA', 409)
  if (Math.abs(monto - saldoActual) > 0.01)
    throw new VentaError(
      `El monto debe ser exactamente el saldo pendiente: $${saldoActual.toLocaleString('es-CO')} COP`,
      'MONTO_INCORRECTO', 400
    )

  const clienteId = reserva.cotizacion?.clienteId
  if (!clienteId)
    throw new VentaError('La reserva no tiene un cliente asociado', 'SIN_CLIENTE', 422)

  await prisma.$transaction(async (tx) => {
    await tx.abono.create({
      data: {
        reservaId,
        clienteId,
        monto,
        fechaPago: new Date(fecha),
        metodoPago: metodo as any,
        notas: data.notes?.trim() ?? null,
        nuevoSaldo: 0,
      },
    })

    await tx.reserva.update({
      where: { id: reservaId },
      data: { saldoPendiente: 0, estado: 'FINALIZADO' },
    })

    const totalAbonos = reserva.abonos.reduce((sum, a) => sum + Number(a.monto), 0) + monto

    if (!reserva.venta) {
      await tx.venta.create({
        data: {
          reservaId,
          clienteId,
          tipo: 'RESERVA',
          estado: 'FINALIZADO',
          montoTotal: totalValor,
          montoPagado: totalAbonos,
          fechaVenta: new Date(),
          metodoPago: metodo as any,
        },
      })
    } else {
      await tx.venta.update({
        where: { id: reserva.venta.id },
        data: { estado: 'FINALIZADO', montoPagado: totalAbonos },
      })
    }
  })

  return {
    message: 'Abono registrado exitosamente. ¡Reserva finalizada y pagada completamente!',
    reservaId,
    monto,
  }
}

// ─── RESERVAS PAGABLES ────────────────────────────────────────────────────────

export const getPayableReservations = async (): Promise<any[]> => {
  const reservas = await prisma.reserva.findMany({
    where: {
      estado: { in: ['CONFIRMADA', 'REPROGRAMADA'] },
      saldoPendiente: { gt: 0 },
      venta: null,
    },
    include: {
      cotizacion: { include: { cliente: { include: { usuario: true } } } },
      abonos: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return reservas.map(r => {
    const totalAbonado = r.abonos.reduce((sum, a) => sum + Number(a.monto), 0)
    return {
      id: String(r.id),
      clientName: buildClientName(r.cotizacion?.cliente?.usuario?.nombre, r.cotizacion?.cliente?.apellido),
      clientId: String(r.cotizacion?.clienteId ?? ''),
      eventType: r.cotizacion?.tipoEvento ?? 'Evento',
      totalAmount: Number(r.totalValor),
      paidAmount: totalAbonado,
      pendingAmount: Number(r.saldoPendiente),
      paymentCount: r.abonos.length,
    }
  })
}