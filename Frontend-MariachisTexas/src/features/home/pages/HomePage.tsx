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
            relevantEvents = reservations.filter(r =>
              (r.clientId === user.id || r.clientName.includes(user.name)) &&
              (r.status === 'Confirmado' || r.status === 'Pendiente')
            );
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
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-center min-w-[70px]">
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
                    <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-400"><Clock size={16} /></div>
                      <div><p className="text-[10px] text-slate-400 uppercase font-bold">Hora Inicio</p><p className="font-bold text-sm">{nextGig.eventTime}</p></div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400"><MapPin size={16} /></div>
                      <div className="overflow-hidden"><p className="text-[10px] text-slate-400 uppercase font-bold">Ubicación</p><p className="font-bold text-sm truncate">{nextGig.location}</p></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 pt-6">
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
    <div className="space-y-10 animate-fade-in-up pb-12">
      <WelcomeToast />

      <div className="relative rounded-[2rem] overflow-hidden shadow-2xl min-h-[400px] flex items-center justify-center group">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1514525253440-b393452e8d26?q=80&w=2874&auto=format&fit=crop"
            alt="" className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-[3000ms]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/80 to-black/40"></div>
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-12 py-12">
          {clientEvents.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 text-left">
                <h1 className="text-4xl md:text-6xl font-serif font-bold text-white leading-tight">
                  Hola, <span className="text-[#f1bf00]">{user?.name.split(' ')[0]}</span>
                </h1>
                <p className="text-slate-300 text-lg font-light max-w-md">
                  Tu próximo evento se acerca. Estamos preparando todo para que sea inolvidable.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  {/* ✅ Redirige a reservas (calendario) */}
                  <button
                    onClick={() => onNavigate('/reservas')}
                    className="bg-[#ce1126] hover:bg-[#b91c1c] text-white px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest transition-all shadow-lg hover:shadow-red-900/40 hover:-translate-y-1 flex items-center gap-2">
                    <Star size={18} className="fill-white" /> Nuevo Evento
                  </button>
                  {/* ✅ Redirige a repertorio */}
                  <button
                    onClick={() => onNavigate('/repertorio')}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-3.5 rounded-full font-bold text-sm uppercase tracking-widest transition-all backdrop-blur-sm">
                    Ver Repertorio
                  </button>
                </div>
              </div>

              <div className="relative transform hover:scale-[1.02] transition-transform duration-500">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#f1bf00]/20 rounded-full blur-[50px] -mr-10 -mt-10"></div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-xs font-bold text-[#f1bf00] uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Calendar size={14} /> Próximo Evento
                      </p>
                      <h3 className="text-2xl font-serif font-bold leading-tight">{clientEvents[0].eventType}</h3>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-center min-w-[70px]">
                      <p className="text-[10px] font-bold uppercase text-white/70">{getMonthDay(clientEvents[0].eventDate).month}</p>
                      <p className="text-2xl font-bold font-serif text-white">{getMonthDay(clientEvents[0].eventDate).day}</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-slate-200">
                    <p className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                      <Clock size={16} className="text-[#f1bf00]" /><span className="font-medium">{clientEvents[0].eventTime}</span>
                    </p>
                    <p className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                      <MapPin size={16} className="text-[#ce1126]" /><span className="truncate font-medium">{clientEvents[0].location}</span>
                    </p>
                  </div>
                  <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle size={14} /> Confirmado
                    </span>
                    <button
                      onClick={() => onNavigate('/reservas')}
                      className="text-sm font-bold text-white hover:underline">
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-8">
              <div className="space-y-4 pt-8">
                <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-none tracking-tight">
                  Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f1bf00] to-[#fcd34d]">{user?.name.split(' ')[0]}</span>
                </h1>
                <p className="text-slate-300 text-xl font-light leading-relaxed">
                  "La música es el lenguaje del alma."<br />
                  <span className="text-base text-slate-400">¿Qué celebraremos juntos esta vez?</span>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-4">
                {/* ✅ Redirige a reservas */}
                <button
                  onClick={() => onNavigate('/reservas')}
                  className="bg-[#ce1126] hover:bg-[#b91c1c] text-white px-10 py-4 rounded-full font-bold text-sm uppercase tracking-widest transition-all shadow-xl shadow-red-900/30 hover:-translate-y-1 hover:shadow-2xl flex items-center justify-center gap-3 min-w-[200px]">
                  <Star size={18} className="fill-white" /> Agendar Evento
                </button>
                {/* ✅ Redirige a repertorio */}
                <button
                  onClick={() => onNavigate('/repertorio')}
                  className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-10 py-4 rounded-full font-bold text-sm uppercase tracking-widest transition-all backdrop-blur-sm flex items-center justify-center gap-3 min-w-[200px]">
                  <ListMusic size={18} /> Ver Repertorio
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-xl flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-[#ce1126]/10 flex items-center justify-center text-[#ce1126]"><Calendar size={18} /></span>
              Mis Reservas
            </h3>
            <button
              onClick={() => onNavigate('/reservas')}
              className="text-xs font-bold text-slate-400 hover:text-[#ce1126] uppercase tracking-wider transition-colors">
              Ver Historial
            </button>
          </div>

          {clientEvents.length === 0 ? (
            <div className="bg-white p-16 rounded-[2.5rem] border border-dashed border-slate-300 text-center text-slate-400 flex flex-col items-center justify-center group hover:border-[#ce1126]/30 transition-colors">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                <Calendar size={40} className="text-slate-300 group-hover:text-[#ce1126] transition-colors" />
              </div>
              <h4 className="text-lg font-bold text-slate-700 mb-2">No tienes reservas activas</h4>
              <p className="text-sm max-w-xs mx-auto">Comienza a planear tu próximo evento con nosotros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {clientEvents.map((event) => (
                <div key={event.id} className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 group relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#ce1126] to-[#f1bf00] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center shadow-inner">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{getMonthDay(event.eventDate).month}</span>
                      <span className="text-xl font-serif font-bold text-slate-800">{getMonthDay(event.eventDate).day}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-bold text-slate-800 text-lg group-hover:text-[#ce1126] transition-colors">{event.eventType}</h4>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200">#{event.id.slice(-4)}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-500">
                        <p className="flex items-center gap-1.5"><Clock size={14} className="text-[#f1bf00]" />{event.eventTime}</p>
                        <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-300"></span>
                        <p className="flex items-center gap-1.5"><MapPin size={14} className="text-[#ce1126]" /><span className="truncate max-w-[150px]">{event.location}</span></p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 pt-4 sm:pt-0">
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        event.status === 'Confirmado' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        event.status === 'Pendiente'  ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {event.status === 'Confirmado' && <CheckCircle size={10} />}{event.status}
                      </span>
                      {event.paidAmount < event.totalAmount && (
                        <p className="text-xs text-[#ce1126] font-bold mt-1">
                          Pendiente: ${(event.totalAmount - event.paidAmount).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => onNavigate('/reservas')}
                      className="w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#ce1126]/20 rounded-full blur-[60px] -mr-10 -mt-10 group-hover:bg-[#ce1126]/30 transition-colors duration-500"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6 border border-white/10 shadow-lg">
                <Phone size={24} className="text-[#f1bf00]" />
              </div>
              <h3 className="font-serif font-bold text-2xl mb-2">¿Necesitas Ayuda?</h3>
              <p className="text-sm text-slate-400 mb-8 leading-relaxed">Estamos aquí para resolver tus dudas sobre eventos, pagos o repertorio.</p>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group/item">
                  <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white shadow-sm group-hover/item:scale-110 transition-transform">
                    <Phone size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">WhatsApp Directo</p>
                    <p className="font-bold text-sm">312 237 3486</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group/item">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-sm group-hover/item:scale-110 transition-transform">
                    <Clock size={14} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Horario Atención</p>
                    <p className="font-bold text-sm">Lun - Sab: 8am - 8pm</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Accesos Rápidos</h4>
            <div className="grid grid-cols-2 gap-3">
              {/* ✅ Accesos rápidos con navegación */}
              <button
                onClick={() => onNavigate('/repertorio')}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 hover:bg-[#ce1126]/5 hover:text-[#ce1126] border border-transparent hover:border-[#ce1126]/10 transition-all gap-2 group">
                <ListMusic size={24} className="text-slate-400 group-hover:text-[#ce1126] transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-wide">Repertorio</span>
              </button>
              <button
                onClick={() => onNavigate('/reservas')}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 hover:bg-[#f1bf00]/10 hover:text-[#b45309] border border-transparent hover:border-[#f1bf00]/20 transition-all gap-2 group">
                <Calendar size={24} className="text-slate-400 group-hover:text-[#f1bf00] transition-colors" />
                <span className="text-[10px] font-bold uppercase tracking-wide">Reservas</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};