import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Shield } from 'lucide-react';
import { Role } from '@/types';
import { RoleForm } from './RoleForm';
import { roleService } from '../services/roleService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  role: Role | null;
}

export const RoleEditModal: React.FC<Props> = ({ isOpen, onClose, onSave, role }) => {
  const [formData, setFormData]                     = useState<any>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  useEffect(() => {
    if (!isOpen || !role) return;
    setLoadingPermissions(true);
    // Precarga cache y luego inicializa formData con los permisos actuales del rol
    roleService.getPermissions()
      .catch(err => console.error('Error cargando permisos:', err))
      .finally(() => setLoadingPermissions(false));

    // role.permissions ya viene como nombres de módulo desde el backend (mapToRole)
    setFormData({
      name:        role.name,
      description: role.description,
      permissions: role.permissions,   // string[] de nombres
      isActive:    role.isActive,
    });
  }, [role, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handlePermissionToggle = (moduleId: string) => {
    setFormData((prev: any) => {
      const exists = prev.permissions.includes(moduleId);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p: string) => p !== moduleId)
          : [...prev.permissions, moduleId],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Enviamos nombres; roleService.updateRole los traduce a IDs
    onSave({
      nombre:      formData.name,
      descripcion: formData.description,
      estado:      formData.isActive,
      permisos:    formData.permissions,
    });
  };

  if (!isOpen || !formData) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">

        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg bg-primary-50 border border-primary-100">
              <Shield className="text-primary-600" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">Editar Rol</h3>
              <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">Modificar permisos de {role?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
          <RoleForm
            formData={formData}
            onChange={handleChange}
            onTogglePermission={handlePermissionToggle}
            onSubmit={handleSubmit}
            loadingPermissions={loadingPermissions}
          />
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all uppercase tracking-widest">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-lg transition-all hover:-translate-y-0.5">
            <Save size={16} /> Actualizar Rol
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
