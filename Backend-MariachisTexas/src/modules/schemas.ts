import { z, ZodError } from 'zod'


// ─── HELPER: fecha local como YYYY-MM-DD (sin problemas de zona horaria UTC) ──
const localDateStr = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`


// ─── HELPER: DETECCIÓN DE TEXTO GIBBERISH ─────────────────────────────────────
// Detecta texto como "wkssnjsnkks", "aaaaaabbb", "xzxzxzxzxz"

const esGibberish = (texto: string): boolean => {
  const lower = texto.toLowerCase().replace(/[\s.,;:!?()-]/g, '')
  if (lower.length < 6) return false
  if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(lower)) return true
  if (/(.)\1{4,}/.test(lower)) return true
  if (lower.length > 8) {
    const vocales = (lower.match(/[aeiouáéíóú]/g) || []).length
    if (vocales / lower.length < 0.08) return true
  }
  return false
}


// ─── Valida que una nota/texto libre tenga sentido ────────────────────────────
const textoLibre = (campo: string, max: number) =>
  z.string()
    .trim()
    .max(max, `El campo "${campo}" no puede superar ${max} caracteres`)
    .refine(t => !/^\s+$/.test(t), `El campo "${campo}" no puede ser solo espacios`)
    .refine(t => !/^[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9]+$/.test(t), `El campo "${campo}" no puede contener solo caracteres especiales`)
    .refine(t => !esGibberish(t), `El campo "${campo}" parece contener texto sin sentido. Por favor escribe algo coherente`)
    .refine(t => !/[<>{}[\]\\|^`]/.test(t), `El campo "${campo}" contiene caracteres no permitidos`)

// ─── PRIMITIVOS REUTILIZABLES ─────────────────────────────────────────────────

const TELEFONOS_INVALIDOS = /^3(000000000|111111111|222222222|333333333|444444444|555555555|666666666|777777777|888888888|999999999|123456789|987654321)$/
const PREFIJOS_VALIDOS = /^3(0[0-9]|1[0-9]|2[0-9]|3[0-9]|5[0-9])\d{7}$/

const telefono = z.string()
  .trim()
  .regex(/^3\d{9}$/, 'El teléfono debe iniciar con 3 y tener exactamente 10 dígitos')
  .refine(t => !TELEFONOS_INVALIDOS.test(t), 'Número de teléfono no válido')
  .refine(t => PREFIJOS_VALIDOS.test(t), 'El prefijo no corresponde a un operador colombiano válido')
  .refine(t => !/^(\d)\1{9}$/.test(t), 'El teléfono no puede ser un dígito repetido')

const hora = z.string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato de hora inválido (HH:MM)')

const fecha = z.string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
  .refine(d => !isNaN(Date.parse(d)), 'La fecha no es válida')
  .refine(d => {
    const [y, m, day] = d.split('-').map(Number)
    const date = new Date(y, m - 1, day)
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === day
  }, 'La fecha no existe en el calendario (ej: 31 de febrero)')

const fechaFutura = fecha
  .refine(d => d >= localDateStr(), 'La fecha no puede ser en el pasado')
  .refine(d => {
    const limite = new Date()
    limite.setFullYear(limite.getFullYear() + 2)
    return d <= localDateStr(limite)
  }, 'No se pueden agendar eventos con más de 2 años de anticipación')

const duracion = z.string()
  .trim()
  .regex(/^\d{1,2}:[0-5]\d$/, 'Formato de duración inválido (M:SS o MM:SS)')

const DOMINIOS_TEMPORALES = [
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'yopmail.com',
  'sharklasers.com', 'spam4.me', 'trashmail.com', 'dispostable.com', 'fakeinbox.com',
]

const email = z.string()
  .trim()
  .toLowerCase()
  .min(5, 'El correo es demasiado corto')
  .max(100, 'El correo no puede superar 100 caracteres')
  .email('El correo no es válido')
  .refine(e => !e.includes('..'), 'El correo no puede contener puntos consecutivos')
  .refine(e => !e.startsWith('.') && !e.endsWith('.'), 'El correo no puede empezar ni terminar con un punto')
  .refine(e => !e.includes('+'), 'No se permiten alias de correo con +')
  .refine(e => !DOMINIOS_TEMPORALES.includes(e.split('@')[1] ?? ''), 'No se permiten correos temporales')
  .refine(e => {
    const local = e.split('@')[0]
    return !/^[._-]/.test(local) && !/[._-]$/.test(local)
  }, 'La parte local del correo no puede empezar ni terminar con puntos o guiones')
  .transform(e => e.toLowerCase().trim())

// ─── EMAIL PERMISIVO (para admin — acepta cualquier dominio válido) ───────────
const emailAdmin = z.string()
  .trim()
  .toLowerCase()
  .min(5, 'El correo es demasiado corto')
  .max(100, 'El correo no puede superar 100 caracteres')
  .email('El correo no es válido')
  .refine(e => !e.includes('..'), 'El correo no puede contener puntos consecutivos')
  .refine(e => !DOMINIOS_TEMPORALES.includes(e.split('@')[1] ?? ''), 'No se permiten correos temporales')
  .transform(e => e.toLowerCase().trim())

const DOMINIOS_PERMITIDOS = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com', 'protonmail.com']

const emailRegistro = email.refine(e => {
  const dominio = e.split('@')[1]
  return DOMINIOS_PERMITIDOS.includes(dominio)
}, `Dominio no válido. Usa: ${DOMINIOS_PERMITIDOS.join(', ')}`)

// ─── CONTRASEÑA — validación relajada ────────────────────────────────────────
// Solo se exige: mínimo 6 caracteres, sin espacios, no un solo carácter repetido

const password = z.string()
  .trim()
  .min(6, 'La contraseña debe tener mínimo 6 caracteres')
  .max(64, 'La contraseña no puede superar 64 caracteres')
  .refine(p => !/\s/.test(p), 'La contraseña no puede contener espacios')
  .refine(p => !/^(.)\1+$/.test(p), 'La contraseña no puede ser un solo carácter repetido')

const CLOUDINARY = 'res.cloudinary.com'
const IMG_EXTS = ['.jpg', '.jpeg', '.png', '.webp']
const AUDIO_EXTS = ['.mp3', '.wav', '.ogg', '.mp4', '.mpeg']

const urlImagen = z.union([
  z.string().trim()
    .url('URL de imagen inválida')
    .max(500, 'URL demasiado larga')
    .refine(u => u.startsWith('https://'), 'La URL debe usar HTTPS')
    .refine(u =>
      u.includes(CLOUDINARY) ||
      u.includes('i.scdn.co') ||
      u.includes('mosaic.scdn.co') ||
      IMG_EXTS.some(e => u.toLowerCase().includes(e)),
      'URL de imagen no válida (JPG, PNG, WEBP o Cloudinary)'
    ),
  z.literal(''), z.null(), z.undefined(),
])

const urlAudio = z.union([
  z.string().trim()
    .url('URL de audio inválida')
    .max(500, 'URL demasiado larga')
    .refine(u => u.startsWith('https://'), 'La URL debe usar HTTPS')
    .refine(u =>
      u.includes(CLOUDINARY) ||
      u.includes('p.scdn.co') ||
      AUDIO_EXTS.some(e => u.toLowerCase().includes(e)),
      'URL de audio no válida (MP3, WAV, OGG o Cloudinary)'
    ),
  z.literal(''), z.null(), z.undefined(),
])

const servicioSeleccionado = z.object({
  serviceId: z.union([
    z.string().min(1, 'El ID del servicio no puede estar vacío'),
    z.number().int().positive('El ID debe ser un número positivo')
  ]),
  quantity: z.number()
    .int('La cantidad debe ser un número entero')
    .min(1, 'La cantidad mínima es 1')
    .max(10, 'La cantidad máxima es 10'),
})

