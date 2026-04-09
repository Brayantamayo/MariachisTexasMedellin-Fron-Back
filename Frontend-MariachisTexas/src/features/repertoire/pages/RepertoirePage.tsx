import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, CheckCircle, AlertCircle, X } from 'lucide-react';
import { repertoireService } from '../services/repertoireService';
import { Song, UserRole } from '@/types';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal';
import { useAuth } from '@/shared/contexts/AuthContext';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

import { RepertoireTable } from '../components/RepertoireTable';
import { SongCreateModal } from '../components/SongCreateModal';
import { SongEditModal }   from '../components/SongEditModal';
import { SongDetailModal } from '../components/SongDetailModal';
import { LyricsModal }     from '../components/LyricsModal';

export const RepertoirePage: React.FC = () => {
  // Obtiene el usuario autenticado (para saber permisos)
  const { user } = useAuth();
  //// Guarda la lista de canciones
  const [songs,      setSongs]      = useState<Song[]>([]);
  // Indica si los datos están cargando
  const [loading,    setLoading]    = useState(true);
  // Guarda lo que el usuario escribe para buscar canciones
  const [searchTerm, setSearchTerm] = useState('');

  // Audio
  // Guarda el id de la canción que está sonando
  const [playingId, setPlayingId] = useState<string | null>(null);
  // Referencia al reproductor de audio
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Modales

  // Controla si el modal de crear canción está abierto
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  // Controla si el modal de editar canción está abierto
  const [isEditOpen,   setIsEditOpen]   = useState(false);
  // Controla si el modal de ver detalles está abierto
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  // Controla si el modal de letras está abierto
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  // Guarda la canción seleccionada para ver, editar o eliminar
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  // Controla el modal de eliminación (si está abierto y qué canción eliminar)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; songId: string | null }>({
    isOpen: false, songId: null
  });
  // Guarda notificaciones (éxito o error)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  // Define si el usuario puede gestionar (solo ADMIN o EMPLEADO)
  const canManage = user?.role === UserRole.ADMIN || user?.role === UserRole.EMPLEADO;

  {/* muestra un mensaje en la pantalla de notificaciones*/}
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  {/* trae los datos de la letra (canciones) y los muestra en la tabla*/}
  const fetchSongs = async () => {
    setLoading(true);
    try {
      const data = canManage
        ? await repertoireService.getSongs()
        : await repertoireService.getSongsPublic();
      setSongs(data);
    } catch {
      showNotification('Error cargando el repertorio.', 'error');
    } finally {
      setLoading(false);
    }
  };

  {/*Carga las canciones y asegura que el audio se detenga cuando se sale o cambia el usuario */}
  useEffect(() => {
    fetchSongs();
    return () => { audioRef.current?.pause(); };
  }, [user]);

  // ─── Audio ────────────────────────────────────────────────────────────────────
  {/*Activa o desactiva la reproducción de la canción actual*/}
  const togglePlay = (song: Song) => {
    audioRef.current?.pause();
    audioRef.current = null;

    if (playingId === song.id) {
      setPlayingId(null);
      return;
    }

    if (!song.audioUrl) {
      showNotification('Esta canción no tiene audio disponible.', 'error');
      return;
    }

    const audio = new Audio(song.audioUrl);
    audioRef.current = audio;
    setPlayingId(song.id);

    audio.onended = () => {
      setPlayingId(null);
      audioRef.current = null;
    };

    audio.play().catch((err) => {
      if (err.name !== 'AbortError') {
        showNotification('No se pudo reproducir el audio.', 'error');
        setPlayingId(null);
      }
    });
  };

  // ─── CRUD ─────────────────────────────────────────────────────────────────────
  {/*crea una canción y la agrega al repertorio*/}
  const handleCreateSong = async (songData: any) => {
  // Lanzar el error para que el modal lo capture
  const newSong = await repertoireService.createSong({ ...songData, isActive: true });
  setSongs(prev => [newSong, ...prev]);
  showNotification('Nueva canción agregada al repertorio.');
  setIsCreateOpen(false);
};

  {/*actualiza la canción seleccionada*/}
  const handleUpdateSong = async (songData: any) => {
  if (!selectedSong) return;
  // Lanzar el error para que el modal lo capture
  const updated = await repertoireService.updateSong(selectedSong.id, songData);
  setSongs(prev => prev.map(s => s.id === updated.id ? updated : s));
  showNotification('Canción actualizada correctamente.');
  setIsEditOpen(false);
  setSelectedSong(null);
};
  {/*confirma la eliminación de la canción seleccionada*/}
  const confirmDelete = async () => {
    if (!deleteModal.songId) return;
    try {
      await repertoireService.deleteSong(deleteModal.songId);
      setSongs(prev => prev.filter(s => s.id !== deleteModal.songId));
      if (playingId === deleteModal.songId) {
        audioRef.current?.pause();
        audioRef.current = null;
        setPlayingId(null);
      }
      showNotification('Canción eliminada del repertorio.');
    } catch (error) {
      showNotification(getErrorMessage(error, 'No se pudo eliminar la canción.'), 'error');
    } finally {
      setDeleteModal({ isOpen: false, songId: null });
    }
  };

  {/*cambia el estado de la canción (activa o desactiva)*/}
  const handleToggleStatus = async (song: Song) => {
    try {
      const updated = await repertoireService.toggleStatus(song.id);
      setSongs(prev => prev.map(s => s.id === updated.id ? updated : s));
      showNotification(
        updated.isActive
          ? 'Canción activada y visible en el catálogo.'
          : 'Canción desactivada del catálogo público.'
      );
    } catch (error) {
      fetchSongs();
      showNotification(getErrorMessage(error, 'Error al cambiar el estado.'), 'error');
    }
  };

  {/*filtra las canciones por título y artista*/}
  const filteredSongs = songs.filter(s =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">

      {/* Muestra una notificación flotante (éxito o error) que el usuario puede cerrar */}
      {notification && createPortal(
        <div className="fixed top-6 right-6 z-[200] animate-fade-in-up">
          <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md min-w-[320px] ${
            notification.type === 'success'
              ? 'bg-white/95 border-emerald-100 text-emerald-950'
              : 'bg-white/95 border-red-100 text-red-950'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
            }`}>
              {notification.type === 'success'
                ? <CheckCircle size={20} strokeWidth={3} />
                : <AlertCircle size={20} strokeWidth={3} />}
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

      {/* Parte de arriba de la pagina de repertorio  */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1e293b] tracking-wide uppercase">
            {canManage ? 'GESTIÓN DE REPERTORIO' : 'REPERTORIO'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {canManage
              ? 'Administra el cancionero y controla las piezas musicales del grupo.'
              : 'Explora el catálogo de canciones disponibles para tu evento.'}
          </p>
        </div>
        {canManage && (
          <button onClick={() => setIsCreateOpen(true)}
            className="bg-[#dc2626] hover:bg-red-700 text-white px-8 py-3 rounded-full flex items-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 font-bold text-xs tracking-widest uppercase">
            <Plus size={16} strokeWidth={3} /> REGISTRAR CANCIÓN
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px]">
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
      <SongCreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSave={handleCreateSong} />
      <SongEditModal   isOpen={isEditOpen}   onClose={() => { setIsEditOpen(false); setSelectedSong(null); }} onSave={handleUpdateSong} song={selectedSong} />
      <SongDetailModal isOpen={isDetailOpen} onClose={() => { setIsDetailOpen(false); setSelectedSong(null); }} song={selectedSong} />
      <LyricsModal     isOpen={isLyricsOpen} onClose={() => { setIsLyricsOpen(false); setSelectedSong(null); }} song={selectedSong} />

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={confirmDelete}
        title="¿Eliminar Canción?"
        message="Esta acción eliminará la canción del repertorio permanentemente y no se puede deshacer."
        confirmText="Sí, Eliminar"
      />
    </div>
  );
};