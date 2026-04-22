
import React, { useState, useEffect } from 'react';
import { Music, Menu, X } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  onNavigate: (path: string) => void;
  currentPath: string;
}
//////NAV

export const PublicLayout: React.FC<Props> = ({ children, onNavigate, currentPath }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'INICIO', id: 'inicio' },
    { name: 'CONÓCENOS', id: 'conocenos' },
    { name: 'GALERÍA', id: 'galeria' },
    { name: 'REPERTORIO', id: 'repertorio' },
    { name: 'COTIZAR', id: 'cotizar' }
  ];

  const handleNavClick = (sectionId: string) => {
    if (sectionId === 'repertorio') {
        onNavigate('/repertorio');
        setMobileMenuOpen(false);
        return;
    }

    if (sectionId === 'cotizar') {
        onNavigate('/cotizacion');
        setMobileMenuOpen(false);
        return;
    }

    if (currentPath !== '/') {
      onNavigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen font-sans text-slate-200 relative bg-[#050505] selection:bg-red-600 selection:text-white">
      
      {/* --- NAVBAR --- */}
      <nav 
        className={`fixed w-full z-50 transition-all duration-500 border-b 
        ${scrolled || mobileMenuOpen 
            ? 'bg-black/80 backdrop-blur-xl py-3 border-white/10 shadow-lg' 
            : 'bg-transparent border-transparent py-6'}
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            
            {/* Logo */}
            <div className="flex items-center cursor-pointer group" onClick={() => onNavigate('/')}>
              <div className="relative w-12 h-12 flex items-center justify-center transition-all duration-500 group-hover:scale-110">
                  <div className="absolute inset-0 bg-red-600/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <img 
                    src="shared/assets/images/Logo.png" 
                    alt="Logo Mariachis Texas" 
                    className="relative w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                  />
              </div>

              {/* Separador elegante */}
              <div className="mx-4 w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

              <div className="flex flex-col justify-center">
                <span className="text-xl font-serif font-black tracking-[0.1em] leading-none text-white drop-shadow-md uppercase group-hover:text-red-50 transition-colors">
                  Mariachis
                </span>
                <span className="text-[9px] font-black text-red-500 tracking-[0.4em] leading-none mt-1.5 uppercase transition-all group-hover:tracking-[0.5em]">
                  Texas
                </span>
              </div>
            </div>

            
            <div className="hidden md:flex items-center bg-white/5 backdrop-blur-sm rounded-full px-2 py-1 border border-white/5">
              {navLinks.map((item) => (
                <button 
                  key={item.name}
                  onClick={() => handleNavClick(item.id)} 
                  className="px-6 py-2 rounded-full text-xs font-bold tracking-widest transition-all text-slate-300 hover:text-white hover:bg-white/10"
                >
                  {item.name}
                </button>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <button 
                onClick={() => onNavigate('/login')}
                className="text-xs font-bold tracking-widest transition-colors text-white hover:text-red-400"
              >
                INICIAR SESIÓN
              </button>
              
              <button 
                onClick={() => onNavigate('/register')}
                className="relative group px-8 py-3 rounded-full font-bold text-xs tracking-[0.2em] transition-all bg-gradient-to-r from-[#ce1126] via-[#ff2b42] to-[#ce1126] bg-[length:200%_auto] hover:bg-[position:right_center] text-white shadow-[0_0_20px_rgba(206,17,38,0.5)] hover:shadow-[0_0_30px_rgba(206,17,38,0.8)] hover:-translate-y-0.5 border border-[#f1bf00]/30 overflow-hidden"
              >
                <span className="relative z-10">REGISTRARSE</span>
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent z-0" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white p-2">
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 shadow-2xl p-6 flex flex-col gap-4 animate-fade-in-up">
                 {navLinks.map((item) => (
                    <button key={item.name} onClick={() => handleNavClick(item.id)} className="text-left py-3 border-b border-white/5 text-sm font-bold tracking-widest text-white hover:text-red-500">
                        {item.name}
                    </button>
                 ))}
                 <div className="flex flex-col gap-3 mt-4">
                     <button onClick={() => { onNavigate('/login'); setMobileMenuOpen(false); }} className="w-full py-3 rounded-lg border border-white/20 text-sm font-bold tracking-widest text-white">
                         INICIAR SESIÓN
                     </button>
                     <button onClick={() => { onNavigate('/register'); setMobileMenuOpen(false); }} className="w-full py-3 rounded-lg bg-gradient-to-r from-[#ce1126] to-[#ff2b42] text-sm font-bold tracking-widest text-white shadow-lg shadow-red-900/40">
                         RESERVAR
                     </button>
                 </div>
            </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="relative z-10 w-full overflow-x-hidden">
        {children}
      </main>

    </div>
  );
};
