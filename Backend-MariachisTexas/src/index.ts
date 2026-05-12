import app from './App'
import prisma from './config/prisma'
import 'dotenv/config'
import { startScheduler } from './modules/reservas/reserva.services'

const PORT = process.env.PORT || 3000

async function main() {
  await prisma.$connect()
  console.log(' Base de datos conectada')

  // Iniciar tareas automáticas (anulación 24h, finalización por hora)
  startScheduler()

  app.listen(PORT, () => {
    console.log(` Servidor corriendo en http://localhost:${PORT}`)
  })
}

main()