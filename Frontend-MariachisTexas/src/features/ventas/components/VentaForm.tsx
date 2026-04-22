
import React from 'react';
import { DollarSign, User, FileText, CreditCard, ChevronDown, Bookmark, Briefcase, Lock, CheckCircle } from 'lucide-react';
import { Reservation } from '@/types';
import { CustomDatePicker } from '@/shared/components/CustomDatePicker';

interface Props {
  formData: any;
  saleType: 'Por Reserva' | 'Directa';
  reservations: Reservation[];
  selectedReserva: Reservation | null;
  onSaleTypeChange: (type: 'Por Reserva' | 'Directa') => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onDateChange: (name: string, value: string) => void;
  onReservationChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const VentaForm: React.FC<Props> = ({ 
    formData, 
    saleType, 
    reservations, 
    selectedReserva, 
    onSaleTypeChange, 
    onChange, 
    onDateChange,
    onReservationChange, 
    onSubmit 
}) => {
  
  // Cálculos visuales para el resumen
  const saldoPendiente = selectedReserva ? (selectedReserva.totalAmount - selectedReserva.paidAmount) : 0;
  const totalReserva = selectedReserva ? selectedReserva.totalAmount : 0;

  return (
    <form id="venta-form" onSubmit={onSubmit} className="space-y-4">
        
        {/* Pestañas de Tipo de Venta */}
        <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
            <button
                type="button"
                onClick={() => onSaleTypeChange('Por Reserva')}
                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${saleType === 'Por Reserva' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                Por Reserva
            </button>
            <button
                type="button"
                onClick={() => onSaleTypeChange('Directa')}
                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${saleType === 'Directa' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                Venta Directa
            </button>
        </div>

        {/* Lógica Condicional: Reserva vs Directa */}
        {saleType === 'Por Reserva' ? (
            <div className="space-y-3 animate-fade-in-up">
                {/* Selector de Reserva */}
                <div>
                    <label className="label-form">Vincular Reserva <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <Bookmark className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <select 
                            name="reservationId"
                            required 
                            value={formData.reservationId} 
                            onChange={onReservationChange}
                            className="input-form pl-9 appearance-none cursor-pointer font-bold text-slate-700 text-xs"
                        >
                            <option value="">-- Seleccionar Reserva --</option>
                            {reservations.map(r => (
                                <option key={r.id} value={r.id}>#{r.id} - {r.clientName} ({r.eventType})</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                </div>

                {/* Resumen Financiero Compacto */}
                {selectedReserva && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex justify-between items-center text-[10px]">
                        <div>
                            <span className="text-slate-500 block uppercase tracking-wide">Total Reserva</span>
                            <span className="font-bold text-slate-700 text-sm">${totalReserva.toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-slate-500 block uppercase tracking-wide">Saldo Pendiente</span>
                            <span className="font-bold text-red-500 text-sm">${saldoPendiente.toLocaleString()}</span>
                        </div>
                    </div>
                )}
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-3 animate-fade-in-up">
                {/* Campos Venta Directa Compactos */}
                <div className="col-span-2">
                    <label className="label-form">Cliente (Exclusivo) <span className="text-red-500">*</span></label>
                    <div className="relative group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                            type="text" 
                            name="clientName"
                            required 
                            readOnly // Solo lectura para asegurar exclusividad
                            value={formData.clientName} 
                            onChange={onChange}
                            className="input-form pl-9 pr-8 bg-slate-50 text-slate-500 cursor-not-allowed font-bold" 
                            placeholder="Cliente General" 
                        />
                        {/* Candado para indicar que es fijo */}
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <Lock size={12} />
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="h-px bg-slate-100 my-2"></div>

        {/* Grid de Pago */}
        <div className="grid grid-cols-2 gap-3">
            
            {/* Monto */}
            <div className="col-span-2 sm:col-span-1">
                <label className="label-form">Monto Pagado <span className="text-red-500">*</span></label>
                <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                        type="number" 
                        name="amount"
                        required 
                        min="1"
                        max={saleType === 'Por Reserva' ? saldoPendiente : undefined}
                        value={formData.amount} 
                        onChange={onChange}
                        className={`input-form pl-9 font-bold text-sm transition-all duration-300 ${
                            saleType === 'Por Reserva' && Number(formData.amount) === saldoPendiente && saldoPendiente > 0
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100' 
                            : 'text-slate-700'
                        }`}
                        placeholder="0" 
                    />
                    {saleType === 'Por Reserva' && Number(formData.amount) === saldoPendiente && saldoPendiente > 0 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-bounce">
                            <CheckCircle className="text-emerald-500" size={16} />
                        </div>
                    )}
                </div>
                {saleType === 'Por Reserva' && Number(formData.amount) === saldoPendiente && saldoPendiente > 0 && (
                    <p className="text-[9px] text-emerald-600 font-bold mt-1 animate-pulse uppercase tracking-wider">
                        ✨ ¡Saldando deuda total! La reserva pasará a Finalizada.
                    </p>
                )}
            </div>

            {/* Fecha */}
            <div className="col-span-2 sm:col-span-1">
                <CustomDatePicker 
                    name="date"
                    label="Fecha Venta"
                    value={formData.date}
                    onChange={onDateChange}
                    required
                />
            </div>

            {/* Método */}
            <div className="col-span-2">
                <label className="label-form">Método de Pago</label>
                <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <select 
                        name="method"
                        value={formData.method} 
                        onChange={onChange}
                        className="input-form pl-9 appearance-none cursor-pointer text-xs text-slate-700"
                    >
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="TRANSFERENCIA">Transferencia</option>
                        <option value="NEQUI">Nequi</option>
                        <option value="DAVIPLATA">Daviplata</option>
                        <option value="OTRO">Otro</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                </div>
            </div>
        </div>

        <style>{`
        .label-form {
            display: block;
            font-size: 9px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 2px;
            padding-left: 2px;
        }
        .input-form {
            width: 100%;
            padding: 8px 10px;
            border-radius: 8px;
            background-color: white;
            border: 1px solid #e2e8f0;
            color: #334155;
            font-size: 12px;
            outline: none;
            transition: all 0.2s;
        }
        .input-form.pl-9 { padding-left: 32px; }
        .input-form:focus {
            border-color: #cbd5e1;
            box-shadow: 0 0 0 2px rgba(226, 232, 240, 0.5);
        }
      `}</style>
    </form>
  );
};
