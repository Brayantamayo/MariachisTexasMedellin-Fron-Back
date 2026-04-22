import React, { useState } from 'react';
import { Mail, Lock, Phone, MapPin, Calendar, Hash, Music, Briefcase, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '@/types';

export interface UserFormErrors {
  [key: string]: string | undefined;
}

export interface DynamicRole {
  id: string;
  name: string;
  description: string;
}

interface Props {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  showPasswordFields?: boolean;
  errors?: UserFormErrors;
  availableRoles?: DynamicRole[];
  loadingRoles?: boolean;
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

const applyMask = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

// ─── Componente de fecha con máscara + picker nativo ─────────────────────────
const BirthDateInput: React.FC<{
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
}> = ({ value, onChange, error }) => {
  const [displayValue, setDisplayValue] = useState(() => toDisplay(value))
  const hiddenRef = React.useRef<HTMLInputElement>(null)

  const maxDateObj = new Date();
  maxDateObj.setFullYear(maxDateObj.getFullYear() - 18);
  const maxDateString = maxDateObj.toISOString().split('T')[0];

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
      onChange({ ...e, target: { ...e.target, name: 'birthDate', value: iso } } as React.ChangeEvent<HTMLInputElement>)
    }
  }

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value
    setDisplayValue(toDisplay(iso))
    onChange({ ...e, target: { ...e.target, name: 'birthDate', value: iso } } as React.ChangeEvent<HTMLInputElement>)
  }

  const openPicker = () => { try { hiddenRef.current?.showPicker() } catch { hiddenRef.current?.click() } }

  return (
    <div>
      <label className="label-form">Fecha Nacimiento</label>
      <div className="relative">
        <input
          type="text" name="birthDate" value={displayValue} onChange={handleTextChange}
          placeholder="DD/MM/AAAA" maxLength={10}
          className={`input-form pr-10 transition-all ${error ? 'border-red-400 bg-red-50 focus:border-red-500 ring-2 ring-red-100' : ''}`}
        />
        <button type="button" onClick={openPicker} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition-colors" tabIndex={-1}>
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
          max={maxDateString}
          min="1900-01-01"
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {error}</p>}
    </div>
  )
}

