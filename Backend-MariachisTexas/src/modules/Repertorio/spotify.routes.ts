// src/modules/spotify/spotify.routes.ts
import { Router } from 'express';
import { search } from './spotify.controller';
import { verifyToken } from '../../middlewares/Auth.middleware';
import { requireRole } from '../../middlewares/Role.middleware';

const router = Router();

// Solo ADMIN puede buscar para evitar abuso del rate limit
router.use(verifyToken);
router.use(requireRole(['ADMIN']));

router.get('/search', search);

export default router;