
import React, { useState } from 'react';
import { Mail, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';

interface Props {
  onNavigate: (path: string) => void;
}

export const ForgotPasswordPage: React.FC<Props> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
                <h3 className="text-2xl font-serif font-bold text-white mb-2">¡Correo Enviado!</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-8">
                    Hemos enviado las instrucciones para restablecer tu contraseña a <span className="text-white font-bold">{email}</span>. Revisa tu bandeja de entrada o spam.
                </p>
                <button
                    onClick={() => onNavigate('/login')}
                    className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all border border-white/10 uppercase tracking-widest text-xs"
                >
                    Volver al Inicio
                </button>
            </div>
          ) : (
            // Form State
            <>
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary-600/30">
                        <KeyRound className="text-primary-500 h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-white mb-2">Recuperar Acceso</h3>
                    <p className="text-gray-400 text-sm font-light">
                        Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                    <label className="block text-xs font-bold text-primary-500 uppercase tracking-widest mb-2">Correo Registrado</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-500 transition-colors" size={20} />
                        <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary-600/50 focus:border-primary-600 outline-none transition-all"
                        placeholder="ejemplo@correo.com"
                        required
                        />
                    </div>
                    </div>

                    <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] uppercase tracking-widest text-sm mt-2 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {isLoading ? 'Enviando...' : 'Enviar Enlace'}
                    </button>
                </form>

                <div className="mt-8 text-center pt-6 border-t border-white/5">
                    <button 
                        onClick={() => onNavigate('/login')}
                        className="text-gray-400 hover:text-white transition-colors text-sm flex items-center justify-center gap-2 mx-auto group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Volver a Iniciar Sesión
                    </button>
                </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
