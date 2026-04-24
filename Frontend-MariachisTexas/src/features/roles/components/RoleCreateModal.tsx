import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Save, Shield, X } from 'lucide-react';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';
import { RoleForm, RoleFormErrors } from './RoleForm';
import { roleService } from '../services/roleService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void> | void;
}

const emptyRole = {
  name: '',
  description: '',
  permissions: [] as string[],
  isActive: true,
};

const FIELD_ORDER: (keyof RoleFormErrors)[] = ['name', 'description', 'permissions'];

const validateRole = (data: typeof emptyRole): RoleFormErrors => {
  const errors: RoleFormErrors = {};

  if (!data.name.trim()) {
    errors.name = 'El nombre del rol es obligatorio.';
  } else if (data.name.trim().length < 2) {
    errors.name = 'El nombre del rol debe tener al menos 2 caracteres.';
  }

  if (data.permissions.length === 0) {
    errors.permissions = 'Selecciona al menos un modulo para este rol.';
  }

  return errors;
};

const mapBackendErrorToFields = (message: string): RoleFormErrors => {
  const normalized = message.toLowerCase();

  if (
    normalized.includes('nombre del rol') ||
    normalized.includes('ya existe un rol') ||
    normalized.includes('nombre solo puede') ||
    normalized.includes('texto sin sentido')
  ) {
    return { name: message };
  }

  if (normalized.includes('descripcion')) {
    return { description: message };
  }

  if (normalized.includes('permiso') || normalized.includes('modulo')) {
    return { permissions: message };
  }

  return {};
};

export const RoleCreateModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState(emptyRole);
  const [errors, setErrors] = useState<RoleFormErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (!isOpen) return;

    setFormData(emptyRole);
    setErrors({});
    setGlobalError(null);
    setSaving(false);
    setLoadingPermissions(true);

    roleService
      .getPermissions()
      .catch(err => console.error('Error cargando permisos:', err))
      .finally(() => setLoadingPermissions(false));
  }, [isOpen]);

  const registerFieldRef = (field: string, el: HTMLElement | null) => {
    fieldRefs.current[field] = el;
  };

  const scrollToFirstError = (validationErrors: RoleFormErrors) => {
    const firstField = FIELD_ORDER.find(field => validationErrors[field]);
    if (!firstField) return;

    const element = fieldRefs.current[firstField];
    if (!element || !scrollContainerRef.current) return;

    const containerTop = scrollContainerRef.current.getBoundingClientRect().top;
    const elementTop = element.getBoundingClientRect().top;
    const offset = elementTop - containerTop + scrollContainerRef.current.scrollTop - 24;

    scrollContainerRef.current.scrollTo({ top: offset, behavior: 'smooth' });
    setTimeout(() => element.focus?.(), 250);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setGlobalError(null);

    if (errors[name as keyof RoleFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePermissionToggle = (moduleId: string) => {
    setFormData(prev => {
      const exists = prev.permissions.includes(moduleId);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter(permission => permission !== moduleId)
          : [...prev.permissions, moduleId],
      };
    });

    setGlobalError(null);
    if (errors.permissions) {
      setErrors(prev => ({ ...prev, permissions: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    const validationErrors = validateRole(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      scrollToFirstError(validationErrors);
      return;
    }

    setSaving(true);
    try {
      await onSave({
        nombre: formData.name.trim(),
        descripcion: formData.description.trim(),
        estado: formData.isActive,
        permisos: formData.permissions,
      });
    } catch (error) {
      const message = getErrorMessage(error, 'Error al guardar el rol.');
      const fieldErrors = mapBackendErrorToFields(message);

      if (Object.keys(fieldErrors).length > 0) {
        setErrors(prev => ({ ...prev, ...fieldErrors }));
        scrollToFirstError(fieldErrors);
      } else {
        setGlobalError(message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (saving) return;
    setFormData(emptyRole);
    setErrors({});
    setGlobalError(null);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-fade-in-up">
        <div className="flex items-center justify-between border-b border-slate-100 bg-white p-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary-100 bg-primary-50 shadow-lg">
              <Shield className="text-primary-600" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold uppercase tracking-wide text-slate-800">
                Crear Rol
              </h3>
              <p className="mt-0.5 text-xs font-medium tracking-wide text-slate-500">
                Definir nuevos permisos
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg bg-slate-50 p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {globalError && (
          <div className="mx-6 mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{globalError}</span>
          </div>
        )}

        <div ref={scrollContainerRef} className="custom-scrollbar flex-1 overflow-y-auto bg-white p-6">
          <RoleForm
            formData={formData}
            onChange={handleChange}
            onTogglePermission={handlePermissionToggle}
            onSubmit={handleSubmit}
            loadingPermissions={loadingPermissions}
            errors={errors}
            registerFieldRef={registerFieldRef}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 p-6">
          <button
            onClick={handleClose}
            disabled={saving}
            className="rounded-xl px-6 py-3 text-xs font-bold uppercase tracking-widest text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-8 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} /> Guardar Rol
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
