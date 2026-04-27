import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { Quotation, Rehearsal, Reservation, Service, Song } from '@/types';
import { reservaService } from '../../reservas/services/reservaService';
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
const Heatmap: React.FC<{ matrix: number[][] }> = ({ matrix }) => {
  const max = Math.max(1, ...matrix.flat());

  const getCellStyle = (value: number): string => {
    const ratio = value / max;
    if (value === 0) return 'bg-slate-50 text-slate-300 border border-slate-100';
    if (ratio < 0.35) return 'bg-red-50 text-red-400 border border-red-100';
    if (ratio < 0.7) return 'bg-red-200 text-red-700 border border-red-200';
    return 'bg-red-600 text-white border border-red-600 shadow-sm';
  };

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[580px] grid-cols-[76px_repeat(7,minmax(0,1fr))] gap-1.5">
        <div />
        {WEEK_DAYS.map(day => (
          <div key={day} className="pb-1 text-center text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            {day}
          </div>
        ))}
        {SLOT_LABELS.map((slot, rowIndex) => (
          <React.Fragment key={slot}>
            <div className="flex items-center text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              {slot}
            </div>
            {WEEK_DAYS.map((_, colIndex) => {
              const value = matrix[rowIndex]?.[colIndex] ?? 0;
              return (
                <div
                  key={`${slot}-${colIndex}`}
                  className={`flex h-12 items-center justify-center rounded-xl text-sm font-black transition-transform hover:scale-105 ${getCellStyle(value)}`}
                  title={`${slot} ${WEEK_DAYS[colIndex]}: ${value} registro(s)`}
                >
                  {value || ''}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/* ─── Monthly Calendar ─── */
const MonthlyCalendarBoard: React.FC<{
  monthDate: Date;
  cells: CalendarDayCell[];
}> = ({ monthDate, cells }) => (
  <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Vista mensual</p>
        <p className="mt-0.5 text-base font-black text-slate-900">
          {monthDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
        </p>
      </div>
      <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" />Reservas
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-400" />Cotizaciones
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-teal-500" />Ensayos
        </span>
      </div>
    </div>

    <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
      {WEEK_DAYS.map(day => (
        <div key={day} className="px-2 py-2 text-center text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
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
            className={`min-h-[120px] border-b border-r border-slate-100 p-2 ${
              cell.inMonth ? 'bg-white' : 'bg-slate-50/50'
            }`}
          >
            <div className="mb-1.5 flex items-center justify-between">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-black ${
                  cell.isToday
                    ? 'bg-slate-950 text-white'
                    : cell.inMonth
                    ? 'text-slate-800'
                    : 'text-slate-300'
                }`}
              >
                {cell.date.getDate()}
              </span>
              {cell.items.length > 0 && (
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-black text-slate-500">
                  {cell.items.length}
                </span>
              )}
            </div>
            <div className="space-y-1">
              {visibleItems.map(item => (
                <div
                  key={item.id}
                  className={`truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                    item.tone === 'reservation'
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
);

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
      setErrorMessage(null);

      const results = await Promise.allSettled([
        reservaService.getReservations(),
        ventaService.getSales(),
        cotizacionService.getQuotations(),
        rehearsalService.getRehearsals(),
        servicesService.getServices(),
        repertoireService.getSongs(),
      ]);

      if (cancelled) return;

      const reservations = results[0].status === 'fulfilled' ? results[0].value : [];
      const sales = results[1].status === 'fulfilled' ? results[1].value : [];
      const quotations = results[2].status === 'fulfilled' ? results[2].value : [];
      const rehearsals = results[3].status === 'fulfilled' ? results[3].value : [];
      const services = results[4].status === 'fulfilled' ? results[4].value : [];
      const songs = results[5].status === 'fulfilled' ? results[5].value : [];

      const failures = results.filter(r => r.status === 'rejected').length;

      setDashboard({ reservations, sales, quotations, rehearsals, services, songs });

      if (failures > 0) {
        setErrorMessage('Algunos módulos no respondieron. El dashboard muestra la información disponible.');
      }

      setLoading(false);
      setRefreshing(false);
    };

    loadDashboard();
    return () => { cancelled = true; };
  }, [user, reloadToken]);

  /* ── Date helpers ── */
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

  /* ── Data transforms ── */
  const reservations = dashboard.reservations.map(r => ({
    ...r,
    normalizedStatus: normalizeReservationStatus(r.status),
    pendingValue: getReservationPending(r),
    eventDateTime: reservationDate(r),
  }));

  const quotations = dashboard.quotations.map(q => ({
    ...q,
    normalizedStatus: normalizeQuotationStatus(q.status),
    eventDateTime: toDateTime(q.eventDate, q.startTime),
  }));

  const rehearsals = dashboard.rehearsals.map(r => ({
    ...r,
    normalizedStatus: (r.status || 'PENDIENTE').toUpperCase(),
    eventDateTime: rehearsalDate(r),
  }));

  const activeReservations = reservations.filter(r =>
    ['PENDIENTE', 'CONFIRMADA', 'REPROGRAMADA'].includes(r.normalizedStatus)
  );
  const futureReservations = activeReservations
    .filter(r => r.eventDateTime >= today)
    .sort((a, b) => a.eventDateTime.getTime() - b.eventDateTime.getTime());
  const pendingQuotes = quotations.filter(q => q.normalizedStatus === 'EN_ESPERA');
  const convertedQuotes = quotations.filter(q => q.normalizedStatus === 'CONVERTIDA');
  const pendingRehearsals = rehearsals
    .filter(r => r.normalizedStatus === 'PENDIENTE')
    .sort((a, b) => a.eventDateTime.getTime() - b.eventDateTime.getTime());

  const reservationLookup = reservations.reduce<Record<string, (typeof reservations)[number]>>(
    (acc, r) => { acc[String(r.id)] = r; return acc; }, {}
  );
  const serviceLookup = dashboard.services.reduce<Record<string, Service>>(
    (acc, s) => { acc[String(s.id)] = s; return acc; }, {}
  );
  const songLookup = dashboard.songs.reduce<Record<string, Song>>(
    (acc, s) => { acc[String(s.id)] = s; return acc; }, {}
  );

  const currentMonthSales = dashboard.sales.filter(s => {
    const d = new Date(s.date);
    return d >= currentMonthStart && d <= currentMonthEnd;
  });
  const currentMonthRevenue = currentMonthSales.reduce((t, s) => t + Number(s.amount || 0), 0);
  const previousMonthRevenue = dashboard.sales
    .filter(s => { const d = new Date(s.date); return d >= previousMonthStart && d <= previousMonthEnd; })
    .reduce((t, s) => t + Number(s.amount || 0), 0);

  const currentMonthReservationsCount = activeReservations.filter(
    r => r.eventDateTime >= currentMonthStart && r.eventDateTime <= currentMonthEnd
  ).length;
  const previousMonthReservationsCount = activeReservations.filter(
    r => r.eventDateTime >= previousMonthStart && r.eventDateTime <= previousMonthEnd
  ).length;

  const receivableBalance = activeReservations.reduce((t, r) => t + r.pendingValue, 0);
  const pipelineValue =
    pendingQuotes.reduce((t, q) => t + Number(q.totalAmount || 0), 0) + receivableBalance;
  const paidReservationsCount = activeReservations.filter(r => r.pendingValue <= 0.01).length;
  const paymentHealth = activeReservations.length
    ? (paidReservationsCount / activeReservations.length) * 100 : 0;
  const quoteConversion = quotations.length
    ? (convertedQuotes.length / quotations.length) * 100 : 0;

  const revenueDelta = getMetricDelta(currentMonthRevenue, previousMonthRevenue);
  const reservationsDelta = getMetricDelta(currentMonthReservationsCount, previousMonthReservationsCount);

  /* ── Weekly flow data ── */
  const weeklyFlowData = Array.from({ length: 8 }, (_, index) => {
    const start = startOfWeek(new Date(today.getFullYear(), today.getMonth(), today.getDate() - (7 * (7 - index))));
    const end = endOfWeek(start);
    return {
      name: `Sem ${index + 1}`,
      Cotizaciones: quotations.filter(q => { const d = new Date(q.createdAt); return d >= start && d <= end; }).length,
      Reservas: reservations.filter(r => { const d = new Date(r.createdAt); return d >= start && d <= end; }).length,
      Ventas: dashboard.sales.filter(s => { const d = new Date(s.date); return d >= start && d <= end; }).length,
    };
  });

  const reservationStatusData = [
    { name: 'Confirmadas', value: reservations.filter(r => r.normalizedStatus === 'CONFIRMADA').length },
    { name: 'Pendientes', value: reservations.filter(r => r.normalizedStatus === 'PENDIENTE').length },
    { name: 'Reprogramadas', value: reservations.filter(r => r.normalizedStatus === 'REPROGRAMADA').length },
    { name: 'Anuladas', value: reservations.filter(r => r.normalizedStatus === 'ANULADA').length },
  ].filter(i => i.value > 0);

  const getSaleServiceAllocations = (sale: Sale) => {
    const saleAmount = Number(sale.amount || 0);
    const directServices = (sale.services || [])
      .map(s => ({ name: normalizeLabel(s.nombre, 'Servicio general'), weight: Number(s.precio || 0) * Number(s.cantidad || 1) }))
      .filter(s => s.weight > 0);
    if (directServices.length > 0) return scaleWeightedEntries(directServices, saleAmount);
    const linked = sale.reservationId ? reservationLookup[String(sale.reservationId)] : undefined;
    const reservationServices = (linked?.selectedServices || [])
      .map(s => {
        const meta = serviceLookup[String(s.serviceId)];
        const qty = Number(s.quantity || 1);
        const base = Number(meta?.precio || 0) * qty;
        return { name: normalizeLabel(meta?.nombre || linked?.eventType || sale.eventType || sale.concept, 'Servicio general'), weight: base > 0 ? base : qty };
      })
      .filter(s => s.weight > 0);
    if (reservationServices.length > 0) return scaleWeightedEntries(reservationServices, saleAmount);
    return [{ name: normalizeLabel(sale.eventType || sale.concept, 'Servicio general'), value: saleAmount }];
  };

  const currentMonthServiceAllocations = currentMonthSales.flatMap(getSaleServiceAllocations);
  const currentMonthServiceTotals = Object.entries(
    currentMonthServiceAllocations.reduce<Record<string, number>>((acc, e) => {
      acc[e.name] = (acc[e.name] || 0) + Number(e.value || 0); return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const highlightedServiceTotals = currentMonthServiceTotals.slice(0, 4);
  const currentMonthLeaderService = highlightedServiceTotals[0];

  const currentMonthWeeks = Array.from(
    { length: Math.max(1, Math.ceil(currentMonthEnd.getDate() / 7)) },
    (_, i) => ({ name: `Sem ${i + 1}`, total: 0, services: {} as Record<string, number> })
  );
  currentMonthSales.forEach(sale => {
    const d = new Date(sale.date);
    const wi = Math.min(currentMonthWeeks.length - 1, Math.floor((Math.max(d.getDate(), 1) - 1) / 7));
    const bucket = currentMonthWeeks[wi];
    if (!bucket) return;
    getSaleServiceAllocations(sale).forEach(a => {
      bucket.services[a.name] = (bucket.services[a.name] || 0) + a.value;
      bucket.total += a.value;
    });
  });

  const serviceTrendSeries = highlightedServiceTotals.slice(0, 3);
  const currentMonthServiceTrendData = currentMonthWeeks.map(week => {
    const row: Record<string, string | number> = { name: week.name, total: week.total };
    serviceTrendSeries.forEach(s => { row[s.name] = week.services[s.name] || 0; });
    return row;
  });

  const topEventTypesData = Object.entries(
    reservations.reduce<Record<string, number>>((acc, r) => {
      if (r.normalizedStatus === 'ANULADA') return acc;
      const k = r.eventType || 'Otro';
      acc[k] = (acc[k] || 0) + 1; return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  const topEventTypesTotal = topEventTypesData.reduce((s, i) => s + i.value, 0);
  const topEventLeader = topEventTypesData[0];

  const topSongsData = Object.entries(
    [
      ...reservations.flatMap(r => (r.repertoireIds || []).map(id => normalizeLabel(songLookup[String(id)]?.title, 'Cancion sin nombre'))),
      ...quotations.flatMap(q => (q.repertoireIds || []).map(id => normalizeLabel(songLookup[String(id)]?.title, 'Cancion sin nombre'))),
      ...dashboard.sales.flatMap(s => (s.repertoire || []).map(r => normalizeLabel(r.titulo, 'Cancion sin nombre'))),
    ].reduce<Record<string, number>>((acc, name) => { acc[name] = (acc[name] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value, subtitle: value === 1 ? '1 solicitud' : `${value} solicitudes` }))
    .sort((a, b) => b.value - a.value).slice(0, 4);

  const topClients = Object.values(
    reservations.reduce<Record<string, { name: string; reservas: number; valor: number }>>((acc, r) => {
      const k = r.clientName || r.clientEmail || r.clientId || r.id;
      if (!acc[k]) acc[k] = { name: r.clientName || 'Cliente', reservas: 0, valor: 0 };
      acc[k].reservas += 1;
      acc[k].valor += Number(r.totalAmount || 0);
      return acc;
    }, {})
  ).sort((a, b) => b.valor - a.valor).slice(0, 5);

  const currentMonthLabel = formatMonthName(currentMonthStart);
  const currentMonthAgenda = futureReservations.filter(
    r => r.eventDateTime >= currentMonthStart && r.eventDateTime <= currentMonthEnd
  ).length;

  /* ── Chart configs ── */
  const topEventTypesChart = useMemo(() => (
    topEventTypesData.length
    ? ({
        type: 'doughnut',
        data: {
          labels: topEventTypesData.map(i => i.name),
          datasets: [{
            data: topEventTypesData.map(i => i.value),
            backgroundColor: topEventTypesData.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
            borderWidth: 0,
            hoverOffset: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          cutout: '70%',
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx: any) => {
              const total = topEventTypesData.reduce((s, i) => s + i.value, 0);
              const v = Number(ctx.raw || 0);
              return `${ctx.label}: ${v} (${total > 0 ? Math.round((v / total) * 100) : 0}%)`;
            }}},
          },
        },
      } satisfies ChartConfiguration<'doughnut'>)
    : undefined
  ), [topEventTypesData]);

  const revenueByServiceChart = useMemo(() => (
    serviceTrendSeries.length > 0
    ? ({
        type: 'line',
        data: {
          labels: currentMonthServiceTrendData.map(i => String(i.name)),
          datasets: [
            ...serviceTrendSeries.map((s, i) => ({
              label: s.name,
              data: currentMonthServiceTrendData.map(d => Number(d[s.name] || 0)),
              borderColor: CHART_COLORS[i % CHART_COLORS.length],
              backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
              pointRadius: 3,
              pointHoverRadius: 5,
              tension: 0.4,
              yAxisID: 'y',
            })),
            {
              label: 'Total del mes',
              data: currentMonthServiceTrendData.map(d => Number(d.total || 0)),
              borderColor: COLORS.slate,
              backgroundColor: COLORS.slate,
              borderDash: [6, 4],
              pointRadius: 3,
              pointHoverRadius: 5,
              tension: 0.3,
              yAxisID: 'y1',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { position: 'top', align: 'start', labels: { boxWidth: 10, boxHeight: 10, color: COLORS.slate, font: { size: 11, weight: 'bold' } } },
            tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${fullCurrency(Number(ctx.raw || 0))}` } },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: COLORS.slate, font: { size: 11 } } },
            y: { beginAtZero: true, grid: { color: COLORS.slateLine }, ticks: { color: COLORS.slate, callback: (v: any) => shortCurrency(Number(v)) } },
            y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false }, ticks: { color: COLORS.slate, callback: (v: any) => shortCurrency(Number(v)) } },
          },
        },
      } satisfies ChartConfiguration<'line'>)
    : undefined
  ), [serviceTrendSeries, currentMonthServiceTrendData]);

  const reservationMixChart = useMemo(() => (
    reservationStatusData.length
    ? ({
        type: 'bar',
        data: {
          labels: reservationStatusData.map(i => i.name),
          datasets: [{
            data: reservationStatusData.map(i => i.value),
            backgroundColor: reservationStatusData.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
            borderRadius: 10,
            borderSkipped: false,
            barThickness: 18,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          indexAxis: 'y',
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => `${ctx.label}: ${Number(ctx.raw || 0)} reservas` } } },
          scales: {
            x: { beginAtZero: true, grid: { color: COLORS.slateLine }, ticks: { precision: 0, color: COLORS.slate } },
            y: { grid: { display: false }, ticks: { color: COLORS.slate, font: { size: 11, weight: 'bold' } } },
          },
        },
      } satisfies ChartConfiguration<'bar'>)
    : undefined
  ), [reservationStatusData]);

  const hasWeeklyFlowData = weeklyFlowData.some(item =>
    Number(item.Cotizaciones || 0) > 0 ||
    Number(item.Reservas || 0) > 0 ||
    Number(item.Ventas || 0) > 0
  );

  const weeklyAgendaLoadData = WEEK_DAYS.map((day, i) => ({
    day,
    Reservas: futureReservations.filter(r => getWeekdayIndex(r.eventDateTime) === i).length,
    Ensayos: pendingRehearsals.filter(r => getWeekdayIndex(r.eventDateTime) === i).length,
    Total: futureReservations.filter(r => getWeekdayIndex(r.eventDateTime) === i).length +
           pendingRehearsals.filter(r => getWeekdayIndex(r.eventDateTime) === i).length,
  }));

  const hasWeeklyAgendaData = weeklyAgendaLoadData.some(item =>
    Number(item.Reservas || 0) > 0 || Number(item.Ensayos || 0) > 0
  );
  const weeklyAgendaPeak = Math.max(
    0,
    ...weeklyAgendaLoadData.map(item => Math.max(item.Reservas, item.Ensayos, item.Total))
  );
  const weeklyAgendaRadiusMax = Math.max(4, weeklyAgendaPeak);
  const weeklyAgendaTickCount = Math.min(6, weeklyAgendaRadiusMax + 1);

  const occupancyMatrix = (() => {
    const matrix = Array.from({ length: SLOT_LABELS.length }, () => Array(7).fill(0));
    futureReservations.filter(r => r.eventDateTime <= next60Days).forEach(r => {
      matrix[getSlotIndex(r.eventDateTime.getHours())][getWeekdayIndex(r.eventDateTime)] += 1;
    });
    pendingQuotes.filter(q => q.eventDateTime >= today && q.eventDateTime <= next60Days).forEach(q => {
      matrix[getSlotIndex(q.eventDateTime.getHours())][getWeekdayIndex(q.eventDateTime)] += 1;
    });
    pendingRehearsals.filter(r => r.eventDateTime <= next60Days).forEach(r => {
      matrix[getSlotIndex(r.eventDateTime.getHours())][getWeekdayIndex(r.eventDateTime)] += 1;
    });
    return matrix;
  })();

  /* Calendar */
  const calendarGridStart = startOfWeek(currentMonthStart);
  const calendarGridEnd = endOfWeekGrid(currentMonthStart);
  const calendarSourceItems = [
    ...futureReservations.filter(r => r.eventDateTime >= calendarGridStart && r.eventDateTime <= calendarGridEnd)
      .map(r => ({ date: r.eventDateTime, item: { id: `res-${r.id}`, label: `${r.startTime || r.eventTime || '00:00'} ${r.clientName}`, tone: 'reservation' as const } })),
    ...pendingQuotes.filter(q => q.eventDateTime >= calendarGridStart && q.eventDateTime <= calendarGridEnd)
      .map(q => ({ date: q.eventDateTime, item: { id: `quote-${q.id}`, label: `${q.startTime || '00:00'} ${q.clientName}`, tone: 'quotation' as const } })),
    ...pendingRehearsals.filter(r => r.eventDateTime >= calendarGridStart && r.eventDateTime <= calendarGridEnd)
      .map(r => ({ date: r.eventDateTime, item: { id: `reh-${r.id}`, label: `${r.time || r.hora || '00:00'} ${r.title}`, tone: 'rehearsal' as const } })),
  ];

  const calendarMonthCells: CalendarDayCell[] = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(calendarGridStart);
    date.setDate(calendarGridStart.getDate() + i);
    date.setHours(0, 0, 0, 0);
    return {
      date,
      inMonth: date.getMonth() === currentMonthStart.getMonth(),
      isToday: date.toDateString() === today.toDateString(),
      items: calendarSourceItems.filter(s => s.date.toDateString() === date.toDateString()).sort((a, b) => a.date.getTime() - b.date.getTime()).map(s => s.item),
    };
  });

  /* Agenda */
  const agendaItems: AgendaItem[] = [
    ...futureReservations.slice(0, 6).map(r => ({
      id: `res-${r.id}`, title: `${r.eventType} · ${r.clientName}`,
      subtitle: `Reserva #${r.id} · ${fullCurrency(r.totalAmount)}`,
      date: r.eventDateTime, kind: 'reserva' as const, status: r.normalizedStatus,
    })),
    ...pendingRehearsals.slice(0, 4).map(r => ({
      id: `ens-${r.id}`, title: r.title, subtitle: r.location,
      date: r.eventDateTime, kind: 'ensayo' as const, status: r.normalizedStatus,
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 8);

  /* Activity feed */
  const activityFeed: ActivityItem[] = [
    ...reservations.map(r => ({ id: `res-${r.id}`, title: `${r.eventType} · ${r.clientName}`, subtitle: `Reserva · ${normalizeReservationStatus(r.status)}`, date: new Date(r.createdAt), amount: Number(r.totalAmount || 0), kind: 'reserva' as const })),
    ...quotations.map(q => ({ id: `q-${q.id}`, title: `${q.eventType} · ${q.clientName}`, subtitle: `Cotizacion · ${normalizeQuotationStatus(q.status)}`, date: new Date(q.createdAt), amount: Number(q.totalAmount || 0), kind: 'cotizacion' as const })),
    ...dashboard.sales.map(s => ({ id: `sale-${s.id}`, title: s.concept || s.eventType || 'Venta registrada', subtitle: `${s.clientName} · ${s.method}`, date: new Date(s.date), amount: Number(s.amount || 0), kind: 'venta' as const })),
  ].filter(i => !Number.isNaN(i.date.getTime())).sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

  /* Alerts */
  const alerts: AlertItem[] = [
    ...futureReservations.filter(r => r.pendingValue > 0.01 && r.eventDateTime <= next14Days).slice(0, 3)
      .map(r => ({ id: `alert-res-${r.id}`, title: `Cobro pendiente · Reserva #${r.id}`, description: `${r.clientName} tiene ${fullCurrency(r.pendingValue)} por pagar. Evento el ${formatCompactDate(r.eventDateTime)}.`, tone: 'danger' as const })),
    ...pendingQuotes.filter(q => { const days = Math.floor((today.getTime() - new Date(q.createdAt).getTime()) / 86400000); return days >= 7; }).slice(0, 2)
      .map(q => ({ id: `alert-q-${q.id}`, title: 'Cotizacion sin respuesta', description: `${q.clientName} lleva días esperando respuesta. Propuesta de ${fullCurrency(q.totalAmount)}.`, tone: 'warning' as const })),
    ...pendingRehearsals.filter(r => r.eventDateTime <= next14Days).slice(0, 2)
      .map(r => ({ id: `alert-ens-${r.id}`, title: 'Ensayo próximo', description: `${r.title} programado para el ${formatCompactDate(r.eventDateTime)}.`, tone: 'success' as const })),
  ].slice(0, 6);

  const next7DaysAgenda = agendaItems.filter(i => i.date <= next30Days).length;

  /* ── Nav items ── */
  const sectionItems: DashboardSectionTabItem[] = [
    { id: 'executive', label: 'Resumen', icon: Sparkles },
    { id: 'commercial', label: 'Ventas', icon: TrendingUp },
    { id: 'operations', label: 'Agenda', icon: CalendarRange },
    { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
    { id: 'clients', label: 'Clientes', icon: Activity },
  ];

  const showExecutive = activeSection === 'executive';
  const showCommercial = activeSection === 'commercial';
  const showOperations = activeSection === 'operations';
  const showAlerts = activeSection === 'alerts';
  const showClients = activeSection === 'clients';

  if (loading) return <LoadingDashboard />;

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: 'linear-gradient(160deg, #fdf8f6 0%, #f8fafc 50%, #f8fafc 100%)' }}
    >
      <div className="mx-auto w-full max-w-[1520px] px-3 py-4 sm:px-4 lg:px-6">
        <div className="flex flex-col gap-4">

          {/* ═══ HERO ═══ */}
          <section
            ref={heroRef}
            className="relative overflow-hidden rounded-[2.5rem] bg-[#0a0a0a] px-6 py-8 md:px-9 md:py-10"
          >
            {/* Base atmosphere */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-red-900/25 blur-[80px]" />
              <div className="absolute right-10 bottom-0 h-48 w-48 rounded-full bg-red-950/30 blur-[60px]" />
              {/* Fine grid */}
              <div className="absolute inset-0 opacity-[0.055]"
                style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            </div>

            {/* ═══ HERO ═══ */}
            <div
              className="pointer-events-none absolute inset-0 transition-opacity duration-300"
              style={{
                opacity: isHovered ? 1 : 0.4,
                background: `
                  radial-gradient(circle 180px at ${mousePos.x}% ${mousePos.y}%, rgba(220,38,38,0.55), transparent 100%),
                  radial-gradient(circle 360px at ${mousePos.x}% ${mousePos.y}%, rgba(185,28,28,0.22), transparent 100%),
                  radial-gradient(circle 600px at ${mousePos.x}% ${mousePos.y}%, rgba(127,29,29,0.10), transparent 100%)
                `,
              }}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-red-300">
                  <Zap size={11} className="text-red-400" />
                  Dashboard ejecutivo
                </div>

                <h1 className="mt-5 text-[2.4rem] font-black leading-[1.05] tracking-[-0.03em] text-white md:text-[3rem]">
                  Panel comercial <br />
                  <span className="text-red-400">y operativo</span>
                </h1>

                <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-400 md:text-[0.9375rem]">
                  Ingresos, reservas, cotizaciones, ensayos y alertas en una sola vista. Diseñado para decidir, no solo para ver.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-2.5">
                  <div className="rounded-full border border-white/10 bg-white/6 px-3.5 py-2 text-xs font-semibold text-slate-300">
                    {formatFullDate(today)}
                  </div>
                  <div className="rounded-full border border-red-500/20 bg-red-500/12 px-3.5 py-2 text-xs font-black text-red-300">
                    {currentMonthAgenda} eventos este mes
                  </div>
                </div>
              </div>

              {/* KPI cards */}
              <div className="grid min-w-0 gap-2.5 sm:grid-cols-3 xl:w-full xl:max-w-[430px]">
                {[
                  { label: 'Pipeline activo', value: shortCurrency(pipelineValue), desc: 'Cotizaciones y saldos pendientes', color: 'border-white/8 bg-white/5' },
                  { label: 'Cobro sano', value: formatPercent(paymentHealth), desc: 'Reservas con pago completo', color: 'border-emerald-400/15 bg-emerald-400/8' },
                  { label: 'Conversión', value: formatPercent(quoteConversion), desc: 'Cotizaciones en reserva', color: 'border-amber-300/15 bg-amber-300/8' },
                ].map((kpi, i) => (
                  <div key={i} className={`rounded-2xl border ${kpi.color} p-4 backdrop-blur-sm`}>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{kpi.label}</p>
                    <p className="mt-2.5 text-2xl font-black text-white">{kpi.value}</p>
                    <p className="mt-1.5 text-xs text-slate-400">{kpi.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Error notice */}
          {errorMessage && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-amber-800">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{errorMessage}</p>
            </div>
          )}

          {/* ═══ TABS ═══ */}
          <DashboardSectionTabs
            items={sectionItems}
            activeSection={activeSection}
            onSelect={setActiveSection}
          />

          {/* ═══ EXECUTIVE ═══ */}
          {showExecutive && (
            <section className="space-y-4">
              <DashboardSectionHeader
                eyebrow="Resumen"
                title="Vista ejecutiva"
                subtitle="Ingresos del mes, reservas activas, saldo por cobrar y canciones más pedidas."
              />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.15fr)]">
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
                  meta={<TrendBadge value={reservationsDelta} suffix="agenda mensual" />}
                />
                <StatCard
                  icon={HandCoins}
                  label="Saldo por cobrar"
                  value={shortCurrency(receivableBalance)}
                  tone="amber"
                  meta={
                    <p className="text-sm font-medium text-slate-400">
                      {futureReservations.filter(r => r.pendingValue > 0.01).length} reservas con cobro abierto
                    </p>
                  }
                />
                <RankedListCard
                  icon={Mic2}
                  label="Canciones más pedidas"
                  items={topSongsData}
                  tone="emerald"
                  emptyMessage="Aún no hay repertorios suficientes para destacar canciones."
                />
              </div>
            </section>
          )}

          {/* ═══ COMMERCIAL ═══ */}
          {showCommercial && (
            <section className="space-y-4">
              <DashboardSectionHeader
                eyebrow="Comercial"
                title="Ventas y conversión"
                subtitle="Ingresos por servicio, tipos de evento y flujo semanal del embudo comercial."
              />

              <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                <DashboardCard
                  title="Ingresos por servicio"
                  subtitle={`Distribución de ${currentMonthLabel} con avance semanal por línea.`}
                  accent
                  actions={
                    <button
                      onClick={() => { setRefreshing(true); setReloadToken(c => c + 1); }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 transition-colors hover:border-red-200 hover:text-red-600"
                    >
                      <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                      Actualizar
                    </button>
                  }
                >
                  <div className="mb-5 grid gap-2.5 sm:grid-cols-3">
                    {[
                      { label: 'Mes actual', value: fullCurrency(currentMonthRevenue) },
                      { label: 'Mes anterior', value: fullCurrency(previousMonthRevenue) },
                      { label: currentMonthLeaderService ? currentMonthLeaderService.name : 'Sin datos', value: currentMonthLeaderService ? fullCurrency(currentMonthLeaderService.value) : '—' },
                    ].map((item, i) => (
                      <div key={i} className="rounded-xl bg-slate-50 p-3.5">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                        <p className="mt-1.5 text-lg font-black text-slate-900">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <ChartCanvas
                    config={revenueByServiceChart}
                    height={250}
                    emptyMessage="Sin ventas suficientes este mes para distribuir ingresos por servicio."
                  />
                </DashboardCard>

                <DashboardCard
                  title="Tipos de evento más pedidos"
                  subtitle="Distribución por reservas activas."
                >
                  <div className="flex flex-col gap-4">
                    <div className="relative mx-auto w-full" style={{ height: 220 }}>
                      <ChartCanvas
                        config={topEventTypesChart}
                        height={220}
                        emptyMessage="No hay reservas suficientes para identificar el tipo de evento líder."
                      />
                      {topEventTypesData.length > 0 && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Total</p>
                            <p className="text-2xl font-black text-slate-900">{topEventTypesTotal}</p>
                          </div>
                        </div>
                      )}
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
                  title="Mix de reservas por estado"
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

              <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
                <DashboardCard title="Mapa de ocupación" subtitle="Reservas, ensayos y cotizaciones por franja y día (próximos 60 días).">
                  <Heatmap matrix={occupancyMatrix} />
                </DashboardCard>

                <DashboardCard title="Agenda inmediata" subtitle="Próximos eventos y ensayos en orden cronológico.">
                  <div className="space-y-2.5">
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

              <DashboardCard title="Clientes con mayor valor" subtitle="Ranking por reservas registradas y monto acumulado." accent>
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
