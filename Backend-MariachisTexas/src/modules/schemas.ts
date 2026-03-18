import { z, ZodError } from 'zod'

// ─── HELPERS REUTILIZABLES ────────────────────────────────────────────────────
const telefono = z.string()
  .regex(/^3\d{9}$/, 'El teléfono debe iniciar con 3 y tener 10 dígitos')

const hora = z.string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato de hora inválido (HH:MM)')

const fecha = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
  .refine(d => !isNaN(Date.parse(d)), 'La fecha no es válida')

const fechaFutura = fecha
  .refine(d => new Date(d) >= new Date(new Date().toDateString()), 'La fecha no puede ser en el pasado')

const duracion = z.string()
  .regex(/^\d{1,2}:[0-5]\d$/, 'Formato de duración inválido (M:SS)')

const email = z.string()
  .email('El correo no es válido')
  .max(100, 'El correo no puede superar 100 caracteres')
  .transform(e => e.toLowerCase().trim())

const emailRegistro = email.refine(e => {
  const dominios = ['gmail.com','hotmail.com','outlook.com','yahoo.com','icloud.com','live.com','protonmail.com']
  const dominio  = e.split('@')[1]
  return dominios.includes(dominio)
}, 'El dominio del correo no es válido. Usa Gmail, Hotmail, Outlook, Yahoo, iCloud, Live o Protonmail')

const passwordRgx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\-_])[A-Za-z\d@$!%*?&\-_]{6,}$/
const password    = z.string()
  .min(6, 'La contraseña debe tener mínimo 6 caracteres')
  .regex(passwordRgx, 'La contraseña debe tener al menos una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&-_)')

const CLOUDINARY  = 'res.cloudinary.com'
const IMG_EXTS    = ['.jpg', '.jpeg', '.png', '.webp']
const AUDIO_EXTS  = ['.mp3', '.wav', '.ogg', '.mp4', '.mpeg']

const urlImagen = z.union([
  z.string()
    .url('URL de imagen inválida')
    .refine(
      u => u.includes(CLOUDINARY) || IMG_EXTS.some(e => u.toLowerCase().includes(e)),
      'La URL debe ser de Cloudinary o una imagen válida (JPG, PNG, WEBP)'
    ),
  z.literal(''),
  z.null(),
  z.undefined(),
])

const urlAudio = z.union([
  z.string()
    .url('URL de audio inválida')
    .refine(
      u => u.includes(CLOUDINARY) || AUDIO_EXTS.some(e => u.toLowerCase().includes(e)),
      'La URL debe ser de Cloudinary o un audio válido (MP3, WAV, OGG)'
    ),
  z.literal(''),
  z.null(),
  z.undefined(),
])

// ─── Servicio seleccionado (reutilizable) ────────────────────────────────────
const servicioSeleccionado = z.object({
  serviceId: z.union([z.string(), z.number()]),
  quantity:  z.number().int('La cantidad debe ser un número entero').min(1, 'La cantidad mínima es 1').max(10, 'La cantidad máxima es 10'),
})