const repertorioId = z.union([z.string().min(1), z.number().int().positive()])


// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const RegistroSchema = z.object({

  nombre: z.string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede superar 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'El nombre solo puede contener letras')
    .refine(n => n.trim().length > 0, 'El nombre no puede ser solo espacios')
    .refine(n => !/\s{2,}/.test(n), 'El nombre no puede tener espacios consecutivos')
    .refine(n => n.trim().split(/\s+/).every(p => p.length >= 2), 'Cada parte del nombre debe tener al menos 2 letras')
    .refine(n => !/\d/.test(n), 'El nombre no puede contener números')
    .refine(n => !esGibberish(n), 'El nombre parece contener texto sin sentido'),

  apellido: z.string()
    .trim()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede superar 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'El apellido solo puede contener letras')
    .refine(a => a.trim().length > 0, 'El apellido no puede ser solo espacios')
    .refine(a => !/\s{2,}/.test(a), 'El apellido no puede tener espacios consecutivos')
    .refine(a => a.trim().split(/\s+/).every(p => p.length >= 2), 'Cada parte del apellido debe tener al menos 2 letras')
    .refine(a => !/\d/.test(a), 'El apellido no puede contener números')
    .refine(a => !esGibberish(a), 'El apellido parece contener texto sin sentido'),
  tipoDocumento: z.string().trim().refine(
    v => ['CC', 'CE', 'TI', 'PAS'].includes(v), 'Tipo de documento inválido. Opciones: CC, CE, TI, PAS'
  ),

  numeroDocumento: z.string()
    .trim()
    .regex(/^\d{6,12}$/, 'El documento debe tener entre 6 y 12 dígitos')
    .refine(n => !/^0+$/.test(n), 'El documento no puede ser solo ceros')
    .refine(n => !/^(\d)\1+$/.test(n), 'El documento no puede ser un dígito repetido')
    .refine(n => n !== '123456789', 'El documento no puede ser una secuencia obvia')
    .refine(n => !['000000', '00000000', '000000000', '0000000000'].includes(n), 'Número de documento no válido'),

  fechaNacimiento: z.string()
    .trim()
    .min(1, 'La fecha de nacimiento es requerida')
    .refine(d => !isNaN(Date.parse(d)), 'La fecha de nacimiento no es válida')
    .refine(d => new Date(d).getFullYear() >= 1940, 'El año de nacimiento no puede ser anterior a 1940')
    .refine(d => new Date(d) <= new Date(), 'La fecha de nacimiento no puede ser en el futuro')
    .refine(d => {
      const nac = new Date(d)
      const hoy = new Date()
      const edad = hoy.getFullYear() - nac.getFullYear()
      const cumple = new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate())
      return (hoy >= cumple ? edad : edad - 1) >= 18
    }, 'Debes ser mayor de 18 años para registrarte')
    .refine(d => new Date().getFullYear() - new Date(d).getFullYear() <= 100, 'La edad ingresada supera los 100 años'),

  email: emailRegistro,
  telefonoPrincipal: telefono,
  telefonoAlternativo: z.union([telefono, z.literal(''), z.undefined()]).optional(),

  ciudad: z.string()
    .trim()
    .min(2, 'La ciudad es requerida')
    .max(60, 'Ciudad demasiado larga')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-\.]+$/, 'La ciudad solo puede contener letras')
    .refine(c => c.trim().length > 0, 'La ciudad no puede ser solo espacios'),

  barrio: z.string()
    .trim()
    .min(2, 'El barrio es requerido')
    .max(80, 'Barrio demasiado largo')
    .refine(b => b.trim().length > 0, 'El barrio no puede ser solo espacios')
    .refine(b => !/^\d+$/.test(b.trim()), 'El barrio no puede ser solo números'),

  direccion: z.string()
    .trim()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(150, 'Dirección demasiado larga')
    .refine(d => d.trim().length > 0, 'La dirección no puede ser solo espacios')
    .refine(d => /\d/.test(d), 'La dirección debe incluir al menos un número')
    .refine(d => /[a-zA-Z]/.test(d), 'La dirección debe incluir letras')
    .refine(d => !/^\d+$/.test(d.trim()), 'La dirección no puede ser solo números')
    .refine(d => !/[<>{}[\]\\|^`]/.test(d), 'La dirección contiene caracteres no permitidos'),

  zonaServicio: z.string().trim().refine(
    v => ['URBANA', 'RURAL'].includes(v), 'La zona de servicio debe ser URBANA o RURAL'
  ),

  password,
  passwordConfirmation: z.string().trim().min(1, 'La confirmación de contraseña es requerida'),
  foto: z.string().trim().url('URL de foto inválida').optional().or(z.literal('')),
})
  .refine(d => d.password === d.passwordConfirmation, {
    message: 'Las contraseñas no coinciden', path: ['passwordConfirmation']
  })
  .refine(d => !d.telefonoAlternativo || d.telefonoPrincipal !== d.telefonoAlternativo, {
    message: 'El teléfono alternativo no puede ser igual al principal', path: ['telefonoAlternativo']
  })
  .refine(d => d.nombre.trim().toLowerCase() !== d.apellido.trim().toLowerCase(), {
    message: 'El nombre y el apellido no pueden ser iguales', path: ['apellido']
  })

export const ResetPasswordSchema = z.object({
  email,
  otp: z.string()
    .trim()
    .length(6, 'El código debe tener exactamente 6 dígitos')
    .regex(/^\d{6}$/, 'El código solo puede contener números')
    .refine(o => !/^(\d)\1+$/.test(o), 'El código no puede ser un dígito repetido')
    .refine(o => !['123456', '000000', '111111', '222222', '999999', '654321'].includes(o), 'Código no válido'),
  nuevaPassword: password,
  confirmarPassword: z.string().trim().min(1, 'La confirmación es requerida'),
}).refine(d => d.nuevaPassword === d.confirmarPassword, {
  message: 'Las contraseñas no coinciden', path: ['confirmarPassword']
})


// ─── COTIZACIÓN ───────────────────────────────────────────────────────────────
export const CotizacionCreateSchema = z.object({
  clientId: z.string().optional().nullable(),
  clientName: z.string().trim().max(100)
    .refine(n => !n || !esGibberish(n), 'El nombre del cliente parece contener texto sin sentido')
    .optional(),
  clientPhone: telefono,
  secondaryPhone: z.union([telefono, z.literal(''), z.null()]).optional(),
  clientEmail: email,
  homenajeado: z.string().trim().max(100)
    .refine(h => !h || !esGibberish(h), 'El nombre del homenajeado parece contener texto sin sentido')
    .optional(),
  eventDate: fechaFutura,
  eventType: z.string().trim().min(1, 'El tipo de evento es requerido').max(50),
  startTime: hora,
  endTime: hora,
  location: z.string().trim()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(200, 'Dirección demasiado larga')
    .refine(l => /\d/.test(l), 'La dirección del evento debe incluir un número')
    .refine(l => /[a-zA-Z]/.test(l), 'La dirección del evento debe incluir letras')
    .refine(l => !esGibberish(l), 'La dirección parece contener texto sin sentido'),
  notes: textoLibre('notas', 1000).optional().nullable(),
  repertoireNotes: textoLibre('notas de repertorio', 1000).optional().nullable(),
  totalAmount: z.number().min(0).max(100_000_000).optional(),
  selectedServices: z.array(servicioSeleccionado).min(1).max(10),
  repertoireIds: z.array(repertorioId).max(20).optional(),
})
  .refine(d => d.clientId || d.clientName?.trim(), {
    message: 'El nombre del cliente es requerido', path: ['clientName']
  })
  .refine(d => d.startTime < d.endTime || ['00:00', '00:30'].includes(d.endTime), {
    message: 'La hora de fin debe ser posterior a la hora de inicio', path: ['endTime']
  })
  .refine(d => {
    const [sh, sm] = d.startTime.split(':').map(Number)
    const [eh, em] = d.endTime.split(':').map(Number)
    const diffMin = (eh * 60 + em) - (sh * 60 + sm)
    return diffMin >= 60 || diffMin < 0
  }, { message: 'El evento debe durar al menos 1 hora', path: ['endTime'] })
  .refine(d => {
    const ids = d.selectedServices.map(s => String(s.serviceId))
    return ids.length === new Set(ids).size
  }, { message: 'No puedes seleccionar el mismo servicio más de una vez', path: ['selectedServices'] })
  .refine(d => {
    if (d.eventDate !== localDateStr()) return true
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const [sh, sm] = d.startTime.split(':').map(Number)
    return sh * 60 + sm > currentMinutes
  }, { message: 'Si el evento es hoy, la hora de inicio debe ser posterior a la hora actual', path: ['startTime'] })

export const CotizacionUpdateSchema = z.object({
  clientId: z.string().optional().nullable(),
  clientName: z.string().trim().max(100).optional(),
  clientPhone: telefono.optional(),
  secondaryPhone: z.union([telefono, z.literal(''), z.null()]).optional(),
  clientEmail: email.optional(),
  homenajeado: z.string().trim().max(100).optional(),
  eventDate: fechaFutura.optional(),
  eventType: z.string().trim().max(50).optional(),
  startTime: hora.optional(),
  endTime: hora.optional(),
  location: z.string().trim().min(5).max(200).optional(),
  notes: textoLibre('notas', 1000).optional().nullable(),
  totalAmount: z.number().min(0).max(100_000_000).optional(),
  selectedServices: z.array(servicioSeleccionado).min(1).max(10).optional(),
  repertoireIds: z.array(repertorioId).max(20).optional(),
})


// ─── RESERVA ──────────────════════════════════════════════════════════════════


export const ReservaCreateSchema = z.object({
  clienteId: z.union([z.string(), z.number()]),
  eventDate: fechaFutura,
  startTime: hora,
  endTime: hora,
  location: z.string().trim()
    .min(5).max(200)
    .refine(l => /\d/.test(l), 'La dirección debe incluir un número')
    .refine(l => /[a-zA-Z]/.test(l), 'La dirección debe incluir letras')
    .refine(l => !esGibberish(l), 'La dirección parece contener texto sin sentido'),
  totalAmount: z.number()
    .positive('El valor total debe ser mayor a 0')
    .max(10_000_000, 'El valor parece demasiado alto')
    .refine(v => Number.isFinite(v), 'El valor debe ser un número válido')
    .refine(v => (v * 100) % 1 === 0, 'El valor no puede tener más de 2 decimales'),
  homenajeado: z.string().trim().max(100).refine(h => !esGibberish(h), 'El nombre parece contener texto sin sentido').optional(),
  eventType: z.string().trim().max(50).optional(),
  notes: textoLibre('notas', 1000).optional().nullable(),
  selectedServices: z.array(servicioSeleccionado).max(10).optional(),
  repertoireIds: z.array(repertorioId).max(20).optional(),
})
  .refine(d => d.startTime < d.endTime || ['00:00', '00:30'].includes(d.endTime), {
    message: 'La hora de fin debe ser posterior a la hora de inicio', path: ['endTime']
  })
  .refine(d => {
    const [sh, sm] = d.startTime.split(':').map(Number)
    const [eh, em] = d.endTime.split(':').map(Number)
    const diffMin = (eh * 60 + em) - (sh * 60 + sm)
    return diffMin >= 60 || diffMin < 0
  }, { message: 'La reserva debe durar al menos 1 hora', path: ['endTime'] })
  .refine(d => {
    if (d.eventDate !== localDateStr()) return true
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const [sh, sm] = d.startTime.split(':').map(Number)
    return sh * 60 + sm > currentMinutes
  }, { message: 'Si el evento es hoy, la hora de inicio debe ser posterior a la hora actual', path: ['startTime'] })

export const ReservaUpdateSchema = z.object({
  eventDate: fechaFutura.optional(),
  startTime: hora.optional(),
  endTime: hora.optional(),
  location: z.string().trim().min(5).max(200).optional(),
  homenajeado: z.string().trim().max(100).optional(),
  eventType: z.string().trim().max(50).optional(),
  notes: textoLibre('notas', 1000).optional().nullable(),
  totalAmount: z.number().positive().max(10_000_000).optional(),
  selectedServices: z.array(servicioSeleccionado).min(1).max(10).optional(),
  repertoireIds: z.array(repertorioId).max(20).optional(),
})
  .refine(d => {
    if (d.startTime && d.endTime)
      return d.startTime < d.endTime || ['00:00', '00:30'].includes(d.endTime)
    return true
  }, { message: 'La hora de fin debe ser posterior a la hora de inicio', path: ['endTime'] })


// ─── SERVICIO ─────────────────────────────────────────────────────────────────


const precioServicio = z.union([z.string(), z.number()])
  .refine(v => typeof v !== 'string' || !v.trim().startsWith('0'), 'El precio no puede empezar con 0')
  .transform(v => Number(v))
  .pipe(
    z.number()
      .positive('El precio debe ser mayor a 0')
      .max(5_000_000, 'El precio parece demasiado alto')
      .refine(p => Number.isFinite(p), 'El precio debe ser un número válido')
      .refine(p => (p * 100) % 1 === 0, 'El precio no puede tener más de 2 decimales')
      .refine(p => p >= 1000, 'El precio mínimo es $1.000 COP')
  )

export const ServicioCreateSchema = z.object({
  nombre: z.string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres')
    .refine(n => n.trim().length > 0, 'El nombre no puede ser solo espacios')
    .refine(n => !/^\d+$/.test(n.trim()), 'El nombre no puede ser solo números')
    .refine(n => !/[<>{}[\]\\]/.test(n), 'El nombre contiene caracteres no permitidos')
    .refine(n => !esGibberish(n), 'El nombre parece contener texto sin sentido')
    .refine(n => n.trim().split(/\s+/).every(p => p.length >= 2), 'Cada palabra del nombre debe tener al menos 2 caracteres')
    .refine(n => n.trim().split(/\s+/).some(p => p.length >= 3), 'El nombre debe contener al menos una palabra de 3 o más caracteres')
    .refine(n => n.trim().split(/\s+/).some(p => p.length >= 4), 'El nombre debe contener al menos una palabra de 4 o más caracteres'),

  descripcion: z.string()
    .trim()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(100, 'La descripción no puede superar 100 caracteres')
    .refine(d => d.trim().length > 0, 'La descripción no puede ser solo espacios')
    .refine(d => !/^\d+$/.test(d.trim()), 'La descripción no puede ser solo números')
    .refine(d => !/[<>{}[\]\\]/.test(d), 'La descripción contiene caracteres no permitidos')
    .refine(d => !esGibberish(d), 'La descripción parece contener texto sin sentido'),
  precio: precioServicio,
})

export const ServicioUpdateSchema = z.object({
  nombre: z.string()
    .trim().min(2).max(100)
    .refine(n => n.trim().length > 0, 'El nombre no puede ser solo espacios')
    .refine(n => !/^\d+$/.test(n.trim()), 'El nombre no puede ser solo números')
    .refine(n => !esGibberish(n), 'El nombre parece contener texto sin sentido')
    .refine(n => n.trim().split(/\s+/).every(p => p.length >= 2), 'Cada palabra del nombre debe tener al menos 2 caracteres')
    .refine(n => n.trim().split(/\s+/).some(p => p.length >= 3), 'El nombre debe contener al menos una palabra de 3 o más caracteres')
    .optional(),

  descripcion: z.string()
    .trim().min(10).max(500)
    .refine(d => d.trim().length > 0, 'La descripción no puede ser solo espacios')
    .refine(d => !esGibberish(d), 'La descripción parece contener texto sin sentido')
    .optional(),
  precio: precioServicio.optional(),
})


// ─── ENSAYO ───────────────────────────────────────────────────────────────────

export const ESTADOS_ENSAYO = ['PENDIENTE', 'LISTO'] as const
export type EstadoEnsayo = typeof ESTADOS_ENSAYO[number]

export const EnsayoCreateSchema = z.object({
  title: z.string()
    .trim()
    .min(2, 'El título debe tener al menos 2 caracteres')
    .max(100, 'El título no puede superar 100 caracteres')
    .refine(t => t.trim().length > 0, 'El título no puede ser solo espacios')
    .refine(t => !/^\d+$/.test(t.trim()), 'El título no puede ser solo números')
    .refine(t => !/[<>{}[\]\\]/.test(t), 'El título contiene caracteres no permitidos')
    .refine(t => !esGibberish(t), 'El título parece contener texto sin sentido')
    .refine(t => t.length <= 50, 'El título no puede superar 50 caracteres')
    .refine(t => t.length >= 2, 'El título no puede ser menor a 2 caracteres'),

  location: z.string()
    .trim()
    .min(2, 'El lugar debe tener al menos 2 caracteres')
    .max(50, 'El lugar no puede superar 50 caracteres')
    .refine(l => l.trim().length > 0, 'El lugar no puede ser solo espacios')
    .refine(l => !/[<>{}[\]\\]/.test(l), 'El lugar contiene caracteres no permitidos')
    .refine(l => !esGibberish(l), 'El lugar parece contener texto sin sentido')
    .refine(t => t.length <= 200, 'El lugar no puede superar 200 caracteres'),
  address: z.string().trim().max(200).optional().nullable(),
  date: fechaFutura,
  time: hora,
  status: z.enum(['PENDIENTE', 'LISTO']).optional(),
  repertoireIds: z.array(repertorioId).max(20).optional(),
})

export const EnsayoUpdateSchema = z.object({
  title: z.string()
    .trim()
    .min(2, 'El título debe tener al menos 2 caracteres')
    .max(100, 'El título no puede superar 100 caracteres')
    .refine(t => t.trim().length > 0, 'El título no puede ser solo espacios')
    .refine(t => !/^\d+$/.test(t.trim()), 'El título no puede ser solo números')
    .refine(t => !/[<>{}[\]\\]/.test(t), 'El título contiene caracteres no permitidos')
    .refine(t => !esGibberish(t), 'El título parece contener texto sin sentido')
    .refine(t => t.length <= 50, 'El título no puede superar 50 caracteres')
    .refine(t => t.length >= 2, 'El título no puede ser menor a 2 caracteres')
    .optional(),
  location: z.string()
    .trim()
    .min(2, 'El lugar debe tener al menos 2 caracteres')
    .max(50, 'El lugar no puede superar 50 caracteres')
    .refine(l => l.trim().length > 0, 'El lugar no puede ser solo espacios')
    .refine(l => !/[<>{}[\]\\]/.test(l), 'El lugar contiene caracteres no permitidos')
    .refine(l => !esGibberish(l), 'El lugar parece contener texto sin sentido')
    .refine(t => t.length <= 200, 'El lugar no puede superar 200 caracteres')
    .optional(),
  address: z.string().trim().max(200).optional().nullable(),
  date: fechaFutura.optional(),
  time: hora.optional(),
  status: z.enum(['PENDIENTE', 'LISTO']).optional(),
  repertoireIds: z.array(repertorioId).max(20).optional()
})




// ─── REPERTORIO ───────────────────────────────────────────────────────────────

const CATEGORIAS = [
  'Boda', 'Cumpleaños', 'Quinceaños', 'Funeral', 'Reconciliación',
  'Día de la Madre', 'Amor', 'Aniversario', 'Padres', 'Fiesta', 'Otro',
] as const
const DIFICULTADES = ['Baja', 'Media', 'Alta'] as const

export const RepertorioCreateSchema = z.object({
  title: z.string()
    .trim()
    .min(2, 'El título debe tener al menos 2 caracteres')
    .max(100, 'El título no puede superar 100 caracteres')
    .refine(t => t.trim().length > 0, 'El título no puede ser solo espacios')
    .refine(t => !/^\d+$/.test(t.trim()), 'El título no puede ser solo números')
    .refine(t => !esGibberish(t), 'El título parece contener texto sin sentido')
    .refine(t => !/\s{2,}/.test(t.trim()), 'El título no puede tener espacios consecutivos'),
  artist: z.string()
    .trim()
    .min(2, 'El artista debe tener al menos 2 caracteres')
    .max(80, 'El artista no puede superar 80 caracteres')
    .refine(a => a.trim().length > 0, 'El artista no puede ser solo espacios')
    .refine(a => !/^\d+$/.test(a.trim()), 'El artista no puede ser solo números')
    .refine(a => !esGibberish(a), 'El artista parece contener texto sin sentido')
    .refine(a => !/\s{2,}/.test(a.trim()), 'El artista no puede tener espacios consecutivos'),
  genre: z.string()
    .trim()
    .min(2, 'El género debe tener al menos 2 caracteres')
    .max(50, 'El género no puede superar 50 caracteres')
    .refine(g => g.replace(/\s+/g, '').length >= 2, 'El género debe tener al menos 2 caracteres reales')
    .refine(g => g.trim().length > 0, 'El género no puede ser solo espacios')
    .refine(g => !/^\d+$/.test(g.trim()), 'El género no puede ser solo números')
    .refine(g => !esGibberish(g), 'El género parece contener texto sin sentido')
    .refine(g => !/\s{2,}/.test(g.trim()), 'El género no puede tener espacios consecutivos'),
  category: z.string().trim().refine(
    c => (CATEGORIAS as readonly string[]).includes(c), `Categoría inválida. Opciones: ${CATEGORIAS.join(', ')}`
  ),
  duration: duracion,
  difficulty: z.string().trim().refine(
    d => (DIFICULTADES as readonly string[]).includes(d),
    `Dificultad inválida. Opciones: ${DIFICULTADES.join(', ')}`
  ).optional(),
  lyrics: z.string()
    .trim()
    .max(5000, 'La letra no puede superar 5000 caracteres')
    .refine(l => !/^\d+$/.test(l), 'La letra no puede ser solo números')
    .refine(l => !esGibberish(l), 'La letra parece contener texto sin sentido')
    .refine(l => !/[<>{}[\]\\]/.test(l), 'La letra contiene caracteres no permitidos')
    .optional()
    .nullable(),

  coverImage: urlImagen,
  audioUrl: urlAudio,
  isActive: z.boolean().optional(),
})
  .refine(d => {
    const [min, sec] = d.duration.split(':').map(Number)
    const totalSeconds = min * 60 + sec
    return totalSeconds >= 30 && totalSeconds <= 600
  }, { message: 'La duración debe estar entre 0:30 y 10:00 minutos', path: ['duration'] })
  .refine(d => d.title.toLowerCase().trim() !== d.artist.toLowerCase().trim(), {
    message: 'El título no puede ser igual al artista', path: ['artist']
  })

export const RepertorioUpdateSchema = z.object({
  title: z.string()
    .trim()
    .min(2, 'El título debe tener al menos 2 caracteres')
    .max(100, 'El título no puede superar 100 caracteres')
    .refine(t => t.trim().length > 0, 'El título no puede ser solo espacios')
    .refine(t => !/^\d+$/.test(t.trim()), 'El título no puede ser solo números')
    .refine(t => !esGibberish(t), 'El título parece contener texto sin sentido')
    .refine(t => !/\s{2,}/.test(t.trim()), 'El título no puede tener espacios consecutivos')
    .optional(),
  artist: z.string()
    .trim()
    .min(2, 'El artista debe tener al menos 2 caracteres')
    .max(80, 'El artista no puede superar 80 caracteres')
    .refine(a => a.trim().length > 0, 'El artista no puede ser solo espacios')
    .refine(a => !/^\d+$/.test(a.trim()), 'El artista no puede ser solo números')
    .refine(a => !esGibberish(a), 'El artista parece contener texto sin sentido')
    .refine(a => !/\s{2,}/.test(a.trim()), 'El artista no puede tener espacios consecutivos')
    .optional(),
  genre: z.string()
    .trim()
    .min(2, 'El género debe tener al menos 2 caracteres')
    .max(50, 'El género no puede superar 50 caracteres')
    .refine(g => g.replace(/\s+/g, '').length >= 2, 'El género debe tener al menos 2 caracteres reales')
    .refine(g => g.trim().length > 0, 'El género no puede ser solo espacios')
    .refine(g => !/^\d+$/.test(g.trim()), 'El género no puede ser solo números')
    .refine(g => !esGibberish(g), 'El género parece contener texto sin sentido')
    .refine(g => !/\s{2,}/.test(g.trim()), 'El género no puede tener espacios consecutivos')
    .optional(),
  category: z.string().trim().refine(
    c => (CATEGORIAS as readonly string[]).includes(c), `Categoría inválida. Opciones: ${CATEGORIAS.join(', ')}`
  ).optional(),
  duration: duracion.optional(),
  difficulty: z.string().trim().refine(
    d => (DIFICULTADES as readonly string[]).includes(d),
    `Dificultad inválida. Opciones: ${DIFICULTADES.join(', ')}`
  ).optional(),
  lyrics: z.string()
    .trim()
    .max(5000, 'La letra no puede superar 5000 caracteres')
    .refine(l => !/^\d+$/.test(l), 'La letra no puede ser solo números')
    .refine(l => !esGibberish(l), 'La letra parece contener texto sin sentido')
    .refine(l => !/[<>{}[\]\\]/.test(l), 'La letra contiene caracteres no permitidos')
    .optional()
    .nullable(),
  coverImage: urlImagen.optional(),
  audioUrl: urlAudio.optional(),
  isActive: z.boolean().optional()
})
  .refine(d => {
    if (!d.duration) return true
    const [min, sec] = d.duration.split(':').map(Number)
    const totalSeconds = min * 60 + sec
    return totalSeconds >= 30 && totalSeconds <= 600
  }, { message: 'La duración debe estar entre 0:30 y 10:00 minutos', path: ['duration'] })
  .refine(d => {
    if (!d.title || !d.artist) return true
    return d.title.toLowerCase().trim() !== d.artist.toLowerCase().trim()
  }, { message: 'El título no puede ser igual al artista', path: ['artist'] })

// ─── VENTA ────────────────────────────────────────────────────────────────────

export const VentaCreateSchema = z.object({
  reservaId: z.union([z.number().int().positive(), z.null()]).optional(),
  clienteId: z.number().int().positive('El ID del cliente debe ser un número positivo'),
  tipo: z.enum(['RESERVA', 'DIRECTA']),
  estado: z.enum(['CONFIRMADO', 'FINALIZADO', 'VENTA_DIRECTA']).optional().default('CONFIRMADO'),



  montoTotal: z.number()
    .positive('El monto total debe ser mayor a 0')
    .max(10_000_000, 'El monto parece demasiado alto')
    .refine(v => Number.isFinite(v), 'El monto debe ser un número válido')
    .refine(v => (v * 100) % 1 === 0, 'El monto no puede tener más de 2 decimales')
    .refine(v => v >= 1000, 'El monto mínimo es $1.000 COP')
    .refine(v => v <= 10_000_000, 'El monto máximo es $10.000.000 COP'),

  montoPagado: z.number()
    .min(0, 'El monto pagado no puede ser negativo')
    .max(10_000_000, 'El monto parece demasiado alto')
    .refine(v => Number.isFinite(v), 'El monto debe ser un número válido')
    .refine(v => (v * 100) % 1 === 0, 'El monto no puede tener más de 2 decimales'),
  fechaVenta: fecha,
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'NEQUI', 'DAVIPLATA', 'OTRO']),
})
  .refine(d => d.montoPagado <= d.montoTotal, {
    message: 'El monto pagado no puede ser mayor al total', path: ['montoPagado']
  })


export const RolCreateSchema = z.object({
  nombre: z.string()
    .trim()
    .min(2, 'El nombre del rol debe tener al menos 2 caracteres')
    .max(50, 'El nombre del rol no puede superar 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios')
    .refine(n => !esGibberish(n), 'El nombre parece contener texto sin sentido'),
  descripcion: textoLibre('descripción', 200).optional(),
  estado: z.boolean().optional().default(true),
  permisos: z.array(z.number().int().positive('Los IDs de permisos deben ser números positivos')).optional().default([])
})

export const RolUpdateSchema = z.object({
  nombre: z.string()
    .trim()
    .min(2, 'El nombre del rol debe tener al menos 2 caracteres')
    .max(50, 'El nombre del rol no puede superar 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios')
    .refine(n => !esGibberish(n), 'El nombre parece contener texto sin sentido')
    .optional(),
  descripcion: textoLibre('descripción', 200).optional(),
  estado: z.boolean().optional(),
  permisos: z.array(z.number().int().positive('Los IDs de permisos deben ser números positivos')).optional()
})

// ─── NOMBRE REUTILIZABLE ──────────────────────────────────────────────────────
const nombreUsuario = z.string()
  .trim()
  .transform(n => n.replace(/\s+/g, ' ').trim()) // normaliza espacios múltiples
  .pipe(z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'El nombre solo puede contener letras')
    .refine(n => n.trim().length > 0, 'El nombre no puede ser solo espacios')
    .refine(n => n.trim().split(/\s+/).every(p => p.length >= 2), 'Cada parte del nombre debe tener al menos 2 letras')
    .refine(n => !/\d/.test(n), 'El nombre no puede contener números')
    .refine(n => !esGibberish(n), 'El nombre parece contener texto sin sentido')
  )

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const LoginSchema = z.object({
  email: z.string().trim().min(1, 'El correo es requerido').email('El correo no es válido'),
  password: z.string().trim().min(1, 'La contraseña es requerida'),
})

export const UsuarioCreateSchema = z.object({
  nombre: nombreUsuario,
  apellido: z.string()
    .trim()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede superar 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'El apellido solo puede contener letras')
    .refine(a => a.trim().length > 0, 'El apellido no puede ser solo espacios')
    .refine(a => !/\s{2,}/.test(a), 'El apellido no puede tener espacios consecutivos')
    .refine(a => a.trim().split(/\s+/).every(p => p.length >= 2), 'Cada parte del apellido debe tener al menos 2 letras')
    .refine(a => !/\d/.test(a), 'El apellido no puede contener números')
    .refine(a => !esGibberish(a), 'El apellido parece contener texto sin sentido')
    .optional(),
  email: email,
  password: password,
  passwordConfirmation: z.string().trim().min(1, 'La confirmación de contraseña es requerida').optional(),
  rolId: z.number().int().positive('El ID del rol debe ser un número positivo'),
  estado: z.boolean().optional().default(true),
  clienteData: z.any().optional(),
  empleadoData: z.any().optional(),
})
  .refine(d => !d.passwordConfirmation || d.password === d.passwordConfirmation, {
    message: 'Las contraseñas no coinciden', path: ['passwordConfirmation'],
  })
  .refine(d => !d.apellido || d.nombre.trim().toLowerCase() !== d.apellido.trim().toLowerCase(), {
    message: 'El nombre y el apellido no pueden ser iguales', path: ['apellido'],
  })

export const UsuarioUpdateSchema = z.object({
  nombre: nombreUsuario.optional(),
  apellido: z.string()
    .trim()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede superar 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'El apellido solo puede contener letras')
    .refine(a => a.trim().length > 0, 'El apellido no puede ser solo espacios')
    .refine(a => !/\s{2,}/.test(a), 'El apellido no puede tener espacios consecutivos')
    .refine(a => a.trim().split(/\s+/).every(p => p.length >= 2), 'Cada parte del apellido debe tener al menos 2 letras')
    .refine(a => !/\d/.test(a), 'El apellido no puede contener números')
    .refine(a => !esGibberish(a), 'El apellido parece contener texto sin sentido')
    .optional(),
  email: email.optional(),
  // password vacío ('') se trata como "no cambiar"
  password: z.string().trim().transform(v => v === '' ? undefined : v)
    .pipe(password.optional())
    .optional(),
  passwordConfirmation: z.string().trim().optional(),
  estado: z.boolean().optional(),
  rolId: z.number().int().positive('El ID del rol debe ser un número positivo').optional(),
  clienteData: z.any().optional(),
  empleadoData: z.any().optional(),
})
  .refine(d => {
    const pwd = d.password
    if (!pwd) return true
    if (!d.passwordConfirmation) return false
    return pwd === d.passwordConfirmation
  }, { message: 'Las contraseñas no coinciden', path: ['passwordConfirmation'] })
  .refine(d => !d.nombre || !d.apellido || d.nombre.trim().toLowerCase() !== d.apellido.trim().toLowerCase(), {
    message: 'El nombre y el apellido no pueden ser iguales', path: ['apellido'],
  })

export const EmpleadoCreateSchema = z.object({
  nombre: z.string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede superar 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'El nombre solo puede contener letras')
    .refine(n => n.trim().length > 0, 'El nombre no puede ser solo espacios')
    .refine(n => !/\s{2,}/.test(n), 'El nombre no puede tener espacios consecutivos')
    .refine(n => n.trim().split(/\s+/).every(p => p.length >= 2), 'Cada parte del nombre debe tener al menos 2 letras')
    .refine(n => !/\d/.test(n), 'El nombre no puede contener números')
    .refine(n => !esGibberish(n), 'El nombre parece contener texto sin sentido'),
  email: email,
  password: password,
  tipoDocumento: z.string().trim().refine(
    v => ['CC', 'CE', 'TI', 'PAS'].includes(v), 'Tipo de documento inválido. Opciones: CC, CE, TI, PAS'
  ),
  numeroDocumento: z.string()
    .trim()
    .regex(/^\d{6,12}$/, 'El documento debe tener entre 6 y 12 dígitos')
    .refine(n => !/^0+$/.test(n), 'El documento no puede ser solo ceros')
    .refine(n => !/^(\d)\1+$/.test(n), 'El documento no puede ser un dígito repetido')
    .refine(n => n !== '123456789', 'El documento no puede ser una secuencia obvia'),
  fechaNacimiento: z.string()
    .trim()
    .refine(d => !isNaN(Date.parse(d)), 'La fecha de nacimiento no es válida')
    .refine(d => new Date(d).getFullYear() >= 1940, 'El año de nacimiento no puede ser anterior a 1940')
    .refine(d => new Date(d) <= new Date(), 'La fecha de nacimiento no puede ser en el futuro')
    .refine(d => {
      const nac = new Date(d)
      const hoy = new Date()
      const edad = hoy.getFullYear() - nac.getFullYear()
      const cumple = new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate())
      return (hoy >= cumple ? edad : edad - 1) >= 18
    }, 'Debes ser mayor de 18 años para trabajar con nosotros')
    .refine(d => new Date().getFullYear() - new Date(d).getFullYear() <= 100, 'La edad ingresada supera los 100 años'),
  telefonoPrincipal: telefono,
  telefonoAlternativo: z.union([telefono, z.literal(''), z.undefined()]).optional(),
  ciudad: z.string()
    .trim()
    .min(2, 'La ciudad es requerida')
    .max(60, 'Ciudad demasiado larga')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-\.]+$/, 'La ciudad solo puede contener letras')
    .refine(c => c.trim().length > 0, 'La ciudad no puede ser solo espacios')
    .optional(),
  barrio: z.string()
    .trim()
    .min(2, 'El barrio es requerido')
    .max(80, 'Barrio demasiado largo')
    .refine(b => b.trim().length > 0, 'El barrio no puede ser solo espacios')
    .refine(b => !/^\d+$/.test(b.trim()), 'El barrio no puede ser solo números'),
  direccion: z.string()
    .trim()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(150, 'Dirección demasiado larga')
    .refine(d => d.trim().length > 0, 'La dirección no puede ser solo espacios')
    .refine(d => /\d/.test(d), 'La dirección debe incluir al menos un número')
    .refine(d => /[a-zA-Z]/.test(d), 'La dirección debe incluir letras')
    .refine(d => !/^\d+$/.test(d.trim()), 'La dirección no puede ser solo números')
    .refine(d => !/[<>{}[\]\\|^`]/.test(d), 'La dirección contiene caracteres no permitidos'),
  zonaServicio: z.string().trim().refine(
    v => ['URBANA', 'RURAL'].includes(v), 'La zona de servicio debe be URBANA o RURAL'
  ).optional(),
  instrumentoPrincipal: z.string()
    .trim()
    .min(2, 'El instrumento debe tener al menos 2 caracteres')
    .max(50, 'El instrumento no puede superar 50 caracteres')
    .refine(i => !esGibberish(i), 'El instrumento parece contener texto sin sentido'),
  otrosInstrumentos: z.string()
    .trim()
    .max(200, 'Otros instrumentos no pueden superar 200 caracteres')
    .optional(),
  anosExperiencia: z.number().min(0).max(100).optional(),
  foto: urlImagen.optional(),
})
  .refine(d => !d.telefonoAlternativo || d.telefonoPrincipal !== d.telefonoAlternativo, {
    message: 'El teléfono alternativo no puede ser igual al principal', path: ['telefonoAlternativo']
  })

