
import React, { useEffect, useState } from 'react';
import { Music } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  const [text, setText] = useState('Iniciando Sesión');

  // Efecto simple para cambiar el texto y hacerlo más dinámico
  useEffect(() => {
    const texts = [
      'Afinando instrumentos...',
      'Preparando el escenario...',
      'Organizando el repertorio...',
      'Bienvenido a Texas...'
    ];
    let i = 0;
    const interval = setInterval(() => {
      setText(texts[i]);
      i = (i + 1) % texts.length;
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center overflow-hidden">
      
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-900/20 blur-[120px] rounded-full animate-pulse-slow"></div>
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary-600/10 blur-[100px] rounded-full"></div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* Animated Icon Container */}
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary-600 blur-xl opacity-20 animate-ping"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary-900/30">
                <Music className="text-primary-500 w-10 h-10 animate-bounce" style={{ animationDuration: '3s' }} />
            </div>
        </div>

        {/* Brand Name */}
        <h1 className="text-3xl font-serif font-bold text-white tracking-widest mb-2">
            MARIACHIS <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700">TEXAS</span>
        </h1>

        {/* Loading Bar */}
        <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden mt-6 mb-4">
            <div className="h-full bg-primary-600 animate-shimmer w-[50%]" style={{ width: '100%', animation: 'shimmer 1.5s infinite linear', backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }}></div>
        </div>

        {/* Dynamic Text */}
        <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em] animate-pulse">
            {text}
        </p>

      </div>
    </div>
  );
};
