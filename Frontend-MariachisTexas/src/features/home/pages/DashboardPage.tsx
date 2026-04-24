import React, { useEffect, useState } from 'react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { Quotation, Rehearsal, Reservation } from '@/types';
import { reservaService } from '../../reservas/services/reservaService';
import { ventaService, Sale } from '../../ventas/services/ventaService';
import { cotizacionService } from '../../cotizaciones/services/cotizacionService';
import { rehearsalService } from '../../ensayos/services/rehearsalService';
import { clientService } from '../../clientes/services/clientService';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  FileText,
  HandCoins,
  LoaderCircle,
  Mic2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const COLORS = {
  ink: '#111827',
  slate: '#64748b',
  slateSoft: '#cbd5e1',
  slateLine: '#e2e8f0',
  white: '#ffffff',
  red: '#ce1126',
  redSoft: '#fee2e2',
  amber: '#f59e0b',
  amberSoft: '#fef3c7',
  emerald: '#10b981',
  emeraldSoft: '#d1fae5',
  blue: '#0f766e',
  blueSoft: '#ccfbf1',
};

const PIE_COLORS = [COLORS.red, COLORS.ink, COLORS.amber, COLORS.emerald, COLORS.blue];
const WEEK_DAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
const SLOT_LABELS = ['Manana', 'Tarde', 'Noche', 'Madrugada'];

interface DashboardData {
  reservations: Reservation[];
  sales: Sale[];
  quotations: Quotation[];
  rehearsals: Rehearsal[];
  clientsCount: number;
}

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  date: Date;
  amount?: number;
  kind: 'reserva' | 'cotizacion' | 'venta';
}

interface AgendaItem {
  id: string;
  title: string;
  subtitle: string;
  date: Date;
  kind: 'reserva' | 'ensayo';
  status: string;
}

interface AlertItem {
  id: string;
  title: string;
  description: string;
  tone: 'danger' | 'warning' | 'success';
}

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const startOfMonth = (base = new Date(), offset = 0) => {
  const date = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfMonth = (base = new Date(), offset = 0) => {
  const date = new Date(base.getFullYear(), base.getMonth() + offset + 1, 0);
  date.setHours(23, 59, 59, 999);
  return date;
};

const startOfWeek = (base: Date) => {
  const date = new Date(base);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfWeek = (base: Date) => {
  const date = startOfWeek(base);
  date.setDate(date.getDate() + 6);
  date.setHours(23, 59, 59, 999);
  return date;
};

const shortCurrency = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${Math.round(value).toLocaleString('es-CO')}`;
};

const fullCurrency = (value: number) =>
  `$${Math.round(value || 0).toLocaleString('es-CO')}`;

const formatPercent = (value: number) => `${Math.round(value)}%`;

const formatCompactDate = (date: Date) =>
  new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
  }).format(date);

const formatFullDate = (date: Date) =>
  new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);

const normalizeReservationStatus = (status: string) => {
  const normalized = (status || '').trim().toUpperCase();
  if (normalized === 'CONFIRMADO' || normalized === 'FINALIZADO') return 'CONFIRMADA';
  if (normalized === 'ANULADO') return 'ANULADA';
  if (normalized === 'REPROGRAMADO') return 'REPROGRAMADA';
  return normalized || 'PENDIENTE';
};

const normalizeQuotationStatus = (status: string) => (status || '').trim().toUpperCase();

const toDateTime = (date: string, time?: string) => {
  const safeTime = time && time.length >= 5 ? time.slice(0, 5) : '00:00';
  return new Date(`${date}T${safeTime}:00`);
};

const reservationDate = (reservation: Reservation) =>
  toDateTime(reservation.eventDate, reservation.startTime || reservation.eventTime);

const rehearsalDate = (rehearsal: Rehearsal) =>
  toDateTime(rehearsal.date || rehearsal.fecha || '', rehearsal.time || rehearsal.hora);

const getReservationPending = (reservation: Reservation) =>
  Math.max(0, Number(reservation.pendingBalance ?? reservation.totalAmount - reservation.paidAmount));

const getMonthLabel = (date: Date) =>
  date.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '');

const getWeekdayIndex = (date: Date) => (date.getDay() + 6) % 7;

const getSlotIndex = (hour: number) => {
  if (hour >= 6 && hour < 12) return 0;
  if (hour >= 12 && hour < 18) return 1;
  if (hour >= 18 && hour < 24) return 2;
  return 3;
};

const getMetricDelta = (current: number, previous: number) => {
  if (previous <= 0) {
    if (current <= 0) return 0;
    return 100;
  }
  return ((current - previous) / previous) * 100;
};

const tooltipFormatter = (value: number, name: string) => {
  if (name.toLowerCase().includes('ingresos') || name.toLowerCase().includes('ticket')) {
    return [fullCurrency(value), name];
  }
  return [value, name];
};

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-2xl shadow-slate-900/10">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <div className="mt-2 space-y-1.5">
        {payload.map((entry: any, index: number) => (
          <div key={`${entry.name}-${index}`} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-2 text-slate-500">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-bold text-slate-800">
              {tooltipFormatter(Number(entry.value), entry.name)[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DashboardCard: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ title, subtitle, children, actions }) => (
  <section className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-6">
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-sm font-black uppercase tracking-[0.22em] text-slate-800">{title}</h3>
        {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions}
    </div>
    {children}
  </section>
);

const TrendBadge: React.FC<{ value: number; suffix: string }> = ({ value, suffix }) => {
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
        positive
          ? 'bg-emerald-500/10 text-emerald-600'
          : 'bg-red-500/10 text-red-600'
      }`}
    >
      <Icon size={13} />
      {Math.abs(Math.round(value))}% {suffix}
    </span>
  );
};

