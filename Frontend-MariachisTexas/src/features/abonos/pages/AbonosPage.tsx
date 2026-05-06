import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, CheckCircle, AlertCircle, X, Eye, Download, Calendar, CreditCard, User, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { UserRole } from '@/types';
import api from '@/shared/api/api';
import { TablePagination } from '@/shared/components/TablePagination';


// ─── Types ────────────────────────────────────────────────────────────────────
interface Abono {
  id:               string;
  amount:           number;
  date:             string;
  method:           string;
  notes:            string;
  reservationId:    string;
  reservationStatus?: string;
  clientId:         string;
  clientEmail:      string;
  clientName:       string;
  reservationTotal: number;
  newBalance:       number;
}

interface ReservaGroup {
  reservationId:    string;
  clientName:       string;
  clientEmail:      string;
  reservationTotal: number;
  paid:             number;
  pending:          number;
  eventType?:       string;
  reservationStatus?: string;
  abonos:           Abono[];
}

const getReservationStatusDisplay = (status: string | undefined, pending: number) => {
  if (status === 'ANULADA') {
    return {
      label: 'Anulada',
      className: 'bg-red-50 text-red-600 border-red-100',
    };
  }

  if (pending <= 0.01) {
    return {
      label: 'Pagado',
      className: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    };
  }

  if (status === 'CONFIRMADA') {
    return {
      label: 'Confirmada',
      className: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    };
  }

  return {
    label: 'Pendiente',
    className: 'bg-amber-50 text-amber-600 border-amber-100',
  };
};

const metodoPagoLabel: Record<string, string> = {
  EFECTIVO:      'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  NEQUI:         'Nequi',
  DAVIPLATA:     'Daviplata',
  OTRO:          'Otro',
};

