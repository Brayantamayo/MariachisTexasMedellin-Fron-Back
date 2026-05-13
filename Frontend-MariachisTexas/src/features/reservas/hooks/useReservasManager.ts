import { useState, useEffect, useRef } from 'react';
import { Reservation, UserRole, CalendarBlock, Rehearsal, Quotation } from '@/types';
import { useAuth } from '@/shared/contexts/AuthContext';
import { reservaService } from '../services/reservaService';
import { blockService } from '../../bloqueos/services/blockService';
import { rehearsalService } from '../../ensayos/services/rehearsalService';
import { cotizacionService } from '../../cotizaciones/services/cotizacionService';
import api from '@/shared/api/api';

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
  const hasCheckedAutoFinalize = useRef(false);

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

  const [anularModal, setAnularModal] = useState<{ isOpen: boolean; reservation: Reservation | null }>({
    isOpen: false, reservation: null,
  });

  const [toggleEnsayoModal, setToggleEnsayoModal] = useState<{ isOpen: boolean; rehearsal: Rehearsal | null }>({
    isOpen: false, rehearsal: null,
  });

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success', duration = 5000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  };

  // ─── FETCH ─────────────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const blocksData = await blockService.getBlocks();
      setBlocks(blocksData);

      const applyDynamicStatus = (data: any[]) => {
        const now = new Date();
        const nowTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const nowDateStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];

        return data.map(r => {
          if (!r.eventDate) return r;
          const eventDateStr = r.eventDate;
          const startTimeStr = r.startTime || r.eventTime || '00:00';
          const endTimeStr = r.endTime || '23:59';
          
          const isPastStart = eventDateStr < nowDateStr || (eventDateStr === nowDateStr && startTimeStr < nowTimeStr);
          const isPastEnd = eventDateStr < nowDateStr || (eventDateStr === nowDateStr && endTimeStr < nowTimeStr);
          
          let isExpired24h = false;
          if (r.createdAt) {
            const createdAtDate = new Date(r.createdAt);
            const limitDate = new Date(createdAtDate.getTime() + 24 * 60 * 60 * 1000);
            isExpired24h = now > limitDate;
          }

          if (r.status === 'PENDIENTE' && (isPastStart || isExpired24h)) {
            return { ...r, status: 'ANULADA' };
          }
          if (r.status === 'CONFIRMADA' && isPastEnd) {
            return { ...r, status: 'FINALIZADO' };
          }
          return r;
        });
      };

      if (!isClient) {
        const [resData, calendarData, rehData, quoteData] = await Promise.all([
          reservaService.getReservations(),
          reservaService.getReservationsForCalendar(),
          rehearsalService.getRehearsals(),
          cotizacionService.getQuotations()
        ]);
        const filteredCalendar = calendarData.filter((r: any) => {
          const isVentaDirectaSinReserva = r.id?.startsWith('VENTA-') && !r.cotizacionId;
          // Permitimos ventas directas si el usuario las quiere ver, pero por ahora seguimos el patrón de filtrar solo las que no tienen datos de evento
          return !isVentaDirectaSinReserva && r.eventType !== 'ENSAYO' && r.eventType !== 'COTIZACION';
        });
        setReservations(applyDynamicStatus(resData) as any);
        setCalendarReservations(applyDynamicStatus(filteredCalendar) as any);
        setRehearsals(rehData);
        setQuotations(quoteData);
      } else {
        const [misReservas, todasReservas, ensayosDisp, cotDisp] = await Promise.all([
          reservaService.getReservations(),
          reservaService.getReservationsForCalendar(),
          rehearsalService.getRehearsalsPublic(),
          cotizacionService.getDisponibilidad(),
        ]);

        setReservations(applyDynamicStatus(misReservas) as any);

        const filteredPublicCalendar = todasReservas.filter((r: any) => {
          const isVentaDirectaSinReserva = r.id?.startsWith('VENTA-') && !r.cotizacionId;
          return !isVentaDirectaSinReserva && r.eventType !== 'ENSAYO' && r.eventType !== 'COTIZACION';
        });
        setCalendarReservations(applyDynamicStatus(filteredPublicCalendar) as any);

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
            status:        'PENDIENTE' as const,
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
      hasCheckedAutoFinalize.current = false;
    }
  };

  const processFinalization = async (providedId?: string) => {
    const id = providedId || finalizeModal.id;
    if (!id) return;
    try {
      const res = reservations.find(r => r.id === id);
      
      // Si tiene saldo pendiente al finalizar, creamos una venta por el valor pagado hasta ahora? 
      // O por el total? El usuario dice "si debe se crearía con la finalización". 
      // Usualmente esto significa que el abono se convierte en venta finalizada.
      if (res && Number(res.paidAmount) > 0 && res.status !== 'FINALIZADO') {
        try {
          await api.post('/ventas', {
            reservaId: Number(res.id),
            clienteId: Number(res.clientId),
            tipo: 'RESERVA',
            estado: 'CONFIRMADO',
            montoTotal: Number(res.totalAmount),
            montoPagado: Number(res.paidAmount),
            fechaVenta: new Date().toISOString().split('T')[0],
            metodoPago: 'VARIOS',
            notas: `Venta generada por finalización de reserva #${res.id}`
          });
        } catch (vError) {
          console.error("Error creando venta tras finalización:", vError);
        }
      }

      const updated = await reservaService.finalizeReservation(id);
      setReservations(prev => prev.map(r => r.id === updated.id ? updated : r));
      setCalendarReservations(prev => prev.map(r => r.id === updated.id ? updated : r));
      if (selectedReserva?.id === updated.id) setSelectedReserva(updated);
      showNotification('Evento finalizado exitosamente.');
    } catch {
      showNotification('Error al finalizar el evento.', 'error');
    } finally {
      setFinalizeModal({ isOpen: false, id: null });
    }
  };

  // ─── AUTO-FINALIZACIÓN ───
  useEffect(() => {
    if (!loading && reservations.length > 0 && !hasCheckedAutoFinalize.current) {
      const checkFinalization = async () => {
        const now = new Date();
        // Solo para administradores/empleados
        if (!canManage) return;

        hasCheckedAutoFinalize.current = true;

        // Clonamos para evitar problemas de concurrencia durante el bucle
        const toCheck = [...reservations];

        for (const res of toCheck) {
          if (res.status === 'CONFIRMADA') {
            const eventDateTime = new Date(`${res.eventDate}T${res.startTime || '23:59'}`);
            if (now > eventDateTime) {
               try {
                  // Llamamos a la lógica completa de finalización (que incluye creación de venta)
                  await processFinalization(res.id);
               } catch (e) {
                  console.error("Error auto-finalizando", res.id, e);
               }
            }
          }
        }
      };
      checkFinalization();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, canManage]);

  useEffect(() => {
    if (user) {
      fetchData();
      // Refrescar cada 2 minutos para asegurar estados actualizados (anulación/finalización)
      const interval = setInterval(fetchData, 120000);
      return () => clearInterval(interval);
    }
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

    if (res.id?.startsWith('VENTA-')) {
      const calRes = calendarReservations.find(r => r.id === res.id);
      if (calRes) {
        setSelectedReserva(calRes as unknown as Reservation);
        setIsDetailOpen(true);
        return;
      }
      showNotification('No se encontraron los detalles de este evento.', 'error');
      return;
    }

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
      throw error;
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingReserva) return;
    if (!editingReserva.id || isNaN(Number(editingReserva.id))) {
      throw new Error('No se puede editar esta reserva: ID inválido. Por favor recarga la página e intenta de nuevo.');
    }
    try {
      const updated = await reservaService.updateReservation(editingReserva.id, data);
      setReservations(prev => prev.map(r => r.id === updated.id ? updated : r));
      setCalendarReservations(prev => prev.map(r => r.id === updated.id ? updated : r));
      if (selectedReserva?.id === updated.id) setSelectedReserva(updated);
      showNotification('Reserva actualizada.');
      setIsEditOpen(false);
    } catch (error: any) {
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
    } catch {
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
    } catch {
      showNotification('Error al eliminar bloqueos de hora.', 'error');
    } finally {
      setDeleteTimeBlocksModal({ isOpen: false, date: null });
    }
  };

  const handleCancelReserva = (id: string) => {
    const reservation = reservations.find(r => r.id === id) ?? null;
    setAnularModal({ isOpen: true, reservation });
  };

  const processCancel = async (id: string, motivo: string) => {
    try {
      const res = reservations.find(r => r.id === id);
      
      // Si tiene abono, creamos una venta por ese valor antes de anular (o como parte del proceso)
      if (res && Number(res.paidAmount) > 0) {
        try {
          await api.post('/ventas', {
            reservaId: Number(res.id),
            clienteId: Number(res.clientId),
            tipo: 'RESERVA',
            estado: 'CONFIRMADO',
            montoTotal: Number(res.paidAmount),
            montoPagado: Number(res.paidAmount),
            fechaVenta: new Date().toISOString().split('T')[0],
            metodoPago: 'VARIOS',
            notas: `Venta generada por anulación de reserva con abonos. Motivo: ${motivo}`
          });
          showNotification(`Se registró una venta por el valor abonado: $${Number(res.paidAmount).toLocaleString()}`, 'success');
        } catch (vError) {
          console.error("Error creando venta tras anulación:", vError);
        }
      }

      const updated = await reservaService.cancelReservation(id, motivo || 'Cancelación manual por usuario');
      // Actualizar la reserva con estado ANULADA en la lista
      setReservations(prev => prev.map(r => r.id === updated.id ? updated : r));
      // Remover la reserva del calendario para liberar la fecha/hora inmediatamente
      setCalendarReservations(prev => prev.filter(r => r.id !== updated.id));
      if (selectedReserva?.id === id) setSelectedReserva(updated);
      showNotification('Reserva anulada. La fecha ha sido liberada en el calendario.');
      
      // Refrescar datos del backend para asegurar sincronización completa
      await fetchData();
    } catch (error: any) {
      showNotification(error?.response?.data?.message || 'Error al anular.', 'error');
    }
  };

  const handleToggleStatus = (rehearsal: Rehearsal) => {
    const isCompleted = rehearsal.status === 'LISTO';
    if (isCompleted) {
      processToggleStatus(rehearsal);
      return;
    }
    setToggleEnsayoModal({ isOpen: true, rehearsal });
  };

  const processToggleStatus = async (rehearsal: Rehearsal) => {
    try {
      const updated = await rehearsalService.toggleStatus(rehearsal.id);
      setRehearsals(prev => prev.map(r => r.id === updated.id ? updated : r));
      showNotification(
        updated.status === 'LISTO'
          ? `Ensayo "${updated.title}" marcado como Listo.`
          : `Ensayo "${updated.title}" marcado como Pendiente.`
      );
    } catch (err: any) {
      showNotification(err?.response?.data?.message || 'Error al cambiar el estado del ensayo.', 'error');
    }
  };

  // ─── SAVE ABONO ────────────────────────────────────────────────────────────
  const handleSaveAbono = async (data: any) => {
    try {
      await api.post(`/reservas/${data.reservationId}/abonos`, {
        amount: data.amount,
        date:   data.date,
        method: data.method,
        notes:  data.notes,
      });

      setIsAbonoModalOpen(false);
      setAbonoReservationId(undefined);
      await fetchData();
      showNotification('Tu Abono fue Registrado con Exito', 'success', 6000);

    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Error al registrar el abono';
      showNotification(` ${msg}`, 'error', 6000);
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
    anularModal, setAnularModal, handleCancelReserva, processCancel,
    toggleEnsayoModal, setToggleEnsayoModal, handleToggleStatus, processToggleStatus,
    notification, setNotification, showNotification,
    canManage, isClient, user,
    fetchData, handleCreate, handleUpdate, handleSaveBlock,
    handleConfirmDeleteBlock, handleConfirmDeleteTimeBlocks,
    handleSaveAbono, processFinalization, handleTimeSlotBlock,
    handleViewReserva,
  };
};
