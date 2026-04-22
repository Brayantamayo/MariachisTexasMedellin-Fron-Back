import React, { useState } from 'react';
import { User as UserIcon, Mail, Lock, Phone, MapPin, Calendar, Hash, Music, Briefcase, FileText, AlertCircle, Eye, EyeOff } from 'lucide-react';

export interface EmployeeFormErrors {
  email?: string;
  name?: string;
  lastName?: string;
  documentNumber?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  birthDate?: string;
  mainInstrument?: string;
  experienceYears?: string;
  city?: string;
  neighborhood?: string;
  address?: string;
}

interface Props {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  showPasswordFields?: boolean;
  errors?: EmployeeFormErrors;
}

export const EmployeeForm: React.FC<Props> = ({ formData, onChange, onSubmit, showPasswordFields = false, errors = {} as EmployeeFormErrors }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const maxDateString = maxDate.toISOString().split('T')[0];

  return (
    <form id="employee-form" onSubmit={onSubmit} className="space-y-8">
        
        {/* 1. Foto y Credenciales */}
        <div className="flex flex-col md:flex-row gap-8 items-start">

            {/* Datos de Acceso */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                 <div className="md:col-span-2">
                    <label className="label-form">Correo Electrónico (Usuario) <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.email ? 'text-red-400' : 'text-slate-400'} transition-colors`} size={16} />
                        <input 
                            type="email" 
                            name="email"
                            value={formData.email}
                            onChange={onChange}
                            className={`input-form input-icon-padding transition-all ${errors.email ? 'border-red-400 bg-red-50 focus:border-red-500 ring-2 ring-red-100' : ''}`}
                            placeholder="usuario@texas.com"
                        />
                    </div>
                    {errors.email && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{errors.email}</p>}
                 </div>

                 {showPasswordFields && (
                     <>
                        <div>
                            <label className="label-form">Contraseña <span className="text-red-500">*</span></label>
                             <div className="relative">
                                 <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.password ? 'text-red-400' : 'text-slate-400'} transition-colors`} size={16} />
                                 <input 
                                     type={showPassword ? "text" : "password"}
                                     name="password"
                                     value={formData.password}
                                     onChange={onChange}
                                     className={`input-form input-icon-padding transition-all ${errors.password ? 'border-red-400 bg-red-50 focus:border-red-500 ring-2 ring-red-100' : ''}`}
                                     placeholder="••••••••"
                                 />
                                 <button
                                     type="button"
                                     onClick={() => setShowPassword(!showPassword)}
                                     className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                                     tabIndex={-1}
                                 >
                                     {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                 </button>
                             </div>
                            {errors.password && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{errors.password}</p>}
                        </div>
                        <div>
                            <label className="label-form">Confirmar Contraseña <span className="text-red-500">*</span></label>
                             <div className="relative">
                                 <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.confirmPassword ? 'text-red-400' : 'text-slate-400'} transition-colors`} size={16} />
                                 <input 
                                     type={showConfirmPassword ? "text" : "password"}
                                     name="confirmPassword"
                                     value={formData.confirmPassword}
                                     onChange={onChange}
                                     className={`input-form input-icon-padding transition-all ${errors.confirmPassword ? 'border-red-400 bg-red-50 focus:border-red-500 ring-2 ring-red-100' : ''}`}
                                     placeholder="••••••••"
                                 />
                                 <button
                                     type="button"
                                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                     className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                                     tabIndex={-1}
                                 >
                                     {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                 </button>
                             </div>
                            {errors.confirmPassword && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{errors.confirmPassword}</p>}
                        </div>
                     </>
                 )}
            </div>
        </div>

        <div className="h-px bg-slate-200 w-full"></div>

        {/* 2. Información Personal */}
        <div>
            <h4 className="text-xs font-serif font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText size={16} className="text-primary-600" /> Datos Personales
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                    <label className="label-form">Nombres <span className="text-red-500">*</span></label>
                    <input type="text" name="name" value={formData.name} onChange={onChange} className={`input-form transition-all ${errors.name ? 'border-red-400 bg-red-50 focus:border-red-500 ring-2 ring-red-100' : ''}`} />
                    {errors.name && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{errors.name}</p>}
                </div>
                <div>
                    <label className="label-form">Apellidos <span className="text-red-500">*</span></label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={onChange} className={`input-form transition-all ${errors.lastName ? 'border-red-400 bg-red-50 focus:border-red-500 ring-2 ring-red-100' : ''}`} />
                    {errors.lastName && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{errors.lastName}</p>}
                </div>
                <div>
                    <label className="label-form">Género</label>
                    <select name="gender" value={formData.gender} onChange={onChange} className="input-form appearance-none cursor-pointer">
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                        <option value="O">Otro</option>
                    </select>
                </div>
                <div>
                     <label className="label-form">Fecha Nacimiento <span className="text-red-500">*</span></label>
                     <div className="relative">
                         <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                         <input type="date" name="birthDate" value={formData.birthDate} onChange={onChange} max={maxDateString} className="input-form input-icon-padding" />
                     </div>
                     {errors.birthDate && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{errors.birthDate}</p>}
                </div>
                <div>
                    <label className="label-form">Tipo Documento <span className="text-red-500">*</span></label>
                    <select name="documentType" value={formData.documentType} onChange={onChange} className="input-form appearance-none cursor-pointer">
                        <option value="CC">Cédula de Ciudadanía</option>
                        <option value="CE">Cédula de Extranjería</option>
                        <option value="TI">Tarjeta Identidad</option>
                        <option value="PAS">Pasaporte</option>
                    </select>
                </div>
                <div>
                    <label className="label-form">No. Documento <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <Hash className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.documentNumber ? 'text-red-400' : 'text-slate-400'} transition-colors`} size={16} />
                        <input type="text" name="documentNumber" value={formData.documentNumber} onChange={onChange} className={`input-form input-icon-padding transition-all ${errors.documentNumber ? 'border-red-400 bg-red-50 focus:border-red-500 ring-2 ring-red-100' : ''}`} />
                    </div>
                    {errors.documentNumber && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{errors.documentNumber}</p>}
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
                    <input type="text" name="mainInstrument" value={formData.mainInstrument} onChange={onChange} className="input-form border-primary-200 focus:ring-primary-200" placeholder="Ej: Vihuela" />
                    {errors.mainInstrument && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{errors.mainInstrument}</p>}
                </div>
                <div className="md:col-span-2">
                    <label className="label-form text-primary-900/70">Otros Instrumentos</label>
                    <input type="text" name="otherInstruments" value={formData.otherInstruments} onChange={onChange} className="input-form border-primary-200 focus:ring-primary-200" placeholder="Ej: Voz, Guitarra (Separados por coma)" />
                </div>
                <div>
                    <label className="label-form text-primary-900/70">Años Experiencia <span className="text-red-500">*</span></label>
                    <input type="number" name="experienceYears" value={formData.experienceYears} onChange={onChange} className="input-form border-primary-200 focus:ring-primary-200" />
                    {errors.experienceYears && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{errors.experienceYears}</p>}
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
                        <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.phone ? 'text-red-400' : 'text-slate-400'} transition-colors`} size={16} />
                        <input type="tel" name="phone" value={formData.phone} onChange={onChange} className={`input-form input-icon-padding transition-all ${errors.phone ? 'border-red-400 bg-red-50 focus:border-red-500 ring-2 ring-red-100' : ''}`} />
                    </div>
                    {errors.phone && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{errors.phone}</p>}
                </div>
                <div>
                    <label className="label-form">Teléfono Secundario</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="tel" name="secondaryPhone" value={formData.secondaryPhone} onChange={onChange} className="input-form input-icon-padding" placeholder="Opcional" />
                    </div>
                </div>
                <div>
                    <label className="label-form">Ciudad <span className="text-red-500">*</span></label>
                    <input type="text" name="city" value={formData.city} onChange={onChange} className="input-form" />
                    {errors.city && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{errors.city}</p>}
                </div>
                <div>
                    <label className="label-form">Barrio <span className="text-red-500">*</span></label>
                    <input type="text" name="neighborhood" value={formData.neighborhood} onChange={onChange} className="input-form" />
                    {errors.neighborhood && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{errors.neighborhood}</p>}
                </div>
                <div className="md:col-span-2">
                    <label className="label-form">Dirección Residencial <span className="text-red-500">*</span></label>
                    <input type="text" name="address" value={formData.address} onChange={onChange} className="input-form" placeholder="Ej: Calle 10 # 40-20" />
                    {errors.address && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{errors.address}</p>}
                </div>
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
        .input-icon-padding {
            padding-left: 44px !important;
        }
        .input-form:focus {
            border-color: #f87171;
            box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.1);
        }
      `}</style>
    </form>
  );
};
