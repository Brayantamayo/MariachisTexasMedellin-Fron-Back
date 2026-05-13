
// ─── AbonoCreateModal.tsx ─────────────────────────────────────────────────────
// (usado desde VentasPage)
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Receipt, AlertCircle, DollarSign, CreditCard, ChevronDown, Calendar } from 'lucide-react';
import api from '@/shared/api/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialReservationId?: string;
}

interface ReservaOption {
  id: string;
  clientName: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
}

interface AbonoFormErrors {
  reservaId?: string;
  amount?: string;
  date?: string;
  method?: string;
}

const EMPTY_ERRORS: AbonoFormErrors = {};

const metodoPagoOptions = [
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'EFECTIVO', label: 'Efectivo' },
  { value: 'NEQUI', label: 'Nequi' },
  { value: 'DAVIPLATA', label: 'Daviplata' },
  { value: 'OTRO', label: 'Otro' },
];

type TipoPago = '50%' | '100%';

const getTodayLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AbonoCreateModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialReservationId }) => {
  const [reservations, setReservations] = useState<ReservaOption[]>([]);
  const [selectedReserva, setSelectedReserva] = useState<ReservaOption | null>(null);
  const [tipoPago, setTipoPago] = useState<TipoPago>('50%');
  const [method, setMethod] = useState('TRANSFERENCIA');
  const [date, setDate] = useState(getTodayLocalDate());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<AbonoFormErrors>(EMPTY_ERRORS);
  const [reservaId, setReservaId] = useState('');
  const [loadingReservas, setLoadingReservas] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setErrors(EMPTY_ERRORS);
    setMethod('TRANSFERENCIA');
    setDate(getTodayLocalDate());
    setNotes('');
    setSaving(false);
    setSelectedReserva(null);
    setTipoPago('50%');

    setLoadingReservas(true);
    api.get('/reservas')
      .then(({ data }) => {
        const pending: ReservaOption[] = (data as any[])
          .filter(r => r.status === 'PENDIENTE')
          .map(r => ({
            id: String(r.id),
            clientName: r.clientName ?? '',
            totalAmount: Number(r.totalAmount ?? 0),
            paidAmount: Number(r.paidAmount ?? 0),
            status: r.status,
          }));
        setReservations(pending);

        if (initialReservationId) {
          const found = pending.find(r => r.id === String(initialReservationId));
          if (found) {
            setSelectedReserva(found);
            setReservaId(found.id);
          } else {
            setReservaId(String(initialReservationId));
          }
        } else {
          setReservaId('');
        }
      })
      .catch(() => setError('Error cargando reservas. Por favor recarga la página.'))
      .finally(() => setLoadingReservas(false));
  }, [isOpen, initialReservationId]);

  const handleReservaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const found = reservations.find(r => r.id === id) ?? null;
    setReservaId(id);
    setSelectedReserva(found);
    setTipoPago('50%');
    // Limpiar errores relacionados
    if (errors.reservaId) setErrors(prev => ({ ...prev, reservaId: undefined }));
    if (error) setError(null);
  };

  const handleFieldChange = (field: keyof AbonoFormErrors) => {
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    if (error) setError(null);
  };

  const totalValor = selectedReserva ? selectedReserva.totalAmount : 0;
  const pagado = selectedReserva ? selectedReserva.paidAmount : 0;
  const saldo = totalValor - pagado;
  const anticipo50 = Math.ceil(totalValor / 2);
  const montoRequerido = tipoPago === '100%' ? saldo : anticipo50;
  const saldoTrasPago = Math.max(0, saldo - montoRequerido);
  const hayPendiente = saldo > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = getTodayLocalDate();

    // Validación por campo
    const newErrors: AbonoFormErrors = {};
    if (!reservaId)
      newErrors.reservaId = 'Selecciona una reserva.';
    if (!selectedReserva)
      newErrors.reservaId = 'Reserva no encontrada.';
    if (montoRequerido <= 0)
      newErrors.amount = 'Esta reserva no tiene saldo pendiente.';
    if (!date)
      newErrors.date = 'La fecha es requerida.';
    else if (date > today)
      newErrors.date = 'La fecha del abono no puede ser posterior a hoy.';
    if (!method)
      newErrors.method = 'El método de pago es requerido.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // NO cierra el modal
    }

    setErrors(EMPTY_ERRORS);
    setError(null);
    setSaving(true);

    try {
      await onSave({
        reservationId: reservaId,
        amount: montoRequerido,
        date,
        method,
        notes: notes.trim() || undefined,
      });
      // Solo cierra si fue exitoso (el padre llama onClose)
    } catch (err: any) {
      // Error del backend — NO cerramos el modal, datos intactos
      const backendMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Error al registrar el abono.';
      setError(backendMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up max-h-[90vh] overflow-y-auto">

        <div className="bg-[#dc2626] px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Receipt size={18} />
            <h3 className="text-xs font-bold tracking-widest uppercase">Registrar Abono</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 p-1 rounded-full transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3">

          {/* ✅ Error global del backend */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {/* Reserva */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Reserva <span className="text-red-500">*</span>
            </label>
            {loadingReservas ? (
              <div className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-400 bg-slate-50">
                Cargando reservas...
              </div>
            ) : (
              <div className="relative">
                <select
                  value={reservaId}
                  onChange={handleReservaChange}
                  disabled={!!initialReservationId && !!selectedReserva}
                  className={`w-full px-3 py-2 pr-8 rounded-lg border text-xs text-slate-700 outline-none appearance-none transition-all ${errors.reservaId
                      ? 'border-red-400 bg-red-50 ring-2 ring-red-100 focus:border-red-500'
                      : !!initialReservationId && !!selectedReserva
                        ? 'bg-slate-50 border-slate-200 opacity-80 cursor-not-allowed'
                        : 'bg-white border-slate-200 cursor-pointer focus:border-red-400'
                    }`}
                >
                  <option value="">-- Seleccionar --</option>
                  {reservations.map(r => (
                    <option key={r.id} value={r.id}>
                      #{r.id} — {r.clientName}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}
            {errors.reservaId && (
              <p className="text-red-500 text-[10px] mt-0.5 flex items-center gap-1">
                <AlertCircle size={10} /> {errors.reservaId}
              </p>
            )}
          </div>

          {/* Selector tipo de pago */}
          {selectedReserva && hayPendiente && (
            <div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setTipoPago('50%')}
                  className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${tipoPago === '50%'
                      ? 'bg-red-600 text-white border-red-600 shadow-md'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-red-300'
                    }`}
                >
                  1er Abono
                  <span className="block text-[9px] font-normal opacity-80">
                    ${anticipo50.toLocaleString('es-CO')}
                  </span>
                </button>
                <button type="button" onClick={() => setTipoPago('100%')}
                  className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${tipoPago === '100%'
                      ? 'bg-red-600 text-white border-red-600 shadow-md'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-red-300'
                    }`}
                >
                  2do Abono (Saldo)
                  <span className="block text-[9px] font-normal opacity-80">
                    ${saldo.toLocaleString('es-CO')}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Resumen del monto */}
          {selectedReserva && montoRequerido > 0 && (
            <div className="bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200 rounded-xl p-3">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-[9px] font-bold text-red-800 uppercase tracking-widest">
                  {tipoPago === '100%' ? '2do Abono (Saldo)' : '1er Abono'}
                </p>
                <DollarSign size={14} className="text-red-500" />
              </div>
              <p className="text-2xl font-serif font-black text-red-800 leading-none">
                ${montoRequerido.toLocaleString('es-CO')}
              </p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-red-200/60 text-[9px] text-red-600">
                <span>Total: <strong>${totalValor.toLocaleString('es-CO')}</strong></span>
                <span>
                  {tipoPago === '100%'
                    ? <strong className="text-emerald-600">Saldo: $0 ✓</strong>
                    : <>Saldo: <strong>${saldoTrasPago.toLocaleString('es-CO')}</strong></>
                  }
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Método de pago */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Método <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <CreditCard size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={method}
                  onChange={e => { setMethod(e.target.value); handleFieldChange('method'); }}
                  className={`w-full pl-8 pr-6 py-2 rounded-lg border text-xs text-slate-700 outline-none appearance-none bg-white transition-all ${errors.method
                      ? 'border-red-400 bg-red-50'
                      : 'border-slate-200 focus:border-red-400'
                    }`}
                >
                  {metodoPagoOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Fecha <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  max={getTodayLocalDate()}
                  onChange={e => { setDate(e.target.value); handleFieldChange('date'); }}
                  className={`w-full pl-8 pr-2 py-2 rounded-lg border text-xs text-slate-700 outline-none transition-all ${errors.date
                      ? 'border-red-400 bg-red-50'
                      : 'border-slate-200 focus:border-red-400'
                    }`}
                />
              </div>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={1}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 outline-none focus:border-red-400 resize-none"
              placeholder="Referencia..."
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={saving}
              className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50">
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !selectedReserva || montoRequerido <= 0 || loadingReservas}
              className="flex-[2] py-3 bg-[#dc2626] hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-md transition-all"
            >
              {saving
                ? 'Registrando...'
                : selectedReserva && montoRequerido > 0
                  ? `Registrar $${montoRequerido.toLocaleString('es-CO')}`
                  : 'Registrar Abono'
              }
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

