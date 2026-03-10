
import React from 'react';
import { AVAILABLE_MODULES } from '../data/permissions';
import { Check, X } from 'lucide-react';

interface Props {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onTogglePermission: (moduleId: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const RoleForm: React.FC<Props> = ({ formData, onChange, onTogglePermission, onSubmit }) => {
  
  return (
    <form id="role-form" onSubmit={onSubmit} className="space-y-8">
        
        {/* Basic Info */}
        <div className="space-y-5">
            <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 pl-1">Nombre del Rol</label>
                <input 
                    type="text" 
                    name="name"
                    required
                    value={formData.name}
                    onChange={onChange}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 shadow-sm placeholder:text-slate-300"
                    placeholder="Ej: Gerente de Ventas"
                />
            </div>
            <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 pl-1">Descripción</label>
                <textarea 
                    name="description"
                    rows={2}
                    value={formData.description}
                    onChange={onChange}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium outline-none resize-none transition-all bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-primary-100 focus:border-primary-500 shadow-sm placeholder:text-slate-300"
                    placeholder="¿Qué funciones tendrá este rol?"
                />
            </div>
        </div>

        <div className="h-px bg-slate-100 w-full"></div>

        {/* Modules Grid */}
        <div>
            <div className="flex items-center justify-between mb-4 px-1">
                <h4 className="text-xs font-serif font-bold text-slate-700 uppercase tracking-widest">
                    Acceso a Módulos
                </h4>
                <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-full">
                    {formData.permissions.length} Permitidos
                </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AVAILABLE_MODULES.map((module) => {
                    const isAllowed = formData.permissions.includes(module.id);
                    const Icon = module.icon;

                    return (
                        <div 
                            key={module.id}
                            onClick={() => onTogglePermission(module.id)}
                            className={`
                                relative flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer group
                                ${isAllowed 
                                    ? 'bg-white border-emerald-500 shadow-md shadow-emerald-900/5' 
                                    : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200 opacity-80 hover:opacity-100'
                                }
                            `}
                        >
                            <div className={`
                                w-10 h-10 rounded-lg flex items-center justify-center transition-colors flex-shrink-0
                                ${isAllowed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}
                            `}>
                                <Icon size={20} />
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <h5 className={`text-sm font-bold ${isAllowed ? 'text-slate-800' : 'text-slate-500'}`}>
                                        {module.label}
                                    </h5>
                                    
                                    {/* Toggle Visual */}
                                    <div className={`
                                        w-10 h-5 rounded-full relative transition-colors duration-300
                                        ${isAllowed ? 'bg-emerald-500' : 'bg-slate-300'}
                                    `}>
                                        <div className={`
                                            absolute top-1 left-1 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-300
                                            ${isAllowed ? 'translate-x-5' : 'translate-x-0'}
                                        `}></div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    {module.description}
                                </p>
                            </div>

                            {/* Active Indicator Corner */}
                            {isAllowed && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                    <Check size={10} className="text-white" strokeWidth={4} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    </form>
  );
};
