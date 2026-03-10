import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, User as UserIcon, Camera, Lock, Music, MapPin, Phone, Mail, FileText, Calendar, Hash } from 'lucide-react';
import { User, UserRole } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: any) => void;
  initialData?: User | null;
  isViewOnly?: boolean;
}

export const UserFormModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialData, isViewOnly = false }) => {
  // Estado inicial vacío
  const emptyUser = {
    role: UserRole.CLIENTE,
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
    // Campos Músico
    mainInstrument: '',
    otherInstruments: '', // String separado por comas para el input
    experienceYears: 0
  };

  const [formData, setFormData] = useState<any>(emptyUser);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        password: '', // No mostrar contraseña al editar
        confirmPassword: '',
        otherInstruments: Array.isArray(initialData.otherInstruments) 
            ? initialData.otherInstruments.join(', ') 
            : initialData.otherInstruments || ''
      });
    } else {
      setFormData(emptyUser);
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (isViewOnly) return;
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación de contraseña solo al crear
    if (!initialData && formData.password !== formData.confirmPassword) {
        alert("Las contraseñas no coinciden");
        return;
    }

    // Formatear datos antes de enviar
    const submissionData = { ...formData };
    
    // Convertir instrumentos string a array
    if (submissionData.otherInstruments && typeof submissionData.otherInstruments === 'string') {
        submissionData.otherInstruments = submissionData.otherInstruments.split(',').map((i: string) => i.trim());
    }
    
    // Eliminar confirmPassword
    delete submissionData.confirmPassword;

    onSave(submissionData);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-primary-900/10 border ${isViewOnly ? 'bg-slate-100 border-slate-200' : 'bg-primary-50 border-primary-100'}`}>
                <UserIcon className="text-primary-600" size={20} />
            </div>
            <div>
                <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">
                    {isViewOnly ? 'Detalles del Usuario' : initialData ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                </h3>
                <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">
                    {isViewOnly ? 'Visualización de perfil completo' : 'Complete la información requerida'}
                </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
            <form id="user-form" onSubmit={handleSubmit} className="space-y-8">
                
                {/* 1. Foto y Rol */}
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Foto */}
                    <div className="flex-shrink-0 mx-auto md:mx-0">
                        <div className="relative group cursor-pointer">
                            <div className="w-32 h-32 rounded-full bg-slate-200 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                                {initialData?.avatar ? (
                                    <img src={initialData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon size={48} className="text-slate-400" />
                                )}
                            </div>
                            {!isViewOnly && (
                                <div className="absolute bottom-0 right-0 bg-primary-600 p-2 rounded-full text-white shadow-lg hover:bg-primary-700 transition-colors">
                                    <Camera size={16} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Datos de Cuenta */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                         <div className="md:col-span-2">
                             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 mb-1 block">Tipo de Usuario</label>
                             <select 
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                disabled={isViewOnly}
                                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 focus:ring-2 focus:ring-primary-100 outline-none font-medium"
                             >
                                 <option value={UserRole.CLIENTE}>Cliente</option>
                                 <option value={UserRole.EMPLEADO}>Músico / Empleado</option>
                                 <option value={UserRole.ADMIN}>Administrador</option>
                             </select>
                         </div>
                         
                         <div className="relative">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 mb-1 block">Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    type="email" 
                                    name="email"
                                    required
                                    disabled={isViewOnly}
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
                                    placeholder="correo@ejemplo.com"
                                />
                            </div>
                         </div>

                         {!isViewOnly && !initialData && (
                             <>
                                <div className="relative">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 mb-1 block">Contraseña</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input 
                                            type="password" 
                                            name="password"
                                            required={!initialData}
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 mb-1 block">Confirmar Contraseña</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input 
                                            type="password" 
                                            name="confirmPassword"
                                            required={!initialData}
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                             </>
                         )}
                    </div>
                </div>

                <div className="h-px bg-slate-200 w-full"></div>

                {/* 2. Información Personal */}
                <div>
                    <h4 className="text-xs font-serif font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <FileText size={16} className="text-primary-600" /> Información Personal
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                            <label className="label-form">Nombres</label>
                            <input type="text" name="name" required disabled={isViewOnly} value={formData.name} onChange={handleChange} className="input-form" />
                        </div>
                        <div>
                            <label className="label-form">Apellidos</label>
                            <input type="text" name="lastName" required disabled={isViewOnly} value={formData.lastName} onChange={handleChange} className="input-form" />
                        </div>
                        <div>
                            <label className="label-form">Género</label>
                            <select name="gender" disabled={isViewOnly} value={formData.gender} onChange={handleChange} className="input-form">
                                <option value="M">Masculino</option>
                                <option value="F">Femenino</option>
                                <option value="O">Otro</option>
                            </select>
                        </div>
                        <div>
                             <label className="label-form">Fecha Nacimiento</label>
                             <div className="relative">
                                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                 <input type="date" name="birthDate" required disabled={isViewOnly} value={formData.birthDate} onChange={handleChange} className="input-form pl-10" />
                             </div>
                        </div>
                        <div>
                            <label className="label-form">Tipo Documento</label>
                            <select name="documentType" disabled={isViewOnly} value={formData.documentType} onChange={handleChange} className="input-form">
                                <option value="CC">Cédula de Ciudadanía</option>
                                <option value="CE">Cédula de Extranjería</option>
                                <option value="TI">Tarjeta Identidad</option>
                                <option value="PAS">Pasaporte</option>
                            </select>
                        </div>
                        <div>
                            <label className="label-form">No. Documento</label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="text" name="documentNumber" required disabled={isViewOnly} value={formData.documentNumber} onChange={handleChange} className="input-form pl-10" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Contacto y Ubicación */}
                <div>
                    <h4 className="text-xs font-serif font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <MapPin size={16} className="text-primary-600" /> Ubicación y Contacto
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="label-form">Teléfono Principal</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="tel" name="phone" required disabled={isViewOnly} value={formData.phone} onChange={handleChange} className="input-form pl-10" />
                            </div>
                        </div>
                        <div>
                            <label className="label-form">Teléfono Secundario</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="tel" name="secondaryPhone" disabled={isViewOnly} value={formData.secondaryPhone} onChange={handleChange} className="input-form pl-10" placeholder="Opcional" />
                            </div>
                        </div>
                        <div>
                            <label className="label-form">Ciudad</label>
                            <input type="text" name="city" required disabled={isViewOnly} value={formData.city} onChange={handleChange} className="input-form" />
                        </div>
                        <div>
                            <label className="label-form">Barrio</label>
                            <input type="text" name="neighborhood" required disabled={isViewOnly} value={formData.neighborhood} onChange={handleChange} className="input-form" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="label-form">Dirección Residencial</label>
                            <input type="text" name="address" required disabled={isViewOnly} value={formData.address} onChange={handleChange} className="input-form" placeholder="Ej: Calle 10 # 40-20" />
                        </div>
                    </div>
                </div>

                {/* 4. Músico (Condicional) */}
                {formData.role === UserRole.EMPLEADO && (
                    <div className="bg-primary-50 rounded-xl p-6 border border-primary-100 animate-fade-in-up">
                        <h4 className="text-xs font-serif font-bold text-primary-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Music size={16} className="text-primary-600" /> Perfil Musical
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="label-form text-primary-900/70">Instrumento Principal</label>
                                <input type="text" name="mainInstrument" disabled={isViewOnly} value={formData.mainInstrument} onChange={handleChange} className="input-form border-primary-200 focus:ring-primary-200" placeholder="Ej: Trompeta" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="label-form text-primary-900/70">Otros Instrumentos</label>
                                <input type="text" name="otherInstruments" disabled={isViewOnly} value={formData.otherInstruments} onChange={handleChange} className="input-form border-primary-200 focus:ring-primary-200" placeholder="Ej: Voz, Guitarra (Separar por comas)" />
                            </div>
                            <div>
                                <label className="label-form text-primary-900/70">Años de Experiencia</label>
                                <input type="number" name="experienceYears" disabled={isViewOnly} value={formData.experienceYears} onChange={handleChange} className="input-form border-primary-200 focus:ring-primary-200" />
                            </div>
                        </div>
                    </div>
                )}

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
                    form="user-form"
                    type="submit"
                    className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-lg shadow-primary-900/20 hover:shadow-primary-900/30 transition-all transform hover:-translate-y-0.5"
                >
                    <Save size={16} />
                    Guardar Usuario
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
        .input-form:focus {
            border-color: #dc2626;
            box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.1);
        }
        .input-form:disabled {
            background-color: #f8fafc;
            color: #94a3b8;
            cursor: default;
        }
      `}</style>
    </div>,
    document.body
  );
};