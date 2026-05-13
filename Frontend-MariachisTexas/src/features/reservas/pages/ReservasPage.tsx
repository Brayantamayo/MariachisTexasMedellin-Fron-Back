import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar as CalendarIcon, 
  List, 
  Plus, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Lock, 
  ShieldAlert, 
  FileText, 
  Clock, 
  Phone, 
  Zap,
  Info,
  User as UserIcon,
  MapPin as MapPinIcon
} from 'lucide-react';
import { UserRole } from '@/types';
import { useReservasManager } from '../hooks/useReservasManager';

import { ReservasTable } from '../components/ReservasTable';
import { UpcomingReservationsBanner } from '../components/UpcomingReservationsBanner';
import { ReservaCreateModal } from '../components/ReservaCreateModal';
import { ReservaEditModal } from '../components/ReservaEditModal';
import { ReservaDetailModal } from '../components/ReservaDetailModal';
import { RehearsalDetailModal } from '../../ensayos/components/RehearsalDetailModal';
import { DateDetailsModal } from '@/src/features/reservas/components/DateDetailsModal';
import { AbonoCreateModal } from '../../abonos/components/AbonoCreateModal';
import { BlockFormModal } from '../../bloqueos/components/BlockFormModal';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal';
import { format12h } from '@/shared/utils/time';

