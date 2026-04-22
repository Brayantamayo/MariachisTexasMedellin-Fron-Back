import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

import authRoutes       from './modules/auth/auth.routes'
import perfilRoutes     from './modules/auth/perfil.routes'
import serviciosRoutes  from './modules/Servicios/servicios.routes'
import repertoireRoutes from './modules/Repertorio/Repertoire.routes'
import spotifyRoutes from './modules/Repertorio/spotify.routes'
import clienteRoutes    from './modules/Cliente/cliente.routes'

import cotizacionRoutes from './modules/Cotizacion/cotizacion.routes'
import reservaRoutes    from './modules/reservas/reservas.routes'
import abonoRoutes      from './modules/abonos/abono.routes'
import bloqueoRoutes    from './modules/Bloqueos/bloqueos.routes'
import ensayoRoutes     from './modules/Ensayo/ensayo.routes'
import ventasRoutes     from './modules/ventas/ventas.routes'
import rolesRoutes      from './modules/roles/roles.routes'
import usuarioRoutes    from './modules/usuarios/usuario.routes'
import empleadoRoutes   from './modules/empleados/empleado.routes'
import { notFoundHandler, errorHandler } from './middlewares/errorHandler'

const app = express()

// ─── SEGURIDAD ────────────────────────────────────────────────────────────────
// Helmet agrega headers HTTP de seguridad automáticamente

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'upgrade-insecure-requests': null,
    }
  }
}))

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:3001',
      'http://localhost:3002',
    ]

    // Sin origin = app móvil nativa o Postman ✅
    if (!origin) return callback(null, true)

    // Cualquier puerto de localhost = Flutter web ✅
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true)
    }

    if (allowed.includes(origin)) {
      return callback(null, true)
    }

    callback(new Error('No permitido por CORS'))
  },
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ ok: true }))

// ─── RATE LIMITING ────────────────────────────────────────────────────────────
// Límite estricto para endpoints sensibles — auth y formulario público
const authLimiter = rateLimit({
  windowMs:    15 * 60 * 1000, // ventana de 15 minutos
  max:         10,             // máximo 10 intentos por IP en esa ventana
  message:     { message: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,       // devuelve headers RateLimit-* estándar
  legacyHeaders:   false,
})

const publicLimiter = rateLimit({
  windowMs:    60 * 60 * 1000, // ventana de 1 hora
  max:         30,             // máximo 30 solicitudes por IP por hora
  message:     { message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
  standardHeaders: true,
  legacyHeaders:   false,
})



app.use('/api/auth/login',     authLimiter)
app.use('/api/auth/registro',  authLimiter)
app.use('/api/auth/recuperar', authLimiter)
app.use('/api/auth/reset-password',  authLimiter)
app.use('/api/auth/verify-otp',  authLimiter)
app.use('/api/auth/resetear',  authLimiter)
app.use('/api/perfil', perfilRoutes)

app.use('/api/cotizaciones/public', publicLimiter)

app.use('/api/auth',         authRoutes)
app.use('/api/servicios',    serviciosRoutes)
app.use('/api/repertorio',   repertoireRoutes)
app.use('/api/spotify', spotifyRoutes)
app.use('/api/clientes',     clienteRoutes)
app.use('/api/cotizaciones', cotizacionRoutes)
app.use('/api/reservas',     reservaRoutes)
app.use('/api/abonos',       abonoRoutes)
app.use('/api/ensayos',      ensayoRoutes)
app.use('/api/bloqueos',     bloqueoRoutes)
app.use('/api/ventas',       ventasRoutes)
app.use('/api/roles',        rolesRoutes)
app.use('/api/usuarios',     usuarioRoutes)
app.use('/api/empleados',    empleadoRoutes)

// ⚠️ Estos van AL FINAL, después de todas las rutas
app.use(notFoundHandler)   // atrapa rutas inexistentes
app.use(errorHandler)      // atrapa errores lanzados con next(err)

export default app