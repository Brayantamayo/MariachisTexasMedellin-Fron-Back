
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, DollarSign } from 'lucide-react';
import { Sale } from '../services/ventaService';
import { VentaForm } from './VentaForm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  sale: Sale | null;
}

export const VentaEditModal: React.FC<Props> = ({ isOpen, onClose, onSave, sale }) => {
  const [formData, setFormData] = useState<any>(null);
  const [saleType, setSaleType] = useState<'Por Reserva' | 'Directa'>('Directa');

  useEffect(() => {
    if (sale && isOpen) {
        setFormData({
            clientName: sale.clientName,
            concept: sale.concept,
            date: sale.date,
            method: sale.method,
            amount: sale.amount,
            reservationId: sale.reservationId || ''
        });
        setSaleType(sale.type);
    }
  }, [sale, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, value: string) => {
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
          ...formData,
          type: saleType
      });
  };

  if (!isOpen || !formData) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col animate-fade-in-up overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-2">
                <DollarSign size={18} strokeWidth={2.5} />
                <h3 className="text-xs font-bold tracking-widest uppercase">EDITAR VENTA</h3>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors bg-white/10 p-1 rounded-full">
                <X size={16} />
            </button>
        </div>

        {/* Content - Padding extra abajo */}
        <div className="flex-1 overflow-y-auto p-5 pb-32 bg-white custom-scrollbar">
            <VentaForm 
                formData={formData}
                saleType={saleType}
                reservations={[]} // Edición simple
                selectedReserva={null}
                onSaleTypeChange={() => {}} 
                onChange={handleChange}
                onDateChange={handleDateChange}
                onReservationChange={() => {}} 
                onSubmit={handleSubmit}
            />
            {sale?.reservationId && (
                <div className="mt-4 text-[9px] text-center text-orange-500 font-bold bg-orange-50 p-2 rounded-lg border border-orange-100">
                    * Vinculado a Reserva #{sale.reservationId}. Monto y Reserva fijos.
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
            <button 
                onClick={onClose}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest px-3 py-2 transition-colors"
            >
                Cancelar
            </button>
            <button 
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-md transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
            >
                <Save size={14} strokeWidth={3} /> Guardar
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
