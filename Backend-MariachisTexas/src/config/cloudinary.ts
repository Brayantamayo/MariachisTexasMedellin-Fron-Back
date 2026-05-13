import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configuración completa de Cloudinary con credenciales para operaciones firmadas (eliminar, etc.)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dlhshfzak',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export default cloudinary;
