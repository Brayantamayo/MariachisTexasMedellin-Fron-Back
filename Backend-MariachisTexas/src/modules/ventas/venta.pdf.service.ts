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

const saleTone = (status?: string) => {
  const normalized = String(status ?? '').toUpperCase()
  if (normalized.includes('FINAL')) return 'success' as const
  if (normalized.includes('CANCEL')) return 'danger' as const
  if (normalized.includes('CONFIRM')) return 'info' as const
  return 'neutral' as const
}

export const generateVentasReportPdf = async (ventas: any[]): Promise<Buffer> => {
  const totalAmount = ventas.reduce((sum, venta) => sum + Number(venta.amount || 0), 0)
  const totalPaid = ventas.reduce((sum, venta) => sum + Number(venta.paidAmount ?? venta.amount ?? 0), 0)
  const finalizedCount = ventas.filter((venta: any) =>
    String(venta.status ?? venta.reservationStatus ?? '').toUpperCase().includes('FINAL')
  ).length

  const rows = ventas.length
    ? ventas.map((venta: any) => [
        `<span class="strong">#${escapeHtml(venta.id)}</span><br/><span class="muted">${escapeHtml(venta.type ?? 'Venta')}</span>`,
        `<span class="strong">${escapeHtml(venta.clientName || 'Sin cliente')}</span><br/><span class="muted">${escapeHtml(venta.concept || 'Sin concepto')}</span>`,
        escapeHtml(formatShortDate(venta.date)),
        `<span class="strong">${escapeHtml(formatCurrency(Number(venta.amount || 0)))}</span>`,
        buildTag(venta.status ?? venta.reservationStatus ?? 'Sin estado', saleTone(venta.status ?? venta.reservationStatus)),
      ])
    : [[
        '<span class="muted">Sin ventas</span>',
        '<span class="muted">No hay registros para exportar</span>',
        '<span class="muted">-</span>',
        '<span class="muted">-</span>',
        '<span class="muted">-</span>',
      ]]

  const sectionsHtml = buildSection(
    'Listado de Ventas',
    buildInfoTable(['Venta', 'Cliente y concepto', 'Fecha', 'Valor', 'Estado'], rows)
  )

  const html = createPdfHtml({
    eyebrow: 'Reporte Financiero',
    title: 'Comprobante de Venta',
    documentNumber: `${ventas.length} movimientos`,
    subtitle: 'Consolidado de ventas finalizadas y reservas comercializadas desde el sistema.',
    statusLabel: finalizedCount > 0 ? `${finalizedCount} finalizadas` : 'Sin cierres',
    statusTone: finalizedCount > 0 ? 'success' : 'neutral',
    stats: [
      { label: 'Ventas exportadas', value: String(ventas.length), helper: 'Registros incluidos en el documento.', tone: 'info' },
      { label: 'Total comercial', value: formatCurrency(totalAmount), helper: 'Valor total facturado.', tone: 'success' },
      { label: 'Total pagado', value: formatCurrency(totalPaid), helper: 'Caja reconocida por ventas.', tone: 'neutral' },
      { label: 'Finalizadas', value: String(finalizedCount), helper: 'Ventas cerradas sin saldo pendiente.', tone: 'success' },
    ],
    sectionsHtml,
    footerNote: 'Reporte consolidado de ventas y reservas procesadas dentro del modulo comercial.',
  })

  return renderPdfFromHtml(html)
}

