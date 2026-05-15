import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import '@/shared/css/Aiadvisorwidget.css';
import api from '@/shared/api/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_CHIPS = [
  'Quiero cotizar una serenata',
  '¿Cuánto cuesta una serenata?',
  'Recomiéndame una serenata',
  'Es para un cumpleaños',
  '¿Qué incluye la serenata?',
];

function getTime(): string {
  return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

export const AIAdvisorWidget: React.FC = () => {
  const [isOpen,      setIsOpen]      = useState(false);
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [input,       setInput]       = useState('');
  const [isTyping,    setIsTyping]    = useState(false);
  const [hasNewMsg,   setHasNewMsg]   = useState(false);
  const [showChips,   setShowChips]   = useState(true);
  const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([]);

  const bodyRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'assistant', content: '¡Hola! Soy tu asesor de Mariachis Texas 🎺 ¿En qué te puedo ayudar hoy?' }]);
      setHasNewMsg(false);
    }
    if (isOpen) {
      setHasNewMsg(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => {
    if (!isOpen && messages.length > 1) {
      const last = messages[messages.length - 1];
      if (last.role === 'assistant') setHasNewMsg(true);
    }
  }, [messages]);

  const callBackend = async (userMessage: string) => {
    try {
      const { data } = await api.post('/ai/chat', {
        message: userMessage,
        history: chatHistory,
      });

      const reply = data.reply ?? 'Lo siento, hubo un error. Intenta de nuevo.';

      setChatHistory(prev => [
        ...prev,
        { role: 'user',  text: userMessage },
        { role: 'model', text: reply },
      ]);

      return reply;
    } catch (err: any) {
      return 'En este momento nuestro Asesor se encuentra atendiendo a un cliente. Por favor, intente de nuevo más tarde.';
    }
  };

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isTyping) return;

    setInput('');
    setShowChips(false);
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setIsTyping(true);

    const reply = await callBackend(msg);
    setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    setIsTyping(false);
  };

  return createPortal(
    <>
      {/* Lupita Floating Assistant Button */}
      <div 
        className={`fixed bottom-6 right-6 z-[999999] flex flex-col items-end pointer-events-none group transition-all duration-500 ${isOpen ? 'opacity-0 scale-0 translate-y-10' : 'opacity-100 scale-100 translate-y-0'}`}
      >
        {/* Welcome Bubble (shows when closed) */}
        {!isOpen && (
          <div className="mb-4 mr-2 bg-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-100 relative transition-all duration-500 transform pointer-events-auto group-hover:scale-105">
            <p className="text-xs font-bold text-slate-800 leading-tight">
              {hasNewMsg ? '¡Tengo una respuesta para ti!' : '¡Hola! Soy Lupita, ¿en qué puedo ayudarte?'}
            </p>
            <div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-r border-b border-slate-100 rotate-45 transform"></div>
          </div>
        )}

        {/* Robot Image Trigger */}
        <div 
          className="w-28 h-28 relative pointer-events-auto cursor-pointer animate-float-lupita"
          onClick={() => setIsOpen(true)}
        >
          <img 
            src="/images/lupita.png" 
            alt="Lupita Assistant" 
            className="w-full h-full object-contain filter drop-shadow-2xl"
          />
          {hasNewMsg && <span className="advisor-fab__dot" style={{ top: '20%', right: '20%' }} />}
        </div>
      </div>

      {/* Floating Close Button (only when panel is open) */}
      {isOpen && (
        <button
          className="fixed bottom-6 right-6 z-[999999] w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-700 text-white flex items-center justify-center shadow-2xl hover:bg-red-600 transition-all transform hover:scale-110 animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <X size={24} />
        </button>
      )}

      <style>{`
        @keyframes float-lupita {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(2deg); }
        }
        .animate-float-lupita {
          animation: float-lupita 4s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div className={`advisor-panel ${isOpen ? 'advisor-panel--open' : ''}`}>

        <div className="advisor-header">
          <div className="advisor-header__avatar"><Sparkles size={16} /></div>
          <div className="advisor-header__info">
            <p className="advisor-header__name">IA LUPITA</p>
            <span className="advisor-header__status">
              <span className="advisor-header__dot" /> En línea
            </span>
          </div>
          <button 
            className="advisor-header__close" 
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar asesor"
          >
            <X size={24} />
          </button>
        </div>

        <div className="advisor-body" ref={bodyRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`advisor-msg advisor-msg--${msg.role}`}>
              <div className="advisor-msg__bubble">{msg.content}</div>
              <span className="advisor-msg__time">{getTime()}</span>
            </div>
          ))}

          {showChips && messages.length <= 1 && (
            <div className="advisor-chips">
              {QUICK_CHIPS.map(chip => (
                <button key={chip} className="advisor-chip" onClick={() => handleSend(chip)}>
                  {chip}
                </button>
              ))}
            </div>
          )}

          {isTyping && (
            <div className="advisor-msg advisor-msg--assistant">
              <div className="advisor-msg__bubble advisor-typing">
                <span /><span /><span />
              </div>
            </div>
          )}
        </div>

        <div className="advisor-input-area">
          <textarea
            ref={inputRef}
            className="advisor-input"
            rows={1}
            placeholder="Escribe tu consulta..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            className="advisor-send"
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
          >
            <Send size={16} />
          </button>
        </div>

      </div>
    </>,
    document.body
  );
};
