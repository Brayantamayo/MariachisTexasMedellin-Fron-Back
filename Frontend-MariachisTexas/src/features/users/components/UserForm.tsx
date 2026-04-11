
import React, { useState } from 'react';
import { User as UserIcon, Mail, Lock, Phone, MapPin, Calendar, Hash, Music, Briefcase, AlertCircle } from 'lucide-react';
import { UserRole } from '@/types';

interface UserFormErrors {
  email?: string;
  name?: string;
  lastName?: string;
  documentNumber?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  birthDate?: string;
}

interface Props {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  showPasswordFields?: boolean;
  errors?: UserFormErrors;
}

// ─── Convierte YYYY-MM-DD → DD/MM/YYYY para mostrar ──────────────────────────
const toDisplay = (iso: string): string => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

// ─── Convierte DD/MM/YYYY → YYYY-MM-DD para el modelo ────────────────────────
const toISO = (display: string): string => {
  const clean = display.replace(/\D/g, '')
  if (clean.length < 8) return ''
  const d = clean.slice(0, 2)
  const m = clean.slice(2, 4)
  const y = clean.slice(4, 8)
  return `${y}-${m}-${d}`
}

// ─── Aplica máscara DD/MM/YYYY mientras el usuario escribe ───────────────────
const applyMask = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

// ─── Valida que la fecha tenga sentido básico ─────────────────────────────────
const validateDate = (iso: string): string | undefined => {
  if (!iso) return 'La fecha de nacimiento es requerida'
  const date = new Date(iso)
  if (isNaN(date.getTime())) return 'La fecha no es válida'
  const year = date.getFullYear()
  if (year < 1900 || year > new Date().getFullYear()) return 'El año no es válido'
  return undefined
}

// ─── Componente de fecha con máscara + picker nativo ─────────────────────────
const BirthDateInput: React.FC<{
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  required?: boolean
}> = ({ value, onChange, error, required }) => {
  const [displayValue, setDisplayValue] = useState(() => toDisplay(value))
  const [dateError, setDateError] = useState<string | undefined>()
  const hiddenRef = React.useRef<HTMLInputElement>(null)

  // Sincronizar si el valor externo cambia (ej: reset del form)
  React.useEffect(() => {
    setDisplayValue(toDisplay(value))
  }, [value])

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyMask(e.target.value)
    setDisplayValue(masked)

    const digits = masked.replace(/\D/g, '')
    if (digits.length === 8) {
      const iso = toISO(masked)
      const err = validateDate(iso)
      setDateError(err)
      if (!err) {
        // Emitir evento sintético con el valor ISO
        const syntheticEvent = {
          ...e,
          target: { ...e.target, name: 'birthDate', value: iso }
        } as React.ChangeEvent<HTMLInputElement>
        onChange(syntheticEvent)
      }
    } else {
      setDateError(undefined)
    }
  }

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value // YYYY-MM-DD
    setDisplayValue(toDisplay(iso))
    setDateError(undefined)
    const syntheticEvent = {
      ...e,
      target: { ...e.target, name: 'birthDate', value: iso }
    } as React.ChangeEvent<HTMLInputElement>
    onChange(syntheticEvent)
  }

  const openPicker = () => {
    try {
      hiddenRef.current?.showPicker()
    } catch {
      hiddenRef.current?.click()
    }
  }

  const combinedError = error || dateError

  return (
    <div>
      <label className="label-form">Fecha Nacimiento <span className="text-red-500">*</span></label>
      <div className="relative">
        {/* Input visible con máscara */}
        <input
          type="text"
          name="birthDate"
          value={displayValue}
          onChange={handleTextChange}
          placeholder="DD/MM/AAAA"
          maxLength={10}
          required={required}
          className={`input-form pr-10 transition-all ${combinedError ? 'border-red-400 bg-red-50 focus:border-red-500 ring-2 ring-red-100' : ''}`}
        />
        {/* Botón para abrir el picker nativo */}
        <button
          type="button"
          onClick={openPicker}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition-colors"
          tabIndex={-1}
          title="Abrir calendario"
        >
          <Calendar size={16} />
        </button>
        {/* Input date oculto — solo para el picker */}
        <input
          ref={hiddenRef}
          type="date"
          value={value || ''}
          onChange={handlePickerChange}
          className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
          tabIndex={-1}
          max={new Date().toISOString().split('T')[0]}
          min="1900-01-01"
        />
      </div>
      {combinedError && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <AlertCircle size={12} /> {combinedError}
        </p>
      )}
    </div>
  )
}

