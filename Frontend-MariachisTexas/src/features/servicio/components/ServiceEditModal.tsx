import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Edit2, Save, AlertCircle } from 'lucide-react';
import { Service } from '@/types';
import { ServiceForm } from './ServiceForm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Omit<Service, 'id' | 'estado'>) => Promise<void>;
  service: Service | null;
}

const EMPTY_ERRORS: { nombre?: string; descripcion?: string; precio?: string } = {};

export const ServiceEditModal: React.FC<Props> = ({ isOpen, onClose, onSave, service }) => {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [errors, setErrors]     = useState(EMPTY_ERRORS);
  const [formData, setFormData] = useState<Omit<Service, 'id' | 'estado'>>({
    nombre:      '',
    descripcion: '',
    precio:      0,
  });

  // Cargar datos del servicio al abrir — también limpia errores
  useEffect(() => {
    if (service && isOpen) {
      setFormData({
        nombre:      service.nombre,
        descripcion: service.descripcion,
        precio:      service.precio,
      });
      setError(null);
      setErrors(EMPTY_ERRORS);
    }
  }, [service, isOpen]);

  const handleClose = () => {
    setError(null);
    setErrors(EMPTY_ERRORS);
    onClose();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'precio' ? Number(value) : value,
    }));
    // Limpiar error del campo al escribir
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    // Limpiar error general al escribir
    if (error) setError(null);
  };

  const validate = (): { nombre?: string; descripcion?: string; precio?: string } => {
    const newErrors: { nombre?: string; descripcion?: string; precio?: string } = {};

    if (!formData.nombre.trim())
      newErrors.nombre = 'El nombre es obligatorio.';

    const descripcionSinEspacios = formData.descripcion.replace(/\s+/g, '');
    if (!formData.descripcion.trim())
      newErrors.descripcion = 'La descripción es obligatoria.';
    else if (descripcionSinEspacios.length < 10)
      newErrors.descripcion = 'La descripción debe tener al menos 10 caracteres reales.';

    if (formData.precio <= 0)
      newErrors.precio = 'El precio debe ser mayor a 0.';

    return newErrors;
  };

  const handleSave = async () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // ← No cierra el modal, solo muestra errores
    }

    setErrors(EMPTY_ERRORS);
    setError(null);
    setLoading(true);

    try {
      await onSave({
        nombre:      formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        precio:      formData.precio,
      });
      // Solo cerramos si el guardado fue exitoso
      handleClose();
    } catch (err: any) {
      // Error del backend — NO cerramos el modal, datos intactos
      const backendMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Error al guardar los cambios.';
      setError(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !service) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/10 border bg-red-50 border-red-100">
              <Edit2 className="text-red-600" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">
                Editar Servicio
              </h3>
              <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">
                Modifica los detalles del servicio
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

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl flex items-start gap-3 border border-red-100">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <ServiceForm formData={formData} onChange={handleChange} errors={errors} />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all uppercase tracking-widest disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-lg shadow-red-900/20 transition-all disabled:opacity-50"
          >
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Save size={16} />
            }
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};