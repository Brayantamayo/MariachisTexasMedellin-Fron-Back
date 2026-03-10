
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Shield, Check, Lock, XCircle } from 'lucide-react';
import { Role } from '@/types';
import { AVAILABLE_MODULES } from '../data/permissions';
import { RoleForm } from './RoleForm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleData: Omit<Role, 'id' | 'createdAt'>) => void;
  initialData?: Role | null;
  isViewOnly?: boolean;
}

export const RoleFormModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialData, isViewOnly = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    isActive: true
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        permissions: initialData.permissions,
        isActive: initialData.isActive
      });
    } else {
      setFormData({ name: '', description: '', permissions: [], isActive: true });
    }
  }, [initialData, isOpen]);

  const handlePermissionToggle = (moduleId: string) => {
    if (isViewOnly) return;
    setFormData(prev => {
      const exists = prev.permissions.includes(moduleId);
      return {
        ...prev,
        permissions: exists 
          ? prev.permissions.filter(p => p !== moduleId)
          : [...prev.permissions, moduleId]
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop con blur ligero */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden ring-1 ring-slate-900/5">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-primary-900/10 border ${isViewOnly ? 'bg-slate-100 border-slate-200' : 'bg-primary-50 border-primary-100'}`}>
                {isViewOnly ? <Lock className="text-slate-500" size={20} /> : <Shield className="text-primary-600" size={20} />}
            </div>
            <div>
                <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">
                    {isViewOnly ? 'Detalles del Rol' : initialData ? 'Editar Rol' : 'Crear Rol'}
                </h3>
                <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">
                    {isViewOnly ? 'Modo de solo lectura' : 'Define los módulos permitidos para este rol'}
                </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-6 custom-scrollbar bg-white">
            
            {isViewOnly ? (
                <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Nombre</h4>
                        <p className="text-lg font-bold text-slate-800 mb-2">{formData.name}</p>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Descripción</h4>
                        <p className="text-sm text-slate-600">{formData.description}</p>
                    </div>
                    
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Acceso a Módulos</h4>
                        <div className="grid grid-cols-2 gap-3">
                            {AVAILABLE_MODULES.map(mod => {
                                const allowed = formData.permissions.includes(mod.id);
                                return (
                                    <div key={mod.id} className={`flex items-center gap-3 p-3 rounded-lg border ${allowed ? 'bg-white border-emerald-200' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${allowed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                            {allowed ? <Check size={14} strokeWidth={3} /> : <XCircle size={14} />}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${allowed ? 'text-slate-800' : 'text-slate-500'}`}>{mod.label}</p>
                                            <p className="text-[10px] text-slate-400">{allowed ? 'Permitido' : 'Denegado'}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                <RoleForm 
                    formData={formData}
                    onChange={(e: any) => setFormData({...formData, [e.target.name]: e.target.value})}
                    onTogglePermission={handlePermissionToggle}
                    onSubmit={handleSubmit}
                />
            )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            {isViewOnly ? (
                <button 
                    onClick={onClose}
                    className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-3 px-6 rounded-xl transition-all uppercase text-xs tracking-widest shadow-sm"
                >
                    Cerrar Detalle
                </button>
            ) : (
                <>
                    <button 
                        onClick={onClose}
                        className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all uppercase tracking-widest"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSubmit}
                        className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-lg shadow-primary-900/20 hover:shadow-primary-900/30 transition-all transform hover:-translate-y-0.5"
                    >
                        <Save size={16} />
                        Guardar Rol
                    </button>
                </>
            )}
        </div>
      </div>
    </div>,
    document.body
  );
};
