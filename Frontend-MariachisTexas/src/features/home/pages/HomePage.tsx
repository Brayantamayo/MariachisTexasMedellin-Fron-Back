import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/shared/contexts/AuthContext';
import { Reservation, Rehearsal, UserRole } from '@/types';
import { reservaService } from '../../reservas/services/reservaService';
import { rehearsalService } from '../../ensayos/services/rehearsalService';
import { 
  Calendar, Clock, Music, MapPin, Sparkles, Star, Phone,
  CheckCircle, X, Mic2, ListMusic, User, ChevronRight
} from 'lucide-react';

// ✅ Recibe onNavigate para poder redirigir desde los botones
interface HomePageProps {
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);
  
  const [clientEvents, setClientEvents] = useState<Reservation[]>([]);
  const [nextGig, setNextGig] = useState<Reservation | null>(null);
  const [nextRehearsal, setNextRehearsal] = useState<Rehearsal | null>(null);
  const [stats, setStats] = useState({ gigsCount: 0, rehearsalCount: 0 });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (user?.role === UserRole.EMPLEADO) {
          const [allReservations, allRehearsals] = await Promise.all([
            reservaService.getReservations(),
            rehearsalService.getRehearsals()
          ]);
          const now = new Date();
          const upcomingGigs = allReservations
            .filter(r => r.status === 'Confirmado' && new Date(`${r.eventDate}T${r.eventTime}`) >= now)
            .sort((a, b) => new Date(`${a.eventDate}T${a.eventTime}`).getTime() - new Date(`${b.eventDate}T${b.eventTime}`).getTime());
          setNextGig(upcomingGigs[0] ?? null);
          const upcomingRehearsals = allRehearsals
            .filter(r => r.status === 'Programado' && new Date(`${r.date}T${r.time}`) >= now)
            .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
          setNextRehearsal(upcomingRehearsals[0] ?? null);
          setStats({ gigsCount: upcomingGigs.length, rehearsalCount: upcomingRehearsals.length });
        } else {
          const reservations = await reservaService.getReservations();
          let relevantEvents: Reservation[] = [];
          if (user) {
            relevantEvents = reservations.filter(r => {
              const userEmail = user.email.toLowerCase();
              const userName = user.name.toLowerCase();
              const clientEmail = r.clientEmail?.toLowerCase() || '';
              const clientName = r.clientName?.toLowerCase() || '';
              
              const emailMatch = clientEmail === userEmail;
              const idMatch = r.clientId === user.id;
              const nameMatch = clientName.includes(userName) || userName.includes(clientName.split(' ')[0]);
              
              return emailMatch || idMatch || nameMatch;
            });
          }
          relevantEvents.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
          setClientEvents(relevantEvents.slice(0, 5));
        }
      } catch (error) {
        console.error('Error loading home data', error);
      } finally {
        setLoading(false);
        setTimeout(() => setShowWelcomeToast(true), 500);
        setTimeout(() => setShowWelcomeToast(false), 5000);
      }
    };
    loadData();
  }, [user]);

  const WelcomeToast = () => createPortal(
    <div className={`fixed top-6 right-6 z-[200] transition-all duration-500 transform ${showWelcomeToast ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
      <div className="flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border border-emerald-100 bg-white/95 backdrop-blur-md min-w-[320px]">
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600">
          <CheckCircle size={20} strokeWidth={3} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-sm text-emerald-950">¡Hola de nuevo, {user?.name}!</h4>
          <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
            {user?.role === UserRole.EMPLEADO ? 'Tu agenda está lista.' : 'Bienvenido a Mariachis Texas.'}
          </p>
        </div>
        <button onClick={() => setShowWelcomeToast(false)} className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg">
          <X size={18} />
        </button>
      </div>
    </div>,
    document.body
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
      .format(new Date(dateStr + 'T00:00:00'));
  };

  const getMonthDay = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return { day: date.getDate(), month: date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase() };
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-400 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
        <p className="animate-pulse">Cargando tu experiencia...</p>
      </div>
    );
  }

  // ─── VISTA EMPLEADO ───────────────────────────────────────────────────────────
  if (user?.role === UserRole.EMPLEADO) {
    return (
      <div className="space-y-6 animate-fade-in-up pb-10">
        <WelcomeToast />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
          <div>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Panel de Músico</h2>
            <h1 className="text-3xl font-serif font-bold text-slate-800">Hola, {user.name.split(' ')[0]}</h1>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-3xl font-bold text-primary-600 font-serif">{new Date().getDate()}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-primary-100 transition-all">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toques Pendientes</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.gigsCount}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Star size={20} className="fill-primary-600" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-100 transition-all">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ensayos</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.rehearsalCount}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Music size={20} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sparkles size={14} className="text-primary-500" /> Tu Próximo Show
            </h3>
            {nextGig ? (
              <div className="relative bg-[#0f172a] rounded-[2rem] p-8 text-white overflow-hidden shadow-2xl shadow-slate-900/20 group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/20 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 rounded-full blur-[60px] -ml-10 -mb-10 pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className="bg-white/10 backdrop-blur-md border border-amber-500/15 px-4 py-2 rounded-xl text-center min-w-[70px]">
                      <p className="text-[10px] font-bold uppercase text-white/60">{getMonthDay(nextGig.eventDate).month}</p>
                      <p className="text-2xl font-bold font-serif leading-none mt-0.5">{getMonthDay(nextGig.eventDate).day}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Confirmado</span>
                  </div>
                  <div className="mb-8">
                    <h2 className="text-3xl md:text-4xl font-serif font-bold mb-2 leading-tight">{nextGig.eventType}</h2>
                    <div className="flex items-center gap-2 text-slate-400 text-sm"><User size={14} /><span>Cliente: {nextGig.clientName}</span></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <div className="bg-white/5 border border-amber-500/15 p-3 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-400"><Clock size={16} /></div>
                      <div><p className="text-[10px] text-slate-400 uppercase font-bold">Hora Inicio</p><p className="font-bold text-sm">{nextGig.eventTime}</p></div>
                    </div>
                    <div className="bg-white/5 border border-amber-500/15 p-3 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400"><MapPin size={16} /></div>
                      <div className="overflow-hidden"><p className="text-[10px] text-slate-400 uppercase font-bold">Ubicación</p><p className="font-bold text-sm truncate">{nextGig.location}</p></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-amber-500/15 pt-6">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Music size={16} className="text-primary-500" />
                      <span className="font-bold">{nextGig.repertoireIds?.length ?? 0} Canciones</span>
                    </div>
                    <button
                      onClick={() => onNavigate('/reservas')}
                      className="bg-white text-slate-900 hover:bg-slate-200 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
                      Detalles <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-dashed border-slate-300 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center h-[300px]">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300"><Calendar size={32} /></div>
                <h3 className="text-slate-800 font-bold text-lg">Sin eventos próximos</h3>
                <p className="text-slate-500 text-sm mt-2 max-w-xs">Tu agenda está libre por ahora.</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Mic2 size={14} className="text-blue-500" /> Ensayo
              </h3>
              {nextRehearsal ? (
                <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                  <div className="relative z-10">
                    <p className="text-xs font-bold text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded-md mb-3">{formatDate(nextRehearsal.date)}</p>
                    <h4 className="font-serif font-bold text-slate-800 text-lg mb-1">{nextRehearsal.title}</h4>
                    <p className="text-sm text-slate-500 mb-4">{nextRehearsal.location}</p>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-slate-50 p-3 rounded-xl">
                      <Clock size={14} className="text-blue-500" />{nextRehearsal.time}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-[1.5rem] border border-slate-200 p-6 text-center">
                  <p className="text-sm text-slate-400 italic">No hay ensayos programados.</p>
                </div>
              )}
            </div>

            {/* ✅ Accesos rápidos con navegación */}
            <div className="bg-white rounded-[1.5rem] border border-slate-200 p-5 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Accesos Rápidos</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onNavigate('/repertorio')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-primary-50 hover:text-primary-700 transition-colors gap-2 group">
                  <ListMusic size={20} className="text-slate-400 group-hover:text-primary-600" />
                  <span className="text-[10px] font-bold uppercase">Repertorio</span>
                </button>
                <button
                  onClick={() => onNavigate('/reservas')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-primary-50 hover:text-primary-700 transition-colors gap-2 group">
                  <Calendar size={20} className="text-slate-400 group-hover:text-primary-600" />
                  <span className="text-[10px] font-bold uppercase">Calendario</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── VISTA CLIENTE ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050608] text-white selection:bg-amber-500/30">

      {/* ── Ambient Effects ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-5%] right-[-5%] w-[45%] h-[45%] bg-amber-600/5 rounded-full blur-[130px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/5 rounded-full blur-[150px]" />
          <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      </div>

      <WelcomeToast />

      {/* ── HERO SECTION ── */}
      <div className="relative h-[480px] w-full overflow-hidden border-b border-amber-500/10">
        <div className="absolute inset-0">
          <img 
            src="/shared/assets/images/home-hero.png" 
            alt="Hero Background" 
            className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-[5s] opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-[#050608]/40 to-[#050608]/20" />
        </div>
        
        <div className="relative max-w-7xl mx-auto h-full px-6 flex flex-col justify-center items-center text-center">
          <div className="animate-fade-in-up">
            <div className="flex justify-center mb-6">
              <div className="px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-md">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Mariachis Texas • Medellín</span>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white mb-6 drop-shadow-2xl">
              HOLA, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">{user?.name.split(' ')[0].toUpperCase()}</span>
            </h1>
            
            <p className="text-slate-300 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-10 leading-relaxed italic opacity-80">
              &ldquo;La música es el lenguaje del alma.&rdquo;
              <br />
              <span className="text-sm font-bold text-slate-500 not-italic uppercase tracking-[0.2em] mt-2 block">¿Qué celebraremos juntos esta vez?</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <button
                onClick={() => onNavigate('/reservas')}
                className="group relative px-10 py-5 rounded-2xl bg-red-600 text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 hover:scale-105 hover:bg-red-500 shadow-[0_15px_30px_rgba(220,38,38,0.2)]"
              >
                <div className="absolute inset-0 rounded-2xl bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                <span className="flex items-center gap-3">
                  <Star size={16} strokeWidth={3} className="fill-white" />
                  Agendar Evento
                </span>
              </button>
              
              <button
                onClick={() => onNavigate('/repertorio')}
                className="px-10 py-5 rounded-2xl bg-white/5 border border-amber-500/15 backdrop-blur-xl text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 hover:bg-white/10 hover:border-white/20"
              >
                <span className="flex items-center gap-3">
                  <ListMusic size={16} strokeWidth={3} />
                  Ver Repertorio
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-16 -mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">

          {/* ══ RESERVATIONS AREA ══ */}
          <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <Calendar size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight italic">Mis Reservas</h3>
                  <p className="text-xs text-slate-500 font-medium">Gestiona tus próximos eventos y cotizaciones.</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('/reservas')}
                className="text-[10px] font-black text-slate-500 hover:text-amber-500 uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                Historial completo <ChevronRight size={14} />
              </button>
            </div>

            {clientEvents.length === 0 ? (
              <div className="group relative bg-slate-900/40 border border-amber-500/10 rounded-[3rem] p-16 text-center backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:border-amber-500/20">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/5 rounded-full blur-[60px] pointer-events-none" />
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-slate-900/80 border border-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                    <Calendar size={40} className="text-slate-600 group-hover:text-amber-500 transition-colors" strokeWidth={1.5} />
                  </div>
                  <h4 className="text-2xl font-black text-white italic mb-4">Aún no tienes reservas activas</h4>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed mb-10">
                    Dale un toque especial a tu próxima celebración con el mejor Mariachi de Medellín.
                  </p>
                  <button
                    onClick={() => onNavigate('/reservas')}
                    className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl shadow-amber-900/20"
                  >
                    Cotizar ahora
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {clientEvents.map((event, idx) => (
                  <div 
                    key={event.id} 
                    className="group relative bg-slate-900/40 border border-amber-500/10 rounded-3xl p-6 md:p-8 backdrop-blur-2xl shadow-2xl hover:bg-slate-900/60 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-8 animate-fade-in-up"
                    style={{ animationDelay: `${300 + (idx * 100)}ms` }}
                  >
                    <div className="flex items-center gap-8">
                      {/* Date Indicator */}
                      <div className="flex-shrink-0 w-20 h-20 rounded-3xl bg-slate-900/80 border border-amber-500/10 flex flex-col items-center justify-center text-center shadow-xl group-hover:border-amber-500/30 transition-colors">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{getMonthDay(event.eventDate).month}</span>
                        <span className="text-3xl font-black text-white tracking-tighter">{getMonthDay(event.eventDate).day}</span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-2xl font-black text-white italic tracking-tight group-hover:text-amber-400 transition-colors truncate">{event.eventType}</h4>
                          <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-amber-500/15 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            ID: {event.id.slice(-4)}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-slate-400">
                          <div className="flex items-center gap-2 group/info">
                            <Clock size={14} className="text-amber-500/60 group-hover/info:text-amber-500 transition-colors" />
                            <span className="text-xs font-bold">{event.eventTime}</span>
                          </div>
                          <div className="flex items-center gap-2 group/info">
                            <MapPin size={14} className="text-red-500/60 group-hover/info:text-red-500 transition-colors" />
                            <span className="text-xs font-bold truncate max-w-[180px]">{event.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:flex-col md:items-end gap-4 border-t md:border-t-0 border-amber-500/10 pt-6 md:pt-0">
                      <div className="flex flex-col items-end">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg
                          ${event.status === 'Confirmado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                            event.status === 'Pendiente' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                            'bg-slate-800 text-slate-400 border border-amber-500/10'}`}>
                          {event.status}
                        </span>
                        {event.paidAmount < event.totalAmount && (
                          <p className="text-[10px] text-red-500 font-bold mt-2 animate-pulse">
                            Saldo: ${(event.totalAmount - event.paidAmount).toLocaleString('es-CO')}
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={() => onNavigate('/reservas')}
                        className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 hover:bg-amber-500 hover:text-white transition-all shadow-xl group/btn"
                      >
                        <ChevronRight size={20} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ══ SIDEBAR AREA ══ */}
          <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            
            {/* Help / Concierge Card */}
            <div className="relative overflow-hidden bg-slate-900/40 border border-amber-500/10 rounded-[3rem] p-10 backdrop-blur-2xl shadow-2xl group cursor-default">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[50px] -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-all duration-700" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-8 shadow-xl">
                  <Phone size={28} strokeWidth={2} />
                </div>
                
                <h3 className="text-2xl font-black text-white italic mb-4">¿Necesitas Ayuda?</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-10">
                  Nuestro equipo de atención está disponible para cualquier duda con tu reserva o pagos.
                </p>

                <div className="space-y-3">
                  <a href="https://wa.me/573122373486" target="_blank" rel="noreferrer" className="flex items-center gap-4 p-5 rounded-2xl bg-slate-900/60 border border-amber-500/10 hover:bg-slate-900 hover:border-emerald-500/30 transition-all group/item">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover/item:scale-110 transition-transform">
                      <Phone size={18} strokeWidth={3} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">WhatsApp Directo</p>
                      <p className="text-sm font-black text-white">312 237 3486</p>
                    </div>
                  </a>

                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-slate-900/60 border border-amber-500/10 opacity-80">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Horario Atención</p>
                      <p className="text-sm font-black text-white">8:00 AM - 8:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-slate-900/40 border border-amber-500/10 rounded-[2.5rem] p-8 backdrop-blur-2xl shadow-2xl">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-6">Accesos Rápidos</h4>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => onNavigate('/repertorio')}
                  className="group flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-900/60 border border-amber-500/10 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all gap-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-amber-500 transition-colors">
                    <ListMusic size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">Repertorio</span>
                </button>
                
                <button
                  onClick={() => onNavigate('/reservas')}
                  className="group flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-900/60 border border-amber-500/10 hover:bg-red-500/10 hover:border-red-500/30 transition-all gap-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-red-500 transition-colors">
                    <Calendar size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">Calendario</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};