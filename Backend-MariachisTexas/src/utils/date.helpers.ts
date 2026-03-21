// ─── FECHA Y HORA ─────────────────────────────────────────────────────────────

export const toLocalDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const toLocalTime = (d: Date): string =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

// Parsea una fecha string como local evitando el offset UTC
export const parseLocalDate = (dateStr: string): Date =>
  new Date(`${dateStr}T00:00:00`)

// Construye un Date combinando fecha string + hora string
export const buildDateTime = (date: string, time: string): Date =>
  new Date(`${date}T${time}:00`)

// Rango del día completo
export const dayRange = (dateStr: string) => ({
  dayStart: new Date(`${dateStr}T00:00:00`),
  dayEnd:   new Date(`${dateStr}T23:59:59`),
})

// ─── BLOQUEO DE HORAS ────────────────────────────────────────────────────────
// Bloquea un rango de horas + 1h buffer antes y después
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
    if (hh >= sh && hh <= eh) blocked.add(h)
  })

  blocked.add(`${((eh + 1) % 24).toString().padStart(2, '00')}:00`)
}