
import React from 'react';
import { DollarSign, CreditCard, ChevronDown, AlertCircle, CheckCircle, Bookmark, FileText } from 'lucide-react';
import { Reservation } from '@/types';
import { CustomDatePicker } from '@/shared/components/CustomDatePicker';

interface Props {
  formData: any;
  reservations: Reservation[];
  selectedReserva: Reservation | null;
  calculations: {
      totalReserva: number;
      paidAmount: number;
      saldoPendienteActual: number;
      nuevoSaldo: number;
      willConfirm: boolean;
      missingForConfirmation: number;
      isConfirmed: boolean;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onDateChange: (name: string, value: string) => void;
  onReservationChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  initialReservationId?: string;
}

export const AbonoForm: React.FC<Props> = ({ 
    formData, 
    reservations, 
    selectedReserva, 
    calculations,
    onChange, 
    onDateChange,
    onReservationChange, 
    onSubmit, 
    initialReservationId 
}) => {
  
  const { 
      totalReserva, 
      paidAmount, 
      saldoPendienteActual, 
      nuevoSaldo, 
      willConfirm, 
      missingForConfirmation, 
      isConfirmed 
  } = calculations;

  const amountNumber = Number(formData.amount);

  return (
    <form id="abono-form" onSubmit={onSubmit} className="space-y-4">
        
        {/* Contexto: Selección de Reserva */}
        <div>
            <label className="label-form">Vincular Reserva <span className="text-red-500">*</span></label>
            <div className="relative">
                <Bookmark className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <select 
                    name="reservationId"
                    value={formData.reservationId}
                    onChange={onReservationChange}
                    required
                    disabled={!!initialReservationId && !!selectedReserva} 
                    className={`input-form pl-9 appearance-none cursor-pointer font-bold text-slate-700 text-xs ${initialReservationId ? 'bg-slate-100 opacity-80' : ''}`}
                >
                    <option value="">-- Seleccionar Reserva --</option>
                    {reservations.map(r => (
                        <option key={r.id} value={r.id}>
                            #{r.id} - {r.clientName} ({r.eventType})
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
        </div>

        {/* Información Financiera Compacta */}
        {selectedReserva && (
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex justify-between items-center text-[10px]">
                <div>
                    <span className="text-slate-500 block uppercase tracking-wide">Total Reserva</span>
                    <span className="font-bold text-slate-700 text-sm">${totalReserva.toLocaleString()}</span>
                </div>
                <div className="text-right">
                    <span className="text-slate-500 block uppercase tracking-wide">Saldo Pendiente</span>
                    <span className="font-bold text-red-500 text-sm">${saldoPendienteActual.toLocaleString()}</span>
                </div>
            </div>
        )}

        {/* Campos del Pago (Grid) */}
        <div className="grid grid-cols-2 gap-3">
            
            {/* Monto */}
            <div className="col-span-2 sm:col-span-1">
                <label className="label-form">Monto a Abonar <span className="text-red-500">*</span></label>
                <div className="relative">
                    <DollarSign className={`absolute left-3 top-1/2 -translate-y-1/2 ${willConfirm ? 'text-emerald-500' : 'text-slate-400'}`} size={14} />
                    <input 
                        type="number" 
                        name="amount"
                        required
                        min="1"
                        max={saldoPendienteActual}
                        value={formData.amount}
                        onChange={onChange}
                        className={`input-form pl-9 font-bold text-sm transition-all duration-300 ${
                            nuevoSaldo === 0 && amountNumber > 0 
                            ? 'text-emerald-700 border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100' 
                            : willConfirm ? 'text-emerald-600 border-emerald-300 focus:border-emerald-500 focus:ring-emerald-100' : ''
                        }`}
                        placeholder="0"
                    />
                </div>
            </div>

            {/* Fecha (Custom Date Picker) */}
            <div className="col-span-2 sm:col-span-1">
                <CustomDatePicker 
                    name="date"
                    label="Fecha Pago"
                    value={formData.date}
                    onChange={onDateChange}
                    required
                />
            </div>

            {/* Método */}
            <div className="col-span-2 sm:col-span-1">
                <label className="label-form">Método</label>
                <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <select 
                        name="method"
                        value={formData.method}
                        onChange={onChange}
                        className="input-form pl-9 appearance-none cursor-pointer text-xs text-slate-700"
                    >
                        <option value="TRANSFERENCIA">Transferencia</option>
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="NEQUI">Nequi</option>
                        <option value="DAVIPLATA">Daviplata</option>
                        <option value="OTRO">Otro</option>
                    </select>
                </div>
            </div>

            {/* Nuevo Saldo (Readonly) */}
            <div className="col-span-2 sm:col-span-1">
                <label className="label-form">Nuevo Saldo Est.</label>
                <div className="input-form bg-slate-50 text-slate-500 border-slate-200 text-xs font-medium">
                    ${nuevoSaldo.toLocaleString()}
                </div>
            </div>

            {/* Notas */}
            <div className="col-span-2">
                <label className="label-form">Notas (Opcional)</label>
                <div className="relative">
                    <FileText className="absolute left-3 top-3 text-slate-400" size={14} />
                    <textarea 
                        name="notes"
                        value={formData.notes}
                        onChange={onChange}
                        className="input-form pl-9 resize-none min-h-[50px] py-2 text-xs"
                        placeholder="Referencia, detalles..."
                    />
                </div>
            </div>
        </div>

        {/* Feedback Visual / Progreso */}
        {selectedReserva && (
            <div className="pt-1 space-y-2">
                <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    {/* Marcador de 50% */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300 z-10 flex flex-col items-center">
                        <div className="h-full w-px bg-slate-400/30"></div>
                        <span className="absolute -top-3 text-[7px] font-bold text-slate-400">50%</span>
                    </div>

                    {/* Pagado anteriormente */}
                    <div style={{ width: `${(paidAmount / totalReserva) * 100}%` }} className="absolute top-0 left-0 h-full bg-slate-300 transition-all duration-500"></div>
                    
                    {/* Nuevo abono proyectado */}
                    <div 
                        style={{ 
                            width: `${(amountNumber / totalReserva) * 100}%`, 
                            left: `${(paidAmount / totalReserva) * 100}%` 
                        }} 
                        className={`absolute top-0 h-full transition-all duration-500 ${
                            willConfirm ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-red-400'
                        }`}
                    ></div>
                </div>

                {willConfirm && (
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-2 rounded-lg text-[10px] font-bold animate-fade-in-up">
                        <CheckCircle size={12} />
                        <span>¡Abono confirma la reserva! (50%)</span>
                    </div>
                )}

                {nuevoSaldo === 0 && amountNumber > 0 && (
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-2 rounded-lg text-[10px] font-bold animate-bounce border border-emerald-200">
                        <CheckCircle size={12} />
                        <span>✨ ¡RESERVA TOTALMENTE PAGADA! ✨</span>
                    </div>
                )}
                
                {!isConfirmed && missingForConfirmation > 0 && nuevoSaldo > 0 && (
                    <div className="flex flex-col gap-1.5 bg-amber-50 p-3 rounded-xl border border-amber-100 animate-pulse">
                        <div className="flex items-center gap-2 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                            <AlertCircle size={14} />
                            <span>Estado: Pendiente de Confirmación</span>
                        </div>
                        <p className="text-[11px] text-amber-600 font-medium">
                            Se requiere un abono de <span className="font-bold text-amber-700">${missingForConfirmation.toLocaleString()}</span> para confirmar esta reserva (50% del total).
                        </p>
                        {amountNumber > 0 && !willConfirm && (
                            <div className="mt-1 pt-1 border-t border-amber-200/50 text-[10px] text-amber-500 italic">
                                Con este abono aún faltarían ${(missingForConfirmation - amountNumber).toLocaleString()} para la confirmación.
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}

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
