import React from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, List, Plus, Search, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, X, Lock, ShieldAlert, FileText } from 'lucide-react';
import { UserRole } from '@/types';
import { useReservasManager } from '../hooks/useReservasManager';

import { ReservasTable }     from '../components/ReservasTable';
import { ReservaCreateModal } from '../components/ReservaCreateModal';
import { ReservaEditModal }   from '../components/ReservaEditModal';
import { ReservaDetailModal } from '../components/ReservaDetailModal';
import { DateDetailsModal }   from '@/src/features/reservas/components/DateDetailsModal';
import { AbonoCreateModal }   from '../../abonos/components/AbonoCreateModal';
import { BlockFormModal }     from '../../bloqueos/components/BlockFormModal';
import { ConfirmationModal }  from '@/shared/components/ConfirmationModal';

export const ReservasPage: React.FC = () => {
  const {
    view, setView,
    currentDate, setCurrentDate,
    reservations,
    calendarReservations,
    blocks, setBlocks,
    rehearsals,
    quotations,
    loading,
    searchTerm, setSearchTerm,
    isDragging, setIsDragging,
    dragStart, setDragStart,
    dragEnd, setDragEnd,
    longPressTimer,
    isLongPressAction,
    isCreateOpen, setIsCreateOpen,
    isEditOpen, setIsEditOpen,
    isDetailOpen, setIsDetailOpen,
    isAbonoModalOpen, setIsAbonoModalOpen,
    isDateDetailsOpen, setIsDateDetailsOpen,
    isBlockModalOpen, setIsBlockModalOpen,
    editingReserva, setEditingReserva,
    selectedReserva, setSelectedReserva,
    selectedDateForForm, setSelectedDateForForm,
    selectedTimeForForm, setSelectedTimeForForm,
    selectedDateForDetails, setSelectedDateForDetails,
    abonoReservationId, setAbonoReservationId,
    selectedBlockForEdit, setSelectedBlockForEdit,
    finalizeModal, setFinalizeModal,
    deleteBlockModal, setDeleteBlockModal,
    deleteTimeBlocksModal, setDeleteTimeBlocksModal,
    deleteReservaModal, setDeleteReservaModal, handleDeleteReserva,
    notification, setNotification,
    showNotification,
    canManage, isClient, user,
    handleCreate, handleUpdate, handleSaveBlock,
    handleConfirmDeleteBlock, handleConfirmDeleteTimeBlocks,
    handleSaveAbono, processFinalization,
    handleCancelReserva, handleTimeSlotBlock,
    handleViewReserva, // ✅
  } = useReservasManager();

  // ─── Calendar Logic ───────────────────────────────────────────────────────────
  const handleDateMouseDown = (dateStr: string) => {
    setIsDragging(true);
    setDragStart(dateStr);
    setDragEnd(dateStr);
    isLongPressAction.current = false;

    if (canManage) {
      longPressTimer.current = setTimeout(() => {
        isLongPressAction.current = true;
        setIsDragging(false);

        const existingFullBlock = blocks.find(b =>
          b.isActive && (b.type === 'FULL_DATE' || b.type === 'DATE_RANGE') &&
          dateStr >= b.startDate && dateStr <= b.endDate
        );
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
      setSelectedDateForForm(start);
      setIsCreateOpen(true);
    }

    setDragStart(null);
    setDragEnd(null);
  };

  const handleDateClick = (dateStr: string) => {
    const fullBlock = blocks.find(b =>
      b.isActive && (b.type === 'FULL_DATE' || b.type === 'DATE_RANGE') &&
      dateStr >= b.startDate && dateStr <= b.endDate
    );
    if (fullBlock && !canManage) {
      showNotification(`Fecha bloqueada: ${fullBlock.reason}.`, 'error');
      return;
    }
    setSelectedDateForDetails(dateStr);
    setIsDateDetailsOpen(true);
  };

  const daysInMonth     = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + offset);
      return d;
    });
  };

  const isDateSelected = (dateStr: string) => {
    if (!isDragging || !dragStart || !dragEnd) return false;
    let s = dragStart, e = dragEnd;
    if (s > e) [s, e] = [e, s];
    return dateStr >= s && dateStr <= e;
  };

  const filteredReservations = reservations.filter(r => {
    const matchesSearch =
      (r.clientName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.includes(searchTerm);
    if (isClient) return matchesSearch;
    const matchesStatus = ['PENDIENTE', 'CONFIRMADA', 'ANULADA'].includes(r.status);
    return matchesSearch && matchesStatus;
  });

  // ─── Render Calendar ──────────────────────────────────────────────────────────
  const renderCalendar = () => {
    const totalDays = daysInMonth(currentDate);
    const startDay  = firstDayOfMonth(currentDate);
    const days      = [];
    const today     = new Date();
    const todayStr  = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-slate-50/50 border border-slate-100" />);
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const isPast  = dateStr < todayStr;

      const dayEvents     = calendarReservations.filter(r => r.eventDate === dateStr && r.status !== 'ANULADA');
      const dayBlocks     = blocks.filter(b => b.startDate <= dateStr && b.endDate >= dateStr && b.isActive);
      const dayRehearsals = rehearsals.filter(r => r.date === dateStr && r.status === 'Programado');
      const dayQuotes     = quotations.filter(q => q.eventDate === dateStr && q.status === 'EN_ESPERA');

      const isFullDayBlock = dayBlocks.some(b => b.type === 'FULL_DATE' || b.type === 'DATE_RANGE');
      const isToday        = dateStr === todayStr;
      const isSelected     = isDateSelected(dateStr);

      const totalItems = dayEvents.length + dayRehearsals.length + dayQuotes.length;
      let dotColorClass = 'bg-emerald-400';
      if (totalItems >= 5)     dotColorClass = 'bg-red-600';
      else if (totalItems > 0) dotColorClass = 'bg-orange-400';

      days.push(
        <div
          key={day}
          onMouseDown={() => !isPast && handleDateMouseDown(dateStr)}
          onMouseEnter={() => !isPast && handleDateMouseEnter(dateStr)}
          onMouseUp={() => !isPast && handleDateMouseUp()}
          style={{
            ...(isFullDayBlock ? { backgroundImage: 'repeating-linear-gradient(45deg,#fef2f2 0,#fef2f2 10px,#fee2e2 10px,#fee2e2 20px)' } : {}),
            ...(isSelected ? { backgroundColor: canManage ? 'rgba(239,68,68,.1)' : 'rgba(16,185,129,.1)', borderColor: canManage ? '#fca5a5' : '#6ee7b7' } : {}),
            ...(isPast ? { backgroundColor: '#f8fafc', opacity: 0.6, cursor: 'not-allowed' } : {}),
          }}
          className={`h-32 border border-slate-100 p-2 transition-all relative group overflow-hidden select-none
            ${isToday ? 'bg-blue-50/30 ring-1 ring-blue-200' : 'bg-white'}
            ${!isFullDayBlock && !isSelected && !isPast ? 'hover:bg-slate-50 hover:shadow-md cursor-pointer' : ''}
          `}
        >
          <div className="flex justify-between items-start mb-1 pointer-events-none relative z-10">
            <div className="flex items-center gap-1">
              <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full
                ${isToday ? 'bg-primary-600 text-white' : ''}
                ${isFullDayBlock ? 'bg-red-100 text-red-600' : 'text-slate-700'}
                ${isPast ? 'text-slate-400' : ''}
              `}>{day}</span>
              {!isFullDayBlock && !isPast && <div className={`w-2 h-2 rounded-full ${dotColorClass}`} />}
              {isFullDayBlock && <Lock size={11} className="text-red-400" />}
            </div>
            {totalItems > 0 && <span className="text-[9px] font-bold text-slate-400">{totalItems}</span>}
          </div>

          <div className="space-y-0.5 overflow-y-auto max-h-[72px] custom-scrollbar relative z-10 pointer-events-none">
            {dayBlocks.filter(b => b.type === 'TIME_RANGE').map(b => (
              <div key={b.id} className="text-[9px] border border-red-200 bg-red-50 text-red-700 px-1 py-0.5 rounded font-bold flex items-center gap-1">
                <ShieldAlert size={9} />
                <span className="truncate">{b.startTime} Bloqueo</span>
              </div>
            ))}
            {dayQuotes.map(quote => (
              <div key={quote.id} className="text-[9px] border border-amber-200 bg-amber-50 text-amber-700 px-1 py-0.5 rounded font-medium truncate flex items-center gap-1">
                <FileText size={9} />
                <span className="font-bold">{quote.startTime}</span> Cotización
              </div>
            ))}
            {dayRehearsals.map(reh => (
              <div key={reh.id} className={`text-[9px] border px-1 py-0.5 rounded font-bold truncate flex items-center gap-1 ${
                !isClient ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-100 text-slate-400'
              }`}>
                {isClient ? <Lock size={9} /> : null}
                <span className="font-bold">{reh.time}</span> {isClient ? 'Reservado' : 'Ensayo'}
              </div>
            ))}
            {dayEvents.map(ev => {
              const isMyEvent = !isClient || user?.email === ev.clientEmail || user?.id === ev.clientId;
              const statusStyle = ev.status === 'CONFIRMADA'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                : 'bg-amber-50 border-amber-100 text-amber-700';
              return (
                <div key={ev.id} className={`text-[9px] border px-1 py-0.5 rounded font-medium truncate ${
                  isMyEvent ? statusStyle : 'bg-slate-50 border-slate-100 text-slate-400'
                }`}>
                  <span className="font-bold">{ev.eventTime}</span> {isMyEvent ? ev.eventType : 'Reservado'}
                </div>
              );
            })}
          </div>

          {isFullDayBlock && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
              <ShieldAlert size={56} className="text-red-900" />
            </div>
          )}
          {!isDragging && !isFullDayBlock && !isPast && (
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <button
                onClick={(e) => { e.stopPropagation(); handleDateClick(dateStr); }}
                className="p-1 bg-white border border-slate-200 rounded text-slate-400 hover:text-primary-600 hover:border-primary-200 shadow-sm"
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
    <div
      className="space-y-6 animate-fade-in-up pb-10"
      onMouseUp={() => { if (isDragging || longPressTimer.current) handleDateMouseUp(); }}
    >
      {/* Toast */}
      {notification && createPortal(
        <div className="fixed top-6 right-6 z-[200] animate-fade-in-up">
          <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md min-w-[320px] ${
            notification.type === 'success' ? 'bg-white/95 border-emerald-100' : 'bg-white/95 border-red-100'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
            }`}>
              {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            </div>
            <div className="flex-1">
              <h4 className={`font-bold text-sm ${notification.type === 'success' ? 'text-emerald-950' : 'text-red-950'}`}>
                {notification.type === 'success' ? 'Notificación' : 'Alerta'}
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
          <h1 className="text-3xl font-serif font-bold text-[#1e293b] tracking-wide uppercase">Gestión de Reservas</h1>
          <p className="text-slate-500 mt-2 text-sm">Control de agenda, fechas y disponibilidad de eventos.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button onClick={() => setView('list')}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${view === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            <List size={16} /> Lista
          </button>
          <button onClick={() => setView('calendar')}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${view === 'calendar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            <CalendarIcon size={16} /> Calendario
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        {view === 'list' ? (
          <div className="flex flex-col h-full">
            <div className="p-8 pb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Buscar por cliente, evento o ID..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-full py-3 pl-11 pr-6 text-slate-600 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all placeholder:text-slate-400 text-sm" />
              </div>
            </div>
            <ReservasTable
              reservations={filteredReservations}
              loading={loading}
              userRole={user?.role}
              onView={(res) => handleViewReserva(res)} // ✅
              onEdit={(res) => { setEditingReserva(res); setIsEditOpen(true); }}
              onAddPayment={(id) => { setAbonoReservationId(id); setIsAbonoModalOpen(true); }}
              onFinalize={(id) => setFinalizeModal({ isOpen: true, id })}
              onCancel={(id) => handleCancelReserva(id)}
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
                {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
                  <div key={d} className="text-xs font-bold text-slate-400 uppercase tracking-widest">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      <ReservaCreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSave={handleCreate} selectedDate={selectedDateForForm} selectedTime={selectedTimeForForm} />
      <ReservaEditModal   isOpen={isEditOpen}   onClose={() => setIsEditOpen(false)}   onSave={handleUpdate} reservation={editingReserva} />
      <ReservaDetailModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} reservation={selectedReserva} onFinalize={processFinalization} />
      <AbonoCreateModal   isOpen={isAbonoModalOpen} onClose={() => setIsAbonoModalOpen(false)} onSave={handleSaveAbono} initialReservationId={abonoReservationId} />

      <DateDetailsModal
        isOpen={isDateDetailsOpen}
        onClose={() => setIsDateDetailsOpen(false)}
        date={selectedDateForDetails}
        reservations={calendarReservations.filter(r => r.eventDate === selectedDateForDetails && r.status !== 'ANULADA')}
        blocks={blocks.filter(b => b.startDate <= (selectedDateForDetails||'') && b.endDate >= (selectedDateForDetails||'') && b.isActive)}
        rehearsals={rehearsals.filter(r => r.date === selectedDateForDetails && r.status === 'Programado')}
        quotations={quotations.filter(q => q.eventDate === selectedDateForDetails && q.status === 'EN_ESPERA')}
        onViewReservation={(res) => { setIsDateDetailsOpen(false); handleViewReserva(res); }} // ✅
        onCreateNew={(time) => { setIsDateDetailsOpen(false); setSelectedDateForForm(selectedDateForDetails); setSelectedTimeForForm(time||null); setIsCreateOpen(true); }}
        onBlockTime={handleTimeSlotBlock}
        onDeleteBlock={(id) => setDeleteBlockModal({ isOpen: true, blockId: id })}
      />

      {canManage && (
        <BlockFormModal isOpen={isBlockModalOpen} onClose={() => setIsBlockModalOpen(false)} onSave={handleSaveBlock} initialData={selectedBlockForEdit} />
      )}

      <ConfirmationModal isOpen={finalizeModal.isOpen} onClose={() => setFinalizeModal({ ...finalizeModal, isOpen: false })} onConfirm={processFinalization} title="¿Finalizar Evento?" message="Marcará la reserva como completada." confirmText="Sí, Finalizar" />
      <ConfirmationModal isOpen={deleteBlockModal.isOpen} onClose={() => setDeleteBlockModal({ ...deleteBlockModal, isOpen: false })} onConfirm={handleConfirmDeleteBlock} title="¿Eliminar Bloqueo?" message="Liberará la fecha en el calendario." />
      <ConfirmationModal isOpen={deleteTimeBlocksModal.isOpen} onClose={() => setDeleteTimeBlocksModal({ ...deleteTimeBlocksModal, isOpen: false })} onConfirm={handleConfirmDeleteTimeBlocks} title="¿Liberar Horarios?" message="Se eliminarán todos los bloqueos de horas en este día." confirmText="Liberar Todo" />
      <ConfirmationModal
        isOpen={deleteReservaModal.isOpen}
        onClose={() => setDeleteReservaModal({ ...deleteReservaModal, isOpen: false })}
        onConfirm={handleDeleteReserva}
        title="¿Eliminar Reserva?"
        message="Estás a punto de eliminar esta reserva permanentemente. Esta acción no se puede deshacer y se perderá el historial asociado."
        confirmText="Sí, eliminar"
      />
    </div>
  );
};