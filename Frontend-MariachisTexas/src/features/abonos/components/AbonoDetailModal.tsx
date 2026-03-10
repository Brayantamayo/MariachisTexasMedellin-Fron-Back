
import React from 'react';
import { createPortal } from 'react-dom';
import { X, Receipt, Download, Bookmark } from 'lucide-react';
import { EnrichedPayment } from '../services/abonoService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  abono: EnrichedPayment | null;
  onDownload: (id: string) => void;
}

export const AbonoDetailModal: React.FC<Props> = ({ isOpen, onClose, abono, onDownload }) => {
  if (!isOpen || !abono) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Modal Card - Compact Receipt Style */}
      <div className="relative w-full max-w-[320px] bg-white rounded-2xl shadow-2xl flex flex-col animate-fade-in-up overflow-hidden m-auto ring-1 ring-white/10">
            
            {/* Header Dark */}
            <div className="bg-[#0f172a] pt-6 pb-5 px-5 text-center relative border-b border-slate-800">
                <button onClick={onClose} className="absolute top-3 right-3 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 p-1 rounded-full transition-all">
                    <X size={14} />
                </button>
                
                <div className="w-12 h-12 mx-auto bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                    <Receipt className="text-emerald-400" size={24} />
                </div>
                <h2 className="text-sm font-serif font-bold text-white tracking-widest uppercase mb-0.5">Comprobante</h2>
                <p className="text-[9px] text-slate-400 uppercase tracking-wider font-mono">ID: {abono.id}</p>
            </div>

            {/* Content Container */}
            <div className="bg-white relative">
                
                {/* Amount */}
                <div className="text-center pt-5 pb-4">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Monto Pagado</p>
                    <h1 className="text-3xl font-serif font-bold text-slate-800 tracking-tight">
                        ${abono.amount.toLocaleString()}
                    </h1>
                </div>

                {/* Dotted Line with Cutouts */}
                <div className="relative w-full h-4 my-1 flex items-center">
                    <div className="absolute left-0 w-full border-t-2 border-dashed border-slate-100"></div>
                    <div className="absolute left-[-8px] w-4 h-4 rounded-full bg-slate-900/80"></div>
                    <div className="absolute right-[-8px] w-4 h-4 rounded-full bg-slate-900/80"></div>
                </div>

                {/* Receipt Details List */}
                <div className="px-6 py-3 space-y-3">
                    <ReceiptRow label="Fecha" value={new Date(abono.date).toLocaleDateString()} />
                    <ReceiptRow label="Cliente" value={abono.clientName} />
                    <ReceiptRow label="Método" value={abono.method} />
                    <ReceiptRow label="Concepto" value={abono.type} />
                </div>

                {/* Reference Box */}
                <div className="px-6 pb-4 pt-1">
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-primary-600 mb-1">
                            <Bookmark size={12} />
                            <span className="text-[9px] font-bold uppercase tracking-wide">Reserva Asociada</span>
                        </div>
                        <p className="text-xs font-bold text-slate-700">#{abono.reservationId}</p>
                        {abono.notes && (
                            <p className="text-[9px] text-slate-500 mt-1 pt-1 border-t border-slate-200 italic leading-tight">
                                "{abono.notes}"
                            </p>
                        )}
                    </div>
                </div>

            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100">
                <button 
                    onClick={() => onDownload(abono.id)}
                    className="w-full py-3 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-md transition-all hover:-translate-y-0.5"
                >
                    <Download size={14} /> Descargar PDF
                </button>
            </div>

      </div>
    </div>,
    document.body
  );
};

const ReceiptRow: React.FC<{ label: string, value: string }> = ({ label, value }) => (
    <div className="flex justify-between items-center text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="font-bold text-slate-700 text-right truncate max-w-[140px]">{value}</span>
    </div>
);
