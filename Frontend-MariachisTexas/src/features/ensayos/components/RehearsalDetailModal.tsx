
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, MapPin, AlignLeft, Music, Check } from 'lucide-react';
import { Rehearsal, Song } from '@/types';
import { repertoireService } from '../../repertoire/services/repertoireService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rehearsal: Rehearsal | null;
}

export const RehearsalDetailModal: React.FC<Props> = ({ isOpen, onClose, rehearsal }) => {
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    if (isOpen && rehearsal) {
        const loadSongs = async () => {
            const allSongs = await repertoireService.getSongs();
            // Filtrar solo las seleccionadas
            const selected = allSongs.filter(s => rehearsal.repertoireIds.includes(s.id));
            setSongs(selected);
        };
        loadSongs();
    }
  }, [isOpen, rehearsal]);

  if (!isOpen || !rehearsal) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/10 border bg-slate-100 border-slate-200">
                <Calendar className="text-slate-600" size={24} />
            </div>
            <div>
                <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">Detalle de Ensayo</h3>
                <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">Información programada</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-white">
            <div className="flex flex-col md:flex-row h-full">
                
                {/* Informacion */}
                <div className="w-full md:w-1/2 p-8 space-y-6 border-b md:border-b-0 md:border-r border-slate-100 bg-white">
                    
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Título</h4>
                        <p className="text-xl font-bold text-slate-800">{rehearsal.title}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-2"><Calendar size={12}/> Fecha</p>
                            <p className="font-bold text-slate-700">{rehearsal.date}</p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-2"><Clock size={12}/> Hora</p>
                            <p className="font-bold text-slate-700">{rehearsal.time}</p>
                        </div>
                        
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><MapPin size={14}/> Ubicación</h4>
                        <p className="text-sm font-medium text-slate-700">{rehearsal.location}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><AlignLeft size={14}/> Notas</h4>
                        <p className="text-sm text-slate-600 italic">{rehearsal.notes || "Sin notas adicionales."}</p>
                    </div>
                </div>

                {/* Lista de canciones */}  
                <div className="w-full md:w-1/2 bg-slate-50 flex flex-col h-[400px] md:h-auto">
                    <div className="p-6 border-b border-slate-100 bg-white">
                        <h4 className="text-xs font-serif font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Music size={16} className="text-primary-600" /> Canciones ({songs.length})
                        </h4>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-3">
                        {songs.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-sm">No hay canciones asignadas.</div>
                        ) : (
                            songs.map(song => (
                                <div key={song.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                        <Music size={14} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">{song.title}</p>
                                        <p className="text-[10px] text-slate-400 uppercase">{song.artist}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>

        {/* Boton de cerrar */}
        <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-end gap-4 z-10">
             <button onClick={onClose} className="bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest uppercase shadow-lg transition-all">
                Cerrar Detalle
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
