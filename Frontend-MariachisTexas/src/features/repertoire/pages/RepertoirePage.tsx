
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, CheckCircle, AlertCircle, X } from 'lucide-react';
import { repertoireService } from '../services/repertoireService';
import { Song, UserRole } from '@/types';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal';
import { useAuth } from '@/shared/contexts/AuthContext';

// Componentes Modulares
import { RepertoireTable } from '../components/RepertoireTable';
import { SongCreateModal } from '../components/SongCreateModal';
import { SongEditModal } from '../components/SongEditModal';
import { SongDetailModal } from '../components/SongDetailModal';
import { LyricsModal } from '../components/LyricsModal';

export const RepertoirePage: React.FC = () => {
  const { user } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Audio Player State
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  
  // Delete Modal
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, songId: string | null}>({
      isOpen: false,
      songId: null
  });

  // Notification
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchSongs = async () => {
    setLoading(true);
    try {
      const data = await repertoireService.getSongs();
      setSongs(data);
    } catch (error) {
      console.error(error);
      showNotification("Error cargando el repertorio.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
    };
  }, []);

  // Audio Logic
  const togglePlay = (song: Song) => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
    }

    if (playingId === song.id) {
        setPlayingId(null);
        return;
    }

    if (song.audioUrl) {
        const newAudio = new Audio(song.audioUrl);
        audioRef.current = newAudio;
        setPlayingId(song.id);
        
        newAudio.onended = () => {
            setPlayingId(null);
            if (audioRef.current === newAudio) {
                audioRef.current = null;
            }
        };

        const playPromise = newAudio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                if (error.name !== 'AbortError') {
                    console.error("Error reproducción:", error);
                    showNotification("No se pudo reproducir el audio.", "error");
                    setPlayingId(null);
                }
            });
        }
    } else {
        showNotification("Esta canción no tiene audio disponible.", "error");
    }
  };

  // CRUD Handlers
  const handleCreateSong = async (songData: any) => {
    try {
        const newSong = await repertoireService.createSong(songData);
        setSongs(prev => [newSong, ...prev]);
        showNotification('Nueva canción agregada al repertorio.');
        setIsCreateOpen(false);
    } catch (error) {
      console.error(error);
      showNotification("Error al guardar la canción.", "error");
    }
  };

  const handleUpdateSong = async (songData: any) => {
    if (!selectedSong) return;
    try {
        const updated = await repertoireService.updateSong(selectedSong.id, songData);
        setSongs(prev => prev.map(s => s.id === updated.id ? updated : s));
        showNotification('Canción actualizada correctamente.');
        setIsEditOpen(false);
    } catch (error) {
      console.error(error);
      showNotification("Error al actualizar la canción.", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.songId) return;
    try {
        await repertoireService.deleteSong(deleteModal.songId);
        setSongs(prev => prev.filter(s => s.id !== deleteModal.songId));
        if (playingId === deleteModal.songId) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            setPlayingId(null);
        }
        showNotification('Canción eliminada del repertorio.');
    } catch (error) {
        console.error(error);
        showNotification("Error al eliminar la canción.", "error");
    }
  };

  const handleToggleStatus = async (song: Song) => {
    const newStatus = !song.isActive;
    try {
        setSongs(prev => prev.map(s => s.id === song.id ? { ...s, isActive: newStatus } : s));
        await repertoireService.updateSong(song.id, { isActive: newStatus });
    } catch (error) {
        console.error(error);
        fetchSongs();
        showNotification("Error al cambiar estado.", "error");
    }
  };

  const filteredSongs = songs.filter(song => {
    return song.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
           song.artist.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const canManage = user?.role === UserRole.ADMIN || user?.role === UserRole.EMPLEADO;

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      
      {/* Toast Notification */}
      {notification && createPortal(
        <div className="fixed top-6 right-6 z-[200] animate-fade-in-up">
            <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md min-w-[320px] ${
                notification.type === 'success' ? 'bg-white/95 border-emerald-100 text-emerald-950' : 'bg-white/95 border-red-100 text-red-950'
            }`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                }`}>
                    {notification.type === 'success' ? <CheckCircle size={20} strokeWidth={3} /> : <AlertCircle size={20} strokeWidth={3} />}
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-sm">{notification.type === 'success' ? '¡Excelente!' : 'Atención'}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{notification.message}</p>
                </div>
                <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                </button>
            </div>
        </div>,
        document.body
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1e293b] tracking-wide uppercase">GESTIÓN DE REPERTORIO</h1>
          <p className="text-slate-500 mt-2 text-sm">Administra el cancionero y controla las piezas musicales.</p>
        </div>
        
        {/* Mostrar botón para ADMIN y EMPLEADO */}
        {canManage && (
            <button 
                onClick={() => setIsCreateOpen(true)}
                className="bg-[#dc2626] hover:bg-red-700 text-white px-8 py-3 rounded-full flex items-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 font-bold text-xs tracking-widest uppercase"
            >
            <Plus size={16} strokeWidth={3} />
            REGISTRAR CANCIÓN
            </button>
        )}
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px]">
         
         {/* Search */}
         <div className="p-8 pb-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por título o artista..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-full py-3.5 pl-12 pr-6 text-slate-600 focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all placeholder:text-slate-400 text-sm shadow-sm"
                />
            </div>
         </div>

         {/* Modular Table */}
         <RepertoireTable 
            songs={filteredSongs}
            loading={loading}
            playingId={playingId}
            userRole={user?.role}
            onPlay={togglePlay}
            onView={(song) => { setSelectedSong(song); setIsDetailOpen(true); }}
            onViewLyrics={(song) => { setSelectedSong(song); setIsLyricsOpen(true); }}
            onEdit={(song) => { setSelectedSong(song); setIsEditOpen(true); }}
            onDelete={(id) => setDeleteModal({ isOpen: true, songId: id })}
            onToggleStatus={handleToggleStatus}
         />
      </div>

      {/* Modales */}
      <SongCreateModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleCreateSong}
      />

      <SongEditModal 
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleUpdateSong}
        song={selectedSong}
      />

      <SongDetailModal 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        song={selectedSong}
      />

      <LyricsModal 
        isOpen={isLyricsOpen}
        onClose={() => setIsLyricsOpen(false)}
        song={selectedSong}
      />

      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={confirmDelete}
        title="¿Eliminar Canción?"
        message="¿Estás seguro? Esta acción eliminará la canción del repertorio permanentemente."
        confirmText="Sí, Eliminar"
      />
    </div>
  );
};
