
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/shared/contexts/AuthContext';
import { UserRole, Reservation } from '@/types';
import { reservaService } from '../../reservas/services/reservaService';
import { ventaService } from '../../ventas/services/ventaService';
import { clientService } from '../../clientes/services/clientService';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  Music, 
  ArrowRight,
  CheckCircle,
  X,
  BarChart2,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

// Componente Interno para Tarjetas KPI
const KpiCard: React.FC<{ title: string, value: string, icon: any, color: string, trend: string }> = ({ title, value, icon: Icon, color, trend }) => {
    // Definimos solo colores de la paleta permitida
    const colorClasses: Record<string, string> = {
        emerald: 'bg-secondary-50 text-secondary-600', // Verde
        red: 'bg-primary-50 text-primary-600',         // Rojo
        dark: 'bg-dark-900 text-white',                // Negro
        gray: 'bg-slate-100 text-slate-600',           // Gris neutro (aceptable como soporte)
    };

    return (
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${colorClasses[color]}`}>
                    <Icon size={22} />
                </div>
                {/* Arrow icon simulated */}
                <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100">
                    <ArrowRight size={12} className="text-slate-400 -rotate-45" />
                </div>
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">{trend}</p>
            </div>
        </div>
    );
};

const COLORS = ['#ce1126', '#0f172a', '#64748b', '#e2e8f0', '#f87171'];

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    income: 0,
    activeReservations: 0,
    pendingBalance: 0,
    totalClients: 0,
    upcomingEvents: [] as Reservation[],
    recentActivity: [] as Reservation[],
    monthlyIncomeData: [] as any[],
    eventTypeData: [] as any[],
    reservationStatusData: [] as any[]
  });
  const [loading, setLoading] = useState(true);
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      
      const reservations = await reservaService.getReservations();
      const sales = await ventaService.getSales();
      const clients = await clientService.getClients();

      const activeRes = reservations.filter(r => r.status === 'Confirmado' || r.status === 'Pendiente');
      const totalIncome = sales.reduce((acc, curr) => acc + curr.amount, 0);
      const pending = activeRes.reduce((acc, curr) => acc + (curr.totalAmount - curr.paidAmount), 0);
      
      let relevantEvents = [...activeRes];
      relevantEvents.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

      // --- Procesamiento de Datos para Gráficos ---

      // 1. Ingresos Mensuales (Últimos 6 meses)
      const last6Months = Array.from({ length: 6 }, (_, i) => {
          const d = new Date();
          d.setDate(1); // Evitar problemas de días (ej: 31 de marzo -> febrero)
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

      // 3. Estado de Reservas (Tendencia Semanal - Últimas 4 semanas)
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
        totalClients: clients.length,
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

      {/* KPI Cards (Colors updated) */}
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

      {/* --- SECCIÓN DE GRÁFICOS --- */}
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
                          <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#94a3b8', fontSize: 12 }} 
                              dy={10}
                          />
                          <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: '#94a3b8', fontSize: 12 }} 
                              tickFormatter={(value) => `$${value / 1000}k`}
                          />
                          <Tooltip 
                              cursor={{ fill: '#f8fafc' }}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                          />
                          <Bar dataKey="ingresos" fill="#ce1126" radius={[6, 6, 0, 0]} barSize={40} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Gráfico 2: Distribución de Eventos */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                  <div>
                      <h3 className="font-serif font-bold text-slate-800 text-lg flex items-center gap-2">
                          <PieChartIcon size={20} className="text-slate-700" />
                          Tipos de Evento
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Distribución por categoría de servicio</p>
                  </div>
              </div>
              <div className="h-[300px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={stats.eventTypeData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                          >
                              {stats.eventTypeData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                              ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Gráfico 3: Tendencia de Reservas (Full Width opcional, o en grid) */}
          <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                  <div>
                      <h3 className="font-serif font-bold text-slate-800 text-lg flex items-center gap-2">
                          <Activity size={20} className="text-emerald-600" />
                          Tendencia de Reservas
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">Comparativa semanal: Confirmadas vs Pendientes</p>
                  </div>
              </div>
              <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.reservationStatusData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                              <linearGradient id="colorConfirmadas" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#ce1126" stopOpacity={0.1}/>
                                  <stop offset="95%" stopColor="#ce1126" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorPendientes" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                                  <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                          <Area type="monotone" dataKey="confirmadas" stroke="#ce1126" strokeWidth={3} fillOpacity={1} fill="url(#colorConfirmadas)" />
                          <Area type="monotone" dataKey="pendientes" stroke="#0f172a" strokeWidth={3} fillOpacity={1} fill="url(#colorPendientes)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

      </div>

      {/* Main Content Grid (Activity & Shortcuts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden p-6">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-serif font-bold text-slate-800 text-lg">Actividad Reciente</h3>
                  <button className="text-xs font-bold text-primary-600 hover:text-primary-700 uppercase tracking-widest">Ver Todo</button>
              </div>
              <div className="space-y-4">
                  {stats.recentActivity.map(res => (
                      <div key={res.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                          <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs shadow-sm">
                                  {res.clientName.charAt(0)}
                              </div>
                              <div>
                                  <p className="font-bold text-slate-800 text-sm">{res.eventType} - {res.clientName}</p>
                                  <p className="text-xs text-slate-500">{new Date(res.createdAt).toLocaleDateString()} • {res.status}</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <p className="font-bold text-slate-700 text-sm">${res.totalAmount.toLocaleString()}</p>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Valor Total</p>
                          </div>
                      </div>
                  ))}
                  {stats.recentActivity.length === 0 && (
                      <p className="text-center text-slate-400 text-sm py-8">No hay actividad reciente.</p>
                  )}
              </div>
          </div>

          {/* Right: Quick Actions & Status */}
          <div className="space-y-6">
              
              {/* Top Repertoire Widget */}
              <div className="bg-dark-900 rounded-[2rem] p-6 text-white shadow-xl shadow-dark-900/10">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center border border-primary-600/30">
                          <Music className="text-primary-500" size={20} />
                      </div>
                      <h3 className="font-serif font-bold text-lg">Top Repertorio</h3>
                  </div>
                  
                  <div className="space-y-5">
                      {/* Song 1 */}
                      <div className="space-y-2">
                          <div className="flex justify-between items-end">
                              <div>
                                  <p className="font-bold text-sm">El Rey</p>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">José Alfredo Jiménez</p>
                              </div>
                              <span className="text-xs font-bold text-primary-500">98 Solicitudes</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-primary-600 to-primary-500 w-[95%]"></div>
                          </div>
                      </div>

                      {/* Song 2 */}
                      <div className="space-y-2">
                          <div className="flex justify-between items-end">
                              <div>
                                  <p className="font-bold text-sm">Si Nos Dejan</p>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">José Alfredo Jiménez</p>
                              </div>
                              <span className="text-xs font-bold text-slate-400">85 Solicitudes</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-secondary-600 to-secondary-500 w-[80%]"></div>
                          </div>
                      </div>

                      {/* Song 3 */}
                      <div className="space-y-2">
                          <div className="flex justify-between items-end">
                              <div>
                                  <p className="font-bold text-sm">Hermoso Cariño</p>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Vicente Fernández</p>
                              </div>
                              <span className="text-xs font-bold text-slate-400">72 Solicitudes</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-600 w-[65%]"></div>
                          </div>
                      </div>
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
};
