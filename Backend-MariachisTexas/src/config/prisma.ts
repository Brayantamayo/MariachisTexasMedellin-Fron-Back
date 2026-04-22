import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })

const prisma = new PrismaClient({ adapter })

export default prisma

/////no tocar esto, es para que la base de datos se inicie al iniciar el servidor dejarlo como esta 