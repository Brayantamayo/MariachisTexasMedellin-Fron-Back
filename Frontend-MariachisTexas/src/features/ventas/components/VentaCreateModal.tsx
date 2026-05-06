// ─── VentaCreateModal.tsx ─────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, DollarSign, AlertCircle } from 'lucide-react';

const CLIENTE_DIRECTO = { id: 1, usuarioId: 5, nombre: 'Cliente Directa' } as const;

const METODOS = [
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'EFECTIVO',      label: 'Efectivo'      },
  { value: 'NEQUI',         label: 'Nequi'         },
  { value: 'DAVIPLATA',     label: 'Daviplata'     },
  { value: 'OTRO',          label: 'Otro'          },
];

interface VentaFormErrors {
  amount?:  string;
  concept?: string;
  date?:    string;
  method?:  string;
}

const EMPTY_ERRORS: VentaFormErrors = {};

const validate = (data: any): VentaFormErrors => {
  const errors: VentaFormErrors = {};

  if (!data.concept?.trim())
    errors.concept = 'El concepto es requerido.';

  if (!data.amount || Number(data.amount) <= 0)
    errors.amount = 'El monto debe ser mayor a $0.';

  if (!data.date)
    errors.date = 'La fecha es requerida.';

  if (!data.method)
    errors.method = 'El método de pago es requerido.';

  return errors;
};

interface Props {
  isOpen:  boolean;
  onClose: () => void;
  onSave:  (data: any) => Promise<void>;
}

const initialForm = () => ({
  clienteId:   String(CLIENTE_DIRECTO.id),
  clientName:  CLIENTE_DIRECTO.nombre,
  concept:     'Venta Directa',
  date:        new Date().toISOString().split('T')[0],
  method:      'TRANSFERENCIA',
  amount:      '',
  totalAmount: '',
  paidAmount:  '',
});

export const VentaCreateModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState(initialForm());
  const [errors,   setErrors]   = useState<VentaFormErrors>(EMPTY_ERRORS);
  const [error,    setError]    = useState<string | null>(null);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setFormData(initialForm());
    setErrors(EMPTY_ERRORS);
    setError(null);
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error del campo al escribir
    if (errors[name as keyof VentaFormErrors])
      setErrors(prev => ({ ...prev, [name]: undefined }));
    // Limpiar error global al escribir
    if (error) setError(null);
  };

  const handleClose = () => {
    setFormData(initialForm());
    setErrors(EMPTY_ERRORS);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación por campo
    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return; // NO cierra el modal
    }

    setErrors(EMPTY_ERRORS);
    setError(null);
    setSaving(true);

    try {
      await onSave({
        ...formData,
        clienteId:   Number(formData.clienteId),
        amount:      Number(formData.amount),
        totalAmount: Number(formData.amount),
        paidAmount:  Number(formData.amount),
        type:        'Directa',
      });
      // Solo cierra si fue exitoso
    } catch (err: any) {
      // Error del backend — NO cerramos el modal, datos intactos
      const backendMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Error al guardar la venta.';
      setError(backendMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col animate-fade-in-up overflow-hidden max-h-[90vh]">

        {/* Header */}
        <div className="bg-red-600 px-5 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2">
            <DollarSign size={18} strokeWidth={2.5} />
            <h3 className="text-xs font-bold tracking-widest uppercase">Registrar Venta</h3>
          </div>
          <button onClick={handleClose} className="text-white/80 hover:text-white bg-white/10 p-1 rounded-full">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 pb-4">

          {/* ✅ Error global del backend */}
          {error && (
            <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Cliente fijo */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Cliente</label>
              <div className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-500 bg-slate-50 flex items-center justify-between">
                <span>{CLIENTE_DIRECTO.nombre}</span>
                <span className="text-[10px] text-slate-400 font-mono">ID {CLIENTE_DIRECTO.id}</span>
              </div>
            </div>

            {/* Concepto */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Concepto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="concept"
                value={formData.concept}
                onChange={handleChange}
                placeholder="Ej: Serenata evento"
                className={`w-full px-3 py-2 rounded-lg border text-sm text-slate-700 outline-none transition-all ${
                  errors.concept
                    ? 'border-red-400 bg-red-50 focus:border-red-500 ring-2 ring-red-100'
                    : 'border-slate-200 focus:border-red-400'
                }`}
              />
              {errors.concept && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.concept}
                </p>
              )}
            </div>

            {/* Monto */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Monto Total <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="500000"
                min="1000"
                step="1000"
                className={`w-full px-3 py-2 rounded-lg border text-sm text-slate-700 outline-none transition-all ${
                  errors.amount
                    ? 'border-red-400 bg-red-50 focus:border-red-500 ring-2 ring-red-100'
                    : 'border-slate-200 focus:border-red-400'
                }`}
              />
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.amount}
                </p>
              )}
            </div>

            {/* Fecha y Método */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Fecha <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-lg border text-sm text-slate-700 outline-none transition-all ${
                    errors.date
                      ? 'border-red-400 bg-red-50 focus:border-red-500 ring-2 ring-red-100'
                      : 'border-slate-200 focus:border-red-400'
                  }`}
                />
                {errors.date && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.date}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Método Pago <span className="text-red-500">*</span>
                </label>
                <select
                  name="method"
                  value={formData.method}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-lg border text-sm text-slate-700 outline-none transition-all ${
                    errors.method
                      ? 'border-red-400 bg-red-50 focus:border-red-500 ring-2 ring-red-100'
                      : 'border-slate-200 focus:border-red-400'
                  }`}
                >
                  {METODOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                {errors.method && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.method}
                  </p>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
          <button onClick={handleClose} disabled={saving}
            className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest px-3 py-2 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold tracking-widest uppercase shadow-md transition-all hover:-translate-y-0.5 flex items-center gap-2"
          >
            {saving
              ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
              : <><Check size={14} strokeWidth={3} /> Guardar Venta</>
            }
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};