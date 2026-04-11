import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Receipt, AlertCircle, DollarSign, CreditCard, ChevronDown, Calendar } from 'lucide-react';
import api from '@/shared/api/api';

interface Props {
  isOpen:                boolean;
  onClose:               () => void;
  onSave:                (data: any) => Promise<void>;
  initialReservationId?: string;
}

interface ReservaOption {
  id:          string;
  clientName:  string;
  totalAmount: number;
  paidAmount:  number;
  status:      string;
}

const metodoPagoOptions = [
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'EFECTIVO',      label: 'Efectivo' },
  { value: 'NEQUI',         label: 'Nequi' },
  { value: 'DAVIPLATA',     label: 'Daviplata' },
  { value: 'OTRO',          label: 'Otro' },
];

export const AbonoCreateModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialReservationId }) => {
  const [reservations,    setReservations]    = useState<ReservaOption[]>([]);
  const [selectedReserva, setSelectedReserva] = useState<ReservaOption | null>(null);
  const [method,          setMethod]          = useState('TRANSFERENCIA');
  const [date,            setDate]            = useState(new Date().toISOString().split('T')[0]);
  const [notes,           setNotes]           = useState('');
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [reservaId,       setReservaId]       = useState('');
  const [loadingReservas, setLoadingReservas] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setMethod('TRANSFERENCIA');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setSaving(false);
    setSelectedReserva(null);

    setLoadingReservas(true);
    api.get('/reservas')
      .then(({ data }) => {
        const pending: ReservaOption[] = (data as any[])
          .filter(r => r.status === 'PENDIENTE')
          .map(r => ({
            id:          String(r.id),
            clientName:  r.clientName ?? '',
            totalAmount: Number(r.totalAmount ?? 0),
            paidAmount:  Number(r.paidAmount ?? 0),
            status:      r.status,
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
      .catch(() => setError('Error cargando reservas.'))
      .finally(() => setLoadingReservas(false));
  }, [isOpen, initialReservationId]);

  const handleReservaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id    = e.target.value;
    const found = reservations.find(r => r.id === id) ?? null;
    setReservaId(id);
    setSelectedReserva(found);
    setError(null);
  };

  const totalValor     = selectedReserva ? selectedReserva.totalAmount : 0;
  const pagado         = selectedReserva ? selectedReserva.paidAmount  : 0;
  const saldo          = totalValor - pagado;
  const anticipo50     = Math.ceil(totalValor / 2);
  const montoRequerido = saldo > 0 ? anticipo50 : 0;
  const saldoTrasPago  = Math.max(0, saldo - montoRequerido);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservaId)        { setError('Selecciona una reserva'); return; }
    if (!selectedReserva)  { setError('Reserva no encontrada'); return; }
    if (montoRequerido <= 0) { setError('Esta reserva no tiene saldo pendiente'); return; }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        reservationId: reservaId,
        amount:        montoRequerido,
        date,
        method,
        notes: notes.trim() || undefined,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Error al registrar el abono';
      setError(msg);
      setSaving(false);
    }
  };

  if (!isOpen) return null;


  ////formulario en reserva 
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up max-h-[90vh] overflow-y-auto">

        <div className="bg-[#dc2626] px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Receipt size={18} />
            <h3 className="text-xs font-bold tracking-widest uppercase">Registrar Anticipo (50%)</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 p-1 rounded-full transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-xs">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Reserva <span className="text-red-500">*</span>
            </label>
            {loadingReservas ? (
              <div className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-400 bg-slate-50">
                Cargando reservas...
              </div>
            ) : (
              <div className="relative">
                <select
                  value={reservaId}
                  onChange={handleReservaChange}
                  disabled={!!initialReservationId && !!selectedReserva}
                  className={`w-full px-3 py-2.5 pr-8 rounded-lg border text-sm text-slate-700 outline-none focus:border-red-400 appearance-none transition-colors
                    ${!!initialReservationId && !!selectedReserva ? 'bg-slate-50 border-slate-200 opacity-80 cursor-not-allowed' : 'bg-white border-slate-200 cursor-pointer'}`}
                >
                  <option value="">-- Seleccionar Reserva Pendiente --</option>
                  {reservations.map(r => (
                    <option key={r.id} value={r.id}>
                      #{r.id} — {r.clientName} (${r.totalAmount.toLocaleString('es-CO')})
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}
            {!loadingReservas && reservations.length === 0 && (
              <p className="text-[10px] text-amber-600 mt-1">No hay reservas pendientes de anticipo.</p>
            )}
          </div>

          {selectedReserva && montoRequerido > 0 && (
            <div className="bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold text-red-800 uppercase tracking-widest">Anticipo Requerido (50%)</p>
                <DollarSign size={16} className="text-red-500" />
              </div>
              <p className="text-3xl font-serif font-black text-red-800">
                ${montoRequerido.toLocaleString('es-CO')}
              </p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-red-200/60 text-[10px] text-red-600">
                <span>Total: <strong>${totalValor.toLocaleString('es-CO')}</strong></span>
                <span>Saldo restante: <strong>${saldoTrasPago.toLocaleString('es-CO')}</strong></span>
              </div>
              <p className="text-[10px] text-red-400 mt-2 italic">* El anticipo es exactamente el 50% del total</p>
            </div>
          )}

          {selectedReserva && montoRequerido <= 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              Esta reserva ya tiene el anticipo pagado.
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Método de Pago</label>
            <div className="relative">
              <CreditCard size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 outline-none focus:border-red-400 appearance-none bg-white cursor-pointer"
              >
                {metodoPagoOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fecha de Pago</label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 outline-none focus:border-red-400 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 outline-none focus:border-red-400 resize-none"
              placeholder="Referencia de transferencia, banco..."
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors">
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
                  : 'Registrar Anticipo'
              }
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};