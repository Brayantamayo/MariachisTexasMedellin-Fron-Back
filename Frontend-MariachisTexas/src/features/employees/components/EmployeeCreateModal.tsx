
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Briefcase } from 'lucide-react';
import { UserRole } from '@/types';
import { EmployeeForm } from './EmployeeForm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const EmployeeCreateModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const emptyEmployee = {
    role: UserRole.EMPLEADO,
    name: '',
    lastName: '',
    email: '',
    documentType: 'CC',
    documentNumber: '',
    gender: 'M',
    birthDate: '',
    phone: '',
    secondaryPhone: '',
    city: 'Medellín',
    neighborhood: '',
    address: '',
    password: '',
    confirmPassword: '',
    mainInstrument: '',
    otherInstruments: '', 
    experienceYears: 0,
    avatar: ''
  };

  const [formData, setFormData] = useState<any>(emptyEmployee);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos requeridos
    if (!formData.name || !formData.lastName || !formData.email || !formData.password) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    // Validar campos adicionales requeridos
    if (!formData.documentNumber) {
      alert("Número de documento es requerido");
      return;
    }

    if (!formData.birthDate) {
      alert("Fecha de nacimiento es requerida");
      return;
    }

    if (!formData.phone) {
      alert("Teléfono principal es requerido");
      return;
    }

    if (!formData.neighborhood) {
      alert("Barrio es requerido");
      return;
    }

    if (!formData.address) {
      alert("Dirección es requerida");
      return;
    }

    if (!formData.mainInstrument) {
      alert("Instrumento principal es requerido");
      return;
    }
    
    // Validar que nombre y apellido tengan al menos 2 caracteres
    if (formData.name.trim().length < 2) {
      alert("El nombre debe tener al menos 2 caracteres");
      return;
    }
    
    if (formData.lastName.trim().length < 2) {
      alert("El apellido debe tener al menos 2 caracteres");
      return;
    }

    // Validar que nombre y apellido solo contengan letras y espacios
    const nombreCompleto = `${formData.name} ${formData.lastName}`;
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombreCompleto)) {
      alert("El nombre solo puede contener letras y espacios");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    if (formData.password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    
    // Preparar datos para enviar al backend
    const submission = {
      name: formData.name.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      password: formData.password,
      // Datos adicionales del empleado
      documentType: formData.documentType,
      documentNumber: formData.documentNumber.trim(),
      birthDate: formData.birthDate,
      phone: formData.phone.trim(),
      secondaryPhone: formData.secondaryPhone?.trim() || null,
      city: formData.city.trim(),
      neighborhood: formData.neighborhood.trim(),
      address: formData.address.trim(),
      serviceZone: 'URBANA', // Default por ahora
      mainInstrument: formData.mainInstrument.trim(),
      otherInstruments: formData.otherInstruments?.trim() || null,
      experienceYears: formData.experienceYears || 0,
      avatar: formData.avatar,
      role: formData.role,
    };

    onSave(submission);
    setFormData(emptyEmployee);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
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
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
            <EmployeeForm 
                formData={formData} 
                onChange={handleChange} 
                onImageUpload={handleImageUpload} 
                onSubmit={handleSubmit}
                showPasswordFields={true}
            />
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
             <button type="button" onClick={onClose} className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all uppercase tracking-widest">Cancelar</button>
             <button type="submit" form="employee-form" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-lg shadow-primary-900/20 hover:shadow-primary-900/30 transition-all transform hover:-translate-y-0.5">
                <Save size={16} /> Crear Empleado
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
