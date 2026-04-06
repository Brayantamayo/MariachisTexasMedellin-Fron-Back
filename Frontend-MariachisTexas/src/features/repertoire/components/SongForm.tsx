import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Music, User, List, Tag, AlignLeft,
  Image as ImageIcon, UploadCloud, PlayCircle, StopCircle,
  Trash2, Loader2, AlertCircle, CheckCircle2, Search, Sparkles, ExternalLink
} from 'lucide-react';
import { uploadImage, uploadAudio } from '@/shared/services/uploadService';
import { repertoireService, SpotifySong } from '@/src/features/repertoire/services/repertoireService';
import { TIPOS_EVENTO } from '@/types';

{/*interface sirve para validar los campos de la interfaz de usuario*/}
export interface SongFormErrors {
  title?:    string;
  artist?:   string;
  genre?:    string;
  category?: string;
  duration?: string;
}

{/*interface sirve para manejar los datos del formulario*/}
interface Props {
  formData:         any;
  onChange:         (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onFieldChange:    (field: string, value: any) => void;
  onSubmit:         (e: React.FormEvent) => void;
  errors?:          SongFormErrors;
  registerFieldRef?: (field: string, el: HTMLElement | null) => void;
}

{/*componente de formulario para crear una canción*/}
export const SongForm: React.FC<Props> = ({
  formData, onChange, onFieldChange, onSubmit, errors = {} as SongFormErrors, registerFieldRef
}) => {
  {/*Este componente se encarga de manejar un formulario de canciones, 
    permitiendo al usuario ingresar y editar información de manera dinámica. Además, 
    incluye funcionalidades para subir tanto imágenes como archivos de audio, 
    mostrando en tiempo real el progreso de cada carga. Integra también un sistema de búsqueda de 
    canciones similar a Spotify, facilitando la selección de música, y permite controlar la reproducción de 
    previews de audio. Por último, gestiona adecuadamente los errores y estados del formulario para ofrecer 
    una experiencia más fluida y controlada al usuario.*/}

  {/*se usan para manejar la subida de imágenes y audio*/}
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const audioRef      = useRef<HTMLAudioElement | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const genreInputRef = useRef<HTMLInputElement>(null);

  {/*se usan para mostrar el progreso de la subida de imágenes y audio*/}
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [imageProgress,  setImageProgress]  = useState(0);
  const [audioProgress,  setAudioProgress]  = useState(0);
  const [uploadError,    setUploadError]     = useState<string | null>(null);

  // ─── Spotify ──────────────────────────────────────────────────────────────
  const [spotifyQuery,   setSpotifyQuery]   = useState('');
  const [spotifyResults, setSpotifyResults] = useState<SpotifySong[]>([]);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyError,   setSpotifyError]   = useState<string | null>(null);
  const [playingId,      setPlayingId]      = useState<string | null>(null);
  const [showResults,    setShowResults]    = useState(false);

  // ─── Buscar en Spotify no busqueda inmediata despues de 500ms de dejar de escribir se busca ──────────────────────────────────
  useEffect(() => {
    if (spotifyQuery.trim().length < 2) {
      setSpotifyResults([])
      setShowResults(false)
      return
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      setSpotifyLoading(true)
      setSpotifyError(null)
      try {
        const results = await repertoireService.searchSpotify(spotifyQuery, 8)
        setSpotifyResults(results)
        setShowResults(true)
      } catch {
        setSpotifyError('Error al buscar en Spotify')
      } finally {
        setSpotifyLoading(false)
      }
    }, 500)
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
  }, [spotifyQuery])

// ─── Reproducir preview 30s ───────────────────────────────────────────────
  const togglePreview = useCallback((song: SpotifySong) => {
    if (!song.previewUrl) return
    if (playingId === song.spotifyId) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    const audio = new Audio(song.previewUrl)
    audioRef.current  = audio
    audio.volume      = 0.7
    audio.play().catch(() => {})
    audio.onended     = () => setPlayingId(null)
    setPlayingId(song.spotifyId)
  }, [playingId])

  useEffect(() => () => { audioRef.current?.pause() }, [])

