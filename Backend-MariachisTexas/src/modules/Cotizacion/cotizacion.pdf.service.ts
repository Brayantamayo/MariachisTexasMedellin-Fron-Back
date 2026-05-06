import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs'
import prisma from '../../config/prisma'

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const toLocalDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

const toLocalTime = (d: Date) =>
  `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

const formatCurrency = (amount: number) =>
  '$' + Number(amount).toLocaleString('es-CO') + ' COP'

// ─── GENERAR HTML ─────────────────────────────────────────────────────────────
const buildHtml = (cot: any): string => {
  const templatePath = path.join(__dirname, 'cotizacion_template.html')
  let html = fs.readFileSync(templatePath, 'utf-8')

  const eventDate  = cot.fechaEvento  ? toLocalDate(cot.fechaEvento)  : ''
  const startTime  = cot.horaInicio   ? toLocalTime(cot.horaInicio)   : ''
  const endTime    = cot.horaFin      ? toLocalTime(cot.horaFin)      : ''
  const total      = Number(cot.totalEstimado ?? 0)
  const anticipo   = Math.ceil(total / 2)
  const saldo      = total - anticipo
  const estado     = cot.estado === 'EN_ESPERA' ? 'En Espera' : cot.estado

  // ─── Fila homenajeado ──────────────────────────────────────────────────────
  const homenajeadoRow = cot.nombreHomenajeado
    ? `<div class="full-col"><div class="field-label">Homenajeado/a</div><div class="field-value">${cot.nombreHomenajeado}</div></div>`
    : ''

  // ─── Fila notas ───────────────────────────────────────────────────────────
  const notasRow = cot.notasAdicionales
    ? `<div class="full-col"><div class="field-label">Notas</div><div class="field-value" style="font-style:italic;color:#aaa">"${cot.notasAdicionales}"</div></div>`
    : ''

  // ─── Sección servicios ────────────────────────────────────────────────────
  const serviciosSection = cot.servicios?.length
    ? `<div class="section">
        <div class="section-title">🎵 Servicios Seleccionados</div>
        <table>
          <thead><tr>
            <th>Servicio</th>
            <th class="right">Cantidad</th>
            <th class="right">Precio Unit.</th>
            <th class="right">Subtotal</th>
          </tr></thead>
          <tbody>
            ${cot.servicios.map((s: any, i: number) => `
              <tr style="background:${i % 2 === 0 ? '#0f0f0f' : '#111'}">
                <td>${s.servicio?.nombre ?? ''}</td>
                <td class="right">${s.cantidad}</td>
                <td class="right">${formatCurrency(Number(s.servicio?.precio ?? 0))}</td>
                <td class="right td-gold">${formatCurrency(Number(s.servicio?.precio ?? 0) * s.cantidad)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`
    : ''

  // ─── Sección repertorio ───────────────────────────────────────────────────
const repertorioSection = cot.repertorios?.length
  ? `<div class="section">
      <div class="section-title">🎶 Repertorio (${cot.repertorios.length} canciones)</div>
      <div class="songs-grid">
        ${cot.repertorios
          .sort((a: any, b: any) => a.orden - b.orden)
          .map((r: any, i: number) => `
            <div class="song-item">
              <span class="song-num">${String(i + 1).padStart(2, '0')}</span>
              <div class="song-info">
                <div class="song-title">${r.repertorio?.titulo ?? 'Sin título'}</div>
                <div class="song-artist">${r.repertorio?.artista ?? 'Artista desconocido'}</div>
              </div>
            </div>`).join('')}
      </div>
    </div>`
  : '';

  // ─── Reemplazar placeholders ──────────────────────────────────────────────
  html = html
    .replace('{{ID}}',                 String(cot.id))
    .replace('{{FECHA_HOY}}',          new Date().toLocaleDateString('es-CO'))
    .replace('{{ESTADO}}',             estado)
    .replace('{{TIPO_EVENTO}}',        cot.tipoEvento ?? '')
    .replace('{{FECHA_EVENTO}}',       formatDate(eventDate))
    .replace('{{HORA_INICIO}}',        startTime)
    .replace('{{HORA_FIN}}',           endTime)
    .replace('{{LUGAR}}',              cot.direccionEvento ?? '')
    .replace('{{HOMENAJEADO_ROW}}',    homenajeadoRow)
    .replace('{{NOTAS_ROW}}',          notasRow)
    .replace('{{SERVICIOS_SECTION}}',  serviciosSection)
    .replace('{{REPERTORIO_SECTION}}', repertorioSection)
    .replace(/\{\{TOTAL\}\}/g,         formatCurrency(total))
    .replace(/\{\{ANTICIPO\}\}/g,      formatCurrency(anticipo))
    .replace('{{SALDO}}',              formatCurrency(saldo))

  return html
}

// ─── GENERAR PDF ──────────────────────────────────────────────────────────────
export const generateCotizacionPdf = async (id: number): Promise<Buffer> => {
  // Cargar cotización con todas las relaciones
  const cot = await prisma.cotizacion.findUnique({
    where: { id },
    include: {
      cliente: true,
      servicios: {
        include: { servicio: true }
      },
      repertorios: {
        include: { repertorio: true },
        orderBy: { orden: 'asc' }
      },
    }
  })

  if (!cot) throw new Error('Cotización no encontrada')

  const html = buildHtml(cot)

  // ─── Puppeteer ────────────────────────────────────────────────────────────
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ],
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