export const generateVentaDetailPdf = async (venta: any): Promise<Buffer> => {
  const paymentRows = (venta.abonos ?? []).map((abono: any, index: number) => `
    <div class="timeline-item">
      <div class="timeline-title">
        ${escapeHtml(index === 0 ? 'Anticipo registrado' : `Pago ${index + 1}`)}
      </div>
      <div class="timeline-sub">
        Fecha: <span class="strong">${escapeHtml(formatShortDate(abono.date))}</span><br/>
        Metodo: <span class="strong">${escapeHtml(formatMethod(abono.method))}</span><br/>
        Monto: <span class="strong">${escapeHtml(formatCurrency(Number(abono.amount || 0)))}</span>
      </div>
    </div>
  `).join('')

  const servicesTable = venta.services?.length
    ? buildInfoTable(
        ['Servicio', 'Cantidad', 'Precio', 'Subtotal'],
        venta.services.map((service: any) => [
          `<span class="strong">${escapeHtml(service.nombre)}</span>`,
          escapeHtml(String(service.cantidad)),
          escapeHtml(formatCurrency(Number(service.precio || 0))),
          `<span class="strong">${escapeHtml(formatCurrency(Number(service.precio || 0) * Number(service.cantidad || 0)))}</span>`,
        ])
      )
    : '<div class="muted">No hay servicios detallados para esta venta.</div>'

  const repertoireList = venta.repertoire?.length
    ? `<div class="timeline">${venta.repertoire.map((item: any, index: number) => {
  const song = item.repertorio ?? item  // compatibilidad con ambas estructuras
  return `
    <div class="timeline-title">${escapeHtml(`${index + 1}. ${song.titulo ?? 'Sin título'}`)}</div>
    <div class="timeline-sub">Artista: ${escapeHtml(song.artista || 'Sin artista')}</div>
  `}).join('')}</div>`
    : '<div class="muted">No hay repertorio asociado a esta venta.</div>'

  const sectionsHtml = [
    buildSection(
      'Cliente y Evento',
      `
        <div class="two-col">
          <div>
            <div class="muted">Cliente</div>
            <div class="strong" style="font-size:16px;">${escapeHtml(venta.clientName || 'Sin cliente')}</div>
          </div>
          <div>
            <div class="muted">Concepto</div>
            <div class="strong" style="font-size:16px;">${escapeHtml(venta.concept || 'Venta')}</div>
          </div>
          <div>
            <div class="muted">Fecha del evento</div>
            <div class="strong">${escapeHtml(formatLongDate(venta.eventDate))}</div>
          </div>
          <div>
            <div class="muted">Horario</div>
            <div class="strong">${escapeHtml(venta.eventTime && venta.eventEndTime ? `${venta.eventTime} - ${venta.eventEndTime}` : 'Por confirmar')}</div>
          </div>
        </div>
        <div style="margin-top:14px;" class="muted">
          Lugar: <span class="strong">${escapeHtml(venta.eventLocation || 'Sin ubicacion registrada')}</span>
        </div>
        ${venta.homenajeado ? `<div style="margin-top:8px;" class="muted">Homenajeado: <span class="strong">${escapeHtml(venta.homenajeado)}</span></div>` : ''}
      `
    ),
    buildSection('Detalle Comercial', servicesTable),
    buildSection('Repertorio', repertoireList),
    (venta.abonos ?? []).length ? buildSection('Historial de Pagos', `<div class="timeline">${paymentRows}</div>`) : '',
    venta.notes ? buildSection('Observaciones', `<div class="muted">"${escapeHtml(venta.notes)}"</div>`) : '',
  ].join('')

  const pendingAmount = Number(venta.pendingAmount || 0)
  const html = createPdfHtml({
    eyebrow: 'Documento Comercial',
    title: 'Comprobante de Venta',
    documentNumber: `VENTA #${escapeHtml(venta.id)}`,
    subtitle: 'Soporte comercial del cierre de la venta con detalle de cliente, servicios y estado de pago.',
    statusLabel: venta.status ?? venta.reservationStatus ?? 'Sin estado',
    statusTone: saleTone(venta.status ?? venta.reservationStatus),
    meta: [
      { label: 'Cliente', value: venta.clientName || 'Sin cliente' },
      { label: 'Fecha de venta', value: formatLongDate(venta.date) },
      { label: 'Metodo', value: formatMethod(venta.method) },
      { label: 'Reserva asociada', value: venta.reservationId ? `#${venta.reservationId}` : 'Venta directa' },
    ],
    stats: [
      { label: 'Valor total', value: formatCurrency(Number(venta.amount || 0)), helper: 'Monto total facturado.', tone: 'success' },
      { label: 'Pagado', value: formatCurrency(Number(venta.paidAmount ?? venta.amount ?? 0)), helper: 'Valor reconocido como pago.', tone: 'info' },
      { label: 'Saldo', value: formatCurrency(pendingAmount), helper: pendingAmount <= 0.01 ? 'Operacion cerrada.' : 'Valor pendiente por cobrar.', tone: pendingAmount <= 0.01 ? 'success' : 'warning' },
      { label: 'Tipo', value: escapeHtml(venta.type ?? 'Venta'), helper: 'Canal de origen del movimiento.', tone: 'neutral' },
    ],
    sectionsHtml,
    footerNote: 'Este comprobante resume la informacion principal de la venta y su soporte operativo.',
  })

  return renderPdfFromHtml(html)
}

