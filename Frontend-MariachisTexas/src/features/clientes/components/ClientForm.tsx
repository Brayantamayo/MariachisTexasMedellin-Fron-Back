
import React from 'react';
import { User as UserIcon, MapPin, Phone, Calendar, Hash, Mail, Building, Flag, Camera, ChevronDown } from 'lucide-react';

interface Props {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ClientForm: React.FC<Props> = ({ formData, onChange, onImageUpload, onSubmit }) => {
  return (
    <form id="client-form" onSubmit={onSubmit} className="space-y-8">
        
        {/* 1. Información Personal y Foto */}
        <div>
            <h4 className="text-xs font-serif font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <UserIcon size={16} className="text-emerald-600" /> Información Personal
            </h4>
            
            <div className="flex flex-col md:flex-row gap-8 items-start">
                
                {/* Foto de Perfil */}
                <div className="flex-shrink-0 mx-auto md:mx-0">
                    <div className="relative group cursor-pointer w-32 h-32">
                        <div className="w-full h-full rounded-full bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden transition-all group-hover:border-emerald-100">
                            {formData.avatar ? (
                                <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon size={40} className="text-slate-300" />
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 bg-emerald-600 p-2.5 rounded-full text-white shadow-lg hover:bg-emerald-700 transition-all transform hover:scale-110 z-10 border-2 border-white">
                            <Camera size={14} />
                        </div>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={onImageUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                        />
                    </div>
                    <p className="text-[10px] text-center text-slate-400 mt-3 font-bold uppercase tracking-wide">
                        Foto de Perfil
                    </p>
                </div>

                {/* Campos de Información Personal */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                    
                    {/* Nombres */}
                    <div>
                        <label className="label-form">Nombres <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                name="name" 
                                required 
                                value={formData.name} 
                                onChange={onChange} 
                                className="input-form pl-10" 
                                placeholder="Ej: Juan Antonio"
                            />
                        </div>
                    </div>

                    {/* Apellidos */}
                    <div>
                        <label className="label-form">Apellidos <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                name="lastName" 
                                required 
                                value={formData.lastName} 
                                onChange={onChange} 
                                className="input-form pl-10" 
                                placeholder="Ej: Pérez Gomez"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="md:col-span-2">
                        <label className="label-form">Correo Electrónico <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="email" 
                                name="email" 
                                required 
                                value={formData.email} 
                                onChange={onChange} 
                                className="input-form pl-10" 
                                placeholder="cliente@email.com" 
                            />
                        </div>
                    </div>

                    {/* Tipo Documento */}
                    <div>
                        <label className="label-form">Tipo Documento <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <select 
                                name="documentType" 
                                value={formData.documentType} 
                                onChange={onChange} 
                                required
                                className="input-form appearance-none cursor-pointer"
                            >
                                <option value="CC">Cédula de Ciudadanía</option>
                                <option value="CE">Cédula de Extranjería</option>
                                <option value="PAS">Pasaporte</option>
                            </select>
                        </div>
                    </div>

                    {/* No. Documento */}
                    <div>
                        <label className="label-form">Número Documento <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                name="documentNumber" 
                                required 
                                value={formData.documentNumber} 
                                onChange={onChange} 
                                className="input-form pl-10" 
                            />
                        </div>
                    </div>

                    {/* Fecha Nacimiento */}
                    <div>
                        <label className="label-form">Fecha Nacimiento <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="date" 
                                name="birthDate" 
                                required 
                                value={formData.birthDate} 
                                onChange={onChange} 
                                className="input-form pl-10" 
                            />
                        </div>
                    </div>

                        {/* Género */}
                        <div>
                        <label className="label-form">Género</label>
                        <div className="relative">
                            <select 
                                name="gender" 
                                value={formData.gender} 
                                onChange={onChange} 
                                className="input-form appearance-none cursor-pointer"
                            >
                                <option value="M">Masculino</option>
                                <option value="F">Femenino</option>
                                <option value="O">Otro</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="h-px bg-slate-100 w-full"></div>

        {/* 2. Ubicación y Contacto */}
        <div>
            <h4 className="text-xs font-serif font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-emerald-600" /> Ubicación y Contacto
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Teléfono */}
                <div>
                    <label className="label-form">Teléfono Principal <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="tel" 
                            name="phone" 
                            required 
                            value={formData.phone} 
                            onChange={onChange} 
                            className="input-form pl-10" 
                        />
                    </div>
                </div>

                {/* Segundo Teléfono */}
                <div>
                    <label className="label-form">Segundo Teléfono</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="tel" 
                            name="secondaryPhone" 
                            value={formData.secondaryPhone} 
                            onChange={onChange} 
                            className="input-form pl-10" 
                            placeholder="Opcional" 
                        />
                    </div>
                </div>

                {/* Ciudad */}
                <div>
                    <label className="label-form">Ciudad <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            name="city" 
                            required 
                            value={formData.city} 
                            onChange={onChange} 
                            className="input-form pl-10" 
                        />
                    </div>
                </div>

                {/* Barrio */}
                <div>
                    <label className="label-form">Barrio <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <input 
                            type="text" 
                            name="neighborhood" 
                            required 
                            value={formData.neighborhood} 
                            onChange={onChange} 
                            className="input-form" 
                        />
                    </div>
                </div>

                {/* Dirección */}
                <div className="md:col-span-2">
                    <label className="label-form">Dirección Residencial / Evento <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            name="address" 
                            required 
                            value={formData.address} 
                            onChange={onChange} 
                            className="input-form pl-10" 
                            placeholder="Ej: Calle 10 # 40-20" 
                        />
                    </div>
                </div>

                {/* Zona de Servicio */}
                <div className="md:col-span-2">
                    <label className="label-form">Zona de Servicio <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <select 
                            name="serviceZone" 
                            value={formData.serviceZone || 'Urbano'} 
                            onChange={onChange} 
                            required
                            className="input-form appearance-none cursor-pointer"
                        >
                            <option value="Urbano">Urbano (Medellín y Área Metropolitana)</option>
                            <option value="Rural">Rural (Afueras / Municipios Lejanos)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>
                </div>


            </div>
        </div>
        
        <style>{`
        .label-form {
            display: block;
            font-size: 10px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 4px;
            padding-left: 2px;
        }
        .input-form {
            width: 100%;
            padding: 10px 12px;
            border-radius: 10px;
            background-color: white;
            border: 1px solid #e2e8f0;
            color: #334155;
            font-size: 13px;
            outline: none;
            transition: all 0.2s;
        }
        .input-form.pl-10 { padding-left: 36px; }
        .input-form:focus {
            border-color: #10b981; /* Emerald-500 */
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }
      `}</style>
    </form>
  );
};
