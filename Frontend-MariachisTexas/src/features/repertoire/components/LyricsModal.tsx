import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Music, ZoomIn, ZoomOut, Type, AlignLeft,
  Play, Pause, Volume2, VolumeX,
  ChevronUp, ChevronDown, RotateCcw,
} from 'lucide-react';
import { Song } from '@/types';

{/*propiedades de la vista de letra*/}
interface Props {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
{/*convierte el tiempo en formato HH:MM*/}
const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

// ─── Componente ───────────────────────────────────────────────────────────────
export const LyricsModal: React.FC<Props> = ({ isOpen, onClose, song }) => {
  // Tamaño de la fuente de la letra
  const [fontSize,      setFontSize]      = useState(20);
  // Línea activa de la letra
  const [activeLine,    setActiveLine]    = useState(0);
  // Indica si la letra está siendo reproducida
  const [isPlaying,     setIsPlaying]     = useState(false);
  // Indica si el audio está en silencio
  const [isMuted,       setIsMuted]       = useState(false);
  // Controla el volumen del audio (0 a 1)
  const [volume,        setVolume]        = useState(1);
  // Tiempo actual de reproducción del audio
  const [currentTime,   setCurrentTime]   = useState(0);
  // Duración total del audio
  const [duration,      setDuration]      = useState(0);
  // Referencia al elemento de audio (para play, pause, etc.)
  const audioRef    = useRef<HTMLAudioElement>(null);
  // Referencias a cada línea de la letra (para hacer scroll o resaltar)
  const lineRefs    = useRef<(HTMLDivElement | null)[]>([]);
  // Referencia al contenedor de las letras (para controlar scroll)
  const containerRef = useRef<HTMLDivElement>(null);

  // Partir letra en líneas (ignorar líneas vacías dobles)
  const lines = song?.lyrics
    ? song.lyrics.split('\n').map(l => l.trim())
    : [];

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setActiveLine(0);
      setIsPlaying(false);
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [isOpen, song]);

  // Scroll automático a la línea activa
  useEffect(() => {
    const el = lineRefs.current[activeLine];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLine]);

  // Teclado: espacio = avanzar, shift+espacio = retroceder
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (e.shiftKey) {
          setActiveLine(prev => Math.max(0, prev - 1));
        } else {
          setActiveLine(prev => Math.min(lines.length - 1, prev + 1));
        }
      }
      if (e.code === 'ArrowUp')   { e.preventDefault(); setActiveLine(prev => Math.max(0, prev - 1)); }
      if (e.code === 'ArrowDown') { e.preventDefault(); setActiveLine(prev => Math.min(lines.length - 1, prev + 1)); }
      if (e.code === 'KeyR')      { setActiveLine(0); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, lines.length]);


  // Toma el tiempo actual del audio
  const onTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

//Guarda la duración total del audio cuando ya cargó.
  const onLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };
  const onEnded = () => setIsPlaying(false);

// Activa o desactiva la reproducción del audio
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(prev => !prev);
  }, [isPlaying]);

//Activa o desactiva el silencio
  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(prev => !prev);
  };

  //Permite adelantar o retroceder el audio (como una barra de progreso).
  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = t;
    setCurrentTime(t);
  };

//Permite cambiar el volumen del audio (como una barra de progreso).
  const onVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (audioRef.current) audioRef.current.volume = v;
    setVolume(v);
  };

