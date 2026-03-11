import { Request, Response } from 'express'
import {
  crearServicio, listarServicios, verServicio,
  editarServicio, cambiarEstadoServicio, eliminarServicio
} from './servicios.service'

export const crear = async (req: Request, res: Response) => {
  try {
    const data = await crearServicio(req.body)
    return res.status(201).json(data)
  } catch (error: any) {
    return res.status(400).json({ message: error.message })
  }
}

export const listar = async (req: Request, res: Response) => {
  try {
    const { buscar } = req.query
    const data = await listarServicios(buscar as string)
    return res.status(200).json(data)
  } catch (error: any) {
    return res.status(400).json({ message: error.message })
  }
}

export const detalle = async (req: Request, res: Response) => {
  try {
    const data = await verServicio(Number(req.params.id))
    return res.status(200).json(data)
  } catch (error: any) {
    return res.status(404).json({ message: error.message })
  }
}

export const editar = async (req: Request, res: Response) => {
  try {
    const data = await editarServicio(Number(req.params.id), req.body)
    return res.status(200).json(data)
  } catch (error: any) {
    return res.status(400).json({ message: error.message })
  }
}

export const cambiarEstado = async (req: Request, res: Response) => {
  try {
    const data = await cambiarEstadoServicio(Number(req.params.id))
    return res.status(200).json(data)
  } catch (error: any) {
    return res.status(400).json({ message: error.message })
  }
}

export const eliminar = async (req: Request, res: Response) => {
  try {
    const data = await eliminarServicio(Number(req.params.id))
    return res.status(200).json(data)
  } catch (error: any) {
    return res.status(400).json({ message: error.message })
  }
}