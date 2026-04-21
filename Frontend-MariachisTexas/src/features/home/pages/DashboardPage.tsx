import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/shared/contexts/AuthContext';
import { Reservation } from '@/types';
import { reservaService } from '../../reservas/services/reservaService';
import { clientService } from '../../clientes/services/clientService';
import api from '@/shared/api/api';
import {
    TrendingUp, Users, Calendar, DollarSign, Music,
    ArrowRight, CheckCircle, X, BarChart2, PieChart as PieChartIcon,
    Activity, Target, AlertCircle
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

// ─── Paleta ───────────────────────────────────────────────────────────────────
const RED        = '#ce1126';
const RED_LIGHT  = '#fef2f2';
const DARK       = '#0f172a';
const SLATE      = '#64748b';
const SLATE_100  = '#f1f5f9';
const SLATE_200  = '#e2e8f0';
const GREEN      = '#10b981';
const AMBER      = '#f59e0b';
const CHART_COLORS = [RED, DARK, SLATE, AMBER, GREEN];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000   ? `$${Math.round(v / 1_000)}k`
    : `$${v}`;

const today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long'
});

// ─── KpiCard ──────────────────────────────────────────────────────────────────
interface KpiCardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    accent: string;
    bgAccent: string;
    trend: string;
    trendUp?: boolean;
    onClick?: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({
    title, value, icon: Icon, accent, bgAccent, trend, trendUp, onClick
}) => (
    <div
        onClick={onClick}
        style={{
            background: '#ffffff',
            border: `1px solid ${SLATE_200}`,
            borderRadius: 20,
            padding: '20px 22px',
            position: 'relative',
            overflow: 'hidden',
            cursor: onClick ? 'pointer' : 'default',
            transition: 'box-shadow 0.15s, transform 0.15s',
        }}
        onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(0,0,0,0.08)';
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        }}
    >
        {/* accent strip */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: '20px 20px 0 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, marginTop: 4 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: bgAccent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={accent} />
            </div>
            <ArrowRight size={14} color={SLATE} style={{ transform: 'rotate(-45deg)', opacity: 0.4 }} />
        </div>

        <p style={{ fontSize: 10, fontWeight: 700, color: SLATE, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            {title}
        </p>
        <h3 style={{ fontSize: 26, fontWeight: 700, color: DARK, fontVariantNumeric: 'tabular-nums' }}>
            {value}
        </h3>
        <p style={{ fontSize: 10, marginTop: 6, color: trendUp === false ? RED : trendUp ? GREEN : SLATE, fontWeight: 500 }}>
            {trendUp === true ? '▲ ' : trendUp === false ? '▼ ' : ''}{trend}
        </p>
    </div>
);

// ─── SectionCard ──────────────────────────────────────────────────────────────
const SectionCard: React.FC<{
    title: string;
    subtitle?: string;
    icon?: React.ElementType;
    iconColor?: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
    dark?: boolean;
}> = ({ title, subtitle, icon: Icon, iconColor, children, style, dark }) => (
    <div style={{
        background: dark ? DARK : '#ffffff',
        border: `1px solid ${dark ? '#1e293b' : SLATE_200}`,
        borderRadius: 22,
        padding: 22,
        ...style,
    }}>
        <div style={{ marginBottom: 16 }}>
            <h3 style={{
                fontFamily: 'Georgia, serif',
                fontSize: 15,
                fontWeight: 700,
                color: dark ? '#f1f5f9' : DARK,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 2,
            }}>
                {Icon && <Icon size={17} color={iconColor || (dark ? '#94a3b8' : RED)} />}
                {title}
            </h3>
            {subtitle && (
                <p style={{ fontSize: 11, color: dark ? '#64748b' : SLATE, marginLeft: Icon ? 25 : 0 }}>
                    {subtitle}
                </p>
            )}
        </div>
        {children}
    </div>
);

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: '#ffffff',
            border: `1px solid ${SLATE_200}`,
            borderRadius: 12,
            padding: '10px 14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            fontSize: 12,
        }}>
            <p style={{ fontWeight: 700, color: DARK, marginBottom: 4 }}>{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} style={{ color: p.color, marginBottom: 2 }}>
                    {p.name}: {typeof p.value === 'number' && p.name?.toLowerCase().includes('ingreso')
                        ? fmt(p.value) : p.value}
                </p>
            ))}
        </div>
    );
};

