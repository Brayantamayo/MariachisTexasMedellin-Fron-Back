import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { Quotation, Rehearsal, Reservation, Service, Song } from '@/types';
import { reservaService } from '../../reservas/services/reservaService';
import { dashboardService } from '../services/dashboardService';
import { ventaService, Sale } from '../../ventas/services/ventaService';
import { cotizacionService } from '../../cotizaciones/services/cotizacionService';
import { rehearsalService } from '../../ensayos/services/rehearsalService';
import { servicesService } from '../../servicio/services/servicesService';
import { repertoireService } from '../../repertoire/services/repertoireService';
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
  Wallet,
  Zap,
} from 'lucide-react';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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

Chart.register(...registerables);

const COLORS = {
  ink: '#0f0f0f',
  slate: '#64748b',
  slateSoft: '#cbd5e1',
  slateLine: '#e2e8f0',
  white: '#ffffff',
  red: '#ce1126',
  redDeep: '#8b0000',
  redSoft: '#fee2e2',
  amber: '#f59e0b',
  amberSoft: '#fef3c7',
  emerald: '#10b981',
  emeraldSoft: '#d1fae5',
  teal: '#0d9488',
  tealSoft: '#ccfbf1',
};

const CHART_COLORS = [COLORS.red, COLORS.ink, COLORS.amber, COLORS.emerald, COLORS.teal];
const WEEK_DAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
const SLOT_LABELS = ['Mañana', 'Tarde', 'Noche', 'Madrugada'];

