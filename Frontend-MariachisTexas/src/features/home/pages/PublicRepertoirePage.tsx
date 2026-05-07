import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Clock, Search, Music, Heart, Mic2, Sparkles, Volume2, SkipBack, SkipForward, VolumeX, X } from 'lucide-react';
import { repertoireService } from '../../repertoire/services/repertoireService';
import { Song } from '@/types';
import { motion, AnimatePresence } from "motion/react";
import toast from 'react-hot-toast';


const Equalizer = () => (
<div className="flex items-end gap-[2px] h-4 w-4">
    <motion.div animate={{ height: [4, 12, 6, 14, 4] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-[#1ed760] rounded-t-sm" />
    <motion.div animate={{ height: [10, 4, 14, 6, 10] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-[#1ed760] rounded-t-sm" />
    <motion.div animate={{ height: [6, 14, 4, 12, 6] }} transition={{ repeat: Infinity, duration: 0.9 }} className="w-1 bg-[#1ed760] rounded-t-sm" />
</div>
);

export const PublicRepertoirePage: React.FC = () => {
const [songs, setSongs] = useState<Song[]>([]);
const [loading, setLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState('');
const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Audio State
const [currentSong, setCurrentSong] = useState<Song | null>(null);
const [isPlaying, setIsPlaying] = useState(false);
const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);
const [volume, setVolume] = useState(0.7);
const [isMuted, setIsMuted] = useState(false);

const audioRef = useRef<HTMLAudioElement | null>(null);
const [hoveredRow, setHoveredRow] = useState<string | null>(null);
const [lyricsSong, setLyricsSong] = useState<Song | null>(null);

useEffect(() => {
    const fetchSongs = async () => {
    try {
        // ✅ getSongsPublic — solo trae canciones activas, no requiere token
        const data = await repertoireService.getSongsPublic();
        setSongs(data);
    } catch (error) {
        console.error("Error loading songs", error);
    } finally {
        setLoading(false);
    }
    };
    fetchSongs();

    return () => {
    if (audioRef.current) {
        audioRef.current.pause();
    }
    };
}, []);

  // Initialize Audio Object
useEffect(() => {
    if (!audioRef.current) {
    audioRef.current = new Audio();
    }
    
    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => playNext();

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
    audio.removeEventListener('timeupdate', handleTimeUpdate);
    audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    audio.removeEventListener('ended', handleEnded);
    };
}, [songs, currentSong]);

  // Handle Play/Pause Logic
const togglePlay = (song: Song) => {
    if (!audioRef.current) return;

    if (currentSong?.id === song.id) {
    if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
    } else {
        audioRef.current.play().catch(e => console.error("Play error:", e));
        setIsPlaying(true);
    }
    } else {
    if (song.audioUrl) {
        audioRef.current.src = song.audioUrl;
        audioRef.current.volume = volume;
        audioRef.current.play().catch(e => console.error("Play error:", e));
        setCurrentSong(song);
        setIsPlaying(true);
    } else {
        toast.error("Audio no disponible para esta canción", {
        style: { background: '#333', color: '#fff' },
        });
    }
    }
};

const playNext = () => {
    if (!currentSong) return;
    const currentIndex = filteredSongs.findIndex(s => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % filteredSongs.length;
    togglePlay(filteredSongs[nextIndex]);
};

const playPrevious = () => {
    if (!currentSong) return;
    const currentIndex = filteredSongs.findIndex(s => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + filteredSongs.length) % filteredSongs.length;
    togglePlay(filteredSongs[prevIndex]);
};

const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
    }
};

const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) audioRef.current.volume = vol;
    setIsMuted(vol === 0);
};

const toggleMute = () => {
    if (audioRef.current) {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.volume = newMuted ? 0 : volume;
    }
};

const closePlayer = () => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
    setCurrentSong(null);
};

const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const categories = ['Todos', 'Ranchera', 'Bolero', 'Son', 'Corrido', 'Huapango', 'Boda', 'Cumpleaños'];

const filteredSongs = songs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    song.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || 
                            song.genre.includes(selectedCategory) || 
                            song.category.includes(selectedCategory);
    return matchesSearch && matchesCategory;
});

