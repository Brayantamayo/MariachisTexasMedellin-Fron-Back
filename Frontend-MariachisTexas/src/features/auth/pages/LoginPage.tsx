import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/shared/contexts/AuthContext';
import { Mail, Lock, AlertCircle, X } from 'lucide-react';

interface Props {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<Props> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);
  const bgRef = useRef<HTMLDivElement>(null);
  const layer1Ref = useRef<HTMLDivElement>(null);
  const layer2Ref = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;

    mouseRef.current = { x: nx, y: ny };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const { x, y } = mouseRef.current;

      if (bgRef.current) {
        bgRef.current.style.transform =
          `scale(1.08) rotateX(${y * -4}deg) rotateY(${x * 4}deg) translate3d(${x * -12}px, ${y * -12}px, 0)`;
      }

      if (layer1Ref.current) {
        layer1Ref.current.style.transform = `translate3d(${x * -6}px, ${y * -6}px, 0)`;
      }

      if (layer2Ref.current) {
        layer2Ref.current.style.transform = `translate3d(${x * 28}px, ${y * 28}px, 0)`;
      }

      if (cardRef.current) {
        cardRef.current.style.transform =
          `perspective(1200px) rotateX(${y * -6}deg) rotateY(${x * 7}deg) translate3d(0, ${y * -4}px, 10px)`;
      }

      if (particlesRef.current) {
        particlesRef.current.style.transform = `translate3d(${x * 14}px, ${y * 14}px, 0)`;
      }
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      if (bgRef.current) {
        bgRef.current.style.transform = 'scale(1.08) rotateX(0deg) rotateY(0deg) translate3d(0,0,0)';
      }

      if (layer1Ref.current) {
        layer1Ref.current.style.transform = 'translate3d(0,0,0)';
      }

      if (layer2Ref.current) {
        layer2Ref.current.style.transform = 'translate3d(0,0,0)';
      }

      if (cardRef.current) {
        cardRef.current.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) translate3d(0,0,0)';
      }

      if (particlesRef.current) {
        particlesRef.current.style.transform = 'translate3d(0,0,0)';
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Por favor, ingresa tu correo y contrasena.');
      return;
    }

    const success = await login(email, password);

    if (!success) {
      setError('Correo o contrasena incorrectos. Verifica tus datos e intenta de nuevo.');
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full flex items-center justify-center pt-32 pb-12 overflow-hidden"
      style={{ background: '#050505' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <style>{`
        .bg-3d-layer {
          transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
          transform-style: preserve-3d;
          will-change: transform;
        }

        .parallax-layer {
          transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
        }

        .card-3d {
          transition:
            transform 0.24s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.24s ease;
          transform-style: preserve-3d;
          will-change: transform;
        }

        @keyframes neonSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .card-shell {
          position: relative;
          border-radius: 1.75rem;
          padding: 1.5px;
          overflow: hidden;
        }

        .card-border-rotor {
          position: absolute;
          inset: -45%;
          background: conic-gradient(
            from 0deg,
            rgba(34,197,94,0) 0deg,
            rgba(34,197,94,0.95) 52deg,
            rgba(255,255,255,0.96) 90deg,
            rgba(220,38,38,0.95) 132deg,
            rgba(220,38,38,0) 190deg,
            rgba(34,197,94,0.78) 252deg,
            rgba(255,255,255,0.9) 292deg,
            rgba(220,38,38,0.85) 332deg,
            rgba(34,197,94,0) 360deg
          );
          animation: neonSpin 7s linear infinite;
          filter: saturate(1.15);
          opacity: 0.92;
        }

        .card-border-glow {
          position: absolute;
          inset: -30%;
          background: conic-gradient(
            from 180deg,
            rgba(34,197,94,0.28),
            rgba(255,255,255,0.12),
            rgba(220,38,38,0.3),
            rgba(34,197,94,0.2)
          );
          animation: neonSpin 10s linear infinite reverse;
          filter: blur(26px);
          opacity: 0.8;
        }

        .card-core {
          position: relative;
          border-radius: calc(1.75rem - 1.5px);
          overflow: hidden;
          background:
            radial-gradient(circle at top left, rgba(255,255,255,0.08), transparent 30%),
            linear-gradient(145deg, rgba(24,22,21,0.94) 0%, rgba(18,16,16,0.97) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.07),
            0 24px 60px rgba(0,0,0,0.45);
          backdrop-filter: blur(20px);
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .animate-slide-down {
          animation: slideDown 0.3s ease forwards;
        }

        @keyframes floatUp {
          0%   { opacity: 0; transform: translateY(0) scale(0.6); }
          15%  { opacity: 0.8; }
          85%  { opacity: 0.3; }
          100% { opacity: 0; transform: translateY(-90px) scale(1); }
        }

        .particle-float {
          animation: floatUp var(--dur, 8s) ease-in-out infinite;
          animation-delay: var(--delay, 0s);
        }

        .scanlines::after {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            to bottom,
            transparent,
            transparent 3px,
            rgba(0, 0, 0, 0.03) 3px,
            rgba(0, 0, 0, 0.03) 4px
          );
          pointer-events: none;
          z-index: 1;
        }

        @keyframes gridScroll {
          from { background-position: 0 0; }
          to   { background-position: 0 60px; }
        }

        .grid-3d-floor {
          position: absolute;
          bottom: -5%;
          left: 50%;
          transform-origin: bottom center;
          transform: translateX(-50%) rotateX(68deg);
          width: 160%;
          height: 80%;
          background-image:
            linear-gradient(rgba(220, 38, 38, 0.18) 1px, transparent 1px),
            linear-gradient(90deg, rgba(220, 38, 38, 0.18) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: gridScroll 5s linear infinite;
          pointer-events: none;
        }

        .grid-3d-ceil {
          position: absolute;
          top: -5%;
          left: 50%;
          transform-origin: top center;
          transform: translateX(-50%) rotateX(-68deg);
          width: 160%;
          height: 60%;
          background-image:
            linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: gridScroll 5s linear infinite reverse;
          pointer-events: none;
        }

        @keyframes horizPulse {
          from { opacity: 0.55; transform: translateX(-50%) scaleX(0.82); }
          to   { opacity: 1; transform: translateX(-50%) scaleX(1.06); }
        }

        .horizon-line {
          position: absolute;
          bottom: 30%;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          height: 2px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(220, 38, 38, 0) 15%,
            rgba(220, 38, 38, 0.9) 36%,
            rgba(255, 255, 255, 1) 50%,
            rgba(34, 197, 94, 0.9) 64%,
            rgba(34, 197, 94, 0) 85%,
            transparent 100%
          );
          filter: blur(0.8px);
          animation: horizPulse 3.5s ease-in-out infinite alternate;
          pointer-events: none;
          z-index: 2;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: perspective(800px) translateY(30px) rotateX(8deg); }
          to   { opacity: 1; transform: perspective(800px) translateY(0) rotateX(0deg); }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>

      <div
        ref={bgRef}
        className="absolute inset-0 bg-3d-layer"
        style={{
          backgroundImage: 'url(/images/login-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transformOrigin: 'center center',
          transform: 'scale(1.08)',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', perspective: '800px' }}>
        <div className="grid-3d-floor" />
        <div className="grid-3d-ceil" />
        <div className="horizon-line" />
        <div
          style={{
            position: 'absolute',
            bottom: '26%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '50%',
            height: '100px',
            background: 'radial-gradient(ellipse, rgba(220,38,38,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      <div
        ref={layer1Ref}
        className="absolute inset-0 parallax-layer"
        style={{ background: 'rgba(0,0,0,0.58)', zIndex: 2 }}
      />

      <div className="absolute inset-0 scanlines" style={{ zIndex: 3, pointerEvents: 'none' }} />

      <div
        ref={layer2Ref}
        className="absolute inset-0 parallax-layer pointer-events-none"
        style={{ zIndex: 5 }}
      >
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-secondary-600/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] animate-pulse-slow"
          style={{ animationDelay: '2s' }}
        />
      </div>

      <div
        ref={particlesRef}
        className="absolute inset-0 parallax-layer pointer-events-none"
        style={{ zIndex: 6 }}
      >
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full particle-float"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              background: p.color,
              boxShadow: `0 0 ${p.sizeNum * 2}px ${p.color}`,
              '--dur': p.dur,
              '--delay': p.delay,
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div
        ref={cardRef}
        className="card-shell card-3d relative z-10 w-full max-w-xs animate-fade-in-up mx-4"
      >
        <div className="card-border-rotor" />
        <div className="card-border-glow" />

        <div className="card-core">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-8 left-6 h-24 w-24 rounded-full bg-green-500/10 blur-3xl" />
            <div className="absolute top-10 right-5 h-24 w-24 rounded-full bg-red-500/10 blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/8 to-transparent" />
          </div>

          <div className="p-5 relative z-10">
          <div className="text-center mb-4">
            <div className="w-20 h-20 mx-auto mb-3 flex items-center justify-center hover:scale-105 transition-transform duration-500">
              <img
                src="/images/Logo.png"
                alt="Logo Mariachis Texas"
                className="w-full h-full object-contain drop-shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>

            <h3 className="text-lg font-serif font-bold text-white mb-1 tracking-wide">BIENVENIDO</h3>
            <p className="text-white/60 text-[10px] font-medium tracking-wide uppercase">
              Ingresa tus credenciales
            </p>
          </div>

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

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-white uppercase tracking-widest mb-1 ml-1">
                Correo Electronico
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-400 transition-colors"
                  size={16}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/12 rounded-xl text-white placeholder:text-white/45 focus:ring-2 focus:ring-green-500/30 focus:border-green-500/50 outline-none transition-all text-xs font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  placeholder="usuario@texas.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 ml-1">
                <label className="block text-[10px] font-bold text-white uppercase tracking-widest">
                  Contrasena
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('/forgot-password')}
                  className="text-[9px] text-red-400 hover:text-red-300 transition-colors font-medium"
                >
                  Olvidaste tu contrasena?
                </button>
              </div>

              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors"
                  size={16}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/12 rounded-xl text-white placeholder:text-white/80 placeholder:tracking-[0.18em] focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 outline-none transition-all text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                  placeholder="••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#ce1126] via-[#f22f35] to-[#ce1126] hover:brightness-105 text-white font-bold py-3 rounded-xl transition-all shadow-[0_14px_28px_rgba(220,38,38,0.36)] hover:shadow-[0_20px_38px_rgba(220,38,38,0.5)] uppercase tracking-widest text-xs mt-2 active:scale-[0.98] border border-red-400/40"
            >
              Iniciar Sesion
            </button>
          </form>

          <div className="mt-5 text-center pt-3 border-t border-white/5">
            <p className="text-white/50 text-[10px]">
              No tienes cuenta?{' '}
              <button
                onClick={() => onNavigate('/register')}
                className="text-green-400 font-bold hover:text-green-300 transition-colors"
              >
                Registrate
              </button>
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

const PARTICLES = Array.from({ length: 22 }, (_, i) => {
  const colors = [
    'rgba(220,38,38,0.85)',
    'rgba(34,197,94,0.85)',
    'rgba(255,255,255,0.70)',
  ];

  const sizeNum = 1.5 + (i % 5) * 0.7;

  return {
    x: `${4 + (i * 4.3) % 93}%`,
    y: `${10 + (i * 7.1) % 80}%`,
    sizeNum,
    size: `${sizeNum}px`,
    color: colors[i % 3],
    dur: `${6 + (i % 6)}s`,
    delay: `${(i * 0.4) % 5}s`,
  };
});
