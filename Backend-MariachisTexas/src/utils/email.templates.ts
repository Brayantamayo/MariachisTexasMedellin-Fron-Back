interface EmailBienvenidaParams {
  nombre: string
  loginUrl: string
  reservasUrl: string
  cotizacionesVinculadas: number
}

interface EmailOtpParams {
  nombre: string
  otp: string
}

interface EmailCotizacionAprobadaParams {
  nombreCliente: string
  fechaStr: string
  horaInicio: string
  horaFin: string
  totalEstimado: number
  registerUrl: string
  loginUrl: string
}

interface EmailReservaCreadaParams {
  nombreCliente: string
  fechaFormateada: string
  startTime: string
  endTime: string
  location: string
  eventType: string
  totalAmount: number
  anticipo: number
  loginUrl: string
}

const colors = {
  pageBg: '#f5f5f5',
  cardBg: '#ffffff',
  panelBg: '#f8fafc',
  border: '#e5e7eb',
  heading: '#0f172a',
  text: '#334155',
  muted: '#64748b',
  accent: '#b91c1c',
  accentDark: '#991b1b',
  success: '#166534',
  warning: '#92400e',
}

const wrapper = (content: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:${colors.pageBg};font-family:Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${colors.pageBg};">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;width:100%;background:${colors.cardBg};border:1px solid ${colors.border};border-radius:18px;overflow:hidden;">
          <tr>
            <td style="padding:0;">
              ${header}
              <div style="padding:32px 32px 12px;">
                ${content}
              </div>
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

const header = `
  <div style="background:linear-gradient(135deg, ${colors.accentDark}, ${colors.accent});padding:28px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="left">
          <div style="display:inline-block;border:1px solid rgba(255,255,255,0.18);border-radius:14px;padding:12px 16px;background:rgba(255,255,255,0.08);">
            <div style="font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(255,255,255,0.8);font-weight:700;margin-bottom:4px;">
              Mariachis Texas
            </div>
            <div style="font-size:24px;line-height:1.1;font-weight:800;color:#ffffff;">
              Comunicacion oficial
            </div>
          </div>
        </td>
      </tr>
    </table>
  </div>
`

const footer = `
  <div style="padding:24px 32px 32px;">
    <div style="height:1px;background:${colors.border};margin-bottom:18px;"></div>
    <p style="margin:0;color:${colors.muted};font-size:12px;line-height:1.7;text-align:center;">
      Mariachis Texas<br/>
      Medellin, Colombia<br/>
      Este mensaje fue generado por el sistema de gestion.
    </p>
  </div>
`

const intro = (title: string, body: string) => `
  <h2 style="margin:0 0 10px;color:${colors.heading};font-size:28px;line-height:1.2;font-weight:800;">
    ${title}
  </h2>
  <p style="margin:0;color:${colors.text};font-size:15px;line-height:1.75;">
    ${body}
  </p>
`

const panel = (content: string, tone: 'default' | 'accent' | 'success' | 'warning' = 'default') => {
  const borderColor =
    tone === 'accent' ? '#fecaca' : tone === 'success' ? '#bbf7d0' : tone === 'warning' ? '#fde68a' : colors.border
  const background =
    tone === 'accent' ? '#fef2f2' : tone === 'success' ? '#f0fdf4' : tone === 'warning' ? '#fffbeb' : colors.panelBg

  return `
    <div style="margin:22px 0;border:1px solid ${borderColor};border-radius:16px;background:${background};padding:20px 22px;">
      ${content}
    </div>
  `
}

const detailRow = (label: string, value: string) => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">
    <tr>
      <td style="width:160px;vertical-align:top;color:${colors.muted};font-size:13px;line-height:1.6;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">
        ${label}
      </td>
      <td style="color:${colors.heading};font-size:14px;line-height:1.6;font-weight:600;">
        ${value}
      </td>
    </tr>
  </table>
`

const bulletList = (items: string[]) => `
  <ul style="margin:0;padding-left:18px;color:${colors.text};font-size:14px;line-height:1.8;">
    ${items.map(item => `<li style="margin-bottom:8px;">${item}</li>`).join('')}
  </ul>
`

const button = (text: string, url: string) => `
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:24px 0 8px;">
        <a href="${url}" style="display:inline-block;background:${colors.accent};color:#ffffff;text-decoration:none;padding:15px 28px;border-radius:12px;font-size:14px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">
          ${text}
        </a>
      </td>
    </tr>
  </table>
`

export const emailBienvenida = (p: EmailBienvenidaParams) => ({
  subject: 'Bienvenido a Mariachis Texas',
  html: wrapper(`
    ${intro(
      `Bienvenido, ${p.nombre}`,
      'Tu cuenta fue registrada correctamente. Desde este momento puedes ingresar al sistema para consultar tus reservas, revisar tu informacion y dar seguimiento a los servicios gestionados con nosotros.'
    )}

    ${
      p.cotizacionesVinculadas > 0
        ? panel(
            `
              <p style="margin:0 0 10px;color:${colors.heading};font-size:17px;font-weight:800;">
                Reservas asociadas encontradas
              </p>
              <p style="margin:0;color:${colors.text};font-size:14px;line-height:1.75;">
                Identificamos ${p.cotizacionesVinculadas} reserva(s) vinculadas a este correo electronico. Ya puedes revisarlas dentro de tu cuenta.
              </p>
            `,
            'accent'
          ) + button('Ver mis reservas', p.reservasUrl)
        : panel(
            `
              <p style="margin:0;color:${colors.text};font-size:14px;line-height:1.75;">
                Tu cuenta ya esta activa. Ingresa para consultar servicios, reservas y futuras cotizaciones.
              </p>
            `
          ) + button('Iniciar sesion', p.loginUrl)
    }

    ${panel(
      `
        <p style="margin:0 0 12px;color:${colors.heading};font-size:17px;font-weight:800;">
          Condiciones generales del servicio
        </p>
        ${bulletList([
          'No manejamos devoluciones una vez que el servicio ha sido confirmado y los pagos correspondientes han sido procesados.',
          'La duracion del evento depende del tiempo que tome interpretar las canciones acordadas. Una vez finalizado ese repertorio, el servicio se da por terminado.',
        ])}
      `,
      'warning'
    )}

    <p style="margin:18px 0 0;color:${colors.muted};font-size:13px;line-height:1.8;">
      Si necesitas soporte adicional, puedes responder este correo o comunicarte por nuestros canales de atencion.
    </p>
  `),
})

export const emailOtp = (p: EmailOtpParams) => ({
  subject: 'Codigo de recuperacion - Mariachis Texas',
  html: wrapper(`
    ${intro(
      'Recuperacion de acceso',
      `Hola ${p.nombre}. Recibimos una solicitud para restablecer la contrasena de tu cuenta. Utiliza el siguiente codigo de verificacion para continuar con el proceso.`
    )}

    ${panel(
      `
        <p style="margin:0 0 8px;color:${colors.muted};font-size:11px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;text-align:center;">
          Codigo de verificacion
        </p>
        <p style="margin:0;text-align:center;color:${colors.heading};font-size:42px;font-weight:900;letter-spacing:14px;font-family:Courier New, monospace;">
          ${p.otp}
        </p>
      `,
      'accent'
    )}

    ${panel(
      bulletList([
        'Este codigo expira en 15 minutos.',
        'Si no solicitaste este proceso, puedes ignorar este mensaje.',
      ])
    )}
  `),
})

export const emailCotizacionAprobada = (p: EmailCotizacionAprobadaParams) => ({
  subject: 'Cotizacion aprobada - Mariachis Texas',
  html: wrapper(`
    ${intro(
      'Tu cotizacion fue aprobada',
      `${p.nombreCliente}, la cotizacion ya fue aprobada y convertida en una reserva oficial dentro del sistema.`
    )}

    ${panel(
      `
        <p style="margin:0 0 14px;color:${colors.heading};font-size:17px;font-weight:800;">
          Resumen de la reserva
        </p>
        ${detailRow('Fecha', p.fechaStr)}
        ${detailRow('Horario', `${p.horaInicio} - ${p.horaFin}`)}
        ${detailRow('Valor estimado', `$${p.totalEstimado.toLocaleString('es-CO')} COP`)}
      `
    )}

    <p style="margin:0;color:${colors.text};font-size:14px;line-height:1.75;">
      Si aun no tienes cuenta, puedes registrarte con este mismo correo para consultar el estado de tu reserva y acceder a la informacion relacionada.
    </p>

    ${button('Crear cuenta', p.registerUrl)}

    <p style="margin:8px 0 0;color:${colors.muted};font-size:13px;line-height:1.8;text-align:center;">
      Si ya tienes una cuenta registrada, puedes ingresar directamente desde el siguiente enlace:
      <a href="${p.loginUrl}" style="color:${colors.accent};font-weight:700;text-decoration:none;"> iniciar sesion</a>.
    </p>
  `),
})

export const emailReservaCreada = (p: EmailReservaCreadaParams) => ({
  subject: 'Reserva creada exitosamente - Mariachis Texas',
  html: wrapper(`
    ${intro(
      'Reserva registrada correctamente',
      `${p.nombreCliente}, tu reserva fue creada exitosamente. A continuacion puedes revisar la informacion principal del servicio.`
    )}

    ${panel(
      `
        <p style="margin:0 0 14px;color:${colors.heading};font-size:17px;font-weight:800;">
          Detalles del evento
        </p>
        ${detailRow('Fecha', p.fechaFormateada)}
        ${detailRow('Horario', `${p.startTime} - ${p.endTime}`)}
        ${detailRow('Ubicacion', p.location)}
        ${detailRow('Tipo de evento', p.eventType)}
        ${detailRow('Valor total', `$${p.totalAmount.toLocaleString('es-CO')} COP`)}
      `
    )}

    ${panel(
      `
        <p style="margin:0 0 10px;color:${colors.heading};font-size:17px;font-weight:800;">
          Condicion de pago inicial
        </p>
        <p style="margin:0 0 12px;color:${colors.text};font-size:14px;line-height:1.75;">
          Para formalizar la reserva se requiere un anticipo correspondiente al 50% del valor total.
        </p>
        ${detailRow('Anticipo requerido', `$${p.anticipo.toLocaleString('es-CO')} COP`)}
        ${detailRow('Saldo restante', `$${(p.totalAmount - p.anticipo).toLocaleString('es-CO')} COP`)}
      `,
      'success'
    )}

    ${panel(
      `
        <p style="margin:0 0 10px;color:${colors.heading};font-size:17px;font-weight:800;">
          Informacion importante
        </p>
        ${bulletList([
          'La reserva permanecera en estado pendiente hasta que el anticipo sea registrado.',
          'Una vez confirmado el pago inicial, el estado de la reserva pasara a confirmada.',
          'Para soporte sobre el pago puedes comunicarte al numero 312 237 3486.',
        ])}
      `,
      'warning'
    )}

    ${button('Consultar mi reserva', p.loginUrl)}
  `),
})
