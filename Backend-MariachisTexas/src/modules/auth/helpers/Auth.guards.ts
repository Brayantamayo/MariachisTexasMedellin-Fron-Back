// ─── JWT_SECRET ───────────────────────────────────────────────────────────────
// Valida al arrancar el módulo que JWT_SECRET esté definido.
// Así el error aparece al iniciar la app, no en el primer login.
const secret = process.env.JWT_SECRET
if (!secret) throw new Error('JWT_SECRET no está definido en las variables de entorno')

export const JWT_SECRET = secret