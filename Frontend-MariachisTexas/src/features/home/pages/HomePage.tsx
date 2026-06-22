import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '@/shared/contexts/AuthContext';
import { Reservation, Rehearsal, UserRole } from '@/types';
import { reservaService } from '../../reservas/services/reservaService';
import { rehearsalService } from '../../ensayos/services/rehearsalService';
import {
  Calendar,
  Clock,
  Music,
  MapPin,
  Sparkles,
  Star,
  Phone,
  CheckCircle,
  X,
  Mic2,
  ListMusic,
  User,
  ChevronRight,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
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
            rehearsalService.getRehearsals(),
          ]);

          const now = new Date();

          const upcomingGigs = allReservations
            .filter(
              (reservation) =>
                reservation.status === 'Confirmado' &&
                new Date(`${reservation.eventDate}T${reservation.eventTime}`) >= now
            )
            .sort(
              (a, b) =>
                new Date(`${a.eventDate}T${a.eventTime}`).getTime() -
                new Date(`${b.eventDate}T${b.eventTime}`).getTime()
            );

          const upcomingRehearsals = allRehearsals
            .filter(
              (rehearsal) =>
                rehearsal.status === 'PENDIENTE' &&
                new Date(`${rehearsal.date}T${rehearsal.time}`) >= now
            )
            .sort(
              (a, b) =>
                new Date(`${a.date}T${a.time}`).getTime() -
                new Date(`${b.date}T${b.time}`).getTime()
            );

          setNextGig(upcomingGigs[0] ?? null);
          setNextRehearsal(upcomingRehearsals[0] ?? null);
          setStats({
            gigsCount: upcomingGigs.length,
            rehearsalCount: upcomingRehearsals.length,
          });
        } else {
          const reservations = await reservaService.getReservations();
          let relevantEvents: Reservation[] = [];

          if (user) {
            relevantEvents = reservations.filter((reservation) => {
              const userEmail = user.email.toLowerCase();
              const userName = user.name.toLowerCase();
              const clientEmail = reservation.clientEmail?.toLowerCase() || '';
              const clientName = reservation.clientName?.toLowerCase() || '';

              const emailMatch = clientEmail === userEmail;
              const idMatch = reservation.clientId === user.id;
              const nameMatch =
                clientName.includes(userName) ||
                userName.includes(clientName.split(' ')[0]);

              return emailMatch || idMatch || nameMatch;
            });
          }

          relevantEvents.sort(
            (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
          );
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

  const WelcomeToast = () =>
    createPortal(
      <div
        className={`fixed top-6 right-6 z-[200] transition-all duration-500 transform ${showWelcomeToast
            ? 'translate-y-0 opacity-100'
            : '-translate-y-4 opacity-0 pointer-events-none'
          }`}
      >
        <div className="flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border border-emerald-100 bg-white/95 backdrop-blur-md min-w-[320px]">
          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600">
            <CheckCircle size={20} strokeWidth={3} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm text-emerald-950">
              ¡Hola de nuevo, {user?.name}!
            </h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
              {user?.role === UserRole.EMPLEADO
                ? 'Tu agenda está lista.'
                : 'Bienvenido a Mariachis Texas.'}
            </p>
          </div>
          <button
            onClick={() => setShowWelcomeToast(false)}
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>
      </div>,
      document.body
    );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';

    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(`${dateStr}T00:00:00`));
  };

  const getMonthDay = (dateStr: string) => {
    const date = new Date(`${dateStr}T00:00:00`);

    return {
      day: date.getDate(),
      month: date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase(),
    };
  };

  const getEventDateTime = (date: string, time: string) => new Date(`${date}T${time}`);

  const getRelativeLabel = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    const diff = Math.round((target.getTime() - today.getTime()) / 86400000);

    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Mañana';
    if (diff > 1) return `En ${diff} días`;

    return 'Próximamente';
  };

  const firstName = user?.name?.split(' ')[0] || 'Músico';
  const currentDate = new Date();

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-400 flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
        <p className="animate-pulse">Cargando tu experiencia...</p>
      </div>
    );
  }

  if (user?.role === UserRole.EMPLEADO) {
    const gigDate = nextGig
      ? getEventDateTime(nextGig.eventDate, nextGig.eventTime)
      : null;
    const rehearsalDate = nextRehearsal
      ? getEventDateTime(nextRehearsal.date, nextRehearsal.time)
      : null;

    return (
      <div className="relative min-h-screen overflow-hidden rounded-[2rem] bg-[#050816] text-white">
        <WelcomeToast />

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-[10%] h-72 w-72 rounded-full bg-primary-500/18 blur-[120px]" />
          <div className="absolute top-[30%] -right-20 h-80 w-80 rounded-full bg-blue-500/12 blur-[140px]" />
          <div className="absolute bottom-[-8rem] left-[35%] h-72 w-72 rounded-full bg-amber-400/8 blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        <div className="relative z-10 space-y-6 px-4 py-4 md:px-6 md:py-6">
          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
            <div className="flex flex-col gap-8 p-6 md:p-8 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-2xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.28em] text-amber-200">
                  <Sparkles size={14} className="text-amber-300" />
                  Panel de músico
                </div>
                <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                  Hola, <span className="text-amber-300">{firstName}</span>
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300 md:text-base">
                  Aquí tienes tu agenda del día, próximos compromisos y accesos rápidos
                  para moverte entre ensayos, repertorio y reservas sin perder tiempo.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate('/reservas')}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-900 transition-all hover:scale-[1.02] hover:bg-amber-300"
                  >
                    Ver agenda
                    <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() => navigate('/repertorio')}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/10"
                  >
                    Repertorio
                    <ListMusic size={16} />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[340px]">
                <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/50 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                    Fecha actual
                  </p>
                  <div className="mt-3 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-4xl font-black leading-none text-white">
                        {currentDate.getDate()}
                      </p>
                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                        {currentDate.toLocaleDateString('es-ES', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <Calendar className="text-amber-300" size={28} />
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-emerald-400/10 bg-emerald-400/8 p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-200/80">
                    Estado de agenda
                  </p>
                  <p className="mt-3 text-xl font-black text-white">
                    {stats.gigsCount + stats.rehearsalCount > 0
                      ? 'Agenda activa'
                      : 'Día libre'}
                  </p>
                  <p className="mt-2 text-sm text-emerald-100/70">
                    {stats.gigsCount + stats.rehearsalCount > 0
                      ? `${stats.gigsCount + stats.rehearsalCount} compromisos por atender`
                      : 'No tienes compromisos pendientes por ahora'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/7 p-5 shadow-xl backdrop-blur-xl transition-transform hover:-translate-y-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Toques pendientes
                  </p>
                  <p className="mt-3 text-4xl font-black text-white">{stats.gigsCount}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
                  <Star size={20} className="fill-amber-300" />
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-300">
                {nextGig
                  ? `Próximo show ${getRelativeLabel(gigDate!)}`
                  : 'Sin eventos confirmados en agenda'}
              </p>
            </div>

            <div className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/7 p-5 shadow-xl backdrop-blur-xl transition-transform hover:-translate-y-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Ensayos
                  </p>
                  <p className="mt-3 text-4xl font-black text-white">{stats.rehearsalCount}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
                  <Music size={20} />
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-300">
                {nextRehearsal
                  ? `Ensayo ${getRelativeLabel(rehearsalDate!)}`
                  : 'Sin ensayos programados'}
              </p>
            </div>

            <div className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-primary-500/14 to-blue-500/10 p-5 shadow-xl backdrop-blur-xl transition-transform hover:-translate-y-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-300">
                    Próxima salida
                  </p>
                  <p className="mt-3 text-xl font-black text-white">
                    {nextGig ? nextGig.eventType : 'Sin show cercano'}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <Sparkles size={20} />
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-200/80">
                {nextGig
                  ? formatDate(nextGig.eventDate)
                  : 'Tu próximo show aparecerá aquí apenas se confirme'}
              </p>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_360px]">
            <div className="space-y-6">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.28em] text-slate-300">
                      Tu próximo show
                    </h3>
                    <p className="text-sm text-slate-400">
                      Todo lo importante de tu siguiente presentación.
                    </p>
                  </div>
                </div>

                {nextGig ? (
                  <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#081226] p-7 shadow-[0_28px_80px_rgba(0,0,0,0.42)] md:p-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.16),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.18),transparent_40%)]" />
                    <div className="relative z-10">
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-5">
                          <div className="min-w-[88px] rounded-[1.5rem] border border-white/10 bg-white/8 px-4 py-4 text-center shadow-xl">
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300">
                              {getMonthDay(nextGig.eventDate).month}
                            </p>
                            <p className="mt-2 text-4xl font-black leading-none text-white">
                              {getMonthDay(nextGig.eventDate).day}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <div className="mb-3 flex flex-wrap items-center gap-3">
                              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">
                                Confirmado
                              </span>
                              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                                {getRelativeLabel(gigDate!)}
                              </span>
                            </div>

                            <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                              {nextGig.eventType}
                            </h2>
                            <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
                              <User size={16} className="text-amber-300" />
                              Cliente: {nextGig.clientName}
                            </div>
                            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
                              Prepárate con tiempo y revisa la ubicación, repertorio asignado
                              y hora de inicio antes de salir.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => navigate('/reservas')}
                          className="inline-flex items-center gap-2 self-start rounded-2xl bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-900 transition-colors hover:bg-amber-300"
                        >
                          Ver detalles
                          <ChevronRight size={16} />
                        </button>
                      </div>

                      <div className="mt-8 grid gap-4 md:grid-cols-3">
                        <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
                            <Clock size={18} />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                            Hora de inicio
                          </p>
                          <p className="mt-2 text-lg font-black text-white">{nextGig.eventTime}</p>
                        </div>

                        <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
                            <MapPin size={18} />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                            Ubicación
                          </p>
                          <p className="mt-2 text-lg font-black text-white line-clamp-2">
                            {nextGig.location}
                          </p>
                        </div>

                        <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                            <Music size={18} />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                            Repertorio
                          </p>
                          <p className="mt-2 text-lg font-black text-white">
                            {nextGig.repertoireIds?.length ?? 0} canciones
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-[2.25rem] border border-dashed border-white/15 bg-white/5 p-10 text-center shadow-2xl backdrop-blur-2xl">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/6 text-slate-400">
                      <Calendar size={34} />
                    </div>
                    <h3 className="mt-6 text-3xl font-black tracking-tight text-white">
                      Agenda despejada
                    </h3>
                    <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
                      No tienes presentaciones próximas. Cuando se confirme un nuevo evento,
                      aquí verás la información más importante para prepararte.
                    </p>
                    <button
                      onClick={() => navigate('/reservas')}
                      className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/12"
                    >
                      Revisar reservas
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/7 p-6 shadow-xl backdrop-blur-2xl">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
                    <Mic2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.24em] text-slate-300">
                      Ensayo
                    </h3>
                    <p className="text-sm text-slate-400">Siguiente sesión programada.</p>
                  </div>
                </div>

                {nextRehearsal ? (
                  <div className="rounded-[1.6rem] border border-blue-400/15 bg-blue-500/6 p-5">
                    <span className="inline-flex rounded-full border border-blue-400/15 bg-blue-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">
                      {getRelativeLabel(rehearsalDate!)}
                    </span>
                    <h4 className="mt-4 text-2xl font-black tracking-tight text-white">
                      {nextRehearsal.title}
                    </h4>
                    <p className="mt-2 text-sm text-slate-300">{formatDate(nextRehearsal.date)}</p>

                    <div className="mt-5 space-y-3">
                      <div className="flex items-center gap-3 rounded-2xl bg-slate-950/35 px-4 py-3 text-sm text-slate-200">
                        <Clock size={16} className="text-blue-300" />
                        {nextRehearsal.time}
                      </div>
                      <div className="flex items-center gap-3 rounded-2xl bg-slate-950/35 px-4 py-3 text-sm text-slate-200">
                        <MapPin size={16} className="text-blue-300" />
                        <span className="line-clamp-2">{nextRehearsal.location}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[1.6rem] border border-dashed border-white/10 bg-slate-950/25 px-5 py-10 text-center">
                    <p className="text-sm text-slate-400">No hay ensayos programados.</p>
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/7 p-6 shadow-xl backdrop-blur-2xl">
                <h4 className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                  Accesos rápidos
                </h4>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate('/repertorio')}
                    className="group rounded-[1.4rem] border border-white/10 bg-slate-950/30 p-4 text-left transition-all hover:border-amber-400/25 hover:bg-amber-400/10"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-slate-300 transition-colors group-hover:text-amber-300">
                      <ListMusic size={20} />
                    </div>
                    <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-white">
                      Repertorio
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Consulta canciones y sets.</p>
                  </button>

                  <button
                    onClick={() => navigate('/reservas')}
                    className="group rounded-[1.4rem] border border-white/10 bg-slate-950/30 p-4 text-left transition-all hover:border-blue-400/25 hover:bg-blue-500/10"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-slate-300 transition-colors group-hover:text-blue-300">
                      <Calendar size={20} />
                    </div>
                    <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-white">
                      Calendario
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Revisa todos tus eventos.</p>
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-[2rem] border border-emerald-400/10 bg-emerald-400/8 p-6 shadow-xl backdrop-blur-2xl">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/12 text-emerald-200">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-[0.22em] text-emerald-100">
                      Soporte rápido
                    </h4>
                    <p className="text-sm text-emerald-100/70">
                      Si algo cambia, comunícate enseguida.
                    </p>
                  </div>
                </div>

                <a
                  href="https://wa.me/573122373486"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-[1.4rem] border border-emerald-300/15 bg-slate-950/20 px-4 py-4 text-white transition-colors hover:bg-slate-950/35"
                >
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/70">
                      WhatsApp directo
                    </p>
                    <p className="mt-1 text-base font-black">312 237 3486</p>
                  </div>
                  <ChevronRight size={18} className="text-emerald-200" />
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ background: '#08090d' }}>

      <WelcomeToast />

      {/* ── HEADER LIMPIO ── */}
      <div className="relative border-b border-white/[0.06]">
        {/* Imagen de fondo ultra sutil */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/images/home-hero.png"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover opacity-[0.07]"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #08090d 0%, transparent 40%, #08090d 100%)' }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between gap-6">
            {/* Saludo */}
            <div className="flex items-center gap-4">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[11px] font-medium tracking-[0.2em] uppercase mb-0.5" style={{ color: '#f59e0b', opacity: 0.7 }}>
                  Mariachis Texas · Medellín
                </p>
                <h1 className="text-lg font-semibold text-white leading-tight">
                  Hola, <span className="font-bold" style={{ color: '#fbbf24' }}>{user?.name?.split(' ')[0]}</span>
                </h1>
                <p className="text-xs mt-0.5 capitalize" style={{ color: 'rgba(148,163,184,0.6)' }}>
                  {currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/reservas')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150"
                style={{ background: '#f59e0b', color: '#fff' }}
              >
                <Star size={12} strokeWidth={2.5} className="fill-white" />
                Agendar evento
              </button>
              <button
                onClick={() => navigate('/repertorio')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
              >
                <ListMusic size={12} strokeWidth={2} />
                Repertorio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

          {/* ── COLUMNA IZQUIERDA: MIS RESERVAS ── */}
          <div>
            {/* Encabezado sección */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Mis Reservas</h2>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(148,163,184,0.5)' }}>
                  Tus próximos eventos y cotizaciones
                </p>
              </div>
              <button
                onClick={() => navigate('/reservas')}
                className="inline-flex items-center gap-1 text-xs transition-colors"
                style={{ color: 'rgba(148,163,184,0.5)' }}
              >
                Ver todo <ChevronRight size={12} />
              </button>
            </div>

            {/* Lista de eventos */}
            {clientEvents.length === 0 ? (
              <div
                className="rounded-xl p-10 text-center"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <Calendar size={20} style={{ color: 'rgba(148,163,184,0.4)' }} strokeWidth={1.5} />
                </div>
                <p className="text-sm font-medium text-white mb-1">Sin reservas activas</p>
                <p className="text-xs mb-5" style={{ color: 'rgba(148,163,184,0.45)' }}>
                  Dale vida a tu próxima celebración con el mejor Mariachi de Medellín.
                </p>
                <button
                  onClick={() => navigate('/reservas')}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: '#f59e0b', color: '#fff' }}
                >
                  Solicitar cotización
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {clientEvents.map((event, idx) => (
                  <div
                    key={event.id}
                    className="group flex items-center gap-4 px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-150"
                    style={{
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      animationDelay: `${idx * 60}ms`,
                    }}
                    onClick={() => navigate('/reservas')}
                  >
                    {/* Bloque de fecha */}
                    <div
                      className="flex-shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center text-center"
                      style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: '#f59e0b', lineHeight: 1 }}>
                        {getMonthDay(event.eventDate).month}
                      </span>
                      <span className="text-lg font-bold text-white leading-tight">
                        {getMonthDay(event.eventDate).day}
                      </span>
                    </div>

                    {/* Información */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white truncate">
                          {event.eventType}
                        </span>
                        <span
                          className="flex-shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(148,163,184,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          #{event.id.slice(-4)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(148,163,184,0.5)' }}>
                          <Clock size={10} /> {event.eventTime}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] truncate max-w-[140px]" style={{ color: 'rgba(148,163,184,0.5)' }}>
                          <MapPin size={10} /> {event.location}
                        </span>
                      </div>
                    </div>

                    {/* Estado */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                      <span
                        className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${
                          event.status === 'Confirmado'
                            ? 'text-emerald-400'
                            : event.status === 'Pendiente'
                              ? 'text-amber-400'
                              : 'text-slate-400'
                        }`}
                        style={{
                          background: event.status === 'Confirmado'
                            ? 'rgba(52,211,153,0.08)'
                            : event.status === 'Pendiente'
                              ? 'rgba(245,158,11,0.08)'
                              : 'rgba(148,163,184,0.06)',
                          border: event.status === 'Confirmado'
                            ? '1px solid rgba(52,211,153,0.2)'
                            : event.status === 'Pendiente'
                              ? '1px solid rgba(245,158,11,0.2)'
                              : '1px solid rgba(148,163,184,0.1)',
                        }}
                      >
                        {event.status}
                      </span>
                      {event.paidAmount < event.totalAmount && (
                        <span className="text-[9px] font-medium" style={{ color: 'rgba(248,113,113,0.7)' }}>
                          Saldo: ${(event.totalAmount - event.paidAmount).toLocaleString('es-CO')}
                        </span>
                      )}
                    </div>

                    {/* Ícono flecha */}
                    <ChevronRight size={14} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'rgba(148,163,184,0.4)' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── COLUMNA DERECHA: SIDEBAR ── */}
          <div className="space-y-3">

            {/* Panel contacto */}
            <div
              className="rounded-xl p-5"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-xs font-semibold text-white mb-1">¿Necesitas ayuda?</p>
              <p className="text-[11px] mb-4" style={{ color: 'rgba(148,163,184,0.5)' }}>
                Nuestro equipo está listo para atenderte.
              </p>

              <div className="space-y-2">
                <a
                  href="https://wa.me/573122373486"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 px-3.5 py-3 rounded-lg transition-all duration-150 group"
                  style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.12)' }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(52,211,153,0.1)' }}>
                    <Phone size={13} style={{ color: '#34d399' }} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium uppercase tracking-wider mb-0.5" style={{ color: 'rgba(52,211,153,0.6)' }}>
                      WhatsApp
                    </p>
                    <p className="text-sm font-semibold text-white">312 237 3486</p>
                  </div>
                  <ChevronRight size={13} className="flex-shrink-0 opacity-40 group-hover:opacity-80 transition-opacity" style={{ color: '#34d399' }} />
                </a>

                <div
                  className="flex items-center gap-3 px-3.5 py-3 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <Clock size={13} style={{ color: 'rgba(148,163,184,0.5)' }} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider mb-0.5" style={{ color: 'rgba(148,163,184,0.4)' }}>
                      Horario
                    </p>
                    <p className="text-sm font-semibold text-white">8:00 AM – 8:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Accesos rápidos */}
            <div
              className="rounded-xl p-5"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] mb-3" style={{ color: 'rgba(148,163,184,0.4)' }}>
                Accesos rápidos
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate('/repertorio')}
                  className="group flex flex-col items-center gap-2 py-4 rounded-lg transition-all duration-150"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <ListMusic size={15} style={{ color: 'rgba(148,163,184,0.5)' }} strokeWidth={2} />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 group-hover:text-white transition-colors">Repertorio</span>
                </button>

                <button
                  onClick={() => navigate('/reservas')}
                  className="group flex flex-col items-center gap-2 py-4 rounded-lg transition-all duration-150"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <Calendar size={15} style={{ color: 'rgba(148,163,184,0.5)' }} strokeWidth={2} />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 group-hover:text-white transition-colors">Reservas</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
