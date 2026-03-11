import express from 'express'
import cors from 'cors'
import authRoutes from './modules/auth/auth.routes'
import serviciosRoutes from './modules/Servicios/servicios.routes'

const app = express()

app.use(cors({
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())
app.use('/api/auth',      authRoutes)
app.use('/api/servicios', serviciosRoutes)

export default app