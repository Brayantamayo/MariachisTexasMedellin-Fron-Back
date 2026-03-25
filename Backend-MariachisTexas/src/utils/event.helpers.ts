import { TipoEvento } from '../generated/prisma'

export const mapEventType = (tipo: string): TipoEvento => {
  const map: Record<string, TipoEvento> = {
    // Labels en español (frontend)
    'Serenata':       'OTRO',
    'Boda':           'BODA',
    'Cumpleaños':     'CUMPLEANOS',
    'Empresarial':    'OTRO',
    'Fúnebre':        'FUNERAL',
    'Quinceaños':     'QUINCEANIOS',
    'Reconciliación': 'RECONCILIACION',
    'Día de la Madre':'DIA_DE_MADRE',
    'Amor':           'AMOR',           // ← FALTABA
    'Aniversario':    'ANIVERSARIO',    // ← FALTABA
    'Padres':         'PADRES',         // ← FALTABA
    'Fiesta':         'FIESTA',         // ← FALTABA
    'Otro':           'OTRO',
    // Valores del enum directos
    'BODA':           'BODA',
    'CUMPLEANOS':     'CUMPLEANOS',
    'QUINCEANIOS':    'QUINCEANIOS',
    'FUNERAL':        'FUNERAL',
    'RECONCILIACION': 'RECONCILIACION',
    'DIA_DE_MADRE':   'DIA_DE_MADRE',
    'AMOR':           'AMOR',           // ← FALTABA
    'ANIVERSARIO':    'ANIVERSARIO',    // ← FALTABA
    'PADRES':         'PADRES',         // ← FALTABA
    'FIESTA':         'FIESTA',         // ← FALTABA
    'OTRO':           'OTRO',
  }
  return map[tipo] ?? 'OTRO'
}