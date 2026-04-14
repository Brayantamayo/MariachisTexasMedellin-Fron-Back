
// ─── ClientCreateModal.tsx ────────────────────────────────────────────────────
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';
import { UserRole } from '@/types';
import { ClientForm } from './ClientForm';
import { usePhotoUpload } from '@/shared/hooks/Usephotoupload .ts';
import { PhotoUploadWidget } from '@/shared/components/Photouploadwidget .tsx';
 
interface CreateProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}
 
export interface ClientFormErrors {
  email?: string;
  name?: string;
  lastName?: string;
  documentNumber?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  birthDate?: string;
}
 
const EMPTY_ERRORS: ClientFormErrors = {};
 
const validate = (data: any): ClientFormErrors => {
  const errors: ClientFormErrors = {};
 
  if (!data.email?.trim())
    errors.email = 'El correo es requerido';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
    errors.email = 'El correo no es válido';
 
  if (!data.name?.trim())
    errors.name = 'El nombre es requerido';
  else if (data.name.trim().length < 2)
    errors.name = 'El nombre debe tener al menos 2 caracteres';
 
  if (!data.lastName?.trim())
    errors.lastName = 'El apellido es requerido';
  else if (data.lastName.trim().length < 2)
    errors.lastName = 'El apellido debe tener al menos 2 caracteres';
 
  if (!data.documentNumber?.trim())
    errors.documentNumber = 'El número de documento es requerido';
  else if (!/^\d{6,12}$/.test(data.documentNumber.trim()))
    errors.documentNumber = 'El documento debe tener 6-12 dígitos';
 
  if (!data.phone?.trim())
    errors.phone = 'El teléfono es requerido';
  else if (!/^3\d{9}$/.test(data.phone.trim()))
    errors.phone = 'El teléfono debe ser válido (10 dígitos, empieza en 3)';
 
  if (!data.password?.trim())
    errors.password = 'La contraseña es requerida';
  else if (data.password.length < 6)
    errors.password = 'Mínimo 6 caracteres';
 
  if (data.confirmPassword !== data.password)
    errors.confirmPassword = 'Las contraseñas no coinciden';
 
  if (!data.birthDate) {
    errors.birthDate = 'La fecha de nacimiento es requerida';
  } else {
    const splitDate = data.birthDate.split('-');
    const birth = new Date(parseInt(splitDate[0]), parseInt(splitDate[1]) - 1, parseInt(splitDate[2]));
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    if (age < 18) {
      errors.birthDate = 'El cliente debe ser mayor de 18 años';
    }
  }

  return errors;
};
 
export const ClientCreateModal: React.FC<CreateProps> = ({ isOpen, onClose, onSave }) => {
  const emptyClient = {
    role: UserRole.CLIENTE,
    name: '', lastName: '', email: '',
    documentType: 'CC', documentNumber: '',
    birthDate: '', phone: '', secondaryPhone: '',
    city: 'Medellín', neighborhood: '', address: '',
    serviceZone: 'Urbano',
    gender: 'O', isActive: true,
    avatar: '',
    password: '', confirmPassword: ''
  };
 
  const [formData, setFormData] = useState<any>(emptyClient);
  const [errors,   setErrors]   = useState<ClientFormErrors>(EMPTY_ERRORS);
  const [error,    setError]    = useState<string | null>(null);
  const [saving,   setSaving]   = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
 
  const photo = usePhotoUpload({
    folder: 'clientes/fotos',
    onSuccess: (url) => setFormData((prev: any) => ({ ...prev, avatar: url })),
  });
 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    // Limpiar error del campo al escribir
    if (errors[name as keyof ClientFormErrors])
      setErrors(prev => ({ ...prev, [name]: undefined }));
    // Limpiar error global al escribir
    if (error) setError(null);
  };
 
  const handleClose = () => {
    setFormData(emptyClient);
    setErrors(EMPTY_ERRORS);
    setError(null);
    photo.reset();
    onClose();
  };
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
 
    // Validación por campo
    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return; // NO cierra el modal
    }
 
    setErrors(EMPTY_ERRORS);
    setError(null);
 
    if (photo.uploading) return;
 
    setSaving(true);
    try {
      await onSave(formData);
      // Solo resetear si fue exitoso
      setFormData(emptyClient);
      setErrors(EMPTY_ERRORS);
      setError(null);
      photo.reset();
    } catch (err: any) {
      // Error del backend — NO cerramos el modal, datos intactos
      const backendMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Error al crear el cliente.';
      setError(backendMessage);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };
 
  if (!isOpen) return null;
 
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={handleClose} />
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">
 
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/10 border bg-emerald-50 border-emerald-100">
              <UserIcon className="text-emerald-600" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">Nuevo Cliente</h3>
              <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">Registrar nuevo cliente en el sistema</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>
 
        {/* ✅ Error global del backend */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
            <AlertCircle size={18} className="flex-shrink-0" /> {error}
          </div>
        )}
 
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30" ref={scrollContainerRef}>
          <ClientForm
            formData={formData}
            onChange={handleChange}
            onSubmit={handleSubmit}
            errors={errors}
            photo={photo}
          />
        </div>
 
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={handleClose} disabled={saving}
            className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all uppercase tracking-widest disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={photo.uploading || saving}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5">
            {photo.uploading
              ? <><Loader2 size={14} className="animate-spin" /> Subiendo foto...</>
              : saving
              ? <><Loader2 size={14} className="animate-spin" /> Guardando...</>
              : <><Save size={16} /> Guardar Cliente</>
            }
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
 