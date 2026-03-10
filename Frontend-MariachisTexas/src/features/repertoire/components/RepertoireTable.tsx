
import React, { useState } from 'react';
import { Song, UserRole } from '@/types';
import { Play, Pause, Eye, FileText, Edit2, Trash2, Music } from 'lucide-react';
import { TablePagination } from '@/shared/components/TablePagination';

interface Props {
  songs: Song[];
  loading: boolean;
  playingId: string | null;
  userRole?: UserRole;
  onPlay: (song: Song) => void;
  onView: (song: Song) => void;
  onViewLyrics: (song: Song) => void;
  onEdit: (song: Song) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (song: Song) => void;
}

export const RepertoireTable: React.FC<Props> = ({ 
    songs, loading, playingId, userRole,
    onPlay, onView, onViewLyrics, onEdit, onDelete, onToggleStatus 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const canManage = userRole === UserRole.ADMIN || userRole === UserRole.EMPLEADO;

  const ActionButton: React.FC<{ icon: React.ElementType, onClick: () => void, tooltip?: string, active?: boolean }> = ({ icon: Icon, onClick, tooltip, active }) => (
    <button 
        onClick={onClick}
        title={tooltip}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 
            ${active 
                ? 'bg-primary-50 text-primary-600 ring-2 ring-primary-100' 
                : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'}
        `}
    >
        <Icon size={16} strokeWidth={2} />
    </button>
  );

  if (loading) {
      return <div className="text-center py-20 text-slate-400">Cargando repertorio...</div>;
  }

  if (songs.length === 0) {
      return <div className="text-center py-20 text-slate-400">No se encontraron canciones.</div>;
  }

  // Pagination Logic
  const totalPages = Math.ceil(songs.length / itemsPerPage);
  const currentSongs = songs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto pb-4">
          <table className="w-full">
              <thead>
                  <tr className="border-b border-slate-100 text-left">
                      <th className="py-6 px-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Título / Artista</th>
                      <th className="py-6 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Género</th>
                      <th className="py-6 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Duración</th>
                      <th className="py-6 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                      <th className="py-6 px-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                  {currentSongs.map(song => (
                      <tr key={song.id} className="hover:bg-slate-50/50 transition-colors group">
                          {/* Title & Artist */}
                          <td className="py-5 px-8">
                              <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 flex-shrink-0 overflow-hidden">
                                      {song.coverImage ? (
                                          <img src={song.coverImage} alt="cover" className="w-full h-full object-cover" />
                                      ) : (
                                          <Music size={20} strokeWidth={1.5} />
                                      )}
                                  </div>
                                  <div className="flex flex-col">
                                      <span className={`font-bold text-sm ${playingId === song.id ? 'text-primary-600' : 'text-slate-800'}`}>
                                          {song.title}
                                      </span>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                          {song.artist}
                                      </span>
                                  </div>
                              </div>
                          </td>

                          {/* Genre */}
                          <td className="py-5 px-6">
                              <span className="inline-flex px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                                  {song.genre}
                              </span>
                          </td>

                          {/* Duration */}
                          <td className="py-5 px-6 text-center text-sm font-medium text-slate-600 font-mono">
                              {song.duration}
                          </td>

                          {/* Status */}
                          <td className="py-5 px-6">
                              <div className="flex items-center justify-center gap-3">
                                  {canManage ? (
                                      <button 
                                          onClick={() => onToggleStatus(song)}
                                          className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none ${song.isActive ? 'bg-[#dc2626]' : 'bg-slate-200'}`}
                                      >
                                          <span 
                                              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300 ${song.isActive ? 'translate-x-5' : 'translate-x-0'}`} 
                                          />
                                      </button>
                                  ) : (
                                      <div className={`w-2.5 h-2.5 rounded-full ${song.isActive ? 'bg-emerald-500 shadow-sm' : 'bg-slate-300'}`}></div>
                                  )}
                                  <span className={`text-[10px] font-bold uppercase tracking-wider w-12 ${song.isActive ? 'text-emerald-500' : 'text-slate-300'}`}>
                                      {song.isActive ? 'Activo' : 'Inactivo'}
                                  </span>
                              </div>
                          </td>

                          {/* Actions */}
                          <td className="py-5 px-8">
                              <div className="flex items-center justify-center gap-2">
                                  <ActionButton 
                                      icon={playingId === song.id ? Pause : Play} 
                                      onClick={() => onPlay(song)} 
                                      active={playingId === song.id}
                                      tooltip={playingId === song.id ? "Pausar" : "Escuchar demo"}
                                  />
                                  <ActionButton icon={Eye} onClick={() => onView(song)} tooltip="Ver detalles" />
                                  <ActionButton icon={FileText} onClick={() => onViewLyrics(song)} tooltip="Ver letra" />
                                  
                                  {canManage && (
                                      <>
                                          <ActionButton icon={Edit2} onClick={() => onEdit(song)} tooltip="Editar" />
                                          <ActionButton icon={Trash2} onClick={() => onDelete(song.id)} tooltip="Eliminar" />
                                      </>
                                  )}
                              </div>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
      <TablePagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={songs.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};
