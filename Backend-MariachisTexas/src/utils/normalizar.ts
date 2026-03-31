export const normalizar = (s: string): string =>
s.trim()
.toLowerCase()
.normalize('NFD')
.replace(/[\u0300-\u036f]/g, '')
.replace(/\s+/g, ' ')