const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  tone: 'red' | 'amber' | 'emerald' | 'slate';
  meta: React.ReactNode;
}> = ({ icon: Icon, label, value, tone, meta }) => {
  const tones = {
    red: 'from-red-500/15 to-red-500/5 text-red-600 border-red-200/60',
    amber: 'from-amber-500/15 to-amber-500/5 text-amber-600 border-amber-200/60',
    emerald: 'from-emerald-500/15 to-emerald-500/5 text-emerald-600 border-emerald-200/60',
    slate: 'from-slate-700/10 to-slate-500/5 text-slate-700 border-slate-200/80',
  };

  return (
    <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border bg-gradient-to-br ${tones[tone]}`}
        >
          <Icon size={20} />
        </div>
        <div className="text-right">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{value}</p>
        </div>
      </div>
      <div className="mt-4">{meta}</div>
    </div>
  );
};

const StatusPill: React.FC<{ status: string; kind: 'reservation' | 'quotation' | 'agenda' }> = ({
  status,
  kind,
}) => {
  const normalized =
    kind === 'quotation' ? normalizeQuotationStatus(status) : normalizeReservationStatus(status);

  const styles =
    normalized === 'CONFIRMADA' || normalized === 'CONVERTIDA'
      ? 'bg-emerald-500/10 text-emerald-600'
      : normalized === 'ANULADA'
      ? 'bg-slate-200/70 text-slate-600'
      : normalized === 'REPROGRAMADA'
      ? 'bg-cyan-500/10 text-cyan-700'
      : normalized === 'PENDIENTE' || normalized === 'EN_ESPERA'
      ? 'bg-amber-500/10 text-amber-600'
      : 'bg-slate-100 text-slate-600';

  const label =
    normalized === 'CONFIRMADA'
      ? 'Confirmada'
      : normalized === 'CONVERTIDA'
      ? 'Convertida'
      : normalized === 'REPROGRAMADA'
      ? 'Reprogramada'
      : normalized === 'ANULADA'
      ? 'Anulada'
      : normalized === 'EN_ESPERA'
      ? 'En espera'
      : normalized === 'LISTO'
      ? 'Listo'
      : normalized === 'PENDIENTE'
      ? 'Pendiente'
      : status;

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${styles}`}>
      {label}
    </span>
  );
};

