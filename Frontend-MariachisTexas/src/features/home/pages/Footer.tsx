
import React from 'react';
import { Phone, MapPin, Mail, Instagram, Facebook, Youtube } from 'lucide-react';

interface Props {
  onNavigate: (path: string) => void;
  scrollToSection: (id: string) => void;
}

export const Footer: React.FC<Props> = ({ onNavigate, scrollToSection }) => {
  return (
    <footer className="bg-[#050505] text-white pt-20 pb-10 relative z-10 overflow-hidden">
        
        {/* Tricolor Border Top */}
        <div className="absolute top-0 left-0 w-full h-1.5 flex">
            <div className="h-full w-1/3 bg-mexican-green shadow-[0_0_20px_#009c3b]"></div>
            <div className="h-full w-1/3 bg-white shadow-[0_0_20px_#ffffff]"></div>
            <div className="h-full w-1/3 bg-mexican-red shadow-[0_0_20px_#ce1126]"></div>
        </div>

        {/* Background Glows */}
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-mexican-green/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-mexican-red/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                
                {/* Columna 1: Marca y Redes */}
                <div className="col-span-1 md:col-span-2">
                    <h3 className="text-3xl font-serif font-bold mb-4 tracking-tighter text-white">
                        MARIACHIS <span className="text-transparent bg-clip-text bg-gradient-to-r from-mexican-green via-white to-mexican-red">TEXAS</span>
                    </h3>
                    <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-8">
                        La mejor experiencia mexicana en Medellín. Calidad musical, trajes de gala y el mejor repertorio para tus eventos inolvidables.
                    </p>
                    
                    {/* Social Icons */}
                    <div className="flex gap-4">
                        <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-gradient-to-tr hover:from-purple-600 hover:to-pink-600 hover:text-white transition-all text-slate-400 border border-white/10 hover:border-transparent hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:-translate-y-1">
                            <Instagram size={18} />
                        </a>
                        <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all text-slate-400 border border-white/10 hover:border-transparent hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:-translate-y-1">
                            <Facebook size={18} />
                        </a>
                        <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all text-slate-400 border border-white/10 hover:border-transparent hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:-translate-y-1">
                            <Youtube size={18} />
                        </a>
                    </div>
                </div>

                {/* Columna 2: Contacto Directo */}
                <div>
                    <h4 className="text-[10px] font-bold text-mexican-gold uppercase tracking-[0.2em] mb-6">Contacto Directo</h4>
                    <ul className="space-y-6">
                        <li className="flex items-start gap-4 text-sm text-slate-300 group cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-mexican-red/20 flex items-center justify-center text-mexican-red group-hover:bg-mexican-red group-hover:text-white transition-all border border-mexican-red/20">
                              <Phone size={16} />
                            </div>
                            <span className="mt-1 group-hover:text-white transition-colors">
                                +57 300 123 4567<br/>
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Línea 24 Horas</span>
                            </span>
                        </li>
                        <li className="flex items-start gap-4 text-sm text-slate-300 group">
                            <div className="w-8 h-8 rounded-lg bg-mexican-green/20 flex items-center justify-center text-mexican-green border border-mexican-green/20">
                              <MapPin size={16} />
                            </div>
                            <span className="mt-1">
                                Medellín, Antioquia<br/>
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Cobertura Total</span>
                            </span>
                        </li>
                        <li className="flex items-start gap-4 text-sm text-slate-300 group">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 border border-white/10">
                              <Mail size={16} />
                            </div>
                            <span className="mt-2">reservas@mariachistexas.com</span>
                        </li>
                    </ul>
                </div>

                {/* Columna 3: Navegación */}
                <div>
                    <h4 className="text-[10px] font-bold text-mexican-gold uppercase tracking-[0.2em] mb-6">Explorar</h4>
                    <ul className="space-y-3 text-sm text-slate-400">
                        <li><button onClick={() => scrollToSection('inicio')} className="hover:text-mexican-gold transition-colors flex items-center gap-2 hover:translate-x-1 duration-300">Inicio</button></li>
                        <li><button onClick={() => scrollToSection('conocenos')} className="hover:text-mexican-gold transition-colors flex items-center gap-2 hover:translate-x-1 duration-300">Nosotros</button></li>
                        <li><button onClick={() => scrollToSection('galeria')} className="hover:text-mexican-gold transition-colors flex items-center gap-2 hover:translate-x-1 duration-300">Videos y Galería</button></li>
                        <li className="pt-4"><button onClick={() => onNavigate('/login')} className="text-white bg-white/10 hover:bg-mexican-pink px-4 py-2 rounded-lg text-xs font-bold transition-all w-full md:w-auto">Acceso Staff</button></li>
                    </ul>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                <p>© 2024 Mariachis Texas Medellín.</p>
                <div className="flex gap-6">
                    <span className="hover:text-slate-400 cursor-pointer transition-colors">Privacidad</span>
                    <span className="hover:text-slate-400 cursor-pointer transition-colors">Términos</span>
                </div>
            </div>
        </div>
    </footer>
  );
};
