
import React, { useEffect, useState } from 'react';
import { Star, ChevronRight, Heart, Play, Trophy, Sparkles, Flame, Clock, Award, Users, Mic2, Phone, Music, Zap, Camera } from 'lucide-react';
import { motion } from "motion/react";
import { Footer } from '@/src/features/home/pages/Footer.tsx';
import { MagicCard } from '@/src/features/home/pages/MagicCard.tsx';


interface Props {
  onNavigate: (path: string) => void;
}

// --- HOOKS & UTILS ---
// Removed useScrollReveal hook in favor of framer-motion whileInView


// --- DATA FOR GALLERY ---
const galleryImages = [
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1000&auto=format&fit=crop", // Boda/Fiesta
    "https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?q=80&w=1000&auto=format&fit=crop", // Cantante
    "https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?q=80&w=1000&auto=format&fit=crop", // Guitarra
    "https://images.unsplash.com/photo-1516919549054-e08258825f80?q=80&w=1000&auto=format&fit=crop"  // Sombreros
];

// --- COMPONENTS ---

const RetroGrid = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none [perspective:200px]">
      <div className="absolute inset-0 [transform:rotateX(35deg)]">
        <div className="animate-grid-move [background-repeat:repeat] [background-size:60px_60px] [height:300%] [margin-left:-50%] [width:200%] [background-image:linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_0),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_0)]" />
      </div>
    </div>
  );
};

const InfiniteMarquee: React.FC<{ items: string[] }> = ({ items }) => {
    return (
        <div className="w-full bg-[#ce1126] border-t border-b border-white/10 py-3 relative z-30 overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="animate-marquee whitespace-nowrap flex gap-16 relative z-10">
                {[...items, ...items, ...items, ...items].map((item, i) => (
                    <span key={i} className="text-sm font-black text-white uppercase tracking-[0.25em] flex items-center gap-4 drop-shadow-sm">
                        {item} <Star size={12} className="text-[#f1bf00] fill-[#f1bf00]" />
                    </span>
                ))}
            </div>
        </div>
    );
};