// ─── Seleccionar canción  llenara automaticamente todos estos campos  ────────────────────────
  const handleSelectSpotify = (song: SpotifySong) => {
    if (playingId === song.spotifyId) {
      audioRef.current?.pause()
      setPlayingId(null)
    }
    onFieldChange('title',      song.title)
    onFieldChange('artist',     song.artist)
    onFieldChange('duration',   song.duration)
    onFieldChange('coverImage', song.coverImage  ?? '')
    onFieldChange('audioUrl',   song.previewUrl  ?? '')
    onFieldChange('genre',      '')
    setSpotifyQuery('')
    setSpotifyResults([])
    setShowResults(false)
    setTimeout(() => genreInputRef.current?.focus(), 100)
  }

// ─── subir imagen ─────────────────────────────────────────────────────────
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null); setUploadingImage(true)
    try {
      onFieldChange('coverImage', await uploadImage(file, 'repertorio/portadas', setImageProgress))
    } catch (err: any) {
      setUploadError(err.message || 'Error al subir la imagen.')
    } finally {
      setUploadingImage(false); setImageProgress(0)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }


// ─── Subir audio ──────────────────────────────────────────────────────────
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null); setUploadingAudio(true)
    try {
      onFieldChange('audioUrl', await uploadAudio(file, setAudioProgress))
    } catch (err: any) {
      setUploadError(err.message || 'Error al subir el audio.')
    } finally {
      setUploadingAudio(false); setAudioProgress(0)
      if (audioInputRef.current) audioInputRef.current.value = ''
    }
  }

  return (
    <form id="song-form" onSubmit={onSubmit} className="flex flex-col md:flex-row h-full gap-6">


      {/* ── Columna izuqierada de el formulario : Portada  ──────────────────────────────────── */}
      <div className="w-full md:w-[35%] flex flex-col gap-3">
        <label className="label-form">PORTADA DEL ÁLBUM</label>
        <input type="file" ref={imageInputRef} onChange={handleImageUpload}
          accept="image/jpeg,image/png,image/webp" className="hidden" />
        <div
          onClick={() => !uploadingImage && imageInputRef.current?.click()}
          className={`relative aspect-square rounded-[2rem] overflow-hidden bg-slate-50 border-2 border-dashed border-slate-200 transition-all group
            ${uploadingImage ? 'cursor-wait opacity-70' : 'cursor-pointer hover:border-red-200 hover:bg-slate-50/80'}`}
        >
          {uploadingImage ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 size={36} className="animate-spin text-red-400" />
              <span className="text-xs font-bold text-slate-500">{imageProgress}%</span>
              <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-400 rounded-full transition-all duration-300" style={{ width: `${imageProgress}%` }} />
              </div>
            </div>
          ) : formData.coverImage ? (
            <>
              <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-bold text-xs uppercase tracking-widest border border-white/50 px-4 py-2 rounded-full backdrop-blur-sm">
                  Cambiar Imagen
                </span>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-2">
              <ImageIcon size={56} className="opacity-40" strokeWidth={1.5} />
              <span className="text-sm font-medium text-slate-400">Subir Imagen</span>
              <span className="text-[10px] text-slate-400">JPG, PNG, WEBP · Máx 5MB</span>
            </div>
          )}
        </div>

        {/*se muestra cuando se carga la imagen y se quita cuando se cambia*/}
        {formData.coverImage && !uploadingImage && (
          <button type="button" onClick={() => onFieldChange('coverImage', '')}
            className="text-xs text-red-400 hover:text-red-600 flex items-center justify-center gap-1 transition-colors">
            <Trash2 size={12} /> Quitar imagen
          </button>
        )}
        {uploadError && (
          <div className="flex items-center gap-2 text-red-500 text-xs font-medium bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <AlertCircle size={14} className="flex-shrink-0" /> {uploadError}
          </div>
        )}
      </div>

      {/* ── columna derecha: Datos ──────────────────────────────────── */}
      <div className="w-full md:w-[65%] space-y-5">

        {/* Buscador Spotify */}
        <div>
          <label className="label-form flex items-center gap-2">
            <Sparkles size={12} className="text-green-500" />
            BUSCAR CANCION
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
            {spotifyLoading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 animate-spin" size={16} />
            )}
            <input
              type="text"
              value={spotifyQuery}
              onChange={e => setSpotifyQuery(e.target.value)}
              placeholder="Escribe el nombre de la canción o artista..."
              className="input-form border-green-200 focus:border-green-400"
            />

            {/* mostrar una lista desplegable de las canciones encontradas  */}
            {showResults && spotifyResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[420px] overflow-y-auto">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {spotifyResults.length} resultados · Click para seleccionar · ▶ para escuchar
                  </span>
                  <button type="button" onClick={() => setShowResults(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
                </div>
                {/* mostrar las canciones encontradas */}
                {spotifyResults.map(song => (
                  <div key={song.spotifyId}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer"
                    onClick={() => handleSelectSpotify(song)}
                  >

                    {/* mostrar la imagen de la cancion */}
                    {song.coverImage
                      ? <img src={song.coverImage} alt={song.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                      : <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0"><Music size={16} className="text-slate-400" /></div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{song.title}</p>
                      <p className="text-xs text-slate-500 truncate">{song.artist}</p>
                      <p className="text-[10px] text-slate-400 truncate">{song.album} · {song.duration}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>

                      {/* mostrar el boton de la cancion */}
                      {song.previewUrl ? (
                        <button type="button" onClick={() => togglePreview(song)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            playingId === song.spotifyId
                              ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                              : 'bg-slate-100 text-slate-500 hover:bg-green-100 hover:text-green-600'
                          }`}
                          title={playingId === song.spotifyId ? 'Pausar' : 'Preview 30s'}>
                          {playingId === song.spotifyId ? <StopCircle size={16} /> : <PlayCircle size={16} />}
                        </button>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center" title="Sin preview">
                          <Music size={14} className="text-slate-300" />
                        </div>
                      )}

                      {/* mostrar el boton de abrir en spotify */}
                      <a href={song.externalUrl} target="_blank" rel="noreferrer"
                        className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
                        title="Abrir en Spotify">
                        <ExternalLink size={13} />
                      </a>
                      <button type="button" onClick={() => handleSelectSpotify(song)}
                        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold uppercase rounded-lg transition-colors">
                        Usar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {spotifyError && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} /> {spotifyError}
              </p>
            )}
          </div>
        </div>

        {/* Título */}
        <div>
          <label className="label-form">TÍTULO DE LA CANCIÓN <span className="text-red-500">*</span></label>
          <div className="relative group">
            <Music className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-400 transition-colors pointer-events-none" size={18} />
            <input
              type="text" name="title" value={formData.title} onChange={onChange}
              maxLength={100} placeholder="Ej: El Rey"
              ref={el => registerFieldRef?.('title', el)}
              className={`input-form font-bold text-slate-700 transition-all duration-200 ${
                errors.title
                  ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100 ring-2 ring-red-100'
                  : ''
              }`}
            />
          </div>
          {errors.title && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1 animate-pulse">
              <AlertCircle size={12}/>{errors.title}
            </p>
          )}
        </div>

        {/* Artista + Género */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label-form">ARTISTA ORIGINAL <span className="text-red-500">*</span></label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-400 transition-colors pointer-events-none" size={18} />
              <input
                type="text" name="artist" value={formData.artist} onChange={onChange}
                maxLength={80} placeholder="Ej: José Alfredo Jiménez"
                ref={el => registerFieldRef?.('artist', el)}
                className={`input-form transition-all duration-200 ${
                  errors.artist
                    ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100 ring-2 ring-red-100'
                    : ''
                }`}
              />
            </div>

            {/* Errores de validación */}
            {errors.artist && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1 animate-pulse">
                <AlertCircle size={12}/>{errors.artist}
              </p>
            )}
          </div>

          {/* Género */}
          <div>
            <label className="label-form">GÉNERO MUSICAL <span className="text-red-500">*</span></label>
            <div className="relative group">
              <List className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-400 transition-colors pointer-events-none" size={18} />
              <input
                ref={el => { genreInputRef.current = el; registerFieldRef?.('genre', el); }}
                type="text"
                name="genre"
                value={formData.genre}
                onChange={onChange}
                maxLength={50}
                placeholder="Ej: Ranchera, Bolero, Pop..."
                className={`input-form transition-all duration-200 ${
                  errors.genre
                    ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100 ring-2 ring-red-100'
                    : ''
                }`}
              />
            </div>

            {errors.genre && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1 animate-pulse">
                <AlertCircle size={12}/>{errors.genre}
              </p>
            )}
          </div>
        </div>

        {/* Categoría */}
        <div>
          <label className="label-form">CATEGORÍA / OCASIÓN <span className="text-red-500">*</span></label>
          <div className="relative group">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-400 transition-colors pointer-events-none" size={18} />
            <select
              name="category" value={formData.category} onChange={onChange}
              ref={el => registerFieldRef?.('category', el)}
              className={`input-form appearance-none cursor-pointer transition-all duration-200 ${
                errors.category
                  ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100 ring-2 ring-red-100'
                  : ''
              }`}
            >
              <option value="">-- Seleccionar --</option>
              {TIPOS_EVENTO.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          {errors.category && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1 animate-pulse">
              <AlertCircle size={12}/>{errors.category}
            </p>
          )}
        </div>

        {/* Detalles técnicos */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">
              Duración <span className="text-red-400">*</span>
            </label>
            <input
              type="text" name="duration" value={formData.duration} onChange={onChange}
              maxLength={5} placeholder="3:45"
              ref={el => registerFieldRef?.('duration', el)}
              className={`w-full bg-transparent border-b outline-none text-xs py-1 transition-all duration-200 ${
                errors.duration
                  ? 'border-red-400 text-red-600 bg-red-50 rounded px-1'
                  : 'border-slate-200 focus:border-red-400'
              }`}
            />
            {errors.duration && (
              <p className="text-red-500 text-[10px] mt-0.5 animate-pulse">{errors.duration}</p>
            )}
          </div>

          {/* Dificultad */}
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Dificultad</label>
            <select name="difficulty" value={formData.difficulty} onChange={onChange}
              className="w-full bg-transparent border-b border-slate-200 focus:border-red-400 outline-none text-xs py-1">
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
            </select>
          </div>

          {/* Audio Demo */}
          <div>
            <label className="text-[9px] font-bold text-slate-400 uppercase mb-1 block">Audio Demo</label>
            <input type="file" ref={audioInputRef} onChange={handleAudioUpload}
              accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg" className="hidden" />
            {uploadingAudio ? (
              <div className="flex items-center gap-2 border-b border-red-200 py-1">
                <Loader2 size={12} className="animate-spin text-red-400" />
                <span className="text-xs text-red-500 font-bold">{audioProgress}%</span>
              </div>
            ) : formData.audioUrl ? (
              <div className="flex items-center justify-between gap-1 border-b border-emerald-200 py-1">
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Listo
                </span>
                <button type="button" onClick={() => onFieldChange('audioUrl', '')}
                  className="text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => audioInputRef.current?.click()}
                className="w-full flex items-center gap-1 text-xs py-1 text-slate-500 hover:text-red-500 border-b border-slate-200 hover:border-red-300 transition-all text-left">
                <UploadCloud size={13} /> Subir MP3
              </button>
            )}
          </div>
        </div>

        {/* Letra */}
        <div>
          <label className="label-form flex items-center gap-2 mb-2">
            <AlignLeft size={14} /> LETRA DE LA CANCIÓN
          </label>
          <textarea name="lyrics" value={formData.lyrics || ''} onChange={onChange}
            className="w-full p-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-red-50 focus:border-red-300 text-slate-700 outline-none resize-none font-medium leading-relaxed min-h-[150px] transition-all text-sm"
            placeholder="Escribe o pega la letra aquí..." />
        </div>
      </div>

      <style>{`
        .label-form { display:block; font-size:10px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:.05em; margin-bottom:8px; padding-left:2px; }
        .input-form { width:100%; padding:14px 16px 14px 48px; border-radius:12px; background-color:white; border:1px solid #e2e8f0; color:#334155; font-size:14px; outline:none; transition:all .2s; }
        .input-form:focus { border-color:#f87171; box-shadow:0 0 0 4px rgba(254,202,202,.3); }
      `}</style>
    </form>
  )
}