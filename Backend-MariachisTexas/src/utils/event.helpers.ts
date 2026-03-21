import { TipoEvento } from '../generated/prisma'

// ─── MAPEO TIPO DE EVENTO ────────────────────────────────────────────────────
export const mapEventType = (tipo: string): TipoEvento => {
  const map: Record<string, TipoEvento> = {
    'Serenata':       'OTRO',
    'Boda':           'BODA',
    'Cumpleaños':     'CUMPLEANOS',
    'Empresarial':    'OTRO',
    'Fúnebre':        'FUNERAL',
    'Otro':           'OTRO',
    'BODA':           'BODA',
    'CUMPLEANOS':     'CUMPLEANOS',
    'QUINCEANIOS':    'QUINCEANIOS',
    'FUNERAL':        'FUNERAL',
    'RECONCILIACION': 'RECONCILIACION',
    'DIA_DE_MADRE':   'DIA_DE_MADRE',
    'OTRO':           'OTRO',
  }
  return map[tipo] ?? 'OTRO'
}