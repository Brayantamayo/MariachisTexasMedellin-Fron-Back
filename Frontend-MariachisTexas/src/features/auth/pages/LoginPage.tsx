import React, { useState } from 'react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { Mail, Lock, AlertCircle, X } from 'lucide-react';

interface Props {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<Props> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');  // ← nuevo
  const [ripples, setRipples]   = useState<{x: number, y: number, color: string, id: number}[]>([]);

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = e;
    const isRight = clientX > currentTarget.clientWidth / 2;
    const color   = isRight ? 'rgba(220, 38, 38, 0.4)' : 'rgba(34, 197, 94, 0.4)';
    const newRipple = { x: clientX, y: clientY, color, id: Date.now() + Math.random() };
    setRipples(prev => [...prev, newRipple]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== newRipple.id)), 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('') // limpiar error anterior
    if (!email.trim() || !password.trim()) {
      setError('Por favor, ingresa tu correo y contraseña.')
      return
    }
    const success = await login(email, password);
    if (!success) {
      setError('Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.')
    }
  };

  return (
    <div
      className="relative h-screen w-full flex items-center justify-center pt-32 pb-12 overflow-hidden"
      style={{
        backgroundImage: 'url(shared/assets/images/login-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      onClick={handleBackgroundClick}
    >
      {/* Dark overlay para mantener la card legible */}
      <div className="absolute inset-0 bg-black/65 z-0" />
      <style>{`
        @keyframes ripple-expand {
          0%   { transform: translate(-50%, -50%) scale(0); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(25); opacity: 0; }
        }
        .animate-ripple-effect { animation: ripple-expand 1s ease-out forwards; }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down { animation: slideDown 0.3s ease forwards; }
      `}</style>

      {/* Ripples */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {ripples.map(ripple => (
          <div
            key={ripple.id}
            className="absolute rounded-full animate-ripple-effect blur-sm"
            style={{ left: ripple.x, top: ripple.y, width: '40px', height: '40px', backgroundColor: ripple.color }}
          />
        ))}
      </div>

      {/* Ambient lights */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-secondary-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-xs bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up mx-4 ring-1 ring-white/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-600 via-white to-red-600" />

        <div className="p-5">

          {/* Header */}
          <div className="text-center mb-4">
            <div className="w-20 h-20 mx-auto mb-3 flex items-center justify-center hover:scale-105 transition-transform duration-500">
              <img
                src="shared/assets/images/Logo.png"
                alt="Logo Mariachis Texas"
                className="w-full h-full object-contain drop-shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <h3 className="text-lg font-serif font-bold text-white mb-1 tracking-wide">BIENVENIDO</h3>
            <p className="text-gray-400 text-[10px] font-medium tracking-wide uppercase opacity-70">Ingresa tus credenciales</p>
          </div>

          {/* ── ALERTA DE ERROR ─────────────────────────────────── */}
          {error && (
            <div className="animate-slide-down flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 rounded-xl px-3.5 py-3 mb-4">
              <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[11px] font-semibold text-red-400 mb-0.5">Credenciales incorrectas</p>
                <p className="text-[10px] text-white/40 leading-relaxed">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError('')}
                className="text-white/20 hover:text-white/50 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          )}
          {/* ──────────────────────────────────────────────────── */}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-secondary-500 uppercase tracking-widest mb-1 ml-1">
                Correo Electrónico
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-secondary-500 transition-colors" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-secondary-500/50 focus:border-secondary-500 outline-none transition-all text-xs font-medium"
                  placeholder="usuario@texas.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 ml-1">
                <label className="block text-[10px] font-bold text-primary-500 uppercase tracking-widest">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('/forgot-password')}
                  className="text-[9px] text-gray-500 hover:text-white transition-colors font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary-500 transition-colors" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-800/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all text-xs font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:shadow-[0_0_30px_rgba(220,38,38,0.5)] uppercase tracking-widest text-xs mt-2 active:scale-[0.98] border border-primary-500"
            >
              Iniciar Sesión
            </button>
          </form>

          {/* Footer */}
          <div className="mt-5 text-center pt-3 border-t border-white/5">
            <p className="text-gray-400 text-[10px]">
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => onNavigate('/register')}
                className="text-secondary-500 font-bold hover:text-secondary-400 transition-colors"
              >
                Regístrate
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};