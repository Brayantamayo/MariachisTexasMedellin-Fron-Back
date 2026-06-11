import React, { useState, useEffect } from 'react';
import { Phone, Mail, Instagram, Facebook, Youtube } from 'lucide-react';

export const TopContactBar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  
  const contactInfo = {
    phone: '312 2373486',
    email: 'texasmariachi@gmail.com',
    instagram: 'https://www.instagram.com/texasmariachi/',
    facebook: 'https://www.facebook.com/p/Mariachi-TEXAS-De-Medellin-su-mejor-Mariachi-100054019491950/',
    youtube: 'https://www.youtube.com/@mariachitexasmedellin.nuev9357'
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY < 150);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`fixed w-full top-0 left-0 right-0 z-50 transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}>
      <style>{`
        @keyframes moveGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-moving-gradient {
          background-size: 200% 100%;
          animation: moveGradient 5s linear infinite;
        }
      `}</style>

      {/* Decorative top line with moving Mexican colors */}
      <div className="h-0.5 flex bg-gradient-to-r from-[#009c3b] via-yellow-500 to-[#ce1126] animate-moving-gradient shadow-[0_0_12px_rgba(206,17,38,0.5)]" />

      {/* Main bar */}
      <div className="backdrop-blur-md bg-black/60 border-b border-red-600/30 py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Contact Info - Compact */}
          <div className="flex items-center gap-4 flex-wrap">
            
            {/* Phone (WhatsApp Redirect) */}
            <a 
              href="https://wa.me/573122373486"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-1.5 transition-all duration-300 hover:scale-105 text-xs"
            >
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-red-600/70 to-red-700/70 flex items-center justify-center border border-red-500/30 group-hover:border-red-500/60 group-hover:shadow-lg group-hover:shadow-red-600/30 transition-all">
                <Phone size={13} className="text-white" />
              </div>
              <div className="flex flex-col gap-0">
                <span className="text-xs font-bold text-white group-hover:text-red-300 transition-colors">
                  {contactInfo.phone}
                </span>
                <span className="text-[8px] font-bold text-yellow-500/70 tracking-wider">
                  24H
                </span>
              </div>
            </a>

            {/* Divider */}
            <div className="w-px h-5 bg-red-600/30" />

            {/* Email - Hide on small screens */}
            <a 
              href={`mailto:${contactInfo.email}`}
              className="group hidden sm:flex items-center gap-1.5 transition-all duration-300 hover:scale-105 text-xs"
            >
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-red-600/70 to-red-700/70 flex items-center justify-center border border-red-500/30 group-hover:border-red-500/60 group-hover:shadow-lg group-hover:shadow-red-600/30 transition-all">
                <Mail size={13} className="text-white" />
              </div>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-red-300 transition-colors truncate max-w-[140px]">
                {contactInfo.email}
              </span>
            </a>
          </div>

          {/* Right: Social Media - Compact */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden sm:block text-[8px] font-bold text-yellow-500/60 tracking-widest">
              SÍGUENOS
            </span>
            
            {/* Instagram */}
            <a 
              href={contactInfo.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-7 h-7 flex items-center justify-center rounded transition-all duration-300 hover:scale-110"
              aria-label="Instagram"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 rounded opacity-0 group-hover:opacity-100 blur transition-opacity duration-300" />
              <div className="relative w-full h-full rounded bg-black/70 border border-pink-500/20 group-hover:border-pink-500/50 flex items-center justify-center transition-all group-hover:bg-gradient-to-br group-hover:from-pink-600 group-hover:via-red-500 group-hover:to-yellow-500">
                <Instagram size={14} className="text-slate-300 group-hover:text-white transition-colors" strokeWidth={1.5} />
              </div>
            </a>

            {/* Facebook */}
            <a 
              href={contactInfo.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-7 h-7 flex items-center justify-center rounded transition-all duration-300 hover:scale-110"
              aria-label="Facebook"
            >
              <div className="absolute inset-0 bg-blue-600 rounded opacity-0 group-hover:opacity-100 blur transition-opacity duration-300" />
              <div className="relative w-full h-full rounded bg-black/70 border border-blue-500/20 group-hover:border-blue-500/50 flex items-center justify-center transition-all group-hover:bg-blue-600">
                <Facebook size={14} className="text-slate-300 group-hover:text-white transition-colors" strokeWidth={1.5} />
              </div>
            </a>

            {/* YouTube */}
            <a 
              href={contactInfo.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-7 h-7 flex items-center justify-center rounded transition-all duration-300 hover:scale-110"
              aria-label="YouTube"
            >
              <div className="absolute inset-0 bg-red-600 rounded opacity-0 group-hover:opacity-100 blur transition-opacity duration-300" />
              <div className="relative w-full h-full rounded bg-black/70 border border-red-600/20 group-hover:border-red-600/50 flex items-center justify-center transition-all group-hover:bg-red-600">
                <Youtube size={14} className="text-slate-300 group-hover:text-white transition-colors" strokeWidth={1.5} />
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopContactBar;
