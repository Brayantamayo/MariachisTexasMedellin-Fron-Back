
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ChevronRight, Heart, Play, Trophy, Sparkles, Flame, Clock, Award, Users, Mic2, Phone, Music, Zap, Camera, X, ChevronLeft } from 'lucide-react';
import { motion } from "motion/react";
import { Footer } from '@/src/features/home/pages/Footer.tsx';
import { MagicCard } from '@/src/features/home/pages/MagicCard.tsx';
import { AIAdvisorWidget } from '@/src/features/home/pages/Aiadvisorwidger.tsx';

// --- HOOKS & UTILS ---
// Removed useScrollReveal hook in favor of framer-motion whileInView


// --- DATA FOR GALLERY ---
const galleryImages: string[] = [];

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

const SectionDivider: React.FC<{ tone?: 'gold' | 'red' | 'green' }> = ({ tone = 'gold' }) => {
    const glow =
        tone === 'red'
            ? 'from-[#ce1126]/35 via-[#ce1126]/10 to-transparent'
            : tone === 'green'
                ? 'from-[#009c3b]/35 via-[#009c3b]/10 to-transparent'
                : 'from-[#f1bf00]/35 via-[#f1bf00]/10 to-transparent';

    const glowStyle =
        tone === 'red'
            ? 'radial-gradient(circle, rgba(206,17,38,0.16) 0%, rgba(206,17,38,0.08) 22%, transparent 70%)'
            : tone === 'green'
                ? 'radial-gradient(circle, rgba(0,156,59,0.16) 0%, rgba(0,156,59,0.08) 22%, transparent 70%)'
                : 'radial-gradient(circle, rgba(241,191,0,0.16) 0%, rgba(241,191,0,0.08) 22%, transparent 70%)';

    return (
        <div className="relative h-16 overflow-hidden pointer-events-none">
            <div className={`absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r ${glow}`} />
            <div className="absolute inset-x-0 top-1/2 h-20 -translate-y-1/2 blur-2xl opacity-80" style={{ background: glowStyle }} />
            <div className="absolute inset-x-[15%] top-1/2 h-px -translate-y-1/2 bg-white/5" />
        </div>
    );
};

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [dynamicGallery, setDynamicGallery] = useState<string[]>([]);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [videoPlaying, setVideoPlaying] = useState(false);
    const videoRef = React.useRef<HTMLVideoElement>(null);

    const handlePlayVideo = () => {
        if (videoRef.current) {
            videoRef.current.play();
            setVideoPlaying(true);
        }
    };

    const handleVideoPause = () => {
        setVideoPlaying(false);
    };

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/galeria`);
                const data = await response.json();
                if (data && Array.isArray(data) && data.length > 0) {
                    setDynamicGallery(data.map((img: any) => img.url));
                } else {
                    setDynamicGallery([]);
                }
            } catch (error) {
                console.error("Error fetching gallery:", error);
                setDynamicGallery([]);
            }

        };
        fetchGallery();
    }, []);

    const openLightbox = (idx: number) => {
        setLightboxIndex(idx);
        setLightboxOpen(true);
    };

    const closeLightbox = () => setLightboxOpen(false);

    const goToNext = () => {
        setLightboxIndex((prev) => (prev + 1) % dynamicGallery.length);
    };

    const goToPrev = () => {
        setLightboxIndex((prev) => (prev - 1 + dynamicGallery.length) % dynamicGallery.length);
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="bg-[#050505] font-sans text-slate-200 overflow-x-hidden">
            <AIAdvisorWidget />

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
                        src={localStorage.getItem('landing_bg') || "/images/Mariachis 16.jpeg"}
                        alt="Mariachis Texas"
                        className="w-full h-full object-cover object-[75%_15%]"
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
                <div className="relative z-30 w-full max-w-7xl mx-auto px-4 flex flex-col items-center justify-center h-full pt-28 pb-10 text-center">

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
                            className="mb-4"
                        >
                            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-black/60 backdrop-blur-xl border border-[#f1bf00]/30 shadow-2xl">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 rounded-full bg-[#009c3b] animate-pulse"></span>
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" style={{ animationDelay: '0.1s' }}></span>
                                    <span className="w-2 h-2 rounded-full bg-[#ce1126] animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                                </div>
                                <span className="text-white text-[10px] md:text-xs font-serif font-bold tracking-[0.25em] uppercase">
                                    El mejor servicio en Medellin
                                </span>
                            </div>
                        </motion.div>

                        {/* Title Group */}
                        <div className="relative mb-6 flex flex-col items-center">
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
                            className="text-lg md:text-2xl text-slate-300 font-light max-w-2xl mb-8 leading-relaxed mx-auto font-sans"
                        >
                        Vive la <span className="text-[#009c3b] font-bold">pasión</span>, la <span className="text-white font-bold">elegancia</span> y la <span className="text-[#ce1126] font-bold">tradición</span> que convierten cada celebración en un momento inolvidable.
                        </motion.p>

                        {/* Actions */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2, duration: 0.8 }}
                            className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center"
                        >
                            <button
                                onClick={() => navigate('/register')}
                                className="group relative px-12 py-4 bg-gradient-to-r from-[#ce1126] via-[#ff2b42] to-[#ce1126] bg-[length:200%_auto] hover:bg-[position:right_center] text-white rounded-full font-serif font-bold text-base tracking-[0.25em] uppercase overflow-hidden transition-all duration-500 shadow-[0_0_30px_rgba(206,17,38,0.6)] hover:shadow-[0_0_60px_rgba(206,17,38,0.9)] hover:-translate-y-1 border-2 border-[#f1bf00]"
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

            <InfiniteMarquee items={['Casicos', 'Romanticas', 'Valadas', 'Popular', 'Rancheras',]} />

            <SectionDivider tone="gold" />

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
                                bgIcon: "bg-[#f1bf00]/10 border-[#f1bf00]/20",
                                title: "Calidad Premium",
                                desc: "Ensayos rigurosos y atención al detalle en cada presentación.",
                                gradientColor: "rgba(241, 191, 0, 0.15)",
                                borderHover: "group-hover:border-[#f1bf00]/50"
                            },
                            {
                                icon: Clock,
                                color: "text-[#ce1126]",
                                bgIcon: "bg-[#ce1126]/10 border-[#ce1126]/20",
                                title: "Puntualidad",
                                desc: "Siempre listos para comenzar en el momento indicado.",
                                gradientColor: "rgba(206, 17, 38, 0.15)",
                                borderHover: "group-hover:border-[#ce1126]/50"
                            },
                            {
                                icon: Award,
                                color: "text-[#009c3b]",
                                bgIcon: "bg-[#009c3b]/10 border-[#009c3b]/20",
                                title: "Trajes de Gala",
                                desc: "Vestimos con elegancia y profesionalismo en cada presentación.",
                                gradientColor: "rgba(0, 156, 59, 0.15)",
                                borderHover: "group-hover:border-[#009c3b]/50"
                            },
                            {
                                icon: Users,
                                color: "text-blue-400",
                                bgIcon: "bg-blue-400/10 border-blue-400/20",
                                title: "Show Interactivo",
                                desc: "Hacemos participar a tus invitados ¡Nadie se aburre!",
                                gradientColor: "rgba(96, 165, 250, 0.15)",
                                borderHover: "group-hover:border-blue-400/50"
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                            >
                                <MagicCard 
                                    className={`p-8 h-full border-white/5 bg-black/35 backdrop-blur-xl group hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] ${feature.borderHover} transition-all duration-300`}
                                    gradientColor={feature.gradientColor}
                                >
                                    <div className="flex flex-col h-full relative z-10">
                                        <div className={`w-14 h-14 rounded-2xl ${feature.bgIcon} border flex items-center justify-center mb-6 ${feature.color} group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md`}>
                                            <feature.icon size={28} />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-3 font-serif tracking-wide transition-colors duration-300">{feature.title}</h3>
                                        <p className="text-sm text-slate-300 leading-relaxed font-light">{feature.desc}</p>
                                        
                                        {/* Bottom hover bar accent */}
                                        <div className={`w-0 group-hover:w-full h-[2px] bg-gradient-to-r from-transparent via-current to-transparent ${feature.color} mt-6 transition-all duration-500 opacity-40`} />
                                    </div>
                                </MagicCard>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <SectionDivider tone="red" />

            {/* --- CONOCENOS (Bento Grid) --- */}
            <section id="conocenos" className="py-24 relative z-10 bg-black overflow-hidden border-t border-white/5">
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
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">Reconocidos como uno de los mejores mariachis de Medellín, transformamos cada evento en una experiencia inolvidable llena de emoción y tradición mexicana.</p>
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
                                    src="/videos/Mariachis18.mp4"
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
                                            Más que música, llevamos emoción, tradición y alegría a cada rincón de Medellín.
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
                                <h3 className="text-2xl font-serif font-bold text-white mb-2">Repertorio </h3>
                                <p className="text-sm text-slate-400 leading-relaxed">Contamos con un amplio repertorio musical. Pregunta por tus canciones favoritas y personaliza tu serenata.</p>
                            </div>
                        </MagicCard>

                        {/* Right Item 2 */}
                        <MagicCard className="p-8 flex flex-col justify-between border-white/10 hover:border-[#009c3b]/50 bg-gradient-to-br from-white/5 to-transparent group" gradientColor="rgba(0, 156, 59, 0.2)">
                            <div className="bg-[#009c3b]/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-[#009c3b] border border-[#009c3b]/30 group-hover:bg-[#009c3b] group-hover:text-white transition-colors">
                                <Zap size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-serif font-bold text-white mb-2">Show en vivo </h3>
                                <p className="text-sm text-slate-400 leading-relaxed">Cada presentación está llena de pasión, tradición y el sentimiento que merece una ocasión especial..</p>
                            </div>
                        </MagicCard>
                    </div>
                </div>
            </section>

            <SectionDivider tone="green" />

            {/* --- REPERTORIO SECTION --- */}
            <section id="repertorio-preview" className="py-24 relative z-10 bg-[#0a0a0a] overflow-hidden border-t border-white/5">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/Mariachis 15.jpeg"
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
                                src="/images/Mariachis 11.jpeg"
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
                            <span className="inline-flex items-center gap-2 text-[#f1bf00] font-bold tracking-widest text-xs uppercase mb-2">
                                <Zap size={12} /> Lista Oficial
                            </span>
                            <h2 className="text-5xl md:text-7xl font-serif font-bold text-white mb-4 tracking-tight">
                                REPERTORIO
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 text-slate-400 text-sm md:text-base justify-center md:justify-start">
                                <span className="bg-[#ce1126] text-white px-2 py-0.5 rounded text-xs font-bold">M</span>
                                <span className="font-semibold text-white">Mariachis Texas Medellín</span>
                                <span>•</span>
                                <span>Muchas canciones</span>
                                <span>•</span>
                                <span>Rancheras, Clasicos y Más</span>
                            </div>
                            <p className="text-slate-400 mt-6 max-w-xl font-light leading-relaxed">
                            Contamos con un amplio repertorio de canciones seleccionadas para cada ocasión, creando el ambiente perfecto y acompañando cada momento especial de tu celebración.
                            </p>
                        </motion.div>
                    </div>



                    <div className="mt-12 text-center">
                        <button onClick={() => navigate('/repertorio')} className="inline-flex items-center gap-2 text-white hover:text-[#f1bf00] transition-colors text-sm font-bold tracking-widest uppercase border-b border-[#f1bf00] pb-1">
                            Ver Repertorio Completo <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </section>

            <SectionDivider tone="gold" />

            {/* --- GALLERY SECTION --- */}
            <section id="galeria" className="py-32 relative z-10 bg-[#050505] overflow-hidden border-t border-white/5">
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
                        {dynamicGallery.slice(0, 9).map((img, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                onClick={() => openLightbox(idx)}
                                className="group relative overflow-hidden rounded-2xl aspect-[4/3] border border-white/10 hover:border-[#f1bf00] transition-all duration-500 hover:shadow-[0_0_30px_rgba(241,191,0,0.3)] cursor-pointer"
                            >
                                <img
                                    src={img}
                                    alt={`Gallery ${idx + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end pb-8">
                                    <span className="text-[#f1bf00] font-serif font-bold text-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-500 flex items-center gap-2">
                                        <Camera size={20} /> Ver Foto
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                </div>
            </section>

            <SectionDivider tone="red" />

            {/* --- FEATURED VIDEO SECTION --- */}
            <section className="py-28 relative z-10 bg-[#050505] overflow-hidden border-t border-white/5">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[70rem] h-[70rem] bg-[radial-gradient(circle,_rgba(241,191,0,0.12)_0%,_rgba(206,17,38,0.08)_28%,_transparent_68%)] blur-3xl" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f1bf00]/40 to-transparent" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 xl:gap-14 items-center"
                    >
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#f1bf00] text-[11px] font-black tracking-[0.35em] uppercase">
                                <Sparkles size={12} /> Producción Especial
                            </div>

                            <div className="space-y-5">
                                <h2 className="text-4xl md:text-6xl font-serif font-bold text-white leading-[0.95]">
                                    Experiencias<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ce1126] via-[#f1bf00] to-[#f1bf00]"> Inolvidables</span>
                                </h2>
                                <p className="text-slate-300 text-lg leading-8 max-w-xl">
                                    Los mejores trabajan con los mejores. Hemos tenido el privilegio de acompañar a personas reconocidas, quienes han quedado satisfechas con la calidad de nuestras presentaciones, el profesionalismo de nuestro equipo y el amor que ponemos en cada evento.

                                </p>
                            </div>

                            <div className="grid sm:grid-cols-3 gap-4">
                                {[
{ 
  icon: Music, 
  title: 'Música en vivo', 
  text: 'Interpretaciones llenas de emoción con músicos y cantantes profesionales.' 
},
{ 
  icon: Users, 
  title: 'Atención personalizada', 
  text: 'Nos adaptamos a cada celebración para hacer de tu momento algo único.' 
},
{ 
  icon: Award, 
  title: 'Experiencia y calidad', 
  text: 'Más de 10 años llevando serenatas inolvidables a nuestros clientes.' 
},
                                ].map((item, index) => {
                                    const Icon = item.icon;
                                    return (
                                        <motion.div
                                            key={item.title}
                                            initial={{ opacity: 0, y: 18 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.5, delay: index * 0.12 }}
                                            className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 hover:border-[#f1bf00]/35 hover:bg-white/[0.05] transition-all duration-300"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ce1126] to-[#f1bf00] flex items-center justify-center mb-3 shadow-[0_0_25px_rgba(241,191,0,0.18)]">
                                                <Icon size={18} className="text-white" />
                                            </div>
                                            <h3 className="text-white font-bold text-sm mb-1">{item.title}</h3>
                                            <p className="text-slate-400 text-xs leading-5">{item.text}</p>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            <div className="flex flex-wrap gap-3">
                            </div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            whileInView={{ opacity: 1, scale: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.85, delay: 0.12 }}
                            className="relative"
                        >
                            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[#ce1126]/35 via-transparent to-[#f1bf00]/30 blur-2xl opacity-70" />
                            <div className="relative rounded-[2rem] p-3 border border-white/10 bg-white/[0.03] shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
                                <div className="absolute left-6 top-6 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/55 backdrop-blur-md px-4 py-2 text-[10px] font-black tracking-[0.35em] uppercase text-[#f1bf00]">
                                    <Clock size={12} /> Show en vivo
                                </div>

                                <div
                                    className="relative aspect-video w-full overflow-hidden rounded-[1.6rem] border border-white/10 cursor-pointer group"
                                    onClick={!videoPlaying ? handlePlayVideo : undefined}
                                >
                                    <video
                                        ref={videoRef}
                                        loop
                                        playsInline
                                        controls={videoPlaying}
                                        onPlay={() => setVideoPlaying(true)}
                                        onPause={handleVideoPause}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                                        src="/videos/Mariachis20.mp4"
                                    />

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/20 pointer-events-none" />

                                    {!videoPlaying && (
                                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/25 backdrop-blur-[2px]">
                                            <div className="relative mb-5 flex items-center justify-center">
                                                <div className="absolute inset-0 rounded-full bg-[#f1bf00]/20 animate-ping" />
                                                <div className="absolute inset-2 rounded-full bg-[#ce1126]/30 animate-pulse" />
                                                <button
                                                    onClick={handlePlayVideo}
                                                    className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-[#ce1126] to-[#f1bf00] flex items-center justify-center shadow-[0_0_40px_rgba(241,191,0,0.28)] transform transition-transform duration-300 hover:scale-110"
                                                    aria-label="Reproducir video"
                                                >
                                                    <Play size={26} className="text-white fill-white translate-x-0.5" />
                                                </button>
                                            </div>
                                            <div className="text-center px-6">
                                                <p className="text-white font-bold text-sm uppercase tracking-[0.3em]">
                                                    Reproducir presentación
                                                </p>
                                                <p className="text-slate-300 text-sm mt-3 max-w-sm">
                                                    Dale play para ver la energía del grupo en una pieza más inmersiva.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-3 mt-3">
                                    {[
                                        { label: 'Ambiente', value: '10/10' },
                                        { label: 'Energía', value: 'Alta' },
                                        { label: 'Impacto', value: 'Premium' },
                                    ].map((item) => (
                                        <div key={item.label} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-center">
                                            <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400">{item.label}</p>
                                            <p className="text-white font-serif text-lg mt-1">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            <SectionDivider tone="green" />

            <section className="relative py-32 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/Mariachis 10.jpeg"

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
                            onClick={() => navigate('/register')}
                            className="px-12 py-5 bg-[#ce1126] hover:bg-[#a80b1e] text-white rounded-full font-bold text-sm tracking-[0.25em] uppercase shadow-[0_0_40px_rgba(206,17,38,0.4)] hover:shadow-[0_0_60px_rgba(206,17,38,0.6)] transition-all transform hover:-translate-y-1"
                        >
                            Reservar Fecha
                        </button>
                        <button className="px-12 py-5 bg-white/5 border border-white/30 hover:bg-white/10 text-white rounded-full font-bold text-sm tracking-[0.25em] uppercase transition-all flex items-center justify-center gap-3 backdrop-blur-sm">
                            <Phone size={16} /> 312 2373486
                        </button>
                    </div>
                </motion.div>
            </section>

            {/* --- FOOTER COMPONENT --- */}
            <Footer scrollToSection={scrollToSection} />

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


            {/* --- LIGHTBOX MODAL --- */}
            {lightboxOpen && dynamicGallery.length > 0 && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center"
                    onClick={closeLightbox}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/95 backdrop-blur-xl"
                    />

                    {/* Close Button */}
                    <button
                        onClick={closeLightbox}
                        className="absolute top-6 right-6 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-300 hover:rotate-90 border border-white/20"
                    >
                        <X size={24} />
                    </button>

                    {/* Image Counter */}
                    <div className="absolute top-6 left-6 z-50 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-sm font-bold border border-white/20">
                        {lightboxIndex + 1} / {dynamicGallery.length}
                    </div>

                    {/* Previous Arrow */}
                    {dynamicGallery.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                            className="absolute left-4 md:left-8 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-300 border border-white/20 hover:scale-110"
                        >
                            <ChevronLeft size={28} />
                        </button>
                    )}

                    {/* Next Arrow */}
                    {dynamicGallery.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); goToNext(); }}
                            className="absolute right-4 md:right-8 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-300 border border-white/20 hover:scale-110"
                        >
                            <ChevronRight size={28} />
                        </button>
                    )}

                    {/* Main Image */}
                    <motion.div
                        key={lightboxIndex}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="relative z-40 max-w-[90vw] max-h-[85vh] flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={dynamicGallery[lightboxIndex]}
                            alt={`Galería ${lightboxIndex + 1}`}
                            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.8)] border border-white/10"
                        />
                    </motion.div>
                </div>
            )}

        </div>
    );
};
