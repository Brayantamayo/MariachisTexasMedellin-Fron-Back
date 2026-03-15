import { Request, Response } from 'express'
import {
  crearServicio, listarServicios, verServicio,
  editarServicio, cambiarEstadoServicio, eliminarServicio
} from './servicios.service'
import { asyncHandler } from '../../middlewares/Asynchandler'

export const crear = asyncHandler(async (req: Request, res: Response) => {res.status(201).json(await crearServicio(req.body))
})

export const listar = asyncHandler(async (req: Request, res: Response) => {const { buscar } = req.query
res.status(200).json(await listarServicios(buscar as string))
})

export const detalle = asyncHandler(async (req: Request, res: Response) => {res.status(200).json(await verServicio(Number(req.params.id)))
}, 404)

export const editar = asyncHandler(async (req: Request, res: Response) => {res.status(200).json(await editarServicio(Number(req.params.id), req.body))
})

export const cambiarEstado = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await cambiarEstadoServicio(Number(req.params.id)))
})

export const eliminar = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(await eliminarServicio(Number(req.params.id)))
})