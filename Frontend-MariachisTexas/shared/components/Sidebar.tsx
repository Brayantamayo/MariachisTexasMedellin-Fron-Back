import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../../types';
import { 
  BarChart3, UserCircle, Settings, Users, ShoppingCart, LogOut,
  Calendar, Briefcase, Music, FileText, CreditCard, Bookmark,
  ShieldCheck, LayoutGrid, Home, ChevronRight, ChevronLeft, Pin, PinOff
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isPanelOpen: boolean;
  setIsPanelOpen: (isOpen: boolean) => void;
}

type CategoryId = 'inicio' | 'configuracion' | 'usuario' | 'servicios' | 'venta';

interface MenuItem {
  label: string;
  path: string;
  icon: React.ElementType;
  subItems?: MenuItem[];
}

interface Category {
  id: CategoryId;
  label: string;
  icon: React.ElementType;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate, isPanelOpen, setIsPanelOpen }) => {
  const { user, logout } = useAuth();
  const [activeCategory, setActiveCategory] = useState<CategoryId>('inicio');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);

  const getCategories = (): Category[] => {
    if (!user) return [];

    const isAdmin    = user.role === UserRole.ADMIN;
    const isEmpleado = user.role === UserRole.EMPLEADO;
    const isCliente  = user.role === UserRole.CLIENTE;

    const categories: Category[] = [];

    // 1. INICIO
    const inicioItems: MenuItem[] = [];
    if (isAdmin) {
      inicioItems.push({ label: 'Dashboard', path: '/dashboard', icon: BarChart3 });
    } else {
      inicioItems.push({ label: 'Inicio', path: '/home', icon: Home });
    }
    inicioItems.push({ label: 'Mi Perfil', path: '/perfil', icon: UserCircle });
    categories.push({ id: 'inicio', label: 'Inicio', icon: Home, items: inicioItems });

    // 2. CONFIGURACIÓN (Admin only)
    if (isAdmin) {
      categories.push({
        id: 'configuracion', label: 'Configuración', icon: Settings,
        items: [{ label: 'Roles y Permisos', path: '/roles', icon: ShieldCheck }]
      });
    }

    // 3. USUARIO (Admin only)
    if (isAdmin) {
      categories.push({
        id: 'usuario', label: 'Usuario', icon: Users,
        items: [
          { label: 'Usuarios', path: '/usuarios', icon: ShieldCheck },
          { label: 'Empleados', path: '/empleados', icon: Briefcase }
        ]
      });
    }

    // 4. SERVICIOS
    const serviciosItems: MenuItem[] = [];
    serviciosItems.push({ label: 'Repertorio', path: '/repertorio', icon: Music });
    if (isAdmin || isEmpleado) serviciosItems.push({ label: 'Ensayos', path: '/ensayos', icon: Calendar });
    if (isAdmin) serviciosItems.push({ label: 'Servicios Extra', path: '/servicios', icon: Briefcase });
    if (serviciosItems.length > 0) {
      categories.push({ id: 'servicios', label: 'Servicios', icon: LayoutGrid, items: serviciosItems });
    }

    // 5. VENTA / RESERVA
    const ventaItems: MenuItem[] = [];
    if (isAdmin) {
      ventaItems.push({ label: 'Cotización', path: '/cotizaciones', icon: FileText });
      ventaItems.push({ label: 'Reservas', path: '/reservas', icon: Bookmark });
      ventaItems.push({
        label: 'Ventas', path: '/ventas_parent', icon: ShoppingCart,
        subItems: [
          { label: 'Ventas', path: '/ventas', icon: ShoppingCart },
          { label: 'Abonos', path: '/abonos', icon: CreditCard }
        ]
      });
      ventaItems.push({ label: 'Clientes', path: '/clientes', icon: Users });
    } else if (isCliente) {
      ventaItems.push({ label: 'Reservas', path: '/reservas', icon: Bookmark });
      ventaItems.push({ label: 'Abonos', path: '/abonos', icon: CreditCard });
    } else {
      // Empleado
      ventaItems.push({ label: 'Reservas', path: '/reservas', icon: Bookmark });
    }

    if (ventaItems.length > 0) {
      categories.push({
        id: 'venta',
        // ✅ Cliente ve "Reservas", los demás ven "Venta"
        label: isCliente ? 'Reservas' : 'Venta',
        icon: isCliente ? Bookmark : ShoppingCart,
        items: ventaItems
      });
    }

    return categories;
  };

  const categories = getCategories();

  useEffect(() => {
    const foundCategory = categories.find(cat =>
      cat.items.some(item =>
        item.path === currentPath ||
        item.subItems?.some(sub => sub.path === currentPath)
      )
    );
    if (foundCategory) setActiveCategory(foundCategory.id);
  }, [currentPath]);

  const activeCategoryData = categories.find(c => c.id === activeCategory);

  const toggleExpand = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  if (!user) return null;

  return (
    <div className="fixed left-0 top-0 h-screen flex z-50 shadow-2xl">

      {/* ─── RAIL ──────────────────────────────────────────────────────────────── */}
      <div className="w-24 bg-black flex flex-col items-center py-6 border-r border-white/5 z-20">

        {/* Logo */}
        <div className="mb-8 w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center shadow-lg shadow-primary-900/20 text-white font-bold font-serif text-xl">
          M
        </div>

        {/* Categories */}
        <div className="flex-1 w-full flex flex-col gap-4 px-2">
          {categories.map(category => {
            const isActive = activeCategory === category.id;
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => {
                  if (activeCategory === category.id && isPanelOpen) {
                    setIsPanelOpen(false);
                  } else {
                    setActiveCategory(category.id);
                    setIsPanelOpen(true);
                  }
                }}
                className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 group relative
                  ${isActive
                    ? (isPanelOpen ? 'bg-[#ce1126] text-white shadow-lg shadow-[#ce1126]/20 scale-105' : 'bg-white/10 text-white scale-95')
                    : 'text-zinc-500 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold tracking-wide">{category.label}</span>
              </button>
            );
          })}
        </div>

        {/* ✅ Cerrar sesión visible en el rail */}
        <div className="mt-1 px-5 w-full">
          <button
            onClick={logout}
            title="Cerrar Sesión"
            className="w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 text-zinc-600 hover:bg-red-900/30 hover:text-red-400 transition-all duration-300 group"
          >
            <LogOut size={22} strokeWidth={2} />
            <span className="text-[10px] font-bold tracking-wide">Salir</span>
          </button>
        </div>
      </div>

      {/* ─── PANEL SECUNDARIO ──────────────────────────────────────────────────── */}
      <div className={`h-screen bg-[#09090b] flex flex-col border-r border-white/5 z-10 relative transition-all duration-300 ease-in-out overflow-hidden ${isPanelOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'}`}>

        {/* Header del panel */}
        <div className="h-24 px-8 flex flex-col justify-center border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent relative min-w-[16rem]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight">{activeCategoryData?.label}</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsPinned(!isPinned)}
                className={`p-1.5 rounded-lg transition-all ${isPinned ? 'text-primary-500 bg-primary-500/10' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                title={isPinned ? 'Desanclar panel' : 'Fijar panel'}
              >
                {isPinned ? <Pin size={16} /> : <PinOff size={16} />}
              </button>
              <button
                onClick={() => setIsPanelOpen(false)}
                className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                title="Ocultar panel"
              >
                <ChevronLeft size={18} />
              </button>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-1 font-medium">
            {activeCategoryData?.items.length} módulos disponibles
          </p>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 min-w-[16rem]">
          {activeCategoryData?.items.map(item => {
            const isActive    = currentPath === item.path || item.subItems?.some(s => s.path === currentPath);
            const Icon        = item.icon;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded  = expandedItems.includes(item.label) || (isActive && hasSubItems);

            return (
              <div key={item.path} className="space-y-1">
                <button
                  onClick={() => {
                    if (hasSubItems) {
                      toggleExpand(item.label);
                    } else {
                      onNavigate(item.path);
                      if (!isPinned) setIsPanelOpen(false);
                    }
                  }}
                  className={`w-full flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden
                    ${isActive && !hasSubItems ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' : 'text-zinc-500 hover:bg-white/5 hover:text-white'}
                    ${isActive && hasSubItems ? 'text-white bg-white/5' : ''}
                  `}
                >
                  <Icon size={18} className={`mr-3 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                  <span className="font-medium text-sm tracking-wide flex-1 text-left">{item.label}</span>
                  {hasSubItems ? (
                    <ChevronRight size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                  ) : isActive && (
                    <ChevronRight size={14} className="opacity-50" />
                  )}
                </button>

                {hasSubItems && isExpanded && (
                  <div className="pl-11 space-y-1 animate-fade-in">
                    {item.subItems?.map(sub => {
                      const isSubActive = currentPath === sub.path;
                      const SubIcon = sub.icon;
                      return (
                        <button
                          key={sub.path}
                          onClick={() => { onNavigate(sub.path); if (!isPinned) setIsPanelOpen(false); }}
                          className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-all duration-300 group
                            ${isSubActive ? 'text-primary-500 font-bold' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}
                          `}
                        >
                          <SubIcon size={14} className="mr-3" />
                          <span className="text-xs tracking-wide">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* User Info Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20 min-w-[16rem]">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold border border-white/10 text-gray-300">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider truncate">{user.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};