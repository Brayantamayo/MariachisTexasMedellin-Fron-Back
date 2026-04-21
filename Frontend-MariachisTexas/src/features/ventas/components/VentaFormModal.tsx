
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, User, FileText, Calendar, CreditCard, ChevronDown, Check } from 'lucide-react';
import { Reservation } from '@/types';
import { ventaService } from '../services/ventaService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const VentaFormModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  // Estado del formulario
  const [saleType, setSaleType] = useState<'Por Reserva' | 'Directa'>('Por Reserva');
  const [reservationId, setReservationId] = useState('');
  const [clientName, setClientName] = useState('');
  const [concept, setConcept] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('EFECTIVO');
  const [amount, setAmount] = useState('');

  // Datos auxiliares
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReserva, setSelectedReserva] = useState<Reservation | null>(null);

  useEffect(() => {
    if (isOpen) {
        // Cargar reservas disponibles
        ventaService.getPayableReservations().then(setReservations);
        
        // Reset form
        setSaleType('Por Reserva');
        setReservationId('');
        setClientName('');
        setConcept('');
        setAmount('');
        setSelectedReserva(null);
    }
  }, [isOpen]);

  const handleReservationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value;
      setReservationId(id);
      const found = reservations.find(r => r.id === id) || null;
      setSelectedReserva(found);
      
      if (found) {
          setClientName(found.clientName);
          setConcept(`Pago a Reserva #${found.id} - ${found.eventType}`);
      } else {
          setClientName('');
          setConcept('');
      }
  };

  // Cálculos de saldo
  const saldoPendiente = selectedReserva ? (selectedReserva.totalAmount - selectedReserva.paidAmount) : 0;
  const nuevoSaldo = selectedReserva ? Math.max(0, saldoPendiente - Number(amount)) : 0;

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
          type: saleType,
          reservationId: saleType === 'Por Reserva' ? reservationId : undefined,
          clientName,
          concept,
          date,
          method: String(method).toUpperCase(),
          amount
      });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col animate-fade-in-up overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#dc2626] p-6 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
                <DollarSign size={24} strokeWidth={2} />
                <div>
                    <h3 className="text-lg font-bold tracking-wide uppercase leading-none">Nueva Venta</h3>
                    <p className="text-[10px] text-white/80 mt-1 font-medium">Registrar ingreso financiero</p>
                </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full">
                <X size={20} />
            </button>
        </div>

        {/* Form Content */}
        <div className="p-8 space-y-6">
            <form id="venta-form" onSubmit={handleSubmit}>
                
                {/* Selector de Tipo */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                    <button
                        type="button"
                        onClick={() => setSaleType('Por Reserva')}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${saleType === 'Por Reserva' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Por Reserva
                    </button>
                    <button
                        type="button"
                        onClick={() => setSaleType('Directa')}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${saleType === 'Directa' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Venta Directa
                    </button>
                </div>

                {/* Campos Dinámicos */}
                {saleType === 'Por Reserva' ? (
                    <div className="space-y-4 animate-fade-in-up">
                        <div>
                            <label className="label-form">SELECCIONAR RESERVA</label>
                            <div className="relative">
                                <select 
                                    required 
                                    value={reservationId} 
                                    onChange={handleReservationChange}
                                    className="input-form appearance-none cursor-pointer"
                                >
                                    <option value="">-- Buscar Reserva --</option>
                                    {reservations.map(r => (
                                        <option key={r.id} value={r.id}>#{r.id} - {r.clientName} (Saldo: ${ (r.totalAmount - r.paidAmount).toLocaleString() })</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                        {selectedReserva && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                                <div className="flex justify-between">
                                    <span>Total Reserva:</span>
                                    <span className="font-bold">${selectedReserva.totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                    <span>Pagado a la fecha:</span>
                                    <span>${selectedReserva.paidAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-red-500 font-bold border-t border-slate-200 pt-1 mt-1">
                                    <span>Saldo Pendiente:</span>
                                    <span>${saldoPendiente.toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 animate-fade-in-up">
                        <div>
                            <label className="label-form">NOMBRE CLIENTE</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    type="text" 
                                    required 
                                    value={clientName} 
                                    onChange={e => setClientName(e.target.value)}
                                    className="input-form pl-10" 
                                    placeholder="Nombre del cliente" 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="label-form">CONCEPTO / DETALLE</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    type="text" 
                                    required 
                                    value={concept} 
                                    onChange={e => setConcept(e.target.value)}
                                    className="input-form pl-10" 
                                    placeholder="Ej: Serenata Express, Propina..." 
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="h-px bg-slate-100 my-2"></div>

                {/* Campos Comunes de Pago */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label-form">MÉTODO PAGO</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <select 
                                value={method} 
                                onChange={e => setMethod(e.target.value)}
                                className="input-form pl-10 appearance-none cursor-pointer"
                            >
                                <option value="EFECTIVO">Efectivo</option>
                                <option value="TRANSFERENCIA">Transferencia</option>
                                <option value="NEQUI">Nequi</option>
                                <option value="DAVIPLATA">Daviplata</option>
                                <option value="OTRO">Otro</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="label-form">FECHA</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="date" 
                                required 
                                value={date} 
                                onChange={e => setDate(e.target.value)}
                                className="input-form pl-10" 
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-[#fef2f2] p-5 rounded-xl border border-red-100">
                    <label className="block text-[10px] font-bold text-red-800 uppercase tracking-widest mb-2">
                        MONTO A PAGAR
                    </label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500" size={20} />
                        <input 
                            type="number" 
                            required 
                            min="1"
                            max={saleType === 'Por Reserva' ? saldoPendiente : undefined}
                            value={amount} 
                            onChange={e => setAmount(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-red-200 text-red-600 text-lg font-bold outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 placeholder:text-red-200"
                            placeholder="0" 
                        />
                    </div>
                    
                    {saleType === 'Por Reserva' && selectedReserva && (
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-red-200/50">
                            <span className="text-[10px] font-bold text-red-800 uppercase tracking-wide">Nuevo Saldo Estimado</span>
                            <span className="text-sm font-bold text-slate-700">${nuevoSaldo.toLocaleString()}</span>
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-2">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold uppercase text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit"
                        className="flex-1 py-3 bg-[#dc2626] hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase shadow-lg shadow-red-900/20 hover:shadow-red-900/30 transition-all flex items-center justify-center gap-2"
                    >
                        <Check size={16} strokeWidth={3} /> Registrar Venta
                    </button>
                </div>

            </form>
        </div>
      </div>
      
      <style>{`
        .label-form {
            display: block;
            font-size: 9px;
            font-weight: 800;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
            padding-left: 2px;
        }
        .input-form {
            width: 100%;
            padding: 10px 12px;
            border-radius: 10px;
            background-color: white;
            border: 1px solid #e2e8f0;
            color: #334155;
            font-size: 13px;
            outline: none;
            transition: all 0.2s;
        }
        .input-form.pl-10 { padding-left: 36px; }
        .input-form:focus {
            border-color: #ef4444;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
      `}</style>
    </div>,
    document.body
  );
};
