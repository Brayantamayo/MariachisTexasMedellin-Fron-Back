import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, UserPlus, Loader2, AlertCircle } from 'lucide-react';
import { UserRole } from '@/types';
import { UserForm, DynamicRole } from './UserForm';
import { usePhotoUpload } from '@/shared/hooks/Usephotoupload .ts';
import { PhotoUploadWidget } from '@/shared/components/Photouploadwidget .tsx';
import api from '@/shared/api/api';

interface CreateProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export interface UserFormErrors {
  [key: string]: string | undefined;
}

const EMPTY_ERRORS: UserFormErrors = {};

export const UserCreateModal: React.FC<CreateProps> = ({ isOpen, onClose, onSave }) => {
  const buildEmpty = (firstRoleId = '') => ({
    roleId: firstRoleId,
    role: UserRole.CLIENTE,
    name: '', lastName: '', email: '',
    documentType: 'CC', documentNumber: '',
    gender: 'M', birthDate: '', phone: '', secondaryPhone: '',
    city: 'Medellín', neighborhood: '', address: '',
    password: '', confirmPassword: '',
    mainInstrument: '', otherInstruments: '',
    experienceYears: 0,
    avatar: ''
  });

  const [formData, setFormData]             = useState<any>(buildEmpty());
  const [errors,   setErrors]               = useState<UserFormErrors>(EMPTY_ERRORS);
  const [error,    setError]                = useState<string | null>(null);
  const [saving,   setSaving]               = useState(false);
  const [availableRoles, setAvailableRoles] = useState<DynamicRole[]>([]);
  const [loadingRoles, setLoadingRoles]     = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const photo = usePhotoUpload({
    folder: 'usuarios/fotos',
    onSuccess: (url) => setFormData((prev: any) => ({ ...prev, avatar: url })),
  });

  // Cargar todos los roles activos al abrir
  useEffect(() => {
    if (!isOpen) return;
    setLoadingRoles(true);
    api.get('/roles/public/list')
      .then(({ data }) => {
        const mapped: DynamicRole[] = (data as any[])
          .filter(r => r.isActive)
          .map(r => ({ id: String(r.id), name: r.name, description: r.description ?? '' }));
        setAvailableRoles(mapped);
        // Preseleccionar primer rol y resetear form
        const firstId = mapped[0]?.id ?? '';
        setFormData(buildEmpty(firstId));
      })
      .catch(err => console.error('Error cargando roles:', err))
      .finally(() => setLoadingRoles(false));
    setErrors(EMPTY_ERRORS);
    setError(null);
    photo.reset();
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    if (errors[name as keyof UserFormErrors])
      setErrors(prev => ({ ...prev, [name]: undefined }));
    if (error) setError(null);
  };

  const handleClose = () => {
    setFormData(buildEmpty());
    setErrors(EMPTY_ERRORS);
    setError(null);
    photo.reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(EMPTY_ERRORS);
    setError(null);
    if (photo.uploading) return;

    setSaving(true);
    try {
      const submission = { ...formData };
      if (submission.otherInstruments && typeof submission.otherInstruments === 'string') {
        submission.otherInstruments = submission.otherInstruments.split(',').map((i: string) => i.trim());
      }
      delete submission.confirmPassword;

      // Resolver nombre del rol para lógica condicional (perfil musical, etc.)
      const selectedRole = availableRoles.find(r => r.id === submission.roleId);
      if (selectedRole) submission.role = selectedRole.name as UserRole;

      await onSave(submission);
      setFormData(buildEmpty(availableRoles[0]?.id ?? ''));
      setErrors(EMPTY_ERRORS);
      setError(null);
      photo.reset();
    } catch (err: any) {
      const data = err?.response?.data;
      const message = data?.message || err?.message || 'Error al crear el usuario.';
      // Intentar mapear error de campo específico
      const fieldMap: Record<string, string> = {
        nombre: 'name', email: 'email', password: 'password',
        numeroDocumento: 'documentNumber', telefonoPrincipal: 'phone',
        fechaNacimiento: 'birthDate', apellido: 'lastName',
      };
      const fieldKey = data?.field ? fieldMap[data.field] ?? data.field : null;
      if (fieldKey) {
        setErrors({ [fieldKey]: message });
      } else {
        setError(message);
      }
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
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-primary-900/10 border bg-primary-50 border-primary-100">
              <UserPlus className="text-primary-600" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">Nuevo Usuario</h3>
              <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">Crear cuenta de acceso y perfil</p>
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
            showPasswordFields={true}
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
              ? <><Loader2 size={14} className="animate-spin" /> Subiendo foto...</>
              : saving
              ? <><Loader2 size={14} className="animate-spin" /> Guardando...</>
              : <><Save size={16} /> Crear Usuario</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
