
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, UserCog, Loader2 } from 'lucide-react';
import { User } from '@/types';
import { UserForm } from './UserForm';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  user: User | null;
}

export const UserEditModal: React.FC<Props> = ({ isOpen, onClose, onSave, user }) => {
  const [formData, setFormData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
        setFormData({
            ...user,
            password: '', 
            confirmPassword: '',
            otherInstruments: Array.isArray(user.otherInstruments) 
                ? user.otherInstruments.join(', ') 
                : user.otherInstruments || ''
        });
    }
  }, [user, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, avatar: localUrl }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const submission = { ...formData };
    
    // Array handling
    if (submission.otherInstruments && typeof submission.otherInstruments === 'string') {
        submission.otherInstruments = submission.otherInstruments.split(',').map((i: string) => i.trim());
    }
    
    // Clean passwords if empty (not changing)
    if (!submission.password) {
        delete submission.password;
    }
    delete submission.confirmPassword;

    setSaving(true);
    try {
      await onSave(submission);
      setError(null);
    } catch (err: any) {
      const errorMessage = getErrorMessage(err, 'Error al actualizar el usuario.');
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !formData) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
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
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-900 font-medium">{error}</p>
              </div>
            )}
            <UserForm 
                formData={formData} 
                onChange={handleChange} 
                onSubmit={handleSubmit}
                showPasswordFields={false} // Hidden by default on edit unless we want to allow reset
            />
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
             <button onClick={onClose} className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all uppercase tracking-widest">Cancelar</button>
             <button onClick={handleSubmit} disabled={saving} className="bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-lg shadow-primary-900/20 hover:shadow-primary-900/30 transition-all transform hover:-translate-y-0.5">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Guardando...</> : <><Save size={16} /> Guardar Cambios</>}
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