export const generateReservaReceiptPdf = async (reserva: any, nombreCliente: string): Promise<Buffer> => {
  const quotation = reserva.cotizacion
  const payments = [...(reserva.abonos ?? [])].sort(
    (a: any, b: any) => new Date(a.fechaPago).getTime() - new Date(b.fechaPago).getTime()
  )
  const totalAmount = Number(reserva.totalValor || 0)
  const pendingAmount = Number(reserva.saldoPendiente || 0)
  const paidAmount = totalAmount - pendingAmount

  const paymentHistory = payments.length
    ? payments.map((abono: any, index: number) => `
        <div class="timeline-item">
          <div class="timeline-title">${escapeHtml(index === 0 ? '1er Abono' : 'Pago complementario')}</div>
          <div class="timeline-sub">
            Fecha: <span class="strong">${escapeHtml(formatShortDate(abono.fechaPago))}</span><br/>
            Metodo: <span class="strong">${escapeHtml(formatMethod(abono.metodoPago))}</span><br/>
            Monto: <span class="strong">${escapeHtml(formatCurrency(Number(abono.monto || 0)))}</span><br/>
            Saldo resultante: <span class="strong">${escapeHtml(formatCurrency(Number(abono.nuevoSaldo || 0)))}</span>
          </div>
        </div>
      `).join('')
    : '<div class="muted">No se encontraron pagos asociados a esta reserva.</div>'

  const servicesHtml = quotation?.servicios?.length
    ? buildInfoTable(
        ['Servicio', 'Cantidad', 'Precio', 'Subtotal'],
        quotation.servicios.map((service: any) => [
          `<span class="strong">${escapeHtml(service.servicio?.nombre ?? 'Servicio')}</span>`,
          escapeHtml(String(service.cantidad ?? 0)),
          escapeHtml(formatCurrency(Number(service.servicio?.precio ?? 0))),
          `<span class="strong">${escapeHtml(formatCurrency(Number(service.servicio?.precio ?? 0) * Number(service.cantidad ?? 0)))}</span>`,
        ])
      )
    : '<div class="muted">No hay servicios vinculados a esta reserva.</div>'

  const sectionsHtml = [
    buildSection(
      'Cliente y Evento',
      `
        <div class="two-col">
          <div>
            <div class="muted">Cliente</div>
            <div class="strong" style="font-size:16px;">${escapeHtml(nombreCliente)}</div>
          </div>
          <div>
            <div class="muted">Tipo de evento</div>
            <div class="strong" style="font-size:16px;">${escapeHtml(quotation?.tipoEvento ?? 'Evento')}</div>
          </div>
          <div>
            <div class="muted">Fecha del evento</div>
            <div class="strong">${escapeHtml(formatLongDate(quotation?.fechaEvento))}</div>
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
          Lugar: <span class="strong">${escapeHtml(quotation?.direccionEvento ?? 'Sin direccion registrada')}</span>
        </div>
      `
    ),
    buildSection('Servicios Contratados', servicesHtml),
    buildSection('Pagos de la Reserva', `<div class="timeline">${paymentHistory}</div>`),
    quotation?.notasAdicionales
      ? buildSection('Observaciones', `<div class="muted">"${escapeHtml(quotation.notasAdicionales)}"</div>`)
      : '',
  ].join('')

  const html = createPdfHtml({
    eyebrow: 'Reserva Comercial',
    title: 'Comprobante de Reserva',
    documentNumber: `RESERVA #${escapeHtml(reserva.id)}`,
    subtitle: 'Resumen comercial de la reserva con su estado de pago, informacion del evento y detalle de servicios.',
    statusLabel: pendingAmount <= 0.01 ? 'Pagada completamente' : 'Reserva confirmada',
    statusTone: pendingAmount <= 0.01 ? 'success' : 'info',
    meta: [
      { label: 'Cliente', value: nombreCliente },
      { label: 'Fecha de emision', value: formatLongDate(new Date()) },
      { label: 'Estado interno', value: reserva.estado ?? 'Sin estado' },
      { label: 'Reserva', value: `#${reserva.id}` },
    ],
    stats: [
      { label: 'Total reserva', value: formatCurrency(totalAmount), helper: 'Valor total del servicio.', tone: 'success' },
      { label: 'Pagado', value: formatCurrency(paidAmount), helper: 'Valor recibido hasta la fecha.', tone: 'info' },
      { label: 'Pendiente', value: formatCurrency(pendingAmount), helper: pendingAmount <= 0.01 ? 'La reserva se encuentra saldada.' : 'Saldo pendiente por recaudar.', tone: pendingAmount <= 0.01 ? 'success' : 'warning' },
      { label: 'Abonos', value: String(payments.length), helper: 'Movimientos registrados sobre la reserva.', tone: 'neutral' },
    ],
    sectionsHtml,
    footerNote: 'Comprobante emitido para respaldar el estado comercial y operativo de la reserva.',
  })

  return renderPdfFromHtml(html)
}
