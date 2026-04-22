import React, { useState } from 'react';
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from './authService';

interface Props {
  email: string;
  otp: string;
  onNavigate: (path: string) => void;
}

export const ResetPasswordPage: React.FC<Props> = ({ email, otp, onNavigate }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetearPassword(email, otp, password, confirmPassword);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al restablecer. Solicita un nuevo código.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-32">
      <div className="max-w-md w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden animate-fade-in-up">
        <div className="h-1 w-full bg-gradient-to-r from-primary-900 via-primary-600 to-primary-900"></div>
        <div className="p-8 md:p-10">
          {isSubmitted ? (
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                <CheckCircle className="text-emerald-500 h-8 w-8" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-white mb-2">¡Contraseña Actualizada!</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                Tu contraseña ha sido restablecida correctamente. Ya puedes iniciar sesión.
              </p>
              <button onClick={() => onNavigate('/login')}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] uppercase tracking-widest text-xs">
                Ir al Inicio de Sesión
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary-600/30">
                  <Lock className="text-primary-500 h-8 w-8" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-white mb-2">Nueva Contraseña</h3>
                <p className="text-gray-400 text-sm font-light">Crea una nueva contraseña segura para tu cuenta.</p>
              </div>

              <div className="mb-5 p-3 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Requisitos</p>
                <ul className="space-y-1">
                  {['Mínimo 6 caracteres', 'Una letra mayúscula', 'Una letra minúscula', 'Un número', 'Un carácter especial (@$!%*?&-_)'].map(req => (
                    <li key={req} className="text-xs text-gray-500 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary-500 inline-block"></span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-primary-900/50 border border-primary-600/30 rounded-xl text-primary-400 text-xs flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-primary-500 uppercase tracking-widest mb-2">Nueva Contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-500 transition-colors" size={20} />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600 outline-none transition-all"
                      placeholder="••••••••" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary-500 uppercase tracking-widest mb-2">Confirmar Contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-500 transition-colors" size={20} />
                    <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600 outline-none transition-all"
                      placeholder="••••••••" required />
                  </div>
                </div>
                <button type="submit" disabled={isLoading}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] uppercase tracking-widest text-sm disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2">
                  {isLoading ? <><Loader2 size={18} className="animate-spin" /> Actualizando...</> : 'Restablecer Contraseña'}
                </button>
              </form>

              <div className="mt-6 text-center pt-6 border-t border-white/5">
                <button onClick={() => onNavigate('/forgot-password')}
                  className="text-gray-400 hover:text-white transition-colors text-sm flex items-center justify-center gap-2 mx-auto group">
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                  Volver
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};