const repertorioId = z.union([z.string(), z.number()])

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const RegistroSchema = z.object({
  nombre:               z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede superar 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras'),
  apellido:             z.string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede superar 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo puede contener letras'),
    tipoDocumento: z.string().refine(
    v => ['CEDULA', 'PASAPORTE', 'CEDULA_EXTRANJERIA'].includes(v),
    'Tipo de documento inválido. Opciones: CEDULA, PASAPORTE, CEDULA_EXTRANJERIA'
),
  numeroDocumento:      z.string()
    .regex(/^\d{6,12}$/, 'El documento debe tener entre 6 y 12 dígitos'),
  fechaNacimiento:      z.string()
    .min(1, 'La fecha de nacimiento es requerida')
    .refine(d => {
      const nacimiento = new Date(d)
      const hoy        = new Date()
      const edad       = hoy.getFullYear() - nacimiento.getFullYear()
      return edad >= 18
    }, 'Debes ser mayor de 18 años para registrarte'),
  email:                emailRegistro,
  telefonoPrincipal:    telefono,
  telefonoAlternativo:  z.union([telefono, z.literal(''), z.undefined()]).optional(),
  ciudad:               z.string().min(2, 'La ciudad es requerida').max(60, 'Ciudad demasiado larga'),
  barrio:               z.string().min(2, 'El barrio es requerido').max(80, 'Barrio demasiado largo'),
  direccion:            z.string().min(5, 'La dirección es requerida').max(150, 'Dirección demasiado larga'),
  zonaServicio: z.string().refine(
  v => ['URBANA', 'RURAL'].includes(v),
  'La zona de servicio debe ser URBANA o RURAL'
),
  password,
  passwordConfirmation: z.string().min(1, 'La confirmación de contraseña es requerida'),
  foto:                 z.string().url('URL de foto inválida').optional().or(z.literal('')),
}).refine(d => d.password === d.passwordConfirmation, {
  message: 'Las contraseñas no coinciden',
  path:    ['passwordConfirmation']
}).refine(d => d.telefonoPrincipal !== d.telefonoAlternativo, {
  message: 'El teléfono alternativo no puede ser igual al principal',
  path:    ['telefonoAlternativo']
})

export const ResetPasswordSchema = z.object({
  email,
  otp:               z.string()
    .min(6, 'El código debe tener 6 dígitos')
    .max(6, 'El código debe tener 6 dígitos')
    .regex(/^\d{6}$/, 'El código solo puede contener números'),
  nuevaPassword:     password,
  confirmarPassword: z.string().min(1, 'La confirmación es requerida'),
}).refine(d => d.nuevaPassword === d.confirmarPassword, {
  message: 'Las contraseñas no coinciden',
  path:    ['confirmarPassword']
})

// ─── COTIZACIÓN ───────────────────────────────────────────────────────────────
export const CotizacionCreateSchema = z.object({
  clientId:         z.string().optional().nullable(),
  clientName:       z.string().max(100, 'El nombre no puede superar 100 caracteres').optional(),
  clientPhone:      telefono,
  secondaryPhone:   z.union([telefono, z.literal(''), z.null()]).optional(),
  clientEmail:      email,
  homenajeado:      z.string().max(100, 'El nombre del homenajeado no puede superar 100 caracteres').optional(),
  eventDate:        fechaFutura,
  eventType:        z.string().min(1, 'El tipo de evento es requerido').max(50),
  startTime:        hora,
  endTime:          hora,
  location:         z.string().min(5, 'La dirección debe tener al menos 5 caracteres').max(200, 'Dirección demasiado larga'),
  notes:            z.string().max(1000, 'Las notas no pueden superar 1000 caracteres').optional().nullable(),
  repertoireNotes:  z.string().max(1000).optional().nullable(),
  totalAmount:      z.number().min(0).optional(),
  selectedServices: z.array(servicioSeleccionado)
    .min(1, 'Debes seleccionar al menos un servicio')
    .max(10, 'No puedes seleccionar más de 10 servicios'),
  repertoireIds:    z.array(repertorioId).max(20, 'No puedes seleccionar más de 20 canciones').optional(),
})
.refine(d => d.clientId || d.clientName?.trim(), {
  message: 'El nombre del cliente es requerido',
  path:    ['clientName']
})
.refine(d => d.startTime < d.endTime || ['00:00', '00:30'].includes(d.endTime), {
  message: 'La hora de fin debe ser posterior a la hora de inicio',
  path:    ['endTime']
})

export const CotizacionUpdateSchema = z.object({
  clientId:         z.string().optional().nullable(),
  clientName:       z.string().max(100).optional(),
  clientPhone:      telefono.optional(),
  secondaryPhone:   z.union([telefono, z.literal(''), z.null()]).optional(),
  clientEmail:      email.optional(),
  homenajeado:      z.string().max(100).optional(),
  eventDate:        fechaFutura.optional(),
  eventType:        z.string().max(50).optional(),
  startTime:        hora.optional(),
  endTime:          hora.optional(),
  location:         z.string().min(5).max(200).optional(),
  notes:            z.string().max(1000).optional().nullable(),
  totalAmount:      z.number().min(0).optional(),
  selectedServices: z.array(servicioSeleccionado)
    .min(1, 'Debes seleccionar al menos un servicio')
    .max(10).optional(),
  repertoireIds:    z.array(repertorioId).max(20).optional(),
})