export const EmpleadoUpdateSchema = z.object({
  nombre: z.string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede superar 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'El nombre solo puede contener letras')
    .refine(n => n.trim().length > 0, 'El nombre no puede ser solo espacios')
    .refine(n => !/\s{2,}/.test(n), 'El nombre no puede tener espacios consecutivos')
    .refine(n => n.trim().split(/\s+/).every(p => p.length >= 2), 'Cada parte del nombre debe tener al menos 2 letras')
    .refine(n => !/\d/.test(n), 'El nombre no puede contener números')
    .refine(n => !esGibberish(n), 'El nombre parece contener texto sin sentido')
    .optional(),
  email: email.optional(),
  // password vacío ('') se trata como "no cambiar"
  password: z.string().trim().transform(v => v === '' ? undefined : v)
    .pipe(password.optional())
    .optional(),
  passwordConfirmation: z.string().trim().optional(),
  estado: z.boolean().optional(),
  tipoDocumento: z.string().trim().refine(
    v => ['CC', 'CE', 'PAS'].includes(v), 'Tipo de documento inválido. Opciones: CC, CE, PAS'
  ).optional(),
  numeroDocumento: z.string()
    .trim()
    .regex(/^\d{6,12}$/, 'El documento debe tener entre 6 y 12 dígitos')
    .refine(n => !/^0+$/.test(n), 'El documento no puede ser solo ceros')
    .refine(n => !/^(\d)\1+$/.test(n), 'El documento no puede ser un dígito repetido')
    .refine(n => n !== '123456789', 'El documento no puede ser una secuencia obvia')
    .optional(),
  fechaNacimiento: z.string()
    .trim()
    .refine(d => !isNaN(Date.parse(d)), 'La fecha de nacimiento no es válida')
    .refine(d => new Date(d).getFullYear() >= 1940, 'El año de nacimiento no puede ser anterior a 1940')
    .refine(d => new Date(d) <= new Date(), 'La fecha de nacimiento no puede ser en el futuro')
    .refine(d => {
      const nac = new Date(d)
      const hoy = new Date()
      const edad = hoy.getFullYear() - nac.getFullYear()
      const cumple = new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate())
      return (hoy >= cumple ? edad : edad - 1) >= 18
    }, 'Debes ser mayor de 18 años para trabajar con nosotros')
    .refine(d => new Date().getFullYear() - new Date(d).getFullYear() <= 100, 'La edad ingresada supera los 100 años')
    .optional(),
  telefonoPrincipal: telefono.optional(),
  telefonoAlternativo: z.union([telefono, z.literal(''), z.undefined()]).optional(),
  ciudad: z.string()
    .trim()
    .min(2, 'La ciudad es requerida')
    .max(60, 'Ciudad demasiado larga')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-\.]+$/, 'La ciudad solo puede contener letras')
    .refine(c => c.trim().length > 0, 'La ciudad no puede ser solo espacios')
    .optional(),
  barrio: z.string()
    .trim()
    .min(2, 'El barrio es requerido')
    .max(80, 'Barrio demasiado largo')
    .refine(b => b.trim().length > 0, 'El barrio no puede ser solo espacios')
    .refine(b => !/^\d+$/.test(b.trim()), 'El barrio no puede ser solo números')
    .refine(b => !esGibberish(b), 'El barrio parece contener texto sin sentido')
    .optional(),
  direccion: z.string()
    .trim()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(150, 'Dirección demasiado larga')
    .refine(d => d.trim().length > 0, 'La dirección no puede ser solo espacios')
    .refine(d => /\d/.test(d), 'La dirección debe incluir al menos un número')
    .refine(d => /[a-zA-Z]/.test(d), 'La dirección debe incluir letras')
    .refine(d => !/^\d+$/.test(d.trim()), 'La dirección no puede ser solo números')
    .refine(d => !/[<>{}[\]\\|^`]/.test(d), 'La dirección contiene caracteres no permitidos')
    .optional(),
  zonaServicio: z.string().trim().refine(
    v => ['URBANA', 'RURAL'].includes(v), 'La zona de servicio debe ser URBANA o RURAL'
  ).optional(),
  instrumentoPrincipal: z.string()
    .trim()
    .min(2, 'El instrumento debe tener al menos 2 caracteres')
    .max(50, 'El instrumento no puede superar 50 caracteres')
    .refine(i => !/^\d+$/.test(i.trim()), 'El instrumento no puede ser solo números')
    .refine(i => !esGibberish(i), 'El instrumento parece contener texto sin sentido')
    .optional(),
  otrosInstrumentos: z.string()
    .trim()
    .max(200, 'Otros instrumentos no pueden superar 200 caracteres')
    .refine(o => !esGibberish(o), 'El campo parece contener texto sin sentido')
    .optional(),
  anosExperiencia: z.number()
    .int('Los años de experiencia deben ser un número entero')
    .min(0, 'Los años de experiencia no pueden ser negativos')
    .max(60, 'Los años de experiencia no pueden superar 60')
    .optional(),
  foto: urlImagen.optional(),
})
  .refine(d => {
    const pwd = d.password
    if (!pwd) return true
    if (!d.passwordConfirmation) return false
    return pwd === d.passwordConfirmation
  }, { message: 'Las contraseñas no coinciden', path: ['passwordConfirmation'] })
  .refine(d => !d.telefonoAlternativo || !d.telefonoPrincipal || d.telefonoPrincipal !== d.telefonoAlternativo, {
    message: 'El teléfono alternativo no puede ser igual al principal', path: ['telefonoAlternativo'],
  })


export const ClienteCreateSchema = z.object({
  nombre: nombreUsuario,
  apellido: z.string()
    .trim()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede superar 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'El apellido solo puede contener letras')
    .refine(a => a.trim().length > 0, 'El apellido no puede ser solo espacios')
    .refine(a => !/\s{2,}/.test(a), 'El apellido no puede tener espacios consecutivos')
    .refine(a => a.trim().split(/\s+/).every(p => p.length >= 2), 'Cada parte del apellido debe tener al menos 2 letras')
    .refine(a => !/\d/.test(a), 'El apellido no puede contener números')
    .refine(a => !esGibberish(a), 'El apellido parece contener texto sin sentido'),
  email: emailAdmin,
  tipoDocumento: z.string().trim().refine(
    v => ['CC', 'CE', 'TI', 'PAS'].includes(v), 'Tipo de documento inválido. Opciones: CC, CE, TI, PAS'
  ),
  numeroDocumento: z.string()
    .trim()
    .regex(/^\d{6,12}$/, 'El documento debe tener entre 6 y 12 dígitos')
    .refine(n => !/^0+$/.test(n), 'El documento no puede ser solo ceros')
    .refine(n => !/^(\d)\1+$/.test(n), 'El documento no puede ser un dígito repetido')
    .refine(n => n !== '123456789', 'El documento no puede ser una secuencia obvia')
    .refine(n => !['000000', '00000000', '000000000', '0000000000'].includes(n), 'Número de documento no válido'),
  fechaNacimiento: z.string()
    .trim()
    .min(1, 'La fecha de nacimiento es requerida')
    .refine(d => !isNaN(Date.parse(d)), 'La fecha de nacimiento no es válida')
    .refine(d => new Date(d).getFullYear() >= 1940, 'El año de nacimiento no puede ser anterior a 1940')
    .refine(d => new Date(d) <= new Date(), 'La fecha de nacimiento no puede ser en el futuro')
    .refine(d => {
      const nac = new Date(d)
      const hoy = new Date()
      const edad = hoy.getFullYear() - nac.getFullYear()
      const cumple = new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate())
      return (hoy >= cumple ? edad : edad - 1) >= 18
    }, 'Debes ser mayor de 18 años para registrarte')
    .refine(d => new Date().getFullYear() - new Date(d).getFullYear() <= 100, 'La edad ingresada supera los 100 años'),
  telefonoPrincipal: telefono,
  telefonoAlternativo: z.union([telefono, z.literal(''), z.undefined()]).optional(),
  ciudad: z.string()
    .trim()
    .min(2, 'La ciudad es requerida')
    .max(60, 'Ciudad demasiado larga')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-\.]+$/, 'La ciudad solo puede contener letras')
    .refine(c => c.trim().length > 0, 'La ciudad no puede ser solo espacios'),
  barrio: z.string()
    .trim()
    .min(2, 'El barrio es requerido')
    .max(80, 'Barrio demasiado largo')
    .refine(b => b.trim().length > 0, 'El barrio no puede ser solo espacios')
    .refine(b => !/^\d+$/.test(b.trim()), 'El barrio no puede ser solo números'),
  direccion: z.string()
    .trim()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(150, 'Dirección demasiado larga')
    .refine(d => d.trim().length > 0, 'La dirección no puede ser solo espacios')
    .refine(d => /\d/.test(d), 'La dirección debe incluir al menos un número')
    .refine(d => /[a-zA-Z]/.test(d), 'La dirección debe incluir letras')
    .refine(d => !/^\d+$/.test(d.trim()), 'La dirección no puede ser solo números')
    .refine(d => !/[<>{}[\]\\|^`]/.test(d), 'La dirección contiene caracteres no permitidos'),
  zonaServicio: z.string().trim().refine(
    v => ['URBANA', 'RURAL'].includes(v), 'La zona de servicio debe ser URBANA o RURAL'
  ),
  foto: z.string().trim().url('URL de foto inválida').optional().or(z.literal('')).transform(val => val || undefined),
})
  .refine(d => d.nombre.trim().toLowerCase() !== d.apellido.trim().toLowerCase(), {
    message: 'El nombre y el apellido no pueden ser iguales', path: ['apellido'],
  })
  .refine(d => !d.telefonoAlternativo || d.telefonoPrincipal !== d.telefonoAlternativo, {
    message: 'El teléfono alternativo no puede ser igual al principal', path: ['telefonoAlternativo'],
  })

