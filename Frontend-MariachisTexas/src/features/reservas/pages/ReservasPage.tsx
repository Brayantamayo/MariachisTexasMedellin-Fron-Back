import React from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, List, Plus, Search, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, X, Lock, ShieldAlert, FileText } from 'lucide-react';
import { UserRole } from '@/types';
import { useReservasManager } from '../hooks/useReservasManager';

// Nuevos Componentes Modulares
import { ReservasTable } from '../components/ReservasTable';
import { ReservaCreateModal } from '../components/ReservaCreateModal';
import { ReservaEditModal } from '../components/ReservaEditModal';
import { ReservaDetailModal } from '../components/ReservaDetailModal';
import { DateDetailsModal } from '../components/DateDetailsModal';
import { AbonoCreateModal } from '../../abonos/components/AbonoCreateModal';
import { BlockFormModal } from '../../bloqueos/components/BlockFormModal';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal';

export const ReservasPage: React.FC = () => {
  const {
    // State
    view, setView,
    currentDate, setCurrentDate,
    reservations, setReservations,
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
    
    // Modals State
    isCreateOpen, setIsCreateOpen,
    isEditOpen, setIsEditOpen,
    isDetailOpen, setIsDetailOpen,
    isAbonoModalOpen, setIsAbonoModalOpen,
    isDateDetailsOpen, setIsDateDetailsOpen,
    isBlockModalOpen, setIsBlockModalOpen,
    
    // Selected Items
    editingReserva, setEditingReserva,
    selectedReserva, setSelectedReserva,
    selectedDateForForm, setSelectedDateForForm,
    selectedTimeForForm, setSelectedTimeForForm,
    selectedDateForDetails, setSelectedDateForDetails,
    abonoReservationId, setAbonoReservationId,
    selectedBlockForEdit, setSelectedBlockForEdit,
    
    // Confirmation Modals
    finalizeModal, setFinalizeModal,
    deleteBlockModal, setDeleteBlockModal,
    deleteTimeBlocksModal, setDeleteTimeBlocksModal,
    
    // Notification
    notification, setNotification,
    showNotification,
    
    // Permissions
    canManage,
    isClient,
    user,
    
    // Handlers
    handleCreate,
    handleUpdate,
    handleSaveBlock,
    handleConfirmDeleteBlock,
    handleConfirmDeleteTimeBlocks,
    handleSaveAbono,
    processFinalization,
    handleCancelReserva,
    handleTimeSlotBlock
  } = useReservasManager();

  // --- Calendar Logic ---

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
                  b.isActive && 
                  (b.type === 'FULL_DATE' || b.type === 'DATE_RANGE') &&
                  dateStr >= b.startDate && dateStr <= b.endDate
              );

              if (existingFullBlock) {
                  setDeleteBlockModal({ isOpen: true, blockId: existingFullBlock.id });
                  return;
              }

              const hasTimeBlocks = blocks.some(b => 
                  b.isActive && 
                  b.type === 'TIME_RANGE' && 
                  b.startDate === dateStr
              );

              if (hasTimeBlocks) {
                  setDeleteTimeBlocksModal({ isOpen: true, date: dateStr });
                  return;
              }

              setSelectedBlockForEdit({
                  id: '',
                  type: 'FULL_DATE',
                  reason: '',
                  description: '',
                  startDate: dateStr,
                  endDate: dateStr,
                  isActive: true
              });
              setIsBlockModalOpen(true);
              
          }, 700); 
      }
  };

  const handleDateMouseEnter = (dateStr: string) => {
      if (isDragging) {
          if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
          }
          setDragEnd(dateStr);
      }
  };

  const handleDateMouseUp = () => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }

      setIsDragging(false);

      if (isLongPressAction.current) return;
      if (!dragStart || !dragEnd) return;

      let start = dragStart;
      let end = dragEnd;
      if (start > end) {
          [start, end] = [end, start];
      }

      if (start === end) {
          handleDateClick(start);
          setDragStart(null);
          setDragEnd(null);
          return;
      }

      if (canManage) {
          setSelectedBlockForEdit({
              id: '',
              type: 'DATE_RANGE',
              reason: '',
              description: '',
              startDate: start,
              endDate: end,
              isActive: true
          });
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
          b.isActive && 
          (b.type === 'FULL_DATE' || b.type === 'DATE_RANGE') &&
          dateStr >= b.startDate && dateStr <= b.endDate
      );

      if (fullBlock && !canManage) {
          showNotification(`Fecha bloqueada: ${fullBlock.reason}. Acceso restringido.`, 'error');
          return;
      }

      setSelectedDateForDetails(dateStr);
      setIsDateDetailsOpen(true);
  };

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  
  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
    setCurrentDate(new Date(newDate));
  };

  const isDateSelected = (dateStr: string) => {
      if (!isDragging || !dragStart || !dragEnd) return false;
      let start = dragStart;
      let end = dragEnd;
      if (start > end) [start, end] = [end, start];
      return dateStr >= start && dateStr <= end;
  };

  const filteredReservations = reservations.filter(r => {
      const matchesSearch = r.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            r.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.id.includes(searchTerm);
      
      if (user?.role === UserRole.CLIENTE) {
          return matchesSearch && (r.clientId === user.id || r.clientEmail === user.email);
      }
      
      const matchesStatus = r.status === 'Pendiente' || r.status === 'Anulado';
      return matchesSearch && matchesStatus;
  });

  const renderCalendar = () => {
    const totalDays = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate);
    const days = [];
    const DAILY_CAPACITY_LIMIT = 5; 
    
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    for (let i = 0; i < startDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-32 bg-slate-50/50 border border-slate-100"></div>);
    }

    for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isPast = dateStr < todayStr;
        
        const dayEvents = reservations.filter(r => r.eventDate === dateStr && r.status !== 'Anulado');
        const dayBlocks = blocks.filter(b => b.startDate <= dateStr && b.endDate >= dateStr && b.isActive);
        const dayRehearsals = rehearsals.filter(r => r.date === dateStr && r.status === 'Programado');
        const dayQuotes = quotations.filter(q => q.eventDate === dateStr && q.status === 'En Espera');
        
        const isFullDayBlock = dayBlocks.some(b => b.type === 'FULL_DATE' || b.type === 'DATE_RANGE');
        const isToday = dateStr === todayStr;
        const isSelected = isDateSelected(dateStr);

        let dotColorClass = 'bg-emerald-400 shadow-emerald-200';
        let toolTipText = 'Disponible';

        const totalItems = dayEvents.length + dayRehearsals.length + dayQuotes.length;

        if (totalItems >= DAILY_CAPACITY_LIMIT) {
            dotColorClass = 'bg-red-600 shadow-red-300';
            toolTipText = 'Agenda Llena';
        } else if (totalItems > 0) {
            dotColorClass = 'bg-orange-400 shadow-orange-200';
            toolTipText = 'Reservas Parciales';
        }

        const blockedStyle = isFullDayBlock ? {
            backgroundImage: 'repeating-linear-gradient(45deg, #fef2f2 0, #fef2f2 10px, #fee2e2 10px, #fee2e2 20px)',
            color: '#b91c1c'
        } : {};

        const selectionStyle = isSelected ? {
            backgroundColor: canManage ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            borderColor: canManage ? '#fca5a5' : '#6ee7b7'
        } : {};

        // Disabled style for past dates
        const disabledStyle = isPast ? {
            backgroundColor: '#f8fafc', // slate-50
            opacity: 0.6,
            cursor: 'not-allowed'
        } : {};

        days.push(
            <div 
                key={day}
                onMouseDown={() => !isPast && handleDateMouseDown(dateStr)}
                onMouseEnter={() => !isPast && handleDateMouseEnter(dateStr)}
                onMouseUp={() => !isPast && handleDateMouseUp()}
                style={{ ...blockedStyle, ...selectionStyle, ...disabledStyle }}
                className={`h-32 border border-slate-100 p-2 transition-all relative group day-container overflow-hidden select-none
                    ${isToday ? 'bg-blue-50/30 ring-1 ring-blue-200' : 'bg-white'} 
                    ${!isFullDayBlock && !isSelected && !isPast && 'hover:bg-slate-50 hover:shadow-md cursor-pointer'}
                `}
            >
                <div className="flex justify-between items-start mb-2 pointer-events-none relative z-10">
                    <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors ${isToday ? 'bg-primary-600 text-white' : 'text-slate-700'} ${isFullDayBlock ? 'bg-red-100 text-red-600' : ''} ${isPast ? 'text-slate-400' : ''}`}>
                            {day}
                        </span>
                        {!isFullDayBlock && !isPast && <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${dotColorClass}`} title={toolTipText}></div>}
                        {isFullDayBlock && <Lock size={12} className="text-red-400" />}
                    </div>
                    {totalItems > 0 && (
                        <span className="text-[10px] font-bold text-slate-400">{totalItems} Eventos</span>
                    )}
                </div>

                <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar relative z-10 pointer-events-none">
                    
                    {dayBlocks.filter(b => b.type === 'TIME_RANGE').map(block => (
                        <div key={block.id} className="text-[10px] border border-red-200 bg-red-50 text-red-700 p-1 rounded-md font-bold flex items-center gap-1">
                            <ShieldAlert size={10} />
                            <span className="truncate">{block.startTime ? `${block.startTime} - ` : ''} Bloqueo</span>
                        </div>
                    ))}

                    {/* COTIZACIONES EN ESPERA - ANONYMIZED FOR CLIENTS */}
                    {dayQuotes.map(quote => {
                        const isMyQuote = user?.id === quote.clientId || user?.email === quote.clientEmail || !isClient;
                        
                        if (isMyQuote) {
                            return (
                                <div key={quote.id} className="text-[10px] border border-amber-200 bg-amber-50 text-amber-700 p-1 rounded-md font-medium truncate flex items-center gap-1 shadow-sm">
                                    <FileText size={10} />
                                    <span className="font-bold mr-1">{quote.startTime}</span>
                                    Cotización
                                </div>
                            );
                        } else {
                            return (
                                <div key={quote.id} className="text-[10px] border border-slate-100 bg-slate-100 text-slate-400 p-1 rounded-md font-medium truncate flex items-center gap-1 shadow-sm opacity-80">
                                    <Lock size={10} />
                                    <span className="font-bold mr-1">{quote.startTime}</span>
                                    Reservado
                                </div>
                            );
                        }
                    })}

                    {/* REHEARSALS - ANONYMIZED FOR CLIENTS */}
                    {dayRehearsals.map(reh => {
                        if (!isClient) {
                            return (
                                <div key={reh.id} className="text-[10px] border border-blue-200 bg-blue-50 text-blue-700 p-1 rounded-md font-bold truncate flex items-center gap-1">
                                    <span className="font-bold mr-1">{reh.time}</span> Ensayo
                                </div>
                            );
                        } else {
                            return (
                                <div key={reh.id} className="text-[10px] border border-slate-100 bg-slate-100 text-slate-400 p-1 rounded-md font-medium truncate flex items-center gap-1 shadow-sm opacity-80">
                                    <Lock size={10} />
                                    <span className="font-bold mr-1">{reh.time}</span>
                                    Reservado
                                </div>
                            );
                        }
                    })}

                    {dayEvents.map(ev => {
                        const isMyEvent = user?.id === ev.clientId || user?.email === ev.clientEmail || user?.role !== UserRole.CLIENTE;
                        const eventLabel = isMyEvent ? ev.eventType : 'Reservado';
                        const eventStyle = isMyEvent 
                            ? (ev.status === 'Confirmado' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700')
                            : 'bg-slate-50 border-slate-100 text-slate-400 opacity-80';

                        return (
                            <div key={ev.id} className={`text-[10px] border p-1.5 rounded-md font-medium truncate shadow-sm ${eventStyle}`}>
                                <span className="font-bold mr-1">{ev.eventTime}</span>
                                {eventLabel}
                            </div>
                        );
                    })}
                </div>

                {isFullDayBlock && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-10">
                        <ShieldAlert size={64} className="text-red-900" />
                    </div>
                )}

                {!isDragging && !isFullDayBlock && !isPast && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDateClick(dateStr); }}
                            className="p-1.5 bg-white border border-slate-200 rounded-md text-slate-400 hover:text-primary-600 hover:border-primary-200 shadow-sm transition-colors"
                            title="Agregar / Ver"
                        >
                            <Plus size={12} />
                        </button>
                    </div>
                )}
            </div>
        );
    }
    return days;
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-10" onMouseUp={() => { if(isDragging || longPressTimer.current) handleDateMouseUp(); }}>
      
       {notification && createPortal(
            <div className="fixed top-6 right-6 z-[200] animate-fade-in-up">
                <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md min-w-[320px] ${
                    notification.type === 'success' ? 'bg-white/95 border-emerald-100' : 'bg-white/95 border-red-100'
                }`}>
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                    }`}>
                        {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} /> }
                    </div>
                    <div className="flex-1">
                        <h4 className={`font-bold text-sm ${notification.type === 'success' ? 'text-emerald-950' : 'text-red-950'}`}>
                            {notification.type === 'success' ? 'Notificación' : 'Alerta'}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">{notification.message}</p>
                    </div>
                    <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>
            </div>,
            document.body
        )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1e293b] tracking-wide uppercase">Gestión de Reservas</h1>
          <p className="text-slate-500 mt-2 text-sm">Control de agenda, fechas y disponibilidad de eventos.</p>
        </div>
        
        <div className="flex gap-2">
            <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                    onClick={() => setView('list')}
                    className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <List size={16} /> Lista
                </button>
                <button 
                    onClick={() => setView('calendar')}
                    className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'calendar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <CalendarIcon size={16} /> Calendario
                </button>
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden min-h-[600px] flex flex-col">
         
         {view === 'list' ? (
             <div className="flex flex-col h-full">
                 <div className="p-8 pb-4">
                     <div className="relative max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por cliente, evento o ID..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-full py-3 pl-11 pr-6 text-slate-600 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all placeholder:text-slate-400 text-sm"
                        />
                    </div>
                 </div>
                 <ReservasTable 
                    reservations={filteredReservations}
                    loading={loading}
                    userRole={user?.role}
                    onView={(res) => { setSelectedReserva(res); setIsDetailOpen(true); }}
                    onEdit={(res) => { setEditingReserva(res); setIsEditOpen(true); }}
                    onAddPayment={(id) => { setAbonoReservationId(id); setIsAbonoModalOpen(true); }}
                    onFinalize={(id) => setFinalizeModal({ isOpen: true, id })}
                    onCancel={(id) => handleCancelReserva(id)}
                 />
             </div>
         ) : (
             <div className="flex flex-col h-full">
                 {/* Calendar Header Control */}
                 <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                     <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><ChevronLeft className="text-slate-600" /></button>
                     <h2 className="text-xl font-serif font-bold text-slate-800 uppercase tracking-widest">
                         {monthNames[currentDate.getMonth()]} <span className="text-primary-600">{currentDate.getFullYear()}</span>
                     </h2>
                     <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><ChevronRight className="text-slate-600" /></button>
                 </div>

                 {/* Calendar Grid */}
                 <div className="flex-1 p-6">
                     <div className="grid grid-cols-7 mb-4 text-center">
                         {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(day => (
                             <div key={day} className="text-xs font-bold text-slate-400 uppercase tracking-widest">{day}</div>
                         ))}
                     </div>
                     <div className="grid grid-cols-7 gap-2">
                         {renderCalendar()}
                     </div>
                 </div>
             </div>
         )}
      </div>

      {/* Modals */}
      <ReservaCreateModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleCreate}
        selectedDate={selectedDateForForm}
        selectedTime={selectedTimeForForm}
      />

      <ReservaEditModal 
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleUpdate}
        reservation={editingReserva}
      />

      <ReservaDetailModal 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        reservation={selectedReserva}
        onFinalize={processFinalization}
      />

      <AbonoCreateModal 
        isOpen={isAbonoModalOpen}
        onClose={() => setIsAbonoModalOpen(false)}
        onSave={handleSaveAbono}
        initialReservationId={abonoReservationId}
      />

      <DateDetailsModal 
        isOpen={isDateDetailsOpen}
        onClose={() => setIsDateDetailsOpen(false)}
        date={selectedDateForDetails}
        reservations={reservations.filter(r => r.eventDate === selectedDateForDetails && r.status !== 'Anulado')}
        blocks={blocks.filter(b => b.startDate <= (selectedDateForDetails || '') && b.endDate >= (selectedDateForDetails || '') && b.isActive)}
        rehearsals={rehearsals.filter(r => r.date === selectedDateForDetails && r.status === 'Programado')}
        quotations={quotations.filter(q => q.eventDate === selectedDateForDetails && q.status === 'En Espera')}
        onViewReservation={(res) => { setIsDateDetailsOpen(false); setSelectedReserva(res); setIsDetailOpen(true); }}
        onCreateNew={(time) => { 
            setIsDateDetailsOpen(false); 
            setSelectedDateForForm(selectedDateForDetails); 
            setSelectedTimeForForm(time || null);
            setIsCreateOpen(true); 
        }}
        onBlockTime={handleTimeSlotBlock}
        onDeleteBlock={(id) => setDeleteBlockModal({ isOpen: true, blockId: id })}
      />

      {canManage && (
          <BlockFormModal 
            isOpen={isBlockModalOpen}
            onClose={() => setIsBlockModalOpen(false)}
            onSave={handleSaveBlock}
            initialData={selectedBlockForEdit}
          />
      )}

      {/* Confirmations */}
      <ConfirmationModal 
        isOpen={finalizeModal.isOpen}
        onClose={() => setFinalizeModal({ ...finalizeModal, isOpen: false })}
        onConfirm={processFinalization}
        title="¿Finalizar Evento?"
        message="Esto marcará la reserva como completada y cerrará cualquier saldo pendiente automáticamente."
        confirmText="Sí, Finalizar"
      />

      <ConfirmationModal 
        isOpen={deleteBlockModal.isOpen}
        onClose={() => setDeleteBlockModal({ ...deleteBlockModal, isOpen: false })}
        onConfirm={handleConfirmDeleteBlock}
        title="¿Eliminar Bloqueo?"
        message="Esta acción liberará la fecha o rango seleccionado en el calendario."
      />

      <ConfirmationModal 
        isOpen={deleteTimeBlocksModal.isOpen}
        onClose={() => setDeleteTimeBlocksModal({ ...deleteTimeBlocksModal, isOpen: false })}
        onConfirm={handleConfirmDeleteTimeBlocks}
        title="¿Liberar Horarios?"
        message="Se eliminarán todos los bloqueos parciales de horas en este día."
        confirmText="Liberar Todo"
      />

    </div>
  );
};
