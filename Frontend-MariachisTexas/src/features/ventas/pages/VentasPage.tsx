import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, CheckCircle, AlertCircle, X, Eye, Download, CreditCard, Calendar, User, CheckSquare, Clock, Plus, CalendarClock, Ban, Smartphone, Coins, Building2, Wallet, Check } from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { UserRole } from '@/types';
import api from '@/shared/api/api';
import { TablePagination } from '@/shared/components/TablePagination';
import { AbonoCreateModal } from '@/src/features/abonos/components/AbonoCreateModal';
import { VentaCreateModal } from '../components/VentaCreateModal';
import { VentaDetailModal } from '../components/VentaDetailModal';
import { ReservaEditModal } from '../../reservas/components/ReservaEditModal';
import { reservaService } from '../../reservas/services/reservaService';
import { ventaService } from '../services/ventaService';
import { useReservasManager } from '../../reservas/hooks/useReservasManager';
import { UpcomingReservationsBanner } from '../../reservas/components/UpcomingReservationsBanner';
import { ReservaDetailModal } from '../../reservas/components/ReservaDetailModal';
import { AnularReservaModal } from '@/shared/components/AnularReservaModal';
import { ActionButton } from '@/shared/components/ActionButton';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SaleRecord {
  id:                 string;
  date:               string;
  type:               string;
  clientName:         string;
  clientId?:          string;
  clientEmail?:       string;
  concept:            string;
  method:             string;
  amount:             number;
  totalAmount?:       number;
  pendingAmount?:     number;
  paidAmount?:        number;
  reservationId?:     string;
  reservationStatus?: string;
  eventDate?:         string;
  eventType?:         string;
  status:             string;
  abonos?:            { id: string; amount: number; date: string; method: string; notes: string }[];
  // ─── Nuevos ───────────────────────────────────────────────────────────────
  eventTime?:         string;
  eventEndTime?:      string;
  eventLocation?:     string;
  homenajeado?:       string;
  notes?:             string;
  services?:          { nombre: string; cantidad: number; precio: number }[];
  repertoire?:        { titulo: string; artista: string }[];
}

const metodoPagoLabel: Record<string, string> = {
  EFECTIVO:      'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  NEQUI:         'Nequi',
  DAVIPLATA:     'Daviplata',
  OTRO:          'Otro',
};

// ─── AbonoModal - 2nd payment (final balance) ─────────────────────────────────
interface FinalPaymentModalProps {
  isOpen:        boolean;
  onClose:       () => void;
  sale:          SaleRecord | null;
  onSave:        (data: { reservationId: string; amount: number; date: string; method: string; notes?: string }) => Promise<void>;
}

