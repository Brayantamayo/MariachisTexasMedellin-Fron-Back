
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Shield } from 'lucide-react';
import { RoleForm } from './RoleForm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const RoleCreateModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const emptyRole = {
    name: '',
    description: '',
    permissions: [] as string[],
    isActive: true
  };

  const [formData, setFormData] = useState(emptyRole);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionToggle = (permId: string) => {
    setFormData(prev => {
      const exists = prev.permissions.includes(permId);
      return {
        ...prev,
        permissions: exists 
          ? prev.permissions.filter(p => p !== permId)
          : [...prev.permissions, permId]
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData(emptyRole);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">
        
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-primary-900/10 border bg-primary-50 border-primary-100">
                <Shield className="text-primary-600" size={20} />
            </div>
            <div>
                <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">Crear Rol</h3>
                <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">Definir nuevos permisos</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-6 custom-scrollbar bg-white">
            <RoleForm 
                formData={formData} 
                onChange={handleChange} 
                onTogglePermission={handlePermissionToggle}
                onSubmit={handleSubmit} 
            />
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
             <button onClick={onClose} className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all uppercase tracking-widest">Cancelar</button>
             <button onClick={handleSubmit} className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-lg shadow-primary-900/20 hover:shadow-primary-900/30 transition-all transform hover:-translate-y-0.5">
                <Save size={16} /> Guardar Rol
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
