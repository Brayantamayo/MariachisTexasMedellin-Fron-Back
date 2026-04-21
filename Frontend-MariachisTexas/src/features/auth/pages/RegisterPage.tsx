import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { User, Mail, Lock, Phone, MapPin, Calendar, FileText, Camera, Home, Hash, Map, CheckCircle, AlertCircle, X, Loader2, Eye, EyeOff } from 'lucide-react';
import { authService } from '../pages/authService';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';
import { uploadImage } from '@/shared/services/uploadService';


interface Props {
  onNavigate: (path: string) => void;
}

const PlusIcon = ({ size, className }: { size: number; className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const RegisterPage: React.FC<Props> = ({ onNavigate }) => {
  const [emailFromUrl, setEmailFromUrl] = useState('');
  const tokenRef = useRef<string | null>(null);

  const [formData, setFormData] = useState({
    nombre:              '',
    apellido:            '',
    tipoDocumento:       'CC',
    numeroDocumento:     '',
    email:               '',
    telefono:            '',
    telefonoAlternativo: '',
    fechaNacimiento:     '',
    ciudad:              'Medellín',
    direccion:           '',
    barrio:              '',
    zonaServicio:        'URBANA',
    password:            '',
    confirmPassword:     '',
    foto:                ''   // ← URL de Cloudinary
  });

  // ─── Estado de la foto ────────────────────────────────────────────────────
  const [fotoPreview,     setFotoPreview]     = useState<string>('');
  const [uploadingFoto,   setUploadingFoto]   = useState(false);
  const [uploadFotoError, setUploadFotoError] = useState<string | null>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) return;
    tokenRef.current = token;
    window.history.replaceState({}, '', '/registro');
    authService.getRegistroToken(token)
      .then(data => {
        setEmailFromUrl(data.email);
        const partes = (data.nombre ?? '').trim().split(' ');
        setFormData(prev => ({
          ...prev,
          email:               data.email,
          nombre:              partes[0] || '',
          apellido:            partes.slice(1).join(' ') || '',
          telefono:            data.telefono  || '',
          telefonoAlternativo: data.telefono2 || '',
        }));
      })
      .catch(() => {});
  }, []);

  const [isLoading,    setIsLoading]    = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ─── Subir foto a Cloudinary ──────────────────────────────────────────────
  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview inmediato
    setFotoPreview(URL.createObjectURL(file));
    setUploadFotoError(null);
    setUploadingFoto(true);

    try {
      const url = await uploadImage(file, 'usuarios/fotos');
      setFormData(prev => ({ ...prev, foto: url }));
    } catch (err: any) {
      setUploadFotoError(err.message || 'Error al subir la foto');
      setFotoPreview('');
      setFormData(prev => ({ ...prev, foto: '' }));
    } finally {
      setUploadingFoto(false);
      if (fotoInputRef.current) fotoInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadingFoto) {
      showNotification('Espera a que termine de subir la foto.', 'error'); return;
    }
    if (formData.password !== formData.confirmPassword) {
      showNotification('Las contraseñas no coinciden.', 'error'); return;
    }
    if (formData.password.length < 6) {
      showNotification('La contraseña debe tener al menos 6 caracteres.', 'error'); return;
    }

    setIsLoading(true);
    try {
      await authService.registro({
        nombre:               formData.nombre,
        apellido:             formData.apellido,
        tipoDocumento:        formData.tipoDocumento,
        numeroDocumento:      formData.numeroDocumento,
        fechaNacimiento:      formData.fechaNacimiento,
        email:                formData.email,
        telefonoPrincipal:    formData.telefono,
        telefonoAlternativo:  formData.telefonoAlternativo || undefined,
        ciudad:               formData.ciudad,
        barrio:               formData.barrio,
        direccion:            formData.direccion,
        zonaServicio:         formData.zonaServicio,
        password:             formData.password,
        passwordConfirmation: formData.confirmPassword,
        foto:                 formData.foto || undefined,   // ← URL de Cloudinary
      });

      if (tokenRef.current) {
        authService.marcarTokenUsado(tokenRef.current).catch(() => {});
      }

      showNotification('¡Registro exitoso! Redirigiendo al inicio de sesión...', 'success');
      setTimeout(() => onNavigate('/login'), 2000);

    } catch (error: any) {
      showNotification(getErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  };
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-32 pb-12 bg-dark-900">

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary-600/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-secondary-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Toast */}
      {notification && createPortal(
        <div className="fixed top-6 right-6 z-[200] animate-fade-in-up">
          <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md min-w-[320px] ${
            notification.type === 'success'
              ? 'bg-dark-900/95 border-secondary-600'
              : 'bg-dark-900/95 border-primary-600'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              notification.type === 'success' ? 'bg-secondary-900 text-secondary-500' : 'bg-primary-900 text-primary-500'
            }`}>
              {notification.type === 'success' ? <CheckCircle size={20} strokeWidth={3} /> : <AlertCircle size={20} strokeWidth={3} />}
            </div>
            <div className="flex-1">
              <h4 className={`font-bold text-sm ${notification.type === 'success' ? 'text-secondary-400' : 'text-primary-400'}`}>
                {notification.type === 'success' ? '¡Excelente!' : '¡Atención!'}
              </h4>
              <p className="text-xs text-gray-400 font-medium mt-0.5">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="text-gray-500 hover:text-white p-1 hover:bg-white/10 rounded-lg">
              <X size={18} />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Card */}
      <div className="max-w-4xl w-full bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden animate-fade-in-up ring-1 ring-white/5">
        <div className="h-1.5 w-full bg-gradient-to-r from-secondary-600 via-white to-primary-600" />

        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-serif font-bold text-white mb-2 tracking-wide">ÚNETE A LA FAMILIA</h3>
            {emailFromUrl ? (
              <div className="mt-3 flex flex-col items-center gap-2">
                <div className="inline-flex items-center gap-2 bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-full text-xs font-bold">
                  <CheckCircle size={14} />
                  ¡Tus datos ya están pre-llenados! Solo completa lo que falta
                </div>
                <p className="text-gray-500 text-xs">Regístrate con <strong className="text-emerald-400">{emailFromUrl}</strong> para ver tu reserva</p>
              </div>
            ) : (
              <p className="text-gray-400 text-sm font-light uppercase tracking-wider">
                Campos obligatorios marcados con <span className="text-primary-500">*</span>
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ── Foto de perfil con Cloudinary ─────────────────────────── */}
            <div className="flex flex-col items-center gap-2 mb-6">
              <input
                ref={fotoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFotoChange}
              />
              <div
                className="relative group cursor-pointer"
                onClick={() => !uploadingFoto && fotoInputRef.current?.click()}
              >
                <div className={`w-28 h-28 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors
                  ${uploadingFoto ? 'border-secondary-400 opacity-70 cursor-wait' : 'border-gray-700 group-hover:border-secondary-500'}`}>
                  {uploadingFoto ? (
                    <Loader2 size={28} className="animate-spin text-secondary-400" />
                  ) : fotoPreview ? (
                    <img src={fotoPreview} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="text-gray-600 group-hover:text-secondary-500 transition-colors" size={28} />
                  )}
                </div>
                {!uploadingFoto && (
                  <div className="absolute bottom-0 right-0 bg-secondary-600 p-1.5 rounded-full shadow-lg border-2 border-dark-900">
                    <PlusIcon size={14} className="text-white" />
                  </div>
                )}
              </div>

              <p className={`text-xs font-bold uppercase tracking-wide transition-colors ${
                uploadingFoto ? 'text-secondary-400' : 'text-gray-500 group-hover:text-secondary-400'
              }`}>
                {uploadingFoto ? 'Subiendo...' : fotoPreview ? 'Cambiar Foto' : 'Subir Foto'}
              </p>

              {/* Estado de la foto */}
              {formData.foto && !uploadingFoto && (
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle size={11} /> Foto guardada en la nube
                </span>
              )}
              {uploadFotoError && (
                <span className="text-[10px] text-red-400 flex items-center gap-1">
                  <AlertCircle size={11} /> {uploadFotoError}
                </span>
              )}
              <p className="text-[10px] text-gray-600">JPG, PNG, WEBP · Máx 5MB · Opcional</p>
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Tipo Documento */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Tipo Documento <span className="text-primary-500">*</span></label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <select name="tipoDocumento" value={formData.tipoDocumento} onChange={handleChange} required
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-white/20 outline-none appearance-none cursor-pointer text-sm font-medium">
                    <option value="CC"  className="bg-dark-900">CC</option>
                    <option value="CE"  className="bg-dark-900">CE</option>
                    <option value="PAS" className="bg-dark-900">PP</option>
                  </select>
                </div>
              </div>

              {/* Número Documento */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Número Documento <span className="text-primary-500">*</span></label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input type="text" name="numeroDocumento" value={formData.numeroDocumento} onChange={handleChange} required
                    placeholder="1234567890"
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-white/20 outline-none transition-all text-sm font-medium" />
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase tracking-widest mb-2 ml-1">Nombre <span className="text-primary-500">*</span></label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-secondary-500 transition-colors" size={18} />
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required
                    placeholder="Tu nombre"
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-secondary-500/50 focus:border-secondary-500 outline-none transition-all text-sm font-medium" />
                </div>
              </div>

              {/* Apellido */}
              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase tracking-widest mb-2 ml-1">Apellido <span className="text-primary-500">*</span></label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-secondary-500 transition-colors" size={18} />
                  <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} required
                    placeholder="Tu apellido"
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-secondary-500/50 focus:border-secondary-500 outline-none transition-all text-sm font-medium" />
                </div>
              </div>


              {/* Fecha Nacimiento */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Fecha Nacimiento <span className="text-primary-500">*</span></label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} required
                    min="1940-01-01"
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-white/20 outline-none transition-all text-sm font-medium [color-scheme:dark]" />
                </div>
                <p className="text-[10px] text-gray-500 mt-1 ml-1">Debes ser mayor de 18 años</p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase tracking-widest mb-2 ml-1">
                  Correo Electrónico <span className="text-primary-500">*</span>
                  {emailFromUrl && <span className="ml-2 text-emerald-400 normal-case font-normal">✓ Pre-llenado</span>}
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-secondary-500 transition-colors" size={18} />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required
                    placeholder="ejemplo@correo.com"
                    readOnly={!!emailFromUrl}
                    className={`w-full pl-11 pr-4 py-3 bg-dark-800/50 border rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-secondary-500/50 focus:border-secondary-500 outline-none transition-all text-sm font-medium ${
                      emailFromUrl ? 'border-emerald-500/40 text-emerald-300 cursor-not-allowed opacity-80' : 'border-white/10'
                    }`} />
                </div>
              </div>

              {/* Teléfono Principal */}
              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase tracking-widest mb-2 ml-1">Teléfono Principal <span className="text-primary-500">*</span></label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-secondary-500 transition-colors" size={18} />
                  <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} required
                    placeholder="3001234567"
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-secondary-500/50 focus:border-secondary-500 outline-none transition-all text-sm font-medium" />
                </div>
              </div>

              {/* Teléfono Alternativo */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Teléfono Alternativo</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input type="tel" name="telefonoAlternativo" value={formData.telefonoAlternativo} onChange={handleChange}
                    placeholder="Opcional"
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-white/20 outline-none transition-all text-sm font-medium" />
                </div>
              </div>

              {/* Ciudad */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Ciudad <span className="text-primary-500">*</span></label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input type="text" name="ciudad" value={formData.ciudad} onChange={handleChange} required
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-white/20 outline-none transition-all text-sm font-medium" />
                </div>
              </div>

              {/* Barrio */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Barrio <span className="text-primary-500">*</span></label>
                <div className="relative">
                  <Map className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input type="text" name="barrio" value={formData.barrio} onChange={handleChange} required
                    placeholder="Tu barrio"
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-white/20 outline-none transition-all text-sm font-medium" />
                </div>
              </div>

              {/* Dirección */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Dirección <span className="text-primary-500">*</span></label>
                <div className="relative">
                  <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} required
                    placeholder="Calle 123 # 45 - 67"
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-white/20 outline-none transition-all text-sm font-medium" />
                </div>
              </div>

              {/* Zona de Servicio */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Zona de Servicio <span className="text-primary-500">*</span></label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <select name="zonaServicio" value={formData.zonaServicio} onChange={handleChange} required
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-white/20 outline-none appearance-none cursor-pointer text-sm font-medium">
                    <option value="URBANA" className="bg-dark-900">Urbana</option>
                    <option value="RURAL"  className="bg-dark-900">Rural</option>
                  </select>
                </div>
              </div>

              {/* Contraseña */}
            <div>
              <label className="block text-xs font-bold text-primary-500 uppercase tracking-widest mb-2 ml-1">
                Contraseña <span className="text-white">*</span>
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-500 transition-colors" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password" value={formData.password} onChange={handleChange}
                  required minLength={6} placeholder="Mínimo 6 caracteres"
                  className="w-full pl-11 pr-11 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary-500 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label className="block text-xs font-bold text-primary-500 uppercase tracking-widest mb-2 ml-1">
                Confirmar Contraseña <span className="text-white">*</span>
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-500 transition-colors" size={18} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                  required minLength={6} placeholder="Repite tu contraseña"
                  className="w-full pl-11 pr-11 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                />
                <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary-500 transition-colors">
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            </div>

            <div className="pt-4">
              <button type="submit" disabled={isLoading || uploadingFoto}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] uppercase tracking-widest text-sm hover:-translate-y-0.5 border border-primary-500 flex items-center justify-center gap-2">
                {isLoading
                  ? <><Loader2 size={18} className="animate-spin" /> Registrando...</>
                  : uploadingFoto
                    ? <><Loader2 size={18} className="animate-spin" /> Subiendo foto...</>
                    : 'Completar Registro'
                }
              </button>
            </div>
          </form>

          <div className="mt-6 text-center pt-6 border-t border-white/5">
            <p className="text-gray-400 text-sm">
              ¿Ya tienes cuenta?{' '}
              <button onClick={() => onNavigate('/login')} className="text-secondary-500 font-bold hover:text-secondary-400 transition-colors">
                Inicia sesión
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};