export const UserForm: React.FC<Props> = ({ formData, onChange, onSubmit, showPasswordFields = false, errors = {} as UserFormErrors }) => {
  return (
    <form id="user-form" onSubmit={onSubmit} className="space-y-8">
        
        {/* 1. Foto y Rol */}
        <div className="flex flex-col md:flex-row gap-8 items-start">

            {/* Datos de Cuenta */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                 <div className="md:col-span-2">
                     <label className="label-form">Tipo de Usuario</label>
                     <select 
                        name="role"
                        value={formData.role}
                        onChange={onChange}
                        className="input-form appearance-none cursor-pointer text-slate-700"
                     >
                         <option value={UserRole.CLIENTE}>Cliente</option>
                         <option value={UserRole.EMPLEADO}>Músico / Empleado</option>
                         <option value={UserRole.ADMIN}>Administrador</option>
                     </select>
                 </div>
                 
                 <div className="md:col-span-2">
                    <label className="label-form">Correo Electrónico <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.email ? 'text-red-400' : 'text-slate-400'} transition-colors`} size={16} />
                        <input 
                            type="email" 
                            name="email"
                            required
                            value={formData.email}
                            onChange={onChange}
                            className={`input-form input-icon-padding transition-all ${errors.email ? 'border-red-400 bg-red-50 focus:border-red-500 ring-2 ring-red-100' : ''}`}
                            placeholder="correo@ejemplo.com"
                        />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.email}
                      </p>
                    )}
                 </div>

                 {showPasswordFields && (
                     <>
                        <div>
                            <label className="label-form">Contraseña <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.password ? 'text-red-400' : 'text-slate-400'} transition-colors`} size={16} />
                                <input 
                                    type="password" 
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={onChange}
                                    className={`input-form input-icon-padding transition-all ${errors.password ? 'border-red-400 bg-red-50 focus:border-red-500 ring-2 ring-red-100' : ''}`}
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.password && (
                              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle size={12} /> {errors.password}
                              </p>
                            )}
                        </div>
                        <div>
                            <label className="label-form">Confirmar Contraseña <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.confirmPassword ? 'text-red-400' : 'text-slate-400'} transition-colors`} size={16} />
                                <input 
                                    type="password" 
                                    name="confirmPassword"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={onChange}
                                    className={`input-form input-icon-padding transition-all ${errors.confirmPassword ? 'border-red-400 bg-red-50 focus:border-red-500 ring-2 ring-red-100' : ''}`}
                                    placeholder="••••••••"
                                />
                            </div>
                            {errors.confirmPassword && (
                              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertCircle size={12} /> {errors.confirmPassword}
                              </p>
                            )}
                        </div>
                     </>
                 )}
            </div>
        </div>

        <div className="h-px bg-slate-200 w-full"></div>

        {/* 2. Información Personal */}
        <div>
            <h4 className="text-xs font-serif font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Briefcase size={16} className="text-primary-600" /> Información Personal
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                    <label className="label-form">Nombres <span className="text-red-500">*</span></label>
                    <input type="text" name="name" required value={formData.name} onChange={onChange} className={`input-form transition-all ${errors.name ? 'border-red-400 bg-red-50 focus:border-red-500 ring-2 ring-red-100' : ''}`} />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.name}
                      </p>
                    )}
                </div>
                <div>
                    <label className="label-form">Apellidos <span className="text-red-500">*</span></label>
                    <input type="text" name="lastName" required value={formData.lastName} onChange={onChange} className={`input-form transition-all ${errors.lastName ? 'border-red-400 bg-red-50 focus:border-red-500 ring-2 ring-red-100' : ''}`} />
                    {errors.lastName && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.lastName}
                      </p>
                    )}
                </div>
                <div>
                    <label className="label-form">Género</label>
                    <select name="gender" value={formData.gender} onChange={onChange} className="input-form appearance-none cursor-pointer text-slate-700">
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                        <option value="O">Otro</option>
                    </select>
                </div>
                <BirthDateInput
                  value={formData.birthDate}
                  onChange={onChange}
                  error={errors.birthDate}
                  required
                />
                <div>
                    <label className="label-form">Tipo Documento <span className="text-red-500">*</span></label>
                    <select name="documentType" value={formData.documentType} onChange={onChange} className="input-form appearance-none cursor-pointer text-slate-700">
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
                        <input type="text" name="documentNumber" required value={formData.documentNumber} onChange={onChange} className={`input-form input-icon-padding transition-all ${errors.documentNumber ? 'border-red-400 bg-red-50 focus:border-red-500 ring-2 ring-red-100' : ''}`} />
                    </div>
                    {errors.documentNumber && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.documentNumber}
                      </p>
                    )}
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
                    <label className="label-form">Teléfono Principal <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.phone ? 'text-red-400' : 'text-slate-400'} transition-colors`} size={16} />
                        <input type="tel" name="phone" required value={formData.phone} onChange={onChange} className={`input-form input-icon-padding transition-all ${errors.phone ? 'border-red-400 bg-red-50 focus:border-red-500 ring-2 ring-red-100' : ''}`} />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.phone}
                      </p>
                    )}
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

        {/* 4. Músico (Condicional) */}
        {formData.role === UserRole.EMPLEADO && (
            <div className="bg-primary-50 rounded-xl p-6 border border-primary-100 animate-fade-in-up">
                <h4 className="text-xs font-serif font-bold text-primary-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Music size={16} className="text-primary-600" /> Perfil Musical
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                        <label className="label-form text-primary-900/70">Instrumento Principal <span className="text-red-500">*</span></label>
                        <input type="text" name="mainInstrument" value={formData.mainInstrument} onChange={onChange} className="input-form border-primary-200 focus:ring-primary-200" placeholder="Ej: Trompeta" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="label-form text-primary-900/70">Otros Instrumentos</label>
                        <input type="text" name="otherInstruments" value={formData.otherInstruments} onChange={onChange} className="input-form border-primary-200 focus:ring-primary-200" placeholder="Ej: Voz, Guitarra (Separar por comas)" />
                    </div>
                    <div>
                        <label className="label-form text-primary-900/70">Años de Experiencia <span className="text-red-500">*</span></label>
                        <input type="number" name="experienceYears" value={formData.experienceYears} onChange={onChange} className="input-form border-primary-200 focus:ring-primary-200" />
                    </div>
                </div>
            </div>
        )}

        <style>{`
        .label-form {
            display: block;
            font-size: 10px;
            font-weight: 700;
            color: #94a3b8;
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
