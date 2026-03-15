import express from 'express'
import cors from 'cors'
import authRoutes from './modules/auth/auth.routes'
import serviciosRoutes from './modules/Servicios/servicios.routes'
import repertoireRoutes from './modules/Repertorio/Repertoire.routes'
import cotizacionRoutes from './modules/Cotizacion/cotizacion.routes'
import reservaRoutes from './modules/reservas/reservas.routes'
import bloqueoRoutes from './modules/Bloqueos/bloqueos.routes'
import ensayoRoutes  from './modules/Ensayo/ensayo.routes'


const app = express()

app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())
app.use('/api/auth',      authRoutes)
app.use('/api/servicios', serviciosRoutes)
app.use('/api/repertorio', repertoireRoutes)
app.use('/api/cotizaciones', cotizacionRoutes)
app.use('/api/reservas',  reservaRoutes)
app.use('/api/ensayos',   ensayoRoutes)
app.use('/api/bloqueos',  bloqueoRoutes)

export default app