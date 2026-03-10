
import React, { useRef } from 'react';
import { Music, User, List, Tag, AlignLeft, Image as ImageIcon, UploadCloud, PlayCircle, Trash2 } from 'lucide-react';

interface Props {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAudioUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearAudio: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const SongForm: React.FC<Props> = ({ formData, onChange, onImageUpload, onAudioUpload, onClearAudio, onSubmit }) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  return (
    <form id="song-form" onSubmit={onSubmit} className="flex flex-col md:flex-row h-full gap-6">
        
        {/* COLUMNA IZQUIERDA: Portada */}
        <div className="w-full md:w-[35%] flex flex-col">
            <div className="mb-2 h-full flex flex-col">
                <label className="label-form">PORTADA DEL ÁLBUM</label>
                
                <input 
                    type="file" 
                    ref={imageInputRef} 
                    onChange={onImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                />

                <div 
                    onClick={() => imageInputRef.current?.click()}
                    className="relative aspect-square rounded-[2rem] overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 transition-all flex-1 cursor-pointer hover:border-primary-200 hover:bg-slate-50/80 group"
                >
                    {formData.coverImage ? (
                        <>
                            <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover shadow-inner" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white font-bold text-xs uppercase tracking-widest border border-white/50 px-4 py-2 rounded-full backdrop-blur-sm">Cambiar Imagen</span>
                            </div>
                        </>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                            <ImageIcon size={64} className="mb-3 opacity-40" strokeWidth={1.5} />
                            <span className="text-sm font-medium">Subir Imagen</span>
                            <span className="text-[10px] mt-1 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">Click para explorar</span>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="mt-4 text-center">
                <p className="text-[10px] text-slate-400 leading-relaxed max-w-[200px] mx-auto">
                    Formatos: JPG, PNG. Recomendado 1:1.
                </p>
            </div>
        </div>

        {/* COLUMNA DERECHA: Datos */}
        <div className="w-full md:w-[65%] space-y-6">
            
            {/* Título */}
            <div>
                <label className="label-form">TÍTULO DE LA CANCIÓN <span className="text-red-500">*</span></label>
                <div className="relative group">
                    <Music className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" size={18} />
                    <input 
                        type="text" 
                        name="title" 
                        required 
                        value={formData.title} 
                        onChange={onChange} 
                        className="input-form font-bold text-slate-700" 
                        placeholder="Ej: El Rey" 
                    />
                </div>
            </div>

            {/* Artista y Género */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="label-form">ARTISTA ORIGINAL <span className="text-red-500">*</span></label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" size={18} />
                        <input 
                            type="text" 
                            name="artist" 
                            required 
                            value={formData.artist} 
                            onChange={onChange} 
                            className="input-form" 
                            placeholder="Ej: José Alfredo Jiménez" 
                        />
                    </div>
                </div>
                <div>
                    <label className="label-form">GÉNERO MUSICAL</label>
                    <div className="relative group">
                        <List className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" size={18} />
                        <select 
                            name="genre" 
                            value={formData.genre} 
                            onChange={onChange} 
                            className="input-form appearance-none cursor-pointer"
                        >
                            <option value="Ranchera">Ranchera</option>
                            <option value="Bolero">Bolero</option>
                            <option value="Son">Son</option>
                            <option value="Corrido">Corrido</option>
                            <option value="Huapango">Huapango</option>
                            <option value="Balada">Balada</option>
                        </select>
                    </div>
                </div>
            </div>

             {/* Categoría */}
             <div>
                <label className="label-form">CATEGORÍA / OCASIÓN</label>
                <div className="relative group">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" size={18} />
                    <select 
                        name="category" 
                        value={formData.category} 
                        onChange={onChange} 
                        className="input-form appearance-none cursor-pointer"
                    >
                        <option value="Serenata">Serenata</option>
                        <option value="Boda">Boda</option>
                        <option value="Cumpleaños">Cumpleaños</option>
                        <option value="Fúnebre">Fúnebre</option>
                        <option value="Show">Show General</option>
                        <option value="Clásicos">Clásicos</option>
                    </select>
                </div>
            </div>

            {/* Detalles Técnicos */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                     <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Duración</label>
                     <input type="text" name="duration" value={formData.duration} onChange={onChange} className="w-full bg-transparent border-b border-slate-200 focus:border-primary-400 outline-none text-xs py-1" placeholder="00:00" />
                </div>
                <div>
                     <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Dificultad</label>
                     <select name="difficulty" value={formData.difficulty} onChange={onChange} className="w-full bg-transparent border-b border-slate-200 focus:border-primary-400 outline-none text-xs py-1">
                        <option value="Baja">Baja</option>
                        <option value="Media">Media</option>
                        <option value="Alta">Alta</option>
                     </select>
                </div>
                
                {/* Audio Upload */}
                <div>
                     <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Audio Demo</label>
                     <input 
                        type="file" 
                        ref={audioInputRef} 
                        onChange={onAudioUpload} 
                        accept="audio/*" 
                        className="hidden" 
                     />
                     
                     {formData.audioUrl ? (
                         <div className="flex items-center justify-between gap-2 border-b border-emerald-200 py-1">
                             <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 overflow-hidden">
                                <PlayCircle size={12} />
                                Listo
                             </span>
                             <button type="button" onClick={onClearAudio} className="text-red-400 hover:text-red-600">
                                <Trash2 size={12} />
                             </button>
                         </div>
                     ) : (
                        <button 
                            type="button"
                            onClick={() => audioInputRef.current?.click()}
                            className="w-full flex items-center gap-2 text-xs py-1 text-slate-500 hover:text-primary-600 border-b border-slate-200 hover:border-primary-300 transition-all text-left"
                        >
                            <UploadCloud size={14} />
                            Subir MP3
                        </button>
                     )}
                </div>
            </div>

            {/* Letra */}
            <div className="flex-1">
                 <label className="label-form flex items-center gap-2 mb-3">
                     <AlignLeft size={14} /> LETRA DE LA CANCIÓN
                 </label>
                 <textarea 
                    name="lyrics"
                    value={formData.lyrics}
                    onChange={onChange}
                    className="w-full p-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-primary-50 focus:border-primary-300 text-slate-700 outline-none resize-none font-medium leading-relaxed min-h-[150px] transition-all"
                    placeholder="Escribe o pega la letra aquí..."
                 />
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
            padding: 14px 16px 14px 48px;
            border-radius: 12px;
            background-color: white;
            border: 1px solid #e2e8f0;
            color: #334155;
            font-size: 14px;
            outline: none;
            transition: all 0.2s;
        }
        .input-form:focus {
            border-color: #f87171;
            box-shadow: 0 0 0 4px rgba(254, 202, 202, 0.3);
        }
      `}</style>
    </form>
  );
};
