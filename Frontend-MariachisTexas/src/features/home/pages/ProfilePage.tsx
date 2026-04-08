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
onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
<div className={colSpan ? 'md:col-span-2' : ''}>
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2">
    {label}
    </label>
    <div className="relative">
    <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200
        ${editing && !readOnly ? 'text-amber-400' : 'text-slate-600'}`}>
        {icon}
    </span>
    <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={!editing || readOnly}
        className={`
        w-full pl-10 pr-4 py-3 rounded-lg text-sm font-medium outline-none transition-all duration-200
        ${readOnly
            ? 'bg-slate-800/20 text-slate-600 cursor-not-allowed border border-transparent'
            : editing
            ? 'bg-slate-800/70 border border-slate-600/80 text-white focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/20'
            : 'bg-transparent border border-transparent text-slate-300 cursor-default'
        }
        `}
    />
    </div>
    {hint && <p className="text-[10px] text-slate-600 mt-1 ml-0.5">{hint}</p>}
</div>
);

// ─── Stat Badge ───────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
<div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-white/6 flex items-center justify-center text-slate-500 flex-shrink-0">
    {icon}
    </div>
    <div className="min-w-0">
    <p className="text-[10px] text-slate-600 uppercase tracking-wider font-bold">{label}</p>
    <p className="text-sm text-slate-300 font-semibold truncate">{value || '—'}</p>
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
    <div className="min-h-screen bg-[#07080a] text-white">

      {/* ── Ambient background ── */}
    <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-500/3 rounded-full blur-[160px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-slate-700/5 rounded-full blur-[120px]" />
        {/* Subtle grid */}
        <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
        }}
        />
    </div>

      {/* ── Toast notification ── */}
    {notification && createPortal(
        <div className="fixed top-5 right-5 z-[200]" style={{ animation: 'slideIn 0.3s ease' }}>
        <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }`}</style>
        <div className={`flex items-center gap-3 pl-4 pr-5 py-3.5 rounded-xl shadow-2xl border backdrop-blur-xl min-w-[300px]
            ${notification.type === 'success'
            ? 'bg-slate-900/95 border-emerald-500/30'
            : 'bg-slate-900/95 border-red-500/30'
            }`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
            ${notification.type === 'success' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
            {notification.type === 'success'
                ? <CheckCircle size={15} strokeWidth={2.5} />
                : <AlertCircle size={15} strokeWidth={2.5} />
            }
            </div>
            <p className="text-sm text-slate-300 font-medium flex-1">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="text-slate-600 hover:text-slate-400 transition-colors ml-1">
            <X size={14} />
            </button>
        </div>
        </div>,
        document.body
    )}

    <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 pb-20">

        {/* ── Breadcrumb + Header ── */}
        <div className="mb-10">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mb-4 font-medium uppercase tracking-[0.15em]">
            <span>Inicio</span>
            <ChevronRight size={11} />
            <span className="text-amber-500/80">Mi Perfil</span>
        </div>
        <div className="flex items-end justify-between">
            <div>
            <h1 className="text-2xl font-black tracking-tight text-white">Mi Perfil</h1>
            <p className="text-slate-600 text-sm mt-1">Gestiona tu información personal y de contacto.</p>
            </div>
            {/* Edit toggle — top level on desktop */}
            <button
            onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
            className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all duration-200
                ${isEditing
                ? 'bg-slate-800 text-slate-400 hover:bg-slate-700/80 border border-slate-700'
                : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40'
                }`}
            >
            {isEditing ? <><X size={12} /> Cancelar</> : <><Edit2 size={12} /> Editar perfil</>}
            </button>
        </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

          {/* ══ LEFT SIDEBAR ══ */}
        <div className="space-y-4">

            {/* Identity card */}
            <div className="bg-slate-900/50 border border-white/6 rounded-2xl p-6 backdrop-blur-sm">
              {/* Avatar — Photo upload widget */}
            <div className="flex flex-col items-center text-center mb-6">
                {isEditing ? (
                  <PhotoUploadWidget photo={photo} currentUrl={formData.foto} size="md" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20 flex items-center justify-center mb-4 shadow-lg shadow-amber-900/10 overflow-hidden">
                    {formData.foto ? (
                      <img src={formData.foto} alt="Perfil" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-black text-amber-400 tracking-tight">{initials}</span>
                    )}
                  </div>
                )}
                <h2 className="text-base font-black text-white tracking-tight mt-4">
                {formData.nombre} {formData.apellido}
                </h2>
                <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/8 border border-amber-500/15">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-[10px] font-bold text-amber-400/80 uppercase tracking-widest">
                    {perfil?.rol || 'CLIENTE'}
                </span>
                </div>
            </div>

              {/* Quick info rows */}
            <div className="space-y-0">
                <InfoRow icon={<Mail size={14} />}  label="Correo"   value={formData.email} />
                <InfoRow icon={<Phone size={14} />} label="Teléfono" value={formData.telefonoPrincipal} />
                <InfoRow icon={<MapPin size={14} />} label="Ciudad"  value={formData.ciudad} />
            </div>
            </div>

            {/* Document card */}
            <div className="bg-slate-900/50 border border-white/6 rounded-2xl p-5 backdrop-blur-sm">
            <p className="text-[10px] text-slate-600 uppercase tracking-[0.15em] font-bold mb-4">Documento</p>
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-white/6 flex items-center justify-center text-slate-500">
                <FileText size={15} />
                </div>
                <div>
                <p className="text-[11px] text-slate-500 font-semibold">{tipoDocLabel[formData.tipoDocumento]}</p>
                <p className="text-sm text-white font-black tracking-wide">{formData.numeroDocumento}</p>
                </div>
            </div>
            </div>

            {/* Info tip */}
            <div className="bg-slate-900/50 border border-amber-500/10 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield size={13} className="text-amber-400/70" />
                </div>
                <div>
                <p className="text-[11px] font-bold text-amber-400/70 mb-1.5">Datos en reservas</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                    Tu <span className="text-slate-400">nombre, teléfono y correo</span> se usan automáticamente al crear una reserva.
                </p>
                </div>
            </div>
            </div>

        </div>

          {/* ══ RIGHT MAIN AREA ══ */}
        <div className="space-y-4">

            {/* ── Personal info card ── */}
            <div className="bg-slate-900/50 border border-white/6 rounded-2xl overflow-hidden backdrop-blur-sm">

              {/* Card header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
                    <User size={13} className="text-amber-400/80" />
                </div>
                <div>
                    <h3 className="font-black text-white text-sm tracking-tight">Información Personal</h3>
                    <p className="text-[11px] text-slate-600 mt-0.5">Datos de contacto y ubicación</p>
                </div>
                </div>
                {/* Mobile edit toggle */}
                <button
                onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                className={`sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all
                    ${isEditing
                    ? 'bg-slate-800 text-slate-400 border border-slate-700'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                >
                {isEditing ? <><X size={11} /> Cancelar</> : <><Edit2 size={11} /> Editar</>}
                </button>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <Field label="Nombre"   name="nombre"   value={formData.nombre}
                    icon={<User size={14} />} editing={isEditing} onChange={handleChange as any} />
                <Field label="Apellido" name="apellido" value={formData.apellido}
                    icon={<User size={14} />} editing={isEditing} onChange={handleChange as any} />

                  {/* Tipo documento — read only */}
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2">Tipo Documento</label>
                    <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"><FileText size={14} /></span>
                    <div className="w-full pl-10 pr-4 py-3 rounded-lg text-sm font-medium text-slate-600 bg-slate-800/20 border border-transparent cursor-default">
                        {tipoDocLabel[formData.tipoDocumento]}
                    </div>
                    </div>
                    <p className="text-[10px] text-slate-700 mt-1">No editable una vez registrado.</p>
                </div>

                  {/* Número documento — read only */}
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2">N° Documento</label>
                    <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600"><Hash size={14} /></span>
                    <div className="w-full pl-10 pr-4 py-3 rounded-lg text-sm font-medium text-slate-600 bg-slate-800/20 border border-transparent cursor-default">
                        {formData.numeroDocumento}
                    </div>
                    </div>
                    <p className="text-[10px] text-slate-700 mt-1">No editable una vez registrado.</p>
                </div>

                  {/* Fecha nacimiento */}
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2">Fecha de Nacimiento</label>
                    <div className="relative">
                    <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200
                        ${isEditing ? 'text-amber-400' : 'text-slate-600'}`}>
                        <Calendar size={14} />
                    </span>
                    <input
                        type="date"
                        name="fechaNacimiento"
                        value={formData.fechaNacimiento}
                        onChange={handleChange as any}
                        disabled={!isEditing}
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg text-sm font-medium outline-none transition-all duration-200 [color-scheme:dark]
                        ${isEditing
                            ? 'bg-slate-800/70 border border-slate-600/80 text-white focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/20'
                            : 'bg-transparent border border-transparent text-slate-300 cursor-default'
                        }`}
                    />
                    </div>
                </div>

                {/* Email — always read only */}
                <Field
                    label="Correo Electrónico" name="email" value={formData.email} type="email"
                    icon={<Mail size={14} />} editing={false} onChange={handleChange as any}
                    readOnly hint="El correo no puede modificarse."
                />

                <Field label="Teléfono Principal"   name="telefonoPrincipal"   value={formData.telefonoPrincipal}   type="tel"
                    icon={<Phone size={14} />} editing={isEditing} onChange={handleChange as any} />
                <Field label="Teléfono Alternativo" name="telefonoAlternativo" value={formData.telefonoAlternativo} type="tel"
                    icon={<Phone size={14} />} editing={isEditing} onChange={handleChange as any} />

                <Field label="Ciudad" name="ciudad" value={formData.ciudad}
                    icon={<MapPin size={14} />} editing={isEditing} onChange={handleChange as any} />
                <Field label="Barrio"  name="barrio"  value={formData.barrio}
                    icon={<Map size={14} />} editing={isEditing} onChange={handleChange as any} />

                <Field label="Dirección" name="direccion" value={formData.direccion}
                    icon={<Home size={14} />} editing={isEditing} onChange={handleChange as any} colSpan />

                  {/* Zona servicio */}
                <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2">Zona de Servicio</label>
                    <div className="relative">
                    <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200
                        ${isEditing ? 'text-amber-400' : 'text-slate-600'}`}>
                        <MapPin size={14} />
                    </span>
                    <select
                        name="zonaServicio"
                        value={formData.zonaServicio}
                        onChange={handleChange as any}
                        disabled={!isEditing}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg text-sm font-medium outline-none transition-all duration-200 appearance-none
                        ${isEditing
                            ? 'bg-slate-800/70 border border-slate-600/80 text-white focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/20 cursor-pointer'
                            : 'bg-transparent border border-transparent text-slate-300 cursor-default'
                        }`}
                    >
                        <option value="URBANA" className="bg-slate-900">Urbana</option>
                        <option value="RURAL"  className="bg-slate-900">Rural</option>
                    </select>
                    </div>
                </div>

                </div>

                {/* Save / Cancel actions */}
                {isEditing && (
                <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-end gap-3">
                    <button
                    onClick={handleCancel}
                    className="px-5 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest text-slate-500 border border-slate-700/80 hover:bg-slate-800/60 transition-all duration-200"
                    >
                    Cancelar
                    </button>
                    <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest text-white bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-amber-900/20"
                    >
                    {isLoading
                        ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Guardando...</>
                        : <><Save size={13} /> Guardar cambios</>
                    }
                    </button>
                </div>
                )}
            </div>
            </div>

            {/* ── Email / security read-only card ── */}
            <div className="bg-slate-900/50 border border-white/6 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-white/6 flex items-center justify-center">
                <Shield size={13} className="text-slate-500" />
                </div>
                <h3 className="font-black text-white text-sm tracking-tight">Acceso a la cuenta</h3>
            </div>
            <div className="px-6 py-5">
                <div className="flex items-center justify-between gap-4 p-4 bg-slate-800/30 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-white/6 flex items-center justify-center text-slate-500">
                    <Mail size={15} />
                    </div>
                    <div>
                    <p className="text-xs font-bold text-white">Correo de acceso</p>
                    <p className="text-[12px] text-slate-500 mt-0.5">{formData.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/15">
                    <CheckCircle size={11} className="text-emerald-400" strokeWidth={2.5} />
                    <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider">Verificado</span>
                </div>
                </div>
            </div>
            </div>

            {/* ── Historial de Abonos ── */}
            <div className="bg-slate-900/50 border border-white/6 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
                <CreditCard size={13} className="text-emerald-400" />
                </div>
                <div>
                <h3 className="font-black text-white text-sm tracking-tight">Historial de Abonos</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Tus pagos registrados en reservas.</p>
                </div>
            </div>
            <div className="p-6 space-y-3">
                {isLoadingAbonos ? (
                <div className="flex items-center justify-center gap-3 py-10 text-slate-400">
                    <Loader2 size={18} className="animate-spin" />
                    <span>Cargando abonos...</span>
                </div>
                ) : abonos.length === 0 ? (
                <div className="text-center py-10 text-slate-400 italic border border-dashed border-slate-700 rounded-2xl bg-slate-900/40">
                    No se han registrado abonos para tu perfil.
                </div>
                ) : (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-[11px] uppercase tracking-widest text-slate-500 font-bold">
                    <span>Total abonos</span>
                    <span className="text-right">${abonos.reduce((sum, pago) => sum + pago.amount, 0).toLocaleString('es-CO')}</span>
                    </div>
                    <div className="grid grid-cols-[1fr_1fr_1fr] gap-3 text-[11px] uppercase tracking-widest text-slate-500">
                    <span>Fecha</span>
                    <span>Monto</span>
                    <span className="text-right">Método</span>
                    </div>
                    <div className="space-y-2">
                    {abonos.map((abono) => (
                        <div key={abono.id} className="grid grid-cols-[1fr_1fr_1fr] gap-3 p-4 rounded-2xl bg-slate-900/70 border border-white/5">
                        <span className="text-sm text-slate-300">{new Date(abono.date).toLocaleDateString('es-CO')}</span>
                        <span className="text-sm text-emerald-300">${abono.amount.toLocaleString('es-CO')}</span>
                        <span className="text-right text-slate-400 uppercase text-[11px] font-semibold">{abono.method}</span>
                        <div className="md:col-span-3 text-[11px] text-slate-500 mt-2">
                            Reserva #{abono.reservationId}{abono.notes ? ` • ${abono.notes}` : ''}
                        </div>
                        </div>
                    ))}
                    </div>
                </div>
                )}
            </div>
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