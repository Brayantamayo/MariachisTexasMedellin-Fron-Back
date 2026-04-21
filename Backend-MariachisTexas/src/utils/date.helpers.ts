///aqui van todos los buffers de tiempo para reservas y ensayos, validaciones de fechas, etc.

export const toLocalDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const toLocalTime = (d: Date): string =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

export const parseLocalDate = (dateStr: string): Date =>
  new Date(`${dateStr}T00:00:00`)

export const buildDateTime = (date: string, time: string): Date =>
  new Date(`${date}T${time}:00`)

export const dayRange = (dateStr: string) => ({
  dayStart: new Date(`${dateStr}T00:00:00`),
  dayEnd: new Date(`${dateStr}T23:59:59`),
})

// ─── VALIDACIÓN 6 HORAS MISMO DÍA ────────────────────────────────────────────
// skipForAdmin: si es true (admin/empleado), omite la validación de anticipación
export const validarAnticipacionMismoDia = (dateStr: string, time: string, skipForAdmin = false) => {
  if (skipForAdmin) return

  // Usar fecha local para evitar problemas de zona horaria UTC
  const hoy = toLocalDate(new Date())
  if (dateStr !== hoy) return

  const ahora = new Date()
  const horaEvento = new Date(`${dateStr}T${time}:00`)
  const diffHoras = (horaEvento.getTime() - ahora.getTime()) / (1000 * 60 * 60)

  if (diffHoras < 6) {
    const horaMinima = new Date(ahora.getTime() + 6 * 60 * 60 * 1000)
    const hh = horaMinima.getHours().toString().padStart(2, '0')
    const mm = horaMinima.getMinutes().toString().padStart(2, '0')
    throw new Error(
      `Para eventos el mismo día se requieren al menos 6 horas de anticipación. Hora mínima disponible hoy: ${hh}:${mm}`
    )
  }
}

// ─── BLOQUEO DE HORAS ─────────────────────────────────────────────────────────
// Bloquea:
//   - 1h ANTES  del inicio  (preparación/llegada)
//   - todas las horas entre inicio y fin (el evento en sí)
//   - 1h DESPUÉS del fin    (cierre/transporte)  ← FIX
export const bloquearRango = (
  allHours: string[],
  blocked: Set<string>,
  startTime: string,
  endTime: string
) => {
  const [sh] = startTime.split(':').map(Number)
  const [eh] = endTime.split(':').map(Number)

  // Buffer PRE: hora anterior al inicio
  blocked.add(`${((sh - 1 + 24) % 24).toString().padStart(2, '0')}:00`)

  // Horas del evento
  allHours.forEach(h => {
    const [hh] = h.split(':').map(Number)
    if (hh >= sh && hh < eh) blocked.add(h)
  })

  // Buffer POST: hora siguiente al fin (cierre/transporte) ← FIX
  blocked.add(`${(eh % 24).toString().padStart(2, '0')}:00`)
}

// ─── NOMBRE DE CLIENTE SIN APELLIDO DUPLICADO ────────────────────────────────
// usuario.nombre se guarda como "Juan García" (nombre + apellido).
// Si concatenamos apellido de nuevo queda "Juan García García".
// Esta función extrae solo el primer nombre quitando el apellido del final.
export const buildClientName = (
  usuarioNombre: string | null | undefined,
  apellido: string | null | undefined
): string => {
  const nombre = (usuarioNombre ?? '').trim()
  const apell = (apellido ?? '').trim()
  if (!nombre) return apell
  if (!apell) return nombre
  const suffix = ' ' + apell
  const lower = nombre.toLowerCase()
  if (lower.endsWith(suffix.toLowerCase()))
    return nombre.slice(0, nombre.length - suffix.length).trim() + ' ' + apell

  // Si no termina con el apellido, concatenarlos
  return (nombre + ' ' + apell).trim()
}

