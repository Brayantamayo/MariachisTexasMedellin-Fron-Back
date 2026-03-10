
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Calendar } from 'lucide-react';
import { RehearsalForm } from './RehearsalForm';
import { Rehearsal, Song } from '@/types';
import { repertoireService } from '../../repertoire/services/repertoireService';
import { reservaService } from '../../reservas/services/reservaService';
import { blockService } from '../../bloqueos/services/blockService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  rehearsal: Rehearsal | null;
}

export const RehearsalEditModal: React.FC<Props> = ({ isOpen, onClose, onSave, rehearsal }) => {
  const [formData, setFormData] = useState<any>(null);
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [blockStatus, setBlockStatus] = useState<any>({ isBlocked: false });

  useEffect(() => {
    if (rehearsal && isOpen) {
        setFormData(rehearsal);
        
        const loadData = async () => {
            const songs = await repertoireService.getSongs();
            setAvailableSongs(songs);
            
            // Cargar disponibilidad para la fecha existente
            await checkBlockAndHours(rehearsal.date);
        };
        loadData();
    }
  }, [rehearsal, isOpen]);

  const checkBlockAndHours = async (date: string) => {
      const status = await blockService.checkDateStatus(date);
      setBlockStatus(status);

      let hours = await reservaService.getAvailableHours(date);
      
      if (!status.isBlocked && status.hasPartialBlocks && status.blockedRanges) {
          hours = hours.filter(hour => {
              return !status.blockedRanges!.some(range => hour >= range.start && hour < range.end);
          });
      }
      setAvailableHours(hours);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value, time: '' })); // Reset time on date change
    if (name === 'date') {
        checkBlockAndHours(value);
    }
  };

  const toggleSongSelection = (songId: string) => {
      setFormData(prev => {
          const exists = prev.repertoireIds.includes(songId);
          if (exists) {
              return { ...prev, repertoireIds: prev.repertoireIds.filter(id => id !== songId) };
          } else {
              return { ...prev, repertoireIds: [...prev.repertoireIds, songId] };
          }
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (blockStatus.isBlocked) {
        alert(`La fecha está bloqueada: ${blockStatus.reason}`);
        return;
    }

    if (!formData.time) {
        alert("Por favor selecciona una hora.");
        return;
    }

    onSave(formData);
  };

  if (!isOpen || !formData) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">
        
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-primary-900/10 border bg-primary-50 border-primary-100">
                <Calendar className="text-primary-600" size={24} />
            </div>
            <div>
                <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">Editar Ensayo</h3>
                <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">Modificando: {rehearsal?.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-0 custom-scrollbar bg-white">
            <RehearsalForm 
                formData={formData} 
                availableSongs={availableSongs}
                availableHours={availableHours}
                blockStatus={blockStatus}
                onChange={handleChange} 
                onDateChange={handleDateChange}
                onToggleSong={toggleSongSelection}
                onSubmit={handleSubmit} 
            />
        </div>

        <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-end gap-4 z-10">
             <button onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest px-4 py-2">Cancelar</button>
             <button 
                onClick={handleSubmit} 
                disabled={blockStatus.isBlocked}
                className={`px-8 py-4 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-3 shadow-xl transition-all transform hover:-translate-y-0.5
                    ${blockStatus.isBlocked 
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' 
                        : 'bg-[#dc2626] hover:bg-red-700 text-white shadow-red-900/10 hover:shadow-red-900/20'}
                `}
            >
                <Save size={18} /> {blockStatus.isBlocked ? 'Fecha Bloqueada' : 'Guardar Cambios'}
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
