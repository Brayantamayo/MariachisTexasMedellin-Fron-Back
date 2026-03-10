
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, Mail, Lock, Phone, MapPin, Calendar, FileText, Camera, Home, Hash, Map, CheckCircle, AlertCircle, X } from 'lucide-react';

interface Props {
  onNavigate: (path: string) => void;
}

export const RegisterPage: React.FC<Props> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    tipoDocumento: 'CC',
    numeroDocumento: '',
    email: '',
    telefono: '',
    telefonoAlternativo: '',
    fechaNacimiento: '',
    ciudad: 'Medellín',
    direccion: '',
    barrio: '',
    zonaServicio: 'Urbana',
    password: '',
    confirmPassword: ''
  });

  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      showNotification("Las contraseñas no coinciden.", "error");
      return;
    }

    if (formData.password.length < 6) {
        showNotification("La contraseña debe tener al menos 6 caracteres.", "error");
        return;
    }

    console.log("Datos de registro:", formData);
    
    // Éxito
    showNotification("¡Registro exitoso! Redirigiendo al inicio de sesión...", "success");
    
    // Redirección después de 2 segundos para que el usuario lea el mensaje
    setTimeout(() => {
        onNavigate('/login');
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-32 pb-12 bg-dark-900">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary-600/5 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-secondary-600/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Toast Notification */}
      {notification && createPortal(
        <div className="fixed top-6 right-6 z-[200] animate-fade-in-up">
            <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md min-w-[320px] ${
                notification.type === 'success' 
                ? 'bg-dark-900/95 border-secondary-600 shadow-secondary-900/20' 
                : 'bg-dark-900/95 border-primary-600 shadow-primary-900/20'
            }`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    notification.type === 'success' ? 'bg-secondary-900 text-secondary-500' : 'bg-primary-900 text-primary-500'
                }`}>
                    {notification.type === 'success' ? <CheckCircle size={20} strokeWidth={3} /> : <AlertCircle size={20} strokeWidth={3} />}
                </div>
                <div className="flex-1">
                    <h4 className={`font-bold text-sm ${notification.type === 'success' ? 'text-secondary-400' : 'text-primary-400'}`}>
                        {notification.type === 'success' ? '¡Excelente!' : '¡Atención!'}
                    </h4>
                    <p className="text-xs text-gray-400 font-medium leading-relaxed mt-0.5">{notification.message}</p>
                </div>
                <button onClick={() => setNotification(null)} className="flex-shrink-0 text-gray-500 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg">
                    <X size={18} />
                </button>
            </div>
        </div>,
        document.body
      )}

      {/* Glass Card */}
      <div className="max-w-4xl w-full bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden animate-fade-in-up ring-1 ring-white/5">
        
         {/* Top Accent Tricolor */}
        <div className="h-1.5 w-full bg-gradient-to-r from-secondary-600 via-white to-primary-600"></div>

        <div className="p-8 md:p-10">
           <div className="text-center mb-8">
            <h3 className="text-3xl font-serif font-bold text-white mb-2 tracking-wide">ÚNETE A LA FAMILIA</h3>
            <p className="text-gray-400 text-sm font-light uppercase tracking-wider">Campos obligatorios marcados con <span className="text-primary-500">*</span></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* --- SECCIÓN FOTO --- */}
            <div className="flex justify-center mb-8">
              <div className="relative group cursor-pointer">
                <div className="w-32 h-32 rounded-full bg-dark-800 border-2 border-dashed border-gray-700 flex items-center justify-center group-hover:border-secondary-500 transition-colors overflow-hidden">
                  <Camera className="text-gray-600 group-hover:text-secondary-500 transition-colors" size={32} />
                </div>
                <div className="absolute bottom-0 right-0 bg-secondary-600 p-2 rounded-full shadow-lg border-2 border-dark-900">
                  <PlusIcon size={16} className="text-white" />
                </div>
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                <p className="text-xs text-center text-gray-500 mt-2 group-hover:text-secondary-400 font-bold uppercase tracking-wide">Subir Foto</p>
              </div>
            </div>

            {/* --- GRID PRINCIPAL --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase tracking-widest mb-2 ml-1">Nombre <span className="text-primary-500">*</span></label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-secondary-500 transition-colors" size={18} />
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-secondary-500/50 focus:border-secondary-500 outline-none transition-all text-sm font-medium"
                    placeholder="Tu nombre"
                    required
                  />
                </div>
              </div>

              {/* Apellido */}
              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase tracking-widest mb-2 ml-1">Apellido <span className="text-primary-500">*</span></label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-secondary-500 transition-colors" size={18} />
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-secondary-500/50 focus:border-secondary-500 outline-none transition-all text-sm font-medium"
                    placeholder="Tu apellido"
                    required
                  />
                </div>
              </div>

              {/* Tipo Documento */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Tipo Documento <span className="text-primary-500">*</span></label>
                <div className="relative group">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gray-300 transition-colors" size={18} />
                  <select
                    name="tipoDocumento"
                    value={formData.tipoDocumento}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-white/20 outline-none transition-all appearance-none cursor-pointer text-sm font-medium"
                  >
                    <option value="CC" className="bg-dark-900 text-gray-300">Cédula de Ciudadanía</option>
                    <option value="CE" className="bg-dark-900 text-gray-300">Cédula de Extranjería</option>
                    <option value="TI" className="bg-dark-900 text-gray-300">Tarjeta de Identidad</option>
                    <option value="PAS" className="bg-dark-900 text-gray-300">Pasaporte</option>
                    <option value="NIT" className="bg-dark-900 text-gray-300">NIT</option>
                  </select>
                </div>
              </div>

              {/* Número Documento */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Número Documento <span className="text-primary-500">*</span></label>
                <div className="relative group">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gray-300 transition-colors" size={18} />
                  <input
                    type="number"
                    name="numeroDocumento"
                    value={formData.numeroDocumento}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-white/20 outline-none transition-all text-sm font-medium"
                    placeholder="1234567890"
                    required
                  />
                </div>
              </div>

              {/* Fecha Nacimiento */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Fecha Nacimiento <span className="text-primary-500">*</span></label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gray-300 transition-colors" size={18} />
                  <input
                    type="date"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-white/20 outline-none transition-all text-sm font-medium [color-scheme:dark]"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase tracking-widest mb-2 ml-1">Correo Electrónico <span className="text-primary-500">*</span></label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-secondary-500 transition-colors" size={18} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-secondary-500/50 focus:border-secondary-500 outline-none transition-all text-sm font-medium"
                    placeholder="ejemplo@correo.com"
                    required
                  />
                </div>
              </div>

              {/* Teléfono Principal */}
              <div>
                <label className="block text-xs font-bold text-secondary-500 uppercase tracking-widest mb-2 ml-1">Teléfono Principal <span className="text-primary-500">*</span></label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-secondary-500 transition-colors" size={18} />
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-secondary-500/50 focus:border-secondary-500 outline-none transition-all text-sm font-medium"
                    placeholder="+57 300..."
                    required
                  />
                </div>
              </div>

              {/* Teléfono Alternativo */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Teléfono Alternativo</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gray-300 transition-colors" size={18} />
                  <input
                    type="tel"
                    name="telefonoAlternativo"
                    value={formData.telefonoAlternativo}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-white/20 outline-none transition-all text-sm font-medium"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              {/* Ciudad */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Ciudad <span className="text-primary-500">*</span></label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gray-300 transition-colors" size={18} />
                  <input
                    type="text"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-white/20 outline-none transition-all text-sm font-medium"
                    required
                  />
                </div>
              </div>

              {/* Barrio */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Barrio <span className="text-primary-500">*</span></label>
                <div className="relative group">
                  <Map className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gray-300 transition-colors" size={18} />
                  <input
                    type="text"
                    name="barrio"
                    value={formData.barrio}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-white/20 outline-none transition-all text-sm font-medium"
                    placeholder="Tu barrio"
                    required
                  />
                </div>
              </div>

              {/* Dirección - Span 2 cols */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Dirección <span className="text-primary-500">*</span></label>
                <div className="relative group">
                  <Home className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gray-300 transition-colors" size={18} />
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-white/20 outline-none transition-all text-sm font-medium"
                    placeholder="Calle 123 # 45 - 67"
                    required
                  />
                </div>
              </div>

               {/* Zona de Servicio */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Zona de Servicio <span className="text-primary-500">*</span></label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gray-300 transition-colors" size={18} />
                  <select
                    name="zonaServicio"
                    value={formData.zonaServicio}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-white/20 outline-none transition-all appearance-none cursor-pointer text-sm font-medium"
                  >
                    <option value="Urbana" className="bg-dark-900 text-gray-300">Urbana</option>
                    <option value="Rural" className="bg-dark-900 text-gray-300">Rural</option>
                  </select>
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-xs font-bold text-primary-500 uppercase tracking-widest mb-2 ml-1">Contraseña <span className="text-white">*</span></label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-500 transition-colors" size={18} />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <label className="block text-xs font-bold text-primary-500 uppercase tracking-widest mb-2 ml-1">Confirmar Contraseña <span className="text-white">*</span></label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-500 transition-colors" size={18} />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all text-sm font-medium"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>

            </div>

            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] uppercase tracking-widest text-sm hover:-translate-y-0.5 border border-primary-500"
              >
                Completar Registro
              </button>
            </div>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-white/5">
            <p className="text-gray-400 text-sm">
              ¿Ya tienes cuenta?{' '}
              <button 
                onClick={() => onNavigate('/login')}
                className="text-secondary-500 font-bold hover:text-secondary-400 transition-colors"
              >
                Inicia sesión
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Icon for the photo upload overlay
const PlusIcon = ({ size, className }: { size: number, className: string }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);
