import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
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
      { nombre: 'mis_compras'    },
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

  const modulosCliente  = ['inicio', 'perfil', 'repertorio', 'cotizacion', 'reservas', 'mis_compras']

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
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())