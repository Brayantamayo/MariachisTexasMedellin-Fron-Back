import { Router } from 'express'
import * as ventaController from './venta.controller'
import { verifyToken } from '../../middlewares/Auth.middleware'
import { requireRole } from '../../middlewares/Role.middleware'

const router = Router()

// ─── Todas las rutas requieren autenticación ───────────────────────────────────
router.use(verifyToken)

// ─── RESERVAS: Abono y PDF ────────────────────────────────────────────────────

/**
 * POST /ventas/reserva/:reservaId/abono
 * Registra el pago final (2do abono / saldo) de una reserva confirmada.
 * Solo ADMIN y EMPLEADO.
 */
router.post(
  '/reserva/:reservaId/abono',
  requireRole(['ADMIN', 'EMPLEADO']),
  ventaController.addFinalAbono
)

/**
 * GET /ventas/reserva/:reservaId/pdf
 * Descarga el comprobante PDF de una reserva.
 * Todos los roles (el controller verifica propiedad para CLIENTE).
 */
router.get('/reserva/:reservaId/pdf', ventaController.downloadReservaPdf)

// ─── RESERVAS PAGABLES ────────────────────────────────────────────────────────

/**
 * GET /ventas/payable/reservations
 * Lista reservas con saldo pendiente > 0 (PENDIENTE o CONFIRMADA).
 * Solo ADMIN y EMPLEADO.
 */
router.get(
  '/payable/reservations',
  requireRole(['ADMIN', 'EMPLEADO']),
  ventaController.getPayableReservations
)

// ─── REPORTE PDF GENERAL ──────────────────────────────────────────────────────

/**
 * GET /ventas/download/pdf
 * Descarga PDF con listado de ventas.
 * Admin/Empleado ven todo; Cliente solo sus registros.
 */
router.get('/download/pdf', ventaController.downloadPdf)

// ─── CRUD VENTAS ──────────────────────────────────────────────────────────────

/**
 * GET /ventas
 * Obtiene todas las ventas.
 * Admin/Empleado ven todo; Cliente solo las suyas.
 */
router.get('/', ventaController.getAll)

/**
 * POST /ventas
 * Crea una nueva venta directa o asociada a reserva.
 * Solo ADMIN y EMPLEADO.
 */
router.post(
'/',
requireRole(['ADMIN', 'EMPLEADO']),
ventaController.create
)



/**
 * GET /ventas/:id
 * Obtiene una venta por ID.
 * Admin/Empleado ven cualquiera; Cliente solo la suya.
 */
router.get('/:id', ventaController.getById)

/**
 * GET /ventas/:id/download/pdf
 * Descarga la factura PDF de una venta específica.
 * Admin/Empleado ven cualquiera; Cliente solo la suya.
 */
router.get('/:id/download/pdf', ventaController.downloadVentaPdf)

export default router