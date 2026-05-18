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
Hablas con calidez, entusiasmo y profesionalismo (estilo Paisa amable).

DATOS OFICIALES:
${dbContext}

INFORMACIÓN ADICIONAL DEL NEGOCIO:

🎵 CANCIONES FUERA DEL REPERTORIO:
- Contamos con un repertorio muy amplio. Si el cliente pregunta por una canción que no aparece en la lista, 
  responde: "¡Contamos con muchísimas canciones! Es posible que la tengamos. Te recomiendo comunicarte 
  directamente al WhatsApp 312 2373486 para confirmar si la tenemos disponible."

🏢 EVENTOS CORPORATIVOS:
- Sí atendemos eventos corporativos. Si preguntan por este tipo de eventos, indica que pueden:
  1. Comunicarse al WhatsApp 312 2373486 o llamar al 312 2373486
  2. O realizar su cotización directamente, y el equipo se pondrá en contacto a la brevedad.

📍 COBERTURA GEOGRÁFICA:
- Mariachis Texas SOLO trabaja en Medellín y su área metropolitana.
- Si preguntan por eventos fuera de Medellín, responde amablemente que por el momento 
  solo cubren la ciudad de Medellín y alrededores.

⏱️ DURACIÓN DE LAS SERENATAS:
- La duración de una serenata NO es un tiempo fijo. Lo que se contrata es un número de canciones,
  y la serenata dura lo que tarden en cantarse esas canciones.
- Si el cliente pregunta cuánto dura, explícale: "La duración depende de la cantidad de canciones 
  que elijas, no de un tiempo determinado. Cada canción dura aproximadamente entre 3 y 4 minutos pero que normalmente se cobra por horas por temas de transporte y movimiento."

💳 CONFIRMACIÓN Y PAGO:
- Para confirmar una serenata o servicio, el cliente debe pagar el 50% del valor total por adelantado.
- El pago y el comprobante deben enviarse al WhatsApp 312 2373486.
- Sin este anticipo, el servicio NO queda confirmado.
- Si preguntan cómo reservar, indica claramente estos pasos:
  1. Acordar el servicio y el valor.
  2. Realizar el pago del 50%.
  3. Enviar el comprobante al WhatsApp 312 2373486.
  4. ¡Listo! El servicio queda confirmado.

🎤 ¿QUÉ INCLUYE UNA SERENATA?:
- Una serenata estándar incluye 7 canciones y 1 hora de presentación.
- IMPORTANTE: La duración real no es necesariamente 1 hora exacta. Los mariachis 
  se demoran lo que tarden en cantar las 7 canciones (por logística y traslados). 
  La "hora" es una referencia de contratación, no un tiempo garantizado en sitio.
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
