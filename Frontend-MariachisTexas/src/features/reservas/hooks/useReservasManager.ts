import { useState, useEffect, useRef } from 'react';
import { Reservation, UserRole, CalendarBlock, Rehearsal, Quotation } from '@/types';
import { useAuth } from '@/shared/contexts/AuthContext';
import { reservaService } from '../services/reservaService';
import { blockService } from '../../bloqueos/services/blockService';
import { rehearsalService } from '../../ensayos/services/rehearsalService';
import { cotizacionService } from '../../cotizaciones/services/cotizacionService';
import { abonoService } from '../../abonos/services/abonoService';

export const useReservasManager = () => {
  const { user } = useAuth();

  const canManage = user?.role === UserRole.ADMIN || user?.role === UserRole.EMPLEADO;
  const isClient  = user?.role === UserRole.CLIENTE;

  const [view, setView] = useState<'list' | 'calendar'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [reservations,         setReservations]         = useState<Reservation[]>([]);
  const [calendarReservations, setCalendarReservations] = useState<Reservation[]>([]);
  const [blocks,      setBlocks]      = useState<CalendarBlock[]>([]);
  const [rehearsals,  setRehearsals]  = useState<Rehearsal[]>([]);
  const [quotations,  setQuotations]  = useState<Quotation[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [searchTerm,  setSearchTerm]  = useState('');

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart,  setDragStart]  = useState<string | null>(null);
  const [dragEnd,    setDragEnd]    = useState<string | null>(null);

  const longPressTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressAction = useRef(false);

  const [isCreateOpen,      setIsCreateOpen]      = useState(false);
  const [isEditOpen,        setIsEditOpen]        = useState(false);
  const [isDetailOpen,      setIsDetailOpen]      = useState(false);
  const [isAbonoModalOpen,  setIsAbonoModalOpen]  = useState(false);
  const [isDateDetailsOpen, setIsDateDetailsOpen] = useState(false);
  const [isBlockModalOpen,  setIsBlockModalOpen]  = useState(false);

  const [editingReserva,         setEditingReserva]         = useState<Reservation | null>(null);
  const [selectedReserva,        setSelectedReserva]        = useState<Reservation | null>(null);
  const [selectedDateForForm,    setSelectedDateForForm]    = useState<string | null>(null);
  const [selectedTimeForForm,    setSelectedTimeForForm]    = useState<string | null>(null);
  const [selectedDateForDetails, setSelectedDateForDetails] = useState<string | null>(null);
  const [abonoReservationId,     setAbonoReservationId]     = useState<string | undefined>(undefined);
  const [selectedBlockForEdit,   setSelectedBlockForEdit]   = useState<CalendarBlock | null>(null);

  const [finalizeModal,         setFinalizeModal]         = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [deleteBlockModal,      setDeleteBlockModal]      = useState<{ isOpen: boolean; blockId: string | null }>({ isOpen: false, blockId: null });
  const [deleteTimeBlocksModal, setDeleteTimeBlocksModal] = useState<{ isOpen: boolean; date: string | null }>({ isOpen: false, date: null });
  const [deleteReservaModal,    setDeleteReservaModal]    = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' });

  // ── Modal de anulación (reemplaza window.confirm) ──────────────────────────
  const [anularModal, setAnularModal] = useState<{ isOpen: boolean; reservation: Reservation | null }>({
    isOpen: false, reservation: null,
  });

  // ── Modal de toggle ensayo (reemplaza window.confirm) ──────────────────────
  const [toggleEnsayoModal, setToggleEnsayoModal] = useState<{ isOpen: boolean; rehearsal: Rehearsal | null }>({
    isOpen: false, rehearsal: null,
  });

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success', duration = 4000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  };

  // ─── FETCH ─────────────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const blocksData = await blockService.getBlocks();
      setBlocks(blocksData);

      if (!isClient) {
        const [resData, rehData, quoteData] = await Promise.all([
          reservaService.getReservations(),
          rehearsalService.getRehearsals(),
          cotizacionService.getQuotations()
        ]);
        setReservations(resData);
        setCalendarReservations(resData);
        setRehearsals(rehData);
        setQuotations(quoteData);
      } else {
        const [misReservas, todasReservas, ensayosDisp, cotDisp] = await Promise.all([
          reservaService.getReservations(),
          reservaService.getReservationsForCalendar(),
          rehearsalService.getRehearsalsPublic(),
          cotizacionService.getDisponibilidad(),
        ]);

        setReservations(misReservas);
        setCalendarReservations(todasReservas);

        setRehearsals(
          (ensayosDisp as any[]).map((e, i) => ({
            id:            `pub-ens-${i}`,
            title:         '',
            location:      '',
            address:       '',
            date:          e.fecha ?? e.date ?? '',
            time:          e.hora  ?? e.time  ?? '',
            notes:         '',
            repertoireIds: [],
            status:        'Programado' as const,
            createdAt:     '',
            updatedAt:     '',
          }))
        );

        setQuotations(
          cotDisp.map((c, i) => ({
            id:              `pub-cot-${i}`,
            clientId:        '',
            clientName:      '',
            clientEmail:     '',
            eventDate:       c.date,
            startTime:       c.startTime,
            endTime:         c.endTime,
            status:          'EN_ESPERA' as const,
            eventType:       '',
            clientPhone:     '',
            secondaryPhone:  '',
            homenajeado:     '',
            location:        '',
            notes:           '',
            totalAmount:     0,
            selectedServices: [],
            repertoireIds:   [],
            createdAt:       '',
            updatedAt:       '',
          }))
        );
      }
    } catch (error: any) {
      console.error(error);
      showNotification('Error cargando datos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleViewReserva = async (res: Reservation) => {
    if (isClient) {
      const full = reservations.find(r => r.id === res.id);
      if (!full) { showNotification('No tienes permiso para ver esta reserva.', 'error'); return; }
      setSelectedReserva(full);
      setIsDetailOpen(true);
      return;
    }
    const full = reservations.find(r => r.id === res.id);
    if (full) { setSelectedReserva(full); setIsDetailOpen(true); return; }
    try {
      const fetched = await reservaService.getReservationById(res.id);
      setSelectedReserva(fetched);
      setIsDetailOpen(true);
    } catch {
      showNotification('No se pudo cargar el detalle de la reserva.', 'error');
    }
  };

  const handleCreate = async (data: any) => {
    try {
      const newRes = await reservaService.createReservation(data);
      setReservations(prev => [newRes, ...prev]);
      setCalendarReservations(prev => [newRes, ...prev]);
      showNotification('Reserva creada. Comuníquese para el pago del anticipo.', 'success', 5000);
      setIsCreateOpen(false);
    } catch (error: any) {
      // Relanzar el error para que ReservaCreateModal lo maneje
      throw error;
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingReserva) return;
    try {
      const updated = await reservaService.updateReservation(editingReserva.id, data);
      setReservations(prev => prev.map(r => r.id === updated.id ? updated : r));
      setCalendarReservations(prev => prev.map(r => r.id === updated.id ? updated : r));
      if (selectedReserva?.id === updated.id) setSelectedReserva(updated);
      showNotification('Reserva actualizada.');
      setIsEditOpen(false);
    } catch (error: any) {
      // Relanzar el error para que ReservaEditModal lo maneje
      throw error;
    }
  };

  const handleDeleteReserva = async () => {
    if (!deleteReservaModal.id) return;
    try {
      await reservaService.deleteReservation(deleteReservaModal.id);
      setReservations(prev => prev.filter(r => r.id !== deleteReservaModal.id));
      setCalendarReservations(prev => prev.filter(r => r.id !== deleteReservaModal.id));
      showNotification('Reserva eliminada correctamente.');
    } catch (error: any) {
      showNotification(error?.response?.data?.message || 'Error al eliminar.', 'error');
    } finally {
      setDeleteReservaModal({ isOpen: false, id: '' });
    }
  };

  const handleSaveBlock = async (data: any) => {
    try {
      const newBlock = await blockService.createBlock(data);
      setBlocks(prev => [...prev, newBlock]);
      showNotification('Fecha bloqueada correctamente.');
      setIsBlockModalOpen(false);
    } catch (error: any) {
      showNotification(error?.response?.data?.message || 'Error al guardar bloqueo.', 'error');
    }
  };

  const handleConfirmDeleteBlock = async () => {
    if (!deleteBlockModal.blockId) return;
    try {
      await blockService.deleteBlock(deleteBlockModal.blockId);
      setBlocks(prev => prev.filter(b => b.id !== deleteBlockModal.blockId));
      showNotification('Bloqueo eliminado correctamente.');
    } catch (error) {
      showNotification('Error al eliminar bloqueo.', 'error');
    } finally {
      setDeleteBlockModal({ isOpen: false, blockId: null });
    }
  };

  const handleConfirmDeleteTimeBlocks = async () => {
    if (!deleteTimeBlocksModal.date) return;
    try {
      const blocksToDelete = blocks.filter(b =>
        b.isActive && b.type === 'TIME_RANGE' && b.startDate === deleteTimeBlocksModal.date
      );
      await Promise.all(blocksToDelete.map(b => blockService.deleteBlock(b.id)));
      setBlocks(prev => prev.filter(b => !blocksToDelete.map(x => x.id).includes(b.id)));
      showNotification('Se han liberado las horas bloqueadas de este día.');
    } catch (error) {
      showNotification('Error al eliminar bloqueos de hora.', 'error');
    } finally {
      setDeleteTimeBlocksModal({ isOpen: false, date: null });
    }
  };

  // Abre el AnularReservaModal — sin window.confirm
  const handleCancelReserva = (id: string) => {
    const reservation = reservations.find(r => r.id === id) ?? null;
    setAnularModal({ isOpen: true, reservation });
  };

  // Ejecuta la anulación real una vez el modal confirma (recibe motivo)
  const processCancel = async (id: string, motivo: string) => {
    try {
      const updated = await reservaService.cancelReservation(id, motivo || 'Cancelación manual por usuario');
      setReservations(prev => prev.map(r => r.id === updated.id ? updated : r));
      setCalendarReservations(prev => prev.map(r => r.id === updated.id ? updated : r));
      if (selectedReserva?.id === id) setSelectedReserva(updated);
      showNotification('Reserva anulada.');
    } catch (error: any) {
      showNotification(error?.response?.data?.message || 'Error al anular.', 'error');
    }
  };

  // Abre el modal de toggle ensayo — sin window.confirm
  const handleToggleStatus = (rehearsal: Rehearsal) => {
    const isCompleted = rehearsal.status === 'Completado';
    // Si ya está completado, revertir directamente (no necesita confirmación)
    if (isCompleted) {
      processToggleStatus(rehearsal);
      return;
    }
    // Si va a completarse, pedir confirmación via modal
    setToggleEnsayoModal({ isOpen: true, rehearsal });
  };

  // Ejecuta el toggle real una vez confirmado
  const processToggleStatus = async (rehearsal: Rehearsal) => {
    try {
      const updated = await rehearsalService.toggleStatus(rehearsal.id);
      setRehearsals(prev => prev.map(r => r.id === updated.id ? updated : r));
      showNotification(
        updated.status === 'Completado'
          ? `Ensayo "${updated.title}" marcado como Listo.`
          : `Ensayo "${updated.title}" marcado como Pendiente.`
      );
    } catch (err: any) {
      showNotification(err?.response?.data?.message || 'Error al cambiar el estado del ensayo.', 'error');
    }
  };

  const handleSaveAbono = async (data: any) => {
    try {
      await abonoService.createAbono(data);
      await fetchData();
      showNotification('Abono registrado y saldo actualizado.');
      setIsAbonoModalOpen(false);
    } catch (error: any) {
      showNotification(error?.response?.data?.message || 'Error al registrar el abono.', 'error');
    }
  };

  const processFinalization = async () => {
    if (!finalizeModal.id) return;
    try {
      const updated = await reservaService.finalizeReservation(finalizeModal.id);
      setReservations(prev => prev.map(r => r.id === updated.id ? updated : r));
      setCalendarReservations(prev => prev.map(r => r.id === updated.id ? updated : r));
      if (selectedReserva?.id === updated.id) setSelectedReserva(updated);
      showNotification('Evento finalizado exitosamente.');
    } catch (error) {
      showNotification('Error al finalizar el evento.', 'error');
    } finally {
      setFinalizeModal({ isOpen: false, id: null });
    }
  };

  const handleTimeSlotBlock = (date: string, time: string) => {
    if (!canManage) return;
    const [h, m] = time.split(':').map(Number);
    const nextH  = (h + 1) % 24;
    setSelectedBlockForEdit({
      id: '', type: 'TIME_RANGE', reason: '', description: '',
      startDate: date, endDate: date,
      startTime: time,
      endTime: `${nextH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
      isActive: true
    });
    setIsBlockModalOpen(true);
  };

  return {
    view, setView, currentDate, setCurrentDate,
    reservations, setReservations, calendarReservations, blocks, setBlocks,
    rehearsals, setRehearsals, quotations, setQuotations,
    loading, setLoading, searchTerm, setSearchTerm,
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
    // Anular reserva
    anularModal, setAnularModal, handleCancelReserva, processCancel,
    // Toggle ensayo
    toggleEnsayoModal, setToggleEnsayoModal, handleToggleStatus, processToggleStatus,
    notification, setNotification, showNotification,
    canManage, isClient, user,
    fetchData, handleCreate, handleUpdate, handleSaveBlock,
    handleConfirmDeleteBlock, handleConfirmDeleteTimeBlocks,
    handleSaveAbono, processFinalization, handleTimeSlotBlock,
    handleViewReserva,
  };
};