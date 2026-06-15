import prisma from '../../config/prisma'
import type { PerfilResponse, ActualizarPerfilDatos } from '../../types/interfaces'

class AppError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export const obtenerPerfil = async (usuarioId: number): Promise<PerfilResponse> => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      id: true,
      nombre: true,
      email: true,
      createdAt: true,
      rol: {
        select: { nombre: true },
      },
      cliente: {
        select: {
          id: true,
          apellido: true,
          tipoDocumento: true,
          numeroDocumento: true,
          fechaNacimiento: true,
          telefonoPrincipal: true,
          telefonoAlternativo: true,
          ciudad: true,
          barrio: true,
          direccion: true,
          zonaServicio: true,
          foto: true,
        },
      },
    },
  })

  if (!usuario) throw new AppError('Usuario no encontrado', 404)

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol?.nombre ?? 'CLIENTE',
    apellido: usuario.cliente?.apellido ?? '',
    tipoDocumento: usuario.cliente?.tipoDocumento ?? 'CC',
    numeroDocumento: usuario.cliente?.numeroDocumento ?? '',
    fechaNacimiento: usuario.cliente?.fechaNacimiento
      ? usuario.cliente.fechaNacimiento.toISOString().split('T')[0]
      : '',
    telefonoPrincipal: usuario.cliente?.telefonoPrincipal ?? '',
    telefonoAlternativo: usuario.cliente?.telefonoAlternativo ?? '',
    ciudad: usuario.cliente?.ciudad ?? '',
    barrio: usuario.cliente?.barrio ?? '',
    direccion: usuario.cliente?.direccion ?? '',
    zonaServicio: usuario.cliente?.zonaServicio ?? 'URBANA',
    foto: usuario.cliente?.foto ?? null,
    clienteId: usuario.cliente?.id ?? null,
  }
}

export const actualizarPerfil = async (
  usuarioId: number,
  datos: ActualizarPerfilDatos
): Promise<PerfilResponse> => {
  const {
    nombre,
    email,
    apellido,
    tipoDocumento,
    numeroDocumento,
    telefonoPrincipal,
    telefonoAlternativo,
    ciudad,
    barrio,
    direccion,
    zonaServicio,
    fechaNacimiento,
    foto,
  } = datos

  const usuarioActual = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      email: true,
      cliente: {
        select: {
          id: true,
          numeroDocumento: true,
        },
      },
    },
  })

  if (!usuarioActual) throw new AppError('Usuario no encontrado', 404)

  const datosUsuario: { nombre?: string; email?: string } = {}

  if (nombre !== undefined) {
    datosUsuario.nombre = nombre.trim()
  }

  if (email !== undefined) {
    const emailNuevo = email.trim()
    if (emailNuevo && emailNuevo.toLowerCase() !== usuarioActual.email.toLowerCase()) {
      const emailExiste = await prisma.usuario.findUnique({
        where: { email: emailNuevo },
        select: { id: true },
      })

      if (emailExiste && emailExiste.id !== usuarioId) {
        throw new AppError('El correo ya está registrado', 409)
      }

      datosUsuario.email = emailNuevo
    }
  }

  if (Object.keys(datosUsuario).length > 0) {
    await prisma.usuario.update({
      where: { id: usuarioId },
      data: datosUsuario,
    })
  }

  if (usuarioActual.cliente) {
    const datosCliente: Record<string, unknown> = {}

    const documentoNuevo = numeroDocumento?.trim()
    if (documentoNuevo && documentoNuevo !== usuarioActual.cliente.numeroDocumento) {
      const documentoExiste = await prisma.cliente.findUnique({
        where: { numeroDocumento: documentoNuevo },
        select: { id: true },
      })

      if (documentoExiste && documentoExiste.id !== usuarioActual.cliente.id) {
        throw new AppError('El número de documento ya está registrado', 409)
      }
    }

    if (apellido !== undefined) datosCliente.apellido = apellido.trim()
    if (tipoDocumento !== undefined) datosCliente.tipoDocumento = tipoDocumento
    if (numeroDocumento !== undefined) datosCliente.numeroDocumento = documentoNuevo
    if (telefonoPrincipal !== undefined) datosCliente.telefonoPrincipal = telefonoPrincipal.trim()
    if (telefonoAlternativo !== undefined) datosCliente.telefonoAlternativo = telefonoAlternativo?.trim() || null
    if (ciudad !== undefined) datosCliente.ciudad = ciudad.trim()
    if (barrio !== undefined) datosCliente.barrio = barrio.trim()
    if (direccion !== undefined) datosCliente.direccion = direccion.trim()
    if (zonaServicio !== undefined) datosCliente.zonaServicio = zonaServicio
    if (foto !== undefined) datosCliente.foto = foto || null

    if (fechaNacimiento !== undefined && fechaNacimiento !== '') {
      datosCliente.fechaNacimiento = new Date(fechaNacimiento)
    }

    if (Object.keys(datosCliente).length > 0) {
      await prisma.cliente.update({
        where: { id: usuarioActual.cliente.id },
        data: datosCliente,
      })
    }
  }

  return obtenerPerfil(usuarioId)
}
