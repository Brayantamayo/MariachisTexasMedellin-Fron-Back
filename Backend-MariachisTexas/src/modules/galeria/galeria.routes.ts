import { Router } from 'express';
import multer from 'multer';
import { GaleriaController } from './galeria.controller';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/', GaleriaController.list);
router.post('/', upload.single('image'), GaleriaController.upload);
router.delete('/:id', GaleriaController.delete);

export default router;