// ─── GoalBar ─────────────────────────────────────────────────────────────────
const GoalBar: React.FC<{ label: string; pct: number; color: string }> = ({ label, pct, color }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const t = setTimeout(() => {
            if (ref.current) ref.current.style.width = `${pct}%`;
        }, 300);
        return () => clearTimeout(t);
    }, [pct]);

    return (
        <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: DARK, marginBottom: 5 }}>
                <span>{label}</span>
                <span style={{ color: SLATE }}>{pct}%</span>
            </div>
            <div style={{ height: 6, background: SLATE_100, borderRadius: 6, overflow: 'hidden' }}>
                <div
                    ref={ref}
                    style={{ height: '100%', width: '0%', background: color, borderRadius: 6, transition: 'width 1s ease' }}
                />
            </div>
        </div>
    );
};

// ─── RepertoireBar ────────────────────────────────────────────────────────────
const RepertoireBar: React.FC<{ name: string; author: string; count: number; pct: number; color: string }> = ({
    name, author, count, pct, color
}) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const t = setTimeout(() => {
            if (ref.current) ref.current.style.width = `${pct}%`;
        }, 400);
        return () => clearTimeout(t);
    }, [pct]);

    return (
        <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 5 }}>
                <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>{name}</p>
                    <p style={{ fontSize: 10, color: '#64748b' }}>{author}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color }}>{count}</span>
            </div>
            <div style={{ height: 4, background: '#1e293b', borderRadius: 4, overflow: 'hidden' }}>
                <div
                    ref={ref}
                    style={{ height: '100%', width: '0%', background: color, borderRadius: 4, transition: 'width 0.9s ease' }}
                />
            </div>
        </div>
    );
};

// ─── EventBadge ───────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const isConfirmed = status === 'Confirmado';
    return (
        <span style={{
            fontSize: 9,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 20,
            background: isConfirmed ? '#ecfdf5' : '#fffbeb',
            color: isConfirmed ? '#059669' : '#d97706',
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
        }}>
            {status}
        </span>
    );
};

// ─── Heatmap ─────────────────────────────────────────────────────────────────
const DAYS  = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const SLOTS = ['Mañana', 'Tarde', 'Noche', 'Madrugada'];
const OCC   = [
    [0.1, 0.4, 0.9, 0.7, 0.6, 1.0, 0.8],
    [0.2, 0.5, 0.7, 0.6, 0.8, 0.9, 0.7],
    [0.0, 0.2, 0.8, 0.5, 0.9, 1.0, 0.9],
    [0.0, 0.0, 0.1, 0.0, 0.1, 0.3, 0.2],
];
const heatColor = (v: number) =>
    v === 0 ? '#f8fafc' : v < 0.4 ? '#fef2f2' : v < 0.7 ? '#fecaca' : v < 0.9 ? '#f87171' : RED;

