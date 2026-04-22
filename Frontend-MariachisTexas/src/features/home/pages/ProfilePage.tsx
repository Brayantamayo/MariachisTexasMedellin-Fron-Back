// src/features/profile/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
User, Mail, Phone, MapPin, FileText, Hash, Calendar,
Home, Map, CheckCircle, AlertCircle, X, Loader2,
Edit2, Save, ChevronRight, Shield, CreditCard, TrendingDown,
TrendingUp, Camera
} from 'lucide-react';
import { profileService, PerfilData } from '@/shared/services/perfilservices.ts';
import { useAuth } from '@/shared/contexts/AuthContext';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';
import { usePhotoUpload } from '@/shared/hooks/Usephotoupload .ts';
import { abonoService, EnrichedPayment } from '@/src/features/abonos/services/abonoService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FieldProps {
label:    string;
value:    string;
name:     string;
icon:     React.ReactNode;
type?:    string;
editing:  boolean;
onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
readOnly?: boolean;
hint?:    string;
colSpan?: boolean;
}

const tipoDocLabel: Record<string, string> = {
CC:  'Cédula de Ciudadanía',
CE:  'Cédula de Extranjería',
PAS: 'Pasaporte',
};

// ─── Field Component ──────────────────────────────────────────────────────────

const Field: React.FC<FieldProps> = ({
  label, value, name, icon, type = 'text',
  editing, onChange, readOnly, hint, colSpan
}) => (
  <div className={`group ${colSpan ? 'md:col-span-2' : ''} animate-fade-in-up`} style={{ animationDelay: '100ms' }}>
      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2.5 ml-1 group-hover:text-amber-500/50 transition-colors">
        {label}
      </label>
      <div className="relative">
        <span className={`absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300 z-10
            ${editing && !readOnly ? 'text-amber-500 scale-110' : 'text-slate-500 group-hover:text-slate-400'}`}>
            {icon}
        </span>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            disabled={!editing || readOnly}
            className={`
            w-full pl-11 pr-4 py-4 rounded-xl text-sm font-bold outline-none transition-all duration-300
            ${readOnly
                ? 'bg-white/3 text-slate-500 cursor-not-allowed border border-white/[0.03] opacity-70'
                : editing
                ? 'bg-slate-900/40 border border-amber-500/15 text-white focus:bg-slate-900/60 focus:border-amber-500/40 focus:ring-4 focus:ring-amber-500/5 shadow-inner'
                : 'bg-transparent border border-transparent text-slate-200 cursor-default'
            }
            `}
        />
        {editing && !readOnly && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          </div>
        )}
      </div>
      {hint && <p className="text-[10px] text-slate-600 mt-2 ml-1 font-medium">{hint}</p>}
  </div>
);

