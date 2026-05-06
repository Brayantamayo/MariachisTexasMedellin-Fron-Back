import {
  buildInfoTable,
  buildSection,
  buildTag,
  createPdfHtml,
  escapeHtml,
  formatCurrency,
  formatLongDate,
  formatMethod,
  formatShortDate,
  renderPdfFromHtml,
} from '../../utils/pdfTemplate'

const formatTime = (value?: Date | string | null) => {
  if (!value) return 'Por confirmar'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Por confirmar'
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const paymentTypeLabel = (index: number, count: number) => {
  if (count === 1) return 'Pago registrado'
  if (index === 0) return 'Primer abono'
  if (index === count - 1) return 'Pago final'
  return `Abono ${index + 1}`
}

export const generateAbonosReportPdf = async (abonos: any[]): Promise<Buffer> => {
  const totalAmount = abonos.reduce((sum, abono) => sum + Number(abono.amount || 0), 0)
  const uniqueReservations = new Set(abonos.map(abono => abono.reservationId)).size
  const pendingCount = abonos.filter(abono => Number(abono.newBalance || 0) > 0.01).length

  const rows = abonos.length
    ? abonos.map((abono: any) => [
        `<span class="strong">#${escapeHtml(abono.id)}</span><br/><span class="muted">Reserva #${escapeHtml(abono.reservationId)}</span>`,
        `<span class="strong">${escapeHtml(abono.clientName || 'Sin cliente')}</span><br/><span class="muted">${escapeHtml(formatMethod(abono.method))}</span>`,
        escapeHtml(formatShortDate(abono.date)),
        `<span class="strong">${escapeHtml(formatCurrency(Number(abono.amount || 0)))}</span>`,
        Number(abono.newBalance || 0) <= 0.01
          ? buildTag('Pagado', 'success')
          : `<span class="strong">${escapeHtml(formatCurrency(Number(abono.newBalance || 0)))}</span>`,
      ])
    : [[
        '<span class="muted">Sin registros</span>',
        '<span class="muted">No hay abonos para exportar</span>',
        '<span class="muted">-</span>',
        '<span class="muted">-</span>',
        '<span class="muted">-</span>',
      ]]

  const sectionsHtml = buildSection(
    'Listado de Abonos',
    buildInfoTable(
      ['Abono', 'Cliente y metodo', 'Fecha', 'Monto', 'Saldo'],
      rows
    )
  )

  const html = createPdfHtml({
    eyebrow: 'Reporte Comercial',
    title: 'Resumen de Abonos',
    documentNumber: `${abonos.length} registros`,
    subtitle: 'Consolidado de pagos registrados en el sistema con el estado del saldo asociado a cada reserva.',
    statusLabel: pendingCount > 0 ? `${pendingCount} con saldo` : 'Todo conciliado',
    statusTone: pendingCount > 0 ? 'warning' : 'success',
    stats: [
      { label: 'Abonos exportados', value: String(abonos.length), helper: 'Pagos incluidos en este reporte.', tone: 'info' },
      { label: 'Total recaudado', value: formatCurrency(totalAmount), helper: 'Suma de los montos registrados.', tone: 'success' },
      { label: 'Reservas impactadas', value: String(uniqueReservations), helper: 'Reservas con movimiento de caja.', tone: 'neutral' },
      { label: 'Con saldo', value: String(pendingCount), helper: 'Pagos que aun dejan pendiente.', tone: pendingCount > 0 ? 'warning' : 'success' },
    ],
    sectionsHtml,
    footerNote: 'Este reporte resume los abonos emitidos y su efecto en el saldo de cada reserva.',
  })

  return renderPdfFromHtml(html)
}

export const generateAbonoDetailPdf = async (abono: any): Promise<Buffer> => {
  const reservation = abono.reserva
  const quotation = reservation?.cotizacion
  const paymentHistory = [...(reservation?.abonos ?? [])].sort(
    (a: any, b: any) => new Date(a.fechaPago).getTime() - new Date(b.fechaPago).getTime()
  )
  const currentIndex = paymentHistory.findIndex((item: any) => Number(item.id) === Number(abono.id))
  const currentBalance = Number(abono.nuevoSaldo || 0)
  const totalAmount = Number(reservation?.totalValor || 0)
  const paidAmount = totalAmount - currentBalance

  const historyRows = paymentHistory.length
    ? paymentHistory.map((item: any, index: number) => {
        const isCurrent = Number(item.id) === Number(abono.id)
        const label = paymentTypeLabel(index, paymentHistory.length)
        return `
          <div class="timeline-item">
            <div class="timeline-title">
              ${escapeHtml(label)} ${isCurrent ? buildTag('Este comprobante', 'info') : ''}
            </div>
            <div class="timeline-sub">
              Fecha: <span class="strong">${escapeHtml(formatShortDate(item.fechaPago))}</span><br/>
              Metodo: <span class="strong">${escapeHtml(formatMethod(item.metodoPago))}</span><br/>
              Monto: <span class="strong">${escapeHtml(formatCurrency(Number(item.monto || 0)))}</span><br/>
              Saldo luego del pago: <span class="strong">${escapeHtml(formatCurrency(Number(item.nuevoSaldo || 0)))}</span>
            </div>
          </div>
        `
      }).join('')
    : '<div class="muted">No hay historial disponible.</div>'

  const sectionsHtml = [
    buildSection(
      'Evento y Reserva',
      `
        <div class="two-col">
          <div>
            <div class="muted">Reserva</div>
            <div class="strong" style="font-size:16px;">#${escapeHtml(reservation?.id ?? abono.reservaId)}</div>
          </div>
          <div>
            <div class="muted">Tipo de evento</div>
            <div class="strong" style="font-size:16px;">${escapeHtml(quotation?.tipoEvento ?? 'Evento')}</div>
          </div>
          <div>
            <div class="muted">Fecha del evento</div>
            <div class="strong">${escapeHtml(formatLongDate(quotation?.fechaEvento ?? null))}</div>
          </div>
          <div>
            <div class="muted">Horario</div>
            <div class="strong">${escapeHtml(
              quotation?.horaInicio && quotation?.horaFin
                ? `${formatTime(quotation.horaInicio)} - ${formatTime(quotation.horaFin)}`
                : 'Por confirmar'
            )}</div>
          </div>
        </div>
        <div style="margin-top:14px;" class="muted">
          Lugar del evento: <span class="strong">${escapeHtml(quotation?.direccionEvento ?? 'Sin direccion registrada')}</span>
        </div>
      `
    ),
    buildSection('Historial del Pago', `<div class="timeline">${historyRows}</div>`),
    abono.notas
      ? buildSection(
          'Observaciones',
          `<div class="muted">"${escapeHtml(abono.notas)}"</div>`
        )
      : '',
  ].join('')

  const html = createPdfHtml({
    eyebrow: 'Comprobante de Caja',
    title: 'Recibo de Abono',
    documentNumber: `ABONO #${escapeHtml(abono.id)}`,
    subtitle: 'Documento generado para dejar constancia del pago recibido y del saldo resultante de la reserva.',
    statusLabel: currentBalance <= 0.01 ? 'Pago completado' : 'Saldo pendiente',
    statusTone: currentBalance <= 0.01 ? 'success' : 'warning',
    meta: [
      { label: 'Cliente', value: abono.clienteNombre },
      { label: 'Fecha de pago', value: formatLongDate(abono.fechaPago) },
      { label: 'Metodo', value: formatMethod(abono.metodoPago) },
      { label: 'Comprobante', value: `#${abono.id}` },
    ],
    stats: [
      { label: 'Monto recibido', value: formatCurrency(Number(abono.monto || 0)), helper: 'Valor registrado en este abono.', tone: 'success' },
      { label: 'Total pagado', value: formatCurrency(paidAmount), helper: 'Acumulado de la reserva luego del pago.', tone: 'info' },
      { label: 'Saldo actual', value: formatCurrency(currentBalance), helper: currentBalance <= 0.01 ? 'La reserva quedo pagada.' : 'Pendiente por recaudar.', tone: currentBalance <= 0.01 ? 'success' : 'warning' },
      { label: 'Total reserva', value: formatCurrency(totalAmount), helper: 'Valor comercial pactado para el evento.', tone: 'neutral' },
    ],
    sectionsHtml,
    footerNote: 'Este comprobante certifica el registro interno del pago asociado a la reserva.',
  })

  return renderPdfFromHtml(html)
}
