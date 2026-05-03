import Groq from 'groq-sdk'
import prisma from '../../config/prisma'

const GROQ_MODEL = 'llama-3.3-70b-versatile'

// ─── Consulta la BD y construye el contexto ──────────────────────────────────
const buildContext = async (): Promise<string> => {
  const [servicios, repertorio, bloqueos] = await Promise.all([
    prisma.servicio.findMany({ where: { estado: true } }).catch(() => []),
    prisma.repertorio.findMany({ where: { activa: true }, orderBy: { titulo: 'asc' } }).catch(() => []),
    prisma.bloqueoCalendario.findMany({
      where: { fechaFin: { gte: new Date() } },
      orderBy: { fechaInicio: 'asc' },
    }).catch(() => []),
  ])

  const fmtServicios = servicios.length
    ? servicios.map((s: any) =>
        `- ${s.nombre}: ${s.descripcion} | Precio: $${Number(s.precio).toLocaleString('es-CO')} COP`
      ).join('\n')
    : 'No hay servicios registrados.'

  const fmtRepertorio = repertorio.length
    ? repertorio.map((r: any) => `- ${r.titulo} — ${r.artista} (${r.genero})`).join('\n')
    : 'No hay canciones registradas.'

  const fechasBloqueadas = bloqueos.length
    ? bloqueos.map((b: any) => {
        const inicio = b.fechaInicio.toLocaleDateString('es-CO')
        const fin    = b.fechaFin.toLocaleDateString('es-CO')
        const motivo = b.motivo?.replace(/^[A-Z_]+:/, '').split('|')[0] ?? 'No disponible'
        return inicio === fin
          ? `- ${inicio}: ${motivo}`
          : `- Del ${inicio} al ${fin}: ${motivo}`
      }).join('\n')
    : 'No hay fechas bloqueadas registradas.'

  return `
=== INFORMACIÓN ACTUALIZADA DE MARIACHIS TEXAS (${new Date().toLocaleDateString('es-CO')}) ===

🎶 SERVICIOS DISPONIBLES:
${fmtServicios}

🎵 REPERTORIO DE CANCIONES (${repertorio.length} canciones activas):
${fmtRepertorio}

🚫 FECHAS NO DISPONIBLES:
${fechasBloqueadas}

ℹ️ INFORMACIÓN DE CONTACTO:
- Teléfono 1: 312-237-3486
- Teléfono 2: 314-757-4707
- Fijo: (574) 505-7667
- Email: texasmariachi@gmail.com
- Ubicación: Medellín, Antioquia, Colombia
`.trim()
}

// ─── Función principal de chat ────────────────────────────────────────────────
export const chatWithGroq = async (
  userMessage: string,
  history: { role: 'user' | 'model'; text: string }[]
): Promise<string> => {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY no está configurada en el servidor')

  const groq = new Groq({ apiKey })

  const dbContext = await buildContext()

  const systemPrompt = `
Eres "Lupita", la asesora virtual de Mariachis Texas, un grupo de mariachis profesional en Medellín, Colombia.
Hablas siempre en español con calidez, entusiasmo y profesionalismo.

USA SOLO la siguiente información para responder. No inventes datos ni precios.
Si no sabes algo, di amablemente que un asesor se pondrá en contacto.

${dbContext}

REGLAS IMPORTANTES:
- Si el cliente pregunta por disponibilidad, revisa las fechas bloqueadas.
- Si pregunta por canciones, consulta el repertorio listado.
- Si quiere hacer una reserva, pídele:
1. Nombre completo
2. Fecha y hora del evento
3. Ciudad / dirección aproximada
4. Número de contacto
- Responde de forma concisa (máximo 4 oraciones salvo que pidan más detalle).
- No menciones precios que no estén en la lista de servicios.
`.trim()

  const messages = [
    { role: 'system' as const,    content: systemPrompt },
    ...history.map(h => ({
      role:    (h.role === 'model' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: h.text,
    })),
    { role: 'user' as const, content: userMessage },
  ]

  const response = await groq.chat.completions.create({
    model:       GROQ_MODEL,
    messages,
    max_tokens:  500,
    temperature: 0.7,
  })

  return (
    response.choices[0]?.message?.content ??
    'Lo siento, no pude procesar tu mensaje.'
  )
}