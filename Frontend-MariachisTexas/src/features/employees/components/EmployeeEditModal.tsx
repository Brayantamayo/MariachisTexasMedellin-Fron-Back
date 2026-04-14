import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Briefcase, Loader2, AlertCircle } from 'lucide-react';
import { User } from '@/types';
import { EmployeeForm } from './EmployeeForm';
import { usePhotoUpload } from '@/shared/hooks/Usephotoupload .ts';
import { PhotoUploadWidget } from '@/shared/components/Photouploadwidget .tsx';

interface Props {
  isOpen:    boolean;
  onClose:   () => void;
  onSave:    (data: any) => Promise<void>;
  employee:  User | null;
}

type EmployeeFormErrors = Partial<Record<string, string>>;
const EMPTY_ERRORS: EmployeeFormErrors = {};

const validate = (data: any): EmployeeFormErrors => {
  const errors: EmployeeFormErrors = {};

  if (!data.email?.trim()) errors.email = 'El correo es requerido';
  if (!data.name?.trim()) errors.name = 'El nombre es requerido';
  if (!data.lastName?.trim()) errors.lastName = 'El apellido es requerido';
  if (!data.documentNumber?.trim()) errors.documentNumber = 'El número de documento es requerido';
  if (!data.phone?.trim()) errors.phone = 'El teléfono es requerido';

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
      errors.birthDate = 'El empleado debe ser mayor de 18 años';
    }
  }

  if (data.experienceYears !== undefined && data.experienceYears !== '' && data.experienceYears !== null) {
    const exp = Number(data.experienceYears);
    if (exp < 0) {
      errors.experienceYears = 'La experiencia no puede ser negativa';
    }
  }

  return errors;
};


export const EmployeeEditModal: React.FC<Props> = ({ isOpen, onClose, onSave, employee }) => {
  const [formData, setFormData] = useState<any>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [errors,   setErrors]   = useState<EmployeeFormErrors>(EMPTY_ERRORS);
   const [saving,   setSaving]   = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const photo = usePhotoUpload({
    folder: 'empleados/fotos',
    onSuccess: (url) => setFormData((prev: any) => ({ ...prev, avatar: url })),
  });

  useEffect(() => {
    if (employee && isOpen) {
      setFormData({
        ...employee,
        password:         '',
        confirmPassword:  '',
        otherInstruments: Array.isArray(employee.otherInstruments)
          ? employee.otherInstruments.join(', ')
          : employee.otherInstruments || '',
      });
      setError(null);
      setErrors(EMPTY_ERRORS);
    }
  }, [employee, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (photo.uploading) return;

    setSaving(true);
    try {
      const submission = { ...formData };

      if (submission.otherInstruments && typeof submission.otherInstruments === 'string') {
        submission.otherInstruments = submission.otherInstruments
          .split(',')
          .map((i: string) => i.trim())
          .filter(Boolean);
      }

      if (!submission.password) delete submission.password;
      delete submission.confirmPassword;

      await onSave(submission);
    } catch (err: any) {
      const backendMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Error al actualizar el empleado.';
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

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-primary-900/10 border bg-primary-50 border-primary-100">
              <Briefcase className="text-primary-600" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">Editar Empleado</h3>
              <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">
                Modificar datos de {employee?.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error global del backend */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
            <AlertCircle size={18} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30" ref={scrollContainerRef}>
          <PhotoUploadWidget photo={photo} currentUrl={formData.avatar} />
          <EmployeeForm
            formData={formData}
            onChange={handleChange}
            onSubmit={handleSubmit}
            showPasswordFields={false}
            errors={errors}
          />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={saving}
            className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all uppercase tracking-widest disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={photo.uploading || saving}
            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-lg shadow-primary-900/20 hover:shadow-primary-900/30 transition-all transform hover:-translate-y-0.5"
          >
            {photo.uploading
              ? <><Loader2 size={14} className="animate-spin" /> Subiendo...</>
              : saving
              ? <><Loader2 size={14} className="animate-spin" /> Guardando...</>
              : <><Save size={16} /> Guardar Cambios</>
            }
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};