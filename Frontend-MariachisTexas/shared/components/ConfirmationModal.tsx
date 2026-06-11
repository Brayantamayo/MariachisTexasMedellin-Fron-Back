import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export const ConfirmationModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  loading = false
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={loading ? undefined : onClose}></div>
      
      {/* Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up ring-1 ring-slate-200">
        
        <div className="p-8 text-center">
            {/* Icono de Alerta */}
            <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 shadow-sm ring-4 ring-red-50/50">
                <AlertTriangle className="text-red-500 h-8 w-8" strokeWidth={2.5} />
            </div>

            <h3 className="text-xl font-serif font-bold text-slate-800 mb-2">
                {title}
            </h3>
            
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
                {message}
            </p>

            <div className="flex gap-3 justify-center">
                <button 
                    onClick={onClose}
                    disabled={loading}
                    className={`flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {cancelText}
                </button>
                <button 
                    onClick={() => {
                        onConfirm();
                        if (loading === undefined) {
                            onClose();
                        }
                    }}
                    disabled={loading}
                    className={`flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-red-900/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Aceptando...</span>
                      </>
                    ) : confirmText}
                </button>
            </div>
        </div>

        {/* Close Button absolute */}
        <button 
            onClick={onClose}
            disabled={loading}
            className={`absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors ${loading ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
            <X size={20} />
        </button>
      </div>
    </div>,
    document.body
  );
};