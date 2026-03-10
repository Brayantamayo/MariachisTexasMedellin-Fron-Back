
import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Plus, Clock, User, ArrowRight, MapPin, ShieldAlert, Lock, Info, AlertTriangle, Music, FileText } from 'lucide-react';
import { Reservation, CalendarBlock, UserRole, Rehearsal, Quotation } from '@/types';
import { useAuth } from '@/shared/contexts/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  date: string | null;
  reservations: Reservation[];
  blocks: CalendarBlock[];
  rehearsals?: Rehearsal[]; 
  quotations?: Quotation[];
  onViewReservation: (reservation: Reservation) => void;
  onCreateNew: (time?: string) => void;
  onBlockTime: (date: string, time: string) => void;
  onDeleteBlock: (blockId: string) => void;
}

export const DateDetailsModal: React.FC<Props> = ({ 
    isOpen, 
    onClose, 
    date, 
    reservations,
    blocks = [],
    rehearsals = [],
    quotations = [],
    onViewReservation, 
    onCreateNew,
    onBlockTime,
    onDeleteBlock
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const isClient = user?.role === UserRole.CLIENTE;
  
  // Ref para Long Press
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  if (!isOpen || !date) return null;

  // Formatear fecha
  const dateObj = new Date(date + 'T00:00:00');
  const dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Generar Horas (08:00 a 00:00)
  const hours = [];
  for (let i = 8; i <= 23; i++) {
      hours.push(`${i.toString().padStart(2, '0')}:00`);
  }
  hours.push('00:00');

  // Helper para verificar estado de una hora
  const getSlotStatus = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      
      // Calcular hora anterior para ver buffer
      let prevH = h - 1;
      if (prevH < 0) prevH = 23; 
      const prevTime = `${prevH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

      // 1. Verificar Reservas Directas
      const reservation = reservations.find(r => r.eventTime === time);
      if (reservation) return { status: 'reserved', data: reservation };

      // 2. Verificar Bloqueo Automático por Reserva (Hora anterior)
      const prevReservation = reservations.find(r => r.eventTime === prevTime);
      if (prevReservation) {
          return { status: 'buffer', data: prevReservation }; // Buffer por evento anterior
      }

      // 3. Verificar Cotizaciones En Espera (RANGO COMPLETO)
      const quote = quotations.find(q => {
          // Comprobar si la hora actual está dentro del rango start-end de la cotización
          // Nota: Simple comparación de strings funciona para formato HH:MM (24h)
          return time >= q.startTime && time < q.endTime;
      });
      if (quote) return { status: 'quote', data: quote };

      // 4. Verificar Ensayos
      const rehearsal = rehearsals.find(r => r.time === time);
      if (rehearsal) return { status: 'rehearsal', data: rehearsal };

      // 5. Verificar Bloqueo Automático por Ensayo (Hora anterior)
      const prevRehearsal = rehearsals.find(r => r.time === prevTime);
      if (prevRehearsal) return { status: 'buffer_rehearsal', data: prevRehearsal };

      // 6. Verificar Bloqueos Manuales
      // Bloqueo Total (FULL_DATE o DATE_RANGE)
      const fullBlock = blocks.find(b => b.type === 'FULL_DATE' || b.type === 'DATE_RANGE');
      if (fullBlock) return { status: 'blocked_full', data: fullBlock };

      // Bloqueo Parcial (TIME_RANGE)
      const timeBlock = blocks.find(b => {
          if (b.type !== 'TIME_RANGE') return false;
          return time >= (b.startTime || '') && time < (b.endTime || '');
      });
      if (timeBlock) return { status: 'blocked_partial', data: timeBlock };

      return { status: 'free', data: null };
  };

  // --- Handlers de Interacción ---

  const handleMouseDown = (time: string, slotData: any) => {
      isLongPressRef.current = false;
      timerRef.current = setTimeout(() => {
          isLongPressRef.current = true;
          // Acción Long Press
          if (slotData.status === 'free') {
              onBlockTime(date, time);
          } else if (slotData.status === 'blocked_partial' && isAdmin) {
              onDeleteBlock(slotData.data.id);
          }
      }, 700);
  };

  const handleMouseUp = (time: string, slotData: any) => {
      if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
      }

      if (!isLongPressRef.current) {
          // Acción Clic Normal (Crear o Ver)
          if (slotData.status === 'free') {
              onCreateNew(time); 
          } else if (slotData.status === 'reserved') {
              // PRIVACIDAD: Si es cliente y no es su reserva, no abrir
              const res = slotData.data as Reservation;
              const isMyReservation = user?.id === res.clientId || user?.email === res.clientEmail;
              
              if (isClient && !isMyReservation) {
                  return;
              }
              onViewReservation(slotData.data);
          }
      }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-start shrink-0">
            <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Agenda del Día</h4>
                <h3 className="text-xl font-serif font-bold text-slate-800 capitalize">{dateStr}</h3>
                {isAdmin && <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Info size={10} /> Mantén presionado una hora para bloquear.</p>}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                <X size={20} />
            </button>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
            <div className="space-y-2">
                {hours.map(time => {
                    const { status, data } = getSlotStatus(time);
                    
                    // Clases visuales según estado
                    let containerClass = "border-slate-100 hover:border-primary-200 hover:shadow-sm bg-white";
                    let content = null;

                    if (status === 'reserved') {
                        const res = data as Reservation;
                        const isMyReservation = user?.id === res.clientId || user?.email === res.clientEmail || !isClient;

                        if (isMyReservation) {
                            containerClass = "border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-200 cursor-pointer";
                            content = (
                                <div className="flex items-center justify-between w-full">
                                    <div>
                                        <p className="text-xs font-bold text-emerald-800">{res.eventType}</p>
                                        <p className="text-[10px] text-emerald-600 flex items-center gap-1"><User size={10}/> {res.clientName}</p>
                                    </div>
                                    <ArrowRight size={14} className="text-emerald-400" />
                                </div>
                            );
                        } else {
                            // RESERVA AJENA (PRIVACIDAD)
                            containerClass = "border-slate-100 bg-slate-100/50 cursor-not-allowed opacity-80";
                            content = (
                                <div className="flex items-center justify-center w-full text-slate-400">
                                    <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                        <Lock size={10} /> Reservado
                                    </span>
                                </div>
                            );
                        }

                    } else if (status === 'quote') {
                        const q = data as Quotation;
                        const isMyQuote = user?.id === q.clientId || user?.email === q.clientEmail || !isClient;

                        if (isMyQuote) {
                            containerClass = "border-amber-100 bg-amber-50 cursor-not-allowed";
                            content = (
                                <div className="flex items-center justify-between w-full text-amber-800">
                                    <div>
                                        <p className="text-xs font-bold flex items-center gap-2"><FileText size={12}/> Cotización en Espera</p>
                                        <p className="text-[10px] text-amber-700 opacity-80">{q.clientName}</p>
                                    </div>
                                    <span className="text-[9px] font-bold border border-amber-200 px-2 py-0.5 rounded-full bg-white/50 uppercase">
                                        Bloqueado
                                    </span>
                                </div>
                            );
                        } else {
                            // COTIZACIÓN AJENA (PRIVACIDAD)
                            containerClass = "border-slate-100 bg-slate-100/50 cursor-not-allowed opacity-80";
                            content = (
                                <div className="flex items-center justify-center w-full text-slate-400">
                                    <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                        <Lock size={10} /> Reservado
                                    </span>
                                </div>
                            );
                        }

                    } else if (status === 'rehearsal') {
                        if (isClient) {
                            // CLIENTE: Ve el ensayo como "Reservado"
                            containerClass = "border-slate-100 bg-slate-100/50 cursor-not-allowed opacity-80";
                            content = (
                                <div className="flex items-center justify-center w-full text-slate-400">
                                    <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                        <Lock size={10} /> Reservado
                                    </span>
                                </div>
                            );
                        } else {
                            // ADMIN/EMPLEADO: Ve el ensayo como tal
                            containerClass = "border-blue-100 bg-blue-50 cursor-not-allowed opacity-80";
                            content = (
                                <div className="flex items-center justify-center w-full text-blue-400">
                                    <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                        <Music size={12} /> Ensayo Programado
                                    </span>
                                </div>
                            );
                        }

                    } else if (status === 'buffer' || status === 'buffer_rehearsal') {
                        // BLOQUEO AUTOMÁTICO (Hora siguiente)
                        containerClass = "border-slate-100 bg-slate-50 cursor-not-allowed border-dashed";
                        content = (
                            <div className="flex items-center gap-2 text-slate-400 w-full opacity-70">
                                <AlertTriangle size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-wide">Cierre / Transporte</span>
                            </div>
                        );

                    } else if (status === 'blocked_partial') {
                        containerClass = "border-red-100 bg-[repeating-linear-gradient(45deg,#fef2f2,#fef2f2_10px,#fee2e2_10px,#fee2e2_20px)] cursor-not-allowed";
                        const block = data as CalendarBlock;
                        content = (
                            <div className="flex items-center gap-2 text-red-800 w-full">
                                <ShieldAlert size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wide truncate">{block.reason}</span>
                            </div>
                        );
                    } else if (status === 'blocked_full') {
                        containerClass = "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed";
                        content = (
                            <div className="flex items-center gap-2 text-slate-400 w-full justify-center">
                                <Lock size={12} />
                                <span className="text-[10px] font-bold uppercase">Día Bloqueado</span>
                            </div>
                        );
                    } else {
                        // Free
                        content = (
                            <div className="flex items-center justify-between w-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">Disponible</span>
                                <Plus size={14} className="text-primary-400" />
                            </div>
                        );
                    }

                    return (
                        <div 
                            key={time}
                            onMouseDown={() => handleMouseDown(time, { status, data })}
                            onMouseUp={() => handleMouseUp(time, { status, data })}
                            onTouchStart={() => handleMouseDown(time, { status, data })}
                            onTouchEnd={() => handleMouseUp(time, { status, data })}
                            className={`group flex items-center gap-4 p-3 rounded-xl border transition-all select-none ${containerClass}`}
                        >
                            <div className="w-12 text-center shrink-0">
                                <span className="text-sm font-bold text-slate-500 font-mono">{time}</span>
                            </div>
                            <div className="flex-1 flex items-center">
                                {content}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
            <button 
                onClick={() => onCreateNew()}
                className="w-full py-4 bg-[#dc2626] hover:bg-red-700 text-white rounded-xl text-sm font-bold uppercase tracking-widest shadow-lg shadow-red-900/20 hover:shadow-red-900/30 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
            >
                <Plus size={18} strokeWidth={3} />
                Crear Reserva (General)
            </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
