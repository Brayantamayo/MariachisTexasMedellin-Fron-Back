
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Music } from 'lucide-react';
import { SongForm } from './SongForm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}

export const SongCreateModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const emptySong = {
    title: '',
    artist: '',
    genre: 'Ranchera',
    category: 'Serenata',
    lyrics: '',
    audioUrl: '',
    duration: '',
    difficulty: 'Media',
    coverImage: ''
  };

  const [formData, setFormData] = useState<any>(emptySong);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, coverImage: localUrl }));
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, audioUrl: localUrl }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData(emptySong);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">
        
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-primary-900/10 border bg-primary-50 border-primary-100">
                <Music className="text-primary-600" size={24} />
            </div>
            <div>
                <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">Nueva Canción</h3>
                <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">Agregar al repertorio musical</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
            <SongForm 
                formData={formData} 
                onChange={handleChange} 
                onImageUpload={handleImageUpload} 
                onAudioUpload={handleAudioUpload}
                onClearAudio={() => setFormData(prev => ({ ...prev, audioUrl: '' }))}
                onSubmit={handleSubmit} 
            />
        </div>

        <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-end gap-4 z-10">
             <button onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest px-4 py-2">Cancelar</button>
             <button onClick={handleSubmit} className="bg-[#dc2626] hover:bg-red-700 text-white px-8 py-4 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-3 shadow-xl shadow-red-900/10 hover:shadow-red-900/20 transition-all transform hover:-translate-y-0.5">
                <Save size={18} /> Guardar Canción
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
