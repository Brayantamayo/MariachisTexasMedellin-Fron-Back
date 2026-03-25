import React from 'react';
import { DollarSign, Tag, FileText } from 'lucide-react';
import { Service } from '@/types';

interface Props {
    formData: Omit<Service, 'id' | 'estado'>;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    errors?: { nombre?: string; descripcion?: string; precio?: string };
    
}
////errors para resaltar los campos con errores se puede reutilizar en los demas formularios
export const ServiceForm: React.FC<Props> = ({ formData, onChange, errors }) => {
    
return (
    <form className="space-y-6">
<div className="space-y-4">
        {/* Nombre */}
        <div>
        <label className="label-form">Nombre del Servicio <span className="text-red-500">*</span></label>
        <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={onChange}
            className="input-form pl-10"
            placeholder="Ej: Hora Extra"
            autoFocus
            />
        </div>
        {errors?.nombre && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{errors.nombre}</p>}      
        </div>

        {/* Descripción */}
        <div>
        <label className="label-form">Descripción <span className="text-red-500">*</span></label>
        <div className="relative">
            <FileText className="absolute left-3 top-4 text-slate-400" size={16} />
            <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={onChange}
            className="input-form pl-10 resize-none h-32 py-3"
            placeholder="Detalle del servicio..."
            />
        </div>
        {errors?.descripcion && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{errors.descripcion}</p>}
        </div>

        {/* Precio */}
        <div>
        <label className="label-form">Precio <span className="text-red-500">*</span></label>
        <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
            type="number"
            name="precio"
            value={formData.precio}
            onChange={onChange}
            className="input-form pl-10 font-mono font-bold"
            placeholder="0"
            min="0"
            />
        </div>
        {errors?.precio && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{errors.precio}</p>}
        </div>
    </div>

    <style>{`
        .label-form {
        display: block;
        font-size: 10px;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 4px;
        padding-left: 2px;
        }
        .input-form {
        width: 100%;
        padding: 10px 12px;
        border-radius: 10px;
        background-color: white;
        border: 1px solid #e2e8f0;
        color: #334155;
        font-size: 13px;
        outline: none;
        transition: all 0.2s;
        }
        .input-form.pl-10 { padding-left: 36px; }
        .input-form:focus {
        border-color: #ef4444;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
    `}</style>
    </form>
);
};
