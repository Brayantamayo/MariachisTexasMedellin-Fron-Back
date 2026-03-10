
import React, { useState } from 'react';
import { Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';

interface Props {
  onNavigate: (path: string) => void;
}

export const ResetPasswordPage: React.FC<Props> = ({ onNavigate }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    
    // Simular llamada a API
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 pt-32">
      
      {/* Glass Card */}
      <div className="max-w-md w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden animate-fade-in-up">
        
        {/* Top Accent */}
        <div className="h-1 w-full bg-gradient-to-r from-primary-900 via-primary-600 to-primary-900"></div>

        <div className="p-8 md:p-10">
          
          {isSubmitted ? (
            // Success State
            <div className="text-center animate-fade-in-up">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                    <CheckCircle className="text-emerald-500 h-8 w-8" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-white mb-2">¡Contraseña Actualizada!</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-8">
                    Tu contraseña ha sido restablecida correctamente. Ahora puedes iniciar sesión con tu nueva clave.
                </p>
                <button
                    onClick={() => onNavigate('/login')}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] uppercase tracking-widest text-xs"
                >
                    Ir al Inicio de Sesión
                </button>
            </div>
          ) : (
            // Form State
            <>
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary-600/30">
                        <Lock className="text-primary-500 h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-white mb-2">Nueva Contraseña</h3>
                    <p className="text-gray-400 text-sm font-light">
                        Crea una nueva contraseña segura para tu cuenta.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2 animate-shake">
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-primary-500 uppercase tracking-widest mb-2">Nueva Contraseña</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-500 transition-colors" size={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-12 py-4 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600 outline-none transition-all"
                                placeholder="••••••••"
                                required
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-primary-500 uppercase tracking-widest mb-2">Confirmar Contraseña</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-500 transition-colors" size={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600 outline-none transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] uppercase tracking-widest text-sm mt-2 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {isLoading ? 'Actualizando...' : 'Restablecer Contraseña'}
                    </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-white/5">
                    <button 
                        onClick={() => onNavigate('/login')}
                        className="text-gray-400 hover:text-white transition-colors text-sm flex items-center justify-center gap-2 mx-auto group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Volver al Inicio
                    </button>
                </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
