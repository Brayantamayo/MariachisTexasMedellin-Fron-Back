import puppeteer from 'puppeteer'

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

interface PdfMetaItem {
  label: string
  value: string
}

interface PdfStatItem {
  label: string
  value: string
  helper?: string
  tone?: Tone
}

interface PdfTemplateParams {
  eyebrow: string
  title: string
  documentNumber?: string
  subtitle?: string
  statusLabel?: string
  statusTone?: Tone
  meta?: PdfMetaItem[]
  stats?: PdfStatItem[]
  sectionsHtml: string
  footerNote?: string
}

const formatDateSource = (value: Date | string) => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00`)
  }
  return new Date(value)
}

export const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export const formatCurrency = (amount: number): string =>
  `$${Number(amount || 0).toLocaleString('es-CO')} COP`

export const formatShortDate = (value?: Date | string | null): string => {
  if (!value) return 'Sin fecha'
  const date = formatDateSource(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  return date.toLocaleDateString('es-CO')
}

export const formatLongDate = (value?: Date | string | null): string => {
  if (!value) return 'Sin fecha'
  const date = formatDateSource(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  return date.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const formatMethod = (method?: string | null): string => {
  const normalized = String(method ?? '').trim().toUpperCase()
  const labels: Record<string, string> = {
    TRANSFERENCIA: 'Transferencia',
    EFECTIVO: 'Efectivo',
    NEQUI: 'Nequi',
    DAVIPLATA: 'Daviplata',
    OTRO: 'Otro',
  }
  return labels[normalized] ?? (normalized || 'Sin definir')
}

const toneClass = (tone?: Tone) => {
  switch (tone) {
    case 'info':
      return 'tone-info'
    case 'success':
      return 'tone-success'
    case 'warning':
      return 'tone-warning'
    case 'danger':
      return 'tone-danger'
    default:
      return 'tone-neutral'
  }
}

export const buildMetaGrid = (items: PdfMetaItem[] = []): string => {
  if (!items.length) return ''
  return `
    <section class="section">
      <div class="section-title">Informacion General</div>
      <div class="meta-grid">
        ${items.map(item => `
          <div class="meta-card">
            <div class="meta-label">${escapeHtml(item.label)}</div>
            <div class="meta-value">${escapeHtml(item.value)}</div>
          </div>
        `).join('')}
      </div>
    </section>
  `
}

export const buildSummaryCards = (items: PdfStatItem[] = []): string => {
  if (!items.length) return ''
  return `
    <section class="section">
      <div class="stats-grid">
        ${items.map(item => `
          <div class="stat-card ${toneClass(item.tone)}">
            <div class="stat-label">${escapeHtml(item.label)}</div>
            <div class="stat-value">${escapeHtml(item.value)}</div>
            ${item.helper ? `<div class="stat-helper">${escapeHtml(item.helper)}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </section>
  `
}

export const buildInfoTable = (headers: string[], rows: string[][]): string => `
  <table class="data-table">
    <thead>
      <tr>${headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${rows.map((row, index) => `
        <tr class="${index % 2 === 0 ? 'row-even' : 'row-odd'}">
          ${row.map(col => `<td>${col}</td>`).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
`

export const buildTag = (label: string, tone: Tone = 'neutral') =>
  `<span class="inline-tag ${toneClass(tone)}">${escapeHtml(label)}</span>`

export const buildSection = (title: string, bodyHtml: string) => `
  <section class="section">
    <div class="section-title">${escapeHtml(title)}</div>
    <div class="section-panel">
      ${bodyHtml}
    </div>
  </section>
`

export const createPdfHtml = (params: PdfTemplateParams): string => {
  const metaHtml = buildMetaGrid(params.meta)
  const statsHtml = buildSummaryCards(params.stats)

  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <style>
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; }
          body {
            font-family: "Segoe UI", Arial, sans-serif;
            background: #f5f0ea;
            color: #1f2937;
          }
          .page {
            min-height: 100vh;
            background: #f5f0ea;
          }
          .header {
            padding: 44px 52px 34px;
            color: #f8fafc;
            background: #0f172a;
            background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
          }
          .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 24px;
          }
          .brand-badge {
            display: inline-block;
            padding: 7px 14px;
            border-radius: 999px;
            border: 1px solid rgba(248, 250, 252, 0.18);
            background: rgba(255, 255, 255, 0.06);
            font-size: 10px;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #fca5a5;
            font-weight: 700;
          }
          .brand-name {
            margin-top: 18px;
            font-size: 30px;
            letter-spacing: 0.5px;
            font-weight: 800;
          }
          .brand-subtitle {
            margin-top: 10px;
            max-width: 520px;
            color: #cbd5e1;
            font-size: 12px;
            line-height: 1.7;
          }
          .doc-box {
            min-width: 210px;
            padding: 18px 20px;
            border-radius: 22px;
            background: rgba(15, 23, 42, 0.42);
            border: 1px solid rgba(248, 250, 252, 0.08);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
          }
          .doc-label {
            color: #94a3b8;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 8px;
          }
          .doc-number {
            font-size: 16px;
            font-weight: 800;
            color: #fff;
            margin-bottom: 12px;
          }
          .status-chip,
          .inline-tag {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            padding: 6px 12px;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 1px;
            text-transform: uppercase;
            border: 1px solid transparent;
          }
          .content {
            padding: 0 52px 44px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 11px;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 800;
            margin-bottom: 10px;
          }
          .section-panel,
          .meta-card,
          .stat-card,
          .footer {
            background: #ffffff;
            border: 1px solid rgba(148, 163, 184, 0.2);
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
          }
          .section-panel {
            border-radius: 24px;
            padding: 18px 20px;
          }
          .meta-grid,
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
          .stats-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
          .meta-card,
          .stat-card {
            border-radius: 22px;
            padding: 18px;
          }
          .meta-label,
          .stat-label {
            font-size: 10px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 1.4px;
            font-weight: 700;
            margin-bottom: 8px;
          }
          .meta-value {
            font-size: 14px;
            color: #0f172a;
            font-weight: 700;
            line-height: 1.5;
          }
          .stat-value {
            font-size: 24px;
            color: #0f172a;
            font-weight: 800;
            line-height: 1.1;
          }
          .stat-helper {
            margin-top: 10px;
            font-size: 11px;
            color: #64748b;
            line-height: 1.6;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            overflow: hidden;
            border-radius: 18px;
            border: 1px solid rgba(148, 163, 184, 0.18);
          }
          .data-table th {
            background: #0f172a;
            color: #e2e8f0;
            font-size: 10px;
            letter-spacing: 1.2px;
            text-transform: uppercase;
            text-align: left;
            padding: 12px 14px;
          }
          .data-table td {
            padding: 12px 14px;
            font-size: 12px;
            color: #334155;
            border-top: 1px solid rgba(148, 163, 184, 0.14);
            vertical-align: top;
          }
          .row-even td { background: rgba(255, 255, 255, 0.96); }
          .row-odd td { background: rgba(248, 250, 252, 0.9); }
          .muted {
            color: #64748b;
            font-size: 11px;
            line-height: 1.6;
          }
          .strong {
            color: #0f172a;
            font-weight: 800;
          }
          .timeline {
            display: grid;
            gap: 10px;
          }
          .timeline-item {
            border: 1px solid rgba(148, 163, 184, 0.16);
            background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.9));
            border-radius: 18px;
            padding: 14px 16px;
          }
          .timeline-title {
            font-size: 13px;
            color: #0f172a;
            font-weight: 800;
          }
          .timeline-sub {
            margin-top: 6px;
            color: #64748b;
            font-size: 11px;
            line-height: 1.6;
          }
          .two-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }
          .footer {
            margin-top: 24px;
            border-radius: 24px;
            padding: 18px 20px;
            display: flex;
            justify-content: space-between;
            gap: 20px;
          }
          .footer-brand {
            font-size: 13px;
            color: #0f172a;
            font-weight: 800;
            margin-bottom: 4px;
          }
          .footer-copy {
            color: #64748b;
            font-size: 10px;
            line-height: 1.7;
          }
          .tone-neutral {
            background: rgba(148, 163, 184, 0.12);
            color: #475569;
            border-color: rgba(148, 163, 184, 0.18);
          }
          .tone-info {
            background: rgba(59, 130, 246, 0.12);
            color: #1d4ed8;
            border-color: rgba(59, 130, 246, 0.18);
          }
          .tone-success {
            background: rgba(16, 185, 129, 0.12);
            color: #047857;
            border-color: rgba(16, 185, 129, 0.18);
          }
          .tone-warning {
            background: rgba(245, 158, 11, 0.14);
            color: #b45309;
            border-color: rgba(245, 158, 11, 0.22);
          }
          .tone-danger {
            background: rgba(220, 38, 38, 0.12);
            color: #b91c1c;
            border-color: rgba(220, 38, 38, 0.2);
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <div class="header-top">
              <div>
                <div class="brand-badge">${escapeHtml(params.eyebrow)}</div>
                <div class="brand-name">${escapeHtml(params.title)}</div>
                ${params.subtitle ? `<div class="brand-subtitle">${escapeHtml(params.subtitle)}</div>` : ''}
              </div>
              <div class="doc-box">
                <div class="doc-label">Documento</div>
                <div class="doc-number">${escapeHtml(params.documentNumber ?? 'Mariachis Texas')}</div>
                ${params.statusLabel ? `<div class="status-chip ${toneClass(params.statusTone)}">${escapeHtml(params.statusLabel)}</div>` : ''}
              </div>
            </div>
          </div>
          <div class="content">
            ${metaHtml}
            ${statsHtml}
            ${params.sectionsHtml}
            <div class="footer">
              <div>
                <div class="footer-brand">Mariachis Texas</div>
                <div class="footer-copy">Medellin, Colombia<br/>312 237 3486 | 314 757 4707<br/>texasmariachi@gmail.com</div>
              </div>
              <div class="footer-copy" style="text-align:right;">
                Documento generado el ${escapeHtml(formatShortDate(new Date()))}<br/>
                ${escapeHtml(params.footerNote ?? 'Comprobante generado automaticamente desde el sistema.')}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

export const renderPdfFromHtml = async (html: string): Promise<Buffer> => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    await page.emulateMediaType('screen')
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}
