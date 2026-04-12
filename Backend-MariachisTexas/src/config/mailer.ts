import nodemailer from 'nodemailer'
import 'dotenv/config'

const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST,
  port:   Number(process.env.MAIL_PORT),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
})

// Verificar conexión al arrancar
transporter.verify((error) => {
  if (error) {
    console.error('❌ Error conexión SMTP:', error.message)
  } else {
    console.log('✅ SMTP listo — correos habilitados con:', process.env.MAIL_USER)
  }
})

export default transporter