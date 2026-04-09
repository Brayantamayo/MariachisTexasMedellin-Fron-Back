import prisma from '../../config/prisma'
import { UsuarioCreateSchema, UsuarioUpdateSchema, zodError } from '../schemas'
import type { UsuarioCreateInput, UsuarioUpdateInput, UsuarioResponse } from '../../types/interfaces'
import bcrypt from 'bcryptjs'
import { AppError } from '../../utils/AppError'

// ─── INTERFACES PARA EMPLEADO ────────────────────────────────────────────────
interface EmpleadoCreateInput {
  nombre: string
  email: string
  password: string
  rolId: number
  tipoDocumento?: 'CC' | 'CE' | 'TI' | 'PAS'
  numeroDocumento: string
  fechaNacimiento: string
  telefonoPrincipal: string
  telefonoAlternativo?: string
  ciudad?: string
  barrio: string
  direccion: string
  zonaServicio?: 'URBANA' | 'RURAL'
  instrumentoPrincipal: string
  otrosInstrumentos?: string
  anosExperiencia?: number
  foto?: string
}

interface EmpleadoUpdateInput extends Partial<EmpleadoCreateInput> {
  estado?: boolean
}

// ─── MAPEAR A USUARIO RESPONSE ───────────────────────────────────────────────
const mapToUsuario = (u: any): UsuarioResponse => ({
  id: u.id,
  nombre: u.nombre,
  email: u.email,
  estado: u.estado,
  rolId: u.rolId,
  rol: {
    id: u.rol.id,
    nombre: u.rol.nombre,
    descripcion: u.rol.descripcion
  },
  createdAt: u.createdAt.toISOString(),
  updatedAt: u.updatedAt.toISOString()
})

// ─── MAPEAR A EMPLEADO RESPONSE ──────────────────────────────────────────────
const mapToEmpleado = (e: any) => ({
  ...mapToUsuario(e.usuario),
  empleado: {
    tipoDocumento: e.tipoDocumento,
    numeroDocumento: e.numeroDocumento,
    fechaNacimiento: e.fechaNacimiento.toISOString(),
    telefonoPrincipal: e.telefonoPrincipal,
    telefonoAlternativo: e.telefonoAlternativo,
    ciudad: e.ciudad,
    barrio: e.barrio,
    direccion: e.direccion,
    zonaServicio: e.zonaServicio,
    instrumentoPrincipal: e.instrumentoPrincipal,
    otrosInstrumentos: e.otrosInstrumentos,
    anosExperiencia: e.anosExperiencia,
    foto: e.foto
  }
})

// ─── OBTENER ROL EMPLEADO ────────────────────────────────────────────────────
const getEmpleadoRolId = async (): Promise<number> => {
  const rol = await prisma.rol.findUnique({
    where: { nombre: 'EMPLEADO' }
  })
  if (!rol) throw new AppError('Rol EMPLEADO no encontrado', 404)
  return rol.id
}

