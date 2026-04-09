// src/shared/components/PhotoUploadWidget.tsx
// ─── Widget de foto reutilizable para todos los modales ───────────────────────

import React from 'react';
import { Camera, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { usePhotoUpload } from '@/shared/hooks/Usephotoupload .ts';

interface Props {
  photo:      ReturnType<typeof usePhotoUpload>;
  /** URL actual guardada en BD (Cloudinary URL o vacío) */
  currentUrl: string;
  size?:      'sm' | 'md';
}

export const PhotoUploadWidget: React.FC<Props> = ({ photo, currentUrl, size = 'md' }) => {
  const dim        = size === 'sm' ? 'w-20 h-20' : 'w-24 h-24';
  const displayUrl = photo.preview || currentUrl;

  return (
    <div className="flex flex-col items-center gap-1.5 mb-6">

      {/* Input oculto */}
      <input
        ref={photo.inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={photo.handleFileChange}
      />

      {/* Círculo de foto */}
      <div
        onClick={photo.triggerPick}
        className={`relative group ${dim} rounded-full border-2 border-dashed overflow-hidden
          flex items-center justify-center transition-all
          ${photo.uploading
            ? 'border-primary-300 cursor-wait opacity-70'
            : 'border-slate-200 hover:border-primary-400 cursor-pointer hover:shadow-md'
          }`}
      >
        {photo.uploading ? (
          <Loader2 size={24} className="animate-spin text-primary-400" />
        ) : displayUrl ? (
          <>
            <img src={displayUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={20} className="text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-300 group-hover:text-primary-400 transition-colors">
            <Camera size={26} />
          </div>
        )}
      </div>

      {/* Label dinámico */}
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {photo.uploading ? 'Subiendo...' : displayUrl ? 'Cambiar foto' : 'Subir foto'}
      </p>

      {/* Estado */}
      {displayUrl && !photo.uploading && (
        <span className="text-[10px] text-emerald-500 flex items-center gap-1 font-medium">
          <CheckCircle size={10} /> {photo.preview ? 'Foto lista' : 'Foto guardada'}
        </span>
      )}
      {photo.error && (
        <span className="text-[10px] text-red-500 flex items-center gap-1">
          <AlertCircle size={10} /> {photo.error}
        </span>
      )}

      <p className="text-[10px] text-slate-300">JPG, PNG, WEBP · Máx 5MB · Opcional</p>
    </div>
  );
};