export const ClienteUpdateSchema = z.object({
  // nombre NO va aquí — pertenece a usuario, se maneja via nombreUsuario en el servicio
  nombreUsuario: nombreUsuario.optional(),
  apellido: z.string()
    .trim()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede superar 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'El apellido solo puede contener letras')
    .refine(a => a.trim().length > 0, 'El apellido no puede ser solo espacios')
    .refine(a => !/\s{2,}/.test(a), 'El apellido no puede tener espacios consecutivos')
    .refine(a => a.trim().split(/\s+/).every(p => p.length >= 2), 'Cada parte del apellido debe tener al menos 2 letras')
    .refine(a => !/\d/.test(a), 'El apellido no puede contener números')
    .refine(a => !esGibberish(a), 'El apellido parece contener texto sin sentido')
    .optional(),
  email: emailAdmin.optional(),
  tipoDocumento: z.string().trim().refine(
    v => ['CC', 'CE', 'TI', 'PAS'].includes(v), 'Tipo de documento inválido. Opciones: CC, CE, TI, PAS'
  ).optional(),
  numeroDocumento: z.string()
    .trim()
    .regex(/^\d{6,12}$/, 'El documento debe tener entre 6 y 12 dígitos')
    .refine(n => !/^0+$/.test(n), 'El documento no puede ser solo ceros')
    .refine(n => !/^(\d)\1+$/.test(n), 'El documento no puede ser un dígito repetido')
    .refine(n => n !== '123456789', 'El documento no puede ser una secuencia obvia')
    .refine(n => !['000000', '00000000', '000000000', '0000000000'].includes(n), 'Número de documento no válido')
    .optional(),
  fechaNacimiento: z.string()
    .trim()
    .refine(d => !isNaN(Date.parse(d)), 'La fecha de nacimiento no es válida')
    .refine(d => new Date(d).getFullYear() >= 1940, 'El año de nacimiento no puede ser anterior a 1940')
    .refine(d => new Date(d) <= new Date(), 'La fecha de nacimiento no puede ser en el futuro')
    .refine(d => {
      const nac = new Date(d)
      const hoy = new Date()
      const edad = hoy.getFullYear() - nac.getFullYear()
      const cumple = new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate())
      return (hoy >= cumple ? edad : edad - 1) >= 18
    }, 'Debes ser mayor de 18 años')
    .refine(d => new Date().getFullYear() - new Date(d).getFullYear() <= 100, 'La edad ingresada supera los 100 años')
    .optional(),
  telefonoPrincipal: telefono.optional(),
  telefonoAlternativo: z.union([telefono, z.literal(''), z.undefined()]).optional(),
  ciudad: z.string()
    .trim()
    .min(2, 'La ciudad es requerida')
    .max(60, 'Ciudad demasiado larga')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\-\.]+$/, 'La ciudad solo puede contener letras')
    .refine(c => c.trim().length > 0, 'La ciudad no puede ser solo espacios')
    .optional(),
  barrio: z.string()
    .trim()
    .min(2, 'El barrio es requerido')
    .max(80, 'Barrio demasiado largo')
    .refine(b => b.trim().length > 0, 'El barrio no puede ser solo espacios')
    .refine(b => !/^\d+$/.test(b.trim()), 'El barrio no puede ser solo números')
    .refine(b => !esGibberish(b), 'El barrio parece contener texto sin sentido')
    .optional(),
  direccion: z.string()
    .trim()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(150, 'Dirección demasiado larga')
    .refine(d => d.trim().length > 0, 'La dirección no puede ser solo espacios')
    .refine(d => /\d/.test(d), 'La dirección debe incluir al menos un número')
    .refine(d => /[a-zA-Z]/.test(d), 'La dirección debe incluir letras')
    .refine(d => !/^\d+$/.test(d.trim()), 'La dirección no puede ser solo números')
    .refine(d => !/[<>{}[\]\\|^`]/.test(d), 'La dirección contiene caracteres no permitidos')
    .optional(),
  zonaServicio: z.string().trim().refine(
    v => ['URBANA', 'RURAL'].includes(v), 'La zona de servicio debe ser URBANA o RURAL'
  ).optional(),
  foto: urlImagen.optional(),
  activo: z.boolean().optional(),
})
  .refine(d => !d.telefonoAlternativo || !d.telefonoPrincipal || d.telefonoPrincipal !== d.telefonoAlternativo, {
    message: 'El teléfono alternativo no puede ser igual al principal', path: ['telefonoAlternativo'],
  })

// ══════════════════════════════════════════════════════════════════════════════
// ─── HELPER ───────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export const zodError = (e: ZodError): string =>
  e.issues.map(issue => {
    const path = issue.path.length ? `${issue.path.join('.')}: ` : ''
    return `${path}${issue.message}`
  }).join(' | ')

export const AbonoCreateSchema = z.object({

  reservaId: z.union([z.string(), z.number()])
    .transform(v => Number(v))
    .pipe(
      z.number()
        .int('El ID de reserva debe ser un número entero')
        .positive('El ID de reserva debe ser mayor a 0')
    )
  ,

  amount: z.union([z.string(), z.number()])
    .transform(v => Number(v))
    .pipe(
      z.number()

        .positive('El monto debe ser mayor a 0')
        .max(10_000_000, 'El monto parece demasiado alto')
        .refine(v => Number.isFinite(v), 'El monto debe ser un número válido')
        .refine(v => (v * 100) % 1 === 0, 'El monto no puede tener más de 2 decimales')
        .refine(v => v >= 1000, 'El monto mínimo es $1.000 COP')
        .refine(v => v <= 10_000_000, 'El monto máximo es $10.000.000 COP')

        .refine(v => !isNaN(v), 'El monto debe ser un número')
        .refine(v => v % 1 === 0, 'El monto debe ser un número entero')

        .refine(v => v.toString().trim() === v.toString(), 'El monto no puede tener espacios')


    ),

  // Fecha: solo se permite la fecha de HOY (no pasado, no futuro)
  date: z.string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
    .refine(d => !isNaN(Date.parse(d)), 'La fecha no es válida')
    .refine(d => {
      const [y, m, day] = d.split('-').map(Number)
      const date = new Date(y, m - 1, day)
      return (
        date.getFullYear() === y &&
        date.getMonth() === m - 1 &&
        date.getDate() === day
      )
    }, 'La fecha no existe en el calendario')
    .refine(d => {
      const today = new Date().toISOString().split('T')[0]
      return d === today
    }, 'La fecha del abono debe ser la fecha de hoy'),

  method: z.string()
    .trim()
    .toUpperCase()
    .refine(
      m => ['EFECTIVO', 'TRANSFERENCIA', 'NEQUI', 'DAVIPLATA', 'OTRO'].includes(m.toUpperCase()),
      'Método de pago inválido. Opciones: EFECTIVO, TRANSFERENCIA, NEQUI, DAVIPLATA, OTRO'
    ),

  notes: z.string()
    .trim()
    .max(500, 'Las notas no pueden superar 500 caracteres')
    .refine(n => !/[<>{}[\]\\]/.test(n), 'Las notas contienen caracteres no permitidos')
    .optional()
    .nullable(),
})