// ─── OBTENER TODOS LOS EMPLEADOS ─────────────────────────────────────────────
export const getEmpleados = async (): Promise<any[]> => {
  const empleados = await prisma.empleado.findMany({
    include: {
      usuario: {
        include: { rol: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return empleados.map(mapToEmpleado)
}

// ─── OBTENER EMPLEADO POR ID ─────────────────────────────────────────────────
export const getEmpleadoById = async (id: number): Promise<any> => {
  const empleado = await prisma.empleado.findFirst({
    where: {
      usuario: {
        id,
        rol: { nombre: 'EMPLEADO' }
      }
    },
    include: {
      usuario: {
        include: { rol: true }
      }
    }
  })

  if (!empleado) throw new AppError('Empleado no encontrado', 404)

  return mapToEmpleado(empleado)
}

// ─── CREAR EMPLEADO ──────────────────────────────────────────────────────────
export const createEmpleado = async (data: EmpleadoCreateInput): Promise<any> => {
  const rolId = await getEmpleadoRolId()

  // Verificar si el email ya existe
  const existingUser = await prisma.usuario.findUnique({
    where: { email: data.email }
  })
  if (existingUser) throw new AppError('El email ya está registrado', 409)

  // Verificar si el documento ya existe
  const existingDoc = await prisma.empleado.findUnique({
    where: { numeroDocumento: data.numeroDocumento }
  })
  if (existingDoc) throw new AppError('El número de documento ya está registrado', 409)

  // Hash de la contraseña
  const hashedPassword = await bcrypt.hash(data.password, 10)

  // Crear usuario y empleado en una transacción
  const result = await prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.create({
      data: {
        nombre: data.nombre,
        email: data.email,
        password: hashedPassword,
        rolId
      },
      include: { rol: true }
    })

    const empleado = await tx.empleado.create({
      data: {
        usuarioId: usuario.id,
        tipoDocumento: data.tipoDocumento || 'CC',
        numeroDocumento: data.numeroDocumento,
        fechaNacimiento: new Date(data.fechaNacimiento),
        telefonoPrincipal: data.telefonoPrincipal,
        telefonoAlternativo: data.telefonoAlternativo,
        ciudad: data.ciudad || 'Medellín',
        barrio: data.barrio,
        direccion: data.direccion,
        zonaServicio: data.zonaServicio || 'URBANA',
        instrumentoPrincipal: data.instrumentoPrincipal,
        otrosInstrumentos: data.otrosInstrumentos,
        anosExperiencia: Number(data.anosExperiencia),
        foto: data.foto
      }
    })

    return { usuario, empleado }
  })

  // Obtener el empleado con el usuario incluido para el mapeo correcto
  const empleadoConUsuario = await prisma.empleado.findUnique({
    where: { id: result.empleado.id },
    include: {
      usuario: {
        include: { rol: true }
      }
    }
  })

  return mapToEmpleado(empleadoConUsuario)
}

// ─── ACTUALIZAR EMPLEADO ─────────────────────────────────────────────────────
export const updateEmpleado = async (id: number, data: EmpleadoUpdateInput): Promise<any> => {
  // Verificar que existe el empleado
  const existing = await prisma.empleado.findFirst({
    where: {
      usuario: {
        id,
        rol: { nombre: 'EMPLEADO' }
      }
    }
  })
  if (!existing) throw new AppError('Empleado no encontrado', 404)

  // Actualizar en transacción
  const result = await prisma.$transaction(async (tx) => {
    // Actualizar usuario si hay campos de usuario
    if (data.nombre || data.email || data.estado !== undefined) {
      await tx.usuario.update({
        where: { id },
        data: {
          ...(data.nombre && { nombre: data.nombre }),
          ...(data.email && { email: data.email }),
          ...(data.estado !== undefined && { estado: data.estado })
        }
      })
    }

    // Actualizar empleado
    const empleadoData: any = {}
    if (data.tipoDocumento) empleadoData.tipoDocumento = data.tipoDocumento
    if (data.numeroDocumento) empleadoData.numeroDocumento = data.numeroDocumento
    if (data.fechaNacimiento) empleadoData.fechaNacimiento = new Date(data.fechaNacimiento)
    if (data.telefonoPrincipal) empleadoData.telefonoPrincipal = data.telefonoPrincipal
    if (data.telefonoAlternativo !== undefined) empleadoData.telefonoAlternativo = data.telefonoAlternativo
    if (data.ciudad) empleadoData.ciudad = data.ciudad
    if (data.barrio) empleadoData.barrio = data.barrio
    if (data.direccion) empleadoData.direccion = data.direccion
    if (data.zonaServicio) empleadoData.zonaServicio = data.zonaServicio
    if (data.instrumentoPrincipal) empleadoData.instrumentoPrincipal = data.instrumentoPrincipal
    if (data.otrosInstrumentos !== undefined) empleadoData.otrosInstrumentos = data.otrosInstrumentos
    if (data.anosExperiencia !== undefined) empleadoData.anosExperiencia = data.anosExperiencia
    if (data.foto !== undefined) empleadoData.foto = data.foto

    if (Object.keys(empleadoData).length > 0) {
      await tx.empleado.update({
        where: { usuarioId: id },
        data: empleadoData
      })
    }

    // Obtener el empleado actualizado
    const empleado = await tx.empleado.findUnique({
      where: { usuarioId: id },
      include: {
        usuario: {
          include: { rol: true }
        }
      }
    })

    return empleado
  })

  return mapToEmpleado(result)
}

// ─── ELIMINAR EMPLEADO ───────────────────────────────────────────────────────
export const deleteEmpleado = async (id: number): Promise<void> => {
  // Verificar que existe
  const existing = await prisma.empleado.findFirst({
    where: {
      usuario: {
        id,
        rol: { nombre: 'EMPLEADO' }
      }
    }
  })
  if (!existing) throw new AppError('Empleado no encontrado', 404)

  // Eliminar en transacción (primero empleado, luego usuario por FK)
  await prisma.$transaction(async (tx) => {
    await tx.empleado.delete({
      where: { usuarioId: id }
    })
    await tx.usuario.delete({
      where: { id }
    })
  })
}