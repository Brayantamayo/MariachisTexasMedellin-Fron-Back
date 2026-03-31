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
  dayEnd:   new Date(`${dateStr}T23:59:59`),
})

// ─── VALIDACIÓN 6 HORAS MISMO DÍA ────────────────────────────────────────────
// Lanza error si se intenta crear un evento hoy con menos de 6h de anticipación
export const validarAnticipacionMismoDia = (dateStr: string, time: string) => {
  const hoy = new Date().toISOString().split('T')[0]
  if (dateStr !== hoy) return // Solo aplica para hoy

  const ahora      = new Date()
  const horaEvento = new Date(`${dateStr}T${time}:00`)
  const diffHoras  = (horaEvento.getTime() - ahora.getTime()) / (1000 * 60 * 60)

  if (diffHoras < 6) {
    const horaMinima = new Date(ahora.getTime() + 6 * 60 * 60 * 1000)
    const hh = horaMinima.getHours().toString().padStart(2, '0')
    const mm = horaMinima.getMinutes().toString().padStart(2, '0')
    throw new Error(`Para eventos el mismo día se requieren al menos 6 horas de anticipación. Hora mínima disponible hoy: ${hh}:${mm}`
    )
  }
}

// ─── BLOQUEO DE HORAS ─────────────────────────────────────────────────────────
export const bloquearRango = (
  allHours: string[],
  blocked:  Set<string>,
  startTime: string,
  endTime:   string
) => {
  const [sh] = startTime.split(':').map(Number)
  const [eh] = endTime.split(':').map(Number)

  blocked.add(`${((sh - 1 + 24) % 24).toString().padStart(2, '0')}:00`)

  allHours.forEach(h => {
    const [hh] = h.split(':').map(Number)
    if (hh >= sh && hh < eh) blocked.add(h)
  })
}