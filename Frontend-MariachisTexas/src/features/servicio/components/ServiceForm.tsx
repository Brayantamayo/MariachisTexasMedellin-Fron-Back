import React from 'react';
import { DollarSign, Tag, FileText } from 'lucide-react';
import { Service } from '@/types';

interface Props {
  formData: Omit<Service, 'id' | 'isActive'>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const ServiceForm: React.FC<Props> = ({ formData, onChange }) => {
  return (
    <form className="space-y-6">
      <div className="space-y-4">
        {/* Name Input */}
        <div>
            <label className="label-form">Nombre del Servicio <span className="text-red-500">*</span></label>
            <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={onChange}
                    className="input-form pl-10"
                    placeholder="Ej: Hora Extra"
                    autoFocus
                />
            </div>
        </div>

        {/* Description Input */}
        <div>
            <label className="label-form">Descripción <span className="text-red-500">*</span></label>
            <div className="relative">
                <FileText className="absolute left-3 top-4 text-slate-400" size={16} />
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={onChange}
                    className="input-form pl-10 resize-none h-32 py-3"
                    placeholder="Detalle del servicio..."
                />
            </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
            {/* Price Input */}
            <div>
                <label className="label-form">Precio <span className="text-red-500">*</span></label>
                <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={onChange}
                        className="input-form pl-10 font-mono font-bold"
                        placeholder="0"
                        min="0"
                    />
                </div>
            </div>
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
            border-color: #ef4444; /* Red-500 */
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
      `}</style>
    </form>
  );
};
