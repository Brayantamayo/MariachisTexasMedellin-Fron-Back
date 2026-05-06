import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs' 
import { PrismaClient } from '../src/generated/prisma'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {

  // ─── ROLES ──────────────────────────────────────────────
  const admin = await prisma.rol.upsert({
    where: { nombre: 'ADMIN' }, 
    update: {},
    create: { nombre: 'ADMIN', descripcion: 'Acceso total al sistema' }
  })

  const empleado = await prisma.rol.upsert({
    where: { nombre: 'EMPLEADO' },
    update: {},
    create: { nombre: 'EMPLEADO', descripcion: 'Gestión de repertorio y ensayos' }
  })

  const cliente = await prisma.rol.upsert({
    where: { nombre: 'CLIENTE' },
    update: {},
    create: { nombre: 'CLIENTE', descripcion: 'Portal del cliente' }
  })

  console.log('✅ Roles creados')

  // ─── PERMISOS (uno por módulo) ───────────────────────────
  await prisma.permiso.createMany({
    skipDuplicates: true,
    data: [
      { nombre: 'inicio'         },
      { nombre: 'perfil'         },
      { nombre: 'repertorio'     },
      { nombre: 'ensayos'        },
      { nombre: 'reservas'       },
      { nombre: 'cotizacion'     },
      { nombre: 'dashboard'      },
      { nombre: 'roles'          },
      { nombre: 'usuarios'       },
      { nombre: 'empleados'      },
      { nombre: 'clientes'       },
      { nombre: 'servicios_extra'},
      { nombre: 'abonos'         },
      { nombre: 'ventas'         },
    ]
  })

  console.log('✅ Permisos creados')

  const todosLosPermisos = await prisma.permiso.findMany()
  const getPermiso = (nombre: string) => todosLosPermisos.find(p => p.nombre === nombre)!

  // ─── MÓDULOS POR ROL ─────────────────────────────────────
  const modulosEmpleado = ['inicio', 'perfil', 'repertorio', 'ensayos', 'reservas']

  const modulosCliente = ['inicio', 'perfil', 'repertorio', 'reservas', 'abonos']

  const modulosAdmin    = todosLosPermisos.map(p => p.nombre)


  // ─── ASIGNAR ─────────────────────────────────────────────
  const asignar = async (rolId: number, modulos: string[]) => {
    for (const nombre of modulos) {
      const permiso = getPermiso(nombre)
      await prisma.rolPermiso.upsert({
        where: { rolId_permisoId: { rolId, permisoId: permiso.id } },
        update: {},
        create: { rolId, permisoId: permiso.id }
      })
    }
  }


//////// ASIGNAR PERMISOS A ROLS ////////////////////////////
  await asignar(admin.id,    modulosAdmin)
  await asignar(empleado.id, modulosEmpleado)
  await asignar(cliente.id,  modulosCliente)

  console.log('✅ RolPermisos asignados')


    // ─── USUARIOS ────────────────────────────────────────────
  // Admin: se elimina si existe y se recrea siempre para garantizar credenciales frescas
  await prisma.usuario.deleteMany({ where: { email: 'admin@mariachistexas.com' } })
  await prisma.usuario.create({
    data: {
      nombre:   'Administrador',
      email:    'admin@mariachistexas.com',
      password: await bcrypt.hash('Admin-123456', 10),
      rolId:    admin.id
    }
  })

  await prisma.usuario.upsert({
    where: { email: 'empleado@mariachistexas.com' },
    update: {},
    create: {
      nombre:   'Empleado',
      email:    'empleado@mariachistexas.com',
      password: await bcrypt.hash('Empleado-123456', 10),
      rolId:    empleado.id
    }
  })

  // ─── EMPLEADOS DE PRUEBA ───────────────────────────────────
  const carlosUser = await prisma.usuario.upsert({
    where: { email: 'carlos@mariachistexas.com' },
    update: {},
    create: {
      nombre:   'Carlos Guitarra',
      email:    'carlos@mariachistexas.com',
      password: await bcrypt.hash('Empleado-123456', 10),
      rolId:    empleado.id
    }
  })

  const pedroUser = await prisma.usuario.upsert({
    where: { email: 'pedro@mariachistexas.com' },
    update: {},
    create: {
      nombre:   'Pedro Trompeta',
      email:    'pedro@mariachistexas.com',
      password: await bcrypt.hash('Empleado-123456', 10),
      rolId:    empleado.id
    }
  })

  // Crear registros de empleado
  await prisma.empleado.upsert({
    where: { usuarioId: carlosUser.id },
    update: {},
    create: {
      usuarioId: carlosUser.id,
      tipoDocumento: 'CC',
      numeroDocumento: '123456789',
      fechaNacimiento: new Date('1985-05-15'),
      telefonoPrincipal: '3001234567',
      telefonoAlternativo: '3019876543',
      ciudad: 'Medellín',
      barrio: 'Laureles',
      direccion: 'Calle 10 # 20-30',
      zonaServicio: 'URBANA',
      instrumentoPrincipal: 'Guitarra',
      otrosInstrumentos: 'Violín, Piano',
      anosExperiencia: 15,
      foto: null
    }
  })

  await prisma.empleado.upsert({
    where: { usuarioId: pedroUser.id },
    update: {},
    create: {
      usuarioId: pedroUser.id,
      tipoDocumento: 'CC',
      numeroDocumento: '987654321',
      fechaNacimiento: new Date('1980-03-22'),
      telefonoPrincipal: '3107654321',
      telefonoAlternativo: null,
      ciudad: 'Medellín',
      barrio: 'Poblado',
      direccion: 'Carrera 15 # 45-67',
      zonaServicio: 'URBANA',
      instrumentoPrincipal: 'Trompeta',
      otrosInstrumentos: 'Saxofón',
      anosExperiencia: 20,
      foto: null
    }
  })

  console.log('✅ Usuarios y empleados creados')

  // ─── USUARIO PARA CLIENTE DIRECTA ─────────────────────────
  const directaUser = await prisma.usuario.upsert({
    where: { email: 'directa@mariachistexas.com' },
    update: {},
    create: {
      nombre:   'Cliente Directa',
      email:    'directa@mariachistexas.com',
      password: await bcrypt.hash('Directa-123456', 10),
      rolId:    cliente.id
    }
  })

  // ─── CLIENTE PARA VENTAS DIRECTAS ────────────────────────
  await prisma.cliente.upsert({
    where: { usuarioId: directaUser.id },
    update: {},
    create: {
      usuarioId:           directaUser.id,
      email:               'directa@mariachistexas.com',
      apellido:            'Directa',
      tipoDocumento:       'CC',
      numeroDocumento:     '000000000',
      fechaNacimiento:     new Date('2000-01-01'),
      telefonoPrincipal:   '3000000000',
      telefonoAlternativo: null,
      ciudad:              'Medellín',
      barrio:              'Centro',
      direccion:           'Venta Directa',
      zonaServicio:        'URBANA',
      activo:              true
    } as any
  })

  // ─── CLIENTE DE PRUEBA ────────────────────────────────────
  const clientePruebaUser = await prisma.usuario.upsert({
    where: { email: 'cliente@mariachistexas.com' },
    update: {},
    create: {
      nombre:   'Cliente Prueba',
      email:    'cliente@mariachistexas.com',
      password: await bcrypt.hash('Cliente-123456', 10),
      rolId:    cliente.id
    }
  })

  await prisma.cliente.upsert({
    where: { usuarioId: clientePruebaUser.id },
    update: {},
    create: {
      email:               'cliente@mariachistexas.com',
      apellido:            'Prueba',
      tipoDocumento:       'CC',
      numeroDocumento:     '111111111',
      fechaNacimiento:     new Date('1990-01-01'),
      telefonoPrincipal:   '3111111111',
      telefonoAlternativo: null,
      ciudad:              'Medellín',
      barrio:              'Poblado',
      direccion:           'Calle 123',
      zonaServicio:        'URBANA',
      activo:              true
    } as any
  })

  console.log('✅ Cliente para ventas directas creado')

}




main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())