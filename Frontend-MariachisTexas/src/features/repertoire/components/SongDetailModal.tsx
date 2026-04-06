
import React from 'react';
import { createPortal } from 'react-dom';
import { X, Music, User, AlignLeft, PlayCircle, Clock, Tag, Image as ImageIcon } from 'lucide-react';
import { Song } from '@/types';

{/* Propiedades de la vista de detalles de canción */}
interface Props {
isOpen: boolean;
onClose: () => void;
song: Song | null;
}


export const SongDetailModal: React.FC<Props> = ({ isOpen, onClose, song }) => {
if (!isOpen || !song) return null;

{/* Crear portal para mostrar el modal de detalles de canción */}
return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
    <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">
        
        {/* parte de arriva de la vista de ver detalle  */}
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/10 border bg-slate-100 border-slate-200">
                <Music className="text-slate-600" size={24} />
            </div>
            <div>
                <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">Detalle de Canción</h3>
                <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">Información del repertorio</p>
            </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={20} />
        </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-0">
            <div className="flex flex-col md:flex-row h-full">
                
                {/* Portada */}
                <div className="w-full md:w-[35%] p-8 bg-slate-50 border-r border-slate-100">
                    <div className="aspect-square rounded-[2rem] overflow-hidden shadow-lg border border-slate-200 mb-6 bg-white flex items-center justify-center">
                        {song.coverImage ? (
                            <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover" />
                        ) : (
                            <ImageIcon size={64} className="text-slate-300" />
                        )}
                    </div>
                    {/* Información adicional */}
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Duración</p>
                            <p className="font-bold text-slate-800 flex items-center gap-2"><Clock size={14}/> {song.duration || 'N/A'}</p>
                        </div>
                        {/* Dificultad */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Dificultad</p>
                            <p className="font-bold text-slate-800">{song.difficulty}</p>
                        </div>
                        {/* Audio Demo */}
                        {song.audioUrl && (
                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm flex items-center gap-3">
                                <PlayCircle size={24} className="text-emerald-600" />
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-700 uppercase">Audio Demo</p>
                                    <p className="text-xs text-emerald-600 font-bold">Disponible</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Detalles principales */}
                <div className="w-full md:w-[65%] p-8 space-y-8">
                    <div>
                        <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">{song.title}</h2>
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase">
                                <User size={12} /> {song.artist}
                            </span>
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase">
                                <Music size={12} /> {song.genre}
                            </span>
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase">
                                <Tag size={12} /> {song.category}
                            </span>
                        </div>
                    </div>
                    {/* Letra */}
                    <div className="border-t border-slate-100 pt-6">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <AlignLeft size={14} /> Letra
                        </h4>
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            {song.lyrics ? (
                                <p className="text-slate-700 leading-loose font-medium whitespace-pre-wrap font-serif text-sm">
                                    {song.lyrics}
                                </p>
                            ) : (
                                <p className="text-slate-400 italic text-sm text-center">Sin letra registrada.</p>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>

        {/* Footer */}
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
