import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, UserCog, Loader2, AlertCircle } from 'lucide-react';
import { User, UserRole } from '@/types';
import { UserForm, DynamicRole } from './UserForm';
import { usePhotoUpload } from '@/shared/hooks/Usephotoupload .ts';
import { PhotoUploadWidget } from '@/shared/components/Photouploadwidget .tsx';
import api from '@/shared/api/api';

interface Props {
  isOpen:  boolean;
  onClose: () => void;
  onSave:  (data: any) => Promise<void>;
  user:    User | null;
}

type UserFormErrors = Partial<Record<string, string>>;
const EMPTY_ERRORS: UserFormErrors = {};

export const UserEditModal: React.FC<Props> = ({ isOpen, onClose, onSave, user }) => {
  const [formData, setFormData]             = useState<any>(null);
  const [error,    setError]                = useState<string | null>(null);
  const [errors,   setErrors]               = useState<UserFormErrors>(EMPTY_ERRORS);
  const [saving,   setSaving]               = useState(false);
  const [availableRoles, setAvailableRoles] = useState<DynamicRole[]>([]);
  const [loadingRoles, setLoadingRoles]     = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const photo = usePhotoUpload({
    folder: 'usuarios/fotos',
    onSuccess: (url) => setFormData((prev: any) => ({ ...prev, avatar: url })),
  });

  useEffect(() => {
    if (!isOpen || !user) return;

    setLoadingRoles(true);
    api.get('/roles/public/list')
      .then(({ data }) => {
        const mapped: DynamicRole[] = (data as any[])
          .filter(r => r.isActive)
          .map(r => ({ id: String(r.id), name: r.name, description: r.description ?? '' }));
        setAvailableRoles(mapped);

        // Buscar el roleId actual del usuario por nombre de rol
        const currentRole = mapped.find(r => r.name === user.role);
        setFormData({
          ...user,
          roleId:           currentRole?.id ?? mapped[0]?.id ?? '',
          password:         '',
          confirmPassword:  '',
          otherInstruments: Array.isArray(user.otherInstruments)
            ? user.otherInstruments.join(', ')
            : user.otherInstruments || '',
        });
      })
      .catch(err => {
        console.error('Error cargando roles:', err);
        // Fallback sin roles dinámicos
        setFormData({
          ...user,
          password:         '',
          confirmPassword:  '',
          otherInstruments: Array.isArray(user.otherInstruments)
            ? user.otherInstruments.join(', ')
            : user.otherInstruments || '',
        });
      })
      .finally(() => setLoadingRoles(false));

    setError(null);
    setErrors(EMPTY_ERRORS);
    photo.reset();
  }, [user, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
    if (error)        setError(null);
  };

  const handleClose = () => {
    setError(null);
    setErrors(EMPTY_ERRORS);
    photo.reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (photo.uploading) return;

    setSaving(true);
    try {
      const submission = { ...formData };

      if (submission.otherInstruments && typeof submission.otherInstruments === 'string') {
        submission.otherInstruments = submission.otherInstruments
          .split(',').map((i: string) => i.trim()).filter(Boolean);
      }
      if (!submission.password) delete submission.password;
      delete submission.confirmPassword;

      // Resolver nombre del rol para lógica condicional
      const selectedRole = availableRoles.find(r => r.id === submission.roleId);
      if (selectedRole) submission.role = selectedRole.name as UserRole;

      await onSave(submission);
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message || err?.message || 'Error al actualizar el usuario.';
      setError(backendMessage);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !formData) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={handleClose} />
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">

        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-primary-900/10 border bg-primary-50 border-primary-100">
              <UserCog className="text-primary-600" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">Editar Usuario</h3>
              <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">Modificar datos de {user?.name}</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
            <AlertCircle size={18} className="flex-shrink-0" /> {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30" ref={scrollContainerRef}>
          <PhotoUploadWidget photo={photo} currentUrl={formData.avatar} />
          <UserForm
            formData={formData}
            onChange={handleChange}
            onSubmit={handleSubmit}
            showPasswordFields={false}
            errors={errors}
            availableRoles={availableRoles}
            loadingRoles={loadingRoles}
          />
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={handleClose} disabled={saving}
            className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all uppercase tracking-widest disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={photo.uploading || saving}
            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5">
            {photo.uploading
              ? <><Loader2 size={14} className="animate-spin" /> Subiendo...</>
              : saving
              ? <><Loader2 size={14} className="animate-spin" /> Guardando...</>
              : <><Save size={16} /> Guardar Cambios</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
