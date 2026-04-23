import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, CheckCircle, AlertCircle, X, List, Calendar as CalendarIcon, 
         ChevronLeft, ChevronRight, Music, ShieldAlert, FileText, Lock } from 'lucide-react';
import { Rehearsal, UserRole } from '@/types';
import { rehearsalService } from '../services/rehearsalService';
import { useReservasManager } from '@/src/features/reservas/hooks/useReservasManager';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal';
import { useAuth } from '@/shared/contexts/AuthContext';
import { RehearsalsTable } from '../components/RehearsalsTable';
import { RehearsalCreateModal } from '../components/RehearsalCreateModal';
import { RehearsalEditModal } from '../components/RehearsalEditModal';
import { RehearsalDetailModal } from '../components/RehearsalDetailModal';
import { DateDetailsModal } from '@/src/features/reservas/components/DateDetailsModal';
import { ReservaDetailModal } from '@/src/features/reservas/components/ReservaDetailModal';

const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export const EnsayosPage: React.FC = () => {
  const { user } = useAuth();
  const [rehearsals, setRehearsals] = useState<Rehearsal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRehearsal, setSelectedRehearsal] = useState<Rehearsal | null>(null);

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<Rehearsal | null>(null);
  const [selectedDateForCreate, setSelectedDateForCreate] = useState<string | null>(null);
  const [selectedTimeForCreate, setSelectedTimeForCreate] = useState<string | null>(null);

  // ── Datos de reservas/cotizaciones/bloqueos del hook compartido ─────────────
  const {
    calendarReservations,
    blocks,
    quotations,
    canManage,
    isDateDetailsOpen, setIsDateDetailsOpen,
    selectedDateForDetails, setSelectedDateForDetails,
    deleteBlockModal, setDeleteBlockModal,
    handleTimeSlotBlock,
    isDetailOpen: isReservaDetailOpen,
    setIsDetailOpen: setIsReservaDetailOpen,
    selectedReserva,
    handleViewReserva,
  } = useReservasManager();

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchRehearsals = async () => {
    setLoading(true);
    try {
      const data = await rehearsalService.getRehearsals();
      setRehearsals(data);
    } catch {
      showNotification("Error cargando ensayos.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRehearsals(); }, []);

  const handleCreateRehearsal = async (data: any) => {
    await rehearsalService.createRehearsal(data);
    await fetchRehearsals();
    showNotification('Ensayo programado exitosamente.');
    setIsCreateOpen(false);
  };

  const handleUpdateRehearsal = async (data: any) => {
    if (!selectedRehearsal) return;
    await rehearsalService.updateRehearsal(selectedRehearsal.id, data);
    await fetchRehearsals();
    showNotification('Ensayo actualizado correctamente.');
    setIsEditOpen(false);
    setSelectedRehearsal(null);
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await rehearsalService.deleteRehearsal(deleteModal.id);
      setRehearsals(prev => prev.filter(r => r.id !== deleteModal.id));
      showNotification('Ensayo eliminado del calendario.');
    } catch {
      showNotification("Error al eliminar.", "error");
    } finally {
      setDeleteModal({ isOpen: false, id: null });
    }
  };

  const doToggle = async (rehearsal: Rehearsal) => {
    try {
      await rehearsalService.toggleStatus(rehearsal.id);
      await fetchRehearsals();
    } catch {
      showNotification('Error al cambiar estado.', 'error');
    }
  };

  const handleToggleStatus = async (rehearsal: Rehearsal) => {
    if (rehearsal.status !== 'LISTO') { setConfirmModal(rehearsal); return; }
    await doToggle(rehearsal);
  };

  const handleConfirm = async () => {
    if (!confirmModal) return;
    await doToggle(confirmModal);
    setConfirmModal(null);
  };

  const filteredRehearsals = rehearsals.filter(r =>
    r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Helpers calendario ───────────────────────────────────────────────────────
  const daysInMonth     = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();
  const changeMonth     = (offset: number) => {
    setCurrentDate(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + offset); return d; });
  };

  const renderCalendar = () => {
    const totalDays = daysInMonth(currentDate);
    const startDay  = firstDayOfMonth(currentDate);
    const today     = new Date();
    const todayStr  = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const days: React.ReactNode[] = [];

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`e-${i}`} className="h-32 bg-slate-50/50 border border-slate-100" />);
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const isPast  = dateStr < todayStr;
      const isToday = dateStr === todayStr;

      const dayRehearsals = rehearsals.filter(r => r.date === dateStr && r.status !== 'LISTO');
      const dayEvents     = calendarReservations.filter(r => r.eventDate === dateStr && r.status !== 'ANULADA');
      const dayBlocks     = blocks.filter(b => b.startDate <= dateStr && b.endDate >= dateStr && b.isActive);
      const dayQuotes     = quotations.filter(q => q.eventDate === dateStr && q.status === 'EN_ESPERA');

      const isFullDayBlock = dayBlocks.some(b => b.type === 'FULL_DATE' || b.type === 'DATE_RANGE');
      const totalItems     = dayRehearsals.length + dayEvents.length + dayQuotes.length;

      // Dot de color según prioridad
      let dotColorClass = 'bg-slate-300';
      if (totalItems > 0)                                               dotColorClass = 'bg-purple-400';
      if (dayEvents.some(e => (e.status ?? '').toUpperCase() === 'CONFIRMADA')) dotColorClass = 'bg-emerald-400';
      if (dayEvents.some(e => (e.status ?? '').toUpperCase() === 'REPROGRAMADA')) dotColorClass = 'bg-[#0c808b]';
      if (dayEvents.some(e => (e.status ?? '').toUpperCase() === 'FINALIZADO')) dotColorClass = 'bg-blue-500';

      days.push(
        <div
        key={day}
        onClick={() => {
            if (!isFullDayBlock && !isPast) {
            setSelectedDateForDetails(dateStr);
            setIsDateDetailsOpen(true);
            }
            }}
          style={{
            ...(isFullDayBlock ? { backgroundImage: 'repeating-linear-gradient(45deg,#fef2f2 0,#fef2f2 10px,#fee2e2 10px,#fee2e2 20px)' } : {}),
            ...(isPast ? { backgroundColor: '#f8fafc', opacity: 0.6, cursor: 'not-allowed' } : {}),
          }}
          className={`h-32 border border-slate-100 p-2 transition-all relative group overflow-hidden
            ${isToday ? 'bg-purple-50/30 ring-1 ring-purple-200' : 'bg-white'}
            ${!isFullDayBlock && !isPast ? 'hover:bg-slate-50 hover:shadow-md cursor-pointer' : ''}
          `}
        >
          {/* Número del día */}
          <div className="flex justify-between items-start mb-1 relative z-10">
            <div className="flex items-center gap-1">
              <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full
                ${isToday ? 'bg-purple-600 text-white' : ''}
                ${isFullDayBlock ? 'bg-red-100 text-red-600' : 'text-slate-700'}
                ${isPast ? 'text-slate-400' : ''}
              `}>{day}</span>
              {!isFullDayBlock && !isPast && totalItems > 0 && (
                <div className={`w-2 h-2 rounded-full ${dotColorClass}`} />
              )}
              {isFullDayBlock && <Lock size={11} className="text-red-400" />}
            </div>
            {totalItems > 0 && <span className="text-[9px] font-bold text-slate-400">{totalItems}</span>}
          </div>

          {/* Eventos del día */}
          <div className="space-y-0.5 overflow-y-auto max-h-[72px] custom-scrollbar relative z-10">

            {/* Bloqueos de hora */}
            {dayBlocks.filter(b => b.type === 'TIME_RANGE').map(b => (
              <div key={b.id} className="text-[9px] border border-red-200 bg-red-50 text-red-700 px-1 py-0.5 rounded font-bold flex items-center gap-1">
                <ShieldAlert size={9} />
                <span className="truncate">{b.startTime} Bloqueo</span>
              </div>
            ))}

            {/* Cotizaciones */}
            {dayQuotes.map((quote, i) => (
              <div key={quote.id || `cot-${dateStr}-${i}`} className="text-[9px] border border-red-200 bg-red-50 text-red-700 px-1 py-0.5 rounded font-bold truncate flex items-center gap-1">
                <FileText size={9} />
                <span className="font-bold">{quote.startTime}</span>
                <span className="truncate">Cotización</span>
              </div>
            ))}

            {/* Ensayos — púrpura */}
            {dayRehearsals.map(r => (
              <div
                key={r.id}
                onClick={(e) => { e.stopPropagation(); setSelectedRehearsal(r); setIsDetailOpen(true); }}
                className="text-[9px] border border-purple-200 bg-purple-50 text-purple-800 px-1 py-0.5 rounded font-bold flex items-center gap-1 cursor-pointer hover:bg-purple-100 transition-colors"
              >
                <Music size={8} />
                <span className="font-bold shrink-0">{r.time}</span>
                <span className="truncate">{r.title}</span>
              </div>
            ))}

            {/* Reservas — color según estado */}
            {dayEvents
  .filter(() => dayQuotes.length === 0 && dayRehearsals.length === 0)
  .map(ev => {
    const s = (ev.status ?? '').toUpperCase();
    let style    = 'bg-amber-50 border-amber-200 text-amber-800';
    let timeStyle = 'text-amber-600';
    if (s === 'CONFIRMADA') { style = 'bg-emerald-50 border-emerald-200 text-emerald-800'; timeStyle = 'text-emerald-600'; }
    if (s === 'REPROGRAMADA') { style = 'bg-[#e1f8ff] border-[#0c808b]/30 text-[#0c808b]'; timeStyle = 'text-[#0c808b]'; }
    if (s === 'FINALIZADO') { style = 'bg-blue-50 border-blue-200 text-blue-800'; timeStyle = 'text-blue-500'; }
    return (
      <div key={ev.id} className={`text-[9px] border px-1 py-0.5 rounded truncate flex items-center gap-1 ${style}`}>
        <span className={`font-bold shrink-0 ${timeStyle}`}>{ev.eventTime}</span>
        <span className="truncate font-medium">
          {canManage ? (ev.clientName || ev.clientEmail || `#${ev.id}`) : ev.eventType}
        </span>
      </div>
    );
  })}
          </div>

          {/* Fondo bloqueo total */}
          {isFullDayBlock && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
              <ShieldAlert size={56} className="text-red-900" />
            </div>
          )}

          {/* Botón + hover */}
          {!isFullDayBlock && !isPast && canManage && (
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedDateForCreate(dateStr); setIsCreateOpen(true); }}
                className="p-1 bg-white border border-slate-200 rounded text-slate-400 hover:text-purple-600 hover:border-purple-200 shadow-sm"
              >
                <Plus size={11} />
              </button>
            </div>
          )}
        </div>
      );
    }
    return days;
  };

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">

      {notification && createPortal(
        <div className="fixed top-6 right-6 z-[200] animate-fade-in-up">
          <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md min-w-[320px] ${
            notification.type === 'success' ? 'bg-white/95 border-emerald-100' : 'bg-white/95 border-red-100'
          }`}>
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
            }`}>
              {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            </div>
            <div className="flex-1">
              <h4 className={`font-bold text-sm ${notification.type === 'success' ? 'text-emerald-950' : 'text-red-950'}`}>
                {notification.type === 'success' ? 'Éxito' : 'Error'}
              </h4>
              <p className="text-xs text-slate-500 font-medium">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
        </div>,
        document.body
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1e293b] tracking-wide uppercase">Gestión de Ensayos</h1>
          <p className="text-slate-500 mt-2 text-sm">Organiza las prácticas y repertorio de la banda.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setView('list')} className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${view === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              <List size={16} /> Lista
            </button>
            <button onClick={() => setView('calendar')} className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${view === 'calendar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              <CalendarIcon size={16} /> Calendario
            </button>
          </div>
          {canManage && (
            <button onClick={() => setIsCreateOpen(true)}
              className="bg-[#dc2626] hover:bg-red-700 text-white px-8 py-3 rounded-full flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 font-bold text-xs tracking-widest uppercase">
              <Plus size={16} strokeWidth={3} /> NUEVO ENSAYO
            </button>
          )}
        </div>
      </div>

      {/* Modal confirmar completado */}
      {confirmModal && createPortal(
  <div className="fixed inset-0 z-[100] flex items-center justify-center">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmModal(null)} />
    <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 border border-slate-100">
      
      {/* Ícono */}
      <div className="flex justify-center mb-5">
        <div className="w-16 h-16 rounded-full bg-red-50 border-4 border-red-100 flex items-center justify-center">
          <CheckCircle className="text-red-600" size={28} />
        </div>
      </div>

      {/* Texto */}
      <div className="text-center mb-6">
        <h3 className="font-serif font-bold text-slate-800 text-xl uppercase tracking-wide mb-2">
          ¿Marcar como listo?
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          El ensayo{' '}
          <span className="font-bold text-slate-700">"{confirmModal.title}"</span>{' '}
          desaparecerá del calendario activo.
        </p>
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        <button
          onClick={() => setConfirmModal(null)}
          className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-sm font-bold uppercase tracking-widest shadow-lg shadow-red-900/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle size={16} />
          Confirmar
        </button>
      </div>
    </div>
  </div>,
  document.body
)}

      {/* Contenedor principal */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        {view === 'list' ? (
          <>
            <div className="p-8 pb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Buscar por nombre o lugar..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-full py-3 pl-11 pr-6 text-slate-600 focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all placeholder:text-slate-400 text-sm shadow-sm"
                />
              </div>
            </div>
            <RehearsalsTable
              rehearsals={filteredRehearsals} loading={loading} userRole={user?.role}
              onView={(r) => { setSelectedRehearsal(r); setIsDetailOpen(true); }}
              onEdit={(r) => { setSelectedRehearsal(r); setIsEditOpen(true); }}
              onDelete={(id) => setDeleteModal({ isOpen: true, id })}
              onToggleStatus={handleToggleStatus}
            />
          </>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <ChevronLeft className="text-slate-600" size={20} />
              </button>
              <h2 className="text-xl font-serif font-bold text-slate-800 uppercase tracking-widest">
                {monthNames[currentDate.getMonth()]} <span className="text-purple-600">{currentDate.getFullYear()}</span>
              </h2>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <ChevronRight className="text-slate-600" size={20} />
              </button>
            </div>

            {/* Leyenda */}
            <div className="flex flex-wrap items-center gap-4 px-6 pt-4 pb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                <span className="text-xs text-slate-500 font-medium">Ensayo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-xs text-slate-500 font-medium">Reserva pendiente</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-500 font-medium">Reserva confirmada</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0c808b]" />
                <span className="text-xs text-slate-500 font-medium">Reprogramada</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="text-xs text-slate-500 font-medium">Cotización</span>
              </div>
            </div>

            <div className="flex-1 p-6">
              <div className="grid grid-cols-7 mb-3 text-center">
                {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
                  <div key={d} className="text-xs font-bold text-slate-400 uppercase tracking-widest">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
            </div>
          </div>
        )}
      </div>

      <RehearsalCreateModal isOpen={isCreateOpen} onClose={() => { setIsCreateOpen(false); setSelectedDateForCreate(null); setSelectedTimeForCreate(null); }} onSave={handleCreateRehearsal} selectedDate={selectedDateForCreate} selectedTime={selectedTimeForCreate} />
      <RehearsalEditModal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setSelectedRehearsal(null); }} onSave={handleUpdateRehearsal} rehearsal={selectedRehearsal} />
      <RehearsalDetailModal isOpen={isDetailOpen} onClose={() => { setIsDetailOpen(false); setSelectedRehearsal(null); }} rehearsal={selectedRehearsal} />
      <ConfirmationModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} onConfirm={confirmDelete} title="¿Eliminar Ensayo?" message="Esta acción eliminará el evento del calendario. No se puede deshacer." />
      
      <DateDetailsModal
        isOpen={isDateDetailsOpen}
        onClose={() => setIsDateDetailsOpen(false)}
        date={selectedDateForDetails}
        reservations={calendarReservations.filter(r => r.eventDate === selectedDateForDetails && r.status !== 'ANULADA')}
        blocks={blocks.filter(b => b.startDate <= (selectedDateForDetails || '') && b.endDate >= (selectedDateForDetails || '') && b.isActive)}
        rehearsals={rehearsals.filter(r => r.date === selectedDateForDetails && r.status !== 'LISTO')}
        quotations={quotations.filter(q => q.eventDate === selectedDateForDetails && q.status === 'EN_ESPERA')}
        onViewReservation={(res) => { setIsDateDetailsOpen(false); handleViewReserva(res); }}
        onCreateNew={(time) => { 
          setIsDateDetailsOpen(false); 
          setSelectedDateForCreate(selectedDateForDetails); 
          setSelectedTimeForCreate(time || null);
          setIsCreateOpen(true); 
        }}
        onBlockTime={handleTimeSlotBlock}
        onDeleteBlock={(id) => setDeleteBlockModal({ isOpen: true, blockId: id })}
      />
      
      <ReservaDetailModal
        isOpen={isReservaDetailOpen}
        onClose={() => setIsReservaDetailOpen(false)}
        reservation={selectedReserva}
      />
    </div>
  );
};