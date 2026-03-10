
import React from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, FileText, User, Calendar, CreditCard, Download } from 'lucide-react';
import { Sale } from '../services/ventaService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onDownload: (id: string) => void;
}

export const VentaDetailModal: React.FC<Props> = ({ isOpen, onClose, sale, onDownload }) => {
  if (!isOpen || !sale) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Modal Card - Compact Receipt Style */}
      <div className="relative w-full max-w-[320px] bg-white rounded-2xl shadow-2xl flex flex-col animate-fade-in-up overflow-hidden m-auto ring-1 ring-white/10">
        
        {/* Header - Venta Exitosa */}
        <div className="bg-[#0f172a] pt-6 pb-5 px-5 text-center relative border-b border-slate-800">
            <button onClick={onClose} className="absolute top-3 right-3 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 p-1 rounded-full transition-all">
                <X size={14} />
            </button>

            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <CheckCircle className="text-emerald-400" size={24} strokeWidth={2} />
            </div>
            
            <h3 className="text-sm font-serif font-bold text-white tracking-widest uppercase mb-0.5">VENTA EXITOSA</h3>
            <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest">REF: {sale.id}</p>
        </div>

        {/* Body Receipt */}
        <div className="bg-white relative">
            
            {/* Amount Section */}
            <div className="text-center pt-5 pb-4">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">TOTAL PAGADO</p>
                <h2 className="text-3xl font-serif font-bold text-slate-800 tracking-tight">
                    ${sale.amount.toLocaleString()}
                </h2>
            </div>

            {/* Dotted Line with Cutouts */}
            <div className="relative w-full h-4 my-1 flex items-center">
                <div className="absolute left-0 w-full border-t-2 border-dashed border-slate-100"></div>
                <div className="absolute left-[-8px] w-4 h-4 rounded-full bg-slate-900/80"></div>
                <div className="absolute right-[-8px] w-4 h-4 rounded-full bg-slate-900/80"></div>
            </div>

            {/* Information Grid */}
            <div className="px-6 py-3 space-y-3">
                
                <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={12} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Fecha</span>
                    </div>
                    <span className="font-bold text-slate-700">{sale.date}</span>
                </div>

                <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 text-slate-400">
                        <User size={12} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Cliente</span>
                    </div>
                    <span className="font-bold text-slate-700 text-right truncate max-w-[140px]">{sale.clientName}</span>
                </div>

                <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 text-slate-400">
                        <FileText size={12} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Concepto</span>
                    </div>
                    <span className="font-bold text-slate-700 text-right max-w-[140px] truncate" title={sale.concept}>
                        {sale.concept}
                    </span>
                </div>

                <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 text-slate-400">
                        <CreditCard size={12} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Método</span>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-600 uppercase tracking-wider">
                        {sale.method}
                    </span>
                </div>

            </div>

            {/* Reservation Link Button */}
            {sale.reservationId && (
                <div className="px-6 pb-4 pt-1">
                    <button className="w-full py-2 bg-blue-50/50 border border-blue-100 rounded-lg flex items-center justify-center gap-2 text-blue-600 cursor-default">
                        <span className="text-[9px] font-bold uppercase tracking-widest">VINCULADO A RESERVA #{sale.reservationId}</span>
                    </button>
                </div>
            )}

        </div>

        {/* Footer Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
            <button 
                onClick={() => onDownload(sale.id)}
                className="w-full py-3 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-md transition-all transform hover:-translate-y-0.5"
            >
                <Download size={14} /> Comprobante PDF
            </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
