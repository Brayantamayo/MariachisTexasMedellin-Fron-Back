import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, User as UserIcon, Camera, Lock, Music, MapPin, Phone, Mail, FileText, Calendar, Hash, Briefcase, AlertCircle } from 'lucide-react';
import { User, UserRole } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employeeData: any) => Promise<void> | void;
  initialData?: User | null;
  isViewOnly?: boolean;
}

interface EmpErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  lastName?: string;
  documentNumber?: string;
  birthDate?: string;
  mainInstrument?: string;
  phone?: string;
  neighborhood?: string;
  address?: string;
}

const validate = (data: any, isCreating: boolean): EmpErrors => {
  const errors: EmpErrors = {};
  if (!data.email?.trim())          errors.email          = 'El correo es requerido';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
                                    errors.email          = 'El correo no tiene un formato válido';
  if (isCreating) {
    if (!data.password?.trim())     errors.password       = 'La contraseña es requerida';
    else if (data.password.length < 8)
                                    errors.password       = 'Mínimo 8 caracteres';
    if (data.password !== data.confirmPassword)
                                    errors.confirmPassword = 'Las contraseñas no coinciden';
  }
  if (!data.name?.trim())           errors.name           = 'El nombre es requerido';
  if (!data.lastName?.trim())       errors.lastName       = 'El apellido es requerido';
  if (!data.documentNumber?.trim()) errors.documentNumber = 'El número de documento es requerido';
  else if (!/^\d{5,15}$/.test(data.documentNumber.trim()))
                                    errors.documentNumber = 'Debe tener entre 5 y 15 dígitos';
  if (!data.birthDate)              errors.birthDate      = 'La fecha de nacimiento es requerida';
  if (!data.mainInstrument?.trim()) errors.mainInstrument = 'El instrumento principal es requerido';
  if (!data.phone?.trim())          errors.phone          = 'El teléfono principal es requerido';
  else if (!/^\d{7,15}$/.test(data.phone.replace(/\s/g, '')))
                                    errors.phone          = 'Debe tener entre 7 y 15 dígitos';
  if (!data.neighborhood?.trim())   errors.neighborhood   = 'El barrio es requerido';
  if (!data.address?.trim())        errors.address        = 'La dirección es requerida';
  return errors;
};

const errClass = (hasErr: boolean) =>
  hasErr ? 'border-red-400 bg-red-50 focus:border-red-500 ring-2 ring-red-100' : '';

const ErrMsg = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{msg}</p> : null;