export const UserForm: React.FC<Props> = ({
  formData, onChange, onSubmit, showPasswordFields = false,
  errors = {}, availableRoles, loadingRoles
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const errClass = (field: string) =>
    errors[field] ? 'border-red-400 bg-red-50 focus:border-red-500 ring-2 ring-red-100' : '';

  const ErrMsg = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors[field]}</p> : null;

  return (
    <form id="user-form" onSubmit={onSubmit} className="space-y-8">

      {/* Rol y Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <label className="label-form">Tipo de Usuario</label>
          {loadingRoles ? (
            <div className="input-form flex items-center gap-2 text-slate-400 text-xs">
              <div className="w-3 h-3 border-2 border-slate-300 border-t-primary-500 rounded-full animate-spin" />
              Cargando roles...
            </div>
          ) : availableRoles && availableRoles.length > 0 ? (
            <select name="roleId" value={formData.roleId ?? ''} onChange={onChange} className="input-form appearance-none cursor-pointer text-slate-700">
              <option value="" disabled>Selecciona un rol</option>
              {availableRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          ) : (
            <select name="role" value={formData.role} onChange={onChange} className="input-form appearance-none cursor-pointer text-slate-700">
              <option value={UserRole.CLIENTE}>Cliente</option>
              <option value={UserRole.EMPLEADO}>Músico / Empleado</option>
              <option value={UserRole.ADMIN}>Administrador</option>
            </select>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="label-form">Correo Electrónico</label>
          <div className="relative">
            <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.email ? 'text-red-400' : 'text-slate-400'} transition-colors`} size={16} />
            <input type="email" name="email" value={formData.email} onChange={onChange}
              className={`input-form input-icon-padding transition-all ${errClass('email')}`} placeholder="correo@ejemplo.com" />
          </div>
          <ErrMsg field="email" />
        </div>

        {showPasswordFields && (<>
          <div>
            <label className="label-form">Contraseña</label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.password ? 'text-red-400' : 'text-slate-400'} transition-colors`} size={16} />
              <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={onChange}
                className={`input-form input-icon-padding transition-all ${errClass('password')}`} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1" tabIndex={-1}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <ErrMsg field="password" />
          </div>
          <div>
            <label className="label-form">Confirmar Contraseña</label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.confirmPassword ? 'text-red-400' : 'text-slate-400'} transition-colors`} size={16} />
              <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={onChange}
                className={`input-form input-icon-padding transition-all ${errClass('confirmPassword')}`} placeholder="••••••••" />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1" tabIndex={-1}>
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <ErrMsg field="confirmPassword" />
          </div>
        </>)}
      </div>

      <div className="h-px bg-slate-200 w-full" />

      {/* Información Personal */}
      <div>
        <h4 className="text-xs font-serif font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Briefcase size={16} className="text-primary-600" /> Información Personal
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="label-form">Nombres</label>
            <input type="text" name="name" value={formData.name} onChange={onChange} className={`input-form transition-all ${errClass('name')}`} />
            <ErrMsg field="name" />
          </div>
          <div>
            <label className="label-form">Apellidos</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={onChange} className={`input-form transition-all ${errClass('lastName')}`} />
            <ErrMsg field="lastName" />
          </div>
          <div>
            <label className="label-form">Género</label>
            <select name="gender" value={formData.gender} onChange={onChange} className="input-form appearance-none cursor-pointer text-slate-700">
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="O">Otro</option>
            </select>
          </div>
          <BirthDateInput value={formData.birthDate} onChange={onChange} error={errors.birthDate} />
          <div>
            <label className="label-form">Tipo Documento</label>
            <select name="documentType" value={formData.documentType} onChange={onChange} className="input-form appearance-none cursor-pointer text-slate-700">
              <option value="CC">Cédula de Ciudadanía</option>
              <option value="CE">Cédula de Extranjería</option>
              <option value="TI">Tarjeta Identidad</option>
              <option value="PAS">Pasaporte</option>
            </select>
          </div>
          <div>
            <label className="label-form">No. Documento</label>
            <div className="relative">
              <Hash className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.documentNumber ? 'text-red-400' : 'text-slate-400'} transition-colors`} size={16} />
              <input type="text" name="documentNumber" value={formData.documentNumber} onChange={onChange}
                className={`input-form input-icon-padding transition-all ${errClass('documentNumber')}`} />
            </div>
            <ErrMsg field="documentNumber" />
          </div>
        </div>
      </div>

      {/* Contacto y Ubicación */}
      <div>
        <h4 className="text-xs font-serif font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
          <MapPin size={16} className="text-primary-600" /> Ubicación y Contacto
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label-form">Teléfono Principal</label>
            <div className="relative">
              <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 ${errors.phone ? 'text-red-400' : 'text-slate-400'} transition-colors`} size={16} />
              <input type="tel" name="phone" value={formData.phone} onChange={onChange}
                className={`input-form input-icon-padding transition-all ${errClass('phone')}`} />
            </div>
            <ErrMsg field="phone" />
          </div>
          <div>
            <label className="label-form">Teléfono Secundario</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="tel" name="secondaryPhone" value={formData.secondaryPhone} onChange={onChange} className="input-form input-icon-padding" placeholder="Opcional" />
            </div>
          </div>
          <div>
            <label className="label-form">Ciudad</label>
            <input type="text" name="city" value={formData.city} onChange={onChange} className="input-form" />
          </div>
          <div>
            <label className="label-form">Barrio</label>
            <input type="text" name="neighborhood" value={formData.neighborhood} onChange={onChange} className="input-form" />
          </div>
          <div className="md:col-span-2">
            <label className="label-form">Dirección Residencial</label>
            <input type="text" name="address" value={formData.address} onChange={onChange} className="input-form" placeholder="Ej: Calle 10 # 40-20" />
          </div>
        </div>
      </div>

      {/* Perfil Musical — solo EMPLEADO */}
      {(formData.role === UserRole.EMPLEADO ||
        availableRoles?.find(r => r.id === formData.roleId)?.name === 'EMPLEADO') && (
        <div className="bg-primary-50 rounded-xl p-6 border border-primary-100 animate-fade-in-up">
          <h4 className="text-xs font-serif font-bold text-primary-800 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Music size={16} className="text-primary-600" /> Perfil Musical
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="label-form text-primary-900/70">Instrumento Principal</label>
              <input type="text" name="mainInstrument" value={formData.mainInstrument} onChange={onChange} className="input-form border-primary-200 focus:ring-primary-200" placeholder="Ej: Trompeta" />
            </div>
            <div className="md:col-span-2">
              <label className="label-form text-primary-900/70">Otros Instrumentos</label>
              <input type="text" name="otherInstruments" value={formData.otherInstruments} onChange={onChange} className="input-form border-primary-200 focus:ring-primary-200" placeholder="Ej: Voz, Guitarra (separar por comas)" />
            </div>
            <div>
              <label className="label-form text-primary-900/70">Años de Experiencia</label>
              <input type="number" name="experienceYears" value={formData.experienceYears} onChange={onChange} className="input-form border-primary-200 focus:ring-primary-200" />
            </div>
          </div>
        </div>
      )}

      <style>{`
        .label-form { display:block; font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.1em; margin-bottom:4px; padding-left:4px; }
        .input-form { width:100%; padding:10px 16px; border-radius:12px; background-color:white; border:1px solid #e2e8f0; color:#334155; font-size:14px; outline:none; transition:all .2s; }
        .input-icon-padding { padding-left:44px !important; }
        .input-form:focus { border-color:#f87171; box-shadow:0 0 0 2px rgba(220,38,38,.1); }
      `}</style>
    </form>
  );
};
