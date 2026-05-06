// ─── Configuración Cloudinary ─────────────────────────────────────────────────
const CLOUD_NAME   = 'dlhshfzak'
const UPLOAD_PRESET = 'Mariachis'
const BASE_URL     = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}`

// ─── Tipos ────────────────────────────────────────────────────────────────────
type ResourceType = 'image' | 'video' | 'raw' // Cloudinary usa 'video' para audio también

interface UploadResult {
  url:       string  // URL segura HTTPS
  publicId:  string  // Para eliminar después si se necesita
}

// ─── Función base de subida ───────────────────────────────────────────────────
const uploadToCloudinary = async (
  file: File,
  resourceType: ResourceType,
  folder: string,
  onProgress?: (pct: number) => void
): Promise<UploadResult> => {

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', folder)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText)
        resolve({
          url:      data.secure_url,
          publicId: data.public_id
        })
      } else {
        const err = JSON.parse(xhr.responseText)
        reject(new Error(err.error?.message || 'Error al subir archivo'))
      }
    }

    xhr.onerror = () => reject(new Error('Error de red al subir archivo'))

    xhr.open('POST', `${BASE_URL}/${resourceType}/upload`)
    xhr.send(formData)
  })
}

// ─── Subir imagen (portada canción / foto perfil usuario) ─────────────────────
export const uploadImage = async (
  file: File,
  folder: 'repertorio/portadas' | 'usuarios/fotos' | 'empleados/fotos' | 'clientes/fotos' = 'repertorio/portadas',
  onProgress?: (pct: number) => void
): Promise<string> => {

  // Validaciones
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    throw new Error('Solo se permiten imágenes JPG, PNG o WEBP')
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('La imagen no puede superar 5MB')
  }

  const result = await uploadToCloudinary(file, 'image', folder, onProgress)
  return result.url
}

// ─── Subir audio (demo de canción) ───────────────────────────────────────────
// Cloudinary usa resourceType 'video' para archivos de audio
export const uploadAudio = async (
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> => {

  // Validaciones
  const allowed = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4']
  if (!allowed.includes(file.type)) {
    throw new Error('Solo se permiten archivos MP3, WAV u OGG')
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('El audio no puede superar 20MB')
  }

  const result = await uploadToCloudinary(file, 'video', 'repertorio/audios', onProgress)
  return result.url
}