import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { User, Mail, Lock, Phone, MapPin, Calendar, FileText, Camera, Home, Hash, Map, CheckCircle, AlertCircle, X, Loader2, Eye, EyeOff, ShieldAlert } from 'lucide-react';
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
    foto:                ''
  });

  const [errors, setErrors] = useState<string[]>([]);
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
    if (errors.includes(e.target.name)) {
      setErrors(prev => prev.filter(err => err !== e.target.name));
    }
  };

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
    if (uploadingFoto) { showNotification('Espera a que termine de subir la foto.', 'error'); return; }
    if (formData.password !== formData.confirmPassword) { 
      setErrors(prev => [...prev, 'confirmPassword']);
      showNotification('Las contraseñas no coinciden.', 'error'); 
      return; 
    }
    if (formData.password.length < 6) { 
      setErrors(prev => [...prev, 'password']);
      showNotification('La contraseña debe tener al menos 6 caracteres.', 'error'); 
      return; 
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
        foto:                 formData.foto || undefined,
      });
      if (tokenRef.current) authService.marcarTokenUsado(tokenRef.current).catch(() => {});
      showNotification('¡Registro exitoso! Redirigiendo al inicio de sesión...', 'success');
      setTimeout(() => onNavigate('/login'), 2000);
    } catch (error: any) {
      showNotification(getErrorMessage(error), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const nextStep = async () => {
    setIsLoading(true);
    try {
      if (await validateCurrentStep()) {
        setCurrentStep(s => Math.min(s + 1, 3));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const prevStep = () => {
    setCurrentStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateCurrentStep = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10,}$/;
    let newErrors: string[] = [];

    // Validaciones Locales
    if (currentStep === 1) {
      if (!formData.nombre.trim()) newErrors.push('nombre');
      if (!formData.apellido.trim()) newErrors.push('apellido');
      if (!formData.numeroDocumento.trim() || formData.numeroDocumento.length < 6) newErrors.push('numeroDocumento');
      if (!formData.fechaNacimiento) newErrors.push('fechaNacimiento');
    } else if (currentStep === 2) {
      if (!formData.email.trim() || !emailRegex.test(formData.email)) newErrors.push('email');
      if (!formData.telefono.trim() || !phoneRegex.test(formData.telefono.replace(/\s/g, ''))) newErrors.push('telefono');
      if (!formData.ciudad.trim()) newErrors.push('ciudad');
      if (!formData.barrio.trim()) newErrors.push('barrio');
      if (!formData.direccion.trim()) newErrors.push('direccion');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      showNotification('Por favor corrige los campos marcados en rojo.', 'error');
      return false;
    }

    // Validaciones Remotas (Base de datos)
    try {
      if (currentStep === 1) {
        const res = await authService.checkDisponibilidad('documento', formData.numeroDocumento);
        if (!res.disponible) {
          setErrors(['numeroDocumento']);
          showNotification('El número de documento ya está registrado.', 'error');
          return false;
        }
      } else if (currentStep === 2) {
        // Solo validamos si no viene de una cotización (emailFromUrl)
        if (!emailFromUrl) {
          const res = await authService.checkDisponibilidad('email', formData.email);
          if (!res.disponible) {
            setErrors(['email']);
            showNotification('El correo electrónico ya está registrado.', 'error');
            return false;
          }
        }
      }
    } catch (err) {
      // Si el server falla, dejamos pasar o mostramos error técnico
      console.error('Error de validación remota:', err);
    }

    setErrors([]);
    return true;
  };

  const STEPS = [
    { id: 1, title: 'Identidad', icon: User },
    { id: 2, title: 'Ubicación', icon: MapPin },
    { id: 3, title: 'Seguridad', icon: Lock }
  ];

  const getErrorClass = (fieldName: string) => {
    return errors.includes(fieldName) ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-white/5';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-20 pb-8 bg-[#050505] text-white overflow-hidden relative">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 scale-110"
        style={{ backgroundImage: 'url("/mariachi-bg.png")', filter: 'blur(2px)' }}
      />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-secondary-600/10 rounded-full blur-[120px]" />
      </div>

      {notification && createPortal(
        <div className="fixed top-6 right-6 z-[200] animate-fade-in-up">
          <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md min-w-[320px] ${
            notification.type === 'success' ? 'bg-dark-900/95 border-secondary-600' : 'bg-dark-900/95 border-primary-600'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              notification.type === 'success' ? 'bg-secondary-900 text-secondary-500' : 'bg-primary-900 text-primary-500'
            }`}>
              {notification.type === 'success' ? <CheckCircle size={20} strokeWidth={3} /> : <AlertCircle size={20} strokeWidth={3} />}
            </div>
            <div className="flex-1">
              <h4 className={`font-bold text-sm ${notification.type === 'success' ? 'text-secondary-400' : 'text-primary-400'}`}>
                {notification.type === 'success' ? '¡Excelente!' : '¡Atención!'}
              </h4>
              <p className="text-xs text-gray-400 mt-0.5">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="text-gray-500 hover:text-white p-1 hover:bg-white/10 rounded-lg">
              <X size={18} />
            </button>
          </div>
        </div>, document.body
      )}

      <div className="max-w-3xl w-full bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden animate-fade-in-up ring-1 ring-white/5">
        <div className="h-1 w-full bg-gradient-to-r from-secondary-600 via-white to-primary-600" />

        <div className="p-6 md:p-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-serif font-bold text-white mb-1 tracking-wide uppercase">Únete a la familia</h3>
            
            <div className="flex items-center justify-center gap-3 mt-4">
              {STEPS.map((step, idx) => (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      currentStep === step.id ? 'border-secondary-500 bg-secondary-900/50 text-secondary-400' : 
                      currentStep > step.id ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-800 bg-dark-800 text-gray-600'
                    }`}>
                      {currentStep > step.id ? <CheckCircle size={18} /> : <step.icon size={16} />}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${currentStep === step.id ? 'text-secondary-400' : 'text-gray-600'}`}>
                      {step.title}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`w-10 h-[2px] mb-4 transition-colors duration-500 ${currentStep > step.id ? 'bg-emerald-500' : 'bg-gray-800'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {currentStep === 1 && (
              <div className="animate-fade-in-right space-y-4">
                <div className="flex flex-col items-center gap-1.5 mb-2">
                  <input ref={fotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
                  <div className="relative group cursor-pointer" onClick={() => !uploadingFoto && fotoInputRef.current?.click()}>
                    <div className={`w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-all
                      ${uploadingFoto ? 'border-secondary-400 opacity-70' : 'border-gray-700 group-hover:border-secondary-500'}`}>
                      {uploadingFoto ? <Loader2 size={24} className="animate-spin text-secondary-400" /> : 
                       fotoPreview ? <img src={fotoPreview} alt="Foto" className="w-full h-full object-cover" /> : 
                       <Camera className="text-gray-600 group-hover:text-secondary-500" size={24} />}
                    </div>
                    {!uploadingFoto && (
                      <div className="absolute bottom-0 right-0 bg-secondary-600 p-1 rounded-full shadow-lg border-2 border-dark-900">
                        <PlusIcon size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Foto de perfil (opcional)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-secondary-500 uppercase tracking-widest mb-1.5 ml-1">Nombre *</label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-secondary-500" size={16} />
                      <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required placeholder="Nombre" 
                        className={`w-full pl-10 pr-4 py-2.5 bg-dark-800/40 border rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-secondary-500/30 outline-none text-sm font-medium transition-all ${getErrorClass('nombre')}`} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-secondary-500 uppercase tracking-widest mb-1.5 ml-1">Apellido *</label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-secondary-500" size={16} />
                      <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} required placeholder="Apellido" 
                        className={`w-full pl-10 pr-4 py-2.5 bg-dark-800/40 border rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-secondary-500/30 outline-none text-sm font-medium transition-all ${getErrorClass('apellido')}`} />
                    </div>
                  </div>
                  <div className="md:col-span-2 grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Tipo *</label>
                      <select name="tipoDocumento" value={formData.tipoDocumento} onChange={handleChange} required
                        className="w-full px-3 py-2.5 bg-dark-800/40 border border-white/5 rounded-xl text-white outline-none appearance-none cursor-pointer text-sm font-medium">
                        <option value="CC" className="bg-dark-900">CC</option>
                        <option value="CE" className="bg-dark-900">CE</option>
                        <option value="PAS" className="bg-dark-900">PP</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Número Documento *</label>
                      <input type="text" name="numeroDocumento" value={formData.numeroDocumento} onChange={handleChange} required placeholder="123456789" 
                        className={`w-full px-4 py-2.5 bg-dark-800/40 border rounded-xl text-white placeholder-gray-600 outline-none text-sm font-medium transition-all ${getErrorClass('numeroDocumento')}`} />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Fecha Nacimiento *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} required
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                        className={`w-full pl-10 pr-4 py-2.5 bg-dark-800/40 border rounded-xl text-white outline-none text-sm font-medium [color-scheme:dark] transition-all ${getErrorClass('fechaNacimiento')}`} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="animate-fade-in-right space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-black text-secondary-500 uppercase tracking-widest mb-1.5 ml-1">Correo Electrónico *</label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      <input type="email" name="email" value={formData.email} onChange={handleChange} required readOnly={!!emailFromUrl}
                        className={`w-full pl-10 pr-4 py-2.5 bg-dark-800/40 border rounded-xl text-white text-sm font-medium transition-all ${getErrorClass('email')} ${emailFromUrl ? 'opacity-80' : ''}`} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-secondary-500 uppercase tracking-widest mb-1.5 ml-1">Teléfono Principal *</label>
                    <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} required placeholder="3001234567" 
                      className={`w-full px-4 py-2.5 bg-dark-800/40 border rounded-xl text-white placeholder-gray-600 outline-none text-sm font-medium transition-all ${getErrorClass('telefono')}`} />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Teléfono Alternativo</label>
                    <input type="tel" name="telefonoAlternativo" value={formData.telefonoAlternativo} onChange={handleChange} placeholder="Opcional" 
                      className="w-full px-4 py-2.5 bg-dark-800/40 border border-white/5 rounded-xl text-white placeholder-gray-600 outline-none text-sm font-medium" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 md:col-span-2">
                    <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Ciudad *</label>
                      <input type="text" name="ciudad" value={formData.ciudad} onChange={handleChange} required
                        className={`w-full px-4 py-2.5 bg-dark-800/40 border rounded-xl text-white outline-none text-sm font-medium transition-all ${getErrorClass('ciudad')}`} />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Barrio *</label>
                      <input type="text" name="barrio" value={formData.barrio} onChange={handleChange} required placeholder="Barrio" 
                        className={`w-full px-4 py-2.5 bg-dark-800/40 border rounded-xl text-white placeholder-gray-600 outline-none text-sm font-medium transition-all ${getErrorClass('barrio')}`} />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Dirección Exacta *</label>
                    <div className="relative">
                      <Home className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} required placeholder="Calle 123 # 45 - 67" 
                        className={`w-full pl-10 pr-4 py-2.5 bg-dark-800/40 border rounded-xl text-white outline-none text-sm font-medium transition-all ${getErrorClass('direccion')}`} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="animate-fade-in-right space-y-4">
                <div className="bg-primary-900/10 border border-primary-500/20 p-4 rounded-xl flex gap-3">
                  <ShieldAlert size={20} className="text-primary-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-400 leading-tight">Último paso: Crea una contraseña fuerte para proteger tus reservas en Mariachis Texas.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black text-primary-500 uppercase tracking-widest mb-1.5 ml-1">Contraseña *</label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required minLength={6} 
                        className={`w-full pl-10 pr-10 py-2.5 bg-dark-800/40 border rounded-xl text-white outline-none text-sm font-medium transition-all ${getErrorClass('password')}`} />
                      <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-primary-500 uppercase tracking-widest mb-1.5 ml-1">Confirmar Contraseña *</label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                      <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required minLength={6} 
                        className={`w-full pl-10 pr-10 py-2.5 bg-dark-800/40 border rounded-xl text-white outline-none text-sm font-medium transition-all ${getErrorClass('confirmPassword')}`} />
                      <button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {currentStep > 1 && (
                <button type="button" onClick={prevStep} className="flex-1 bg-dark-800 hover:bg-dark-700 text-gray-400 font-bold py-3 rounded-xl border border-white/5 transition-all uppercase tracking-widest text-[10px]">
                  Regresar
                </button>
              )}
              {currentStep < 3 ? (
                <button type="button" onClick={nextStep} disabled={isLoading} className="flex-[2] bg-white text-dark-900 hover:bg-gray-200 font-bold py-3 rounded-xl transition-all shadow-lg uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Siguiente'}
                </button>
              ) : (
                <button type="submit" disabled={isLoading || uploadingFoto} className="flex-[2] bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg uppercase tracking-widest text-[10px] border border-primary-500 flex items-center justify-center gap-2">
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Finalizar'}
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center pt-4 border-t border-white/5">
            <p className="text-gray-500 text-[10px] font-medium uppercase tracking-widest">
              ¿Ya tienes cuenta? <button onClick={() => onNavigate('/login')} className="text-secondary-500 font-black hover:text-secondary-400 ml-1">Inicia sesión</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};