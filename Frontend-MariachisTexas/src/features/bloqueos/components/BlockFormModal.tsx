
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Lock, Calendar, Clock, AlignLeft, AlertCircle, Type, ChevronDown } from 'lucide-react';
import { CalendarBlock } from '@/types';
import { CustomDatePicker } from '@/shared/components/CustomDatePicker';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: CalendarBlock | null;
  isViewOnly?: boolean;
}

export const BlockFormModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialData, isViewOnly = false }) => {
  const emptyBlock = {
    type: 'FULL_DATE',
    reason: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    isActive: true
  };

  const [formData, setFormData] = useState<any>(emptyBlock);

  // Generar opciones de hora (08:00 AM - 12:30 AM)
  const timeOptions = [];
  for (let i = 8; i <= 23; i++) {
      const hour = i.toString().padStart(2, '0');
      timeOptions.push(`${hour}:00`);
      timeOptions.push(`${hour}:30`);
  }
  timeOptions.push('00:00'); 
  timeOptions.push('00:30');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(emptyBlock);
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (isViewOnly) return;
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Manejador especial para el CustomDatePicker
  const handleDateChange = (name: string, value: string) => {
      if (isViewOnly) return;
      
      setFormData(prev => {
          const newState = { ...prev, [name]: value };
          
          // Si estamos en modo FULL_DATE o TIME_RANGE, la fecha fin debe ser igual a la inicio
          if ((prev.type === 'FULL_DATE' || prev.type === 'TIME_RANGE') && name === 'startDate') {
              newState.endDate = value;
          }
          // Validación básica: Si fecha inicio > fecha fin, igualarlas
          if (name === 'startDate' && newState.endDate < value) {
              newState.endDate = value;
          }
          
          return newState;
      });
  };

  // Reset fields when type changes to avoid confusion
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (isViewOnly) return;
      const newType = e.target.value;
      setFormData(prev => ({
          ...prev,
          type: newType,
          // Reset times if switching away from TIME_RANGE
          startTime: newType === 'TIME_RANGE' ? prev.startTime : '',
          endTime: newType === 'TIME_RANGE' ? prev.endTime : '',
          // Sync end date if switching to single day types
          endDate: (newType === 'FULL_DATE' || newType === 'TIME_RANGE') ? prev.startDate : prev.endDate
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-5 overflow-hidden">
            {/* Icon Container fixed width/height and shrink-0 */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/10 border ${isViewOnly ? 'bg-slate-100 border-slate-200' : 'bg-red-50 border-red-100'}`}>
                <Lock className="text-red-600" size={24} />
            </div>
            {/* Text Container flex-1 to take remaining space */}
            <div className="flex-1 min-w-0">
                <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase truncate">
                    {isViewOnly ? 'Detalle de Bloqueo' : initialData ? 'Editar Bloqueo' : 'Crear Bloqueo'}
                </h3>
                <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5 truncate">
                    Restringe la disponibilidad en el calendario
                </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg flex-shrink-0 ml-4">
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
            <form id="block-form" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Tipo de Bloqueo */}
                <div>
                    <label className="label-form">TIPO DE BLOQUEO</label>
                    <div className="relative">
                        <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            name="type" 
                            value={formData.type} 
                            onChange={handleTypeChange}
                            disabled={isViewOnly}
                            className="input-form input-icon-padding appearance-none cursor-pointer"
                        >
                            <option value="FULL_DATE">Fecha Completa (Todo el día)</option>
                            <option value="TIME_RANGE">Rango de Horas (Mismo día)</option>
                            <option value="DATE_RANGE">Rango de Fechas (Varios días)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                </div>

                {/* Motivo */}
                <div>
                    <label className="label-form">MOTIVO DEL BLOQUEO <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            name="reason" 
                            required 
                            disabled={isViewOnly} 
                            value={formData.reason} 
                            onChange={handleChange} 
                            className="input-form input-icon-padding font-bold text-slate-700" 
                            placeholder="Ej: Mantenimiento, Día Festivo, Vacaciones..." 
                        />
                    </div>
                </div>

                {/* Grid para Fechas y Horas (Dinámico) */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-4">
                    
                    {/* Caso 1 y 2: Fecha Completa o Rango Horas (Requiere seleccionar UN día) */}
                    {(formData.type === 'FULL_DATE' || formData.type === 'TIME_RANGE') && (
                        <div>
                            <CustomDatePicker 
                                name="startDate"
                                label="SELECCIONAR FECHA"
                                value={formData.startDate}
                                onChange={handleDateChange}
                                required
                            />
                        </div>
                    )}

                    {/* Caso 2: Rango de Horas (Requiere Inicio y Fin con Lista) */}
                    {formData.type === 'TIME_RANGE' && (
                        <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
                            <div>
                                <label className="label-form">HORA INICIO <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                    <select 
                                        name="startTime" 
                                        required 
                                        disabled={isViewOnly} 
                                        value={formData.startTime} 
                                        onChange={handleChange} 
                                        className="input-form input-icon-padding cursor-pointer appearance-none"
                                    >
                                        <option value="">--:--</option>
                                        {timeOptions.map(t => <option key={`start-${t}`} value={t}>{t}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                </div>
                            </div>
                            <div>
                                <label className="label-form">HORA FIN <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                    <select 
                                        name="endTime" 
                                        required 
                                        disabled={isViewOnly} 
                                        value={formData.endTime} 
                                        onChange={handleChange} 
                                        className="input-form input-icon-padding cursor-pointer appearance-none"
                                    >
                                        <option value="">--:--</option>
                                        {timeOptions.map(t => <option key={`end-${t}`} value={t}>{t}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Caso 3: Rango de Fechas (Requiere Fecha Inicio y Fecha Fin) */}
                    {formData.type === 'DATE_RANGE' && (
                        <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
                            <div>
                                <CustomDatePicker 
                                    name="startDate"
                                    label="FECHA INICIO"
                                    value={formData.startDate}
                                    onChange={handleDateChange}
                                    required
                                />
                            </div>
                            <div>
                                <CustomDatePicker 
                                    name="endDate"
                                    label="FECHA FIN"
                                    value={formData.endDate}
                                    onChange={handleDateChange}
                                    required
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Descripción */}
                <div className="flex-1">
                     <label className="label-form flex items-center gap-2 mb-3">
                         <AlignLeft size={14} /> DESCRIPCIÓN / DETALLES
                     </label>
                     <textarea 
                        name="description"
                        disabled={isViewOnly}
                        value={formData.description}
                        onChange={handleChange}
                        className={`w-full p-4 rounded-xl border outline-none resize-none font-medium leading-relaxed min-h-[120px] transition-all
                            ${isViewOnly 
                                ? 'bg-slate-50 text-slate-600 border-slate-200' 
                                : 'bg-white border-slate-200 focus:ring-4 focus:ring-red-50 focus:border-red-300 text-slate-700'}
                        `}
                        placeholder="Escribe detalles adicionales sobre el motivo del bloqueo..."
                     />
                </div>

            </form>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-between items-center gap-4 z-10">
             <button 
                onClick={onClose}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest px-4 py-2"
            >
                {isViewOnly ? 'CERRAR' : 'CANCELAR'}
            </button>
            
            {!isViewOnly && (
                <button 
                    form="block-form"
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-3 shadow-xl shadow-red-900/10 hover:shadow-red-900/20 transition-all transform hover:-translate-y-0.5"
                >
                    <Save size={18} />
                    GUARDAR BLOQUEO
                </button>
            )}
        </div>
      </div>
      <style>{`
        .label-form {
            display: block;
            font-size: 10px;
            font-weight: 800;
            color: #94a3b8; /* Slate-400 */
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
            padding-left: 2px;
        }
        .input-form {
            width: 100%;
            padding: 12px 16px;
            border-radius: 12px;
            background-color: white;
            border: 1px solid #e2e8f0;
            color: #334155;
            font-size: 14px;
            outline: none;
            transition: all 0.2s;
        }
        .input-icon-padding {
            padding-left: 44px !important;
        }
        .input-form:focus {
            border-color: #f87171; /* Red-400 */
            box-shadow: 0 0 0 4px rgba(254, 202, 202, 0.3); /* Red-200 ring */
        }
        .input-form:disabled {
            background-color: #f8fafc;
            color: #64748b;
            border-color: #f1f5f9;
            cursor: default;
        }
      `}</style>
    </div>,
    document.body
  );
};
