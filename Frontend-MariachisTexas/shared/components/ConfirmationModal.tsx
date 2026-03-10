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
}

export const ConfirmationModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmText = "Eliminar",
  cancelText = "Cancelar"
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
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
                    className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                >
                    {cancelText}
                </button>
                <button 
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-red-900/20 transition-all transform hover:-translate-y-0.5"
                >
                    {confirmText}
                </button>
            </div>
        </div>

        {/* Close Button absolute */}
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
            <X size={20} />
        </button>
      </div>
    </div>,
    document.body
  );
};