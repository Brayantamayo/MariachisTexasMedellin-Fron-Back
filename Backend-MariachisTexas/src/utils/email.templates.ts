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

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const colors = {
  bg:           '#0c0c0c',
  cardBg:       '#141414',
  cardBorder:   '#1e1e1e',
  accent:       '#e74c3c',
  accentDark:   '#c0392b',
  accentGlow:   '#ff6b6b',
  gold:         '#f1c40f',
  green:        '#2ecc71',
  greenDark:    '#27ae60',
  orange:       '#f39c12',
  text:         '#ffffff',
  textMuted:    '#9ca3af',
  textDim:      '#6b7280',
  divider:      '#1f1f1f',
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
const header = `
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="padding:0;">
        <!-- Top accent bar -->
        <div style="height:4px;background:linear-gradient(90deg,${colors.accentDark},${colors.accent},${colors.accentDark});border-radius:12px 12px 0 0;"></div>
        <!-- Logo area -->
        <div style="text-align:center;padding:32px 0 24px;">
          <div style="display:inline-block;background:${colors.cardBg};border:1px solid ${colors.cardBorder};border-radius:16px;padding:16px 32px;">
            <span style="font-size:28px;line-height:1;">🎺</span>
            <span style="font-size:22px;font-weight:800;color:${colors.accent};letter-spacing:1px;vertical-align:middle;margin-left:8px;">MARIACHIS TEXAS</span>
          </div>
        </div>
      </td>
    </tr>
  </table>
`

// ─── FOOTER ───────────────────────────────────────────────────────────────────
const footer = `
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="padding:32px 0 8px;">
        <div style="height:1px;background:linear-gradient(90deg,transparent,${colors.divider},transparent);"></div>
        <div style="text-align:center;padding-top:20px;">
          <p style="color:${colors.textDim};font-size:11px;margin:0 0 4px;letter-spacing:0.5px;">
            🎶 Mariachis Texas — Medellín, Colombia
          </p>
          <p style="color:${colors.textDim};font-size:10px;margin:0;">
            La mejor música en vivo para tus eventos
          </p>
        </div>
      </td>
    </tr>
  </table>
`

// ─── WRAPPER ──────────────────────────────────────────────────────────────────
const wrapper = (content: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#000000;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000000;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:${colors.bg};border:1px solid ${colors.cardBorder};border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:0 32px 32px;">
              ${header}
              ${content}
              ${footer}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
const button = (text: string, url: string, bg = colors.accent) => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:24px 0;">
        <a href="${url}"
           style="display:inline-block;background:${bg};color:#ffffff;padding:16px 40px;
                  border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;
                  letter-spacing:0.3px;mso-padding-alt:0;text-align:center;
                  box-shadow:0 4px 14px rgba(231,76,60,0.3);">
          <!--[if mso]><i style="mso-font-width:150%;mso-text-raise:30px;" hidden>&nbsp;</i><![endif]-->
          ${text}
          <!--[if mso]><i style="mso-font-width:150%;" hidden>&nbsp;</i><![endif]-->
        </a>
      </td>
    </tr>
  </table>
`

const card = (content: string, borderColor = colors.accent) => `
  <div style="background:${colors.cardBg};border:1px solid ${borderColor};border-radius:12px;padding:20px 24px;margin:20px 0;">
    ${content}
  </div>
`

const detailRow = (icon: string, label: string, value: string) => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
    <tr>
      <td width="28" style="vertical-align:top;padding-top:2px;">
        <span style="font-size:14px;">${icon}</span>
      </td>
      <td style="color:${colors.textMuted};font-size:13px;line-height:1.4;">
        ${label}: <strong style="color:${colors.text};">${value}</strong>
      </td>
    </tr>
  </table>
`

const divider = `<div style="height:1px;background:${colors.divider};margin:20px 0;"></div>`

// ─── 1. BIENVENIDA ────────────────────────────────────────────────────────────
export const emailBienvenida = (p: EmailBienvenidaParams) => ({
  subject: '¡Bienvenido a Mariachis Texas! 🎺',
  html: wrapper(`
    <h2 style="color:${colors.text};font-size:22px;font-weight:700;margin:0 0 6px;text-align:center;">
      ¡Hola ${p.nombre}! 👋
    </h2>
    <p style="color:${colors.textMuted};font-size:14px;line-height:1.7;text-align:center;margin:8px 0 0;">
      Tu registro fue exitoso. Ya puedes iniciar sesión y disfrutar de todos los beneficios.
    </p>

    ${p.cotizacionesVinculadas > 0 ? `
      ${card(`
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="text-align:center;">
              <span style="font-size:32px;display:block;margin-bottom:12px;">🎉</span>
              <p style="color:${colors.text};font-weight:700;font-size:16px;margin:0 0 8px;">¡Buenas noticias!</p>
              <p style="color:${colors.textMuted};font-size:14px;margin:0;line-height:1.6;">
                Encontramos <strong style="color:${colors.accentGlow};">${p.cotizacionesVinculadas} reserva(s)</strong>
                asociadas a tu correo.<br/>Ya están disponibles en tu cuenta.
              </p>
            </td>
          </tr>
        </table>
      `)}
      ${button('Ver mis Reservas →', p.reservasUrl)}
    ` : `
      ${card(`
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="text-align:center;">
              <span style="font-size:32px;display:block;margin-bottom:12px;">🎶</span>
              <p style="color:${colors.textMuted};font-size:14px;margin:0;line-height:1.6;">
                Tu cuenta está lista. Inicia sesión para explorar nuestros servicios y crear reservas.
              </p>
            </td>
          </tr>
        </table>
      `, colors.cardBorder)}
      ${button('Iniciar Sesión →', p.loginUrl)}
    `}
  `)
})

// ─── 2. OTP RECUPERACIÓN ──────────────────────────────────────────────────────
export const emailOtp = (p: EmailOtpParams) => ({
  subject: 'Código de recuperación — Mariachis Texas 🔐',
  html: wrapper(`
    <div style="text-align:center;">
      <span style="font-size:40px;display:block;margin-bottom:8px;">🔐</span>
      <h2 style="color:${colors.text};font-size:20px;font-weight:700;margin:0 0 8px;">
        Recuperar Contraseña
      </h2>
      <p style="color:${colors.textMuted};font-size:14px;line-height:1.6;margin:0 0 24px;">
        Hola <strong style="color:${colors.text};">${p.nombre}</strong>, usa el siguiente código para restablecer tu contraseña.
      </p>
    </div>

    <!-- OTP Code Box -->
    <div style="background:${colors.cardBg};border:2px solid ${colors.accent};border-radius:16px;padding:28px;text-align:center;margin:0 auto 24px;">
      <p style="color:${colors.textDim};font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Tu código</p>
      <div style="font-size:48px;font-weight:900;letter-spacing:16px;color:${colors.text};font-family:'Courier New',monospace;line-height:1;">
        ${p.otp}
      </div>
    </div>

    ${card(`
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="24" style="vertical-align:top;padding-top:2px;">
            <span style="font-size:13px;">⏱️</span>
          </td>
          <td style="color:${colors.textMuted};font-size:13px;line-height:1.6;">
            Este código expira en <strong style="color:${colors.orange};">15 minutos</strong>.
          </td>
        </tr>
        <tr><td colspan="2" style="height:8px;"></td></tr>
        <tr>
          <td width="24" style="vertical-align:top;padding-top:2px;">
            <span style="font-size:13px;">🛡️</span>
          </td>
          <td style="color:${colors.textMuted};font-size:13px;line-height:1.6;">
            Si no solicitaste esto, puedes ignorar este correo con seguridad.
          </td>
        </tr>
      </table>
    `, colors.cardBorder)}
  `)
})

// ─── 3. COTIZACIÓN APROBADA ───────────────────────────────────────────────────
export const emailCotizacionAprobada = (p: EmailCotizacionAprobadaParams) => ({
  subject: '¡Tu cotización fue aprobada! — Mariachis Texas 🎺',
  html: wrapper(`
    <div style="text-align:center;margin-bottom:4px;">
      <span style="font-size:40px;display:block;margin-bottom:8px;">✅</span>
      <h2 style="color:${colors.text};font-size:22px;font-weight:700;margin:0 0 8px;">
        ¡Cotización Aprobada!
      </h2>
      <p style="color:${colors.textMuted};font-size:14px;line-height:1.6;margin:0;">
        ${p.nombreCliente}, tu cotización ha sido convertida en una <strong style="color:${colors.green};">reserva oficial</strong>.
      </p>
    </div>

    <!-- Event Details Card -->
    ${card(`
      <p style="color:${colors.textDim};font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 14px;font-weight:600;">
        Detalles de tu reserva
      </p>
      ${detailRow('📅', 'Fecha', p.fechaStr)}
      ${detailRow('⏰', 'Horario', `${p.horaInicio} — ${p.horaFin}`)}
      <div style="height:1px;background:${colors.divider};margin:14px 0;"></div>
      ${detailRow('💰', 'Valor estimado', `$${p.totalEstimado.toLocaleString('es-CO')} COP`)}
    `)}

    <p style="color:${colors.textMuted};font-size:14px;line-height:1.7;text-align:center;margin:20px 0 4px;">
      Para ver tu reserva y hacer seguimiento,<br/>crea tu cuenta con este mismo correo:
    </p>

    ${button('Crear mi Cuenta →', p.registerUrl)}

    <p style="color:${colors.textDim};font-size:12px;text-align:center;margin:0;">
      ¿Ya tienes cuenta?
      <a href="${p.loginUrl}" style="color:${colors.accent};text-decoration:underline;">Inicia sesión aquí</a>
    </p>
  `)
})

// ─── 4. RESERVA CREADA ────────────────────────────────────────────────────────
export const emailReservaCreada = (p: EmailReservaCreadaParams) => ({
  subject: '¡Reserva creada exitosamente! — Mariachis Texas 🎺',
  html: wrapper(`
    <div style="text-align:center;margin-bottom:4px;">
      <span style="font-size:40px;display:block;margin-bottom:8px;">🎉</span>
      <h2 style="color:${colors.text};font-size:22px;font-weight:700;margin:0 0 8px;">
        ¡Reserva Confirmada!
      </h2>
      <p style="color:${colors.textMuted};font-size:14px;line-height:1.6;margin:0;">
        ${p.nombreCliente}, tu reserva ha sido creada exitosamente.
      </p>
    </div>

    <!-- Event Details Card -->
    ${card(`
      <p style="color:${colors.textDim};font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 14px;font-weight:600;">
        Detalles del evento
      </p>
      ${detailRow('📅', 'Fecha', p.fechaFormateada)}
      ${detailRow('⏰', 'Horario', `${p.startTime} — ${p.endTime}`)}
      ${detailRow('📍', 'Lugar', p.location)}
      ${detailRow('🎭', 'Evento', p.eventType)}
      <div style="height:1px;background:${colors.divider};margin:14px 0;"></div>
      ${detailRow('💰', 'Valor Total', `$${p.totalAmount.toLocaleString('es-CO')} COP`)}
    `)}

    <!-- Payment Highlight -->
    <div style="background:${colors.cardBg};border:2px solid ${colors.green};border-radius:14px;padding:24px;margin:20px 0;text-align:center;">
      <p style="color:${colors.textDim};font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 4px;font-weight:600;">
        Anticipo requerido (50%)
      </p>
      <p style="font-size:36px;font-weight:900;color:${colors.green};margin:10px 0;letter-spacing:1px;line-height:1;">
        $${p.anticipo.toLocaleString('es-CO')} COP
      </p>
      <div style="height:1px;background:${colors.divider};margin:14px auto;max-width:200px;"></div>
      <p style="color:${colors.textMuted};margin:0;font-size:12px;line-height:1.5;">
        Saldo restante al finalizar: <strong style="color:${colors.text};">$${(p.totalAmount - p.anticipo).toLocaleString('es-CO')} COP</strong>
      </p>
    </div>

    <!-- Contact Card -->
    ${card(`
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="text-align:center;">
            <p style="color:${colors.textMuted};font-size:13px;margin:0 0 12px;line-height:1.5;">
              📞 Comunícate con nosotros para realizar el pago:
            </p>
            <p style="color:${colors.accent};font-size:28px;font-weight:900;margin:0 0 12px;letter-spacing:3px;font-family:'Courier New',monospace;">
              312 237 3486
            </p>
            <div style="display:inline-block;background:#1a1a1a;border:1px solid ${colors.divider};border-radius:8px;padding:8px 16px;">
              <p style="color:${colors.textDim};font-size:11px;margin:0;">
                💳 Transferencia · Nequi · Daviplata · Efectivo
              </p>
            </div>
          </td>
        </tr>
      </table>
    `, colors.cardBorder)}

    <!-- Important Notice -->
    <div style="background:rgba(243,156,18,0.08);border:1px solid rgba(243,156,18,0.25);border-radius:10px;padding:16px 20px;margin:20px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="24" style="vertical-align:top;padding-top:1px;">
            <span style="font-size:14px;">⚠️</span>
          </td>
          <td style="color:${colors.textMuted};font-size:13px;line-height:1.6;">
            <strong style="color:${colors.text};">Importante:</strong> Tu reserva estará en estado
            <strong style="color:${colors.orange};">Pendiente</strong> hasta registrar el anticipo.
            Una vez confirmado pasará a <strong style="color:${colors.green};">Confirmada</strong>.
          </td>
        </tr>
      </table>
    </div>

    ${button('Ver mi Reserva →', p.loginUrl)}
  `)
})
