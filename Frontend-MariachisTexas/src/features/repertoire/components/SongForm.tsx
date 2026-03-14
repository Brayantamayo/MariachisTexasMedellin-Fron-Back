import React, { useRef, useState } from 'react';
import {
  Music, User, List, Tag, AlignLeft,
  Image as ImageIcon, UploadCloud, PlayCircle,
  Trash2, Loader2, AlertCircle, CheckCircle2
} from 'lucide-react';
import { uploadImage, uploadAudio } from '@/shared/services/uploadService';

export interface SongFormErrors {
  title?:    string;
  artist?:   string;
  genre?:    string;
  category?: string;
  duration?: string;
}

interface Props {
  formData:     any;
  onChange:     (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onFieldChange:(field: string, value: any) => void;
  onSubmit:     (e: React.FormEvent) => void;
  errors?:      SongFormErrors;
}

export const SongForm: React.FC<Props> = ({
  formData, onChange, onFieldChange, onSubmit, errors = {} as SongFormErrors
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [imageProgress,  setImageProgress]  = useState(0);
  const [audioProgress,  setAudioProgress]  = useState(0);
  const [uploadError,    setUploadError]     = useState<string | null>(null);

  // ─── Subir imagen ────────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadingImage(true);
    try {
      const url = await uploadImage(file, 'repertorio/portadas', setImageProgress);
      onFieldChange('coverImage', url);
    } catch (err: any) {
      setUploadError(err.message || 'Error al subir la imagen.');
    } finally {
      setUploadingImage(false);
      setImageProgress(0);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // ─── Subir audio ─────────────────────────────────────────────────────────────
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploadingAudio(true);
    try {
      const url = await uploadAudio(file, setAudioProgress);
      onFieldChange('audioUrl', url);
    } catch (err: any) {
      setUploadError(err.message || 'Error al subir el audio.');
    } finally {
      setUploadingAudio(false);
      setAudioProgress(0);
      if (audioInputRef.current) audioInputRef.current.value = '';
    }
  };

  return (
    <form id="song-form" onSubmit={onSubmit} className="flex flex-col md:flex-row h-full gap-6">

      
      <div className="w-full md:w-[35%] flex flex-col gap-3">
        <label className="label-form">PORTADA DEL ÁLBUM</label>

        <input type="file" ref={imageInputRef} onChange={handleImageUpload}
          accept="image/jpeg,image/png,image/webp" className="hidden" />

        <div
          onClick={() => !uploadingImage && imageInputRef.current?.click()}
          className={`relative aspect-square rounded-[2rem] overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 transition-all group
            ${uploadingImage ? 'cursor-wait opacity-70' : 'cursor-pointer hover:border-red-200 hover:bg-slate-50/80'}`}
        >
          {uploadingImage ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 size={36} className="animate-spin text-red-400" />
              <span className="text-xs font-bold text-slate-500">{imageProgress}%</span>
              <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-400 rounded-full transition-all duration-300"
                  style={{ width: `${imageProgress}%` }} />
              </div>
            </div>
          ) : formData.coverImage ? (
            <>
              <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-bold text-xs uppercase tracking-widest border border-white/50 px-4 py-2 rounded-full backdrop-blur-sm">
                  Cambiar Imagen
                </span>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-2">
              <ImageIcon size={56} className="opacity-40" strokeWidth={1.5} />
              <span className="text-sm font-medium text-slate-400">Subir Imagen</span>
              <span className="text-[10px] text-slate-400">JPG, PNG, WEBP · Máx 5MB</span>
            </div>
          )}
        </div>

        {formData.coverImage && !uploadingImage && (
          <button type="button" onClick={() => onFieldChange('coverImage', '')}
            className="text-xs text-red-400 hover:text-red-600 flex items-center justify-center gap-1 transition-colors">
            <Trash2 size={12} /> Quitar imagen
          </button>
        )}

        {uploadError && (
          <div className="flex items-center gap-2 text-red-500 text-xs font-medium bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <AlertCircle size={14} className="flex-shrink-0" /> {uploadError}
          </div>
        )}
      </div>

      {/* ── COLUMNA DERECHA: Datos ──────────────────────────────────────────── */}
      <div className="w-full md:w-[65%] space-y-5">

        {/* Título */}
        <div>
          <label className="label-form">TÍTULO DE LA CANCIÓN <span className="text-red-500">*</span></label>
          <div className="relative group">
            <Music className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-400 transition-colors pointer-events-none" size={18} />
            <input type="text" name="title" value={formData.title} onChange={onChange}
              maxLength={100} placeholder="Ej: El Rey"
              className={`input-form font-bold text-slate-700 ${errors.title ? 'border-red-400' : ''}`} />
          </div>
          {errors.title && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.title}</p>}
        </div>

        {/* Artista + Género */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label-form">ARTISTA ORIGINAL <span className="text-red-500">*</span></label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-400 transition-colors pointer-events-none" size={18} />
              <input type="text" name="artist" value={formData.artist} onChange={onChange}
                maxLength={80} placeholder="Ej: José Alfredo Jiménez"
                className={`input-form ${errors.artist ? 'border-red-400' : ''}`} />
            </div>
            {errors.artist && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.artist}</p>}
          </div>

          <div>
            <label className="label-form">GÉNERO MUSICAL <span className="text-red-500">*</span></label>
            <div className="relative group">
              <List className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-400 transition-colors pointer-events-none" size={18} />
              <select name="genre" value={formData.genre} onChange={onChange}
                className={`input-form appearance-none cursor-pointer ${errors.genre ? 'border-red-400' : ''}`}>
                <option value="">-- Seleccionar --</option>
                <option value="Ranchera">Ranchera</option>
                <option value="Bolero">Bolero</option>
                <option value="Son">Son</option>
                <option value="Corrido">Corrido</option>
                <option value="Huapango">Huapango</option>
                <option value="Balada">Balada</option>
              </select>
            </div>
            {errors.genre && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.genre}</p>}
          </div>
        </div>

