import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, DollarSign, AlertCircle } from 'lucide-react';
import { ventaService } from '../services/ventaService';

const CLIENTE_DIRECTO = { id: 22, usuarioId: 28, nombre: 'Cliente Directa' } as const

const METODOS = [
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'EFECTIVO',      label: 'Efectivo'      },
  { value: 'NEQUI',         label: 'Nequi'         },
  { value: 'DAVIPLATA',     label: 'Daviplata'     },
  { value: 'OTRO',          label: 'Otro'          },
]

interface Props {
  isOpen:  boolean
  onClose: () => void
  onSave:  (data: any) => Promise<void>
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
})

export const VentaCreateModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState(initialForm())
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setFormData(initialForm())
    setError(null)
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.amount || Number(formData.amount) <= 0) {
      setError('El monto debe ser mayor a $0.')
      return
    }

    setSaving(true)
    try {
      await onSave({
        ...formData,
        clienteId:   Number(formData.clienteId),
        amount:      Number(formData.amount),
        totalAmount: Number(formData.amount),
        paidAmount:  Number(formData.amount),
        type:        'Directa',
      })
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Error al guardar la venta.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col animate-fade-in-up overflow-hidden max-h-[90vh]">

        {/* Header */}
        <div className="bg-red-600 px-5 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2">
            <DollarSign size={18} strokeWidth={2.5} />
            <h3 className="text-xs font-bold tracking-widest uppercase">Registrar Venta</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 p-1 rounded-full">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 pb-4">

          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-xs">
              <AlertCircle size={14} className="shrink-0" /> {error}
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

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Concepto *</label>
              <input
                type="text"
                name="concept"
                value={formData.concept}
                onChange={handleChange}
                placeholder="Ej: Serenata evento"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 outline-none focus:border-red-400"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Monto Total *</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="500000"
                min="1000"
                step="1000"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 outline-none focus:border-red-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Fecha *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 outline-none focus:border-red-400"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Método Pago *</label>
                <select
                  name="method"
                  value={formData.method}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 outline-none focus:border-red-400"
                  required
                >
                  {METODOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
          <button onClick={onClose} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest px-3 py-2 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold tracking-widest uppercase shadow-md transition-all hover:-translate-y-0.5 flex items-center gap-2"
          >
            <Check size={14} strokeWidth={3} />
            {saving ? 'Guardando...' : 'Guardar Venta'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  )
}