return (
    <div className="min-h-screen bg-[#121212] text-white font-sans pb-32">

      {/* Hero */}
    <div className="relative overflow-hidden bg-[#121212] pt-32 pb-12 px-8">
        <div className="absolute inset-0 z-0">
        <img src="/images/Fiesta.jpg" className="w-full h-full object-cover opacity-20 blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#121212]/80 to-[#121212]"></div>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-end gap-8 max-w-7xl mx-auto">
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-52 h-52 md:w-64 md:h-64 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex-shrink-0 rounded-xl overflow-hidden group"
        >
            <img src="/images/Mariachis 10.jpeg" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        </motion.div>
        
        <div className="flex flex-col gap-2 mb-2 flex-1 items-start text-left">
            <span className="text-[#f1bf00] font-bold tracking-widest text-xs uppercase mb-1 flex items-center gap-2">
            <Sparkles size={14} /> Lista Oficial
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white drop-shadow-xl mb-4">
            REPERTORIO
            </h1>
            <div className="text-white/80 text-sm md:text-base font-medium flex flex-wrap items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#ce1126] flex items-center justify-center text-white font-bold text-[10px]">M</span>
            <span className="hover:underline cursor-pointer text-white font-bold">Mariachis Texas Medellín</span>
            <span className="w-1 h-1 rounded-full bg-white/50"></span>
            <span>{songs.length} canciones</span>
            <span className="w-1 h-1 rounded-full bg-white/50"></span>
            <span className="text-[#009c3b]">Rancheras</span>, <span className="text-white">Boleros</span> y <span className="text-[#ce1126]">Más</span>
            </div>
        </div>
        </div>
    </div>

      {/* Controls & Filters */}
    <div className="sticky top-0 z-30 bg-[#121212]/95 backdrop-blur-xl border-b border-white/5 shadow-lg">
        <div className="max-w-7xl mx-auto px-8 py-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
            <button 
                onClick={() => filteredSongs.length > 0 && togglePlay(filteredSongs[0])}
                className="w-14 h-14 rounded-full bg-[#ce1126] hover:bg-[#e01229] text-white flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-black/40"
            >
                {isPlaying ? <Pause size={28} className="fill-white" /> : <Play size={28} className="ml-1 fill-white" />}
            </button>
            </div>
            
            <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={18} />
            <input 
                type="text" 
                placeholder="Buscar título o artista..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors text-white rounded-full py-2.5 pl-10 pr-4 w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-white/50 text-sm"
            />
            </div>
        </div>

          {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
            <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all whitespace-nowrap ${
                selectedCategory === cat ? 'bg-white text-black' : 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]'
                }`}
            >
                {cat}
            </button>
            ))}
        </div>
        </div>
    </div>

      {/* Song List */}
    <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 text-xs text-white/50 uppercase tracking-wider font-medium border-b border-white/10 pb-2 mb-4 px-4">
        <div className="w-8 text-center">#</div>
        <div>Título</div>
        <div className="hidden md:block">Categoría</div>
        <div className="hidden lg:block">Género</div>
        <div className="w-12 text-center"><Clock size={16} /></div>
        </div>

        <div className="space-y-1">
        {loading ? (
            <div className="text-center py-20 text-white/50 flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-[#1ed760] border-t-transparent rounded-full animate-spin"></div>
            Cargando repertorio...
            </div>
        ) : filteredSongs.length === 0 ? (
            <div className="text-center py-20 text-white/30 flex flex-col items-center gap-4">
            <Music size={48} className="opacity-30" />
            <p>No se encontraron canciones.</p>
            </div>
        ) : filteredSongs.map((song, index) => (
            <motion.div 
            key={song.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            onMouseEnter={() => setHoveredRow(song.id)}
            onMouseLeave={() => setHoveredRow(null)}
            className={`grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 items-center p-3 rounded-md hover:bg-white/10 transition-colors group cursor-pointer ${currentSong?.id === song.id ? 'bg-white/10' : ''}`}
            onClick={() => togglePlay(song)}
            >
            <div className="w-8 text-center text-white/50 font-medium relative flex items-center justify-center min-h-[20px]">
                {currentSong?.id === song.id && isPlaying ? (
                <Equalizer />
                ) : hoveredRow === song.id ? (
                <Play size={16} className="text-white fill-white" />
                ) : (
                <span className={`text-sm ${currentSong?.id === song.id ? 'text-[#1ed760]' : ''}`}>{index + 1}</span>
                )}
            </div>
            
            <div className="flex items-center gap-4 overflow-hidden">
                {song.coverImage ? (
                <img src={song.coverImage} alt={song.title} className="w-10 h-10 rounded shadow-md object-cover" />
                ) : (
                <div className="w-10 h-10 bg-[#282828] rounded flex items-center justify-center text-white/30 group-hover:bg-[#383838] transition-colors">
                    <Music size={20} />
                </div>
                )}
                <div className="flex flex-col truncate">
                    <span className={`font-medium truncate text-sm md:text-base ${currentSong?.id === song.id ? 'text-[#1ed760]' : 'text-white'}`}>{song.title}</span>
                    <span className="text-xs md:text-sm text-white/60 truncate group-hover:text-white transition-colors">{song.artist}</span>
                </div>
            </div>

            <div className="hidden md:flex items-center text-sm text-white/50 group-hover:text-white transition-colors truncate">
                {song.category}
            </div>

            <div className="hidden lg:flex items-center text-sm text-white/50 group-hover:text-white transition-colors truncate">
                {song.genre}
            </div>

            <div className="w-12 text-center text-sm text-white/50 tabular-nums flex items-center justify-center gap-3">
                {hoveredRow === song.id && (
                <>
                    <button
                    onClick={(e) => { e.stopPropagation(); setLyricsSong(song); }}
                    className="hover:text-[#1ed760] transition-colors" title="Ver Letra"
                    >
                    <Mic2 size={16} />
                    </button>
                    <Heart size={16} className="hover:text-[#1ed760] hover:fill-[#1ed760] transition-colors cursor-pointer" />
                </>
                )}
                <span>{song.duration}</span>
            </div>
            </motion.div>
        ))}
        </div>
    </div>



      {/* Lyrics Modal */}
    <AnimatePresence>
        {lyricsSong && (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setLyricsSong(null)}
        >
            <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-[#1e1e1e] rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl border border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            >
            <div className="p-6 border-b border-white/10 flex justify-between items-start bg-[#252525]">
                <div className="flex items-center gap-4">
                {lyricsSong.coverImage ? (
                    <img src={lyricsSong.coverImage} alt={lyricsSong.title} className="w-16 h-16 rounded-lg object-cover shadow-md" />
                ) : (
                    <div className="w-16 h-16 bg-[#333] rounded-lg flex items-center justify-center text-white/30">
                    <Music size={24} />
                    </div>
                )}
                <div>
                    <h3 className="text-2xl font-bold text-white leading-tight">{lyricsSong.title}</h3>
                    <p className="text-white/60 text-sm font-medium">{lyricsSong.artist}</p>
                </div>
                </div>
                <button onClick={() => setLyricsSong(null)} className="text-white/40 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                <X size={24} />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#121212]">
                <div className="text-center max-w-lg mx-auto">
                {lyricsSong.lyrics ? (
                    <p className="whitespace-pre-line text-lg leading-relaxed text-slate-300 font-medium">
                    {lyricsSong.lyrics}
                    </p>
                ) : (
                    <div className="py-12 flex flex-col items-center text-white/30 gap-4">
                    <Mic2 size={48} className="opacity-50" />
                    <p>Letra no disponible para esta canción.</p>
                    </div>
                )}
                </div>
            </div>
            </motion.div>
        </motion.div>
        )}
    </AnimatePresence>



    <AnimatePresence>
        {currentSong && (
        <motion.div 
            initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 bg-[#181818] border-t border-[#282828] p-4 flex items-center justify-between z-50 shadow-2xl"
        >
            {/* Info Track */}
            <div className="flex items-center gap-4 w-full md:w-1/3 min-w-0">
            {currentSong.coverImage ? (
                <img src={currentSong.coverImage} alt={currentSong.title} className="w-14 h-14 rounded shadow-lg object-cover" />
            ) : (
                <div className="w-14 h-14 bg-[#282828] rounded flex items-center justify-center text-white/30">
                <Music size={24} />
                </div>
            )}
            <div className="flex flex-col min-w-0">
                <span className="text-white font-medium text-sm truncate">{currentSong.title}</span>
                <span className="text-white/60 text-xs truncate">{currentSong.artist}</span>
            </div>
            <button onClick={closePlayer} className="text-white/50 hover:text-white ml-4 hidden sm:block">
                <X size={20} />
            </button>
            </div>


            <div className="flex flex-col items-center gap-2 w-full md:w-1/3">
            <div className="flex items-center gap-6">
                <button onClick={playPrevious} className="text-white/70 hover:text-white hover:scale-110 transition-transform">
                <SkipBack size={20} className="fill-current" />
                </button>
                <button 
                onClick={() => togglePlay(currentSong)}
                className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                >
                {isPlaying ? <Pause size={16} className="fill-black" /> : <Play size={16} className="fill-black ml-0.5" />}
                </button>
                <button onClick={playNext} className="text-white/70 hover:text-white hover:scale-110 transition-transform">
                <SkipForward size={20} className="fill-current" />
                </button>
            </div>
            
            <div className="w-full flex items-center gap-2 text-xs text-white/50 tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <div className="relative flex-1 h-1 bg-[#4d4d4d] rounded-full group cursor-pointer">
                <div className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                    <input type="range" min={0} max={duration || 100} value={currentTime} onChange={handleSeek} className="w-full h-full opacity-0 cursor-pointer" />
                </div>
                  <div className="h-full bg-white rounded-full relative group-hover:bg-[#1ed760] transition-colors" style={{ width: `${(currentTime / duration) * 100}%` }}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-md"></div>
                </div>
                </div>
                <span>{formatTime(duration)}</span>
            </div>
            </div>

            {/* Volume */}
            <div className="hidden md:flex items-center justify-end gap-2 w-1/3 text-white/70">
            <button onClick={toggleMute}>
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
        <div className="w-24 h-1 bg-[#4d4d4d] rounded-full relative group">
                <input type="range" min={0} max={1} step={0.01} value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="h-full bg-white rounded-full group-hover:bg-[#1ed760] transition-colors" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}></div>
            </div>
            </div>
        </motion.div>
        )}
    </AnimatePresence>
    </div>
);
};