const Heatmap: React.FC = () => (
    <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '72px repeat(7, 1fr)', gap: 5, minWidth: 500 }}>
            {/* header */}
            <div />
            {DAYS.map(d => (
                <div key={d} style={{ fontSize: 10, fontWeight: 700, color: SLATE, textAlign: 'center', paddingBottom: 4 }}>
                    {d}
                </div>
            ))}
            {/* rows */}
            {SLOTS.map((slot, si) => (
                <React.Fragment key={slot}>
                    <div style={{ fontSize: 10, color: SLATE, display: 'flex', alignItems: 'center' }}>{slot}</div>
                    {DAYS.map((_, di) => {
                        const v = OCC[si][di];
                        return (
                            <div
                                key={di}
                                title={`${slot} ${DAYS[di]}: ${Math.round(v * 100)}% ocupado`}
                                style={{
                                    height: 32,
                                    borderRadius: 7,
                                    background: heatColor(v),
                                    cursor: 'pointer',
                                    transition: 'opacity 0.15s',
                                    border: `1px solid ${SLATE_200}`,
                                }}
                                onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
                                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                            />
                        );
                    })}
                </React.Fragment>
            ))}
        </div>
        {/* legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 10, color: SLATE }}>
            <span>Libre</span>
            {['#fef2f2', '#fecaca', '#f87171', RED].map(c => (
                <div key={c} style={{ width: 14, height: 14, borderRadius: 3, background: c, border: `1px solid ${SLATE_200}` }} />
            ))}
            <span>Lleno</span>
        </div>
    </div>
);

// ─── ProjectionSlider ─────────────────────────────────────────────────────────
const ProjectionSlider: React.FC = () => {
    const [events,  setEvents]  = useState(20);
    const [ticket,  setTicket]  = useState(700_000);
    const [rate,    setRate]    = useState(70);

    const result = Math.round(events * ticket * (rate / 100));

    const SliderRow: React.FC<{
        label: string;
        min: number; max: number; step: number;
        value: number; onChange: (v: number) => void;
        display: string;
    }> = ({ label, min, max, step, value, onChange, display }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <span style={{ fontSize: 11, color: SLATE, width: 100, flexShrink: 0 }}>{label}</span>
            <input
                type="range" min={min} max={max} step={step} value={value}
                onChange={e => onChange(+e.target.value)}
                style={{ flex: 1, accentColor: RED, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 11, fontWeight: 700, color: DARK, minWidth: 44, textAlign: 'right' }}>
                {display}
            </span>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <SliderRow label="Eventos / mes" min={5} max={40} step={1} value={events} onChange={setEvents} display={`${events}`} />
            <SliderRow label="Ticket promedio" min={200_000} max={2_000_000} step={50_000} value={ticket} onChange={setTicket} display={fmt(ticket)} />
            <SliderRow label="% Confirmación" min={40} max={100} step={1} value={rate} onChange={setRate} display={`${rate}%`} />

            <div style={{
                marginTop: 18,
                background: DARK,
                borderRadius: 14,
                padding: '18px 20px',
                textAlign: 'center',
            }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', fontVariantNumeric: 'tabular-nums' }}>
                    {fmt(result)}
                </div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>Proyección mensual estimada</div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                    {events} eventos · {rate}% confirmación
                </div>
            </div>
        </div>
    );
};

// ─── DashboardPage ────────────────────────────────────────────────────────────
export const DashboardPage: React.FC = () => {
    const { user } = useAuth();

    const [stats, setStats] = useState({
        income: 0,
        activeReservations: 0,
        pendingBalance: 0,
        totalClients: 0,
        upcomingEvents:    [] as Reservation[],
        recentActivity:    [] as Reservation[],
        monthlyIncomeData: [] as any[],
        eventTypeData:     [] as any[],
        weeklyTrendData:   [] as any[],
    });
    const [loading,          setLoading         ] = useState(true);
    const [showToast,        setShowToast        ] = useState(false);
    const [eventFilter,      setEventFilter      ] = useState<'all' | 'Confirmado' | 'Pendiente'>('all');

    // ── Carga de datos ────────────────────────────────────────────────────────
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const reservations = await reservaService.getReservations();
                const rawSales     = await api.get('/ventas');
                const sales        = Array.isArray(rawSales.data) ? rawSales.data : (rawSales.data?.data ?? []);
                const cr           = await clientService.getClients();
                const clients      = Array.isArray(cr) ? cr : cr.clients;

                const activeRes   = reservations.filter(r => r.status === 'Confirmado' || r.status === 'Pendiente');
                const totalIncome = sales.reduce((a: number, s: any) => a + s.amount, 0);
                const pending     = activeRes.reduce((a, r) => a + (r.totalAmount - r.paidAmount), 0);

                // Últimos 6 meses
                const last6 = Array.from({ length: 6 }, (_, i) => {
                    const d = new Date();
                    d.setDate(1);
                    d.setMonth(d.getMonth() - i);
                    return { label: d.toLocaleString('es-CO', { month: 'short' }), month: d.getMonth(), year: d.getFullYear() };
                }).reverse();

                const monthlyIncomeData = last6.map(m => ({
                    name: m.label,
                    ingresos: sales
                        .filter((s: any) => { const d = new Date(s.date); return d.getMonth() === m.month && d.getFullYear() === m.year; })
                        .reduce((a: number, s: any) => a + s.amount, 0),
                }));

                // Tipos de evento
                const typesCount: Record<string, number> = {};
                reservations.forEach(r => { const t = r.eventType || 'Otro'; typesCount[t] = (typesCount[t] || 0) + 1; });
                const eventTypeData = Object.entries(typesCount).map(([name, value]) => ({ name, value }));

                // Tendencia semanal
                const weeklyTrendData = Array.from({ length: 4 }, (_, i) => {
                    const start = new Date();
                    start.setDate(start.getDate() - (i * 7) - start.getDay());
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(start);
                    end.setDate(end.getDate() + 6);
                    end.setHours(23, 59, 59, 999);
                    const week = reservations.filter(r => { const d = new Date(r.createdAt); return d >= start && d <= end; });
                    return {
                        name: `Sem ${4 - i}`,
                        confirmadas: week.filter(r => r.status === 'Confirmado').length,
                        pendientes:  week.filter(r => r.status === 'Pendiente').length,
                    };
                }).reverse();

                const sorted = [...activeRes].sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

                setStats({
                    income: totalIncome,
                    activeReservations: activeRes.length,
                    pendingBalance: pending,
                    totalClients: clients.length,
                    upcomingEvents: sorted.slice(0, 8),
                    recentActivity: reservations.slice(0, 5),
                    monthlyIncomeData,
                    eventTypeData,
                    weeklyTrendData,
                });
            } finally {
                setLoading(false);
                setTimeout(() => setShowToast(true), 500);
                setTimeout(() => setShowToast(false), 5000);
            }
        };
        load();
    }, [user]);

    // ── Toast ─────────────────────────────────────────────────────────────────
    const WelcomeToast = () => createPortal(
        <div style={{
            position: 'fixed', top: 24, right: 24, zIndex: 200,
            transition: 'all 0.4s ease',
            transform: showToast ? 'translateY(0)' : 'translateY(-12px)',
            opacity:   showToast ? 1 : 0,
            pointerEvents: showToast ? 'auto' : 'none',
        }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 20px', borderRadius: 18,
                background: '#ffffff',
                border: `1px solid ${SLATE_200}`,
                boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                minWidth: 300,
            }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={18} color={GREEN} />
                </div>
                <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, color: DARK }}>¡Bienvenido, {user?.name}!</p>
                    <p style={{ fontSize: 11, color: SLATE, marginTop: 2 }}>Sesión iniciada correctamente.</p>
                </div>
                <button onClick={() => setShowToast(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8, color: SLATE }}>
                    <X size={16} />
                </button>
            </div>
        </div>,
        document.body
    );

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: SLATE, fontSize: 14 }}>
            Cargando tablero…
        </div>
    );

    // ── Filtered events ───────────────────────────────────────────────────────
    const filteredEvents = eventFilter === 'all'
        ? stats.upcomingEvents
        : stats.upcomingEvents.filter(e => e.status === eventFilter);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={{ background: '#ffffff', minHeight: '100vh', padding: '32px 0 40px' }}>
            <WelcomeToast />

            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* ── HEADER ─────────────────────────────────────────────────────── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, fontWeight: 700, color: DARK }}>
                            Hola, {user?.name} ✦
                        </h1>
                        <p style={{ fontSize: 13, color: SLATE, marginTop: 4 }}>
                            Resumen financiero y operativo de hoy
                        </p>
                    </div>
                    <div style={{
                        background: DARK, color: '#ffffff',
                        padding: '8px 18px', borderRadius: 24,
                        fontSize: 12, fontWeight: 500, letterSpacing: '0.04em',
                        textTransform: 'capitalize',
                    }}>
                        {today}
                    </div>
                </div>

                {/* ── KPIs ───────────────────────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                    <KpiCard title="Ingresos Mes"     value={fmt(stats.income)}                    icon={TrendingUp} accent={RED}   bgAccent={RED_LIGHT}  trend="12% vs mes anterior"    trendUp={true} />
                    <KpiCard title="Reservas Activas" value={stats.activeReservations.toString()}  icon={Calendar}   accent={DARK}  bgAccent={SLATE_100}  trend="3 eventos esta semana"              />
                    <KpiCard title="Saldo por Cobrar" value={fmt(stats.pendingBalance)}            icon={AlertCircle}accent={AMBER} bgAccent="#fffbeb"    trend="Gestión requerida"      trendUp={false}/>
                    <KpiCard title="Total Clientes"   value={stats.totalClients.toString()}        icon={Users}      accent={GREEN} bgAccent="#ecfdf5"    trend="+2 nuevos esta semana"  trendUp={true} />
                </div>

                {/* ── ROW 1: Barras + Donut ──────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>

                    <SectionCard title="Ingresos mensuales" subtitle="Últimos 6 meses de ventas" icon={BarChart2} iconColor={RED}>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={stats.monthlyIncomeData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={SLATE_100} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: SLATE, fontSize: 11 }} dy={8} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: SLATE, fontSize: 10 }} tickFormatter={fmt} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar
                                    dataKey="ingresos"
                                    name="Ingresos"
                                    radius={[6, 6, 0, 0]}
                                    barSize={36}
                                >
                                    {stats.monthlyIncomeData.map((_: any, i: number) => (
                                        <Cell
                                            key={i}
                                            fill={i === stats.monthlyIncomeData.length - 1 ? RED : SLATE_200}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </SectionCard>

                    <SectionCard title="Tipos de evento" subtitle="Distribución por categoría" icon={PieChartIcon} iconColor={SLATE}>
                        {/* leyenda custom */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                            {stats.eventTypeData.map((d: any, i: number) => (
                                <span key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: SLATE }}>
                                    <span style={{ width: 8, height: 8, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length], display: 'inline-block' }} />
                                    {d.name} {d.value}
                                </span>
                            ))}
                        </div>
                        <ResponsiveContainer width="100%" height={210}>
                            <PieChart>
                                <Pie data={stats.eventTypeData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                                    {stats.eventTypeData.map((_: any, i: number) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any, name: any) => [v, name]} contentStyle={{ borderRadius: 12, border: `1px solid ${SLATE_200}`, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </SectionCard>
                </div>

                {/* ── ROW 2: Area + Metas + Repertorio ──────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

                    <SectionCard title="Tendencia de reservas" subtitle="Confirmadas vs pendientes por semana" icon={Activity} iconColor={GREEN}>
                        <ResponsiveContainer width="100%" height={175}>
                            <AreaChart data={stats.weeklyTrendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gConf" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor={RED}  stopOpacity={0.12} />
                                        <stop offset="95%" stopColor={RED}  stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gPend" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor={DARK} stopOpacity={0.08} />
                                        <stop offset="95%" stopColor={DARK} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: SLATE, fontSize: 10 }} dy={6} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: SLATE, fontSize: 10 }} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={SLATE_100} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="confirmadas" name="Confirmadas" stroke={RED}  strokeWidth={2.5} fill="url(#gConf)" />
                                <Area type="monotone" dataKey="pendientes"  name="Pendientes"  stroke={DARK} strokeWidth={2}   fill="url(#gPend)" />
                                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </SectionCard>

                    <SectionCard title="Metas del mes" subtitle="Progreso hacia objetivos" icon={Target} iconColor={AMBER}>
                        <GoalBar label="Ingresos mensuales"   pct={84} color={RED}   />
                        <GoalBar label="Nuevos clientes"      pct={66} color={DARK}  />
                        <GoalBar label="Reservas confirmadas" pct={75} color={GREEN} />
                        <GoalBar label="NPS satisfacción"     pct={92} color={AMBER} />
                    </SectionCard>

                    <SectionCard title="Top repertorio" subtitle="Canciones más solicitadas" icon={Music} dark>
                        {[
                            { name: 'El Rey',          author: 'José A. Jiménez',    count: 98, pct: 95, color: RED      },
                            { name: 'Si Nos Dejan',    author: 'José A. Jiménez',    count: 85, pct: 80, color: '#64748b' },
                            { name: 'Hermoso Cariño',  author: 'Vicente Fernández',  count: 72, pct: 65, color: '#475569' },
                            { name: 'Volver, Volver',  author: 'Vicente Fernández',  count: 61, pct: 55, color: '#334155' },
                            { name: 'Cielito Lindo',   author: 'Quirino Mendoza',    count: 54, pct: 48, color: '#1e293b' },
                        ].map(s => <RepertoireBar key={s.name} {...s} />)}
                    </SectionCard>
                </div>

                {/* ── ROW 3: Eventos + Proyección ────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>

                    <SectionCard title="Próximos eventos" subtitle="Ordenados por fecha" icon={Calendar} iconColor={DARK}>
                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                            {(['all', 'Confirmado', 'Pendiente'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setEventFilter(f)}
                                    style={{
                                        fontSize: 11, fontWeight: 600,
                                        padding: '5px 13px', borderRadius: 20,
                                        border: `1px solid ${eventFilter === f ? DARK : SLATE_200}`,
                                        background: eventFilter === f ? DARK : 'transparent',
                                        color: eventFilter === f ? '#fff' : SLATE,
                                        cursor: 'pointer', transition: 'all 0.15s',
                                    }}
                                >
                                    {f === 'all' ? 'Todos' : f}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
                            {filteredEvents.length === 0 && (
                                <p style={{ color: SLATE, fontSize: 13, textAlign: 'center', padding: 24 }}>Sin eventos</p>
                            )}
                            {filteredEvents.map(ev => (
                                <div key={ev.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '10px 14px', borderRadius: 13,
                                    background: SLATE_100, border: `1px solid ${SLATE_200}`,
                                }}>
                                    <div style={{
                                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                        background: ev.status === 'Confirmado' ? GREEN : AMBER,
                                    }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: 12, fontWeight: 600, color: DARK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {ev.eventType} — {ev.clientName}
                                        </p>
                                        <p style={{ fontSize: 10, color: SLATE, marginTop: 2 }}>
                                            {new Date(ev.eventDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: DARK, whiteSpace: 'nowrap' }}>
                                        {fmt(ev.totalAmount)}
                                    </span>
                                    <StatusBadge status={ev.status} />
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    <SectionCard title="Proyección de ingresos" subtitle="Simulador interactivo de escenarios" icon={TrendingUp} iconColor={GREEN}>
                        <ProjectionSlider />
                    </SectionCard>
                </div>

                {/* ── HEATMAP ────────────────────────────────────────────────────── */}
                <SectionCard title="Mapa de calor — Disponibilidad semanal" subtitle="Ocupación por día y franja horaria · últimas 4 semanas" icon={BarChart2} iconColor={RED}>
                    <Heatmap />
                </SectionCard>

                {/* ── ACTIVIDAD RECIENTE ─────────────────────────────────────────── */}
                <SectionCard title="Actividad reciente" subtitle="Últimas reservas registradas" icon={Activity} iconColor={SLATE}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {stats.recentActivity.length === 0 && (
                            <p style={{ color: SLATE, fontSize: 13, textAlign: 'center', padding: 24 }}>Sin actividad reciente.</p>
                        )}
                        {stats.recentActivity.map(r => (
                            <div key={r.id} style={{
                                display: 'flex', alignItems: 'center', gap: 14,
                                padding: '12px 16px', borderRadius: 14,
                                background: SLATE_100, border: `1px solid ${SLATE_200}`,
                            }}>
                                <div style={{
                                    width: 38, height: 38, borderRadius: '50%',
                                    background: '#ffffff', border: `1px solid ${SLATE_200}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 13, fontWeight: 700, color: DARK, flexShrink: 0,
                                }}>
                                    {r.clientName.charAt(0)}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: DARK }}>
                                        {r.eventType} — {r.clientName}
                                    </p>
                                    <p style={{ fontSize: 11, color: SLATE, marginTop: 2 }}>
                                        {new Date(r.createdAt).toLocaleDateString('es-CO')} · {r.status}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: DARK }}>{fmt(r.totalAmount)}</p>
                                    <p style={{ fontSize: 10, color: SLATE, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        Valor total
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>

            </div>
        </div>
    );
};