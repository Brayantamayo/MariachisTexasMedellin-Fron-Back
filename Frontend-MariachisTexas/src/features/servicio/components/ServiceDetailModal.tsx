import React from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, Tag, FileText } from 'lucide-react';
import { Service } from '@/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    service: Service | null;
}

export const ServiceDetailModal: React.FC<Props> = ({ isOpen, onClose, service }) => {
  if (!isOpen || !service) return null;

/// aqui va el modal de detalle, con toda la info del servicio, pero sin opciones de edicion, solo lectura.
return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
    <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
            <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/10 border bg-red-50 border-red-100">
            <Tag className="text-red-600" size={20} />
            </div>
            <div>
            <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">Detalle Servicio</h3>
            <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">Información completa del servicio</p>
            </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={20} />
        </button>
        </div>

        {/* Contentenido de la modal */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
        
          {/* aqui va el header profile, con el icono y el nombre del servicio */}
        <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border-4 border-white shadow-lg">
            <Tag size={40} />
            </div>
            <h2 className="text-2xl font-serif font-bold text-slate-800">{service.nombre}</h2>
            <div className="flex gap-2 mt-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${service.estado ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {service.estado ? 'Activo' : 'Inactivo'}
            </span>
            </div>
        </div>

          {/* Aqui se muestra el precio del servicio  y su estado, si esta activo o no */}
        <div className="grid grid-cols-1 gap-4 mb-6">
            <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <DollarSign size={14} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Precio</p>
                <p className="text-sm font-bold text-slate-700 font-mono">${Number(service.precio).toLocaleString()}</p>
            </div>
            </div>
        </div>

          {/* Descripción */}
        <div className="p-5 bg-white rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400 mb-3">
            <FileText size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Descripción</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
            {service.descripcion}
            </p>
        </div>
        </div>

        {/* Aqui termina la seccion de contenido, y se muestra el footer con el boton de cerrar */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-end">
        <button onClick={onClose} className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-3 px-6 rounded-xl transition-all uppercase text-xs tracking-widest shadow-sm">
            Cerrar Detalle
        </button>
        </div>
    </div>
    </div>,
    document.body
);
};