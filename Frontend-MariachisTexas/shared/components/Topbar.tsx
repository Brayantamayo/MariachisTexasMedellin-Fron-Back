import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { notificationService, SystemNotification } from '@/src/features/notificaciones/services/notificationService';
import { Bell, Mail, Download, LogOut, ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const Topbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const bellRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const isImmersivePage = location.pathname === '/perfil' || location.pathname === '/home';

  // Cargar notificaciones y IDs leídos
  const fetchNotifications = async () => {
    if (!user || user.role === 'CLIENTE') return;
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Error al cargar notificaciones:', err);
    }
  };

  useEffect(() => {
    // Cargar IDs leídos desde localStorage
    const saved = localStorage.getItem('read_notifications');
    if (saved) {
      try {
        setReadIds(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }

    if (!isImmersivePage) {
      fetchNotifications();
    }

    // Consultar cada 30 segundos
    const interval = setInterval(() => {
      if (!isImmersivePage) {
        fetchNotifications();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsBellOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!user || isImmersivePage) return null;

  // Filtrar las leídas
  const unreadNotifications = notifications.filter(n => !readIds.includes(n.id));
  const unreadCount = unreadNotifications.length;

  const handleMarkAllRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadIds(allIds);
    localStorage.setItem('read_notifications', JSON.stringify(allIds));
    toast.success('Notificaciones marcadas como leídas');
  };

  const handleNotificationClick = (n: SystemNotification) => {
    // Marcar como leída
    if (!readIds.includes(n.id)) {
      const updated = [...readIds, n.id];
      setReadIds(updated);
      localStorage.setItem('read_notifications', JSON.stringify(updated));
    }
    setIsBellOpen(false);
    navigate(n.enlace);
  };

  // Obtener iniciales para el avatar
  const getInitials = () => {
    const first = user.name?.charAt(0) || 'N';
    const last = user.lastName?.charAt(0) || 'C';
    return `${first}${last}`.toUpperCase();
  };

  return (
    <header className="w-full h-20 flex items-center justify-end px-6 bg-white/70 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40">
      
      {/* ─── BUSCADOR (Izquierda) ─── */}
      {/* ─── ACCIONES (Derecha) ─── */}
      <div className="flex items-center gap-5">
        
        {/* Campana de Notificaciones */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => { setIsBellOpen(!isBellOpen); setIsProfileOpen(false); }}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center border transition-all relative ${
              isBellOpen ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Bell size={20} className={unreadCount > 0 ? 'animate-[bounce_1.5s_infinite]' : ''} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-red-500/20 border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown de Notificaciones */}
          {isBellOpen && (
            <div className="absolute right-0 mt-3 w-96 max-w-[calc(100vw-2rem)] bg-white border border-slate-200/80 rounded-3xl shadow-2xl shadow-slate-900/15 overflow-hidden animate-[fadeInUp_0.3s_cubic-bezier(0.16,1,0.3,1)]">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h4 className="text-sm font-black text-slate-800 tracking-wide uppercase">Notificaciones</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Tenes {unreadCount} novedades hoy</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-black text-red-600 hover:text-red-700 tracking-wider uppercase flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={12} /> Marcar como leídas
                  </button>
                )}
              </div>

              <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="px-6 py-10 text-center">
                    <Bell size={32} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-400">No hay notificaciones recientes</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isUnread = !readIds.includes(n.id);
                    const tagStyles = {
                      RESERVA: 'bg-red-50 text-red-600 border-red-100',
                      COTIZACION: 'bg-amber-50 text-amber-600 border-amber-100',
                      ABONO: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                    }[n.tipo];

                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors flex gap-4 items-start ${
                          isUnread ? 'bg-red-50/10' : ''
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 text-xs font-black ${tagStyles}`}>
                          {n.tipo.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className={`text-xs truncate ${isUnread ? 'font-black text-slate-800' : 'font-bold text-slate-600'}`}>
                              {n.titulo}
                            </h5>
                            {isUnread && (
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-normal mt-1 pr-2 line-clamp-2">
                            {n.descripcion}
                          </p>
                          <span className="text-[9px] text-slate-400 mt-2 block font-medium">
                            {new Date(n.fecha).toLocaleDateString('es-CO', {
                              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar de Usuario */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => { setIsProfileOpen(!isProfileOpen); setIsBellOpen(false); }}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold tracking-wider shadow-lg border transition-all ${
              isProfileOpen ? 'bg-red-500 border-red-500 text-white scale-105 shadow-red-500/20' : 'bg-red-100 text-red-600 border-red-200 hover:bg-red-200/50 hover:scale-105'
            }`}
          >
            {getInitials()}
          </button>

          {/* Tarjeta Flotante del Perfil (Diseño Idéntico a la Foto) */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200/80 rounded-3xl shadow-2xl shadow-slate-900/15 overflow-hidden p-6 animate-[fadeInUp_0.3s_cubic-bezier(0.16,1,0.3,1)]">
              {/* Rol en Gris Mayúsculas */}
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">
                {user.role === 'ADMIN' ? 'ADMINISTRADOR' : user.role === 'EMPLEADO' ? 'EMPLEADO' : 'CLIENTE'}
              </span>

              {/* Email con Icono de sobre */}
              <div className="flex items-center gap-2.5 text-sm font-black text-red-600 py-1 mb-5 truncate">
                <Mail size={16} className="text-red-500 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-100 my-4" />

              {/* Acciones */}
              <div className="space-y-2">
                
                {/* Botón Descargar APK (Solo Administrador) */}
                {user.role === 'ADMIN' && (
                  <a
                    href="https://drive.google.com/drive/folders/1r84YukibOp-YqAZFx-a1M326JxBaaVWT?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-12 px-4 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-black text-xs tracking-widest uppercase flex items-center justify-between shadow-lg shadow-red-500/15 hover:shadow-red-500/25 hover:from-red-400 hover:to-rose-500 hover:-translate-y-0.5 transition-all duration-300 group"
                  >
                    <span className="flex items-center gap-2">
                      <Download size={15} className="group-hover:-translate-y-0.5 transition-transform" />
                      Descargar APK
                    </span>
                    <ArrowRight size={14} className="opacity-60 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                )}

                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 font-bold text-xs tracking-widest uppercase flex items-center gap-2 justify-center transition-all duration-300"
                >
                  <LogOut size={14} />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
export default Topbar;