const PendingPaymentBanner: React.FC<{ reservations: any[] }> = ({ reservations }) => {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])
  const pendingReservations = reservations.filter(r =>
    r.status === 'PENDIENTE' && new Date(r.eventDate) >= new Date(now.toDateString())
  )
  if (!pendingReservations.length) return null
  const formatCountdown = (eventDate: string) => {
    const target = new Date(eventDate + 'T00:00:00')
    const diff = target.getTime() - now.getTime()
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, urgent: true }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    return { days, hours, minutes, seconds, urgent: days <= 3 }
  }
  return (
    <div className="space-y-3 mb-6">
      {pendingReservations.map(res => {
        const { days, hours, minutes, seconds, urgent } = formatCountdown(res.eventDate)
        const anticipo = Math.ceil(Number(res.totalAmount) / 2)
        return (
          <div key={res.id} className={`relative overflow-hidden rounded-2xl border p-5 ${urgent ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className={`absolute right-0 top-0 bottom-0 w-32 opacity-5 flex items-center justify-center ${urgent ? 'text-red-900' : 'text-amber-900'}`}>
              <Clock size={120} />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${urgent ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                  <Clock size={20} />
                </div>
                <div>
                  <p className={`font-bold text-sm mb-0.5 ${urgent ? 'text-red-800' : 'text-amber-800'}`}> Reserva #{res.id} pendiente de pago</p>
                  <p className={`text-xs leading-relaxed ${urgent ? 'text-red-700' : 'text-amber-700'}`}>
                    Para confirmar tu evento del <strong>{res.eventDate}</strong> debes pagar el anticipo del 50%. Comunícate con nosotros para realizar el pago.
                  </p>
                  <p className={`text-sm font-bold mt-1 ${urgent ? 'text-red-800' : 'text-amber-800'}`}>
                    Anticipo requerido: <span className="text-lg">${anticipo.toLocaleString('es-CO')} COP</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 shrink-0">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${urgent ? 'text-red-500' : 'text-amber-500'}`}>
                  {urgent ? '⏰ ¡Tiempo límite!' : 'Tiempo restante'}
                </p>
                <div className="flex items-center gap-1">
                  {[{ value: days, label: 'días' }, { value: hours, label: 'hrs' }, { value: minutes, label: 'min' }, { value: seconds, label: 'seg' }].map(({ value, label }, i) => (
                    <React.Fragment key={label}>
                      {i > 0 && <span className={`text-lg font-bold ${urgent ? 'text-red-400' : 'text-amber-400'}`}>:</span>}
                      <div className={`flex flex-col items-center px-2 py-1 rounded-lg min-w-[42px] ${urgent ? 'bg-red-100' : 'bg-amber-100'}`}>
                        <span className={`text-xl font-mono font-black ${urgent ? 'text-red-700' : 'text-amber-700'}`}>{String(value).padStart(2, '0')}</span>
                        <span className={`text-[9px] uppercase font-bold ${urgent ? 'text-red-400' : 'text-amber-400'}`}>{label}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
                <a href="tel:3122373486" className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${urgent ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/30' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30'}`}>
                  <Phone size={14} /> 312 237 3486
                </a>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}


export const ReservasPage: React.FC = () => {
  const [isRehearsalDetailOpen, setIsRehearsalDetailOpen] = useState(false);
  const [selectedRehearsal, setSelectedRehearsal] = useState<any>(null);

  const {
    view, setView, currentDate, setCurrentDate,
    reservations, calendarReservations, blocks, setBlocks,
    rehearsals, quotations, loading, searchTerm, setSearchTerm,
    isDragging, setIsDragging, dragStart, setDragStart, dragEnd, setDragEnd,
    longPressTimer, isLongPressAction,
    isCreateOpen, setIsCreateOpen, isEditOpen, setIsEditOpen,
    isDetailOpen, setIsDetailOpen, isAbonoModalOpen, setIsAbonoModalOpen,
    isDateDetailsOpen, setIsDateDetailsOpen, isBlockModalOpen, setIsBlockModalOpen,
    editingReserva, setEditingReserva, selectedReserva, setSelectedReserva,
    selectedDateForForm, setSelectedDateForForm, selectedTimeForForm, setSelectedTimeForForm,
    selectedDateForDetails, setSelectedDateForDetails,
    abonoReservationId, setAbonoReservationId, selectedBlockForEdit, setSelectedBlockForEdit,
    finalizeModal, setFinalizeModal, deleteBlockModal, setDeleteBlockModal,
    deleteTimeBlocksModal, setDeleteTimeBlocksModal,
    deleteReservaModal, setDeleteReservaModal, handleDeleteReserva,
    notification, setNotification, showNotification,
    canManage, isClient, user,
    handleCreate, handleUpdate, handleSaveBlock,
    handleConfirmDeleteBlock, handleConfirmDeleteTimeBlocks,
    handleSaveAbono, processFinalization, processCancel, handleTimeSlotBlock, handleViewReserva,
  } = useReservasManager();

  const handleDateMouseDown = (dateStr: string) => {
    setIsDragging(true); setDragStart(dateStr); setDragEnd(dateStr);
    isLongPressAction.current = false;
    if (canManage) {
      longPressTimer.current = setTimeout(() => {
        isLongPressAction.current = true; setIsDragging(false);
        const existingFullBlock = blocks.find(b => b.isActive && (b.type === 'FULL_DATE' || b.type === 'DATE_RANGE') && dateStr >= b.startDate && dateStr <= b.endDate);
        if (existingFullBlock) { setDeleteBlockModal({ isOpen: true, blockId: existingFullBlock.id }); return; }
        const hasTimeBlocks = blocks.some(b => b.isActive && b.type === 'TIME_RANGE' && b.startDate === dateStr);
        if (hasTimeBlocks) { setDeleteTimeBlocksModal({ isOpen: true, date: dateStr }); return; }
        setSelectedBlockForEdit({ id: '', type: 'FULL_DATE', reason: '', description: '', startDate: dateStr, endDate: dateStr, isActive: true });
        setIsBlockModalOpen(true);
      }, 700);
    }
  };

  const handleDateMouseEnter = (dateStr: string) => {
    if (isDragging) {
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
      setDragEnd(dateStr);
    }
  };

  const handleDateMouseUp = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    setIsDragging(false);
    if (isLongPressAction.current) return;
    if (!dragStart || !dragEnd) return;
    let start = dragStart, end = dragEnd;
    if (start > end) [start, end] = [end, start];
    if (start === end) {
      handleDateClick(start);
    } else if (canManage) {
      setSelectedBlockForEdit({ id: '', type: 'DATE_RANGE', reason: '', description: '', startDate: start, endDate: end, isActive: true });
      setIsBlockModalOpen(true);
    } else {
      setSelectedDateForForm(start); setIsCreateOpen(true);
    }
    setDragStart(null); setDragEnd(null);
  };

  const handleDateClick = (dateStr: string) => {
    const fullBlock = blocks.find(b => b.isActive && (b.type === 'FULL_DATE' || b.type === 'DATE_RANGE') && dateStr >= b.startDate && dateStr <= b.endDate);
    if (fullBlock && !canManage) { showNotification(`Fecha bloqueada: ${fullBlock.reason}.`, 'error'); return; }
    setSelectedDateForDetails(dateStr); setIsDateDetailsOpen(true);
  };

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + offset); return d; });
  };

  const isDateSelected = (dateStr: string) => {
    if (!isDragging || !dragStart || !dragEnd) return false;
    let s = dragStart, e = dragEnd;
    if (s > e) [s, e] = [e, s];
    return dateStr >= s && dateStr <= e;
  };

  const filteredReservations = reservations.filter(r => {
    const matchesSearch = (r.clientName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.eventType.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.id.toString().includes(searchTerm);
    
    if (isClient) return matchesSearch;

    // Queremos ver solo las reservas activas (Pendientes, Confirmadas, Finalizadas)
    // El usuario pidió que si se anula en ventas (o aquí) NO aparezca más en la lista de reservas.
    const visibleStatuses = ['PENDIENTE', 'CONFIRMADA', 'FINALIZADO'];
    
    return matchesSearch && visibleStatuses.includes(r.status);
  });

  const renderCalendar = () => {
    const totalDays = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate);
    const days = [];
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const nowTime = today.getTime();

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-slate-50/50 border border-slate-100" />);
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isPast = dateStr < todayStr;

      const getPrevDay = (d: string) => {
        const date = new Date(`${d}T00:00:00`);
        date.setDate(date.getDate() - 1);
        return date.toISOString().split('T')[0];
      };
      const prevDateStr = getPrevDay(dateStr);

      const dayEvents = calendarReservations.filter(r => {
        if (r.status === 'ANULADA') return false;
        if (r.eventDate === dateStr) return true;
        // Rollover: si empezó ayer y termina hoy después de las 00:00
        if (r.eventDate === prevDateStr && r.endTime && r.endTime < (r.startTime || r.eventTime)) return true;
        return false;
      });
      
      const dayBlocks = blocks.filter(b => b.startDate <= dateStr && b.endDate >= dateStr && b.isActive);
      
      const dayRehearsals = rehearsals.filter(r => r.date === dateStr && r.status !== 'LISTO');
      
      const dayQuotes = quotations.filter(q => {
        if (q.status !== 'EN_ESPERA') return false;
        if (q.eventDate === dateStr) return true;
        if (q.eventDate === prevDateStr && q.endTime && q.endTime < q.startTime) return true;
        return false;
      });

      const isFullDayBlock = dayBlocks.some(b => b.type === 'FULL_DATE' || b.type === 'DATE_RANGE');
      const isToday = dateStr === todayStr;
      const isSelected = isDateSelected(dateStr);

      const totalItems = dayEvents.length + dayRehearsals.length + dayQuotes.length;

      const s = (ev: any) => (ev.status ?? '').toUpperCase();
      
      let dotColorClass = 'bg-slate-300';
      if (totalItems > 0) {
        dotColorClass = 'bg-emerald-400';
        // Solo mostramos azul si hay algún evento finalizado y ya pasó el tiempo
        const hasPassedFinalized = dayEvents.some(ev => {
          if (s(ev) !== 'FINALIZADO') return false;
          const evTime = ev.startTime || ev.eventTime || '23:59';
          const evDateTime = new Date(`${ev.eventDate}T${evTime}`);
          return !isNaN(evDateTime.getTime()) && nowTime > evDateTime.getTime();
        });
        if (hasPassedFinalized) {
          dotColorClass = 'bg-blue-500';
        } else if (dayEvents.some(e => s(e) === 'CONFIRMADA')) {
          dotColorClass = 'bg-emerald-400';
        } else if (dayEvents.some(e => s(e) === 'PENDIENTE')) {
          dotColorClass = 'bg-amber-400';
        }
      }

      days.push(
        <div
          key={day}
          onMouseDown={() => !isPast && handleDateMouseDown(dateStr)}
          onMouseEnter={() => !isPast && handleDateMouseEnter(dateStr)}
          onMouseUp={() => !isPast && handleDateMouseUp()}
          className={`h-36 border border-slate-100 p-3 transition-all relative group overflow-hidden select-none
            ${isToday ? 'bg-blue-50/20 ring-1 ring-blue-100' : 'bg-white'}
            ${!isFullDayBlock && !isSelected && !isPast ? 'hover:bg-slate-50/50 hover:shadow-[inset_0_0_20px_rgba(0,0,0,0.01)] cursor-pointer' : ''}
            ${isPast ? 'bg-slate-50/60 grayscale opacity-40' : ''}
            ${isSelected ? (canManage ? 'bg-red-50/30 border-red-200' : 'bg-emerald-50/30 border-emerald-200') : ''}
          `}
          style={isFullDayBlock ? { backgroundImage: 'repeating-linear-gradient(45deg,#fff1f2 0,#fff1f2 10px,#ffe4e6 10px,#ffe4e6 20px)' } : {}}
        >
          {/* Header del día */}
          <div className="flex justify-between items-start mb-3 pointer-events-none relative z-10">
            <div className="flex items-center gap-2">
              <span className={`text-[13px] font-black w-8 h-8 flex items-center justify-center rounded-xl transition-all
                ${isToday ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105' : 'text-slate-800'}
                ${isFullDayBlock ? 'bg-red-500 text-white' : ''}
                ${isPast && !isToday ? 'text-slate-400' : ''}
              `}>{day}</span>
              {!isFullDayBlock && !isPast && totalItems > 0 && (
                <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${dotColorClass}`} />
              )}
            </div>
            {totalItems > 0 && (
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{totalItems}</span>
            )}
          </div>

          {/* Lista de eventos del día */}
          <div className="space-y-1 overflow-hidden h-[76px] relative z-10 pointer-events-none">
            {[
              ...dayBlocks.filter(b => b.type === 'TIME_RANGE').map(b => (
                <div key={b.id} className="text-[10px] border-l-4 border-red-500 bg-red-50 text-red-700 px-2 py-1.5 rounded-r-md font-black flex items-center gap-2 shadow-sm">
                  <ShieldAlert size={11} />
                  <span className="truncate">{format12h(b.startTime || '00:00')} BLOQUEO</span>
                </div>
              )),
              ...dayQuotes.map((quote, index) => (
                <div key={quote.id || `cot-${dateStr}-${index}`} className={`text-[10px] border-l-4 px-2 py-1.5 rounded-r-md font-black truncate flex items-center gap-2 shadow-sm ${ (isPast || isClient) ? 'border-slate-300 bg-slate-50 text-slate-400' : 'border-amber-500 bg-amber-50 text-amber-700'}`}>
                  {isClient ? <Lock size={11} /> : <FileText size={11} />}
                  <span>{format12h(quote.startTime)}</span>
                  <span className="opacity-70">{isClient ? 'RESERVADO' : 'COTIZACIÓN'}</span>
                </div>
              )),
              ...dayRehearsals.map((reh, index) => (
                <div key={reh.id || `reh-${dateStr}-${index}`} className={`text-[10px] border-l-4 px-2 py-1.5 rounded-r-md font-black truncate flex items-center gap-2 shadow-sm ${ (isPast || isClient) ? 'border-slate-300 bg-slate-50 text-slate-400' : 'border-purple-500 bg-purple-50 text-purple-700'}`}>
                  {isClient ? <Lock size={11} /> : <Zap size={11} />}
                  <span>{format12h(reh.time)}</span> 
                  <span className="opacity-70">{isClient ? 'RESERVADO' : 'ENSAYO'}</span>
                </div>
              )),
              ...dayEvents
                .filter(() => dayQuotes.length === 0 && dayRehearsals.length === 0)
                .map(ev => {
                  const st = s(ev);
                  const isMine = user?.email === ev.clientEmail || reservations.some(r => r.id === ev.id);

                  const evTime = ev.eventTime || '23:59';
                  const evDateTime = new Date(`${ev.eventDate}T${evTime}`);
                  const hasPassed = !isNaN(evDateTime.getTime()) && nowTime > evDateTime.getTime();

                  let statusStyle = 'bg-emerald-50 border-emerald-500 text-emerald-800';
                  let timeStyle = 'text-emerald-600';

                  if (st === 'PENDIENTE') {
                    statusStyle = 'bg-amber-50 border-amber-500 text-amber-800';
                    timeStyle = 'text-amber-600';
                  } else if (st === 'FINALIZADO' && hasPassed) {
                    statusStyle = 'bg-blue-50 border-blue-500 text-blue-800';
                    timeStyle = 'text-blue-600';
                  } else if (st === 'ANULADA') {
                    statusStyle = 'bg-slate-50 border-slate-300 text-slate-400';
                    timeStyle = 'text-slate-400';
                  }

                  if (isPast || (isClient && !isMine)) {
                    statusStyle = 'bg-slate-50 border-slate-300 text-slate-400';
                    timeStyle = 'text-slate-400';
                  }

                  const label = isClient
                    ? (isMine ? `TU RESERVA - ${ev.clientName || ''}` : 'RESERVADO')
                    : (canManage ? (ev.clientName || ev.clientEmail || `#${ev.id}`) : ev.eventType);

                  return (
                    <div key={ev.id} title={label} 
                      className={`text-[10px] border-l-4 px-2 py-1.5 rounded-r-md truncate flex items-center gap-2 mb-1 shadow-sm transition-all hover:brightness-95 hover:shadow-md cursor-pointer ${statusStyle}`}>
                      <span className={`font-black shrink-0 ${timeStyle}`}>{format12h(ev.eventTime)}</span>
                      <span className="font-black uppercase tracking-tight truncate flex-1">{label}</span>
                    </div>
                  );
                })
            ].slice(0, 2)}
            
            {totalItems > 2 && (
              <div className="text-[9px] font-bold text-slate-400 text-center uppercase mt-1">
                 + {totalItems - 2} más
              </div>
            )}
          </div>

          {isFullDayBlock && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
              <ShieldAlert size={56} className="text-red-900" />
            </div>
          )}
          {!isDragging && !isFullDayBlock && !isPast && (
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <button onClick={(e) => { e.stopPropagation(); handleDateClick(dateStr); }}
                className="p-1 bg-white border border-slate-200 rounded text-slate-400 hover:text-primary-600 hover:border-primary-200 shadow-sm">
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
    <div className="space-y-6 animate-fade-in-up pb-10" onMouseUp={() => { if (isDragging || longPressTimer.current) handleDateMouseUp(); }}>

      {notification && createPortal(
        <div className="fixed top-6 right-6 z-[200] animate-fade-in-up">
          <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md min-w-[320px] ${notification.type === 'success' ? 'bg-white/95 border-emerald-100' : 'bg-white/95 border-red-100'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            </div>
            <div className="flex-1">
              <h4 className={`font-bold text-sm ${notification.type === 'success' ? 'text-emerald-950' : 'text-red-950'}`}>{notification.type === 'success' ? 'Notificación' : 'Alerta'}</h4>
              <p className="text-xs text-slate-500 font-medium">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
        </div>,
        document.body
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1e293b] tracking-wide uppercase">Gestión de Reservas</h1>
          <p className="text-slate-500 mt-2 text-sm">Control de agenda, fechas y disponibilidad de eventos.</p>
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
            <button
              onClick={() => setIsCreateOpen(true)}
              className="bg-[#dc2626] hover:bg-red-700 text-white px-8 py-3 rounded-full flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 font-bold text-xs tracking-widest uppercase"
            >
              <Plus size={16} strokeWidth={3} /> NUEVA RESERVA
            </button>
          )}
        </div>
      </div>

      {isClient && <PendingPaymentBanner reservations={reservations} />}
      {!isClient && canManage && (
        <UpcomingReservationsBanner 
          reservations={calendarReservations} 
          onView={handleViewReserva} 
        />
      )}

      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        {view === 'list' ? (
          <div className="flex flex-col h-full">
            <div className="p-8 pb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Buscar Reserva"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-full py-3 pl-11 pr-6 text-slate-600 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all placeholder:text-slate-400 text-sm" />
              </div>
            </div>
            <ReservasTable
              reservations={filteredReservations}
              loading={loading}
              userRole={user?.role}
              onView={(res) => handleViewReserva(res)}
              onEdit={(res) => { setEditingReserva(res); setIsEditOpen(true); }}
              onAddPayment={(id) => { setAbonoReservationId(id); setIsAbonoModalOpen(true); }}
              onFinalize={(id) => setFinalizeModal({ isOpen: true, id })}
              onCancel={processCancel}
              onDelete={(id) => setDeleteReservaModal({ isOpen: true, id })}
            />
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><ChevronLeft className="text-slate-600" /></button>
              <h2 className="text-xl font-serif font-bold text-slate-800 uppercase tracking-widest">
                {monthNames[currentDate.getMonth()]} <span className="text-primary-600">{currentDate.getFullYear()}</span>
              </h2>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><ChevronRight className="text-slate-600" /></button>
            </div>
            <div className="flex-1 p-6">
              <div className="grid grid-cols-7 mb-4 text-center">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                  <div key={d} className="text-xs font-bold text-slate-400 uppercase tracking-widest">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
            </div>
          </div>
        )}
      </div>

      <ReservaCreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSave={handleCreate} selectedDate={selectedDateForForm} selectedTime={selectedTimeForForm} />
      <ReservaEditModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} onSave={handleUpdate} reservation={editingReserva} />
      <ReservaDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        reservation={selectedReserva}
        onFinalize={processFinalization}
        onCancel={(id, motivo) => processCancel(id, motivo)}
        onReschedule={(res) => {
          const realRes = reservations.find(r => r.id === res.id) ?? res;
          setEditingReserva(realRes);
          setIsDetailOpen(false);
          setIsEditOpen(true);
        }}
      />
      <AbonoCreateModal isOpen={isAbonoModalOpen} onClose={() => setIsAbonoModalOpen(false)} onSave={handleSaveAbono} initialReservationId={abonoReservationId} />

      <DateDetailsModal
        isOpen={isDateDetailsOpen} onClose={() => setIsDateDetailsOpen(false)} date={selectedDateForDetails}
        reservations={calendarReservations.filter(r => {
          if (r.status === 'ANULADA') return false;
          if (r.eventDate === selectedDateForDetails) return true;
          const getPrevDay = (d: string) => {
            if (!d) return '';
            const date = new Date(`${d}T00:00:00`);
            date.setDate(date.getDate() - 1);
            return date.toISOString().split('T')[0];
          };
          const prevDateStr = getPrevDay(selectedDateForDetails || '');
          if (r.eventDate === prevDateStr && r.endTime && r.endTime < (r.startTime || r.eventTime)) return true;
          return false;
        })}
        blocks={blocks.filter(b => b.startDate <= (selectedDateForDetails || '') && b.endDate >= (selectedDateForDetails || '') && b.isActive)}
        rehearsals={rehearsals.filter(r => r.date === selectedDateForDetails && r.status !== 'LISTO')}
        quotations={quotations.filter(q => {
          if (q.status !== 'EN_ESPERA') return false;
          if (q.eventDate === selectedDateForDetails) return true;
          const getPrevDay = (d: string) => {
            if (!d) return '';
            const date = new Date(`${d}T00:00:00`);
            date.setDate(date.getDate() - 1);
            return date.toISOString().split('T')[0];
          };
          const prevDateStr = getPrevDay(selectedDateForDetails || '');
          if (q.eventDate === prevDateStr && q.endTime && q.endTime < q.startTime) return true;
          return false;
        })}
        onViewReservation={(res) => { setIsDateDetailsOpen(false); handleViewReserva(res); }}
        onViewRehearsal={(reh) => { 
          setIsDateDetailsOpen(false); 
          setSelectedRehearsal(reh); 
          setIsRehearsalDetailOpen(true); 
        }}
        onCreateNew={(time) => { setIsDateDetailsOpen(false); setSelectedDateForForm(selectedDateForDetails); setSelectedTimeForForm(time || null); setIsCreateOpen(true); }}
        onBlockTime={handleTimeSlotBlock}
        onDeleteBlock={(id) => setDeleteBlockModal({ isOpen: true, blockId: id })}
      />

      {canManage && <BlockFormModal isOpen={isBlockModalOpen} onClose={() => setIsBlockModalOpen(false)} onSave={handleSaveBlock} initialData={selectedBlockForEdit} />}

      <ConfirmationModal isOpen={finalizeModal.isOpen} onClose={() => setFinalizeModal({ ...finalizeModal, isOpen: false })} onConfirm={processFinalization} title="¿Finalizar Evento?" message="Marcará la reserva como completada." confirmText="Sí, Finalizar" />
      <ConfirmationModal isOpen={deleteBlockModal.isOpen} onClose={() => setDeleteBlockModal({ ...deleteBlockModal, isOpen: false })} onConfirm={handleConfirmDeleteBlock} title="¿Eliminar Bloqueo?" message="Liberará la fecha en el calendario." />
      <ConfirmationModal isOpen={deleteTimeBlocksModal.isOpen} onClose={() => setDeleteTimeBlocksModal({ ...deleteTimeBlocksModal, isOpen: false })} onConfirm={handleConfirmDeleteTimeBlocks} title="¿Liberar Horarios?" message="Se eliminarán todos los bloqueos de horas en este día." confirmText="Liberar Todo" />
      <ConfirmationModal isOpen={deleteReservaModal.isOpen} onClose={() => setDeleteReservaModal({ ...deleteReservaModal, isOpen: false })} onConfirm={handleDeleteReserva} title="¿Eliminar Reserva?" message="Estás a punto de eliminar esta reserva permanentemente. Esta acción no se puede deshacer y se perderá el historial asociado." confirmText="Sí, eliminar" />
      
      <RehearsalDetailModal 
        isOpen={isRehearsalDetailOpen} 
        onClose={() => setIsRehearsalDetailOpen(false)} 
        rehearsal={selectedRehearsal} 
      />
    </div>
  );
};
