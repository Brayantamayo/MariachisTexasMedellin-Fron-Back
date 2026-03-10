
import { AppRoute, UserRole } from './types';
import { 
  Users, 
  Music, 
  Calendar, 
  DollarSign, 
  FileText, 
  CreditCard, 
  Bookmark, 
  UserCircle,
  Briefcase,
  Shield,
  ShieldCheck
} from 'lucide-react';

// Configuración centralizada de rutas y permisos
// Aquí organizamos qué rol puede ver qué módulo
export const APP_ROUTES: AppRoute[] = [
  // Módulos Administrativos
  {
    path: '/usuarios',
    label: 'Usuarios',
    module: 'usuarios',
    roles: [UserRole.ADMIN],
    icon: 'Shield'
  },
  {
    path: '/roles',
    label: 'Roles y Permisos',
    module: 'roles',
    roles: [UserRole.ADMIN],
    icon: 'ShieldCheck'
  },
  {
    path: '/empleados',
    label: 'Empleados',
    module: 'empleados',
    roles: [UserRole.ADMIN],
    icon: 'Briefcase'
  },
  {
    path: '/clientes',
    label: 'Clientes',
    module: 'clientes',
    roles: [UserRole.ADMIN], // El cliente ve su perfil, pero el admin gestiona la lista
    icon: 'Users'
  },
  
  // Módulos Operativos (Admin + Empleado + Cliente en algunos casos)
  {
    path: '/repertorio',
    label: 'Repertorio',
    module: 'repertorio',
    roles: [UserRole.ADMIN, UserRole.EMPLEADO, UserRole.CLIENTE],
    icon: 'Music'
  },
  {
    path: '/ensayos',
    label: 'Ensayos',
    module: 'ensayos',
    roles: [UserRole.ADMIN, UserRole.EMPLEADO],
    icon: 'Calendar'
  },
  
  // Módulos Comerciales
  {
    path: '/reservas',
    label: 'Reservas',
    module: 'reservas',
    roles: [UserRole.ADMIN, UserRole.EMPLEADO, UserRole.CLIENTE],
    icon: 'Bookmark'
  },
  {
    path: '/ventas',
    label: 'Ventas',
    module: 'ventas',
    roles: [UserRole.ADMIN, UserRole.CLIENTE], // Cliente ve "Mis Compras"
    icon: 'DollarSign'
  },
  {
    path: '/cotizaciones',
    label: 'Cotización',
    module: 'cotizaciones',
    roles: [UserRole.ADMIN, UserRole.CLIENTE],
    icon: 'FileText'
  },
  {
    path: '/abonos',
    label: 'Abonos',
    module: 'abonos',
    roles: [UserRole.ADMIN], // Generalmente admin gestiona, cliente ve en Ventas
    icon: 'CreditCard'
  },
  
  // Perfil General
  {
    path: '/perfil',
    label: 'Mi Perfil',
    module: 'perfil',
    roles: [UserRole.ADMIN, UserRole.EMPLEADO, UserRole.CLIENTE],
    icon: 'UserCircle'
  }
];

export const getRoutesForRole = (role: UserRole): AppRoute[] => {
  return APP_ROUTES.filter(route => route.roles.includes(role));
};
