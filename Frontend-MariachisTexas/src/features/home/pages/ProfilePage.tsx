// src/features/profile/pages/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  User, Mail, Phone, MapPin, FileText, Calendar,
  Home, Map, CheckCircle, AlertCircle, X, Loader2,
  Edit2, Save, ChevronRight, Shield, Camera, Music,
  Star, Mic2
} from 'lucide-react';
import { profileService, PerfilData } from '@/shared/services/perfilservices.ts';
import { useAuth } from '@/shared/contexts/AuthContext';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';
import { usePhotoUpload } from '@/shared/hooks/Usephotoupload .ts';
import { abonoService, EnrichedPayment } from '@/src/features/abonos/services/abonoService';

const tipoDocLabel: Record<string, string> = {
  CC: 'Cédula de Ciudadanía',
  CE: 'Cédula de Extranjería',
  PAS: 'Pasaporte',
};

interface FieldProps {
  label: string;
  value: string;
  name: string;
  icon: React.ReactNode;
  type?: string;
  editing: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readOnly?: boolean;
  hint?: string;
  colSpan?: boolean;
}

const Field: React.FC<FieldProps> = ({
  label, value, name, icon, type = 'text',
  editing, onChange, readOnly, hint, colSpan
}) => (
  <div className={`group ${colSpan ? 'md:col-span-2' : ''}`}>
    <label className="block text-[10px] font-black text-[#f1bf00]/50 uppercase tracking-[0.25em] mb-2 ml-1">
      {label}
    </label>
    <div className="relative">
      <span className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-all duration-300
        ${editing && !readOnly ? 'text-[#f1bf00]' : 'text-slate-600 group-hover:text-slate-400'}`}>
        {icon}
      </span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={!editing || readOnly}
        className={`w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-semibold outline-none transition-all duration-300
          ${readOnly
            ? 'bg-white/[0.02] text-slate-600 cursor-not-allowed border border-white/[0.03]'
            : editing
              ? 'bg-black/40 border border-[#f1bf00]/20 text-white focus:border-[#f1bf00]/50 focus:bg-black/60 focus:ring-2 focus:ring-[#f1bf00]/10'
              : 'bg-transparent border border-transparent text-slate-300 cursor-default'
          }`}
      />
      {editing && !readOnly && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#f1bf00] animate-pulse" />
      )}
    </div>
    {hint && <p className="text-[10px] text-slate-600 mt-1.5 ml-1">{hint}</p>}
  </div>
);

const InfoPill: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 py-3.5 border-b border-white/[0.04] last:border-0 group">
    <div className="w-8 h-8 rounded-lg bg-[#ce1126]/10 border border-[#ce1126]/20 flex items-center justify-center text-[#ce1126]/70 group-hover:text-[#ce1126] transition-colors flex-shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[9px] text-slate-600 uppercase tracking-[0.2em] font-black">{label}</p>
      <p className="text-sm text-slate-200 font-semibold truncate">{value || '—'}</p>
    </div>
  </div>
);

export const ProfilePage: React.FC = () => {
  const { updateUser } = useAuth();

  const [perfil,           setPerfil]           = useState<PerfilData | null>(null);
  const [isLoadingGet,     setIsLoadingGet]     = useState(true);
  const [isEditing,        setIsEditing]        = useState(false);
  const [isLoading,        setIsLoading]        = useState(false);
  const [notification,     setNotification]     = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [abonos,           setAbonos]           = useState<EnrichedPayment[]>([]);

  const [formData, setFormData] = useState({
    nombre: '', apellido: '', tipoDocumento: 'CC' as 'CC' | 'CE' | 'TI' | 'PAS',
    numeroDocumento: '', fechaNacimiento: '', email: '',
    telefonoPrincipal: '', telefonoAlternativo: '',
    ciudad: '', barrio: '', direccion: '',
    zonaServicio: 'URBANA' as 'URBANA' | 'RURAL', foto: ''
  });

  const photo = usePhotoUpload({
    folder: 'usuarios/fotos',
    onSuccess: (url) => setFormData(prev => ({ ...prev, foto: url })),
  });

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await profileService.obtener();
        setPerfil(data);
        setFormData({
          nombre: data.nombre, apellido: data.apellido,
          tipoDocumento: data.tipoDocumento, numeroDocumento: data.numeroDocumento,
          fechaNacimiento: data.fechaNacimiento, email: data.email,
          telefonoPrincipal: data.telefonoPrincipal, telefonoAlternativo: data.telefonoAlternativo,
          ciudad: data.ciudad, barrio: data.barrio, direccion: data.direccion,
          zonaServicio: data.zonaServicio, foto: data.foto || '',
        });
      } catch (err) {
        showNotification(getErrorMessage(err), 'error');
      } finally {
        setIsLoadingGet(false);
      }
    };
    const cargarAbonos = async () => {
      try { setAbonos(await abonoService.getAbonos()); } catch {}
    };
    cargar(); cargarAbonos();
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
      nombre: perfil.nombre, apellido: perfil.apellido,
      tipoDocumento: perfil.tipoDocumento, numeroDocumento: perfil.numeroDocumento,
      fechaNacimiento: perfil.fechaNacimiento, email: perfil.email,
      telefonoPrincipal: perfil.telefonoPrincipal, telefonoAlternativo: perfil.telefonoAlternativo,
      ciudad: perfil.ciudad, barrio: perfil.barrio, direccion: perfil.direccion,
      zonaServicio: perfil.zonaServicio, foto: perfil.foto || '',
    });
    photo.reset();
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const actualizado = await profileService.actualizar({
        nombre: formData.nombre, email: formData.email, apellido: formData.apellido,
        tipoDocumento: formData.tipoDocumento,
        numeroDocumento: formData.numeroDocumento,
        telefonoPrincipal: formData.telefonoPrincipal,
        telefonoAlternativo: formData.telefonoAlternativo || undefined,
        ciudad: formData.ciudad, barrio: formData.barrio, direccion: formData.direccion,
        zonaServicio: formData.zonaServicio, fechaNacimiento: formData.fechaNacimiento,
        foto: formData.foto || undefined,
      });
      setPerfil(actualizado);
      updateUser({
        name: actualizado.nombre, lastName: actualizado.apellido, email: actualizado.email,
        phone: actualizado.telefonoPrincipal, secondaryPhone: actualizado.telefonoAlternativo,
        city: actualizado.ciudad, neighborhood: actualizado.barrio,
        address: actualizado.direccion, birthDate: actualizado.fechaNacimiento,
        avatar: actualizado.foto ?? undefined,
      });
      showNotification('Perfil actualizado correctamente', 'success');
      setIsEditing(false);
      photo.reset();
    } catch (err) {
      showNotification(getErrorMessage(err), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingGet) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-[#f1bf00]/20 border-t-[#f1bf00] animate-spin" />
            <div className="absolute inset-3 rounded-full border border-[#ce1126]/30 border-b-[#ce1126] animate-spin animate-reverse" />
          </div>
          <p className="text-[#f1bf00]/60 text-xs font-black tracking-[0.3em] uppercase">Cargando perfil</p>
        </div>
      </div>
    );
  }

  const initials = `${formData.nombre?.[0] ?? ''}${formData.apellido?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">

      {/* ── Fondo ambiente ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#ce1126]/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#009c3b]/6 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#f1bf00]/3 rounded-full blur-[160px]" />
        {/* Patrón de puntos */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      {/* ── Toast ── */}
      {notification && createPortal(
        <div className="fixed top-6 right-6 z-[9999]" style={{ animation: 'slideIn 0.3s ease' }}>
          <div className={`flex items-center gap-3 pl-4 pr-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-2xl min-w-[300px]
            ${notification.type === 'success'
              ? 'bg-[#050505]/95 border-[#009c3b]/30'
              : 'bg-[#050505]/95 border-[#ce1126]/30'}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
              ${notification.type === 'success' ? 'bg-[#009c3b]/20 text-[#009c3b]' : 'bg-[#ce1126]/20 text-[#ce1126]'}`}>
              {notification.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            </div>
            <p className="text-sm text-white font-semibold flex-1">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="text-slate-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ── HERO BANNER ── */}
      <div className="relative h-72">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/images/Mariachis 16.jpeg"
            alt="Banner"
            className="w-full h-full object-cover object-center scale-110"
            style={{ filter: 'brightness(0.25) saturate(0.8)' }}
          />
        </div>
        {/* Franja tricolor en la parte inferior */}
        <div className="absolute bottom-0 left-0 right-0 h-1 flex">
          <div className="flex-1 bg-[#009c3b]" />
          <div className="flex-1 bg-white/80" />
          <div className="flex-1 bg-[#ce1126]" />
        </div>
        {/* Gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/80 via-transparent to-[#050505]/80" />

        {/* Breadcrumb */}
        <div className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-black text-[#f1bf00]/50 uppercase tracking-[0.25em]">
          <span>Inicio</span>
          <ChevronRight size={10} strokeWidth={3} className="opacity-40" />
          <span className="text-[#f1bf00]">Mi Perfil</span>
        </div>

        {/* Decoración musical */}
        <div className="absolute top-8 right-8 flex items-center gap-2 opacity-20">
          <Music size={14} className="text-[#f1bf00]" />
          <Star size={10} className="text-[#f1bf00] fill-[#f1bf00]" />
          <Mic2 size={14} className="text-[#f1bf00]" />
        </div>

        {/* Avatar e info superpuestos */}
        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-10 pb-0">
          <div className="flex items-end gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0 mb-[-36px] ml-0">
              <div className="absolute -inset-1 bg-gradient-to-br from-[#f1bf00] via-[#ce1126] to-[#009c3b] rounded-3xl blur-sm opacity-60" />
              <input ref={photo.inputRef} type="file" accept="image/jpeg,image/png,image/webp"
                className="hidden" onChange={photo.handleFileChange} />
              <div
                onClick={isEditing ? photo.triggerPick : undefined}
                className={`relative w-28 h-28 rounded-3xl bg-[#0d0d0d] border-2 border-[#f1bf00]/30 overflow-hidden flex items-center justify-center shadow-2xl transition-all duration-300 ${isEditing ? 'cursor-pointer hover:border-[#f1bf00]' : ''}`}
              >
                {photo.uploading ? (
                  <Loader2 size={28} className="animate-spin text-[#f1bf00]" />
                ) : (photo.preview || formData.foto) ? (
                  <img src={photo.preview || formData.foto} alt="Perfil" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-[#f1bf00] tracking-tighter">{initials}</span>
                )}
                {isEditing && !photo.uploading && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera size={22} className="text-[#f1bf00]" />
                  </div>
                )}
              </div>
            </div>

            {/* Nombre y rol */}
            <div className="pb-4 flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-xl">
                  {formData.nombre} {formData.apellido}
                </h1>
                <span className="px-3 py-1 rounded-full bg-[#f1bf00]/10 border border-[#f1bf00]/30 text-[10px] font-black text-[#f1bf00] uppercase tracking-widest">
                  {perfil?.rol || 'CLIENTE'}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1.5 text-slate-400 text-xs flex-wrap">
                <span className="flex items-center gap-1.5"><Mail size={12} className="text-[#ce1126]/60" />{formData.email}</span>
                <span className="flex items-center gap-1.5"><MapPin size={12} className="text-[#009c3b]/60" />{formData.ciudad || 'Sin ciudad'}</span>
              </div>
            </div>

            {/* Botón editar */}
            <div className="pb-4 flex-shrink-0">
              <button
                onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 border
                  ${isEditing
                    ? 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    : 'bg-[#ce1126] text-white border-[#f1bf00]/40 hover:bg-[#a80b1e] shadow-[0_0_20px_rgba(206,17,38,0.4)] hover:shadow-[0_0_30px_rgba(206,17,38,0.6)]'
                  }`}
              >
                {isEditing ? <><X size={14} /> Cancelar</> : <><Edit2 size={14} /> Editar</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <div className="relative max-w-6xl mx-auto px-6 md:px-10 pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">

          {/* ══ SIDEBAR ══ */}
          <div className="space-y-5">

            {/* Info rápida */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl">
              <p className="text-[10px] font-black text-[#f1bf00]/60 uppercase tracking-[0.25em] mb-5 flex items-center gap-2">
                <Star size={10} className="fill-[#f1bf00] text-[#f1bf00]" /> Información
              </p>
              <InfoPill icon={<Phone size={14} />} label="Teléfono" value={formData.telefonoPrincipal} />
              <InfoPill icon={<MapPin size={14} />} label="Ciudad" value={formData.ciudad} />
              <InfoPill icon={<Map size={14} />} label="Barrio" value={formData.barrio} />
            </div>

            {/* Documento */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl">
              <p className="text-[10px] font-black text-[#f1bf00]/60 uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
                <FileText size={10} /> Documento
              </p>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                <div className="w-9 h-9 rounded-lg bg-[#ce1126]/15 border border-[#ce1126]/20 flex items-center justify-center text-[#ce1126]/80 flex-shrink-0">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{tipoDocLabel[formData.tipoDocumento]}</p>
                  <p className="text-sm text-white font-black tracking-wider">{formData.numeroDocumento}</p>
                </div>
              </div>
            </div>

            {/* Badge verificado */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#009c3b]/20 to-[#009c3b]/5 border border-[#009c3b]/20 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#009c3b]/20 border border-[#009c3b]/30 flex items-center justify-center text-[#009c3b]">
                  <Shield size={18} />
                </div>
                <div>
                  <p className="text-xs font-black text-white">Cuenta Verificada</p>
                  <p className="text-[10px] text-[#009c3b]/80 font-medium mt-0.5">Acceso activo y seguro</p>
                </div>
                <div className="ml-auto">
                  <span className="px-2.5 py-1 rounded-full bg-[#009c3b]/20 border border-[#009c3b]/30 text-[9px] font-black text-[#009c3b] uppercase tracking-widest">
                    ACTIVA
                  </span>
                </div>
              </div>
            </div>

            {/* Banner Mariachis */}
            <div className="relative overflow-hidden rounded-2xl">
              <img src="/images/Mariachis 11.jpeg" alt=""
                className="w-full h-36 object-cover opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#ce1126]/80 via-black/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col items-center justify-end p-4 text-center">
                <p className="text-[#f1bf00] font-black text-xs uppercase tracking-[0.2em] drop-shadow-lg">Mariachis Texas</p>
                <p className="text-white/70 text-[10px] font-medium">Medellín · Colombia</p>
              </div>
              {/* Franja tricolor */}
              <div className="absolute top-0 left-0 right-0 h-0.5 flex">
                <div className="flex-1 bg-[#009c3b]" />
                <div className="flex-1 bg-white" />
                <div className="flex-1 bg-[#ce1126]" />
              </div>
            </div>
          </div>

          {/* ══ FORMULARIO ══ */}
          <div className="space-y-6">

            {/* Datos personales */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 backdrop-blur-xl">

              {/* Header sección */}
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/[0.05]">
                <div className="w-10 h-10 rounded-xl bg-[#ce1126]/15 border border-[#ce1126]/25 flex items-center justify-center text-[#ce1126]">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-tight">Datos Personales</h3>
                  <p className="text-[11px] text-slate-500">Información de tu cuenta y contacto</p>
                </div>
                {isEditing && (
                  <span className="ml-auto px-3 py-1 rounded-full bg-[#f1bf00]/10 border border-[#f1bf00]/30 text-[9px] font-black text-[#f1bf00] uppercase tracking-widest animate-pulse">
                    Editando
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <Field label="Nombre" name="nombre" value={formData.nombre} icon={<User size={15} />} editing={isEditing} onChange={handleChange as any} />
                <Field label="Apellidos" name="apellido" value={formData.apellido} icon={<User size={15} />} editing={isEditing} onChange={handleChange as any} />

                <div>
                  <label className="block text-[10px] font-black text-[#f1bf00]/50 uppercase tracking-[0.25em] mb-2 ml-1">
                    Tipo de Documento
                  </label>
                  <div className="relative">
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors ${isEditing ? 'text-[#f1bf00]' : 'text-slate-600'}`}>
                      <FileText size={15} />
                    </span>
                    <select
                      name="tipoDocumento"
                      value={formData.tipoDocumento}
                      onChange={handleChange as any}
                      disabled={!isEditing}
                      className={`w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-semibold outline-none transition-all appearance-none
                        ${isEditing
                          ? 'bg-black/40 border border-[#f1bf00]/20 text-white focus:border-[#f1bf00]/50 cursor-pointer'
                          : 'bg-transparent border border-transparent text-slate-300 cursor-default'}`}
                    >
                      <option value="CC" className="bg-[#0d0d0d]">CC - Cédula de Ciudadanía</option>
                      <option value="CE" className="bg-[#0d0d0d]">CE - Cédula de Extranjería</option>
                      <option value="TI" className="bg-[#0d0d0d]">TI - Tarjeta de Identidad</option>
                      <option value="PAS" className="bg-[#0d0d0d]">PAS - Pasaporte</option>
                    </select>
                  </div>
                </div>

                <Field label="Número de Documento" name="numeroDocumento" value={formData.numeroDocumento} icon={<FileText size={15} />} editing={isEditing} onChange={handleChange as any} />

                {/* Fecha nacimiento */}
                <div>
                  <label className="block text-[10px] font-black text-[#f1bf00]/50 uppercase tracking-[0.25em] mb-2 ml-1">
                    Fecha de Nacimiento
                  </label>
                  <div className="relative">
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors ${isEditing ? 'text-[#f1bf00]' : 'text-slate-600'}`}>
                      <Calendar size={15} />
                    </span>
                    <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento}
                      onChange={handleChange as any} disabled={!isEditing}
                      className={`w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-semibold outline-none transition-all [color-scheme:dark]
                        ${isEditing
                          ? 'bg-black/40 border border-[#f1bf00]/20 text-white focus:border-[#f1bf00]/50 focus:ring-2 focus:ring-[#f1bf00]/10'
                          : 'bg-transparent border border-transparent text-slate-300 cursor-default'}`}
                    />
                  </div>
                </div>

                <Field label="Correo" name="email" value={formData.email} type="email"
                  icon={<Mail size={15} />} editing={isEditing} onChange={handleChange as any} />

                <Field label="Teléfono Principal" name="telefonoPrincipal" value={formData.telefonoPrincipal}
                  type="tel" icon={<Phone size={15} />} editing={isEditing} onChange={handleChange as any} />
                <Field label="Teléfono Alternativo" name="telefonoAlternativo" value={formData.telefonoAlternativo}
                  type="tel" icon={<Phone size={15} />} editing={isEditing} onChange={handleChange as any} />

                <Field label="Ciudad" name="ciudad" value={formData.ciudad}
                  icon={<MapPin size={15} />} editing={isEditing} onChange={handleChange as any} />
                <Field label="Barrio / Sector" name="barrio" value={formData.barrio}
                  icon={<Map size={15} />} editing={isEditing} onChange={handleChange as any} />

                <Field label="Dirección Completa" name="direccion" value={formData.direccion}
                  icon={<Home size={15} />} editing={isEditing} onChange={handleChange as any} colSpan />

                {/* Zona de servicio */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-[#f1bf00]/50 uppercase tracking-[0.25em] mb-2 ml-1">
                    Zona de Servicio
                  </label>
                  <div className="relative">
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 transition-colors ${isEditing ? 'text-[#f1bf00]' : 'text-slate-600'}`}>
                      <MapPin size={15} />
                    </span>
                    <select name="zonaServicio" value={formData.zonaServicio}
                      onChange={handleChange as any} disabled={!isEditing}
                      className={`w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-semibold outline-none transition-all appearance-none
                        ${isEditing
                          ? 'bg-black/40 border border-[#f1bf00]/20 text-white focus:border-[#f1bf00]/50 cursor-pointer'
                          : 'bg-transparent border border-transparent text-slate-300 cursor-default'}`}
                    >
                      <option value="URBANA" className="bg-[#0d0d0d]">Zona Urbana — Medellín y área metropolitana</option>
                      <option value="RURAL" className="bg-[#0d0d0d]">Zona Rural — Veredas, fincas y corregimientos</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Botones guardar */}
              {isEditing && (
                <div className="mt-8 pt-6 border-t border-white/[0.05] flex items-center justify-end gap-3">
                  <button onClick={handleCancel}
                    className="px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                    Descartar
                  </button>
                  <button onClick={handleSave} disabled={isLoading}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] text-white bg-[#ce1126] hover:bg-[#a80b1e] disabled:opacity-50 transition-all border border-[#f1bf00]/30 shadow-[0_0_20px_rgba(206,17,38,0.3)] hover:shadow-[0_0_30px_rgba(206,17,38,0.5)] active:scale-95">
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Guardar Cambios
                  </button>
                </div>
              )}
            </div>

            {/* Seguridad */}
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-6 flex flex-col md:flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#f1bf00]/10 border border-[#f1bf00]/20 flex items-center justify-center text-[#f1bf00] flex-shrink-0">
                <Shield size={22} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-sm font-black text-white">Seguridad de Datos</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tu número de identificación y correo electrónico son de solo lectura por razones de seguridad.
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="h-0.5 w-16 flex md:hidden mx-auto mb-4">
                  <div className="flex-1 bg-[#009c3b]" />
                  <div className="flex-1 bg-white/50" />
                  <div className="flex-1 bg-[#ce1126]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes reverse { to { transform: rotate(-360deg); } }
        .animate-reverse { animation-direction: reverse; }
      `}</style>
    </div>
  );
};

export default ProfilePage;
