
import React from 'react';
import { User as UserIcon, Mail, Lock, Phone, MapPin, Calendar, Hash, Music, Briefcase, Camera, FileText } from 'lucide-react';

interface Props {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  showPasswordFields?: boolean;
}

export const EmployeeForm: React.FC<Props> = ({ formData, onChange, onImageUpload, onSubmit, showPasswordFields = false }) => {
  return (
    <form id="employee-form" onSubmit={onSubmit} className="space-y-8">
        
        {/* 1. Foto y Credenciales */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Foto */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
                <div className="relative group cursor-pointer">
                    <div className="w-32 h-32 rounded-full bg-slate-200 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                        {formData.avatar ? (
                            <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon size={48} className="text-slate-400" />
                        )}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-primary-600 p-2 rounded-full text-white shadow-lg hover:bg-primary-700 transition-colors z-10">
                        <Camera size={16} />
                    </div>
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={onImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                    />
                </div>
                <p className="text-[10px] text-center text-slate-400 mt-2 font-bold uppercase tracking-wide">
                    Subir Foto
                </p>
            </div>

            {/* Datos de Acceso */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                 <div className="md:col-span-2">
                    <label className="label-form">Correo Electrónico (Usuario) <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="email" 
                            name="email"
                            required
                            value={formData.email}
                            onChange={onChange}
                            className="input-form input-icon-padding"
                            placeholder="usuario@texas.com"
                        />
                    </div>
                 </div>

                 {showPasswordFields && (
                     <>
                        <div>
                            <label className="label-form">Contraseña <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    type="password" 
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={onChange}
                                    className="input-form input-icon-padding"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="label-form">Confirmar Contraseña <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    type="password" 
                                    name="confirmPassword"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={onChange}
                                    className="input-form input-icon-padding"
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
                <FileText size={16} className="text-primary-600" /> Datos Personales
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                    <label className="label-form">Nombres <span className="text-red-500">*</span></label>
                    <input type="text" name="name" required value={formData.name} onChange={onChange} className="input-form" />
                </div>
                <div>
                    <label className="label-form">Apellidos <span className="text-red-500">*</span></label>
                    <input type="text" name="lastName" required value={formData.lastName} onChange={onChange} className="input-form" />
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
                         <input type="date" name="birthDate" required value={formData.birthDate} onChange={onChange} className="input-form input-icon-padding" />
                     </div>
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
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="text" name="documentNumber" required value={formData.documentNumber} onChange={onChange} className="input-form input-icon-padding" />
                    </div>
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
                    <input type="text" name="mainInstrument" required value={formData.mainInstrument} onChange={onChange} className="input-form border-primary-200 focus:ring-primary-200" placeholder="Ej: Vihuela" />
                </div>
                <div className="md:col-span-2">
                    <label className="label-form text-primary-900/70">Otros Instrumentos</label>
                    <input type="text" name="otherInstruments" value={formData.otherInstruments} onChange={onChange} className="input-form border-primary-200 focus:ring-primary-200" placeholder="Ej: Voz, Guitarra (Separados por coma)" />
                </div>
                <div>
                    <label className="label-form text-primary-900/70">Años Experiencia <span className="text-red-500">*</span></label>
                    <input type="number" name="experienceYears" required value={formData.experienceYears} onChange={onChange} className="input-form border-primary-200 focus:ring-primary-200" />
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
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="tel" name="phone" required value={formData.phone} onChange={onChange} className="input-form input-icon-padding" />
                    </div>
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
                    <input type="text" name="city" required value={formData.city} onChange={onChange} className="input-form" />
                </div>
                <div>
                    <label className="label-form">Barrio <span className="text-red-500">*</span></label>
                    <input type="text" name="neighborhood" required value={formData.neighborhood} onChange={onChange} className="input-form" />
                </div>
                <div className="md:col-span-2">
                    <label className="label-form">Dirección Residencial <span className="text-red-500">*</span></label>
                    <input type="text" name="address" required value={formData.address} onChange={onChange} className="input-form" placeholder="Ej: Calle 10 # 40-20" />
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
