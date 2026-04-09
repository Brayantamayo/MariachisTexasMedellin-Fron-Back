// ─── EmployeeCreateModal.tsx ──────────────────────────────────────────────────
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Briefcase, Loader2, AlertCircle } from 'lucide-react';
import { UserRole } from '@/types';
import { EmployeeForm } from './EmployeeForm';
import { usePhotoUpload } from '@/shared/hooks/Usephotoupload .ts';
import { PhotoUploadWidget } from '@/shared/components/Photouploadwidget .tsx';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

interface CreateProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export interface EmployeeFormErrors {
  email?: string;
  name?: string;
  lastName?: string;
  documentNumber?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
}

const validate = (data: any): EmployeeFormErrors => {
  const errors: EmployeeFormErrors = {};

  if (!data.email?.trim()) {
    errors.email = 'El correo es requerido';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = 'El correo no es válido';
  }

  if (!data.name?.trim()) {
    errors.name = 'El nombre es requerido';
  } else if (data.name.trim().length < 2) {
    errors.name = 'El nombre debe tener al menos 2 caracteres';
  }

  if (!data.lastName?.trim()) {
    errors.lastName = 'El apellido es requerido';
  } else if (data.lastName.trim().length < 2) {
    errors.lastName = 'El apellido debe tener al menos 2 caracteres';
  }

  if (!data.documentNumber?.trim()) {
    errors.documentNumber = 'El número de documento es requerido';
  } else if (!/^\d{6,12}$/.test(data.documentNumber.trim())) {
    errors.documentNumber = 'El documento debe tener 6-12 dígitos';
  }

  if (!data.password) {
    errors.password = 'La contraseña es requerida';
  } else if (data.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres';
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = 'Confirma la contraseña';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden';
  }

  if (!data.phone?.trim()) {
    errors.phone = 'El teléfono es requerido';
  } else if (!/^3\d{9}$/.test(data.phone.trim())) {
    errors.phone = 'El teléfono debe ser válido';
  }

  return errors;
};

export const EmployeeCreateModal: React.FC<CreateProps> = ({ isOpen, onClose, onSave }) => {
  const emptyEmployee = {
    role: UserRole.EMPLEADO,
    name: '', lastName: '', email: '',
    documentType: 'CC', documentNumber: '',
    gender: 'M', birthDate: '', phone: '', secondaryPhone: '',
    city: 'Medellín', neighborhood: '', address: '',
    password: '', confirmPassword: '',
    mainInstrument: '', otherInstruments: '',
    experienceYears: 0,
    avatar: ''   // ← URL Cloudinary
  };

  const [formData, setFormData] = useState<any>(emptyEmployee);
  const [errors, setErrors] = useState<EmployeeFormErrors>({});
  const [saving, setSaving] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const photo = usePhotoUpload({
    folder: 'usuarios/fotos',
    onSuccess: (url) => setFormData((prev: any) => ({ ...prev, avatar: url })),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name as keyof EmployeeFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleClose = () => {
    setFormData(emptyEmployee);
    setErrors({});
    photo.reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validación por campo
    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (photo.uploading) return;

    setSaving(true);
    try {
      const submission = {
        name:             formData.name.trim(),
        lastName:         formData.lastName.trim(),
        email:            formData.email.trim(),
        password:         formData.password,
        documentType:     formData.documentType,
        documentNumber:   formData.documentNumber.trim(),
        birthDate:        formData.birthDate,
        phone:            formData.phone.trim(),
        secondaryPhone:   formData.secondaryPhone?.trim() || null,
        city:             formData.city.trim(),
        neighborhood:     formData.neighborhood.trim(),
        address:          formData.address.trim(),
        serviceZone:      'URBANA',
        mainInstrument:   formData.mainInstrument.trim(),
        otherInstruments: formData.otherInstruments?.trim() || null,
        experienceYears:  formData.experienceYears || 0,
        avatar:           formData.avatar,
        role:             formData.role,
      };

      await onSave(submission);
      // Solo resetear si se guarda exitosamente
      setFormData(emptyEmployee);
      setErrors({});
      photo.reset();
    } catch (err: any) {
      console.error('Error al crear empleado:', err);
      const errorMessage = getErrorMessage(err, 'Error al crear el empleado.');
      // Si hay error del servidor en un campo específico, mostrar en ese campo
      if (err.response?.data?.field) {
        setErrors({ [err.response.data.field]: errorMessage });
      } else {
        // Si no, mostrar email como error general
        setErrors({ email: errorMessage });
      }
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
              <Briefcase className="text-primary-600" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">Nuevo Empleado</h3>
              <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">Gestión de personal y músicos</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30" ref={scrollContainerRef}>
          <PhotoUploadWidget photo={photo} currentUrl={formData.avatar} />
          <EmployeeForm
            formData={formData}
            onChange={handleChange}
            onSubmit={handleSubmit}
            showPasswordFields={true}
            errors={errors}
          />
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={handleClose} className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all uppercase tracking-widest">Cancelar</button>
          <button type="submit" form="employee-form" disabled={photo.uploading || saving}
            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5">
            {photo.uploading ? <><Loader2 size={14} className="animate-spin" /> Subiendo foto...</> : saving ? <><Loader2 size={14} className="animate-spin" /> Guardando...</> : <><Save size={16} /> Crear Empleado</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};


// ─── EmployeeEditModal.tsx ────────────────────────────────────────────────────
import { useEffect } from 'react';
import { User } from '@/types';

interface EditProps {
  isOpen:    boolean;
  onClose:   () => void;
  onSave:    (data: any) => void;
  employee:  User | null;
}

export const EmployeeEditModal: React.FC<EditProps> = ({ isOpen, onClose, onSave, employee }) => {
  const [formData, setFormData] = useState<any>(null);

  const photo = usePhotoUpload({
    folder: 'usuarios/fotos',
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
          : employee.otherInstruments || ''
      });
      photo.reset();
    }
  }, [employee, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    photo.reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (photo.uploading) return;

    const submission = { ...formData };
    if (submission.otherInstruments && typeof submission.otherInstruments === 'string') {
      submission.otherInstruments = submission.otherInstruments.split(',').map((i: string) => i.trim());
    }
    if (!submission.password) delete submission.password;
    delete submission.confirmPassword;

    onSave(submission);
  };

  if (!isOpen || !formData) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={handleClose} />
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">

        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-primary-900/10 border bg-primary-50 border-primary-100">
              <Briefcase className="text-primary-600" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">Editar Empleado</h3>
              <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">Modificar datos de {employee?.name}</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
          <PhotoUploadWidget photo={photo} currentUrl={formData.avatar} />
          <EmployeeForm
            formData={formData}
            onChange={handleChange}
            onSubmit={handleSubmit}
            showPasswordFields={false}
          />
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={handleClose} className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all uppercase tracking-widest">Cancelar</button>
          <button onClick={handleSubmit} disabled={photo.uploading}
            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5">
            {photo.uploading ? <><Loader2 size={14} className="animate-spin" /> Subiendo foto...</> : <><Save size={16} /> Guardar Cambios</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};