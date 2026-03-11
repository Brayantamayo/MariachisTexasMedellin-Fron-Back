import { Router } from 'express'
import { crear, listar, detalle, editar, cambiarEstado, eliminar } from './servicios.controller'

const router = Router()

router.get('/',              listar)////segundo 
router.get('/:id',           detalle)///tercero
router.post('/',             crear)  /////primero 
router.put('/:id',           editar)  ////// cuarto
router.patch('/:id/estado',  cambiarEstado) //////quinto
router.delete('/:id',        eliminar) //////sexto

export default router