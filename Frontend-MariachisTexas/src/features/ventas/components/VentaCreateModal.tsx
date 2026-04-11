import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, DollarSign, AlertCircle } from 'lucide-react';
import { ventaService } from '../services/ventaService';

// ─── Cliente fijo para ventas directas (ID 28 en BD) ─────────────────────────
const CLIENTE_DIRECTO = { id: 22, usuarioId: 28, nombre: 'Cliente Directa' } as const

const METODOS = [
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'EFECTIVO',      label: 'Efectivo'      },
  { value: 'TARJETA',       label: 'Tarjeta'       },
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
  reservationId: '',
  clienteId:     '',
  clientName:    '',
  concept:       '',
  date:          new Date().toISOString().split('T')[0],
  method:        'TRANSFERENCIA',
  amount:        '',
  totalAmount:   '',   // ← NUEVO
  paidAmount:    '',   // ← NUEVO
})

export const VentaCreateModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [saleType,       setSaleType]       = useState<'Por Reserva' | 'Directa'>('Por Reserva')
  const [reservations,   setReservations]   = useState<any[]>([])
  const [selectedReserva,setSelectedReserva]= useState<any | null>(null)
  const [formData,       setFormData]       = useState(initialForm())
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setFormData(initialForm())
    setSaleType('Por Reserva')
    setSelectedReserva(null)
    setError(null)
    ventaService.getPayableReservations().then(setReservations).catch(() => setReservations([]))
  }, [isOpen])

  // ─── Cambiar pestaña ───────────────────────────────────────────────────────
  const handleTypeChange = (type: 'Por Reserva' | 'Directa') => {
    setSaleType(type)
    setError(null)
    setSelectedReserva(null)

    if (type === 'Directa') {
      setFormData(prev => ({
        ...prev,
        clienteId:     String(CLIENTE_DIRECTO.id),
        clientName:    CLIENTE_DIRECTO.nombre,
        reservationId: '',
        amount:        '',
        concept:       'Venta Directa',
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        clienteId:  '',
        clientName: '',
        amount:     '',
        concept:    '',
      }))
    }
  }

  // ─── Seleccionar reserva ───────────────────────────────────────────────────
  const handleReservationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const id    = e.target.value
  const found = reservations.find(r => String(r.id) === id) ?? null
  setSelectedReserva(found)
  setFormData(prev => ({
    ...prev,
    reservationId: id,
    clienteId:     found ? String(found.clientId)          : '',
    clientName:    found ? found.clientName                : '',
    amount:        found ? String(found.pendingAmount ?? '') : '',  // saldo pendiente (para mostrar)
    totalAmount:   found ? String(found.totalAmount ?? '')  : '',  // ← NUEVO: total real
    paidAmount:    found ? String(found.paidAmount ?? '')   : '',  // ← NUEVO: abonado real
    concept:       found ? `Pago a Reserva #${found.id}`    : '',
  }))
}

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // ─── Submit ────────────────────────────────────────────────────────────────
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError(null)
 
  if (saleType === 'Por Reserva' && !formData.reservationId) {
    setError('Selecciona una reserva antes de continuar.')
    return
  }
  if (!formData.amount || Number(formData.amount) <= 0) {
    setError('El monto debe ser mayor a $0.')
    return
  }
  if (!formData.clienteId) {
    setError('No se encontró el cliente. Recarga la página.')
    return
  }
 
  setSaving(true)
  try {
    await onSave({
      ...formData,
      clienteId:   Number(formData.clienteId),
      amount:      Number(formData.amount),
      totalAmount: formData.totalAmount ? Number(formData.totalAmount) : Number(formData.amount), // ← NUEVO
      paidAmount:  formData.paidAmount  ? Number(formData.paidAmount)  : Number(formData.amount), // ← NUEVO
      type:        saleType === 'Directa' ? 'Directa' : 'Por Reserva',
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

        {/* Tabs */}
        <div className="px-5 pt-4 flex gap-2 border-b border-slate-200 shrink-0">
          {(['Por Reserva', 'Directa'] as const).map(t => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`px-4 py-2 text-[11px] font-bold tracking-widest uppercase border-b-2 transition-all ${
                saleType === t
                  ? 'text-slate-900 border-red-600'
                  : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 pb-4">

          {/* Error banner */}
          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-xs">
              <AlertCircle size={14} className="shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {saleType === 'Por Reserva' ? (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Vincular Reserva *
                  </label>
                  <select
                    value={formData.reservationId}
                    onChange={handleReservationChange}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 outline-none focus:border-red-400"
                    required
                  >
                    <option value="">-- Selecciona una reserva --</option>
                    {reservations.map(r => (
                      <option key={r.id} value={String(r.id)}>
                        #{r.id} — {r.clientName} — ${Number(r.pendingAmount ?? 0).toLocaleString('es-CO')} pendiente
                      </option>
                    ))}
                  </select>
                </div>

                {selectedReserva && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Cliente</label>
                      <input
                        value={formData.clientName}
                        disabled
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-500 bg-slate-50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total reserva</label>
                        <input
                          value={`$${Number(selectedReserva.totalAmount ?? 0).toLocaleString('es-CO')}`}
                          disabled
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-500 bg-slate-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-red-600 uppercase tracking-widest mb-2">Saldo pendiente</label>
                        <input
                          value={`$${Number(selectedReserva.pendingAmount ?? 0).toLocaleString('es-CO')}`}
                          disabled
                          className="w-full px-3 py-2 rounded-lg border border-red-200 text-sm font-bold text-red-700 bg-red-50"
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {/* Cliente fijo — solo visual */}
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
              </>
            )}

            {/* Fecha y método — comunes a ambos tipos */}
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
          <button
            onClick={onClose}
            className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest px-3 py-2 transition-colors"
          >
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