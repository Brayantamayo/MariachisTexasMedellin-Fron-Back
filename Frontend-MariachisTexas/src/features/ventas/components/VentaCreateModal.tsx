
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, DollarSign } from 'lucide-react';
import { Reservation } from '@/types';
import { ventaService } from '../services/ventaService';
import { VentaForm } from './VentaForm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const VentaCreateModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [saleType, setSaleType] = useState<'Por Reserva' | 'Directa'>('Por Reserva');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReserva, setSelectedReserva] = useState<Reservation | null>(null);
  
  // CLIENTE EXCLUSIVO PARA VENTAS DIRECTAS
  const EXCLUSIVE_DIRECT_CLIENT = "Cliente Directa";

  const initialForm = {
      reservationId: '',
      clientName: '',
      concept: '',
      date: new Date().toISOString().split('T')[0],
      method: 'Efectivo',
      amount: ''
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (isOpen) {
        ventaService.getPayableReservations().then(setReservations);
        setFormData(initialForm);
        setSaleType('Por Reserva');
        setSelectedReserva(null);
    }
  }, [isOpen]);

  // Manejador para el cambio de pestañas con lógica de cliente exclusivo
  const handleTypeChange = (type: 'Por Reserva' | 'Directa') => {
      setSaleType(type);
      
      if (type === 'Directa') {
          // Asignar el Cliente Exclusivo y bloquear la reserva
          setFormData(prev => ({
              ...prev,
              clientName: EXCLUSIVE_DIRECT_CLIENT,
              reservationId: '',
              amount: '',
              concept: 'Venta Directa'
          }));
          setSelectedReserva(null);
      } else {
          // Limpiar cliente para que venga de la reserva
          setFormData(prev => ({
              ...prev,
              clientName: '',
              amount: '',
              concept: ''
          }));
      }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, value: string) => {
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReservationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value;
      const found = reservations.find(r => r.id === id) || null;
      
      setSelectedReserva(found);
      
      const saldo = found ? (found.totalAmount - found.paidAmount) : 0;
      
      setFormData(prev => ({
          ...prev,
          reservationId: id,
          amount: saldo > 0 ? saldo.toString() : '', // Set default amount to pending balance
          clientName: found ? found.clientName : '',
          concept: found ? `Pago a Reserva #${found.id} - ${found.eventType}` : ''
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
          ...formData,
          type: saleType,
          reservationId: saleType === 'Por Reserva' ? formData.reservationId : undefined
      });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      {/* Container compacto (max-w-md) */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col animate-fade-in-up overflow-hidden max-h-[90vh]">
        
        {/* Header Rojo Compacto */}
        <div className="bg-[#dc2626] px-5 py-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-2">
                <DollarSign size={18} strokeWidth={2.5} />
                <h3 className="text-xs font-bold tracking-widest uppercase">REGISTRAR VENTA</h3>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors bg-white/10 p-1 rounded-full">
                <X size={16} />
            </button>
        </div>

        {/* Form Content - Padding inferior extra para el calendario */}
        <div className="flex-1 overflow-y-auto p-5 pb-32 bg-white custom-scrollbar">
            <VentaForm 
                formData={formData}
                saleType={saleType}
                reservations={reservations}
                selectedReserva={selectedReserva}
                onSaleTypeChange={handleTypeChange}
                onChange={handleChange}
                onDateChange={handleDateChange}
                onReservationChange={handleReservationChange}
                onSubmit={handleSubmit}
            />
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
            <button 
                onClick={onClose}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest px-3 py-2 transition-colors"
            >
                CANCELAR
            </button>
            <button 
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-[#dc2626] hover:bg-red-700 text-white rounded-lg text-[10px] font-bold tracking-widest uppercase shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
            >
                <Check size={14} strokeWidth={3} /> GUARDAR VENTA
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
