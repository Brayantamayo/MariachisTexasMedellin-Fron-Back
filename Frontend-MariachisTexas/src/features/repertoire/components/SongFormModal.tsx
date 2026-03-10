import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Music, User, List, Tag, Clock, AlignLeft, Volume2, Image as ImageIcon, UploadCloud, Trash2, PlayCircle } from 'lucide-react';
import { Song } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (songData: any) => void;
  initialData?: Song | null;
  isViewOnly?: boolean;
}

export const SongFormModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialData, isViewOnly = false }) => {
  const emptySong = {
    title: '',
    artist: '',
    genre: 'Ranchera',
    category: 'Serenata',
    lyrics: '',
    audioUrl: '',
    duration: '',
    difficulty: 'Media',
    coverImage: ''
  };

  const [formData, setFormData] = useState<any>(emptySong);
  
  // Refs para los inputs de archivo ocultos
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(emptySong);
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (isViewOnly) return;
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Manejador para carga de imágenes
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // En un entorno real, aquí subiríamos el archivo al servidor/bucket.
      // Para esta demo, creamos una URL local temporal.
      const localUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, coverImage: localUrl }));
    }
  };

  // Manejador para carga de audio
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, audioUrl: localUrl }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-primary-900/10 border ${isViewOnly ? 'bg-slate-100 border-slate-200' : 'bg-primary-50 border-primary-100'}`}>
                <Music className="text-primary-600" size={24} />
            </div>
            <div>
                <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">
                    {isViewOnly ? 'Detalle de Canción' : initialData ? 'Editar Canción' : 'Nueva Canción'}
                </h3>
                <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">
                    {isViewOnly ? formData.title : 'Gestiona el repertorio musical'}
                </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-white">
            <form id="song-form" onSubmit={handleSubmit} className="flex flex-col md:flex-row min-h-full">
                
                {/* COLUMNA IZQUIERDA: Portada del Álbum (Ahora clickable para subir) */}
                <div className="w-full md:w-[35%] p-8 border-b md:border-b-0 md:border-r border-slate-100 bg-white flex flex-col">
                    
                    <div className="mb-2 h-full flex flex-col">
                        <label className="label-form">PORTADA DEL ÁLBUM</label>
                        
                        {/* Input file oculto */}
                        <input 
                            type="file" 
                            ref={imageInputRef} 
                            onChange={handleImageUpload} 
                            accept="image/*" 
                            className="hidden" 
                        />

                        {/* Contenedor de Imagen Clickable */}
                        <div 
                            onClick={() => !isViewOnly && imageInputRef.current?.click()}
                            className={`relative aspect-square rounded-[2rem] overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 transition-all flex-1
                                ${!isViewOnly ? 'cursor-pointer hover:border-primary-200 hover:bg-slate-50/80 group' : ''}
                            `}
                        >
                            {formData.coverImage ? (
                                <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover shadow-inner" />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                                    <ImageIcon size={64} className="mb-3 opacity-40" strokeWidth={1.5} />
                                    <span className="text-sm font-medium">Subir Imagen</span>
                                    {!isViewOnly && <span className="text-[10px] mt-1 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">Click para explorar</span>}
                                </div>
                            )}
                            
                            {/* Overlay de hover solo si no es read-only */}
                            {!isViewOnly && formData.coverImage && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <span className="text-white font-bold text-xs uppercase tracking-widest border border-white/50 px-4 py-2 rounded-full backdrop-blur-sm">Cambiar Imagen</span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Nota informativa */}
                    <div className="mt-4 text-center">
                        <p className="text-[10px] text-slate-400 leading-relaxed max-w-[200px] mx-auto">
                            Formatos: JPG, PNG. Recomendado 1:1.
                        </p>
                    </div>

                </div>

                {/* COLUMNA DERECHA: Datos de la Canción */}
                <div className="w-full md:w-[65%] p-8 space-y-6 bg-white">
                    
                    {/* 1. Título */}
                    <div>
                        <label className="label-form">TÍTULO DE LA CANCIÓN</label>
                        <div className="relative group">
                            <Music className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" size={18} />
                            <input 
                                type="text" 
                                name="title" 
                                required 
                                disabled={isViewOnly} 
                                value={formData.title} 
                                onChange={handleChange} 
                                className="input-form font-bold text-slate-700" 
                                placeholder="Ej: El Rey" 
                            />
                        </div>
                    </div>

                    {/* 2. Artista y Género (Grid) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="label-form">ARTISTA ORIGINAL</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" size={18} />
                                <input 
                                    type="text" 
                                    name="artist" 
                                    required 
                                    disabled={isViewOnly} 
                                    value={formData.artist} 
                                    onChange={handleChange} 
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
                                    disabled={isViewOnly} 
                                    value={formData.genre} 
                                    onChange={handleChange} 
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

                     {/* 3. Categoría */}
                     <div>
                        <label className="label-form">CATEGORÍA / OCASIÓN</label>
                        <div className="relative group">
                            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors pointer-events-none" size={18} />
                            <select 
                                name="category" 
                                disabled={isViewOnly} 
                                value={formData.category} 
                                onChange={handleChange} 
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

                    {/* 4. Detalles Técnicos (Fila compacta) */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                             <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Duración</label>
                             <input type="text" name="duration" disabled={isViewOnly} value={formData.duration} onChange={handleChange} className="w-full bg-transparent border-b border-slate-200 focus:border-primary-400 outline-none text-xs py-1" placeholder="00:00" />
                        </div>
                        <div>
                             <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Dificultad</label>
                             <select name="difficulty" disabled={isViewOnly} value={formData.difficulty} onChange={handleChange} className="w-full bg-transparent border-b border-slate-200 focus:border-primary-400 outline-none text-xs py-1">
                                <option value="Baja">Baja</option>
                                <option value="Media">Media</option>
                                <option value="Alta">Alta</option>
                             </select>
                        </div>
                        
                        {/* Audio Upload Section */}
                        <div>
                             <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Audio Demo</label>
                             <input 
                                type="file" 
                                ref={audioInputRef} 
                                onChange={handleAudioUpload} 
                                accept="audio/*" 
                                className="hidden" 
                             />
                             
                             {formData.audioUrl ? (
                                 <div className="flex items-center justify-between gap-2 border-b border-emerald-200 py-1">
                                     <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 overflow-hidden">
                                        <PlayCircle size={12} />
                                        Audio Listo
                                     </span>
                                     {!isViewOnly && (
                                        <button type="button" onClick={() => setFormData({...formData, audioUrl: ''})} className="text-red-400 hover:text-red-600">
                                            <Trash2 size={12} />
                                        </button>
                                     )}
                                 </div>
                             ) : (
                                <button 
                                    type="button"
                                    disabled={isViewOnly}
                                    onClick={() => audioInputRef.current?.click()}
                                    className="w-full flex items-center gap-2 text-xs py-1 text-slate-500 hover:text-primary-600 border-b border-slate-200 hover:border-primary-300 transition-all text-left"
                                >
                                    <UploadCloud size={14} />
                                    {isViewOnly ? 'Sin Audio' : 'Subir MP3'}
                                </button>
                             )}
                        </div>
                    </div>

                    {/* 5. Letra */}
                    <div className="flex-1">
                         <label className="label-form flex items-center gap-2 mb-3">
                             <AlignLeft size={14} /> LETRA DE LA CANCIÓN
                         </label>
                         <textarea 
                            name="lyrics"
                            disabled={isViewOnly}
                            value={formData.lyrics}
                            onChange={handleChange}
                            className={`w-full p-4 rounded-xl border outline-none resize-none font-medium leading-relaxed min-h-[150px] transition-all
                                ${isViewOnly 
                                    ? 'bg-slate-50 text-slate-600 border-slate-200' 
                                    : 'bg-white border-slate-200 focus:ring-4 focus:ring-primary-50 focus:border-primary-300 text-slate-700'}
                            `}
                            placeholder="Escribe o pega la letra aquí..."
                         />
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
                    form="song-form"
                    type="submit"
                    className="bg-[#dc2626] hover:bg-red-700 text-white px-8 py-4 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-3 shadow-xl shadow-red-900/10 hover:shadow-red-900/20 transition-all transform hover:-translate-y-0.5"
                >
                    <Save size={18} />
                    GUARDAR CANCIÓN
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
            /* Ajuste Clave: Padding izquierdo de 48px para respetar el icono */
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