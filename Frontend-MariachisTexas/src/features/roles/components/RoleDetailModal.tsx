
import React from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, CheckCircle, Ban } from 'lucide-react';
import { Role } from '@/types';
import { AVAILABLE_MODULES } from '../data/permissions';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
}

export const RoleDetailModal: React.FC<Props> = ({ isOpen, onClose, role }) => {
  if (!isOpen || !role) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/10 border bg-slate-100 border-slate-200">
                <Lock className="text-slate-600" size={20} />
            </div>
            <div>
                <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">Detalle del Rol</h3>
                <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">Resumen de accesos</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Rol</h4>
                <p className="text-lg font-bold text-slate-800 mb-3">{role.name}</p>
                <p className="text-sm text-slate-600 leading-relaxed italic">"{role.description}"</p>
            </div>

            <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">
                    Módulos Habilitados
                </h4>

                <div className="space-y-2">
                    {AVAILABLE_MODULES.map(mod => {
                        const isAllowed = role.permissions.includes(mod.id);
                        if (!isAllowed) return null; // Solo mostramos los permitidos para limpiar la vista

                        return (
                            <div key={mod.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <mod.icon size={16} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">{mod.label}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                    <CheckCircle size={12} /> Acceso
                                </div>
                            </div>
                        );
                    })}
                    
                    {role.permissions.length === 0 && (
                        <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <Ban size={24} className="mx-auto mb-2 opacity-50" />
                            <p className="text-xs">Este rol no tiene módulos asignados.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-end">
             <button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-xl transition-all uppercase text-xs tracking-widest shadow-lg">
                Cerrar
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
