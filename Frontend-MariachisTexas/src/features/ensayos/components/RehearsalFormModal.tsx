import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Calendar, Clock, MapPin, AlignLeft, Music, Search, Plus, Trash2, Check } from 'lucide-react';
import { Rehearsal, Song } from '@/types';
import { repertoireService } from '../../repertoire/services/repertoireService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: Rehearsal | null;
  isViewOnly?: boolean;
}

export const RehearsalFormModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialData, isViewOnly = false }) => {
  const emptyRehearsal = {
    title: '',
    location: '',
    date: '',
    time: '',
    notes: '',
    repertoireIds: [] as string[],
    status: 'Programado'
  };

  const [formData, setFormData] = useState<any>(emptyRehearsal);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar canciones disponibles al abrir el modal
  useEffect(() => {
    const loadSongs = async () => {
        const songs = await repertoireService.getSongs();
        setAvailableSongs(songs);
    };
    if (isOpen) loadSongs();
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(emptyRehearsal);
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (isViewOnly) return;
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSongSelection = (songId: string) => {
      if (isViewOnly) return;
      setFormData(prev => {
          const exists = prev.repertoireIds.includes(songId);
          if (exists) {
              return { ...prev, repertoireIds: prev.repertoireIds.filter(id => id !== songId) };
          } else {
              return { ...prev, repertoireIds: [...prev.repertoireIds, songId] };
          }
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  // Filtrar canciones para el selector
  const filteredSongs = availableSongs.filter(song => 
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      song.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-primary-900/10 border ${isViewOnly ? 'bg-slate-100 border-slate-200' : 'bg-primary-50 border-primary-100'}`}>
                <Calendar className="text-primary-600" size={24} />
            </div>
            <div>
                <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">
                    {isViewOnly ? 'Detalle de Ensayo' : initialData ? 'Editar Ensayo' : 'Programar Ensayo'}
                </h3>
                <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">
                    Planificación y práctica musical
                </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-white">
            <form id="rehearsal-form" onSubmit={handleSubmit} className="flex flex-col md:flex-row min-h-full">
                
                {/* COLUMNA IZQUIERDA: Datos del Ensayo */}
                <div className="w-full md:w-1/2 p-8 border-b md:border-b-0 md:border-r border-slate-100 bg-white space-y-6">
                    
                    <div>
                        <label className="label-form">NOMBRE DEL ENSAYO</label>
                        <input 
                            type="text" 
                            name="title" 
                            required 
                            disabled={isViewOnly} 
                            value={formData.title} 
                            onChange={handleChange} 
                            className="input-form font-bold text-slate-700" 
                            placeholder="Ej: Ensayo General Boda..." 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                         <div>
                            <label className="label-form">FECHA</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="date" name="date" required disabled={isViewOnly} value={formData.date} onChange={handleChange} className="input-form input-icon-padding" />
                            </div>
                         </div>
                         <div>
                            <label className="label-form">HORA</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="time" name="time" required disabled={isViewOnly} value={formData.time} onChange={handleChange} className="input-form input-icon-padding" />
                            </div>
                         </div>
                    </div>

                    <div>
                        <label className="label-form">LUGAR / UBICACIÓN</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input type="text" name="location" required disabled={isViewOnly} value={formData.location} onChange={handleChange} className="input-form input-icon-padding" placeholder="Ej: Sala de Ensayos A" />
                        </div>
                    </div>

                    <div className="flex-1">
                         <label className="label-form flex items-center gap-2 mb-3">
                             <AlignLeft size={14} /> NOTAS O DETALLES
                         </label>
                         <textarea 
                            name="notes"
                            disabled={isViewOnly}
                            value={formData.notes}
                            onChange={handleChange}
                            className={`w-full p-4 rounded-xl border outline-none resize-none font-medium leading-relaxed min-h-[120px] transition-all
                                ${isViewOnly 
                                    ? 'bg-slate-50 text-slate-600 border-slate-200' 
                                    : 'bg-white border-slate-200 focus:ring-4 focus:ring-primary-50 focus:border-primary-300 text-slate-700'}
                            `}
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
                        
                        {!isViewOnly && (
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
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-2">
                        {filteredSongs.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-sm">
                                No se encontraron canciones.
                            </div>
                        ) : (
                            filteredSongs.map(song => {
                                const isSelected = formData.repertoireIds.includes(song.id);
                                
                                // Si es ViewOnly, solo mostrar las seleccionadas
                                if (isViewOnly && !isSelected) return null;

                                return (
                                    <div 
                                        key={song.id} 
                                        onClick={() => toggleSongSelection(song.id)}
                                        className={`
                                            flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group
                                            ${isSelected 
                                                ? 'bg-white border-primary-200 shadow-sm ring-1 ring-primary-50' 
                                                : 'bg-white border-transparent hover:border-slate-200 hover:shadow-sm'
                                            }
                                            ${isViewOnly ? 'cursor-default' : ''}
                                        `}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${isSelected ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-400'}`}>
                                            {isSelected ? <Check size={16} /> : <Music size={16} />}
                                        </div>
                                        
                                        <div className="flex-1">
                                            <p className={`text-sm font-bold ${isSelected ? 'text-primary-900' : 'text-slate-700'}`}>{song.title}</p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">{song.artist}</p>
                                        </div>

                                        {!isViewOnly && isSelected && (
                                            <Trash2 size={16} className="text-red-400 hover:text-red-600 transition-colors" />
                                        )}
                                        {!isViewOnly && !isSelected && (
                                            <Plus size={16} className="text-slate-300 group-hover:text-primary-500 transition-colors" />
                                        )}
                                    </div>
                                );
                            })
                        )}
                        {isViewOnly && formData.repertoireIds.length === 0 && (
                            <div className="text-center py-10 text-slate-400 text-sm italic">
                                No se seleccionaron canciones para este ensayo.
                            </div>
                        )}
                    </div>
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
                    form="rehearsal-form"
                    type="submit"
                    className="bg-[#dc2626] hover:bg-red-700 text-white px-8 py-4 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-3 shadow-xl shadow-red-900/10 hover:shadow-red-900/20 transition-all transform hover:-translate-y-0.5"
                >
                    <Save size={18} />
                    GUARDAR ENSAYO
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
