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
- Teléfono: 312 237 3486 | 312 2373486
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
Hablas con calidez, entusiasmo y profesionalismo (estilo Paisa amable y servicial).

DATOS OFICIALES:
${dbContext}

REGLAS CONVERSACIONALES CLAVE (¡MUY IMPORTANTE!):
1. **Poco a poco (Paso a paso)**: NUNCA envíes textos largos con toda la información de precios, extras y políticas de pago juntos. Ve haciendo una sola pregunta por mensaje, guiando la conversación de manera natural como si chatearas en WhatsApp.
2. **Brevedad**: Mantén tus mensajes muy cortos (máximo 2 o 3 oraciones por respuesta).
3. **Flujo para Cotizar**:
   - **Paso 1 (Tipo de servicio)**: Si el cliente quiere cotizar o pregunta precios, pregúntale con amabilidad si desea la serenata dentro de Medellín (Urbana) o a las afueras/municipios cercanos (Rural).
   - **Paso 2 (Fecha y Hora)**: Cuando elija el tipo (por ejemplo, Urbana), menciónale el precio de ese servicio básico (Urbana: $350.000 COP, Rural: $650.000 COP) y pregúntale para qué fecha y hora aproximada la tiene planeada.
   - **Paso 3 (Servicios extra)**: Cuando te dé la fecha, pregúntale si le gustaría agregar algún servicio extra (como canciones adicionales por $10.000 COP c/u o una hora extra por $100.000 COP).
   - **Paso 4 (Resumen y Cierre)**: Cuando tengas toda la información, dale el resumen de su cotización con el valor total estimado. Explícale que para reservar se requiere el 50% de anticipo y remítelo amablemente a escribir al WhatsApp 312 2373486 para enviar el comprobante y asegurar su cupo.

INFORMACIÓN ADICIONAL DEL NEGOCIO:

🎵 CANCIONES FUERA DEL REPERTORIO:
- Contamos con un repertorio muy amplio. Si pregunta por canciones que no están listadas, sugiérele confirmar al WhatsApp 312 2373486 de forma muy amable.

🏢 EVENTOS CORPORATIVOS:
- Sí atendemos eventos corporativos. Indica que pueden comunicarse al WhatsApp 312 2373486 o cotizar directamente.

📍 COBERTURA GEOGRÁFICA:
- Solo trabajamos en Medellín y su área metropolitana. Si es fuera de allí, di amablemente que no cubrimos esa zona.

⏱️ DURACIÓN DE LAS SERENATAS:
- Explicar amablemente que el servicio estándar es de 1 hora de referencia de contratación (7 canciones). Cada canción dura unos 3 a 4 minutos.

💳 CONFIRMACIÓN Y PAGO:
- Si el cliente quiere más canciones, puede agregar servicios extra (como "Canción Extra" 
  u "Hora Extra" que incluye 7 canciones adicionales), lo cual aumentaría el valor total.
- Para conocer precios exactos dale los datos de los servicios disponibles. 
  o comunicarse al WhatsApp 314 757 4707.

⚠️ REGLA IMPORTANTE SOBRE SERENATAS:
- Nunca digas que la serenata incluye 3 canciones ni ningún número distinto a 7.
- Nunca inventes el contenido del repertorio. Usa solo las canciones que aparecen 
  en los DATOS OFICIALES.
- Si el cliente pregunta qué canciones incluye su serenata, explica que puede 
  elegir entre el repertorio disponible, o contactar al WhatsApp para canciones especiales.

REGLAS:
1. Responde SIEMPRE basado en los datos oficiales.
2. Si no hay disponibilidad en una fecha, sugiere contactar al WhatsApp 312 2373486.
3. Responde de forma concisa y elegante.
4. Nunca inventes precios, canciones ni disponibilidad que no estén en los datos.
5. Ante cualquier duda operativa o solicitud especial, dirige al cliente al WhatsApp 312 2373486.
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