// ─── RESERVA ──────────────────────────────────────────────────────────────────
export const ReservaCreateSchema = z.object({
  clienteId:        z.union([z.string(), z.number()]),
  eventDate:        fechaFutura,
  startTime:        hora,
  endTime:          hora,
  location:         z.string().min(5, 'La dirección debe tener al menos 5 caracteres').max(200),
  totalAmount:      z.number().positive('El valor total debe ser mayor a 0').max(10_000_000, 'El valor parece demasiado alto'),
  homenajeado:      z.string().max(100).optional(),
  eventType:        z.string().max(50).optional(),
  notes:            z.string().max(1000).optional().nullable(),
  selectedServices: z.array(servicioSeleccionado).max(10).optional(),
  repertoireIds:    z.array(repertorioId).max(20).optional(),
})
.refine(d => d.startTime < d.endTime || ['00:00', '00:30'].includes(d.endTime), {
  message: 'La hora de fin debe ser posterior a la hora de inicio',
  path:    ['endTime']
})

// ─── SERVICIO ─────────────────────────────────────────────────────────────────
export const ServicioCreateSchema = z.object({
  nombre:      z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  descripcion: z.string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(500, 'La descripción no puede superar 500 caracteres'),
  precio:      z.number()
    .positive('El precio debe ser mayor a 0')
    .max(5_000_000, 'El precio parece demasiado alto'),
})

export const ServicioUpdateSchema = ServicioCreateSchema.partial()

// ─── REPERTORIO ───────────────────────────────────────────────────────────────
const GENEROS     = ['Ranchera', 'Bolero', 'Son', 'Corrido', 'Huapango', 'Balada'] as const
const CATEGORIAS  = ['Serenata', 'Boda', 'Cumpleaños', 'Fúnebre', 'Show', 'Clásicos'] as const
const DIFICULTADES = ['Baja', 'Media', 'Alta'] as const

export const RepertorioCreateSchema = z.object({
  title:      z.string()
    .min(2, 'El título debe tener al menos 2 caracteres')
    .max(100, 'El título no puede superar 100 caracteres')
    .refine(t => !/^\d+$/.test(t), 'El título no puede ser solo números'),
  artist:     z.string()
    .min(2, 'El artista debe tener al menos 2 caracteres')
    .max(80, 'El artista no puede superar 80 caracteres')
    .refine(a => !/^\d+$/.test(a), 'El artista no puede ser solo números'),
  genre:      z.string().refine(
    g => (GENEROS as readonly string[]).includes(g),
    `Género inválido. Opciones: ${GENEROS.join(', ')}`
  ),
  category:   z.string().refine(
    c => (CATEGORIAS as readonly string[]).includes(c),
    `Categoría inválida. Opciones: ${CATEGORIAS.join(', ')}`
  ),
  duration:   duracion,
  difficulty: z.string().refine(
    d => (DIFICULTADES as readonly string[]).includes(d),
    `Dificultad inválida. Opciones: ${DIFICULTADES.join(', ')}`
  ).optional(),
  lyrics:     z.string()
    .max(5000, 'La letra no puede superar 5000 caracteres')
    .refine(l => !/^\d+$/.test(l), 'La letra no puede ser solo números')
    .optional()
    .nullable(),
  coverImage: urlImagen,
  audioUrl:   urlAudio,
  isActive:   z.boolean().optional(),
})

export const RepertorioUpdateSchema = RepertorioCreateSchema.partial()

// ─── HELPER: parsear errores Zod en string legible ────────────────────────────
export const zodError = (e: ZodError): string =>
  e.issues.map(issue => {
    const path = issue.path.length ? `${issue.path.join('.')}: ` : ''
    return `${path}${issue.message}`
  }).join(' | ')