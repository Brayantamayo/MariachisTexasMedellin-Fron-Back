const Groq = require('groq-sdk'); // Importación más compatible con CommonJS/TS-Node
import prisma from '../../config/prisma';

const GROQ_MODEL = 'llama-3.3-70b-versatile'; 

// ─── Consulta la BD y construye el contexto ──────────────────────────────────
const buildContext = async (): Promise<string> => {
  try {
    const [servicios, repertorio, bloqueos] = await Promise.all([
      prisma.servicio.findMany({ where: { estado: true } }).catch(() => []),
      prisma.repertorio.findMany({ where: { activa: true }, orderBy: { titulo: 'asc' } }).catch(() => []),
      prisma.bloqueoCalendario.findMany({
        where: { fechaFin: { gte: new Date() } },
        orderBy: { fechaInicio: 'asc' },
      }).catch(() => []),
    ]);

    const fmtServicios = servicios.length
      ? servicios.map((s: any) =>
          `- ${s.nombre}: ${s.descripcion} | Precio: $${Number(s.precio).toLocaleString('es-CO')} COP`
        ).join('\n')
      : 'No hay servicios registrados.';

    const fmtRepertorio = repertorio.length
      ? repertorio.map((r: any) => `- ${r.titulo} — ${r.artista} (${r.genero})`).join('\n')
      : 'No hay canciones registradas.';

    const fechasBloqueadas = bloqueos.length
      ? bloqueos.map((b: any) => {
          try {
            const inicio = b.fechaInicio instanceof Date ? b.fechaInicio.toLocaleDateString('es-CO') : 'Fecha inválida';
            const fin    = b.fechaFin instanceof Date ? b.fechaFin.toLocaleDateString('es-CO') : 'Fecha inválida';
            const motivo = b.motivo?.replace(/^[A-Z_]+:/, '').split('|')[0] ?? 'No disponible';
            return inicio === fin ? `- ${inicio}: ${motivo}` : `- Del ${inicio} al ${fin}: ${motivo}`;
          } catch {
            return '- Fecha bloqueada (error de formato)';
          }
        }).join('\n')
      : 'No hay fechas bloqueadas registradas.';

    return `
=== INFORMACIÓN ACTUALIZADA DE MARIACHIS TEXAS (${new Date().toLocaleDateString('es-CO')}) ===

🎶 SERVICIOS DISPONIBLES:
${fmtServicios}

🎵 REPERTORIO DE CANCIONES (${repertorio.length} canciones activas):
${fmtRepertorio}

🚫 FECHAS NO DISPONIBLES:
${fechasBloqueadas}

ℹ️ INFORMACIÓN DE CONTACTO:
- Teléfono: 312 237 3486 | 314 757 4707
- Email: texasmariachi@gmail.com
- Ubicación: Medellín, Antioquia, Colombia
`.trim();
  } catch (err) {
    console.error('⚠️ Error construyendo contexto para IA:', err);
    return 'Información básica: Mariachis Texas Medellín. Contacto: 312 237 3486.';
  }
};

// ─── Función principal de chat ────────────────────────────────────────────────
export const chatWithGroq = async (
  userMessage: string,
  history: { role: 'user' | 'model'; text: string }[]
): Promise<string> => {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    console.error('❌ ERROR: GROQ_API_KEY no encontrada en process.env');
    throw new Error('Falta la configuración de la IA en el servidor.');
  }

  try {
    const groq = new Groq({ apiKey });
    const dbContext = await buildContext();

    const systemPrompt = `
Eres "Lupita", la asesora virtual de Mariachis Texas, Medellín.
Hablas con calidez, entusiasmo y profesionalismo (estilo Paisa amable).

DATOS OFICIALES:
${dbContext}

REGLAS:
1. Responde SIEMPRE basado en los datos oficiales.
2. Si no hay disponibilidad en una fecha, sugiere contactar al WhatsApp 3147574707.
3. Responde de forma concisa y elegante.
`.trim();

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history.map(h => ({
        role: (h.role === 'model' ? 'assistant' : 'user') as 'assistant' | 'user',
        content: h.text,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content ?? 'Lo siento, no pude procesar tu mensaje.';
  } catch (err: any) {
    console.error('❌ Error en servicio Groq:', err?.message);
    throw new Error('El servicio de IA está temporalmente fuera de línea.');
  }
};