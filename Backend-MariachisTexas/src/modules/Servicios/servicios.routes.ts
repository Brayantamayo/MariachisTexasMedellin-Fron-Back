import { Router } from 'express'
import { crear, listar, detalle, editar, cambiarEstado, eliminar } from './servicios.controller'

const router = Router()

router.get('/',             listar)
router.get('/:id',          detalle)
router.post('/',            crear)
router.put('/:id',          editar)
router.patch('/:id/estado', cambiarEstado)
router.delete('/:id',       eliminar)

export default router