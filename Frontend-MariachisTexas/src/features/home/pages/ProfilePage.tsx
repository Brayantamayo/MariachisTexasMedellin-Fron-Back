
import React, { useState } from 'react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Camera, 
  Save, 
  Lock, 
  Music,
  Edit2
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  
  // Mock state for form (pre-filled with auth user data)
  const [formData, setFormData] = useState({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      currentPassword: '',
      newPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({...formData, [e.target.name]: e.target.value});
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
          <div className="flex flex-col lg:flex-row gap-8">
              
              {/* Left Column: Profile Card */}
              <div className="w-full lg:w-1/3 flex flex-col gap-6">
                  
                  {/* Main Card */}
                  <div className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
                      
                      {/* Avatar with Ring */}
                      <div className="relative mb-6 group cursor-pointer">
                          <div className="w-36 h-36 rounded-full p-1.5 bg-gradient-to-br from-slate-100 to-slate-300 shadow-xl overflow-hidden relative z-10">
                              <div className="w-full h-full rounded-full border-4 border-white overflow-hidden bg-white">
                                <img 
                                    src={user.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                              </div>
                          </div>
                          <div className="absolute bottom-2 right-2 bg-slate-900 text-white p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110 z-20 border-2 border-white cursor-pointer">
                              <Camera size={16} />
                          </div>
                      </div>

                      {/* Info */}
                      <h2 className="text-2xl font-serif font-bold text-slate-800 tracking-tight">{user.name} {user.lastName}</h2>
                      <span className="inline-block px-4 py-1.5 mt-2 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest border border-slate-200">
                          {user.role}
                      </span>

                      <div className="w-full space-y-5 border-t border-slate-100 pt-8 mt-8">
                          <div className="flex items-center gap-4 text-sm text-slate-600 group hover:text-slate-900 transition-colors">
                              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary-600 group-hover:bg-primary-50 transition-colors">
                                <Mail size={16} />
                              </div>
                              <span className="truncate font-medium">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600 group hover:text-slate-900 transition-colors">
                              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary-600 group-hover:bg-primary-50 transition-colors">
                                <Phone size={16} />
                              </div>
                              <span className="font-medium">{user.phone}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600 group hover:text-slate-900 transition-colors">
                              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary-600 group-hover:bg-primary-50 transition-colors">
                                <MapPin size={16} />
                              </div>
                              <span className="font-medium">{user.city}</span>
                          </div>
                      </div>
                  </div>

                  {/* Extra Card for Musicians */}
                  {user.role === 'EMPLEADO' && (
                      <div className="bg-[#0f172a] rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/30 blur-[60px] rounded-full"></div>
                          <Music className="absolute -bottom-6 -right-6 text-white/5 w-40 h-40 transform rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                          
                          <div className="relative z-10">
                            <h3 className="font-serif font-bold text-lg mb-6 flex items-center gap-2">
                                <span className="w-8 h-1 bg-primary-500 rounded-full"></span>
                                Perfil Musical
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Instrumento Principal</p>
                                    <p className="font-bold text-2xl tracking-tight">{user.mainInstrument}</p>
                                </div>
                                <div className="h-px bg-white/10 w-full"></div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Experiencia</p>
                                        <p className="font-bold text-xl">{user.experienceYears} Años</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Nivel</p>
                                        <p className="font-bold text-primary-400">Profesional</p>
                                    </div>
                                </div>
                            </div>
                          </div>
                      </div>
                  )}
              </div>

              {/* Right Column: Edit Forms */}
              <div className="w-full lg:w-2/3 space-y-8 pt-4">
                  
                  {/* Personal Info Form */}
                  <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                          <div>
                            <h3 className="font-bold text-slate-800 text-lg">Información Personal</h3>
                            <p className="text-xs text-slate-500 mt-1">Actualiza tus datos de contacto y ubicación.</p>
                          </div>
                          <button 
                            onClick={() => setIsEditing(!isEditing)}
                            className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-bold text-xs uppercase tracking-wider
                                ${isEditing 
                                    ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' 
                                    : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-200 hover:text-primary-600 shadow-sm'}
                            `}
                          >
                              {isEditing ? <XIcon size={14} /> : <Edit2 size={14} />}
                              {isEditing ? 'Cancelar' : 'Editar'}
                          </button>
                      </div>
                      
                      <div className="p-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                              <div className="group">
                                  <label className="label-profile">Nombre Completo</label>
                                  <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                                    <input 
                                        type="text" 
                                        name="name"
                                        value={formData.name} 
                                        disabled={!isEditing}
                                        onChange={handleChange}
                                        className="input-profile" 
                                    />
                                  </div>
                              </div>
                              <div className="group">
                                  <label className="label-profile">Teléfono</label>
                                  <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                                    <input 
                                        type="tel" 
                                        name="phone"
                                        value={formData.phone} 
                                        disabled={!isEditing}
                                        onChange={handleChange}
                                        className="input-profile" 
                                    />
                                  </div>
                              </div>
                              <div className="group">
                                  <label className="label-profile">Ciudad</label>
                                  <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                                    <input 
                                        type="text" 
                                        name="city"
                                        value={formData.city} 
                                        disabled={!isEditing}
                                        onChange={handleChange}
                                        className="input-profile" 
                                    />
                                  </div>
                              </div>
                              <div className="group">
                                  <label className="label-profile">Dirección</label>
                                  <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                                    <input 
                                        type="text" 
                                        name="address"
                                        value={formData.address} 
                                        disabled={!isEditing}
                                        onChange={handleChange}
                                        className="input-profile" 
                                    />
                                  </div>
                              </div>
                          </div>

                          {isEditing && (
                              <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end animate-fade-in-up">
                                  <button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary-900/20 hover:shadow-primary-900/30 transition-all flex items-center gap-2 transform hover:-translate-y-0.5">
                                      <Save size={16} /> Guardar Cambios
                                  </button>
                              </div>
                          )}
                      </div>
                  </div>

                  {/* Security Section */}
                  <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30">
                          <h3 className="font-bold text-slate-800 flex items-center gap-2">
                              <Shield size={18} className="text-primary-600" /> Seguridad y Acceso
                          </h3>
                      </div>
                      <div className="p-8">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="flex items-center gap-5 w-full">
                                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                                      <Lock size={20} />
                                  </div>
                                  <div>
                                      <p className="font-bold text-slate-800">Contraseña</p>
                                      <p className="text-xs text-slate-500 mt-0.5">Se recomienda cambiarla periódicamente.</p>
                                  </div>
                              </div>
                              <button className="w-full sm:w-auto whitespace-nowrap text-slate-600 hover:text-slate-900 text-xs font-bold uppercase tracking-widest border border-slate-200 hover:border-slate-300 hover:bg-white px-6 py-3 rounded-xl transition-all shadow-sm">
                                  Cambiar Clave
                              </button>
                          </div>
                      </div>
                  </div>

              </div>
          </div>
      </div>

      <style>{`
        .label-profile {
            display: block;
            font-size: 10px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 8px;
            padding-left: 4px;
        }
        .input-profile {
            width: 100%;
            padding: 14px 16px 14px 48px;
            border-radius: 12px;
            background-color: ${isEditing ? '#fff' : '#f8fafc'};
            border: 1px solid ${isEditing ? '#e2e8f0' : 'transparent'};
            color: #334155;
            font-weight: 600;
            font-size: 14px;
            outline: none;
            transition: all 0.2s;
        }
        .input-profile:focus {
            border-color: #dc2626;
            box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.05);
            background-color: #fff;
        }
        .input-profile:disabled {
            cursor: default;
            color: #64748b;
        }
      `}</style>
    </div>
  );
};

const XIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);
