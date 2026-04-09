// ─── ClientCreateModal.tsx ────────────────────────────────────────────────────
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, User as UserIcon, Camera, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { UserRole } from '@/types';
import { ClientForm } from './ClientForm';
import { usePhotoUpload } from '@/shared/hooks/Usephotoupload .ts';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

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
}

const validate = (data: any): ClientFormErrors => {
  const errors: ClientFormErrors = {};

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

  if (!data.phone?.trim()) {
    errors.phone = 'El teléfono es requerido';
  } else if (!/^3\d{9}$/.test(data.phone.trim())) {
    errors.phone = 'El teléfono debe ser válido';
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
    avatar: ''   // ← URL Cloudinary
  };

  const [formData, setFormData] = useState<any>(emptyClient);
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [saving, setSaving] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const photo = usePhotoUpload({
    folder: 'usuarios/fotos',
    onSuccess: (url) => setFormData((prev: any) => ({ ...prev, avatar: url })),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name as keyof ClientFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleClose = () => {
    setFormData(emptyClient);
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
      await onSave(formData);
      // Solo reiniciar si fue exitoso
      setFormData(emptyClient);
      setErrors({});
      photo.reset();
    } catch (err: any) {
      // NO reiniciar el formulario en caso de error
      const errorMessage = getErrorMessage(err, 'Error al crear el cliente.');
      
      // Mapear campos específicos del error
      const fieldMap: Record<string, keyof ClientFormErrors> = {
        'email': 'email',
        'apellido': 'lastName',
        'lastName': 'lastName',
        'numeroDocumento': 'documentNumber',
        'documentNumber': 'documentNumber',
        'phone': 'phone',
        'telefonoPrincipal': 'phone',
        'name': 'name'
      };

      // Buscar si hay un campo específico en el error
      let foundField = false;
      for (const [key, fieldKey] of Object.entries(fieldMap)) {
        if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
          setErrors({ [fieldKey]: errorMessage });
          foundField = true;
          break;
        }
      }

      // Si no encontró un campo específico, mostrar el error en una alerta
      if (!foundField) {
        setErrors({ email: errorMessage });
      }
      
      // Scroll al primer error
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
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

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30" ref={scrollContainerRef}>

          {/* ── Avatar Cloudinary ──────────────────────────────────────── */}
          <PhotoUploadWidget photo={photo} currentUrl={formData.avatar} />

          <ClientForm
            formData={formData}
            onChange={handleChange}
            onSubmit={handleSubmit}
            errors={errors}
          />
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={handleClose} className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all uppercase tracking-widest">Cancelar</button>
          <button onClick={handleSubmit} disabled={photo.uploading || saving}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5">
            {photo.uploading ? <><Loader2 size={14} className="animate-spin" /> Subiendo foto...</> : saving ? <><Loader2 size={14} className="animate-spin" /> Guardando...</> : <><Save size={16} /> Guardar Cliente</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};


// ─── ClientEditModal.tsx ──────────────────────────────────────────────────────
import { useEffect } from 'react';
import { User } from '@/types';

interface EditProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  client: User | null;
}

export const ClientEditModal: React.FC<EditProps> = ({ isOpen, onClose, onSave, client }) => {
  const [formData, setFormData] = useState<any>(null);

  const photo = usePhotoUpload({
    folder: 'usuarios/fotos',
    onSuccess: (url) => setFormData((prev: any) => ({ ...prev, avatar: url })),
  });

  useEffect(() => {
    if (client && isOpen) {
      setFormData(client);
      photo.reset();
    }
  }, [client, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    onSave(formData);
  };

  if (!isOpen || !formData) return null;

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
              <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">Editar Cliente</h3>
              <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">Actualizar información de {client?.name}</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
          <PhotoUploadWidget photo={photo} currentUrl={formData.avatar} />
          <ClientForm
            formData={formData}
            onChange={handleChange}
            onImageUpload={photo.handleFileChange}
            onSubmit={handleSubmit}
          />
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={handleClose} className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all uppercase tracking-widest">Cancelar</button>
          <button onClick={handleSubmit} disabled={photo.uploading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5">
            {photo.uploading ? <><Loader2 size={14} className="animate-spin" /> Subiendo foto...</> : <><Save size={16} /> Guardar Cambios</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};


// ─── Widget de foto reutilizable (usado en todos los modales) ─────────────────
// Puedes moverlo a src/shared/components/PhotoUploadWidget.tsx

interface PhotoWidgetProps {
  photo:      ReturnType<typeof usePhotoUpload>;
  currentUrl: string;   // URL actual guardada (Cloudinary o vacío)
  size?:      'sm' | 'md';
}

export const PhotoUploadWidget: React.FC<PhotoWidgetProps> = ({ photo, currentUrl, size = 'md' }) => {
  const dim = size === 'sm' ? 'w-20 h-20' : 'w-24 h-24';
  const displayUrl = photo.preview || currentUrl;

  return (
    <div className="flex flex-col items-center gap-2 mb-6">
      <input
        ref={photo.inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={photo.handleFileChange}
      />
      <div
        onClick={photo.triggerPick}
        className={`relative group ${dim} rounded-full border-2 border-dashed overflow-hidden flex items-center justify-center transition-colors
          ${photo.uploading
            ? 'border-primary-300 cursor-wait opacity-70'
            : 'border-slate-200 hover:border-primary-400 cursor-pointer'
          }`}
      >
        {photo.uploading ? (
          <Loader2 size={24} className="animate-spin text-primary-400" />
        ) : displayUrl ? (
          <>
            <img src={displayUrl} alt="Foto" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={20} className="text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-300 group-hover:text-primary-400 transition-colors">
            <Camera size={24} />
          </div>
        )}
      </div>

      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {photo.uploading ? 'Subiendo...' : displayUrl ? 'Cambiar foto' : 'Subir foto'}
      </p>

      {currentUrl && !photo.uploading && !photo.preview && (
        <span className="text-[10px] text-emerald-500 flex items-center gap-1">
          <CheckCircle size={10} /> Foto guardada
        </span>
      )}
      {photo.preview && !photo.uploading && (
        <span className="text-[10px] text-emerald-500 flex items-center gap-1">
          <CheckCircle size={10} /> Foto lista
        </span>
      )}
      {photo.error && (
        <span className="text-[10px] text-red-500 flex items-center gap-1">
          <AlertCircle size={10} /> {photo.error}
        </span>
      )}
      <p className="text-[10px] text-slate-300">JPG, PNG, WEBP · Máx 5MB</p>
    </div>
  );
};