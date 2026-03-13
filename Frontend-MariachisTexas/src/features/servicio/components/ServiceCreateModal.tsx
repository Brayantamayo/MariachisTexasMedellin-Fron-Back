import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Save, AlertCircle } from 'lucide-react';
import { Service } from '@/types';
import { ServiceForm } from './ServiceForm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Omit<Service, 'id' | 'estado'>) => Promise<void>;
}

export const ServiceCreateModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Service, 'id' | 'estado'>>({
    nombre:      '',
    descripcion: '',
    precio:      0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'precio' ? Number(value) : value
    }));
  };

  const handleSave = async () => {
    if (!formData.nombre.trim() || !formData.descripcion.trim() || formData.precio <= 0) {
      setError('Por favor complete todos los campos obligatorios.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await onSave(formData);
      onClose();
      setFormData({ nombre: '', descripcion: '', precio: 0 })
    } catch (error) {
      console.error(error);
      setError('Error al guardar el servicio.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/10 border bg-red-50 border-red-100">
                    <Plus className="text-red-600" size={20} />
                </div>
                <div>
                    <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">Nuevo Servicio</h3>
                    <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">Añade un servicio al catálogo</p>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
                <X size={20} />
            </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-3 border border-red-100">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}
            <ServiceForm formData={formData} onChange={handleChange} />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all uppercase tracking-widest">Cancelar</button>
            <button 
                onClick={handleSave} 
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-lg shadow-red-900/20 transition-all disabled:opacity-50"
            >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                Guardar Servicio
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};