//Reinicia la letra al inicio
  const resetKaraoke = () => setActiveLine(0);

  if (!isOpen || !song) return null;

  const hasAudio = !!song.audioUrl;
  const hasLyrics = lines.length > 0 && lines.some(l => l.length > 0);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/95 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Contenedor principal de la letra */}
      <div className="relative w-full max-w-2xl flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{ height: '90vh', background: '#0f0f14', border: '1px solid rgba(255,255,255,0.07)' }}
      >

        {/* ── Parte superior de la letra ── */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(232,184,75,0.12)', border: '1px solid rgba(232,184,75,0.2)' }}
            >
              <Music size={16} style={{ color: '#E8B84B' }} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm truncate" style={{ color: '#F5DFA0', fontFamily: 'Georgia, serif' }}>
                {song.title}
              </p>
              <p className="text-xs truncate" style={{ color: '#6B5232', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {song.artist}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Tamaño de fuente */}
            <div className="hidden sm:flex items-center gap-1 rounded-lg px-2 py-1"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <button onClick={() => setFontSize(p => Math.max(14, p - 2))}
                className="p-1 rounded transition-colors hover:bg-white/10"
                style={{ color: '#6B7280' }}
              >
                <ZoomOut size={15} />
              </button>
              <div className="flex items-center gap-1 w-10 justify-center">
                <Type size={11} style={{ color: '#6B7280' }} />
                <span className="text-xs font-bold" style={{ color: '#9CA3AF' }}>{fontSize}</span>
              </div>
              <button onClick={() => setFontSize(p => Math.min(48, p + 2))}
                className="p-1 rounded transition-colors hover:bg-white/10"
                style={{ color: '#6B7280' }}
              >
                <ZoomIn size={15} />
              </button>
            </div>

            {/* Reiniciar karaoke */}
            <button onClick={resetKaraoke}
              className="p-2 rounded-xl transition-colors hover:bg-white/10"
              style={{ color: '#6B7280' }}
              title="Reiniciar (R)"
            >
              <RotateCcw size={16} />
            </button>

            {/* Cerrar */}
            <button onClick={onClose}
              className="p-2 rounded-xl transition-all hover:bg-white/10"
              style={{ color: '#6B7280' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Letra ── */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto py-10 px-6"
          style={{ scrollBehavior: 'smooth' }}
        >
          {hasLyrics ? (
            <div className="max-w-xl mx-auto space-y-1 text-center">
              {/* Indicador de línea activa */}
              <div className="mb-8 flex items-center justify-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(232,184,75,0.12)', color: '#E8B84B', border: '1px solid rgba(232,184,75,0.2)' }}
                >
                  {activeLine + 1} / {lines.filter(l => l).length}
                </span>
                <span className="text-xs" style={{ color: '#4B3A20' }}>
                  Espacio para avanzar · Shift+Espacio para retroceder
                </span>
              </div>

              {lines.map((line, i) => {
                const isEmpty = line.trim() === '';
                const isActive = i === activeLine && !isEmpty;
                const isPast   = i < activeLine && !isEmpty;
                const isFuture = i > activeLine && !isEmpty;

                if (isEmpty) return <div key={i} className="h-5" />;

                return (
                  <div
                    key={i}
                    ref={el => { lineRefs.current[i] = el; }}
                    onClick={() => setActiveLine(i)}
                    className="cursor-pointer rounded-xl px-4 py-2 transition-all duration-300 select-none"
                    style={{
                      fontSize:      `${isActive ? fontSize + 2 : fontSize - 2}px`,
                      fontFamily:    'Georgia, serif',
                      lineHeight:    '1.7',
                      fontWeight:    isActive ? '700' : '400',
                      color:         isActive ? '#F5DFA0' : isPast ? '#3A2A12' : '#5A4220',
                      background:    isActive ? 'rgba(232,184,75,0.08)' : 'transparent',
                      border:        isActive ? '1px solid rgba(232,184,75,0.15)' : '1px solid transparent',
                      transform:     isActive ? 'scale(1.02)' : 'scale(1)',
                      opacity:       isFuture ? 0.4 : isPast ? 0.25 : 1,
                      letterSpacing: isActive ? '0.01em' : '0',
                      textShadow:    isActive ? '0 0 40px rgba(232,184,75,0.3)' : 'none',
                      transition:    'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {line}
                  </div>
                );
              })}

              <div className="h-24" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <AlignLeft size={48} style={{ color: '#2A1F0E', marginBottom: '16px' }} />
              <p className="font-medium" style={{ color: '#4A3520', fontFamily: 'Georgia, serif' }}>
                No hay letra registrada para esta canción.
              </p>
            </div>
          )}
        </div>

        {/* ── Botones avance (fijos sobre el player) ── */}
        <div className="flex-shrink-0 flex items-center justify-center gap-3 py-3 px-6"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <button
            onClick={() => setActiveLine(p => Math.max(0, p - 1))}
            disabled={activeLine === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-25"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#7A6040', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <ChevronUp size={14} /> Anterior
          </button>
          <button
            onClick={() => setActiveLine(p => Math.min(lines.length - 1, p + 1))}
            disabled={activeLine >= lines.length - 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-25"
            style={{ background: 'rgba(232,184,75,0.10)', color: '#E8B84B', border: '1px solid rgba(232,184,75,0.2)' }}
          >
            Siguiente <ChevronDown size={14} />
          </button>
        </div>

        {/* ── Reproductor de audio ── */}
        {hasAudio && (
          <>
            <audio
              ref={audioRef}
              src={song.audioUrl}
              onTimeUpdate={onTimeUpdate}
              onLoadedMetadata={onLoadedMetadata}
              onEnded={onEnded}
            />
            <div className="flex-shrink-0 px-5 py-4"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}
            >
              {/* Barra de progreso */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-mono flex-shrink-0" style={{ color: '#6B5232', minWidth: '36px' }}>
                  {formatTime(currentTime)}
                </span>
                <div className="relative flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all"
                    style={{
                      width: duration ? `${(currentTime / duration) * 100}%` : '0%',
                      background: 'linear-gradient(90deg, #C8922A, #E8B84B)',
                    }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.1}
                    value={currentTime}
                    onChange={onSeek}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ margin: 0 }}
                  />
                </div>
                <span className="text-xs font-mono flex-shrink-0" style={{ color: '#6B5232', minWidth: '36px', textAlign: 'right' }}>
                  {formatTime(duration)}
                </span>
              </div>

              {/* Controles */}
              <div className="flex items-center justify-between">
                {/* Volumen */}
                <div className="flex items-center gap-2">
                  <button onClick={toggleMute} className="p-1.5 rounded-lg transition-colors hover:bg-white/10" style={{ color: '#6B5232' }}>
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={onVolumeChange}
                    className="w-20 h-1 rounded-full cursor-pointer accent-amber-500"
                  />
                </div>

                {/* Play / Pause */}
                <button
                  onClick={togglePlay}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #C8922A, #E8B84B)',
                    boxShadow: '0 4px 20px rgba(200,146,42,0.35)',
                  }}
                >
                  {isPlaying
                    ? <Pause size={18} fill="#1C1208" color="#1C1208" />
                    : <Play  size={18} fill="#1C1208" color="#1C1208" style={{ marginLeft: '2px' }} />
                  }
                </button>

                
                <div className="w-28" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};