        {/* Categoría */}
        <div>
          <label className="label-form">CATEGORÍA / OCASIÓN <span className="text-red-500">*</span></label>
          <div className="relative group">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-400 transition-colors pointer-events-none" size={18} />
            <select name="category" value={formData.category} onChange={onChange}
              className={`input-form appearance-none cursor-pointer ${errors.category ? 'border-red-400' : ''}`}>
              <option value="">-- Seleccionar --</option>
              <option value="Serenata">Serenata</option>
              <option value="Boda">Boda</option>
              <option value="Cumpleaños">Cumpleaños</option>
              <option value="Fúnebre">Fúnebre</option>
              <option value="Show">Show General</option>
              <option value="Clásicos">Clásicos</option>
            </select>
          </div>
          {errors.category && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12}/>{errors.category}</p>}
        </div>

        {/* Detalles técnicos */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">

          {/* Duración */}
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">
              Duración <span className="text-red-400">*</span>
            </label>
            <input type="text" name="duration" value={formData.duration} onChange={onChange}
              maxLength={5} placeholder="3:45"
              className={`w-full bg-transparent border-b outline-none text-xs py-1 ${
                errors.duration ? 'border-red-400 text-red-600' : 'border-slate-200 focus:border-red-400'}`} />
            {errors.duration && <p className="text-red-500 text-[10px] mt-0.5">{errors.duration}</p>}
          </div>

          {/* Dificultad */}
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Dificultad</label>
            <select name="difficulty" value={formData.difficulty} onChange={onChange}
              className="w-full bg-transparent border-b border-slate-200 focus:border-red-400 outline-none text-xs py-1">
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
            </select>
          </div>

          {/* Audio */}
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Audio Demo</label>
            <input type="file" ref={audioInputRef} onChange={handleAudioUpload}
              accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg" className="hidden" />

            {uploadingAudio ? (
              <div className="flex items-center gap-2 border-b border-red-200 py-1">
                <Loader2 size={12} className="animate-spin text-red-400" />
                <span className="text-xs text-red-500 font-bold">{audioProgress}%</span>
              </div>
            ) : formData.audioUrl ? (
              <div className="flex items-center justify-between gap-1 border-b border-emerald-200 py-1">
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Listo
                </span>
                <button type="button" onClick={() => onFieldChange('audioUrl', '')}
                  className="text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => audioInputRef.current?.click()}
                className="w-full flex items-center gap-1 text-xs py-1 text-slate-500 hover:text-red-500 border-b border-slate-200 hover:border-red-300 transition-all text-left">
                <UploadCloud size={13} /> Subir MP3
              </button>
            )}
          </div>
        </div>

        {/* Letra */}
        <div>
          <label className="label-form flex items-center gap-2 mb-2">
            <AlignLeft size={14} /> LETRA DE LA CANCIÓN
          </label>
          <textarea name="lyrics" value={formData.lyrics || ''} onChange={onChange}
            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-red-50 focus:border-red-300 text-slate-700 outline-none resize-none font-medium leading-relaxed min-h-[150px] transition-all text-sm"
            placeholder="Escribe o pega la letra aquí..." />
        </div>
      </div>

      <style>{`
        .label-form { display:block; font-size:10px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:.05em; margin-bottom:8px; padding-left:2px; }
        .input-form { width:100%; padding:14px 16px 14px 48px; border-radius:12px; background-color:white; border:1px solid #e2e8f0; color:#334155; font-size:14px; outline:none; transition:all .2s; }
        .input-form:focus { border-color:#f87171; box-shadow:0 0 0 4px rgba(254,202,202,.3); }
      `}</style>
    </form>
  );
};