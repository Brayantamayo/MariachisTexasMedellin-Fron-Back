import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Para subidas NO firmadas (usando el preset 'Mariachis') solo necesitamos el cloud_name.
// Esto evita el error de "Invalid api_key" si no has configurado las llaves todavía.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dlhshfzak',
  secure: true
});

export default cloudinary;