export const LandingPage: React.FC<Props> = ({ onNavigate }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Gallery Autoplay Effect
  useEffect(() => {
    const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    }, 3000); // Change image every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-[#050505] font-sans text-slate-200 overflow-x-hidden">
      
      {/* --- HERO SECTION --- */}
      <section id="inicio" className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#050505]">
        
        {/* Background Image with Ken Burns Effect */}
        <div className="absolute inset-0 z-0">
            {/* Enhanced Gradient for Left-Aligned Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent z-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-[#050505] z-20" />
            
            <motion.img 
                initial={{ scale: 1 }}
                animate={{ scale: 1.1 }}
                transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
                src="/shared/assets/images/Mariachis 16.jpeg" 
                alt=""
                className="w-full h-full object-cover object-[75%_center]" 
            />
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 z-10 pointer-events-none">
            {[...Array(15)].map((_, i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: [0, 0.5, 0], y: -100 }}
                    transition={{ 
                        duration: Math.random() * 5 + 5, 
                        repeat: Infinity, 
                        delay: Math.random() * 5,
                        ease: "linear"
                    }}
                    className={`absolute w-1 h-1 rounded-full blur-[1px] ${i % 3 === 0 ? 'bg-[#009c3b]' : i % 3 === 1 ? 'bg-white' : 'bg-[#ce1126]'}`}
                    style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                />
            ))}
        </div>

        {/* Main Content */}
        <div className="relative z-30 w-full max-w-7xl mx-auto px-4 flex flex-col items-center justify-center h-full pt-20 pb-40 text-center">
            
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="flex flex-col items-center max-w-4xl"
            >
                {/* Elegant Badge */}
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="mb-8"
                >
                    <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-black/60 backdrop-blur-xl border border-[#f1bf00]/30 shadow-2xl">
                        <div className="flex gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#009c3b] animate-pulse"></span>
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" style={{animationDelay: '0.1s'}}></span>
                            <span className="w-2 h-2 rounded-full bg-[#ce1126] animate-pulse" style={{animationDelay: '0.2s'}}></span>
                        </div>
                        <span className="text-white text-[10px] md:text-xs font-serif font-bold tracking-[0.25em] uppercase">
                            La Mejor Fiesta Mexicana
                        </span>
                    </div>
                </motion.div>

                {/* Title Group */}
                <div className="relative mb-10 flex flex-col items-center">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="font-mexican-elegant text-2xl md:text-4xl text-[#f1bf00] font-bold tracking-[0.3em] uppercase mb-[-15px] md:mb-[-25px] z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                    >
                        Mariachis
                    </motion.h1>
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7, duration: 0.8, type: "spring" }}
                        className="relative inline-block"
                    >
                        {/* Main Title with Mexican Main Font */}
                        <h2 className="font-mexican-main text-7xl md:text-9xl lg:text-[11rem] leading-[0.8] tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-[#009c3b] via-white to-[#ce1126] drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] filter brightness-110 pb-4 px-4">
                            TEXAS
                        </h2>
                        
                        {/* Decorative Script Overlay */}
                        <motion.span 
                            initial={{ opacity: 0, x: -20, rotate: -10 }}
                            animate={{ opacity: 1, x: 0, rotate: -6 }}
                            transition={{ delay: 1.2, duration: 0.8 }}
                            className="absolute -bottom-4 right-2 md:right-6 text-5xl md:text-7xl font-mexican-script text-[#f1bf00] drop-shadow-[0_4px_8px_rgba(0,0,0,1)] z-20 tracking-wide transform rotate-[-5deg]"
                            style={{ textShadow: '0 2px 15px rgba(241, 191, 0, 0.5)' }}
                        >
                            Medellín
                        </motion.span>
                    </motion.div>
                </div>

                {/* Description */}
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="text-lg md:text-2xl text-slate-300 font-light max-w-2xl mb-12 leading-relaxed mx-auto font-sans"
                >
                    Vive la <span className="text-[#009c3b] font-bold">pasión</span>, la <span className="text-white font-bold">elegancia</span> y la <span className="text-[#ce1126] font-bold">tradición</span> del auténtico sonido de México.
                </motion.p>

                {/* Actions */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="flex flex-col sm:flex-row gap-6 w-full justify-center items-center"
                >
                    <button 
                        onClick={() => onNavigate('/register')}
                        className="group relative px-12 py-5 bg-gradient-to-r from-[#ce1126] via-[#ff2b42] to-[#ce1126] bg-[length:200%_auto] hover:bg-[position:right_center] text-white rounded-full font-serif font-bold text-base tracking-[0.25em] uppercase overflow-hidden transition-all duration-500 shadow-[0_0_30px_rgba(206,17,38,0.6)] hover:shadow-[0_0_60px_rgba(206,17,38,0.9)] hover:-translate-y-1 border-2 border-[#f1bf00]"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3 drop-shadow-md">
                            Reservar Ahora <ChevronRight size={20} strokeWidth={3} />
                        </span>
                        {/* Shine effect */}
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent z-0" />
                    </button>
                    
                    <button 
                        onClick={() => document.getElementById('galeria')?.scrollIntoView({ behavior: 'smooth' })}
                        className="group relative px-12 py-5 bg-gradient-to-r from-[#009c3b] via-[#00c94d] to-[#009c3b] bg-[length:200%_auto] hover:bg-[position:right_center] text-white rounded-full font-serif font-bold text-base tracking-[0.25em] uppercase overflow-hidden transition-all duration-500 shadow-[0_0_30px_rgba(0,156,59,0.6)] hover:shadow-[0_0_60px_rgba(0,156,59,0.9)] hover:-translate-y-1 border-2 border-[#f1bf00]"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3 drop-shadow-md">
                            <Play size={20} className="fill-white group-hover:scale-110 transition-transform" /> 
                            Ver Videos
                        </span>
                        {/* Shine effect */}
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent z-0" />
                    </button>
                </motion.div>
            </motion.div>

        </div>


      </section>

      <InfiniteMarquee items={['Rancheras', 'Boleros', 'Sones', 'Corridos', 'Huapangos', 'Banda', 'Zapateo', 'Norteño']} />

      {/* --- WHY CHOOSE US --- */}
      <section className="py-24 relative bg-[#0a0a0a] overflow-hidden">
          {/* Mexican Flag Gradient Background Effect */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[200%] bg-gradient-to-r from-[#009c3b]/40 via-transparent to-transparent blur-[120px] transform rotate-12"></div>
              <div className="absolute top-[-50%] left-[30%] w-[40%] h-[200%] bg-white/5 blur-[100px] transform rotate-12"></div>
              <div className="absolute top-[-50%] right-[-20%] w-[80%] h-[200%] bg-gradient-to-l from-[#ce1126]/40 via-transparent to-transparent blur-[120px] transform rotate-12"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                      { 
                          icon: Star, 
                          color: "text-[#f1bf00]", 
                          title: "Calidad Premium", 
                          desc: "Voces profesionales y músicos de conservatorio.",
                          cardClass: "border-[#f1bf00]/30 bg-[#f1bf00]/10 hover:bg-[#f1bf00]/20 hover:border-[#f1bf00] hover:shadow-[0_0_30px_rgba(241,191,0,0.2)]"
                      },
                      { 
                          icon: Clock, 
                          color: "text-[#ce1126]", 
                          title: "Puntualidad", 
                          desc: "Llegamos 15 minutos antes. Tu tiempo es oro.",
                          cardClass: "border-[#ce1126]/30 bg-[#ce1126]/10 hover:bg-[#ce1126]/20 hover:border-[#ce1126] hover:shadow-[0_0_30px_rgba(206,17,38,0.2)]"
                      },
                      { 
                          icon: Award, 
                          color: "text-[#009c3b]", 
                          title: "Trajes de Gala", 
                          desc: "Impecables, elegantes y auténticamente mexicanos.",
                          cardClass: "border-[#009c3b]/30 bg-[#009c3b]/10 hover:bg-[#009c3b]/20 hover:border-[#009c3b] hover:shadow-[0_0_30px_rgba(0,156,59,0.2)]"
                      },
                      { 
                          icon: Users, 
                          color: "text-blue-400", 
                          title: "Show Interactivo", 
                          desc: "Hacemos participar a tus invitados. ¡Nadie se aburre!",
                          cardClass: "border-blue-400/30 bg-blue-400/10 hover:bg-blue-400/20 hover:border-blue-400 hover:shadow-[0_0_30px_rgba(96,165,250,0.2)]"
                      }
                  ].map((feature, idx) => (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        className={`p-8 rounded-3xl transition-all duration-300 group border backdrop-blur-sm ${feature.cardClass}`}
                      >
                          <div className={`w-14 h-14 rounded-2xl bg-black/40 flex items-center justify-center mb-6 ${feature.color} border border-white/10 group-hover:scale-110 transition-transform shadow-lg`}>
                              <feature.icon size={28} />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-3 font-serif">{feature.title}</h3>
                          <p className="text-sm text-slate-300 leading-relaxed">{feature.desc}</p>
                      </motion.div>
                  ))}
              </div>
          </div>
      </section>

      {/* --- CONOCENOS (Bento Grid) --- */}
      <section id="conocenos" className="py-24 relative z-10 bg-black overflow-hidden">
          {/* Background Blobs */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#ce1126]/10 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#009c3b]/10 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="text-center mb-16"
              >
                  <span className="text-[#f1bf00] font-bold tracking-widest text-xs uppercase mb-2 block">Nuestra Esencia</span>
                  <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6">
                      PASIÓN POR LA <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">TRADICIÓN</span>
                  </h2>
                  <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">Más que música, somos una explosión de cultura y alegría mexicana en Medellín.</p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[600px]">
                  
                  {/* Large Item with VIDEO Background */}
                  <MagicCard className="md:col-span-2 md:row-span-2 group border-white/10 hover:border-[#f1bf00]/50 overflow-hidden relative" gradientColor="rgba(241, 191, 0, 0.2)">
                        {/* Video Background */}
                        <div className="absolute inset-0 w-full h-full overflow-hidden">
                            <video 
                                autoPlay 
                                loop 
                                muted 
                                playsInline 
                                className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-700 transform scale-105"
                                src="shared/assets/videos/Mariachis18.mp4"
                                ////link para video
                            ></video>
                        </div>
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-10 z-10 w-full">
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="bg-[#f1bf00] w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-black shadow-lg shadow-[#f1bf00]/20 transform group-hover:rotate-12 transition-transform">
                                        <Trophy size={28} />
                                    </div>
                                    <h3 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">15 Años de Historia</h3>
                                    <p className="text-base text-slate-200 max-w-md leading-relaxed">
                                        Llevando el orgullo mexicano a cada rincón. Trajes de gala impecables, sombreros auténticos y voces que llegan al alma.
                                    </p>
                                </div>
                            </div>
                        </div>
                  </MagicCard>

                  {/* Right Item 1 */}
                  <MagicCard className="p-8 flex flex-col justify-between border-white/10 hover:border-[#ce1126]/50 bg-gradient-to-br from-white/5 to-transparent group" gradientColor="rgba(206, 17, 38, 0.2)">
                        <div className="bg-[#ce1126]/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-[#ce1126] border border-[#ce1126]/30 group-hover:bg-[#ce1126] group-hover:text-white transition-colors">
                            <Music size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-serif font-bold text-white mb-2">Repertorio Infinito</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">Desde los clásicos de José Alfredo hasta los éxitos modernos de Christian Nodal.</p>
                        </div>
                  </MagicCard>

                  {/* Right Item 2 */}
                  <MagicCard className="p-8 flex flex-col justify-between border-white/10 hover:border-[#009c3b]/50 bg-gradient-to-br from-white/5 to-transparent group" gradientColor="rgba(0, 156, 59, 0.2)">
                        <div className="bg-[#009c3b]/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-[#009c3b] border border-[#009c3b]/30 group-hover:bg-[#009c3b] group-hover:text-white transition-colors">
                            <Zap size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-serif font-bold text-white mb-2">Show En Vivo</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">Zapateo, trompetas vibrantes y una animación que levantará a todos.</p>
                        </div>
                  </MagicCard>
              </div>
          </div>
      </section>

      {/* --- REPERTORIO SECTION --- */}
      <section id="repertorio-preview" className="py-24 relative z-10 bg-[#0a0a0a] overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
              <img 
                  src="shared/assets/images/Mariachis 15.jpeg"
                  /////imagen repertorio 
                  className="w-full h-full object-cover opacity-20 blur-sm"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
              <div className="flex flex-col md:flex-row gap-12 items-center mb-16">
                  {/* Album Cover Style Image */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7 }}
                    className="w-64 h-64 md:w-80 md:h-80 flex-shrink-0 relative rounded-xl overflow-hidden shadow-2xl group"
                  >
                      <img 
                          src="shared/assets/images/Mariachis 11.jpeg"
                          alt="Repertoire Cover" 
                          //////imagen repertorio
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Music size={64} className="text-white/80 drop-shadow-lg" />
                      </div>
                  </motion.div>

                  {/* Header Text */}
                  <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="text-center md:text-left"
                  >
                      <span className="text-[#f1bf00] font-bold tracking-widest text-xs uppercase mb-2 block flex items-center gap-2 justify-center md:justify-start">
                          <Zap size={12} /> Lista Oficial
                      </span>
                      <h2 className="text-5xl md:text-7xl font-serif font-bold text-white mb-4 tracking-tight">
                          REPERTORIO
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 text-slate-400 text-sm md:text-base justify-center md:justify-start">
                          <span className="bg-[#ce1126] text-white px-2 py-0.5 rounded text-xs font-bold">M</span>
                          <span className="font-semibold text-white">Mariachis Texas Medellín</span>
                          <span>•</span>
                          <span>100+ Canciones</span>
                          <span>•</span>
                          <span>Rancheras, Boleros y Más</span>
                      </div>
                      <p className="text-slate-400 mt-6 max-w-xl font-light leading-relaxed">
                          Una selección curada de los mejores éxitos de la música mexicana. Desde los clásicos inmortales hasta los hits del momento, tenemos la canción perfecta para cada instante de tu celebración.
                      </p>
                  </motion.div>
              </div>


              
              <div className="mt-12 text-center">
                  <button onClick={() => onNavigate('/repertorio')} className="inline-flex items-center gap-2 text-white hover:text-[#f1bf00] transition-colors text-sm font-bold tracking-widest uppercase border-b border-[#f1bf00] pb-1">
                      Ver Repertorio Completo <ChevronRight size={14} />
                  </button>
              </div>
          </div>
      </section>

      {/* --- GALLERY SECTION --- */}
      <section id="galeria" className="py-32 relative z-10 bg-[#050505] overflow-hidden">
          {/* Background Colors */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#009c3b]/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#ce1126]/10 rounded-full blur-[120px] pointer-events-none translate-x-1/2 translate-y-1/2"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="text-center mb-16"
              >
                  <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
                      NUESTRA <span className="text-[#ce1126]">GALERÍA</span>
                  </h2>
                  <p className="text-slate-500 text-lg">Momentos inolvidables capturados en cada presentación.</p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                      "shared/assets/images/Mariachis 10.jpeg",
                      "shared/assets/images/Mariachis 7.jpeg",
                      "shared/assets/images/Mariachis 12.jpeg",
                      "shared/assets/images/Mariachis 13.jpeg",
                      "shared/assets/images/Mariachis 9.jpeg",
                      "shared/assets/images/Mariachis 15.jpeg",
                      "shared/assets/images/Mariachis 16.jpeg",
                      "shared/assets/images/Mariachis 17.jpeg",
                      "shared/assets/images/Mariachis 14.jpeg",
                      
                  ].map((img, idx) => (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        className="group relative overflow-hidden rounded-2xl aspect-[4/3] border border-white/10 hover:border-[#f1bf00] transition-all duration-500 hover:shadow-[0_0_30px_rgba(241,191,0,0.3)] cursor-pointer"
                      >
                          <img 
                              src={img} 
                              alt={`Gallery ${idx + 1}`} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end pb-8">
                              <span className="text-[#f1bf00] font-serif font-bold text-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-500 flex items-center gap-2">
                                  <Camera size={20} /> Nuestros Momentos
                              </span>
                          </div>
                      </motion.div>
                  ))}
              </div>
          </div>
      </section>

      {/* --- FEATURED VIDEO SECTION --- */}
      <section className="py-24 relative z-10 bg-[#050505] overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#ce1126]/10 via-transparent to-transparent blur-[100px] pointer-events-none"></div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-center mb-12"
              >
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#f1bf00] text-xs font-bold tracking-widest uppercase mb-4">
                      <Sparkles size={12} /> Producción Especial
                  </div>
                  <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-4">
                      NUESTRA <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ce1126] to-[#f1bf00]">OBRA MAESTRA</span>
                  </h2>
                  <p className="text-slate-400 max-w-2xl mx-auto">
                      Un recorrido visual por la magia que llevamos a cada evento. Sube el volumen y siente la emoción.
                  </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative aspect-video w-full rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 group"
            >
                
                <video 
                loop 
                muted 
                playsInline 
                poster=""
                controls
                className="w-full h-full object-cover"
                src="shared/assets/videos/Mariachis20.mp4"
                ></video> 
            </motion.div>
        </div>
    </section>

    <section className="relative py-32 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
            <img 
                src="shared/assets/images/flores.jpg"
                
                className="w-full h-full object-cover opacity-40 bg-fixed "
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/50 to-[#050505]"></div>
        </div>
        

        <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative z-10 text-center px-4 max-w-4xl mx-auto"
          >
              <div className="inline-block mb-6 p-4 rounded-full bg-white/5 backdrop-blur-md border border-white/10 animate-bounce">
                  <Mic2 size={32} className="text-white" />
              </div>
              <h2 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 tracking-tight">
                  ¿Listo para la <span className="text-[#f1bf00]">Fiesta?</span>
              </h2>
              <p className="text-xl text-slate-300 mb-10 font-light max-w-2xl mx-auto">
                  No dejes tu fecha en manos de cualquiera. Asegura la calidad y la alegría de Mariachis Texas hoy mismo.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <button 
                      onClick={() => onNavigate('/register')}
                      className="px-12 py-5 bg-[#ce1126] hover:bg-[#a80b1e] text-white rounded-full font-bold text-sm tracking-[0.25em] uppercase shadow-[0_0_40px_rgba(206,17,38,0.4)] hover:shadow-[0_0_60px_rgba(206,17,38,0.6)] transition-all transform hover:-translate-y-1"
                  >
                      Reservar Fecha
                  </button>
                  <button className="px-12 py-5 bg-white/5 border border-white/30 hover:bg-white/10 text-white rounded-full font-bold text-sm tracking-[0.25em] uppercase transition-all flex items-center justify-center gap-3 backdrop-blur-sm">
                      <Phone size={16} /> 300 123 4567
                  </button>
              </div>
          </motion.div>
      </section>

      {/* --- FOOTER COMPONENT --- */}
      <Footer onNavigate={onNavigate} scrollToSection={scrollToSection} />

      {/* --- ANIMATIONS STYLES --- */}
      <style>{`
        @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
        .animate-marquee {
            animation: marquee 60s linear infinite;
        }
        @keyframes grid-move {
            0% { transform: translateY(0); }
            100% { transform: translateY(60px); }
        }
        .animate-grid-move {
            animation: grid-move 4s linear infinite;
        }
        .animate-pulse-slow {
            animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .8; }
        }
      `}</style>

    </div>
  );
};
