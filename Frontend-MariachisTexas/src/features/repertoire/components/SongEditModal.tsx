import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Music, AlertCircle } from 'lucide-react';
import { Song } from '@/types';
import { SongForm, SongFormErrors } from './SongForm';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

{/* Propiedades de la modal de edición de canción */}
interface Props {
  isOpen:  boolean;
  onClose: () => void;
  onSave:  (data: any) => Promise<void>;
  song:    Song | null;
}

{/* Validar los datos del formulario */}
const validate = (data: any): SongFormErrors => {
  const errors: SongFormErrors = {};

  if (!data.title?.trim())
    errors.title = 'El título es requerido';
  else if (data.title.trim().length < 2)
    errors.title = 'El título debe tener al menos 2 caracteres';

  if (!data.artist?.trim())
    errors.artist = 'El artista es requerido';
  else if (data.artist.trim().length < 2)
    errors.artist = 'El artista debe tener al menos 2 caracteres';

  if (!data.genre)
    errors.genre = 'Selecciona un género musical';

  if (!data.category)
    errors.category = 'Selecciona una categoría';

  if (!data.duration?.trim())
    errors.duration = 'La duración es requerida';
  else if (!/^\d{1,2}:\d{2}$/.test(data.duration.trim()))
    errors.duration = 'Formato inválido. Usa M:SS (ej: 3:45)';

  return errors;
};

const FIELD_ORDER: (keyof SongFormErrors)[] = ['title', 'artist', 'genre', 'category', 'duration'];

{/* Componente de la modal de edición de canción */}
export const SongEditModal: React.FC<Props> = ({ isOpen, onClose, onSave, song }) => {

  const [formData,    setFormData]    = useState<any>(null);
  const [errors,      setErrors]      = useState<SongFormErrors>({});
  const [saving,      setSaving]      = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  const registerFieldRef = (field: string, el: HTMLElement | null) => {
    fieldRefs.current[field] = el;
  };

  useEffect(() => {
    if (song && isOpen) {
      setFormData({ ...song });
      setErrors({});
      setGlobalError(null);
    }
  }, [song, isOpen]);



  {/* Desplazarse al primer campo con error */}
  const scrollToFirstError = (validationErrors: SongFormErrors) => {
    const firstErrorField = FIELD_ORDER.find(field => validationErrors[field]);
    if (!firstErrorField) return;

    const el = fieldRefs.current[firstErrorField];
    if (el && scrollContainerRef.current) {
      const containerTop = scrollContainerRef.current.getBoundingClientRect().top;
      const elTop        = el.getBoundingClientRect().top;
      const offset       = elTop - containerTop + scrollContainerRef.current.scrollTop - 24;
      scrollContainerRef.current.scrollTo({ top: offset, behavior: 'smooth' });
      setTimeout(() => (el as HTMLInputElement | HTMLSelectElement).focus?.(), 300);
    }
  };

  {/* esto sirve para actualizar el formulario cuando cambia el valor de un campo */}
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    if (errors[name as keyof SongFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  {/* Esto sirve para validar los datos del formulario y actualizar el estado del formulario */}
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    {/* Validar los datos del formulario */}
    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      scrollToFirstError(validationErrors);
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      setErrors({});
    } catch (err) {
      // getErrorMessage navega correctamente el error de Axios/backend
      setGlobalError(getErrorMessage(err, 'Error al actualizar la canción.'));
    } finally {
      setSaving(false);
    }
  };

  {/*Cierra el modal y limpia los datos del formulario.*/}
  const handleClose = () => {
    setErrors({});
    setGlobalError(null);
    onClose();
  };

  if (!isOpen || !formData) return null;
  {/*Crea el portal para mostrar el modal de edición de canción*/}
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* parte de arriba del modal de edición de canción */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-50 border border-red-100 shadow-lg">
              <Music className="text-red-500" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-slate-800 uppercase tracking-wide">Editar Canción</h3>
              <p className="text-xs text-slate-500 mt-0.5">Modificando: <span className="font-bold text-slate-700">{song?.title}</span></p>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Error global — muestra el mensaje real del backend */}
        {globalError && (
          <div className="mx-8 mt-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
            <AlertCircle size={18} className="flex-shrink-0" /> {globalError}
          </div>
        )}

        {/* Formulario */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <SongForm
            formData={formData}
            onChange={handleChange}
            onFieldChange={handleFieldChange}
            onSubmit={handleSubmit}
            errors={errors}
            registerFieldRef={registerFieldRef}
          />
        </div>

        {/* Pie de página */}
        <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-4">
          <button onClick={handleClose} disabled={saving}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest px-4 py-2 disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="bg-[#dc2626] hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-3 shadow-lg transition-all">
            {saving ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
            ) : (
              <><Save size={16} /> Guardar Cambios</>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};