export const EmployeeFormModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialData, isViewOnly = false }) => {
  const emptyEmployee = {
    role: UserRole.EMPLEADO, name: '', lastName: '', email: '',
    documentType: 'CC', documentNumber: '', gender: 'M', birthDate: '',
    phone: '', secondaryPhone: '', city: 'Medellín', neighborhood: '', address: '',
    password: '', confirmPassword: '', mainInstrument: '', otherInstruments: '', experienceYears: 0
  };

  const [formData,    setFormData]    = useState<any>(emptyEmployee);
  const [errors,      setErrors]      = useState<EmpErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [saving,      setSaving]      = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData ? {
        ...initialData, password: '', confirmPassword: '',
        otherInstruments: Array.isArray(initialData.otherInstruments)
          ? initialData.otherInstruments.join(', ')
          : initialData.otherInstruments || ''
      } : emptyEmployee);
      setErrors({});
      setGlobalError(null);
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (isViewOnly) return;
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    if (errors[name as keyof EmpErrors])
      setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    const errs = validate(formData, !initialData);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setGlobalError(Object.values(errs)[0] ?? null);
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true);
    try {
      const submissionData = { ...formData };
      if (typeof submissionData.otherInstruments === 'string')
        submissionData.otherInstruments = submissionData.otherInstruments.split(',').map((i: string) => i.trim()).filter(Boolean);
      delete submissionData.confirmPassword;
      await onSave(submissionData);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Error al guardar el empleado.';
      setGlobalError(msg);
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg border ${isViewOnly ? 'bg-slate-100 border-slate-200' : 'bg-primary-50 border-primary-100'}`}>
              <Briefcase className="text-primary-600" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">
                {isViewOnly ? 'Detalle del Empleado' : initialData ? 'Editar Empleado' : 'Nuevo Empleado'}
              </h3>
              <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">
                {isViewOnly ? 'Información completa del músico' : 'Gestión de personal y músicos'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Error global */}
        {globalError && (
          <div className="mx-6 mt-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
            <AlertCircle size={18} className="flex-shrink-0" /> {globalError}
          </div>
        )}

        {/* Body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
          <form id="employee-form" onSubmit={handleSubmit} className="space-y-8">

            {/* 1. Foto y Credenciales */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <div className="relative cursor-pointer">
                  <div className="w-32 h-32 rounded-full bg-slate-200 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                    {initialData?.avatar ? <img src={initialData.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <UserIcon size={48} className="text-slate-400" />}
                  </div>
                  {!isViewOnly && <div className="absolute bottom-0 right-0 bg-primary-600 p-2 rounded-full text-white shadow-lg"><Camera size={16} /></div>}
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                <div className="md:col-span-2">
                  <label className="label-form">Correo Electrónico <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.email ? 'text-red-400' : 'text-slate-400'}`} size={16} />
                    <input type="email" name="email" disabled={isViewOnly} value={formData.email} onChange={handleChange}
                      className={`input-form pl-10 ${errClass(!!errors.email)}`} placeholder="usuario@texas.com" />
                  </div>
                  <ErrMsg msg={errors.email} />
                </div>

                {!isViewOnly && !initialData && (
                  <>
                    <div>
                      <label className="label-form">Contraseña <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.password ? 'text-red-400' : 'text-slate-400'}`} size={16} />
                        <input type="password" name="password" value={formData.password} onChange={handleChange}
                          className={`input-form pl-10 ${errClass(!!errors.password)}`} placeholder="••••••••" />
                      </div>
                      <ErrMsg msg={errors.password} />
                    </div>
                    <div>
                      <label className="label-form">Confirmar Contraseña <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.confirmPassword ? 'text-red-400' : 'text-slate-400'}`} size={16} />
                        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                          className={`input-form pl-10 ${errClass(!!errors.confirmPassword)}`} placeholder="••••••••" />
                      </div>
                      <ErrMsg msg={errors.confirmPassword} />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="h-px bg-slate-200 w-full" />

            {/* 2. Datos Personales */}
            <div>
              <h4 className="text-xs font-serif font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText size={16} className="text-primary-600" /> Datos Personales
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="label-form">Nombres <span className="text-red-500">*</span></label>
                  <input type="text" name="name" disabled={isViewOnly} value={formData.name} onChange={handleChange}
                    className={`input-form ${errClass(!!errors.name)}`} />
                  <ErrMsg msg={errors.name} />
                </div>
                <div>
                  <label className="label-form">Apellidos <span className="text-red-500">*</span></label>
                  <input type="text" name="lastName" disabled={isViewOnly} value={formData.lastName} onChange={handleChange}
                    className={`input-form ${errClass(!!errors.lastName)}`} />
                  <ErrMsg msg={errors.lastName} />
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
                  <label className="label-form">Fecha Nacimiento <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.birthDate ? 'text-red-400' : 'text-slate-400'}`} size={16} />
                    <input type="date" name="birthDate" disabled={isViewOnly} value={formData.birthDate} onChange={handleChange}
                      className={`input-form pl-10 ${errClass(!!errors.birthDate)}`} />
                  </div>
                  <ErrMsg msg={errors.birthDate} />
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
                  <label className="label-form">No. Documento <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Hash className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.documentNumber ? 'text-red-400' : 'text-slate-400'}`} size={16} />
                    <input type="text" name="documentNumber" disabled={isViewOnly} value={formData.documentNumber} onChange={handleChange}
                      className={`input-form pl-10 ${errClass(!!errors.documentNumber)}`} />
                  </div>
                  <ErrMsg msg={errors.documentNumber} />
                </div>
              </div>
            </div>

            {/* 3. Perfil Musical */}
            <div className="bg-primary-50 rounded-xl p-6 border border-primary-100">
              <h4 className="text-xs font-serif font-bold text-primary-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Music size={16} className="text-primary-600" /> Perfil Musical (Requerido)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="label-form text-primary-900/70">Instrumento Principal <span className="text-red-500">*</span></label>
                  <input type="text" name="mainInstrument" disabled={isViewOnly} value={formData.mainInstrument} onChange={handleChange}
                    className={`input-form border-primary-200 ${errClass(!!errors.mainInstrument)}`} placeholder="Ej: Vihuela" />
                  <ErrMsg msg={errors.mainInstrument} />
                </div>
                <div className="md:col-span-2">
                  <label className="label-form text-primary-900/70">Otros Instrumentos</label>
                  <input type="text" name="otherInstruments" disabled={isViewOnly} value={formData.otherInstruments} onChange={handleChange}
                    className="input-form border-primary-200" placeholder="Ej: Voz, Guitarra (separados por coma)" />
                </div>
                <div>
                  <label className="label-form text-primary-900/70">Años Experiencia</label>
                  <input type="number" name="experienceYears" disabled={isViewOnly} value={formData.experienceYears} onChange={handleChange}
                    className="input-form border-primary-200" min={0} />
                </div>
              </div>
            </div>

            {/* 4. Contacto */}
            <div>
              <h4 className="text-xs font-serif font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-primary-600" /> Ubicación y Contacto
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="label-form">Teléfono Principal <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.phone ? 'text-red-400' : 'text-slate-400'}`} size={16} />
                    <input type="tel" name="phone" disabled={isViewOnly} value={formData.phone} onChange={handleChange}
                      className={`input-form pl-10 ${errClass(!!errors.phone)}`} />
                  </div>
                  <ErrMsg msg={errors.phone} />
                </div>
                <div>
                  <label className="label-form">Teléfono Secundario</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="tel" name="secondaryPhone" disabled={isViewOnly} value={formData.secondaryPhone} onChange={handleChange}
                      className="input-form pl-10" placeholder="Opcional" />
                  </div>
                </div>
                <div>
                  <label className="label-form">Ciudad</label>
                  <input type="text" name="city" disabled={isViewOnly} value={formData.city} onChange={handleChange} className="input-form" />
                </div>
                <div>
                  <label className="label-form">Barrio <span className="text-red-500">*</span></label>
                  <input type="text" name="neighborhood" disabled={isViewOnly} value={formData.neighborhood} onChange={handleChange}
                    className={`input-form ${errClass(!!errors.neighborhood)}`} />
                  <ErrMsg msg={errors.neighborhood} />
                </div>
                <div className="md:col-span-2">
                  <label className="label-form">Dirección <span className="text-red-500">*</span></label>
                  <input type="text" name="address" disabled={isViewOnly} value={formData.address} onChange={handleChange}
                    className={`input-form ${errClass(!!errors.address)}`} placeholder="Ej: Calle 10 # 40-20" />
                  <ErrMsg msg={errors.address} />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all uppercase tracking-widest">
            {isViewOnly ? 'Cerrar' : 'Cancelar'}
          </button>
          {!isViewOnly && (
            <button form="employee-form" type="submit" disabled={saving}
              className="bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white px-8 py-3 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5">
              <Save size={16} />
              {saving ? 'Guardando...' : 'Guardar Empleado'}
            </button>
          )}
        </div>
      </div>
      <style>{`
        .label-form { display:block; font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:4px; padding-left:4px; }
        .input-form { width:100%; padding:10px 16px; border-radius:12px; background-color:white; border:1px solid #e2e8f0; color:#334155; font-size:14px; outline:none; transition:all 0.2s; }
        .input-form:focus { border-color:#dc2626; box-shadow:0 0 0 2px rgba(220,38,38,0.1); }
        .input-form:disabled { background-color:#f8fafc; color:#94a3b8; cursor:default; }
      `}</style>
    </div>,
    document.body
  );
};