const FinalPaymentModal: React.FC<FinalPaymentModalProps> = ({ isOpen, onClose, sale, onSave }) => {
  const [method,  setMethod]  = useState('TRANSFERENCIA');
  const [date,    setDate]    = useState(new Date().toISOString().split('T')[0]);
  const [notes,   setNotes]   = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const saldo = sale?.pendingAmount ?? 0;
  const total = sale?.totalAmount ?? 0;
  const paid = sale?.paidAmount ?? 0;
  
  const paidPercent = total > 0 ? Math.round((paid / total) * 100) : 50;

  useEffect(() => {
    if (isOpen) {
      setMethod('TRANSFERENCIA');
      setDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sale?.reservationId) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        reservationId: sale.reservationId,
        amount:        saldo,
        date,
        method,
        notes:         notes || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Error al registrar pago');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !sale) return null;

  const getMethodIcon = (m: string) => {
    switch (m) {
      case 'TRANSFERENCIA': return <Wallet size={16} />;
      case 'NEQUI':
      case 'DAVIPLATA': return <Smartphone size={16} />;
      case 'EFECTIVO': return <Coins size={16} />;
      default: return <CreditCard size={16} />;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[95vh] border border-slate-100">

        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 px-5 py-3.5 flex items-center justify-between text-white shadow-lg shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
              <CheckSquare size={16} strokeWidth={2.5} className="text-white" />
            </div>
            <div>
              <h3 className="text-xs font-serif font-bold tracking-wider uppercase">Registrar Saldo Final</h3>
              <p className="text-[9px] text-white/70 font-medium">Completa el pago de la reserva</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all duration-300 hover:rotate-90"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="mb-3 flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-red-600 text-xs shadow-sm">
              <AlertCircle size={14} className="shrink-0" /> 
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Premium Compact Billing Card */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white rounded-xl p-4 mb-3 shadow-md relative overflow-hidden border border-slate-800">
            {/* Background design elements */}
            <div className="absolute -right-8 -top-8 w-20 h-20 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-2.5 relative z-10">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Detalle del Saldo</span>
              <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full">
                Reserva #{sale.reservationId ? sale.reservationId.toString().replace('RES-','') : ''}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-[10px] text-slate-450 font-medium relative z-10 mb-2.5 border-b border-slate-800/40 pb-2">
              <span className="truncate mr-2">Cliente: <span className="text-white font-semibold">{sale.clientName}</span></span>
              <span className="truncate max-w-[180px]">Concepto: <span className="text-white font-semibold">{sale.concept}</span></span>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div>
                <p className="text-[8px] text-slate-400 uppercase tracking-wider font-bold">Total del Evento</p>
                <p className="text-base font-serif font-bold text-slate-300">${total.toLocaleString('es-CO')}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] text-red-400 uppercase tracking-wider font-bold">Saldo Pendiente</p>
                <p className="text-xl font-serif font-black text-rose-500 tracking-tight">
                  <span className="text-xs mr-0.5">$</span>{saldo.toLocaleString('es-CO')}
                </p>
              </div>
            </div>

            {/* Custom visual progress bar */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 relative z-10">
              <div className="flex justify-between text-[8px] font-bold uppercase tracking-wider mb-1">
                <span className="text-emerald-400">Abonado ({paidPercent}%)</span>
                <span className="text-rose-400">Pendiente ({100 - paidPercent}%)</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                <div style={{ width: `${paidPercent}%` }} className="h-full bg-emerald-500 transition-all duration-500" />
                <div className="h-full bg-rose-500 flex-1 transition-all duration-500" />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Custom Payment Method Grid Selector */}
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                Método de Pago
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(metodoPagoLabel).map(([val, label]) => {
                  const isSelected = method === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMethod(val)}
                      className={`flex items-center justify-between py-2 px-3 rounded-lg border text-xs font-semibold transition-all relative ${
                        isSelected
                          ? 'border-red-500 bg-red-50/30 text-red-750 shadow-sm ring-2 ring-red-500/5'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={isSelected ? 'text-red-500' : 'text-slate-400'}>
                          {getMethodIcon(val)}
                        </span>
                        <span>{label}</span>
                      </div>
                      {isSelected && (
                        <div className="w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center">
                          <Check size={8} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date field */}
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                Fecha de Pago
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar size={13} />
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/5 transition-all bg-white hover:border-slate-300"
                />
              </div>
            </div>

            {/* Notes field */}
            <div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                Notas (opcional)
              </label>
              <div className="relative">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={1}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-700 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/5 transition-all bg-white hover:border-slate-300 resize-none h-9"
                  placeholder="Referencia de pago..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-1">
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 py-2.5 border border-slate-200 rounded-lg text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-slate-650 hover:border-slate-300 transition-all active:scale-[0.98]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-[2] py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-650 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest shadow-md shadow-red-950/5 hover:shadow-red-600/15 hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {saving ? (
                  <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard size={12} />
                    <span>Pagar ${saldo.toLocaleString('es-CO')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};


// ─── Main Page ────────────────────────────────────────────────────────────────

export const VentasPage: React.FC = () => {
  const { user }        = useAuth();
  const [sales,         setSales]         = useState<SaleRecord[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [searchTerm,    setSearchTerm]    = useState('');
  const [currentPage,   setCurrentPage]   = useState(1);
  const [statusFilter,   setStatusFilter]  = useState<'TODOS' | 'CONFIRMADO' | 'FINALIZADO' | 'ANULADO'>('TODOS');
  const [notification,  setNotification]  = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [detailSale,    setDetailSale]    = useState<SaleRecord | null>(null);
  const [isDetailOpen,  setIsDetailOpen]  = useState(false);
     const [finalPaySale,  setFinalPaySale]  = useState<SaleRecord | null>(null);
    const [isFinalPayOpen,setIsFinalPayOpen]= useState(false);
    const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
    
    // ─── Edición de reserva desde ventas ─────────────────────────────────────
    const [isEditReservaOpen,    setIsEditReservaOpen]    = useState(false);
    const [selectedReservaEdit,  setSelectedReservaEdit]  = useState<any>(null);
    const [activeSaleForEdit,    setActiveSaleForEdit]    = useState<SaleRecord | null>(null);
    const [isAnularModalOpen,   setIsAnularModalOpen]   = useState(false);
    const [selectedReservaForAnular, setSelectedReservaForAnular] = useState<any>(null);

  const isClient = user?.role === UserRole.CLIENTE;
  const itemsPerPage = 10;

  const { 
    reservations, calendarReservations, handleViewReserva, 
    isDetailOpen: isResDetailOpen, setIsDetailOpen: setIsResDetailOpen, 
    selectedReserva, setSelectedReserva,
    processFinalization, processCancel
  } = useReservasManager();

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

   const fetchSales = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/ventas');
      // El backend ahora devuelve { ok, data: [...], total }
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setSales(list);
    } catch {
      showNotification('Error cargando ventas.', 'error');
    } finally {
      setLoading(false);
    }
  };
 

  useEffect(() => { fetchSales(); }, [user]);

  const handleFinalPayment = async (data: { reservationId: string; amount: number; date: string; method: string; notes?: string }) => {
    await api.post(`/ventas/reserva/${data.reservationId}/abono`, {
      amount: data.amount,
      date:   data.date,
      method: data.method,
      notes:  data.notes,
    });
    showNotification('Pago final registrado. La reserva sigue Confirmada hasta la fecha del evento.');
    setIsFinalPayOpen(false);
    await fetchSales();
  };

const handleCreateSale = async (data: any) => {
  const esReserva = data.type !== 'Directa'
 
  await api.post('/ventas', {
    reservaId:   esReserva && data.reservationId ? Number(data.reservationId) : null,
    clienteId:   Number(data.clienteId),
    tipo:        esReserva ? 'RESERVA' : 'DIRECTA',
    estado:      'CONFIRMADO',
    montoTotal:  esReserva ? Number(data.totalAmount) : Number(data.amount),
    montoPagado: esReserva ? Number(data.paidAmount)  : Number(data.amount),
    fechaVenta:  data.date,
    metodoPago:  String(data.method).toUpperCase(),
  })
 
  // Solo llega aquí si el POST fue exitoso (2xx)
  showNotification('Venta registrada correctamente')
  setIsNewSaleOpen(false)
  await fetchSales()

}

  const handleDownloadPdf = async (reservationId: string) => {
    showNotification('Generando PDF...');
    try {
      const token    = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/ventas/reserva/${reservationId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al generar PDF');
      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `Reserva-${reservationId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification('PDF descargado correctamente.');
    } catch {
      showNotification('Error al generar el PDF.', 'error');
    }
  };

  const handleOpenEditReserva = async (sale: SaleRecord) => {
    if (!sale.reservationId) return;
    try {
      setLoading(true);
      const res = await reservaService.getReservationById(sale.reservationId);
      setSelectedReservaEdit(res);
      setActiveSaleForEdit(sale);
      setIsEditReservaOpen(true);
    } catch {
      showNotification('Error al obtener los detalles de la reserva.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAnularModal = async (sale: SaleRecord) => {
    if (!sale.reservationId) return;
    try {
      setLoading(true);
      const res = await reservaService.getReservationById(sale.reservationId);
      setSelectedReservaForAnular(res);
      setIsAnularModalOpen(true);
    } catch {
      showNotification('Error al obtener los detalles de la reserva.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEditReserva = async (formData: any) => {
    if (!activeSaleForEdit) return;
    try {
      await ventaService.updateReservationFromSale(activeSaleForEdit.id, formData);
      showNotification('Reserva actualizada correctamente desde ventas.');
      setIsEditReservaOpen(false);
      await fetchSales();
    } catch (err: any) {
      throw err; // El modal maneja el error internamente si lo lanzamos
    }
  };

  const getStatusBadge = (sale: SaleRecord) => {
    const now = new Date();
    const eventDateStr = sale.eventDate;
    const eventTimeStr = sale.eventTime || '23:59';
    
    let hasPassed = false;
    if (eventDateStr) {
      const eventDateTime = new Date(`${eventDateStr}T${eventTimeStr}`);
      hasPassed = now > eventDateTime;
    }

    if (sale.status?.toUpperCase() === 'CANCELADA' || sale.reservationStatus?.toUpperCase() === 'ANULADA') {
      return { label: 'Anulada', cls: 'bg-red-50 text-red-700 border-red-200' };
    }

    if (sale.reservationId) {
      if (hasPassed && (sale.reservationStatus === 'FINALIZADO' || sale.status === 'Finalizado')) {
        return { label: 'Finalizado', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
      }
      return { label: 'Confirmado', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }

    if (sale.status === 'Finalizado' || (sale.pendingAmount ?? 0) <= 0) {
      return { label: 'Finalizado', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    
    return { label: 'Venta Directa', cls: 'bg-slate-50 text-slate-500 border-slate-200' };
  };

  // Resetear página al filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  const filtered = React.useMemo(() => {
    return sales.filter(s => {
      const matchesSearch = 
        (s.clientName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.concept ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.id ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      
      if (statusFilter === 'TODOS') return matchesSearch;
      
      const badge = getStatusBadge(s);
      const badgeLabel = badge.label.toUpperCase();
      
      // Normalizar ANULADA/ANULADO
      if (statusFilter === 'ANULADO') {
        return matchesSearch && (badgeLabel === 'ANULADO' || badgeLabel === 'ANULADA');
      }
      
      return matchesSearch && badgeLabel === statusFilter;
    });
  }, [sales, searchTerm, statusFilter]);

  const totalPages   = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      
      {!isClient && <UpcomingReservationsBanner reservations={calendarReservations} onView={handleViewReserva} />}

      {/* Toast */}
      {notification && createPortal(
        <div className="fixed top-6 right-6 z-[200] animate-fade-in-up">
          <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md min-w-[320px] bg-white/95 ${notification.type === 'success' ? 'border-emerald-100' : 'border-red-100'} `}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-slate-800">{notification.type === 'success' ? 'Notificación' : 'Error'}</h4>
              <p className="text-xs text-slate-500">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>
        </div>,
        document.body
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-800 tracking-wide uppercase">
            {isClient ? 'Mis Pagos' : 'Gestión de Ventas'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {isClient
              ? 'Historial de tus pagos y reservas confirmadas.'
              : 'Reservas confirmadas con anticipo del 50%. Registra pagos finales aquí.'}
          </p>
        </div>
        {!isClient && (
          <button
            onClick={() => setIsNewSaleOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full flex items-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 font-bold text-xs tracking-widest uppercase"
          >
            <Plus size={16} strokeWidth={3} /> REGISTRAR VENTA
          </button>
        )}
      </div>



      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-8 pb-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por cliente o ID"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-full py-3 pl-11 pr-6 text-slate-600 focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all text-sm"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {[
              { id: 'TODOS', label: 'Todos' },
              { id: 'CONFIRMADO', label: 'Confirmados' },
              { id: 'FINALIZADO', label: 'Finalizados' },
              { id: 'ANULADO', label: 'Anulados' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${
                  statusFilter === f.id 
                    ? 'bg-red-600 border-red-600 text-white shadow-md shadow-red-200' 
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">Cargando ventas...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400">No se encontraron registros.</div>
        ) : (
          <div className="flex flex-col">
            <div className="overflow-x-auto p-8 pt-4 pb-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">ID / Fecha</th>
                    <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cliente / Concepto</th>
                    <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                    <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total / Saldo</th>
                    <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {currentItems.map(sale => {
                    const badge       = getStatusBadge(sale);
                    // Lógica idéntica al badge: solo es finalizado si ya pasó la fecha/hora
                    const eventDateStr = sale.eventDate;
                    const eventTimeStr = sale.eventTime || '23:59';
                    const now = new Date();
                    let hasPassed = false;
                    if (eventDateStr) {
                      const eventDateTime = new Date(`${eventDateStr}T${eventTimeStr}`);
                      hasPassed = now > eventDateTime;
                    }

                    const isFinalizadoStatus = (sale.status?.toUpperCase() === 'FINALIZADO' || sale.reservationStatus?.toUpperCase() === 'FINALIZADO') && hasPassed;
                    const isPagado           = (sale.pendingAmount ?? 0) <= 0;
                    const isAnulada          = sale.status?.toUpperCase() === 'CANCELADA' || sale.reservationStatus?.toUpperCase() === 'ANULADA';
                    const hasPending         = !isFinalizadoStatus && !isAnulada && !isPagado && !!sale.reservationId;

                    return (
                      <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4">
                          <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">#{sale.id.replace('RES-','')}</span>
                          {sale.eventDate && (
                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              <Calendar size={10} /> {sale.eventDate}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-800 text-sm flex items-center gap-1">
                            <User size={12} className="text-slate-400" /> {sale.clientName}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{sale.concept}</p>
                          {sale.eventType && (
                            <p className="text-[10px] text-slate-300 uppercase tracking-wide">{sale.eventType}</p>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            {/* Monto Abonado (Principal) */}
                            <p className="text-sm font-bold text-slate-800">
                              ${(sale.paidAmount ?? 0).toLocaleString('es-CO')}
                            </p>
                            
                            {/* Saldo Pendiente */}
                            {!isPagado && !isAnulada && (sale.pendingAmount ?? 0) > 0 && (
                              <p className="text-[10px] font-bold text-red-500 flex items-center gap-1 mt-0.5">
                                <Clock size={10} /> Pendiente: ${(sale.pendingAmount ?? 0).toLocaleString('es-CO')}
                              </p>
                            )}

                            {/* Total de la Operación */}
                            <p className="text-[9px] text-slate-400 font-medium mt-1 uppercase tracking-tighter">
                              Total: ${(sale.totalAmount ?? sale.amount).toLocaleString('es-CO')}
                            </p>

                            {(isPagado && !isAnulada) || (isAnulada && (sale.paidAmount ?? 0) > 0) ? (
                              <p className="text-[9px] font-bold text-emerald-500 mt-1 uppercase">✓ Pagado</p>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <ActionButton
                              icon={Eye}
                              onClick={() => { setDetailSale(sale); setIsDetailOpen(true); }}
                              tooltip="Ver detalle"
                            />

                            {!isClient && sale.reservationId && !isAnulada && !isFinalizadoStatus && (
                              <>
                                <ActionButton
                                  icon={CalendarClock}
                                  onClick={() => handleOpenEditReserva(sale)}
                                  tooltip="Editar reserva"
                                />

                                {hasPending && (
                                  <ActionButton
                                    icon={CreditCard}
                                    onClick={() => { setFinalPaySale(sale); setIsFinalPayOpen(true); }}
                                    tooltip="Registrar pago final"
                                  />
                                )}

                                <ActionButton
                                  icon={Ban}
                                  tooltip="Anular Reserva"
                                  onClick={() => handleOpenAnularModal(sale)}
                                />
                              </>
                            )}

                            {/* Download PDF */}
                            {sale.reservationId && (
                            <ActionButton
                              icon={Download}
                              onClick={() => handleDownloadPdf(sale.reservationId!)}
                              tooltip="Descargar PDF"
                            />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filtered.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <VentaDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        sale={detailSale as any}
        onDownload={(idOrResId) => {
          const targetId = detailSale?.reservationId || idOrResId;
          handleDownloadPdf(targetId);
        }}
      />

      <FinalPaymentModal
        isOpen={isFinalPayOpen}
        onClose={() => setIsFinalPayOpen(false)}
        sale={finalPaySale}
        onSave={handleFinalPayment}
      />

      <VentaCreateModal
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
        onSave={handleCreateSale}
      />

      <ReservaEditModal
        isOpen={isEditReservaOpen}
        onClose={() => { setIsEditReservaOpen(false); setSelectedReservaEdit(null); }}
        onSave={async (data) => {
          await reservaService.updateReservation(data.id, data);
          await fetchSales();
          setIsEditReservaOpen(false);
        }}
        reservation={selectedReservaEdit}
      />

      <ReservaDetailModal
        isOpen={isResDetailOpen}
        onClose={() => setIsResDetailOpen(false)}
        reservation={selectedReserva}
        onFinalize={processFinalization}
        onCancel={processCancel}
        onReschedule={(res) => {
          setSelectedReservaEdit(res);
          setIsResDetailOpen(false);
          setIsEditReservaOpen(true);
        }}
      />

      <AnularReservaModal
        isOpen={isAnularModalOpen}
        reservation={selectedReservaForAnular}
        onClose={() => setIsAnularModalOpen(false)}
        onConfirm={async (id, motivo) => {
          await processCancel(id, motivo);
          await fetchSales();
        }}
      />
    </div>
  );
};