// ─── Abono DETALLE───────────────────────────────────────────────────────
const AbonoDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  abono: Abono | null;
  onDownload: (id: string) => void;
}> = ({ isOpen, onClose, abono, onDownload }) => {
  if (!isOpen || !abono) return null;
  const isFirstAbono = abono.newBalance > 0;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[320px] bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">

        {/* Header */}
        <div className="bg-slate-900 pt-6 pb-5 px-5 text-center border-b border-slate-800">
          <button onClick={onClose} className="absolute top-3 right-3 text-white/40 hover:text-white bg-white/5 p-1 rounded-full">
            <X size={14} />
          </button>
          <div className="w-12 h-12 mx-auto bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-3">
            <CreditCard className="text-emerald-400" size={22} />
          </div>
          <h3 className="text-sm font-serif font-bold text-white tracking-widest uppercase mb-0.5">
            {isFirstAbono ? '1er Abono' : '2do Abono'}
          </h3>
          <p className="text-[9px] text-slate-400 font-mono uppercase">ABONO #{abono.id}</p>
        </div>

        {/* Amount */}
        <div className="text-center pt-5 pb-4">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monto Pagado</p>
          <h2 className="text-3xl font-serif font-bold text-slate-800">${abono.amount.toLocaleString('es-CO')}</h2>
        </div>

        {/* Divider */}
        <div className="relative w-full h-4 flex items-center">
          <div className="absolute left-0 w-full border-t-2 border-dashed border-slate-100" />
          <div className="absolute left-[-8px] w-4 h-4 rounded-full bg-slate-100" />
          <div className="absolute right-[-8px] w-4 h-4 rounded-full bg-slate-100" />
        </div>

        {/* Details */}
        <div className="px-6 py-4 space-y-3">
          {[
            { label: 'Fecha',     value: new Date(abono.date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) },
            { label: 'Cliente',   value: abono.clientName },
            { label: 'Método',    value: metodoPagoLabel[abono.method] ?? abono.method },
            { label: 'Reserva',   value: `#${abono.reservationId}` },
            { label: 'Saldo quedó', value: `$${abono.newBalance.toLocaleString('es-CO')}` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
              <span className="font-bold text-slate-700 truncate max-w-[160px] text-right">{value}</span>
            </div>
          ))}
          {abono.notes && (
            <div className="pt-1 bg-slate-50 rounded-lg p-2 text-[10px] text-slate-500 italic">"{abono.notes}"</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={() => onDownload(abono.id)}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
          >
            <Download size={14} /> Descargar Comprobante
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};



// ─── Modal Registrar Abono ────────────────────────────────────────────────────
 interface RegisterAbonoFormErrors {
  reservationId?: string;
  date?:          string;
  method?:        string;
}
const REGISTER_EMPTY_ERRORS: RegisterAbonoFormErrors = {};
 
export const RegisterAbonoModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  showNotification: (msg: string, type?: 'success' | 'error') => void;
}> = ({ isOpen, onClose, onSuccess, showNotification }) => {
  const [reservations, setReservations] = useState<{ id: string; clientName: string; pending: number; paid: number; total: number }[]>([]);
  const [form, setForm] = useState({
    reservationId: '',
    date: new Date().toISOString().split('T')[0],
    method: 'EFECTIVO',
    notes: '',
  });
  const [errors,      setErrors]      = useState<RegisterAbonoFormErrors>(REGISTER_EMPTY_ERRORS);
  const [error,       setError]       = useState<string | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [loadingRes,  setLoadingRes]  = useState(false);
 
  useEffect(() => {
    if (!isOpen) return;
    setErrors(REGISTER_EMPTY_ERRORS);
    setError(null);
    setLoadingRes(true);
    api.get('/abonos/payable-reservations')
      .then(({ data }) => setReservations(data))
      .catch(() => setError('Error cargando reservas. Por favor recarga la página.'))
      .finally(() => setLoadingRes(false));
  }, [isOpen]);
 
  const handleFormChange = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field as keyof RegisterAbonoFormErrors])
      setErrors(prev => ({ ...prev, [field]: undefined }));
    if (error) setError(null);
  };
 
  const selectedRes    = reservations.find(r => r.id === form.reservationId);
  const montoRequerido = selectedRes
    ? selectedRes.paid === 0
      ? Math.ceil(selectedRes.total / 2)
      : selectedRes.pending
    : 0;
  const isSecondAbono = selectedRes && selectedRes.paid > 0;
  const abonoLabel    = isSecondAbono ? '2do Abono' : '1er Abono';
 
  const handleSubmit = async () => {
    // Validación por campo
    const newErrors: RegisterAbonoFormErrors = {};
    if (!form.reservationId || !selectedRes)
      newErrors.reservationId = 'Selecciona una reserva.';
    if (!form.date)
      newErrors.date = 'La fecha es requerida.';
    if (!form.method)
      newErrors.method = 'El método de pago es requerido.';
 
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // NO cierra el modal
    }
 
    setErrors(REGISTER_EMPTY_ERRORS);
    setError(null);
    setSubmitting(true);
 
    try {
      await api.post('/abonos', {
        reservaId: form.reservationId,
        amount:    montoRequerido,
        date:      form.date,
        method:    form.method,
        notes:     form.notes,
      });
      onSuccess();
      onClose();
      setForm({
        reservationId: '',
        date: new Date().toISOString().split('T')[0],
        method: 'EFECTIVO',
        notes: '',
      });
    } catch (err: any) {
      // Error del backend — NO cerramos el modal
      const backendMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Error al registrar abono.';
      setError(backendMessage);
    } finally {
      setSubmitting(false);
    }
  };
 
  if (!isOpen) return null;
 
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
 
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up">
 
        {/* Header */}
        <div className="bg-red-600 px-6 py-5 flex items-center justify-between rounded-t-2xl flex-shrink-0">
          <div>
            <h3 className="text-white font-serif font-bold text-lg tracking-wide">Registrar Abono</h3>
            <p className="text-red-200 text-xs mt-0.5">Selecciona la reserva y completa los datos</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white bg-white/10 p-1.5 rounded-full transition-all">
            <X size={16} />
          </button>
        </div>
 
        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
 
          {/* ✅ Error global del backend */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" /> {error}
            </div>
          )}
 
          {/* Reserva */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Reserva <span className="text-red-500">*</span>
            </label>
            <select
              value={form.reservationId}
              onChange={e => handleFormChange('reservationId', e.target.value)}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-red-100 outline-none bg-white transition-all ${
                errors.reservationId
                  ? 'border-red-400 bg-red-50 ring-2 ring-red-100 focus:border-red-500'
                  : 'border-slate-200 focus:border-red-400'
              }`}
            >
              <option value="">{loadingRes ? 'Cargando...' : '-- Selecciona una reserva --'}</option>
              {reservations.map(r => (
                <option key={r.id} value={r.id}>
                  #{r.id} — {r.clientName} (Pendiente: ${r.pending?.toLocaleString('es-CO')})
                </option>
              ))}
            </select>
            {errors.reservationId && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {errors.reservationId}
              </p>
            )}
          </div>
 
          {/* Info reserva seleccionada */}
          {selectedRes && (
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${isSecondAbono ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                  {abonoLabel}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total</p>
                  <p className="text-sm font-bold text-slate-700">${selectedRes.total.toLocaleString('es-CO')}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pagado</p>
                  <p className="text-sm font-bold text-emerald-600">${selectedRes.paid.toLocaleString('es-CO')}</p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pendiente</p>
                  <p className="text-sm font-bold text-red-500">${selectedRes.pending.toLocaleString('es-CO')}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monto a registrar</p>
                <div className="flex items-center gap-2 bg-white border-2 border-red-400 rounded-xl px-4 py-2.5">
                  <span className="text-slate-400 font-bold text-sm">$</span>
                  <span className="text-lg font-bold text-red-600">{montoRequerido.toLocaleString('es-CO')}</span>
                  <span className="ml-auto text-[9px] text-slate-400 font-bold uppercase">Fijo</span>
                </div>
              </div>
            </div>
          )}
 
          {/* Fecha y Método */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Fecha <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.date}
                onChange={e => handleFormChange('date', e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none transition-all ${
                  errors.date
                    ? 'border-red-400 bg-red-50 ring-2 ring-red-100 focus:border-red-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-red-100 focus:border-red-400'
                }`}
              />
              {errors.date && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.date}
                </p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Método de Pago <span className="text-red-500">*</span>
              </label>
              <select
                value={form.method}
                onChange={e => handleFormChange('method', e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm text-slate-700 outline-none bg-white transition-all ${
                  errors.method
                    ? 'border-red-400 bg-red-50 ring-2 ring-red-100 focus:border-red-500'
                    : 'border-slate-200 focus:ring-2 focus:ring-red-100 focus:border-red-400'
                }`}
              >
                {[
                  { value: 'EFECTIVO', label: 'Efectivo' },
                  { value: 'TRANSFERENCIA', label: 'Transferencia' },
                  { value: 'NEQUI', label: 'Nequi' },
                  { value: 'DAVIPLATA', label: 'Daviplata' },
                  { value: 'OTRO', label: 'Otro' },
                ].map(({ value: val, label }) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              {errors.method && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.method}
                </p>
              )}
            </div>
          </div>
 
          {/* Notas */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Notas (opcional)</label>
            <textarea
              rows={2}
              placeholder="Observaciones del pago..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none resize-none"
            />
          </div>
        </div>
 
        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0 rounded-b-2xl bg-white">
          <button onClick={onClose} disabled={submitting}
            className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.reservationId}
            className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
            {submitting ? 'Guardando...' : <><Plus size={14} /> Registrar Abono</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};


// ─── Pagina ────────────────────────────────────────────────────────────────
export const AbonosPage: React.FC = () => {
  const { user }        = useAuth();
  const [abonos,        setAbonos]        = useState<Abono[]>([]);
  const [groups,        setGroups]        = useState<ReservaGroup[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [searchTerm,    setSearchTerm]    = useState('');
  const [currentPage,   setCurrentPage]   = useState(1);
  const [expandedId,    setExpandedId]    = useState<string | null>(null);
  const [notification,  setNotification]  = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedAbono, setSelectedAbono] = useState<Abono | null>(null);
  const [isDetailOpen,  setIsDetailOpen]  = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const isClient   = user?.role === UserRole.CLIENTE;
  const itemsPerPage = 10;

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchAbonos = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/abonos');
      setAbonos(data);

      // Group abonos by reservationId
      const grouped = new Map<string, ReservaGroup>();
      (data as Abono[]).forEach(a => {
        if (!grouped.has(a.reservationId)) {
          grouped.set(a.reservationId, {
            reservationId:    a.reservationId,
            clientName:       a.clientName,
            clientEmail:      a.clientEmail,
            reservationTotal: a.reservationTotal,
            reservationStatus: a.reservationStatus,
            paid:             0,
            pending:          0,
            abonos:           [],
          });
        }
        const g = grouped.get(a.reservationId)!;
        g.abonos.push(a);
        g.paid += a.amount;
        // Actualizar estado si el abono más reciente lo tiene
        if (a.reservationStatus) g.reservationStatus = a.reservationStatus;
      });

      // Calculate pending for each group
      grouped.forEach(g => {
        g.pending = g.reservationTotal - g.paid;
        if (g.pending < 0) g.pending = 0;
      });

      setGroups(Array.from(grouped.values()));
    } catch {
      showNotification('Error cargando abonos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAbonos(); }, [user]);

  const handleDownloadAbono = async (abonoId: string) => {
    showNotification('Descargando comprobante...');
    try {
      const token    = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/abonos/${abonoId}/download/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error');
      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `abono-${abonoId}.pdf`;
      a.click(); URL.revokeObjectURL(url);
      showNotification('Comprobante descargado.');
    } catch {
      showNotification('Error al descargar comprobante.', 'error');
    }
  };

  const filteredGroups = groups.filter(g =>
    g.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.reservationId.includes(searchTerm)
  );

  const totalPages   = Math.ceil(filteredGroups.length / itemsPerPage);
  const currentItems = filteredGroups.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">

      {/* Toast */}
      {notification && createPortal(
        <div className="fixed top-6 right-6 z-[200] animate-fade-in-up">
          <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md min-w-[320px] bg-white/95 ${notification.type === 'success' ? 'border-emerald-100' : 'border-red-100'}`}>
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-800 tracking-wide uppercase">
            {isClient ? 'Mis Abonos' : 'Historial de Abonos'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {isClient ? 'Consulta tus pagos y descarga comprobantes.' : 'Registro de todos los abonos realizados por reserva.'}
          </p>
        </div>

        {/* Botón solo visible para ADMIN/EMPLEADO */}
        {!isClient && (
  <button
    onClick={() => setIsRegisterOpen(true)}
    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-sm"
  >
    <Plus size={14} /> Registrar Abono
  </button>
)}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-8 pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por cliente o reserva..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-full py-3 pl-11 pr-6 text-slate-600 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400">Cargando abonos...</div>
        ) : filteredGroups.length === 0 ? (
          <div className="py-20 text-center text-slate-400">No se encontraron abonos registrados.</div>
        ) : (
          <div className="flex flex-col">
            <div className="overflow-x-auto p-8 pt-4 pb-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Reserva</th>
                    <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                    <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                    <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total</th>
                    <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pagado</th>
                    <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pendiente</th>
                    <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Abonos</th>
                    <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Ver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {currentItems.map(group => {
                    const isExpanded  = expandedId === group.reservationId;
                    const isPaid      = group.pending <= 0.01;
                    const statusDisplay = getReservationStatusDisplay(group.reservationStatus, group.pending);

                    return (
                      <React.Fragment key={group.reservationId}>
                        <tr
                          onClick={() => setExpandedId(isExpanded ? null : group.reservationId)}
                          className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50/80' : ''}`}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronUp size={14} className="text-primary-600" /> : <ChevronDown size={14} className="text-slate-400" />}
                              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">#{group.reservationId}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-bold text-slate-800 text-sm flex items-center gap-1">
                              <User size={12} className="text-slate-400" /> {group.clientName}
                            </p>
                          </td>
                          {/* Estado de la reserva */}
                          <td className="py-4 px-4">
                            <span className={`inline-block px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${statusDisplay.className}`}>
                              {statusDisplay.label}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm font-bold text-slate-700">${group.reservationTotal.toLocaleString('es-CO')}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm font-bold text-emerald-600">${group.paid.toLocaleString('es-CO')}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`text-sm font-bold ${isPaid ? 'text-slate-400' : 'text-red-500'}`}>
                              ${group.pending.toLocaleString('es-CO')}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
                              {group.abonos.length}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-xs font-bold text-primary-600 underline underline-offset-2">
                              {isExpanded ? 'Ocultar' : 'Ver Abonos'}
                            </span>
                          </td>
                        </tr>

                        {/* Expanded abonos */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="bg-slate-50/50 px-6 py-4">
                              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="grid grid-cols-5 bg-slate-50 px-6 py-3 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  <span>Tipo</span>
                                  <span>Fecha</span>
                                  <span>Método</span>
                                  <span>Monto</span>
                                  <span className="text-center">Acciones</span>
                                </div>
                                <div className="divide-y divide-slate-50">
                                  {group.abonos.map((abono, idx) => (
                                    <div key={abono.id} className="grid grid-cols-5 px-6 py-4 items-center hover:bg-slate-50/30">
                                      <span className="text-xs font-bold text-slate-600">
                                        {idx === 0 ? '1er Abono' : '2do Abono'}
                                      </span>
                                      <span className="text-xs text-slate-500 flex items-center gap-1">
                                        <Calendar size={11} className="text-slate-400" />
                                        {new Date(abono.date).toLocaleDateString('es-CO')}
                                      </span>
                                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                        <CreditCard size={11} className="text-slate-400" />
                                        {metodoPagoLabel[abono.method] ?? abono.method}
                                      </span>
                                      <span className="text-sm font-bold text-emerald-600">${abono.amount.toLocaleString('es-CO')}</span>
                                      <div className="flex items-center justify-center gap-2">
                                        <button
                                          onClick={e => { e.stopPropagation(); setSelectedAbono(abono); setIsDetailOpen(true); }}
                                          title="Ver detalle"
                                          className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 flex items-center justify-center transition-all"
                                        >
                                          <Eye size={14} />
                                        </button>
                                        <button
                                          onClick={e => { e.stopPropagation(); handleDownloadAbono(abono.id); }}
                                          title="Descargar PDF"
                                          className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all"
                                        >
                                          <Download size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredGroups.length}
              itemsPerPage={itemsPerPage}
            />
          </div>
        )}
      </div>

      <AbonoDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        abono={selectedAbono}
        onDownload={handleDownloadAbono}
      />

      <RegisterAbonoModal
  isOpen={isRegisterOpen}
  onClose={() => setIsRegisterOpen(false)}
  onSuccess={() => { showNotification('Abono registrado exitosamente.'); fetchAbonos(); }}
  showNotification={showNotification}  // ← agregar esto
/>
    </div>
  );
};
