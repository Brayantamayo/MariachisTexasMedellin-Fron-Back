// src/shared/hooks/usePhotoUpload.ts
// ─── Hook reutilizable para subir fotos a Cloudinary ─────────────────────────
// Úsalo en ClientCreateModal, ClientEditModal, EmployeeCreateModal,
// EmployeeEditModal, UserCreateModal, UserEditModal

import React, { useState, useRef, type ChangeEvent } from 'react';
import { uploadImage } from '@/shared/services/uploadService';


interface UsePhotoUploadOptions {
  /** Carpeta de Cloudinary. Default: 'usuarios/fotos' */
  folder?: 'usuarios/fotos' | 'repertorio/portadas' | 'empleados/fotos' | 'clientes/fotos';
  /** Callback cuando la URL ya está lista en Cloudinary */
  onSuccess?: (url: string) => void;
}


interface UsePhotoUploadReturn {
  inputRef:         React.RefObject<HTMLInputElement>;  // ✅ así funciona seguro
  preview:          string;
  uploading:        boolean;
  error:            string | null;
  triggerPick:      () => void;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  reset:            () => void;
}

export const usePhotoUpload = (options: UsePhotoUploadOptions = {}): UsePhotoUploadReturn => {
  const { folder = 'usuarios/fotos', onSuccess } = options;

  const inputRef  = useRef<HTMLInputElement>(null);
  const [preview,   setPreview]   = useState('');
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const triggerPick = () => {
    if (!uploading) inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview inmediato antes de subir
    setPreview(URL.createObjectURL(file));
    setError(null);
    setUploading(true);

    try {
      const url = await uploadImage(file, folder);
      onSuccess?.(url);
    } catch (err: any) {
      setError(err.message || 'Error al subir la foto');
      setPreview('');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const reset = () => {
    setPreview('');
    setError(null);
    setUploading(false);
  };

  return { inputRef, preview, uploading, error, triggerPick, handleFileChange, reset };
};