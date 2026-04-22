import prisma from '../../config/prisma'
import { RolCreateSchema, RolUpdateSchema, zodError } from '../schemas'
import type { RolCreateInput, RolUpdateInput } from '../../types/interfaces'

const mapToRole = (r: any) => ({
  id: String(r.id),
  name: r.nombre,
  description: r.descripcion ?? '',
  permissions: r.rolPermisos?.map((rp: any) => rp.permiso.nombre) ?? [],
  isActive: r.estado,
  createdAt: r.createdAt?.toISOString() ?? ''
})

// ─── OBTENER ID DE ROL POR NOMBRE ────────────────────────────────────────────
export const getRolIdByName = async (nombre: string): Promise<number> => {
  const rol = await prisma.rol.findUnique({
    where: { nombre }
  })

  if (!rol) throw new Error(`Rol ${nombre} no encontrado`)

  return rol.id
}

// ─── OBTENER ROLES ───────────────────────────────────────────────────────────
export const getRoles = async (): Promise<any[]> => {
  const roles = await prisma.rol.findMany({
    include: {
      rolPermisos: {
        include: { permiso: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return roles.map(mapToRole)
}

// ─── OBTENER PERMISOS ────────────────────────────────────────────────────────
export const getPermisos = async () => {
  const permisos = await prisma.permiso.findMany({
    where: { estado: true },
    orderBy: { nombre: 'asc' }
  })

  return permisos.map(p => ({
    id: String(p.id),
    module: p.nombre,
    label: p.nombre.charAt(0).toUpperCase() + p.nombre.slice(1),
    description: `Permiso para el módulo ${p.nombre}`,
    isActive: p.estado
  }))
}

// ─── CREAR ROL ───────────────────────────────────────────────────────────────
export const createRol = async (data: RolCreateInput): Promise<any> => {
  const parsed = RolCreateSchema.safeParse(data)
  if (!parsed.success) throw new Error(zodError(parsed.error))

  const d = parsed.data

  // Verificar que no exista un rol con el mismo nombre
  const existing = await prisma.rol.findUnique({ where: { nombre: d.nombre } })
  if (existing) throw new Error('Ya existe un rol con este nombre')

  const rol = await prisma.rol.create({
    data: {
      nombre: d.nombre,
      descripcion: d.descripcion,
      estado: d.estado ?? true
    }
  })

  // Asignar permisos si se especifican
  if (d.permisos?.length) {
    const permisos = await prisma.permiso.findMany({
      where: { id: { in: d.permisos } }
    })

    if (permisos.length !== d.permisos.length) {
      throw new Error('Algunos permisos especificados no existen')
    }

    await prisma.rolPermiso.createMany({
      data: permisos.map(p => ({
        rolId: rol.id,
        permisoId: p.id
      }))
    })
  }

  return getRolById(rol.id)
}

// ─── OBTENER ROL POR ID ──────────────────────────────────────────────────────
export const getRolById = async (id: number): Promise<any> => {
  const rol = await prisma.rol.findUnique({
    where: { id },
    include: {
      rolPermisos: {
        include: { permiso: true }
      }
    }
  })

  if (!rol) throw new Error('Rol no encontrado')
  return mapToRole(rol)
}

// ─── ACTUALIZAR ROL ──────────────────────────────────────────────────────────
export const updateRol = async (id: number, data: RolUpdateInput): Promise<any> => {
  const rol = await prisma.rol.findUnique({ where: { id } })
  if (!rol) throw new Error('Rol no encontrado')

  const parsed = RolUpdateSchema.safeParse(data)
  if (!parsed.success) throw new Error(zodError(parsed.error))

  const d = parsed.data

  // Verificar nombre único si se está cambiando
  if (d.nombre && d.nombre !== rol.nombre) {
    const existing = await prisma.rol.findUnique({ where: { nombre: d.nombre } })
    if (existing) throw new Error('Ya existe un rol con este nombre')
  }

  await prisma.rol.update({
    where: { id },
    data: {
      nombre: d.nombre,
      descripcion: d.descripcion,
      estado: d.estado
    }
  })

  // Actualizar permisos si se especifican
  if (d.permisos !== undefined) {
    // Eliminar permisos actuales
    await prisma.rolPermiso.deleteMany({ where: { rolId: id } })

    // Agregar nuevos permisos
    if (d.permisos.length) {
      const permisos = await prisma.permiso.findMany({
        where: { id: { in: d.permisos } }
      })

      if (permisos.length !== d.permisos.length) {
        throw new Error('Algunos permisos especificados no existen')
      }

      await prisma.rolPermiso.createMany({
        data: permisos.map(p => ({
          rolId: id,
          permisoId: p.id
        }))
      })
    }
  }

  return getRolById(id)
}

// ─── ELIMINAR ROL ────────────────────────────────────────────────────────────
export const deleteRol = async (id: number) => {
  const rol = await prisma.rol.findUnique({
    where: { id },
    include: { usuarios: true }
  })

  if (!rol) throw new Error('Rol no encontrado')
  if (rol.usuarios.length > 0) throw new Error('No se puede eliminar un rol que tiene usuarios asignados')

  await prisma.rol.delete({ where: { id } })
  return { message: 'Rol eliminado correctamente' }
}