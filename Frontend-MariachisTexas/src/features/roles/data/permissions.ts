
import { ModuleName } from '@/types';
import { 
  Users, 
  Music, 
  Calendar, 
  DollarSign, 
  FileText, 
  CreditCard, 
  Bookmark, 
  Briefcase,
  Shield,
  ShieldCheck,
  Lock,
  BarChart3
} from 'lucide-react';

export interface ModuleDefinition {
  id: ModuleName;
  label: string;
  description: string;
  icon: any;
}

export const AVAILABLE_MODULES: ModuleDefinition[] = [
  // Administrativos
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    description: 'Vista general, estadísticas y KPIs.',
    icon: BarChart3
  },
  { 
    id: 'usuarios', 
    label: 'Usuarios', 
    description: 'Gestión de cuentas de acceso al sistema.',
    icon: Shield
  },
  { 
    id: 'roles', 
    label: 'Roles y Permisos', 
    description: 'Configuración de niveles de acceso.',
    icon: ShieldCheck
  },
  { 
    id: 'empleados', 
    label: 'Empleados', 
    description: 'Gestión de músicos y personal.',
    icon: Briefcase
  },
  { 
    id: 'clientes', 
    label: 'Clientes', 
    description: 'Base de datos de clientes.',
    icon: Users
  },
  
  // Operativos
  { 
    id: 'reservas', 
    label: 'Reservas', 
    description: 'Calendario de eventos y gestión de agenda.',
    icon: Bookmark
  },
  { 
    id: 'repertorio', 
    label: 'Repertorio', 
    description: 'Cancionero y gestión musical.',
    icon: Music
  },
  { 
    id: 'ensayos', 
    label: 'Ensayos', 
    description: 'Programación de prácticas.',
    icon: Calendar
  },
  { 
    id: 'bloqueos', 
    label: 'Bloqueos', 
    description: 'Restricciones de fechas en calendario.',
    icon: Lock
  },

  // Financieros
  { 
    id: 'ventas', 
    label: 'Ventas', 
    description: 'Registro de ingresos y caja.',
    icon: DollarSign
  },
  { 
    id: 'cotizaciones', 
    label: 'Cotizaciones', 
    description: 'Generación de propuestas comerciales.',
    icon: FileText
  },
  { 
    id: 'abonos', 
    label: 'Abonos', 
    description: 'Gestión de pagos parciales.',
    icon: CreditCard
  },
];