interface DashboardData {
  reservations: Reservation[];
  sales: Sale[];
  quotations: Quotation[];
  rehearsals: Rehearsal[];
  services: Service[];
  songs: Song[];
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

interface HeroMousePos {
  x: number;
  y: number;
}

type DashboardSectionId =
  | 'executive'
  | 'commercial'
  | 'operations'
  | 'alerts'
  | 'clients';

interface DashboardSectionTabItem {
  id: DashboardSectionId;
  label: string;
  icon: React.ElementType;
}

interface RankedItem {
  name: string;
  value: number;
  subtitle?: string;
}

interface CalendarEventChip {
  id: string;
  label: string;
  tone: 'reservation' | 'quotation' | 'rehearsal';
}

interface CalendarDayCell {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  items: CalendarEventChip[];
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

const endOfWeekGrid = (base: Date) => {
  const date = startOfWeek(base);
  date.setDate(date.getDate() + 41);
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

const formatMonthName = (date: Date) =>
  new Intl.DateTimeFormat('es-CO', {
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
  if (!date) return new Date();
  const safeTime = time && time.length >= 5 ? time.slice(0, 5) : '00:00';
  const dt = new Date(`${date}T${safeTime}:00`);
  return isNaN(dt.getTime()) ? new Date() : dt;
};

const reservationDate = (reservation: Reservation) =>
  toDateTime(reservation.eventDate, reservation.startTime || reservation.eventTime);

const rehearsalDate = (rehearsal: Rehearsal) =>
  toDateTime(rehearsal.date || rehearsal.fecha || '', rehearsal.time || rehearsal.hora);

const getReservationPending = (reservation: Reservation) =>
  Math.max(0, Number(reservation.pendingBalance ?? reservation.totalAmount - reservation.paidAmount));

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

const normalizeLabel = (value?: string | null, fallback = 'Sin definir') => {
  const cleaned = (value || '').trim();
  return cleaned || fallback;
};

const scaleWeightedEntries = (
  entries: { name: string; weight: number }[],
  total: number
) => {
  const safeTotal = Number(total || 0);
  const weightSum = entries.reduce((sum, entry) => sum + Number(entry.weight || 0), 0);

  if (safeTotal <= 0) return [];

  if (weightSum <= 0) {
    const evenShare = safeTotal / Math.max(entries.length, 1);
    return entries.map(entry => ({
      name: normalizeLabel(entry.name, 'Servicio general'),
      value: evenShare,
    }));
  }

  return entries.map(entry => ({
    name: normalizeLabel(entry.name, 'Servicio general'),
    value: (safeTotal * Number(entry.weight || 0)) / weightSum,
  }));
};

const tooltipFormatter = (value: number, name: string) => {
  if (name.toLowerCase().includes('ingresos') || name.toLowerCase().includes('ticket')) {
    return [fullCurrency(value), name];
  }
  return [value, name];
};

/* ─── Custom Tooltip ─── */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-2xl shadow-slate-900/15 backdrop-blur-xl">
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => (
          <div key={`${entry.name}-${index}`} className="flex items-center justify-between gap-5 text-xs">
            <span className="flex items-center gap-2 text-slate-500">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-black text-slate-800">
              {tooltipFormatter(Number(entry.value), entry.name)[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Dashboard Card ─── */
const DashboardCard: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  accent?: boolean;
}> = ({ title, subtitle, children, actions, accent = false }) => (
  <section className="group relative min-w-0 overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white/80 p-5 shadow-[0_8px_32px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-all duration-300 hover:shadow-[0_16px_48px_rgba(15,23,42,0.10)] hover:-translate-y-0.5 md:p-6">
    {accent && (
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />
    )}
    <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-100/30 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    <div className="relative mb-5 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">{title}</h3>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400">{subtitle}</p>}
      </div>
      {actions}
    </div>
    <div className="relative">{children}</div>
  </section>
);

/* ─── Section Header ─── */
const DashboardSectionHeader: React.FC<{
  eyebrow: string;
  title: string;
  subtitle: string;
}> = ({ eyebrow, title, subtitle }) => (
  <div className="flex flex-col gap-2 px-1 pb-2">
    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-red-200/60 bg-red-50/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-red-600">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      {eyebrow}
    </span>
    <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
      <h2 className="text-[1.85rem] font-black tracking-[-0.03em] text-slate-900 md:text-[2.1rem]">{title}</h2>
      <p className="max-w-xl text-sm leading-relaxed text-slate-400 xl:text-right">{subtitle}</p>
    </div>
  </div>
);

/* ─── Section Tabs ─── */
const DashboardSectionTabs: React.FC<{
  items: DashboardSectionTabItem[];
  activeSection: DashboardSectionId;
  onSelect: (id: DashboardSectionId) => void;
}> = ({ items, activeSection, onSelect }) => (
  <div className="sticky top-3 z-20">
    <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white/90 px-2 py-2 shadow-[0_8px_32px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="flex min-w-max items-center gap-1.5">
        {items.map(item => {
          const active = item.id === activeSection;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.16em] transition-all duration-200 ${
                active
                  ? 'bg-slate-950 text-white shadow-[0_4px_16px_rgba(15,23,42,0.25)]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon size={13} />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

/* ─── Chart Canvas ─── */
const ChartCanvas: React.FC<{
  config?: ChartConfiguration;
  height: number;
  emptyMessage: string;
}> = ({ config, height, emptyMessage }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !config) return undefined;
    const chart = new Chart(canvasRef.current, config);
    return () => chart.destroy();
  }, [config]);

  if (!config) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl bg-slate-50 px-4 text-center text-sm text-slate-400"
        style={{ height }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
};

/* ─── Trend Badge ─── */
const TrendBadge: React.FC<{ value: number; suffix: string }> = ({ value, suffix }) => {
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
        positive
          ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
          : 'border-red-200 bg-red-50 text-red-600'
      }`}
    >
      <Icon size={11} />
      {Math.abs(Math.round(value))}% {suffix}
    </span>
  );
};

/* ─── Stat Card ─── */
const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  tone: 'red' | 'amber' | 'emerald' | 'slate';
  meta: React.ReactNode;
}> = ({ icon: Icon, label, value, tone, meta }) => {
  const iconStyles = {
    red: 'bg-red-50 text-red-600 border-red-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200/60 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-all duration-300 hover:shadow-[0_12px_36px_rgba(15,23,42,0.09)] hover:-translate-y-0.5">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-50/60 to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${iconStyles[tone]}`}>
          <Icon size={18} />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <p className="mt-2 text-[2.15rem] font-black tracking-[-0.04em] text-slate-900 leading-none">{value}</p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100">{meta}</div>
    </div>
  );
};

/* ─── Ranked List Card ─── */
const RankedListCard: React.FC<{
  icon: React.ElementType;
  label: string;
  items: RankedItem[];
  tone: 'red' | 'amber' | 'emerald' | 'slate';
  emptyMessage: string;
}> = ({ icon: Icon, label, items, tone, emptyMessage }) => {
  const iconStyles = {
    red: 'bg-red-50 text-red-600 border-red-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/60 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${iconStyles[tone]}`}>
          <Icon size={18} />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <p className="mt-2 text-[2.15rem] font-black tracking-[-0.04em] text-slate-900 leading-none">{items[0]?.value ?? 0}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 text-sm text-slate-400">{emptyMessage}</p>
        ) : (
          items.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className="flex items-center justify-between gap-3 rounded-xl bg-slate-50/80 px-3.5 py-2.5"
            >
              <div className="min-w-0 flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-black text-slate-600 shadow-sm border border-slate-100">
                  {index + 1}
                </span>
                <div>
                  <p className="truncate text-sm font-semibold text-slate-700">{item.name}</p>
                  {item.subtitle && <p className="text-xs text-slate-400">{item.subtitle}</p>}
                </div>
              </div>
              <span className="shrink-0 text-base font-black text-slate-900">{item.value}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/* ─── Heatmap ─── */
const Heatmap = React.memo(({ matrix }: { matrix: any[][][] }) => {
  const getCellBg = (items: any[]): string => {
    if (items.length === 0) return 'bg-slate-50/40 border-slate-100/50';
    return 'bg-white/80 border-slate-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)] backdrop-blur-sm';
  };

  return (
    <div className="overflow-x-auto pb-4 -mx-1 px-1 custom-scrollbar">
      <div className="grid min-w-[900px] grid-cols-[100px_repeat(7,minmax(0,1fr))] gap-3 p-1">
        <div />
        {WEEK_DAYS.map(day => (
          <div key={day} className="flex flex-col items-center pb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{day}</span>
            <div className="mt-1 h-1 w-1 rounded-full bg-slate-200" />
          </div>
        ))}
        {SLOT_LABELS.map((slot, rowIndex) => (
          <React.Fragment key={slot}>
            <div className="flex flex-col justify-center py-2 pr-4 border-r border-slate-100/50">
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-900 leading-tight">{slot}</span>
              <span className="mt-0.5 text-[7px] font-bold uppercase tracking-wider text-slate-400">Bloque</span>
            </div>
            {WEEK_DAYS.map((_, colIndex) => {
              const items = matrix[rowIndex]?.[colIndex] ?? [];
              const count = items.length;
              
              return (
                <div
                  key={`${slot}-${colIndex}`}
                  className={`group relative flex flex-col min-h-[100px] rounded-[1.2rem] border p-2.5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${getCellBg(items)}`}
                >
                  {count > 0 ? (
                    <div className="flex flex-col h-full">
                      <div className="mb-2 flex items-center justify-between">
                        <div className={`flex h-4 w-4 items-center justify-center rounded-lg ${count > 2 ? 'bg-red-500 text-white' : 'bg-red-50 text-red-500'}`}>
                          <Zap size={9} strokeWidth={3} />
                        </div>
                        <span className="text-[8px] font-black text-slate-400 tracking-wider">{count} E</span>
                      </div>
                      
                      <div className="space-y-1">
                        {items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 rounded-xl bg-slate-50/60 px-2 py-1 border border-slate-100 hover:border-red-200 transition-all">
                            <div className={`h-1 w-1 rounded-full shrink-0 ${item.type === 'reserva' ? 'bg-red-500' : item.type === 'cotizacion' ? 'bg-amber-500' : 'bg-teal-500'}`} />
                            <span className="truncate text-[9px] font-black text-slate-700 tracking-tight">
                              {item.name}
                            </span>
                          </div>
                        ))}
                      </div>

                      {count > 3 && (
                        <div className="mt-auto pt-1 flex items-center justify-center border-t border-slate-50">
                          <span className="text-[8px] font-black text-slate-400 tracking-[0.1em]">+ {count - 3}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center opacity-30">
                      <div className="h-1 w-1 rounded-full bg-slate-100" />
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
});

/* ─── Monthly Calendar ─── */
const MonthlyCalendarBoard = React.memo(({ monthDate, cells }: { monthDate: Date; cells: CalendarDayCell[] }) => (
  <div className="overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white shadow-xl shadow-slate-200/30">
    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/30 px-6 py-5">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Calendario Operativo</p>
        <p className="mt-1 text-xl font-black tracking-tight text-slate-900">
          {monthDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }).toUpperCase()}
        </p>
      </div>
      <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />Reserva
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]" />Cotización
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.4)]" />Ensayo
        </span>
      </div>
    </div>

    <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80">
      {WEEK_DAYS.map(day => (
        <div key={day} className="px-2 py-3 text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
          {day}
        </div>
      ))}
    </div>

    <div className="grid grid-cols-7">
      {cells.map(cell => {
        const visibleItems = cell.items.slice(0, 3);
        const remainingItems = Math.max(0, cell.items.length - visibleItems.length);

        return (
          <div
            key={cell.date.toISOString()}
            className={`min-h-[140px] border-b border-r border-slate-100 p-3 transition-colors hover:bg-slate-50/30 ${
              cell.inMonth ? 'bg-white' : 'bg-slate-50/40 opacity-40'
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm font-black transition-all ${
                  cell.isToday
                    ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/20 scale-110'
                    : cell.inMonth
                    ? 'text-slate-800'
                    : 'text-slate-400'
                }`}
              >
                {cell.date.getDate()}
              </span>
              {cell.items.length > 0 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 border border-slate-200">
                  {cell.items.length}
                </span>
              )}
            </div>
            <div className="space-y-1">
              {visibleItems.map(item => (
                <div
                  key={item.id}
                  className={`truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                    cell.isPast
                      ? 'bg-slate-100 text-slate-400'
                      : item.tone === 'reservation'
                      ? 'bg-red-50 text-red-700'
                      : item.tone === 'quotation'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-teal-50 text-teal-700'
                  }`}
                  title={item.label}
                >
                  {item.label}
                </div>
              ))}
              {remainingItems > 0 && (
                <p className="text-[10px] font-semibold text-slate-400">+{remainingItems} más</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </div>
));

/* ─── Status Pill ─── */
const StatusPill: React.FC<{ status: string; kind: 'reservation' | 'quotation' | 'agenda' }> = ({
  status,
  kind,
}) => {
  const normalized =
    kind === 'quotation' ? normalizeQuotationStatus(status) : normalizeReservationStatus(status);

  const styles =
    normalized === 'CONFIRMADA' || normalized === 'CONVERTIDA'
      ? 'bg-emerald-50 text-emerald-700'
      : normalized === 'ANULADA'
      ? 'bg-slate-100 text-slate-500'
      : normalized === 'REPROGRAMADA'
      ? 'bg-teal-50 text-teal-700'
      : normalized === 'PENDIENTE' || normalized === 'EN_ESPERA'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-slate-100 text-slate-500';

  const label =
    normalized === 'CONFIRMADA' ? 'Confirmada'
    : normalized === 'CONVERTIDA' ? 'Convertida'
    : normalized === 'REPROGRAMADA' ? 'Reprogramada'
    : normalized === 'ANULADA' ? 'Anulada'
    : normalized === 'EN_ESPERA' ? 'En espera'
    : normalized === 'LISTO' ? 'Listo'
    : normalized === 'PENDIENTE' ? 'Pendiente'
    : status;

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${styles}`}>
      {label}
    </span>
  );
};

/* ─── Loading ─── */
const LoadingDashboard = () => (
  <div className="space-y-5">
    <div className="rounded-[2.5rem] bg-slate-950 px-6 py-8">
      <div className="h-3 w-40 animate-pulse rounded-full bg-white/10" />
      <div className="mt-4 h-10 w-72 animate-pulse rounded-full bg-white/10" />
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/8" />
        ))}
      </div>
    </div>
    <div className="grid gap-3 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-36 animate-pulse rounded-[1.75rem] bg-white/70 border border-slate-100" />
      ))}
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════
   DASHBOARD PAGE
   ════════════════════════════════════════════════════════ */
export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<DashboardSectionId>('executive');
  const [dashboard, setDashboard] = useState<DashboardData>({
    reservations: [],
    sales: [],
    quotations: [],
    rehearsals: [],
    services: [],
    songs: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /* ── Hero mouse-follow state ── */
  const heroRef = useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = useState<HeroMousePos>({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const animFrameRef = useRef<number>(0);
  const targetPos = useRef<HeroMousePos>({ x: 50, y: 50 });
  const currentPos = useRef<HeroMousePos>({ x: 50, y: 50 });

  /* Global tracking to ensure it works across tabs, but visually restricted to Hero */
  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      
      // Check if mouse is inside hero bounds
      const inside = (
        e.clientX >= rect.left && 
        e.clientX <= rect.right && 
        e.clientY >= rect.top && 
        e.clientY <= rect.bottom
      );
      
      setIsHovered(inside);
      
      if (inside) {
        targetPos.current = {
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        };
      }
    };

    window.addEventListener('mousemove', handleGlobalMove);

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const tick = () => {
      currentPos.current.x = lerp(currentPos.current.x, targetPos.current.x, 0.15);
      currentPos.current.y = lerp(currentPos.current.y, targetPos.current.y, 0.15);
      setMousePos({ x: currentPos.current.x, y: currentPos.current.y });
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  /* ── Data loading ── */
  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      
      const reservations = await reservaService.getReservations();
      const sales = await ventaService.getSales();

      // ✅ CORRECCIÓN: getClients() puede retornar { clients: User[], pagination: any }
      const clientsResponse = await clientService.getClients();
      const clients = Array.isArray(clientsResponse) ? clientsResponse : clientsResponse.clients;

      const activeRes = reservations.filter(r => r.status === 'Confirmado' || r.status === 'Pendiente');
      const totalIncome = sales.reduce((acc, curr) => acc + curr.amount, 0);
      const pending = activeRes.reduce((acc, curr) => acc + (curr.totalAmount - curr.paidAmount), 0);
      
      let relevantEvents = [...activeRes];
      relevantEvents.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

      // 1. Ingresos Mensuales (Últimos 6 meses)
      const last6Months = Array.from({ length: 6 }, (_, i) => {
          const d = new Date();
          d.setDate(1);
          d.setMonth(d.getMonth() - i);
          return {
            label: d.toLocaleString('es-CO', { month: 'short' }),
            month: d.getMonth(),
            year: d.getFullYear()
          };
      }).reverse();

      const monthlyIncome = last6Months.map(m => {
          const monthlySales = sales.filter(s => {
              const d = new Date(s.date);
              return d.getMonth() === m.month && d.getFullYear() === m.year;
          });
          const total = monthlySales.reduce((sum, s) => sum + s.amount, 0);
          return { name: m.label, ingresos: total };
      });

      // 2. Tipos de Evento
      const eventTypesCount: Record<string, number> = {};
      reservations.forEach(r => {
          const type = r.eventType || 'Otro';
          eventTypesCount[type] = (eventTypesCount[type] || 0) + 1;
      });
      const eventTypeData = Object.keys(eventTypesCount).map(type => ({
          name: type,
          value: eventTypesCount[type]
      }));

      // 3. Tendencia Semanal (Últimas 4 semanas)
      const weeklyTrendData = [];
      for (let i = 3; i >= 0; i--) {
          const startOfWeek = new Date();
          startOfWeek.setDate(startOfWeek.getDate() - (i * 7) - startOfWeek.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(endOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);

          const weekReservations = reservations.filter(r => {
              const d = new Date(r.createdAt);
              return d >= startOfWeek && d <= endOfWeek;
          });

          weeklyTrendData.push({
              name: `Sem ${4-i}`,
              confirmadas: weekReservations.filter(r => r.status === 'Confirmado').length,
              pendientes: weekReservations.filter(r => r.status === 'Pendiente').length
          });
      }

      setStats({
        income: totalIncome,
        activeReservations: activeRes.length,
        pendingBalance: pending,
        totalClients: clients.length, // ✅ Ahora clients siempre es un array
        upcomingEvents: relevantEvents.slice(0, 5),
        recentActivity: reservations.slice(0, 5),
        monthlyIncomeData: monthlyIncome,
        eventTypeData: eventTypeData,
        reservationStatusData: weeklyTrendData
      });

      setLoading(false);
      setTimeout(() => setShowWelcomeToast(true), 500);
      setTimeout(() => setShowWelcomeToast(false), 5000);
    };

    loadDashboardData();
  }, [user]);

  if (loading) {
      return <div className="p-10 text-center text-slate-400">Cargando tablero...</div>;
  }

  const WelcomeToast = () => (
      createPortal(
        <div className={`fixed top-6 right-6 z-[200] transition-all duration-500 transform ${showWelcomeToast ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
            <div className="flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border border-secondary-100 bg-white/95 backdrop-blur-md min-w-[320px]">
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-secondary-100 text-secondary-600">
                    <CheckCircle size={20} strokeWidth={3} />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-sm text-secondary-950">¡Bienvenido, {user?.name}!</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
                        Sesión iniciada correctamente.
                    </p>
                </div>
                <button onClick={() => setShowWelcomeToast(false)} className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg">
                    <X size={18} />
                </button>
            </div>
        </div>,
        document.body
      )
  );

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      <WelcomeToast />
      
      {/* Welcome Header */}
      <div className="flex justify-between items-end">
          <div>
              <h1 className="text-3xl font-serif font-bold text-slate-800">Hola, {user?.name}</h1>
              <p className="text-slate-500 mt-1">Aquí tienes el resumen financiero y operativo de hoy.</p>
          </div>
          <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">FECHA ACTUAL</p>
              <p className="text-lg font-bold text-slate-700">{new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard 
              title="Ingresos Mes" 
              value={`$${stats.income.toLocaleString()}`} 
              icon={TrendingUp} 
              color="emerald" 
              trend="+12% vs mes anterior"
          />
          <KpiCard 
              title="Reservas Activas" 
              value={stats.activeReservations.toString()} 
              icon={Calendar} 
              color="red" 
              trend="3 eventos esta semana"
          />
          <KpiCard 
              title="Saldo por Cobrar" 
              value={`$${stats.pendingBalance.toLocaleString()}`} 
              icon={DollarSign} 
              color="dark" 
              trend="Gestión de cobro requerida"
          />
          <KpiCard 
              title="Total Clientes" 
              value={stats.totalClients.toString()} 
              icon={Users} 
              color="gray" 
              trend="+2 nuevos esta semana"
          />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Gráfico 1: Ingresos Mensuales */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                  <div>
                      <h3 className="font-serif font-bold text-slate-800 text-lg flex items-center gap-2">
                          <BarChart2 size={20} className="text-primary-600" />
                          Ingresos Mensuales
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Comportamiento de ventas últimos 6 meses</p>
                  </div>
              </div>
              <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.monthlyIncomeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(value) => `$${value / 1000}k`} />
                          <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                          <Bar dataKey="ingresos" fill="#ce1126" radius={[6, 6, 0, 0]} barSize={40} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

                    <div className="space-y-2">
                      {topEventTypesData.length === 0 ? (
                        <p className="rounded-xl bg-slate-50 px-4 py-4 text-sm text-slate-400">Sin reservas suficientes.</p>
                      ) : (
                        topEventTypesData.map((entry, i) => (
                          <div key={entry.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                              <span className="truncate text-sm font-semibold text-slate-700">{entry.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black text-slate-900">{entry.value}</span>
                              <span className="text-[11px] text-slate-400">
                                {topEventTypesTotal > 0 ? Math.round((entry.value / topEventTypesTotal) * 100) : 0}%
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </DashboardCard>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <DashboardCard
                  title="Flujo comercial semanal"
                  subtitle="Cotizaciones, reservas y ventas en las últimas 8 semanas."
                >
                  {hasWeeklyFlowData ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={weeklyFlowData} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
                        <defs>
                          {[['weeklyQuotes', COLORS.amber], ['weeklyRes', COLORS.red], ['weeklySales', COLORS.teal]].map(([id, color]) => (
                            <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={COLORS.slateLine} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: COLORS.slate, fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: COLORS.slate, fontSize: 11 }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="Cotizaciones" stroke={COLORS.amber} strokeWidth={2} fill="url(#weeklyQuotes)" isAnimationActive={false} />
                        <Area type="monotone" dataKey="Reservas" stroke={COLORS.red} strokeWidth={2} fill="url(#weeklyRes)" isAnimationActive={false} />
                        <Area type="monotone" dataKey="Ventas" stroke={COLORS.teal} strokeWidth={2} fill="url(#weeklySales)" isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[300px] items-center justify-center rounded-xl bg-slate-50 px-4 text-center text-sm text-slate-400">
                      Aún no hay movimiento comercial suficiente en las últimas 8 semanas para dibujar este gráfico.
                    </div>
                  )}
                </DashboardCard>

                <DashboardCard
                  title="Estado de reservas activas"
                  subtitle="Cómo están distribuidas las reservas ahora mismo."
                >
                  <div className="space-y-4">
                    <ChartCanvas
                      config={reservationMixChart}
                      height={240}
                      emptyMessage="No hay reservas suficientes para construir el mix por estado."
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {reservationStatusData.map((entry, i) => (
                        <div key={entry.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                            <span className="text-xs font-semibold text-slate-600">{entry.name}</span>
                          </div>
                          <span className="text-sm font-black text-slate-900">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </DashboardCard>
              </div>
            </section>
          )}

          {/* ═══ OPERATIONS ═══ */}
          {showOperations && (
            <section className="space-y-4">
              <DashboardSectionHeader
                eyebrow="Operación"
                title="Agenda y capacidad"
                subtitle="Vista operativa: días cargados, ocupación por franjas y agenda inmediata."
              />

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.85fr)]">
                <DashboardCard
                  title="Días con mayor movimiento"
                  subtitle="Reservas y ensayos futuros por día de la semana."
                  accent
                >
                  {hasWeeklyAgendaData ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart
                        data={weeklyAgendaLoadData}
                        outerRadius="74%"
                        margin={{ top: 10, right: 24, bottom: 10, left: 24 }}
                      >
                        <PolarGrid stroke={COLORS.slateLine} />
                        <PolarAngleAxis dataKey="day" tick={{ fill: COLORS.slate, fontSize: 11 }} />
                        <PolarRadiusAxis
                          tick={{ fill: COLORS.slate, fontSize: 10 }}
                          axisLine={false}
                          allowDecimals={false}
                          domain={[0, weeklyAgendaRadiusMax]}
                          tickCount={weeklyAgendaTickCount}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Radar
                          dataKey="Reservas"
                          stroke={COLORS.red}
                          fill={COLORS.red}
                          fillOpacity={0.18}
                          strokeWidth={2.5}
                          name="Reservas"
                          isAnimationActive={false}
                        />
                        <Radar
                          dataKey="Ensayos"
                          stroke={COLORS.teal}
                          fill={COLORS.teal}
                          fillOpacity={0.15}
                          strokeWidth={2.5}
                          name="Ensayos"
                          isAnimationActive={false}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[280px] items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/80 px-8 text-center">
                      <div className="max-w-sm">
                        <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                          Sin movimiento suficiente
                        </p>
                        <p className="mt-3 text-sm leading-6 text-slate-500">
                          Aun no hay reservas ni ensayos futuros para dibujar este radar con informacion util.
                        </p>
                      </div>
                    </div>
                  )}
                </DashboardCard>

                <DashboardCard title="Salud del negocio" subtitle="Tres señales clave.">
                  <div className="space-y-3">
                    {[
                      { icon: CheckCircle2, label: 'Cobro completo', value: formatPercent(paymentHealth), desc: `${paidReservationsCount} de ${activeReservations.length} reservas pagadas`, color: 'bg-emerald-50 text-emerald-600' },
                      { icon: FileText, label: 'Cotizaciones abiertas', value: String(pendingQuotes.length), desc: `${shortCurrency(pendingQuotes.reduce((s, q) => s + Number(q.totalAmount || 0), 0))} en oportunidad`, color: 'bg-amber-50 text-amber-600' },
                      { icon: Mic2, label: 'Ensayos pendientes', value: String(pendingRehearsals.length), desc: `${pendingRehearsals.filter(r => r.eventDateTime <= next14Days).length} en las próximas 2 semanas`, color: 'bg-teal-50 text-teal-600' },
                    ].map((item, i) => (
                      <div key={i} className="rounded-xl bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}>
                              <item.icon size={18} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                              <p className="text-xl font-black text-slate-900">{item.value}</p>
                            </div>
                          </div>
                        </div>
                        <p className="mt-2 pl-[3.25rem] text-xs text-slate-400">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </DashboardCard>
              </div>

              <div className="grid gap-4 xl:grid-cols-1">
                <DashboardCard title="Agenda inmediata" subtitle="Próximos eventos.">
                  <div className="space-y-2">
                    {agendaItems.length === 0 ? (
                      <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                        No hay eventos próximos cargados.
                      </div>
                    ) : (
                      agendaItems.map(item => (
                        <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3.5 py-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.kind === 'reserva' ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-teal-600'}`}>
                            {item.kind === 'reserva' ? <CalendarRange size={17} /> : <Mic2 size={17} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-slate-800">{item.title}</p>
                            <p className="text-xs text-slate-400">{item.subtitle}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold text-slate-600">{formatCompactDate(item.date)}</p>
                            <StatusPill status={item.status} kind="agenda" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </DashboardCard>
              </div>

              <div className="w-full">
                <DashboardCard title="Mapa de ocupación" subtitle="Próximos 60 días.">
                  <Heatmap matrix={occupancyMatrix} />
                </DashboardCard>
              </div>
            </section>
          )}

          {/* ═══ ALERTS ═══ */}
          {showAlerts && (
            <section className="space-y-4">
              <DashboardSectionHeader
                eyebrow="Seguimiento"
                title="Alertas y actividad"
                subtitle="Cobros pendientes, propuestas dormidas y los últimos movimientos del sistema."
              />

              <div className="grid gap-4 xl:grid-cols-2">
                <DashboardCard title="Alertas y oportunidades" subtitle="Lo que merece atención ahora." accent>
                  <div className="space-y-2.5">
                    {alerts.length === 0 ? (
                      <div className="rounded-xl bg-emerald-50 px-4 py-8 text-center text-sm font-semibold text-emerald-700">
                        Sin alertas críticas. El tablero se ve estable.
                      </div>
                    ) : (
                      alerts.map(alert => (
                        <div
                          key={alert.id}
                          className={`rounded-xl border px-4 py-3.5 ${
                            alert.tone === 'danger' ? 'border-red-200 bg-red-50'
                            : alert.tone === 'warning' ? 'border-amber-200 bg-amber-50'
                            : 'border-emerald-200 bg-emerald-50'
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                              alert.tone === 'danger' ? 'bg-red-100 text-red-600'
                              : alert.tone === 'warning' ? 'bg-amber-100 text-amber-600'
                              : 'bg-emerald-100 text-emerald-600'
                            }`}>
                              {alert.tone === 'success' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800">{alert.title}</p>
                              <p className="mt-0.5 text-sm text-slate-600">{alert.description}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </DashboardCard>

                <DashboardCard title="Actividad reciente" subtitle="Últimos 10 movimientos registrados.">
                  <div className="space-y-2">
                    {activityFeed.length === 0 ? (
                      <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                        Sin actividad reciente.
                      </div>
                    ) : (
                      activityFeed.map(item => (
                        <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3.5 py-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            item.kind === 'venta' ? 'bg-emerald-50 text-emerald-600'
                            : item.kind === 'cotizacion' ? 'bg-amber-50 text-amber-600'
                            : 'bg-red-50 text-red-600'
                          }`}>
                            {item.kind === 'venta' ? <Wallet size={15} /> : item.kind === 'cotizacion' ? <FileText size={15} /> : <Activity size={15} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-slate-800">{item.title}</p>
                            <p className="text-xs text-slate-400">{item.subtitle}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-semibold text-slate-500">{formatCompactDate(item.date)}</p>
                            {typeof item.amount === 'number' && (
                              <p className="text-sm font-black text-slate-900">{fullCurrency(item.amount)}</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </DashboardCard>
              </div>
            </section>
          )}

          {/* ═══ CLIENTS ═══ */}
          {showClients && (
            <section className="space-y-4">
              <DashboardSectionHeader
                eyebrow="Relacionamiento"
                title="Clientes clave"
                subtitle="Ranking de valor para identificar rápidamente quién más reserva y dónde se concentra el ingreso."
              />

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { icon: TrendingUp, label: 'Cierre comercial', value: formatPercent(quoteConversion), desc: `${convertedQuotes.length} de ${quotations.length} cotizaciones → reserva`, color: 'bg-red-50 text-red-600' },
                  { icon: CalendarClock, label: 'Agenda 30 días', value: String(next7DaysAgenda), desc: 'Reservas y ensayos visibles en el corto plazo', color: 'bg-amber-50 text-amber-600' },
                  { icon: CheckCircle2, label: 'Reservas pagadas', value: String(paidReservationsCount), desc: `${formatPercent(paymentHealth)} del total activo sin saldo pendiente`, color: 'bg-emerald-50 text-emerald-600' },
                ].map((kpi, i) => (
                  <div key={i} className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)]">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${kpi.color}`}>
                        <kpi.icon size={19} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{kpi.label}</p>
                        <p className="text-2xl font-black text-slate-900">{kpi.value}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">{kpi.desc}</p>
                  </div>
                ))}
              </div>

              <DashboardCard title="Clientes con mayor Gasto" subtitle="Ranking por reservas registradas y monto acumulado." accent>
                <div className="space-y-3">
                  {topClients.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                      Sin historial suficiente para construir el ranking.
                    </div>
                  ) : (
                    topClients.map((client, i) => {
                      const maxVal = topClients[0]?.valor || 1;
                      const width = Math.max(8, (client.valor / maxVal) * 100);
                      return (
                        <div key={`${client.name}-${i}`} className="rounded-xl border border-slate-100 bg-white p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-600">
                                {i + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-slate-800">{client.name}</p>
                                <p className="text-xs text-slate-400">{client.reservas} reserva(s)</p>
                              </div>
                            </div>
                            <p className="shrink-0 text-sm font-black text-slate-900">{fullCurrency(client.valor)}</p>
                          </div>
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-red-500 to-amber-400 transition-all duration-500"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </DashboardCard>
            </section>
          )}

        </div>
      </div>


      {/* Refreshing toast */}
      {refreshing && (
        <div className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2.5 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-2xl">
          <LoaderCircle size={15} className="animate-spin text-red-400" />
          Actualizando...
        </div>
      )}
    </div>
  );
};