const Heatmap: React.FC<{ matrix: number[][] }> = ({ matrix }) => {
  const max = Math.max(1, ...matrix.flat());

  const getCellClass = (value: number) => {
    const ratio = value / max;
    if (value === 0) return 'bg-slate-100 text-slate-400';
    if (ratio < 0.35) return 'bg-red-100 text-red-500';
    if (ratio < 0.7) return 'bg-red-200 text-red-600';
    return 'bg-[#ce1126] text-white';
  };

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[620px] grid-cols-[88px_repeat(7,minmax(0,1fr))] gap-2">
        <div />
        {WEEK_DAYS.map(day => (
          <div
            key={day}
            className="pb-1 text-center text-[11px] font-black uppercase tracking-[0.18em] text-slate-400"
          >
            {day}
          </div>
        ))}
        {SLOT_LABELS.map((slot, rowIndex) => (
          <React.Fragment key={slot}>
            <div className="flex items-center text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              {slot}
            </div>
            {WEEK_DAYS.map((_, colIndex) => {
              const value = matrix[rowIndex]?.[colIndex] ?? 0;
              return (
                <div
                  key={`${slot}-${colIndex}`}
                  className={`flex h-14 items-center justify-center rounded-2xl border border-white/70 text-sm font-black shadow-sm ${getCellClass(
                    value
                  )}`}
                  title={`${slot} ${WEEK_DAYS[colIndex]}: ${value} registro(s)`}
                >
                  {value}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const LoadingDashboard = () => (
  <div className="space-y-6">
    <div className="rounded-[2.25rem] border border-white/60 bg-slate-950 px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
      <div className="h-4 w-44 animate-pulse rounded-full bg-white/10" />
      <div className="mt-4 h-12 w-80 animate-pulse rounded-full bg-white/10" />
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-[1.5rem] bg-white/8" />
        ))}
      </div>
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-40 animate-pulse rounded-[1.75rem] border border-white/60 bg-white/70"
        />
      ))}
    </div>
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      {Array.from({ length: 2 }).map((_, index) => (
        <div
          key={index}
          className="h-[360px] animate-pulse rounded-[2rem] border border-white/60 bg-white/70"
        />
      ))}
    </div>
  </div>
);

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData>({
    reservations: [],
    sales: [],
    quotations: [],
    rehearsals: [],
    clientsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setErrorMessage(null);

      const results = await Promise.allSettled([
        reservaService.getReservations(),
        ventaService.getSales(),
        cotizacionService.getQuotations(),
        rehearsalService.getRehearsals(),
        clientService.getClients(),
      ]);

      if (cancelled) return;

      const reservations = results[0].status === 'fulfilled' ? results[0].value : [];
      const sales = results[1].status === 'fulfilled' ? results[1].value : [];
      const quotations = results[2].status === 'fulfilled' ? results[2].value : [];
      const rehearsals = results[3].status === 'fulfilled' ? results[3].value : [];
      const clientsCount =
        results[4].status === 'fulfilled' ? results[4].value.clients.length : 0;

      const failures = results.filter(result => result.status === 'rejected').length;

      setDashboard({
        reservations,
        sales,
        quotations,
        rehearsals,
        clientsCount,
      });

      if (failures > 0) {
        setErrorMessage(
          'Algunos módulos no respondieron. El dashboard se cargó con la información disponible.'
        );
      }

      setLoading(false);
      setRefreshing(false);
    };

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [user, reloadToken]);

  const today = startOfToday();
  const currentMonthStart = startOfMonth();
  const currentMonthEnd = endOfMonth();
  const previousMonthStart = startOfMonth(new Date(), -1);
  const previousMonthEnd = endOfMonth(new Date(), -1);
  const next14Days = new Date(today);
  next14Days.setDate(next14Days.getDate() + 14);
  const next30Days = new Date(today);
  next30Days.setDate(next30Days.getDate() + 30);
  const next60Days = new Date(today);
  next60Days.setDate(next60Days.getDate() + 60);

  const reservations = dashboard.reservations.map(reservation => ({
    ...reservation,
    normalizedStatus: normalizeReservationStatus(reservation.status),
    pendingValue: getReservationPending(reservation),
    eventDateTime: reservationDate(reservation),
  }));

  const quotations = dashboard.quotations.map(quotation => ({
    ...quotation,
    normalizedStatus: normalizeQuotationStatus(quotation.status),
    eventDateTime: toDateTime(quotation.eventDate, quotation.startTime),
  }));

  const rehearsals = dashboard.rehearsals.map(rehearsal => ({
    ...rehearsal,
    normalizedStatus: (rehearsal.status || 'PENDIENTE').toUpperCase(),
    eventDateTime: rehearsalDate(rehearsal),
  }));

  const activeReservations = reservations.filter(reservation =>
    ['PENDIENTE', 'CONFIRMADA', 'REPROGRAMADA'].includes(reservation.normalizedStatus)
  );
  const futureReservations = activeReservations
    .filter(reservation => reservation.eventDateTime >= today)
    .sort((a, b) => a.eventDateTime.getTime() - b.eventDateTime.getTime());
  const pendingQuotes = quotations.filter(quotation => quotation.normalizedStatus === 'EN_ESPERA');
  const convertedQuotes = quotations.filter(
    quotation => quotation.normalizedStatus === 'CONVERTIDA'
  );
  const pendingRehearsals = rehearsals
    .filter(rehearsal => rehearsal.normalizedStatus === 'PENDIENTE')
    .sort((a, b) => a.eventDateTime.getTime() - b.eventDateTime.getTime());

  const currentMonthRevenue = dashboard.sales
    .filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= currentMonthStart && saleDate <= currentMonthEnd;
    })
    .reduce((total, sale) => total + Number(sale.amount || 0), 0);

  const previousMonthRevenue = dashboard.sales
    .filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= previousMonthStart && saleDate <= previousMonthEnd;
    })
    .reduce((total, sale) => total + Number(sale.amount || 0), 0);

  const currentMonthReservationsCount = activeReservations.filter(reservation => {
    return reservation.eventDateTime >= currentMonthStart && reservation.eventDateTime <= currentMonthEnd;
  }).length;

  const previousMonthReservationsCount = activeReservations.filter(reservation => {
    return (
      reservation.eventDateTime >= previousMonthStart &&
      reservation.eventDateTime <= previousMonthEnd
    );
  }).length;

  const receivableBalance = activeReservations.reduce(
    (total, reservation) => total + reservation.pendingValue,
    0
  );

  const pipelineValue =
    pendingQuotes.reduce((total, quotation) => total + Number(quotation.totalAmount || 0), 0) +
    receivableBalance;

  const paidReservationsCount = activeReservations.filter(
    reservation => reservation.pendingValue <= 0.01
  ).length;
  const paymentHealth = activeReservations.length
    ? (paidReservationsCount / activeReservations.length) * 100
    : 0;
  const quoteConversion = quotations.length
    ? (convertedQuotes.length / quotations.length) * 100
    : 0;
  const averageTicket = dashboard.sales.length
    ? dashboard.sales.reduce((sum, sale) => sum + Number(sale.amount || 0), 0) /
      dashboard.sales.length
    : 0;

  const revenueDelta = getMetricDelta(currentMonthRevenue, previousMonthRevenue);
  const reservationsDelta = getMetricDelta(
    currentMonthReservationsCount,
    previousMonthReservationsCount
  );

  const monthlyRevenueData = Array.from({ length: 6 }, (_, index) => {
    const offset = index - 5;
    const start = startOfMonth(new Date(), offset);
    const end = endOfMonth(new Date(), offset);
    const label = getMonthLabel(start);

    const ingresos = dashboard.sales
      .filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= start && saleDate <= end;
      })
      .reduce((total, sale) => total + Number(sale.amount || 0), 0);

    const reservas = reservations.filter(
      reservation => reservation.createdAt && new Date(reservation.createdAt) >= start && new Date(reservation.createdAt) <= end
    ).length;

    return { name: label, ingresos, reservas };
  });

  const weeklyFlowData = Array.from({ length: 8 }, (_, index) => {
    const start = startOfWeek(new Date(today.getFullYear(), today.getMonth(), today.getDate() - (7 * (7 - index))));
    const end = endOfWeek(start);
    const label = `${formatCompactDate(start)} - ${formatCompactDate(end)}`;

    const cotizaciones = quotations.filter(quotation => {
      const createdAt = new Date(quotation.createdAt);
      return createdAt >= start && createdAt <= end;
    }).length;

    const reservasSemana = reservations.filter(reservation => {
      const createdAt = new Date(reservation.createdAt);
      return createdAt >= start && createdAt <= end;
    }).length;

    const ventasSemana = dashboard.sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= start && saleDate <= end;
    }).length;

    return {
      name: `Sem ${index + 1}`,
      periodo: label,
      Cotizaciones: cotizaciones,
      Reservas: reservasSemana,
      Ventas: ventasSemana,
    };
  });

  const reservationStatusData = [
    {
      name: 'Confirmadas',
      value: reservations.filter(reservation => reservation.normalizedStatus === 'CONFIRMADA').length,
    },
    {
      name: 'Pendientes',
      value: reservations.filter(reservation => reservation.normalizedStatus === 'PENDIENTE').length,
    },
    {
      name: 'Reprogramadas',
      value: reservations.filter(reservation => reservation.normalizedStatus === 'REPROGRAMADA').length,
    },
    {
      name: 'Anuladas',
      value: reservations.filter(reservation => reservation.normalizedStatus === 'ANULADA').length,
    },
  ].filter(item => item.value > 0);

  const topEventTypesData = Object.entries(
    reservations.reduce<Record<string, number>>((accumulator, reservation) => {
      const key = reservation.eventType || 'Otro';
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const weekdayRadarData = WEEK_DAYS.map((day, index) => {
    const reservasDia = futureReservations.filter(
      reservation => getWeekdayIndex(reservation.eventDateTime) === index
    ).length;
    const ensayosDia = pendingRehearsals.filter(
      rehearsal => getWeekdayIndex(rehearsal.eventDateTime) === index
    ).length;

    return {
      day,
      Agenda: reservasDia + ensayosDia,
      Reservas: reservasDia,
      Ensayos: ensayosDia,
    };
  });

  const occupancyMatrix = (() => {
    const matrix = Array.from({ length: SLOT_LABELS.length }, () => Array(7).fill(0));

    futureReservations
      .filter(reservation => reservation.eventDateTime <= next60Days)
      .forEach(reservation => {
        const row = getSlotIndex(reservation.eventDateTime.getHours());
        const column = getWeekdayIndex(reservation.eventDateTime);
        matrix[row][column] += 1;
      });

    pendingQuotes
      .filter(quotation => quotation.eventDateTime >= today && quotation.eventDateTime <= next60Days)
      .forEach(quotation => {
        const row = getSlotIndex(quotation.eventDateTime.getHours());
        const column = getWeekdayIndex(quotation.eventDateTime);
        matrix[row][column] += 1;
      });

    pendingRehearsals
      .filter(rehearsal => rehearsal.eventDateTime <= next60Days)
      .forEach(rehearsal => {
        const row = getSlotIndex(rehearsal.eventDateTime.getHours());
        const column = getWeekdayIndex(rehearsal.eventDateTime);
        matrix[row][column] += 1;
      });

    return matrix;
  })();

  const agendaItems: AgendaItem[] = [
    ...futureReservations.slice(0, 6).map(reservation => ({
      id: `res-${reservation.id}`,
      title: `${reservation.eventType} con ${reservation.clientName}`,
      subtitle: `Reserva #${reservation.id} · ${fullCurrency(reservation.totalAmount)}`,
      date: reservation.eventDateTime,
      kind: 'reserva' as const,
      status: reservation.normalizedStatus,
    })),
    ...pendingRehearsals.slice(0, 4).map(rehearsal => ({
      id: `ens-${rehearsal.id}`,
      title: rehearsal.title,
      subtitle: rehearsal.location,
      date: rehearsal.eventDateTime,
      kind: 'ensayo' as const,
      status: rehearsal.normalizedStatus,
    })),
  ]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 8);

  const activityFeed: ActivityItem[] = [
    ...reservations.map(reservation => ({
      id: `reservation-${reservation.id}`,
      title: `${reservation.eventType} · ${reservation.clientName}`,
      subtitle: `Reserva creada · ${normalizeReservationStatus(reservation.status)}`,
      date: new Date(reservation.createdAt),
      amount: Number(reservation.totalAmount || 0),
      kind: 'reserva' as const,
    })),
    ...quotations.map(quotation => ({
      id: `quotation-${quotation.id}`,
      title: `${quotation.eventType} · ${quotation.clientName}`,
      subtitle: `Cotizacion · ${normalizeQuotationStatus(quotation.status)}`,
      date: new Date(quotation.createdAt),
      amount: Number(quotation.totalAmount || 0),
      kind: 'cotizacion' as const,
    })),
    ...dashboard.sales.map(sale => ({
      id: `sale-${sale.id}`,
      title: sale.concept || sale.eventType || 'Venta registrada',
      subtitle: `${sale.clientName} · ${sale.method}`,
      date: new Date(sale.date),
      amount: Number(sale.amount || 0),
      kind: 'venta' as const,
    })),
  ]
    .filter(item => !Number.isNaN(item.date.getTime()))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 7);

  const topClients = Object.values(
    reservations.reduce<Record<string, { name: string; reservas: number; valor: number }>>(
      (accumulator, reservation) => {
        const key = reservation.clientName || reservation.clientEmail || reservation.clientId || reservation.id;
        if (!accumulator[key]) {
          accumulator[key] = { name: reservation.clientName || 'Cliente', reservas: 0, valor: 0 };
        }
        accumulator[key].reservas += 1;
        accumulator[key].valor += Number(reservation.totalAmount || 0);
        return accumulator;
      },
      {}
    )
  )
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  const alerts: AlertItem[] = [
    ...futureReservations
      .filter(reservation => reservation.pendingValue > 0.01 && reservation.eventDateTime <= next14Days)
      .slice(0, 3)
      .map(reservation => ({
        id: `alert-res-${reservation.id}`,
        title: `Cobro pendiente en reserva #${reservation.id}`,
        description: `${reservation.clientName} tiene ${fullCurrency(
          reservation.pendingValue
        )} por pagar y el evento es el ${formatCompactDate(reservation.eventDateTime)}.`,
        tone: 'danger' as const,
      })),
    ...pendingQuotes
      .filter(quotation => {
        const createdAt = new Date(quotation.createdAt);
        const days = Math.floor((today.getTime() - createdAt.getTime()) / 86400000);
        return days >= 7;
      })
      .slice(0, 2)
      .map(quotation => ({
        id: `alert-quote-${quotation.id}`,
        title: `Cotizacion abierta desde hace varios dias`,
        description: `${quotation.clientName} sigue en espera con una propuesta de ${fullCurrency(
          quotation.totalAmount
        )}.`,
        tone: 'warning' as const,
      })),
    ...pendingRehearsals
      .filter(rehearsal => rehearsal.eventDateTime <= next14Days)
      .slice(0, 2)
      .map(rehearsal => ({
        id: `alert-ens-${rehearsal.id}`,
        title: `Ensayo proximo`,
        description: `${rehearsal.title} esta programado para el ${formatCompactDate(
          rehearsal.eventDateTime
        )}.`,
        tone: 'success' as const,
      })),
  ].slice(0, 6);

  const currentMonthAgenda = futureReservations.filter(
    reservation => reservation.eventDateTime >= currentMonthStart && reservation.eventDateTime <= currentMonthEnd
  ).length;

  const next7DaysAgenda = agendaItems.filter(item => item.date <= next30Days).length;

  if (loading) return <LoadingDashboard />;

  return (
    <div
      className="min-h-screen space-y-6 text-slate-900"
      style={{
        backgroundImage:
          'radial-gradient(circle at top left, rgba(206,17,38,0.12), transparent 28%), radial-gradient(circle at top right, rgba(245,158,11,0.10), transparent 22%), linear-gradient(180deg, #fffaf8 0%, #f8fafc 32%, #f8fafc 100%)',
      }}
    >
      <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 px-6 py-8 text-white shadow-[0_30px_90px_rgba(15,23,42,0.28)] md:px-8 md:py-9">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-0 h-48 w-48 rounded-full bg-red-500/20 blur-[90px]" />
          <div className="absolute right-0 top-10 h-40 w-40 rounded-full bg-amber-400/15 blur-[80px]" />
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-red-100">
              <Sparkles size={14} className="text-red-200" />
              Dashboard ejecutivo
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">
              Un panel comercial y operativo conectado a tu sistema
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 md:text-base">
              Aqui ves ingresos, reservas, cotizaciones, ensayos y alertas reales del negocio en
              una sola vista. La idea es que este dashboard ya sirva para decidir, no solo para
              decorar.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                {formatFullDate(today)}
              </div>
              <div className="rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100">
                {currentMonthAgenda} eventos en agenda este mes
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[440px]">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/6 p-5 backdrop-blur-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Pipeline activo
              </p>
              <p className="mt-3 text-3xl font-black">{shortCurrency(pipelineValue)}</p>
              <p className="mt-2 text-sm text-slate-300">
                Entre cotizaciones abiertas y saldos pendientes.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-emerald-400/15 bg-emerald-400/10 p-5 backdrop-blur-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-200">
                Cobro sano
              </p>
              <p className="mt-3 text-3xl font-black">{formatPercent(paymentHealth)}</p>
              <p className="mt-2 text-sm text-emerald-100/80">
                Reservas activas con pago completo.
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-amber-300/15 bg-amber-300/10 p-5 backdrop-blur-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-100">
                Conversion comercial
              </p>
              <p className="mt-3 text-3xl font-black">{formatPercent(quoteConversion)}</p>
              <p className="mt-2 text-sm text-amber-50/80">
                Cotizaciones que ya terminaron en reserva.
              </p>
            </div>
          </div>
        </div>
      </section>

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800 shadow-sm">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium">{errorMessage}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Ingresos del mes"
          value={shortCurrency(currentMonthRevenue)}
          tone="red"
          meta={<TrendBadge value={revenueDelta} suffix="vs mes pasado" />}
        />
        <StatCard
          icon={CalendarDays}
          label="Reservas activas"
          value={String(activeReservations.length)}
          tone="slate"
          meta={<TrendBadge value={reservationsDelta} suffix="en agenda mensual" />}
        />
        <StatCard
          icon={HandCoins}
          label="Saldo por cobrar"
          value={shortCurrency(receivableBalance)}
          tone="amber"
          meta={
            <p className="text-sm font-medium text-slate-500">
              {futureReservations.filter(reservation => reservation.pendingValue > 0.01).length} reservas con
              cobro abierto.
            </p>
          }
        />
        <StatCard
          icon={Users}
          label="Base de clientes"
          value={String(dashboard.clientsCount)}
          tone="emerald"
          meta={
            <p className="text-sm font-medium text-slate-500">
              Ticket promedio actual: <span className="font-black text-slate-800">{shortCurrency(averageTicket)}</span>
            </p>
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <DashboardCard
          title="Ingresos por mes"
          subtitle="Comportamiento real de ventas registradas durante los ultimos 6 meses."
          actions={
            <button
              onClick={() => {
                setRefreshing(true);
                setReloadToken(current => current + 1);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-600 transition-colors hover:border-red-200 hover:text-red-600"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Actualizar
            </button>
          }
        >
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Mes actual</p>
              <p className="mt-2 text-xl font-black text-slate-900">{fullCurrency(currentMonthRevenue)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Mes anterior</p>
              <p className="mt-2 text-xl font-black text-slate-900">{fullCurrency(previousMonthRevenue)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Ticket promedio</p>
              <p className="mt-2 text-xl font-black text-slate-900">{fullCurrency(averageTicket)}</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={310}>
            <AreaChart data={monthlyRevenueData} margin={{ top: 8, right: 10, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.red} stopOpacity={0.24} />
                  <stop offset="95%" stopColor={COLORS.red} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={COLORS.slateLine} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.slate, fontSize: 11 }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: COLORS.slate, fontSize: 11 }}
                tickFormatter={shortCurrency}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="ingresos"
                stroke={COLORS.red}
                strokeWidth={3}
                fill="url(#dashboardRevenue)"
                name="Ingresos"
              />
            </AreaChart>
          </ResponsiveContainer>
        </DashboardCard>

        <DashboardCard
          title="Mix de reservas"
          subtitle="Distribucion real por estado para saber si la operacion viene sana o trabada."
        >
          <div className="grid gap-5 md:grid-cols-[1fr_180px] md:items-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={reservationStatusData}
                  dataKey="value"
                  innerRadius={68}
                  outerRadius={106}
                  paddingAngle={5}
                >
                  {reservationStatusData.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-3">
              {reservationStatusData.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  No hay reservas suficientes para construir esta grafica.
                </p>
              ) : (
                reservationStatusData.map((entry, index) => (
                  <div key={entry.name} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        <span className="text-sm font-semibold text-slate-600">{entry.name}</span>
                      </div>
                      <span className="text-lg font-black text-slate-900">{entry.value}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DashboardCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <DashboardCard
          title="Flujo comercial semanal"
          subtitle="Cuantas cotizaciones, reservas y ventas se movieron en las ultimas 8 semanas."
        >
          <ResponsiveContainer width="100%" height={330}>
            <BarChart data={weeklyFlowData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={COLORS.slateLine} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.slate, fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.slate, fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="Cotizaciones" fill={COLORS.amber} radius={[8, 8, 0, 0]} />
              <Bar dataKey="Reservas" fill={COLORS.red} radius={[8, 8, 0, 0]} />
              <Bar dataKey="Ventas" fill={COLORS.ink} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </DashboardCard>

        <DashboardCard
          title="Tipos de evento mas pedidos"
          subtitle="Top actual segun las reservas registradas."
        >
          <ResponsiveContainer width="100%" height={330}>
            <BarChart
              data={topEventTypesData}
              layout="vertical"
              margin={{ top: 4, right: 20, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke={COLORS.slateLine} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: COLORS.slate, fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: COLORS.slate, fontSize: 11 }}
                width={92}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" name="Solicitudes" fill={COLORS.red} radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </DashboardCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.9fr]">
        <DashboardCard
          title="Presion de agenda"
          subtitle="Carga de reservas y ensayos por dia de la semana."
        >
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={weekdayRadarData}>
              <PolarGrid stroke={COLORS.slateLine} />
              <PolarAngleAxis dataKey="day" tick={{ fill: COLORS.slate, fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: COLORS.slate, fontSize: 10 }} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Radar
                dataKey="Agenda"
                stroke={COLORS.red}
                fill={COLORS.red}
                fillOpacity={0.2}
                strokeWidth={2.5}
                name="Agenda"
              />
            </RadarChart>
          </ResponsiveContainer>
        </DashboardCard>

        <DashboardCard
          title="Mapa de ocupacion"
          subtitle="Reserva, ensayo o cotizacion futura por dia y franja horaria."
        >
          <Heatmap matrix={occupancyMatrix} />
        </DashboardCard>

        <DashboardCard
          title="Salud del negocio"
          subtitle="Tres señales rapidas para saber donde enfocar."
        >
          <div className="space-y-4">
            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Cobro completo</p>
                    <p className="mt-1 text-2xl font-black text-slate-900">{formatPercent(paymentHealth)}</p>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                {paidReservationsCount} de {activeReservations.length} reservas activas ya estan pagadas.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Cotizaciones abiertas</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{pendingQuotes.length}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                Hay {shortCurrency(pendingQuotes.reduce((sum, quotation) => sum + Number(quotation.totalAmount || 0), 0))} en oportunidad comercial pendiente.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-700">
                  <Mic2 size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Ensayos pendientes</p>
                  <p className="mt-1 text-2xl font-black text-slate-900">{pendingRehearsals.length}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                {pendingRehearsals.filter(rehearsal => rehearsal.eventDateTime <= next14Days).length} caen dentro de las proximas dos semanas.
              </p>
            </div>
          </div>
        </DashboardCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <DashboardCard
          title="Agenda inmediata"
          subtitle="Lo que viene en reservas y ensayos dentro del flujo operativo."
        >
          <div className="space-y-3">
            {agendaItems.length === 0 ? (
              <div className="rounded-[1.5rem] bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                No hay eventos proximos cargados en este momento.
              </div>
            ) : (
              agendaItems.map(item => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-200/80 bg-slate-50/70 px-4 py-4 md:flex-row md:items-center"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                      item.kind === 'reserva'
                        ? 'bg-red-500/10 text-red-600'
                        : 'bg-cyan-500/10 text-cyan-700'
                    }`}
                  >
                    {item.kind === 'reserva' ? <CalendarRange size={20} /> : <Mic2 size={20} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-800">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-3 md:flex-col md:items-end">
                    <p className="text-sm font-bold text-slate-700">{formatCompactDate(item.date)}</p>
                    <StatusPill status={item.status} kind="agenda" />
                  </div>
                </div>
              ))
            )}
          </div>
        </DashboardCard>

        <DashboardCard
          title="Alertas y oportunidades"
          subtitle="Cobros, propuestas y tareas que merecen atencion antes que escalen."
        >
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="rounded-[1.5rem] bg-emerald-50 px-5 py-8 text-center text-sm font-medium text-emerald-700">
                No hay alertas criticas ahora mismo. El tablero se ve estable.
              </div>
            ) : (
              alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`rounded-[1.5rem] border px-4 py-4 ${
                    alert.tone === 'danger'
                      ? 'border-red-200 bg-red-50'
                      : alert.tone === 'warning'
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-emerald-200 bg-emerald-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        alert.tone === 'danger'
                          ? 'bg-red-100 text-red-600'
                          : alert.tone === 'warning'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-emerald-100 text-emerald-600'
                      }`}
                    >
                      {alert.tone === 'success' ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <AlertTriangle size={18} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{alert.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{alert.description}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DashboardCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <DashboardCard
          title="Actividad reciente"
          subtitle="Ultimos movimientos registrados entre reservas, cotizaciones y ventas."
        >
          <div className="space-y-3">
            {activityFeed.length === 0 ? (
              <div className="rounded-[1.5rem] bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                Aun no hay actividad reciente para mostrar.
              </div>
            ) : (
              activityFeed.map(item => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-200/80 bg-white px-4 py-4 md:flex-row md:items-center"
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                      item.kind === 'venta'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : item.kind === 'cotizacion'
                        ? 'bg-amber-500/10 text-amber-600'
                        : 'bg-red-500/10 text-red-600'
                    }`}
                  >
                    {item.kind === 'venta' ? (
                      <Wallet size={19} />
                    ) : item.kind === 'cotizacion' ? (
                      <FileText size={19} />
                    ) : (
                      <Activity size={19} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-800">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.subtitle}</p>
                  </div>

                  <div className="md:text-right">
                    <p className="text-sm font-bold text-slate-700">{formatCompactDate(item.date)}</p>
                    {typeof item.amount === 'number' && (
                      <p className="mt-1 text-sm font-black text-slate-900">{fullCurrency(item.amount)}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </DashboardCard>

        <DashboardCard
          title="Clientes con mayor valor"
          subtitle="Ranking simple por reservas registradas y valor acumulado."
        >
          <div className="space-y-4">
            {topClients.length === 0 ? (
              <div className="rounded-[1.5rem] bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                Todavia no hay suficiente historico para construir el ranking.
              </div>
            ) : (
              topClients.map((client, index) => {
                const maxValue = topClients[0]?.valor || 1;
                const width = Math.max(10, (client.valor / maxValue) * 100);

                return (
                  <div key={`${client.name}-${index}`} className="rounded-[1.5rem] bg-slate-50 px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-800">{client.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {client.reservas} reserva(s) · {fullCurrency(client.valor)}
                        </p>
                      </div>
                      <span className="text-sm font-black text-slate-400">#{index + 1}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-600 to-amber-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DashboardCard>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-[0_14px_42px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cierre comercial</p>
              <p className="mt-1 text-xl font-black text-slate-900">{formatPercent(quoteConversion)}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            {convertedQuotes.length} de {quotations.length} cotizaciones terminaron en una reserva.
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-[0_14px_42px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
              <CalendarClock size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Agenda 30 dias</p>
              <p className="mt-1 text-xl font-black text-slate-900">{next7DaysAgenda}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Entre reservas y ensayos visibles en el corto plazo.
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-[0_14px_42px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Reservas pagadas</p>
              <p className="mt-1 text-xl font-black text-slate-900">{paidReservationsCount}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Del total activo, {formatPercent(paymentHealth)} ya no tiene saldo pendiente.
          </p>
        </div>
      </section>

      {refreshing && (
        <div className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-3 rounded-full border border-white/70 bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-2xl shadow-slate-900/20">
          <LoaderCircle size={16} className="animate-spin" />
          Actualizando dashboard...
        </div>
      )}
    </div>
  );
};
