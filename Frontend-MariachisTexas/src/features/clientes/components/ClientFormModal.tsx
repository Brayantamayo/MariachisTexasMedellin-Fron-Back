import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, User as UserIcon, MapPin, Phone, Calendar, Hash, Mail, Building, Flag, Camera } from 'lucide-react';
import { User, UserRole } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: any) => void;
  initialData?: User | null;
  isViewOnly?: boolean;
}

export const ClientFormModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialData, isViewOnly = false }) => {
  const emptyClient = {
    role: UserRole.CLIENTE,
    name: '',
    lastName: '',
    email: '',
    documentType: 'CC',
    documentNumber: '',
    birthDate: '',
    phone: '',
    secondaryPhone: '',
    city: 'Medellín',
    neighborhood: '',
    address: '',
    gender: 'O',
    isActive: true,
    avatar: ''
  };

  const [formData, setFormData] = useState<any>(emptyClient);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData(emptyClient);
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (isViewOnly) return;
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Manejador simulado para subir foto
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, avatar: localUrl }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/10 border ${isViewOnly ? 'bg-slate-100 border-slate-200' : 'bg-emerald-50 border-emerald-100'}`}>
                <UserIcon className="text-emerald-600" size={20} />
            </div>
            <div>
                <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">
                    {isViewOnly ? 'Detalle del Cliente' : initialData ? 'Editar Cliente' : 'Nuevo Cliente'}
                </h3>
                <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">
                    Gestión de información de contacto y ubicación
                </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
            <form id="client-form" onSubmit={handleSubmit} className="space-y-8">
                
                {/* 1. Información Personal y Foto */}
                <div>
                    <h4 className="text-xs font-serif font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <UserIcon size={16} className="text-emerald-600" /> Información Personal
                    </h4>
                    
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        
                        {/* Foto de Perfil */}
                        <div className="flex-shrink-0 mx-auto md:mx-0">
                            <div className="relative group cursor-pointer">
                                <div className="w-32 h-32 rounded-full bg-slate-200 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                                    {formData.avatar ? (
                                        <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon size={48} className="text-slate-400" />
                                    )}
                                </div>
                                {!isViewOnly && (
                                    <>
                                        <div className="absolute bottom-0 right-0 bg-emerald-600 p-2 rounded-full text-white shadow-lg hover:bg-emerald-700 transition-colors z-10">
                                            <Camera size={16} />
                                        </div>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleImageUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                                        />
                                    </>
                                )}
                            </div>
                            <p className="text-[10px] text-center text-slate-400 mt-2 font-bold uppercase tracking-wide">
                                {isViewOnly ? 'Foto de Perfil' : 'Subir Foto'}
                            </p>
                        </div>

                        {/* Campos de Información Personal */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                            
                            {/* Nombres */}
                            <div>
                                <label className="label-form">Nombres</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        type="text" 
                                        name="name" 
                                        required 
                                        disabled={isViewOnly} 
                                        value={formData.name} 
                                        onChange={handleChange} 
                                        className="input-form input-icon-padding focus:border-emerald-400 focus:shadow-emerald-100" 
                                    />
                                </div>
                            </div>

                            {/* Apellidos */}
                            <div>
                                <label className="label-form">Apellidos</label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        type="text" 
                                        name="lastName" 
                                        required 
                                        disabled={isViewOnly} 
                                        value={formData.lastName} 
                                        onChange={handleChange} 
                                        className="input-form input-icon-padding focus:border-emerald-400 focus:shadow-emerald-100" 
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="md:col-span-2">
                                <label className="label-form">Correo Electrónico</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input type="email" name="email" required disabled={isViewOnly} value={formData.email} onChange={handleChange} className="input-form input-icon-padding focus:border-emerald-400 focus:shadow-emerald-100" placeholder="cliente@email.com" />
                                </div>
                            </div>

                            {/* Tipo Documento */}
                            <div>
                                <label className="label-form">Tipo Documento</label>
                                <select name="documentType" disabled={isViewOnly} value={formData.documentType} onChange={handleChange} className="input-form focus:border-emerald-400 focus:shadow-emerald-100 appearance-none cursor-pointer">
                                    <option value="CC">Cédula de Ciudadanía</option>
                                    <option value="CE">Cédula de Extranjería</option>
                                    <option value="TI">Tarjeta Identidad</option>
                                    <option value="PAS">Pasaporte</option>
                                </select>
                            </div>

                            {/* No. Documento */}
                            <div>
                                <label className="label-form">Número Documento</label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input type="text" name="documentNumber" required disabled={isViewOnly} value={formData.documentNumber} onChange={handleChange} className="input-form input-icon-padding focus:border-emerald-400 focus:shadow-emerald-100" />
                                </div>
                            </div>

                            {/* Fecha Nacimiento */}
                            <div>
                                <label className="label-form">Fecha Nacimiento</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input type="date" name="birthDate" required disabled={isViewOnly} value={formData.birthDate} onChange={handleChange} className="input-form input-icon-padding focus:border-emerald-400 focus:shadow-emerald-100" />
                                </div>
                            </div>

                             {/* Género */}
                             <div>
                                <label className="label-form">Género</label>
                                <select name="gender" disabled={isViewOnly} value={formData.gender} onChange={handleChange} className="input-form focus:border-emerald-400 focus:shadow-emerald-100 appearance-none cursor-pointer">
                                    <option value="M">Masculino</option>
                                    <option value="F">Femenino</option>
                                    <option value="O">Otro</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-200 w-full"></div>

                {/* 2. Ubicación y Contacto */}
                <div>
                    <h4 className="text-xs font-serif font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <MapPin size={16} className="text-emerald-600" /> Ubicación y Contacto
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        
                        {/* Teléfono */}
                        <div>
                            <label className="label-form">Teléfono Principal</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="tel" name="phone" required disabled={isViewOnly} value={formData.phone} onChange={handleChange} className="input-form input-icon-padding focus:border-emerald-400 focus:shadow-emerald-100" />
                            </div>
                        </div>

                        {/* Segundo Teléfono */}
                        <div>
                            <label className="label-form">Segundo Teléfono</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="tel" name="secondaryPhone" disabled={isViewOnly} value={formData.secondaryPhone} onChange={handleChange} className="input-form input-icon-padding focus:border-emerald-400 focus:shadow-emerald-100" placeholder="Opcional" />
                            </div>
                        </div>

                        {/* Ciudad */}
                        <div>
                            <label className="label-form">Ciudad</label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="text" name="city" required disabled={isViewOnly} value={formData.city} onChange={handleChange} className="input-form input-icon-padding focus:border-emerald-400 focus:shadow-emerald-100" />
                            </div>
                        </div>

                        {/* Barrio */}
                        <div>
                            <label className="label-form">Barrio</label>
                            <input type="text" name="neighborhood" required disabled={isViewOnly} value={formData.neighborhood} onChange={handleChange} className="input-form focus:border-emerald-400 focus:shadow-emerald-100" />
                        </div>

                        {/* Dirección */}
                        <div className="md:col-span-2">
                            <label className="label-form">Dirección Residencial / Evento</label>
                            <input type="text" name="address" required disabled={isViewOnly} value={formData.address} onChange={handleChange} className="input-form focus:border-emerald-400 focus:shadow-emerald-100" placeholder="Ej: Calle 10 # 40-20" />
                        </div>



                    </div>
                </div>

            </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
             <button 
                onClick={onClose}
                className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all uppercase tracking-widest"
            >
                {isViewOnly ? 'Cerrar' : 'Cancelar'}
            </button>
            {!isViewOnly && (
                <button 
                    form="client-form"
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/30 transition-all transform hover:-translate-y-0.5"
                >
                    <Save size={16} />
                    Guardar Cliente
                </button>
            )}
        </div>
      </div>
      <style>{`
        .label-form {
            display: block;
            font-size: 10px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 4px;
            padding-left: 4px;
        }
        .input-form {
            width: 100%;
            padding: 10px 16px;
            border-radius: 12px;
            background-color: white;
            border: 1px solid #e2e8f0;
            color: #334155;
            font-size: 14px;
            outline: none;
            transition: all 0.2s;
        }
        /* Clase específica para corregir la posición del texto cuando hay icono */
        .input-icon-padding {
            padding-left: 44px !important;
        }
        .input-form:disabled {
            background-color: #f8fafc;
            color: #94a3b8;
            cursor: default;
        }
        .input-form:focus {
            box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
        }
      `}</style>
    </div>,
    document.body
  );
};