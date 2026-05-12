import { Request, Response } from 'express';
import { GaleriaService } from './galeria.services';
import cloudinary from '../../config/cloudinary';

export const GaleriaController = {
  async list(req: Request, res: Response) {
    try {
      const items = await GaleriaService.getAll();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: 'Error al listar la galería' });
    }
  },

  async upload(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No se subió ninguna imagen' });
      }

      // Convertir el buffer a base64 para subir a Cloudinary
      const b64 = Buffer.from(req.file.buffer).toString("base64");
      const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
      
      const result = await cloudinary.uploader.unsigned_upload(dataURI, 'Mariachis', {
        folder: 'mariachis-texas/galeria',
      });


      const newItem = await GaleriaService.create({
        url: result.secure_url,
        publicId: result.public_id,
        titulo: req.body.titulo,
        descripcion: req.body.descripcion,
      });

      res.status(201).json(newItem);
    } catch (error) {
      console.error('Error in Galeria upload:', error);
      res.status(500).json({ message: 'Error al subir la imagen' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const item = await GaleriaService.findById(Number(id));

      if (!item) {
        return res.status(404).json({ message: 'Imagen no encontrada' });
      }

      if (item.publicId) {
        await cloudinary.uploader.destroy(item.publicId);
      }

      await GaleriaService.hardDelete(Number(id));

      res.json({ message: 'Imagen eliminada correctamente' });
    } catch (error) {
      console.error('Error in Galeria delete:', error);
      res.status(500).json({ message: 'Error al eliminar la imagen' });
    }
  },
};
