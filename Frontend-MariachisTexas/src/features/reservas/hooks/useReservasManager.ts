
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
  
  // Permisos
  const canManage = user?.role === UserRole.ADMIN || user?.role === UserRole.EMPLEADO;
  const isClient = user?.role === UserRole.CLIENTE;
  
  const [view, setView] = useState<'list' | 'calendar'>('list'); 
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Data
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [rehearsals, setRehearsals] = useState<Rehearsal[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Drag & Drop & Long Press States
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  
  // Refs para lógica de Long Press
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressAction = useRef(false);

  // Modales Estados
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false);
  const [isDateDetailsOpen, setIsDateDetailsOpen] = useState(false); 
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  
  const [editingReserva, setEditingReserva] = useState<Reservation | null>(null);
  const [selectedReserva, setSelectedReserva] = useState<Reservation | null>(null);
  const [selectedDateForForm, setSelectedDateForForm] = useState<string | null>(null); 
  const [selectedTimeForForm, setSelectedTimeForForm] = useState<string | null>(null); 
  const [selectedDateForDetails, setSelectedDateForDetails] = useState<string | null>(null); 
  const [abonoReservationId, setAbonoReservationId] = useState<string | undefined>(undefined); 
  const [selectedBlockForEdit, setSelectedBlockForEdit] = useState<CalendarBlock | null>(null);

  // Estados de Confirmación
  const [finalizeModal, setFinalizeModal] = useState<{isOpen: boolean, id: string | null}>({
      isOpen: false,
      id: null
  });

  const [deleteBlockModal, setDeleteBlockModal] = useState<{isOpen: boolean, blockId: string | null}>({
      isOpen: false,
      blockId: null
  });

  const [deleteTimeBlocksModal, setDeleteTimeBlocksModal] = useState<{isOpen: boolean, date: string | null}>({
      isOpen: false,
      date: null
  });

  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const showNotification = (message: string, type: 'success' | 'error' = 'success', duration = 4000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
        await reservaService.checkAndProcessPastEvents();
        
        const [resData, blocksData, rehData, quoteData] = await Promise.all([
            reservaService.getReservations(),
            blockService.getBlocks(),
            rehearsalService.getRehearsals(),
            cotizacionService.getQuotations()
        ]);

        setReservations(resData);
        setBlocks(blocksData);
        setRehearsals(rehData);
        setQuotations(quoteData);
    } catch (error) {
        console.error(error);
        showNotification("Error cargando datos.", "error");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Handlers CRUD Reservas
  const handleCreate = async (data: any) => {
      try {
          const newRes = await reservaService.createReservation(data);
          setReservations(prev => [newRes, ...prev]);
          
          const message = "Reserva creada. Comuníquese para el pago del anticipo.";
          showNotification(message, 'success', 5000);
          
          setIsCreateOpen(false);
      } catch (error: any) {
          console.error(error);
          showNotification(error.message || "Error al crear reserva.", "error");
      }
  };

  const handleUpdate = async (data: any) => {
      if (!editingReserva) return;
      try {
          const updated = await reservaService.updateReservation(editingReserva.id, data);
          setReservations(prev => prev.map(r => r.id === updated.id ? updated : r));
          showNotification('Reserva actualizada.');
          setIsEditOpen(false);
      } catch (error) {
          console.error(error);
          showNotification("Error al actualizar.", "error");
      }
  };

  // Handlers Bloqueos
  const handleSaveBlock = async (data: any) => {
      try {
          const newBlock = await blockService.createBlock(data);
          setBlocks(prev => [...prev, newBlock]);
          showNotification('Fecha bloqueada correctamente.');
          setIsBlockModalOpen(false);
      } catch (error) {
          console.error(error);
          showNotification("Error al guardar bloqueo.", "error");
      }
  };

  const handleConfirmDeleteBlock = async () => {
      if (!deleteBlockModal.blockId) return;
      try {
          await blockService.deleteBlock(deleteBlockModal.blockId);
          setBlocks(prev => prev.filter(b => b.id !== deleteBlockModal.blockId));
          showNotification('Bloqueo eliminado correctamente.');
      } catch (error) {
          console.error(error);
          showNotification("Error al eliminar bloqueo.", "error");
      } finally {
          setDeleteBlockModal({ isOpen: false, blockId: null });
      }
  };

  const handleConfirmDeleteTimeBlocks = async () => {
      if (!deleteTimeBlocksModal.date) return;
      try {
          const blocksToDelete = blocks.filter(b => 
              b.isActive && 
              b.type === 'TIME_RANGE' && 
              b.startDate === deleteTimeBlocksModal.date
          );
          
          await Promise.all(blocksToDelete.map(b => blockService.deleteBlock(b.id)));
          
          const idsToDelete = blocksToDelete.map(b => b.id);
          setBlocks(prev => prev.filter(b => !idsToDelete.includes(b.id)));
          
          showNotification('Se han liberado las horas bloqueadas de este día.');
      } catch (error) {
          console.error(error);
          showNotification("Error al eliminar bloqueos de hora.", "error");
      } finally {
          setDeleteTimeBlocksModal({ isOpen: false, date: null });
      }
  };

  const handleSaveAbono = async (data: any) => {
      try {
          await abonoService.createAbono(data);
          await fetchData(); 
          showNotification('Abono registrado y saldo actualizado.');
          setIsAbonoModalOpen(false);
      } catch (error) {
          console.error(error);
          showNotification("Error al registrar el abono.", "error");
      }
  };

  const processFinalization = async () => {
      if (!finalizeModal.id) return;
      try {
          const updated = await reservaService.finalizeReservation(finalizeModal.id);
          setReservations(prev => prev.map(r => r.id === updated.id ? updated : r));
          if (selectedReserva?.id === updated.id) setSelectedReserva(updated);
          showNotification('Evento finalizado exitosamente.');
      } catch (error) {
          console.error(error);
          showNotification('Error al finalizar el evento.', 'error');
      } finally {
          setFinalizeModal({ isOpen: false, id: null });
      }
  };

  const handleCancelReserva = async (id: string) => {
      if (window.confirm("¿Estás seguro de anular esta reserva? Esta acción es irreversible.")) {
          try {
              const updated = await reservaService.cancelReservation(id, "Cancelación manual por usuario");
              setReservations(prev => prev.map(r => r.id === updated.id ? updated : r));
              if (selectedReserva?.id === id) setSelectedReserva(updated);
              showNotification('Reserva anulada.', 'error');
          } catch (error) {
              console.error(error);
          }
      }
  };

  const handleTimeSlotBlock = (date: string, time: string) => {
      if (!canManage) return;
      const [h, m] = time.split(':').map(Number);
      const nextH = h + 1;
      const endTime = `${nextH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

      setSelectedBlockForEdit({
          id: '',
          type: 'TIME_RANGE',
          reason: '',
          description: '',
          startDate: date,
          endDate: date,
          startTime: time,
          endTime: endTime,
          isActive: true
      });
      setIsBlockModalOpen(true);
  };

  return {
    // State
    view, setView,
    currentDate, setCurrentDate,
    reservations, setReservations,
    blocks, setBlocks,
    rehearsals, setRehearsals,
    quotations, setQuotations,
    loading, setLoading,
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
    fetchData,
    handleCreate,
    handleUpdate,
    handleSaveBlock,
    handleConfirmDeleteBlock,
    handleConfirmDeleteTimeBlocks,
    handleSaveAbono,
    processFinalization,
    handleCancelReserva,
    handleTimeSlotBlock
  };
};
