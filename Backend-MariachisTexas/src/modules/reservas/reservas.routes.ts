import { Router } from 'express'
import * as reservaController from './reserva.controller'
import { verifyToken }  from '../../middlewares/Auth.middleware'
import { requireRole }  from '../../middlewares/Role.middleware'

const router = Router()

// ─── PÚBLICAS (sin token) ─────────────────────────────────────────────────────
router.get('/available-hours/:date', reservaController.getAvailableHours)

// ─── PROTEGIDAS ───────────────────────────────────────────────────────────────
router.use(verifyToken)


// Lectura — Admin, Empleado y Cliente (cada uno filtra lo suyo en el controller)
router.get('/calendario', reservaController.getCalendario)
//Trae todos los abonos registrados
router.get('/abonos',     reservaController.getAbonos)

//Trae todas las reservas
router.get('/',           reservaController.getAll)
// Trae una reserva por ID
router.get('/:id',        reservaController.getById)

// Agregar abono — Admin, Empleado y Cliente
router.post('/:id/abonos', requireRole(['ADMIN', 'EMPLEADO']), reservaController.addAbono)

// Crear reserva — Admin y Cliente
router.post('/', requireRole(['ADMIN', 'CLIENTE']), reservaController.create)

// Editar — Admin y Empleado
router.put('/:id', requireRole(['ADMIN', 'EMPLEADO']), reservaController.update)

// Anular — Admin y Empleado
router.patch('/:id/anular', requireRole(['ADMIN', 'EMPLEADO']), reservaController.anular)

/// Reprogramar — Admin y Empleado
router.patch('/:id/reprogramar',  requireRole(['ADMIN', 'EMPLEADO', 'CLIENTE']), reservaController.reprogramar) 

// Finalizar (Llamado 'confirmar' en el frontend)
router.patch('/:id/confirmar', requireRole(['ADMIN', 'EMPLEADO']), reservaController.finalize)

// Eliminar — Admin y Empleado
router.delete('/:id', requireRole(['ADMIN', 'EMPLEADO']), reservaController.remove)

export default router