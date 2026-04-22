import app from './App'
import prisma from './config/prisma'
import 'dotenv/config'

const PORT = process.env.PORT || 3000

async function main() {
  await prisma.$connect()
  console.log(' Base de datos conectada')

  app.listen(PORT, () => {
    console.log(` Servidor corriendo en http://localhost:${PORT}`)
  })
}

main()