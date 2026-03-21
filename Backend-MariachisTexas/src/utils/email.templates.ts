// ─── TIPOS ────────────────────────────────────────────────────────────────────
interface EmailBienvenidaParams {
  nombre:                 string
  loginUrl:               string
  reservasUrl:            string
  cotizacionesVinculadas: number
}

interface EmailOtpParams {
  nombre: string
  otp:    string
}

interface EmailCotizacionAprobadaParams {
  nombreCliente: string
  fechaStr:      string
  horaInicio:    string
  horaFin:       string
  totalEstimado: number
  registerUrl:   string
  loginUrl:      string
}

interface EmailReservaCreadaParams {
  nombreCliente:    string
  fechaFormateada:  string
  startTime:        string
  endTime:          string
  location:         string
  eventType:        string
  totalAmount:      number
  anticipo:         number
  loginUrl:         string
}

// ─── HEADER Y FOOTER COMPARTIDOS ──────────────────────────────────────────────
const header = `
  <div style="text-align:center;margin-bottom:20px;">
    <h1 style="color:#c0392b;margin:0;">🎺 Mariachis Texas</h1>
  </div>
`

const footer = `
  <hr style="border:none;border-top:1px solid #222;margin:20px 0;" />
  <p style="color:#555;font-size:11px;text-align:center;">Mariachis Texas • Medellín, Colombia</p>
`

const wrapper = (content: string) => `
  <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:28px;background:#0a0a0a;color:#fff;border-radius:12px;">
    ${header}
    ${content}
    ${footer}
  </div>
`

// ─── 1. BIENVENIDA ────────────────────────────────────────────────────────────
export const emailBienvenida = (p: EmailBienvenidaParams) => ({
  subject: '¡Bienvenido a Mariachis Texas! 🎺',
  html: wrapper(`
    <h2 style="color:#fff;margin-bottom:8px;">¡Hola ${p.nombre}! 👋</h2>
    <p style="color:#aaa;line-height:1.6;">Tu registro fue exitoso. Ya puedes iniciar sesión y disfrutar de todos los beneficios de tener una cuenta.</p>
    ${p.cotizacionesVinculadas > 0 ? `
      <div style="background:#1a1a1a;border:1px solid #c0392b;border-radius:10px;padding:16px;margin:20px 0;">
        <p style="color:#fff;font-weight:bold;margin:0 0 8px;">🎉 ¡Buenas noticias!</p>
        <p style="color:#aaa;margin:0;font-size:14px;">Encontramos <strong style="color:#fff">${p.cotizacionesVinculadas} reserva(s)</strong> asociadas a tu correo. Ya están disponibles en tu cuenta.</p>
      </div>
      <div style="text-align:center;margin:20px 0;">
        <a href="${p.reservasUrl}" style="background:#c0392b;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">Ver mis Reservas</a>
      </div>
    ` : `
      <div style="text-align:center;margin:24px 0;">
        <a href="${p.loginUrl}" style="background:#c0392b;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">Iniciar Sesión</a>
      </div>
    `}
  `)
})

// ─── 2. OTP RECUPERACIÓN ──────────────────────────────────────────────────────
export const emailOtp = (p: EmailOtpParams) => ({
  subject: 'Código de recuperación - Mariachis Texas 🎺',
  html: `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0a0a0a;color:#fff;border-radius:12px;">
      <h2 style="color:#c0392b;">Recuperar contraseña</h2>
      <p style="color:#aaa;">Hola <strong style="color:#fff">${p.nombre}</strong>, recibimos una solicitud para restablecer tu contraseña.</p>
      <div style="background:#1a1a1a;border:2px solid #c0392b;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
        <span style="font-size:42px;font-weight:900;letter-spacing:12px;color:#fff;">${p.otp}</span>
      </div>
      <p style="color:#aaa;font-size:13px;">Este código expira en <strong style="color:#fff">15 minutos</strong>.</p>
      <p style="color:#aaa;font-size:13px;">Si no solicitaste esto, ignora este correo.</p>
    </div>
  `
})

