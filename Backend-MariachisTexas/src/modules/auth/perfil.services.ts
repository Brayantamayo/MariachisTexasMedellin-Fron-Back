import prisma from '../../config/prisma'
import type { PerfilResponse, ActualizarPerfilDatos } from '../../types/interfaces'





// ── Helpers para errores con status ──────────────────────────────────────────

class AppError extends Error {
status: number
constructor(message: string, status: number) {
    super(message)
    this.status = status
}
}

// ── obtenerPerfil ─────────────────────────────────────────────────────────────

export const obtenerPerfil = async (usuarioId: number): Promise<PerfilResponse> => {
const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
    id:        true,
    nombre:    true,
    email:     true,
    createdAt: true,
    rol: {
    select: { nombre: true }
    },
    cliente: {
    select: {
    id:                  true,
    apellido:            true,
    tipoDocumento:       true,
    numeroDocumento:     true,
    fechaNacimiento:     true,
    telefonoPrincipal:   true,
    telefonoAlternativo: true,
    ciudad:              true,
    barrio:              true,
    direccion:           true,
    zonaServicio:        true,
    foto:                true,
        }
    }
    }
})

if (!usuario) throw new AppError('Usuario no encontrado', 404)

return {
    id:                  usuario.id,
    nombre:              usuario.nombre,
    email:               usuario.email,
    rol:                 usuario.rol?.nombre ?? 'CLIENTE',
    apellido:            usuario.cliente?.apellido            ?? '',
    tipoDocumento:       usuario.cliente?.tipoDocumento       ?? 'CC',
    numeroDocumento:     usuario.cliente?.numeroDocumento     ?? '',
    fechaNacimiento:     usuario.cliente?.fechaNacimiento
    ? usuario.cliente.fechaNacimiento.toISOString().split('T')[0]
    : '',
    telefonoPrincipal:   usuario.cliente?.telefonoPrincipal   ?? '',
    telefonoAlternativo: usuario.cliente?.telefonoAlternativo ?? '',
    ciudad:              usuario.cliente?.ciudad              ?? '',
    barrio:              usuario.cliente?.barrio              ?? '',
    direccion:           usuario.cliente?.direccion           ?? '',
    zonaServicio:        usuario.cliente?.zonaServicio        ?? 'URBANA',
    foto:                usuario.cliente?.foto                ?? null,
    clienteId:           usuario.cliente?.id                  ?? null,
}
}

// ── actualizarPerfil ──────────────────────────────────────────────────────────

export const actualizarPerfil = async (
usuarioId: number,
datos: ActualizarPerfilDatos
): Promise<PerfilResponse> => {

const {
    nombre,
    apellido,
    telefonoPrincipal,
    telefonoAlternativo,
    ciudad,
    barrio,
    direccion,
    zonaServicio,
    fechaNacimiento,
    foto,
} = datos

  // ── 2. Actualizar tabla `usuario` ─────────────────────────────────────────
const datosUsuario: { nombre?: string } = {}
if (nombre !== undefined) datosUsuario.nombre = nombre.trim()

if (Object.keys(datosUsuario).length > 0) {
    await prisma.usuario.update({
    where: { id: usuarioId },
    data:  datosUsuario,
    })
}

  // ── 3. Verificar si existe registro en `cliente` ──────────────────────────
const usuario = await prisma.usuario.findUnique({
    where:  { id: usuarioId },
    select: { email: true, cliente: { select: { id: true } } },
})

if (!usuario) throw new AppError('Usuario no encontrado', 404)

  // ── 4. Actualizar tabla `cliente` (sólo si existe el registro) ────────────
if (usuario.cliente) {
    const datosCliente: Record<string, unknown> = {}

    if (apellido            !== undefined) datosCliente.apellido            = apellido.trim()
    if (telefonoPrincipal   !== undefined) datosCliente.telefonoPrincipal   = telefonoPrincipal.trim()
    if (telefonoAlternativo !== undefined) datosCliente.telefonoAlternativo = telefonoAlternativo?.trim() || null
    if (ciudad              !== undefined) datosCliente.ciudad              = ciudad.trim()
    if (barrio              !== undefined) datosCliente.barrio              = barrio.trim()
    if (direccion           !== undefined) datosCliente.direccion           = direccion.trim()
    if (zonaServicio        !== undefined) datosCliente.zonaServicio        = zonaServicio
    if (foto                !== undefined) datosCliente.foto                = foto || null

    if (fechaNacimiento !== undefined && fechaNacimiento !== '') {
    datosCliente.fechaNacimiento = new Date(fechaNacimiento)
    }

    if (Object.keys(datosCliente).length > 0) {
    await prisma.cliente.update({
        where: { id: usuario.cliente.id },
        data:  datosCliente,
    })
    }
}

return obtenerPerfil(usuarioId)
}