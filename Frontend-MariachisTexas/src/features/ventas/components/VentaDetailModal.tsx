
import React from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, FileText, User, Calendar, CreditCard, Download, Clock, DollarSign } from 'lucide-react';
import { Sale } from '../services/ventaService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onDownload: (id: string) => void;
}

const getStatusStyle = (status: string) => {
  if (status === 'Finalizado') return 'bg-blue-50 text-blue-600 border-blue-100';
  if (status === 'Confirmado') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  return 'bg-slate-50 text-slate-600 border-slate-100';
};

export const VentaDetailModal: React.FC<Props> = ({ isOpen, onClose, sale, onDownload }) => {
  if (!isOpen || !sale) return null;

  const isFinalizado = sale.status === 'Finalizado';

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-8 pb-4 bg-white border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-serif font-bold text-slate-800 uppercase">Venta #{sale.id}</h3>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusStyle(sale.status)}`}>
                {sale.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {sale.date}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-8">
          <div className="space-y-8">

            {/* Monto Total */}
            <div className={`p-6 rounded-2xl border-2 ${isFinalizado ? 'border-blue-300 bg-blue-50' : 'border-emerald-300 bg-emerald-50'}`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isFinalizado ? 'text-blue-600' : 'text-emerald-600'}`}>
                Monto Total
              </p>
              <h2 className={`text-4xl font-serif font-bold tracking-tight ${isFinalizado ? 'text-blue-900' : 'text-emerald-900'}`}>
                ${sale.amount.toLocaleString('es-CO')}
              </h2>
            </div>

            {/* Información Principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Cliente */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <User size={14} className="text-slate-600" /> Cliente
                </h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-sm font-bold text-slate-800">{sale.clientName}</p>
                  {sale.clientEmail && (
                    <p className="text-xs text-slate-600 mt-1">{sale.clientEmail}</p>
                  )}
                </div>
              </div>

              {/* Concepto */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <FileText size={14} className="text-slate-600" /> Concepto
                </h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-sm font-bold text-slate-800">{sale.concept}</p>
                </div>
              </div>

              {/* Fecha */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Calendar size={14} className="text-slate-600" /> Fecha
                </h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-sm font-bold text-slate-800">{sale.date}</p>
                </div>
              </div>

              {/* Método de Pago */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CreditCard size={14} className="text-slate-600" /> Método de Pago
                </h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-sm font-bold text-slate-800">{sale.method}</p>
                </div>
              </div>

            </div>

            {/* Reserva Vinculada */}
            {sale.reservationId && (
              <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl">
                <p className="text-sm font-bold text-blue-900 flex items-center gap-2">
                  <CheckCircle size={16} className="text-blue-600" />
                  Vinculado a Reserva #{sale.reservationId}
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-all"
          >
            Cerrar
          </button>
          <button
            onClick={() => onDownload(sale.id)}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <Download size={16} /> Descargar PDF
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
