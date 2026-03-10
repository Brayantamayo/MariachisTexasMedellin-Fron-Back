
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Receipt } from 'lucide-react';
import { Reservation } from '@/types';
import { abonoService } from '../services/abonoService';
import { AbonoForm } from './AbonoForm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialReservationId?: string;
}

export const AbonoCreateModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialReservationId }) => {
  // Datos del formulario
  const [formData, setFormData] = useState({
      reservationId: '',
      date: new Date().toISOString().split('T')[0],
      method: 'Transferencia',
      amount: '',
      notes: ''
  });

  // Datos auxiliares
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReserva, setSelectedReserva] = useState<Reservation | null>(null);

  // Cargar reservas disponibles al abrir
  useEffect(() => {
    if (isOpen) {
        const load = async () => {
            const data = await abonoService.getPayableReservations();
            setReservations(data);

            if (initialReservationId) {
                const preselected = data.find(r => r.id === initialReservationId);
                if (preselected) {
                    setFormData(prev => ({ ...prev, reservationId: initialReservationId }));
                    setSelectedReserva(preselected);
                }
            }
        };
        load();
        
        // Reset
        if (!initialReservationId) {
            setFormData(prev => ({ ...prev, reservationId: '' }));
            setSelectedReserva(null);
        }
        setFormData(prev => ({ ...prev, amount: '', notes: '' }));
    }
  }, [isOpen, initialReservationId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      
      // Validación especial para monto
      if (name === 'amount') {
          const val = Number(value);
          const totalReserva = selectedReserva ? selectedReserva.totalAmount : 0;
          const paidAmount = selectedReserva ? selectedReserva.paidAmount : 0;
          const saldoPendiente = totalReserva - paidAmount;
          
          if (val > saldoPendiente) return; // Bloquear si excede
      }

      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, value: string) => {
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReservationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value;
      const found = reservations.find(r => r.id === id) || null;
      setSelectedReserva(found);
      setFormData(prev => ({ ...prev, reservationId: id, amount: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const amountNumber = Number(formData.amount);
      if (!formData.reservationId || amountNumber <= 0) return;
      
      onSave({
          ...formData,
          amount: amountNumber
      });
  };

  // Cálculos para pasar al componente visual
  const totalReserva = selectedReserva ? selectedReserva.totalAmount : 0;
  const paidAmount = selectedReserva ? selectedReserva.paidAmount : 0;
  const saldoPendienteActual = totalReserva - paidAmount;
  const fiftyPercent = totalReserva * 0.5;
  const missingForConfirmation = Math.max(0, fiftyPercent - paidAmount);
  const isConfirmed = selectedReserva?.status === 'Confirmado';
  const amountNumber = Number(formData.amount);
  const nuevoSaldo = Math.max(0, saldoPendienteActual - amountNumber);
  const willConfirm = !isConfirmed && (paidAmount + amountNumber) >= fiftyPercent && amountNumber > 0;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col animate-fade-in-up overflow-hidden">
        
        {/* Header Rojo Compacto */}
        <div className="bg-[#dc2626] px-5 py-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
                <Receipt size={18} strokeWidth={2} />
                <h3 className="text-xs font-bold tracking-widest uppercase">REGISTRAR ABONO</h3>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors bg-white/10 p-1 rounded-full">
                <X size={16} />
            </button>
        </div>

        {/* Form Content - Less Padding */}
        <div className="p-5">
            <AbonoForm 
                formData={formData}
                reservations={reservations}
                selectedReserva={selectedReserva}
                calculations={{
                    totalReserva,
                    paidAmount,
                    saldoPendienteActual,
                    nuevoSaldo,
                    willConfirm,
                    missingForConfirmation,
                    isConfirmed
                }}
                onChange={handleChange}
                onDateChange={handleDateChange}
                onReservationChange={handleReservationChange}
                onSubmit={handleSubmit}
                onCancel={onClose}
                initialReservationId={initialReservationId}
            />
        </div>

        {/* Footer (Actions) */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
            <button 
                onClick={onClose}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest px-3 py-2 transition-colors"
            >
                CANCELAR
            </button>
            <button 
                onClick={handleSubmit}
                className={`px-6 py-2.5 rounded-lg text-[10px] font-bold tracking-widest uppercase shadow-md transition-all transform hover:-translate-y-0.5 text-white
                    ${willConfirm 
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30' 
                        : 'bg-[#dc2626] hover:bg-red-700 shadow-red-900/20'
                    }
                `}
            >
                {willConfirm ? 'CONFIRMAR Y PAGAR' : 'REGISTRAR PAGO'}
            </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