// ─── Stat Badge ───────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 py-4 border-b border-white/[0.03] last:border-0 group hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors">
      <div className="w-9 h-9 rounded-xl bg-slate-900/60 border border-amber-500/10 flex items-center justify-center text-slate-400 group-hover:text-amber-400 transition-all group-hover:scale-110 shadow-lg">
      {icon}
      </div>
      <div className="min-w-0">
      <p className="text-[9px] text-slate-600 uppercase tracking-[0.2em] font-black group-hover:text-slate-500 transition-colors">{label}</p>
      <p className="text-sm text-slate-300 font-bold truncate mt-0.5">{value || '—'}</p>
      </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const ProfilePage: React.FC = () => {
const { updateUser } = useAuth();

const [perfil,       setPerfil]       = useState<PerfilData | null>(null);
const [isLoadingGet, setIsLoadingGet] = useState(true);
const [isEditing,    setIsEditing]    = useState(false);
const [isLoading,    setIsLoading]    = useState(false);
const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
const [abonos,       setAbonos]       = useState<EnrichedPayment[]>([]);
const [isLoadingAbonos, setIsLoadingAbonos] = useState(false);

const [formData, setFormData] = useState({
    nombre:              '',
    apellido:            '',
    tipoDocumento:       'CC' as 'CC' | 'CE' | 'TI' | 'PAS',
    numeroDocumento:     '',
    fechaNacimiento:     '',
    email:               '',
    telefonoPrincipal:   '',
    telefonoAlternativo: '',
    ciudad:              '',
    barrio:              '',
    direccion:           '',
    zonaServicio:        'URBANA' as 'URBANA' | 'RURAL',
    foto:                ''  // ← URL Cloudinary
});

const photo = usePhotoUpload({
    folder: 'usuarios/fotos',
    onSuccess: (url) => setFormData((prev) => ({ ...prev, foto: url })),
});

useEffect(() => {
    const cargar = async () => {
    try {
        const data = await profileService.obtener();
        setPerfil(data);
        setFormData({
        nombre:              data.nombre,
        apellido:            data.apellido,
        tipoDocumento:       data.tipoDocumento,
        numeroDocumento:     data.numeroDocumento,
        fechaNacimiento:     data.fechaNacimiento,
        email:               data.email,
        telefonoPrincipal:   data.telefonoPrincipal,
        telefonoAlternativo: data.telefonoAlternativo,
        ciudad:              data.ciudad,
        barrio:              data.barrio,
        direccion:           data.direccion,
        zonaServicio:        data.zonaServicio,
        foto:                data.foto || '',  // ← Cargar foto existente
        });
    } catch (err) {
        showNotification(getErrorMessage(err), 'error');
    } finally {
        setIsLoadingGet(false);
    }
    };

    const cargarAbonos = async () => {
    setIsLoadingAbonos(true);
    try {
        const data = await abonoService.getAbonos();
        setAbonos(data);
    } catch (err) {
        console.error(err);
        showNotification('Error cargando los abonos.', 'error');
    } finally {
        setIsLoadingAbonos(false);
    }
    };

    cargar();
    cargarAbonos();
}, []);

const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

const handleCancel = () => {
    if (!perfil) return;
    setFormData({
    nombre:              perfil.nombre,
    apellido:            perfil.apellido,
    tipoDocumento:       perfil.tipoDocumento,
    numeroDocumento:     perfil.numeroDocumento,
    fechaNacimiento:     perfil.fechaNacimiento,
    email:               perfil.email,
    telefonoPrincipal:   perfil.telefonoPrincipal,
    telefonoAlternativo: perfil.telefonoAlternativo,
    ciudad:              perfil.ciudad,
    barrio:              perfil.barrio,
    direccion:           perfil.direccion,
    zonaServicio:        perfil.zonaServicio,
    foto:                perfil.foto || '',  // ← Restaurar foto original
    });
    photo.reset();  // ← Limpiar preview de foto
    setIsEditing(false);
};

const handleSave = async () => {
    setIsLoading(true);
    try {
    const actualizado = await profileService.actualizar({
        nombre:              formData.nombre,
        apellido:            formData.apellido,
        telefonoPrincipal:   formData.telefonoPrincipal,
        telefonoAlternativo: formData.telefonoAlternativo || undefined,
        ciudad:              formData.ciudad,
        barrio:              formData.barrio,
        direccion:           formData.direccion,
        zonaServicio:        formData.zonaServicio,
        fechaNacimiento:     formData.fechaNacimiento,
        foto:                formData.foto || undefined,  // ← Enviar foto
    });

    setPerfil(actualizado);
    updateUser({
        name:           actualizado.nombre,
        lastName:       actualizado.apellido,
        phone:          actualizado.telefonoPrincipal,
        secondaryPhone: actualizado.telefonoAlternativo,
        city:           actualizado.ciudad,
        neighborhood:   actualizado.barrio,
        address:        actualizado.direccion,
        birthDate:      actualizado.fechaNacimiento,
        avatar:         actualizado.foto ?? undefined,
    });

    showNotification('Perfil actualizado correctamente', 'success');
    setIsEditing(false);
    photo.reset();  // ← Limpiar preview de foto después de guardar
    } catch (err) {
    showNotification(getErrorMessage(err), 'error');
    } finally {
    setIsLoading(false);
    }
};

  // ── Loading ───────────────────────────────────────────────────────────────
if (isLoadingGet) {
    return (
    <div className="min-h-screen bg-[#07080a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
        <p className="text-slate-600 text-xs font-semibold tracking-widest uppercase">Cargando</p>
        </div>
    </div>
    );
}

const initials = `${formData.nombre?.[0] ?? ''}${formData.apellido?.[0] ?? ''}`.toUpperCase();

return (
    <div className="min-h-screen bg-[#050608] text-white selection:bg-amber-500/30">

      {/* ── Ambient Effects ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-600/5 rounded-full blur-[150px]" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* ── Toast notification ── */}
      {notification && createPortal(
          <div className="fixed top-8 right-8 z-[200] animate-fade-in-up">
            <div className={`flex items-center gap-4 pl-5 pr-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border backdrop-blur-2xl min-w-[320px]
                ${notification.type === 'success' ? 'bg-slate-900/90 border-emerald-500/20' : 'bg-slate-900/90 border-red-500/20'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg
                ${notification.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {notification.type === 'success' ? <CheckCircle size={20} strokeWidth={2.5} /> : <AlertCircle size={20} strokeWidth={2.5} />}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">{notification.type === 'success' ? 'Éxito' : 'Atención'}</p>
                  <p className="text-sm text-slate-200 font-bold">{notification.message}</p>
                </div>
                <button onClick={() => setNotification(null)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
            </div>
          </div>,
          document.body
      )}

      {/* ── HERO SECTION ── */}
      <div className="relative h-[280px] w-full overflow-hidden border-b border-white/5">
        <div className="absolute inset-0">
          <img 
            src="/shared/assets/images/profile-bg.png" 
            alt="Hero Background" 
            className="w-full h-full object-cover scale-105 blur-[2px] opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-[#050608]/40 to-transparent" />
        </div>
        
        <div className="relative max-w-6xl mx-auto h-full px-6 flex flex-col justify-end pb-10">
          <div className="flex items-center gap-2 text-[10px] font-black text-amber-500/60 uppercase tracking-[0.3em] mb-4 animate-fade-in-up">
            <span>Inicio</span>
            <ChevronRight size={12} strokeWidth={3} className="opacity-40" />
            <span className="text-amber-500">Mi Perfil</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
               {/* Large Avatar container */}
               <div className="relative group">
                 <div className="absolute -inset-1 bg-gradient-to-br from-amber-500 to-red-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500" />

                 {/* Input oculto para subir foto */}
                 <input
                   ref={photo.inputRef}
                   type="file"
                   accept="image/jpeg,image/png,image/webp"
                   className="hidden"
                   onChange={photo.handleFileChange}
                 />

                 <div
                   onClick={isEditing ? photo.triggerPick : undefined}
                   className={`relative w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-slate-900/80 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105 ${isEditing ? 'cursor-pointer' : ''}`}
                 >
                    {photo.uploading ? (
                      <Loader2 size={32} className="animate-spin text-amber-400" />
                    ) : (photo.preview || formData.foto) ? (
                      <img src={photo.preview || formData.foto} alt="Perfil" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-black text-amber-500 tracking-tighter">{initials}</span>
                    )}
                    {isEditing && !photo.uploading && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={24} className="text-white" />
                      </div>
                    )}
                 </div>
               </div>

               <div>
                 <div className="flex items-center gap-3 mb-2">
                   <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white drop-shadow-xl">{formData.nombre} {formData.apellido}</h1>
                   <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-md">
                     <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{perfil?.rol || 'CLIENTE'}</span>
                   </div>
                 </div>
                 <div className="flex flex-wrap items-center gap-4 text-slate-400">
                   <div className="flex items-center gap-1.5 text-xs font-bold">
                     <Mail size={14} className="text-amber-500/50" />
                     {formData.email}
                   </div>
                   <div className="w-1 h-1 rounded-full bg-slate-700" />
                   <div className="flex items-center gap-1.5 text-xs font-bold">
                     <MapPin size={14} className="text-amber-500/50" />
                     {formData.ciudad || 'Sin ubicación'}
                   </div>
                 </div>
               </div>
            </div>

            <button
              onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-xl animate-fade-in-up
                ${isEditing
                ? 'bg-slate-800/80 text-slate-300 border border-white/10 hover:bg-slate-700 backdrop-blur-xl'
                : 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border border-amber-400/30 hover:scale-105 hover:shadow-amber-500/20 active:scale-95'
                }`}
                style={{ animationDelay: '200ms' }}
            >
              {isEditing ? <><X size={14} strokeWidth={3} /> Cancelar</> : <><Edit2 size={14} strokeWidth={3} /> Editar perfil</>}
            </button>
          </div>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">

          {/* ══ SIDEBAR AREA ══ */}
          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            
            {/* Quick Stats / Info */}
            <div className="bg-slate-900/40 border border-amber-500/10 rounded-[2rem] p-8 backdrop-blur-2xl shadow-2xl">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-6">Información Básica</h3>
              <div className="space-y-2">
                  <InfoRow icon={<Phone size={14} />} label="Teléfono" value={formData.telefonoPrincipal} />
                  <InfoRow icon={<MapPin size={14} />} label="Ciudad"  value={formData.ciudad} />
                  <InfoRow icon={<Map size={14} />} label="Barrio"  value={formData.barrio} />
              </div>

              {/* Document Info as a specialized field */}
              <div className="mt-8 pt-8 border-t border-white/5">
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.25em] font-black mb-4">Documentación</p>
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-amber-500/10 flex items-center gap-4 group hover:bg-white/[0.05] transition-all">
                    <div className="w-10 h-10 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-center text-slate-400 group-hover:text-amber-400 transition-colors">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{tipoDocLabel[formData.tipoDocumento]}</p>
                      <p className="text-sm text-white font-black tracking-wider mt-0.5">{formData.numeroDocumento}</p>
                    </div>
                </div>
              </div>
            </div>

            {/* Smart Tips Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-red-600 rounded-[2rem] p-8 shadow-2xl group cursor-default">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                  <Shield size={18} className="text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight mb-2">Seguridad de Datos</h4>
                  <p className="text-xs text-white/80 leading-relaxed font-medium">Sus datos están protegidos. El número de identificación no es editable por seguridad pública.</p>
                </div>
              </div>
            </div>
          </div>

          {/* ══ MAIN FORM AREA ══ */}
          <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            
            {/* Personal Details Form */}
            <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-2xl shadow-2xl">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                  <User size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight italic">Detalles de la Cuenta</h3>
                  <p className="text-xs text-slate-500 font-medium">Actualiza tu información personal y de contacto para tus reservas.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                <Field label="Primer Nombre" name="nombre" value={formData.nombre} icon={<User size={16} />} editing={isEditing} onChange={handleChange as any} />
                <Field label="Apellidos" name="apellido" value={formData.apellido} icon={<User size={16} />} editing={isEditing} onChange={handleChange as any} />
                
                {/* DatePicker Custom style */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2.5 ml-1">Fecha de Nacimiento</label>
                  <div className="relative">
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 z-10 ${isEditing ? 'text-amber-500' : 'text-slate-500'}`}>
                      <Calendar size={16} />
                    </span>
                    <input
                        type="date"
                        name="fechaNacimiento"
                        value={formData.fechaNacimiento}
                        onChange={handleChange as any}
                        disabled={!isEditing}
                        className={`w-full pl-11 pr-4 py-4 rounded-xl text-sm font-bold outline-none transition-all duration-300 [color-scheme:dark]
                        ${isEditing
                            ? 'bg-slate-900/40 border border-white/10 text-white focus:bg-slate-900/60 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/5 shadow-inner'
                            : 'bg-transparent border border-transparent text-slate-200 cursor-default uppercase tracking-widest'
                        }`}
                    />
                  </div>
                </div>

                <Field label="Correo de Facturación" name="email" value={formData.email} type="email" icon={<Mail size={16} />} editing={false} readOnly hint="Solo modificable por administración." />
                
                <Field label="Teléfono Móvil" name="telefonoPrincipal" value={formData.telefonoPrincipal} type="tel" icon={<Phone size={16} />} editing={isEditing} onChange={handleChange as any} />
                <Field label="Teléfono Respaldo" name="telefonoAlternativo" value={formData.telefonoAlternativo} type="tel" icon={<Phone size={16} />} editing={isEditing} onChange={handleChange as any} />
                
                <Field label="Ciudad Residencia" name="ciudad" value={formData.ciudad} icon={<MapPin size={16} />} editing={isEditing} onChange={handleChange as any} />
                <Field label="Barrio / Sector" name="barrio" value={formData.barrio} icon={<Map size={16} />} editing={isEditing} onChange={handleChange as any} />
                
                <Field label="Dirección Completa" name="direccion" value={formData.direccion} icon={<Home size={16} />} editing={isEditing} onChange={handleChange as any} colSpan />

                <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2.5 ml-1">Zona de Servicio Preferida</label>
                    <div className="relative">
                      <span className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 z-10 ${isEditing ? 'text-amber-500' : 'text-slate-500'}`}>
                        <MapPin size={16} />
                      </span>
                      <select
                          name="zonaServicio"
                          value={formData.zonaServicio}
                          onChange={handleChange as any}
                          disabled={!isEditing}
                          className={`w-full pl-11 pr-4 py-4 rounded-xl text-sm font-bold outline-none transition-all duration-300 appearance-none
                          ${isEditing
                              ? 'bg-slate-900/40 border border-white/10 text-white focus:bg-slate-900/60 focus:border-amber-500/50 cursor-pointer'
                              : 'bg-transparent border border-transparent text-slate-200 cursor-default'
                          }`}
                      >
                          <option value="URBANA" className="bg-slate-900 font-bold uppercase tracking-widest">Zona Urbana</option>
                          <option value="RURAL"  className="bg-slate-900 font-bold uppercase tracking-widest">Zona Rural / Especial</option>
                      </select>
                    </div>
                </div>
              </div>

              {isEditing && (
                <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-end gap-4">
                  <button onClick={handleCancel} className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                    Descartar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center gap-3 px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white bg-amber-500 hover:bg-amber-400 disabled:opacity-50 transition-all shadow-xl shadow-amber-900/20 active:scale-95"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} strokeWidth={2.5} />}
                    Guardar Perfil
                  </button>
                </div>
              )}
            </div>

            {/* Account Status Segment */}
            <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-2 overflow-hidden backdrop-blur-2xl shadow-2xl">
               <div className="flex flex-col md:flex-row items-center gap-4 p-6 bg-slate-800/20 rounded-[2rem] border border-white/5">
                 <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-900/10">
                   <Shield size={24} strokeWidth={2.5} />
                 </div>
                 <div className="flex-1 text-center md:text-left">
                   <h4 className="text-base font-black text-white italic">Acceso Verificado</h4>
                   <p className="text-xs text-slate-500 font-medium">Tu cuenta está protegida y verificada. El correo electrónico principal está vinculado a tu identidad.</p>
                 </div>
                 <div className="px-6 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">ACTIVA</span>
                 </div>
               </div>
            </div>

            {/* Payments History Card */}
            <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 md:p-10 backdrop-blur-2xl shadow-2xl">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <CreditCard size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight italic">Transacciones Recientes</h3>
                    <p className="text-xs text-slate-500 font-medium">Visualiza tus últimos abonos realizados a reservas.</p>
                  </div>
                </div>
                {!isLoadingAbonos && abonos.length > 0 && (
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Total Histórico</p>
                    <p className="text-2xl font-black text-emerald-400 tracking-tighter shadow-sm">
                      ${abonos.reduce((sum, pago) => sum + pago.amount, 0).toLocaleString('es-CO')}
                    </p>
                  </div>
                )}
              </div>

              {isLoadingAbonos ? (
                 <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-600">
                    <Loader2 size={32} className="animate-spin text-amber-500" />
                    <p className="text-xs font-black uppercase tracking-[0.3em]">Procesando historial</p>
                 </div>
              ) : abonos.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 px-10 text-center border-2 border-dashed border-white/5 rounded-[2rem] bg-white/[0.01]">
                    <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-600 mb-4">
                      <CreditCard size={32} strokeWidth={1} />
                    </div>
                    <p className="text-sm font-bold text-slate-500 max-w-xs">No hemos encontrado registros de abonos asociados a tu cuenta por el momento.</p>
                 </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {abonos.map((abono, idx) => (
                    <div key={abono.id} className="group p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${500 + (idx * 50)}ms` }}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10">
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">
                            {new Date(abono.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <span className="text-lg font-black text-emerald-400 tracking-tight">${abono.amount.toLocaleString('es-CO')}</span>
                      </div>
                      <div className="space-y-3">
                         <div className="flex items-center justify-between">
                            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Método de pago</p>
                            <span className="text-xs font-bold text-slate-300 uppercase">{abono.method}</span>
                         </div>
                         <div className="flex items-center justify-between">
                            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">ID Reserva</p>
                            <span className="text-xs font-bold text-amber-500/80">#{abono.reservationId}</span>
                         </div>
                         {abono.notes && (
                           <div className="mt-4 pt-4 border-t border-white/5">
                             <p className="text-[10px] italic text-slate-500 font-medium leading-relaxed">
                               &ldquo;{abono.notes}&rdquo;
                             </p>
                           </div>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
);
};

// ─── PhotoUploadWidget Component ──────────────────────────────────────────────

interface PhotoWidgetProps {
  photo: ReturnType<typeof usePhotoUpload>;
  currentUrl?: string;
  size?: 'sm' | 'md';
}

const PhotoUploadWidget: React.FC<PhotoWidgetProps> = ({ photo, currentUrl, size = 'md' }) => {
  const dim = size === 'sm' ? 'w-20 h-20' : 'w-24 h-24';
  const displayUrl = photo.preview || currentUrl;

  return (
    <div className="flex flex-col items-center gap-2 mb-6">
      <input
        ref={photo.inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={photo.handleFileChange}
      />
      <div
        onClick={photo.triggerPick}
        className={`relative group ${dim} rounded-full border-2 border-dashed overflow-hidden flex items-center justify-center transition-colors
          ${photo.uploading
            ? 'border-amber-300 cursor-wait opacity-70'
            : 'border-slate-200 hover:border-amber-400 cursor-pointer'
          }`}
      >
        {photo.uploading ? (
          <Loader2 size={24} className="animate-spin text-amber-400" />
        ) : displayUrl ? (
          <>
            <img src={displayUrl} alt="Foto" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={20} className="text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-300 group-hover:text-amber-400 transition-colors">
            <Camera size={24} />
          </div>
        )}
      </div>

      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {photo.uploading ? 'Subiendo...' : displayUrl ? 'Cambiar foto' : 'Subir foto'}
      </p>

      {currentUrl && !photo.uploading && !photo.preview && (
        <span className="text-[10px] text-emerald-500 flex items-center gap-1">
          <CheckCircle size={10} /> Foto guardada
        </span>
      )}
      {photo.preview && !photo.uploading && (
        <span className="text-[10px] text-emerald-500 flex items-center gap-1">
          <CheckCircle size={10} /> Foto lista
        </span>
      )}
      {photo.error && (
        <span className="text-[10px] text-red-500 flex items-center gap-1">
          <AlertCircle size={10} /> {photo.error}
        </span>
      )}
      <p className="text-[10px] text-slate-300">JPG, PNG, WEBP · Máx 5MB</p>
    </div>
  );
};

export default ProfilePage;