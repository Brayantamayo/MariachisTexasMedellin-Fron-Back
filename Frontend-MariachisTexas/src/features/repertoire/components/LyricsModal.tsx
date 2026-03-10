
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlignLeft, Music, ZoomIn, ZoomOut, Type } from 'lucide-react';
import { Song } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
}

export const LyricsModal: React.FC<Props> = ({ isOpen, onClose, song }) => {
  const [fontSize, setFontSize] = useState(18);

  if (!isOpen || !song) return null;

  const increaseFont = () => setFontSize(prev => Math.min(prev + 2, 48));
  const decreaseFont = () => setFontSize(prev => Math.max(prev - 2, 14));

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop Darker for focus */}
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col h-[85vh] animate-fade-in-up border border-slate-200 overflow-hidden">
        
        {/* Toolbar Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-100 bg-slate-50/90 backdrop-blur-md z-10">
           <div className="flex items-center gap-4 overflow-hidden">
               <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary-600 border border-slate-200 shadow-sm flex-shrink-0">
                   <Music size={20} />
               </div>
               <div className="min-w-0">
                   <h3 className="font-serif font-bold text-slate-800 text-lg leading-none mb-1 truncate">{song.title}</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate">{song.artist}</p>
               </div>
           </div>

           <div className="flex items-center gap-3">
                {/* Font Controls */}
                <div className="hidden sm:flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                    <button onClick={decreaseFont} className="p-2 hover:bg-slate-100 rounded-md text-slate-500 transition-colors" title="Reducir letra">
                        <ZoomOut size={18} />
                    </button>
                    <div className="w-px h-5 bg-slate-200 mx-2"></div>
                    <div className="flex items-center gap-1 w-12 justify-center">
                        <Type size={14} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">{fontSize}</span>
                    </div>
                    <div className="w-px h-5 bg-slate-200 mx-2"></div>
                    <button onClick={increaseFont} className="p-2 hover:bg-slate-100 rounded-md text-slate-500 transition-colors" title="Aumentar letra">
                        <ZoomIn size={18} />
                    </button>
                </div>

                <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block"></div>

                <button 
                    onClick={onClose} 
                    className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-xl transition-all"
                >
                   <X size={22} />
               </button>
           </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white relative scroll-smooth">
             <div className="max-w-2xl mx-auto text-center">
                {song.lyrics ? (
                    <p 
                        className="text-slate-800 leading-relaxed font-medium whitespace-pre-wrap font-serif transition-all duration-200"
                        style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
                    >
                        {song.lyrics}
                    </p>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-300">
                        <AlignLeft size={64} className="mb-4 opacity-30" />
                        <p className="text-lg font-medium">No hay letra registrada para esta canción.</p>
                        <p className="text-sm mt-2">Edita la canción para agregarla.</p>
                    </div>
                )}
                
                {/* Spacing for scrolling to bottom */}
                <div className="h-20"></div>
             </div>
        </div>

        {/* Footer info (optional for mobile) */}
        <div className="sm:hidden p-3 border-t border-slate-100 bg-slate-50 flex justify-center gap-4">
             <button onClick={decreaseFont} className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm"><ZoomOut size={20} /></button>
             <button onClick={increaseFont} className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm"><ZoomIn size={20} /></button>
        </div>

      </div>
    </div>,
    document.body
  );
};
