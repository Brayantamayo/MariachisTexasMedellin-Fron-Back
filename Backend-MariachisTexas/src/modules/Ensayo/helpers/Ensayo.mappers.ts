import type { Ensayo, EnsayoRepertorio } from '../../../generated/prisma'
import type { RehearsalResponse } from '../../../types/interfaces'
import { toLocalDate, toLocalTime } from '../../../utils/date.helpers'

export type EnsayoConRelaciones = Ensayo & { repertorios: EnsayoRepertorio[] }

// ─── mapToRehearsal ───────────────────────────────────────────────────────────
// Convierte el modelo Prisma → DTO de salida (RehearsalResponse)
export const mapToRehearsal = (e: EnsayoConRelaciones): RehearsalResponse => ({
    id: String(e.id),
    title: e.nombre,
    location: e.lugar,
    address: e.ubicacion ?? '',
    date: toLocalDate(e.fechaHora),
    time: toLocalTime(e.fechaHora),
    notes: '',
    repertoireIds: e.repertorios.map(r => String(r.repertorioId)),
    status: e.estado as 'PENDIENTE' | 'LISTO',
    createdAt: e.createdAt?.toISOString(),
    updatedAt: e.updatedAt?.toISOString(),
})