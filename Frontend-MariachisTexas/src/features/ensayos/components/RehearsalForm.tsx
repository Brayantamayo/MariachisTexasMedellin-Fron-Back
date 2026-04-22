
import React, { useState } from 'react';
import { Calendar, Clock, MapPin, AlignLeft, Music, Search, Plus, Trash2, Check, ChevronDown, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Song } from '@/types';
import { CustomDatePicker } from '@/shared/components/CustomDatePicker';

// Agrega errors a la interfaz Props:
interface Props {
formData:       any;
availableSongs: Song[];
availableHours?: string[];
blockStatus?:   { isBlocked: boolean; reason?: string; hasPartialBlocks?: boolean; blockedRanges?: any[] };
onChange:       (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
onDateChange:   (name: string, value: string) => void;
onToggleSong:   (songId: string) => void;
onSubmit:       (e: React.FormEvent) => void;
  errors?:        { title?: string; location?: string; date?: string; time?: string }; // ✅ nuevo
}

export const RehearsalForm: React.FC<Props> = ({ 
    formData, 
    availableSongs, 
    availableHours = [],
    blockStatus = { isBlocked: false, reason: '', hasPartialBlocks: false, blockedRanges: [] }, 
    onChange, 
    onDateChange, 
    onToggleSong, 
    onSubmit,
    errors
}) => {
const [searchTerm, setSearchTerm] = useState('');
const today = new Date().toISOString().split('T')[0];

  // Filtrar canciones para el selector
const filteredSongs = availableSongs.filter(song => 
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    song.artist.toLowerCase().includes(searchTerm.toLowerCase())
);

return (
    <form id="rehearsal-form" onSubmit={onSubmit} className="flex flex-col md:flex-row h-full">
        
        {/* COLUMNA IZQUIERDA: Datos del Ensayo */}
        <div className="w-full md:w-1/2 p-8 border-b md:border-b-0 md:border-r border-slate-100 bg-white space-y-6">
            
            {/* Alerta de Bloqueo TOTAL */}
            {blockStatus.isBlocked && (
                <div className="flex items-start gap-3 bg-red-50 p-4 rounded-xl border border-red-100 text-red-700 animate-fade-in-up">
                    <ShieldAlert size={20} className="shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide">Fecha Bloqueada</p>
                        <p className="text-xs mt-1 leading-relaxed">
                            No es posible programar ensayos: {blockStatus.reason || 'Restricción administrativa'}.
                        </p>
                    </div>
                </div>
            )}

            {/* Alerta de Bloqueo PARCIAL */}
            {!blockStatus.isBlocked && blockStatus.hasPartialBlocks && (
                <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-700 animate-fade-in-up">
                    <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide">Horarios Restringidos</p>
                        <p className="text-xs mt-1 leading-relaxed">
                            Algunas horas no están disponibles debido a bloqueos o eventos existentes.
                        </p>
                    </div>
                </div>
            )}

            <div>
                <label className="label-form">NOMBRE DEL ENSAYO <span className="text-red-500">*</span></label>
                <input 
                    type="text" 
                    name="title" 
                    required 
                    value={formData.title} 
                    onChange={onChange} 
                    className="input-form font-bold text-slate-700" 
                    placeholder="Ej: Ensayo General Boda..." 
                />
                {errors?.title && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{errors.title}</p>}
            </div>


            <div className="grid grid-cols-2 gap-5">
                <div>
                    <CustomDatePicker 
                        name="date"
                        label="FECHA"
                        value={formData.date}
                        onChange={onDateChange}
                        required
                        minDate={today}
                    />
                    {errors?.date && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{errors.date}</p>}
                </div>


                <div>
                    <label className="label-form">HORA <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        <select 
                            name="time" 
                            required 
                            disabled={blockStatus.isBlocked}
                            value={formData.time} 
                            onChange={onChange} 
                            className={`input-form input-icon-padding cursor-pointer appearance-none ${blockStatus.isBlocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                        >
                            {blockStatus.isBlocked ? (
                                <option value="">Bloqueado</option>
                            ) : (
                                <>
                                    <option value="">Seleccionar</option>
                                    {availableHours.map(time => (
                                        <option key={time} value={time}>{time}</option>
                                    ))}
                                    {/* Si estamos editando y la hora actual ya no está libre (porque la ocupa este mismo evento), agregarla visualmente */}
                                    {formData.time && !availableHours.includes(formData.time) && !blockStatus.isBlocked && (
                                        <option value={formData.time}>{formData.time} (Actual)</option>
                                    )}
                                </>
                            )}
                        </select>
                        {errors?.time && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{errors.time}</p>}
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>
                </div>
            </div>

            <div>
                <label className="label-form">LUGAR / UBICACIÓN <span className="text-red-500">*</span></label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    <input type="text" name="location" required value={formData.location} onChange={onChange} className="input-form input-icon-padding" placeholder="Ej: Sala de Ensayos A" />
                </div>
                {errors?.location && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{errors.location}</p>}
            </div>

            <div className="flex-1">
                <label className="label-form flex items-center gap-2 mb-3">
                    <AlignLeft size={14} /> NOTAS O DETALLES
                </label>
                <textarea 
                    name="notes"
                    value={formData.notes}
                    onChange={onChange}
                    className="w-full p-4 rounded-xl border outline-none resize-none font-medium leading-relaxed min-h-[120px] transition-all bg-white border-slate-200 focus:ring-4 focus:ring-primary-50 focus:border-primary-300 text-slate-700"
                    placeholder="Escribe detalles importantes para los músicos..."
                />
            </div>

        </div>

        {/* COLUMNA DERECHA: Selector de Canciones */}
        <div className="w-full md:w-1/2 p-0 bg-slate-50 flex flex-col h-[500px] md:h-auto">
            
            <div className="p-6 pb-2 bg-white border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-serif font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Music size={16} className="text-primary-600" /> Canciones a Practicar
                    </h4>
                    <span className="bg-primary-50 text-primary-700 text-[10px] font-bold px-2 py-1 rounded-full border border-primary-100">
                        {formData.repertoireIds.length} Seleccionadas
                    </span>
                </div>
                
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="Buscar en repertorio..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-primary-300 transition-all"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-2">
                {filteredSongs.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">
                        No se encontraron canciones.
                    </div>
                ) : (
                    filteredSongs.map(song => {
                        const isSelected = formData.repertoireIds.includes(song.id);
                        return (
                            <div 
                                key={song.id} 
                                onClick={() => onToggleSong(song.id)}
                                className={`
                                    flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group
                                    ${isSelected 
                                        ? 'bg-white border-primary-200 shadow-sm ring-1 ring-primary-50' 
                                        : 'bg-white border-transparent hover:border-slate-200 hover:shadow-sm'
                                    }
                                `}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${isSelected ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-400'}`}>
                                    {isSelected ? <Check size={16} /> : <Music size={16} />}
                                </div>
                                
                                <div className="flex-1">
                                    <p className={`text-sm font-bold ${isSelected ? 'text-primary-900' : 'text-slate-700'}`}>{song.title}</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">{song.artist}</p>
                                </div>

                                {isSelected && (
                                    <Trash2 size={16} className="text-red-400 hover:text-red-600 transition-colors" />
                                )}
                                {!isSelected && (
                                    <Plus size={16} className="text-slate-300 group-hover:text-primary-500 transition-colors" />
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>



        <style>{`
        .label-form {
            display: block;
            font-size: 10px;
            font-weight: 800;
            color: #94a3b8;
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
            border-color: #f87171;
            box-shadow: 0 0 0 4px rgba(254, 202, 202, 0.3);
        }
      `}</style>
    </form>
  );
};