// ─── 3. COTIZACIÓN APROBADA ───────────────────────────────────────────────────
export const emailCotizacionAprobada = (p: EmailCotizacionAprobadaParams) => ({
  subject: '¡Tu cotización fue aprobada! — Mariachis Texas 🎺',
  html: wrapper(`
    <h2 style="color:#fff;">¡Buenas noticias, ${p.nombreCliente}! 🎉</h2>
    <p style="color:#aaa;line-height:1.6;">Tu cotización ha sido <strong style="color:#fff">aprobada</strong> y convertida en una reserva oficial.</p>
    <div style="background:#1a1a1a;border:1px solid #c0392b;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="color:#aaa;margin:0 0 6px;font-size:13px;">📅 Fecha: <strong style="color:#fff">${p.fechaStr}</strong></p>
      <p style="color:#aaa;margin:0 0 6px;font-size:13px;">⏰ Horario: <strong style="color:#fff">${p.horaInicio} - ${p.horaFin}</strong></p>
      <p style="color:#aaa;margin:0;font-size:13px;">💰 Valor: <strong style="color:#fff">$${p.totalEstimado.toLocaleString('es-CO')} COP</strong></p>
    </div>
    <p style="color:#aaa;line-height:1.6;">Para ver tu reserva y hacer seguimiento, crea tu cuenta con este mismo correo:</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${p.registerUrl}" style="background:#c0392b;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">Crear mi cuenta →</a>
    </div>
    <p style="color:#555;font-size:12px;text-align:center;">¿Ya tienes cuenta? <a href="${p.loginUrl}" style="color:#c0392b;">Inicia sesión aquí</a></p>
  `)
})

// ─── 4. RESERVA CREADA ────────────────────────────────────────────────────────
export const emailReservaCreada = (p: EmailReservaCreadaParams) => ({
  subject: '¡Reserva creada exitosamente! — Mariachis Texas 🎺',
  html: wrapper(`
    <h2 style="color:#fff;">¡Hola ${p.nombreCliente}! 🎉</h2>
    <p style="color:#aaa;line-height:1.6;">Tu reserva ha sido creada exitosamente. A continuación los detalles:</p>
    <div style="background:#1a1a1a;border:1px solid #c0392b;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="color:#aaa;margin:0 0 8px;font-size:13px;">📅 Fecha: <strong style="color:#fff">${p.fechaFormateada}</strong></p>
      <p style="color:#aaa;margin:0 0 8px;font-size:13px;">⏰ Horario: <strong style="color:#fff">${p.startTime} - ${p.endTime}</strong></p>
      <p style="color:#aaa;margin:0 0 8px;font-size:13px;">📍 Lugar: <strong style="color:#fff">${p.location}</strong></p>
      <p style="color:#aaa;margin:0 0 8px;font-size:13px;">🎭 Evento: <strong style="color:#fff">${p.eventType}</strong></p>
      <p style="color:#aaa;margin:0;font-size:13px;">💰 Valor Total: <strong style="color:#fff">$${p.totalAmount.toLocaleString('es-CO')} COP</strong></p>
    </div>
    <div style="background:#1a1a1a;border:1px solid #27ae60;border-radius:10px;padding:20px;margin:20px 0;text-align:center;">
      <p style="color:#aaa;margin:0 0 8px;font-size:13px;">💳 Para confirmar tu reserva debes pagar el <strong style="color:#fff">50% de anticipo:</strong></p>
      <p style="font-size:32px;font-weight:900;color:#27ae60;margin:12px 0;letter-spacing:2px;">$${p.anticipo.toLocaleString('es-CO')} COP</p>
      <p style="color:#aaa;margin:0;font-size:12px;">Saldo restante al finalizar el evento: $${(p.totalAmount - p.anticipo).toLocaleString('es-CO')} COP</p>
    </div>
    <div style="background:#1a1a1a;border:1px solid #333;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="color:#fff;font-weight:bold;margin:0 0 8px;font-size:14px;">📞 Comunícate con nosotros para realizar el pago:</p>
      <p style="color:#c0392b;font-size:24px;font-weight:900;margin:8px 0;text-align:center;letter-spacing:2px;">312 237 3486</p>
      <p style="color:#aaa;font-size:12px;margin:0;text-align:center;">Aceptamos: Transferencia bancaria, Nequi, Daviplata o Efectivo</p>
    </div>
    <p style="color:#aaa;line-height:1.6;font-size:13px;">
      ⚠️ <strong style="color:#fff">Importante:</strong> Tu reserva quedará en estado
      <strong style="color:#f39c12">Pendiente</strong> hasta que registremos tu pago del anticipo.
      Una vez confirmado el pago pasará a estado <strong style="color:#27ae60">Confirmada</strong>.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${p.loginUrl}" style="background:#c0392b;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">Ver mi Reserva →</a>
    </div>
  `)
})