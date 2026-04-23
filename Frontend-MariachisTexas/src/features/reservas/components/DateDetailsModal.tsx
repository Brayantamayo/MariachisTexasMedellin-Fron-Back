import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, User, ArrowRight, ShieldAlert, Lock, Info, AlertTriangle, Music, FileText, CheckCircle } from 'lucide-react';
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

const timeToMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

const addOneHour = (t: string): string => {
  const [h, m] = t.split(':').map(Number)
  const newH = (h + 1) % 24
  return `${newH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export const DateDetailsModal: React.FC<Props> = ({
  isOpen, onClose, date,
  reservations, blocks = [], rehearsals = [], quotations = [],
  onViewReservation, onCreateNew, onBlockTime, onDeleteBlock
}) => {
  const { user } = useAuth();
  const isAdmin  = user?.role === UserRole.ADMIN;
  const isClient = user?.role === UserRole.CLIENTE;

  const timerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  if (!isOpen || !date) return null;

  const dateObj = new Date(date + 'T00:00:00');
  const dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const hours: string[] = [];
  for (let i = 8; i <= 23; i++) hours.push(`${i.toString().padStart(2,'0')}:00`);
  hours.push('00:00');

  const getSlotStatus = (time: string) => {
    const hMin    = timeToMinutes(time)
    const prevMin = hMin - 60
    const prevTime = prevMin >= 0
      ? `${Math.floor(prevMin / 60).toString().padStart(2,'0')}:${String(prevMin % 60).padStart(2,'0')}`
      : `23:00`

    // 1. Reserva — hora exacta de inicio
    const reservation = reservations.find(r => r.startTime === time || r.eventTime === time)
    if (reservation) return { status: 'reserved', data: reservation }

    // 2. Horas intermedias de una reserva (entre inicio y fin, sin incluir fin)
    const reservaEnRango = reservations.find(r => {
      const start = timeToMinutes(r.startTime || r.eventTime || '00:00')
      const end   = timeToMinutes(r.endTime   || '00:00')
      return hMin > start && hMin < end
    })
    if (reservaEnRango) return { status: 'reserved_range', data: reservaEnRango }

    // 3. Buffer POST-reserva: la hora exacta de fin
    const bufferPostReserva = reservations.find(r => {
      const end = timeToMinutes(r.endTime || '00:00')
      return hMin === end
    })
    if (bufferPostReserva) return { status: 'buffer', data: bufferPostReserva }

    // 4. Buffer PRE-reserva: la hora anterior al inicio
    const prevReservation = reservations.find(r => r.startTime === prevTime || r.eventTime === prevTime)
    if (prevReservation) return { status: 'buffer', data: prevReservation }

    // 5. Cotización EN_ESPERA — rango completo (sin incluir fin)
    const quote = quotations.find(q => {
      const start = timeToMinutes(q.startTime)
      const end   = timeToMinutes(q.endTime)
      return hMin >= start && hMin < end
    })
    if (quote) return { status: 'quote', data: quote }

    // 6. Buffer POST-cotización: hora exacta de fin
    const bufferPostCotizacion = quotations.find(q => {
      const end = timeToMinutes(q.endTime)
      return hMin === end
    })
    if (bufferPostCotizacion) return { status: 'buffer', data: bufferPostCotizacion }

    // 7. Ensayo
    const rehearsal = rehearsals.find(r => (r.time ?? (r as any).hora) === time)
    if (rehearsal) return { status: 'rehearsal', data: rehearsal }

    // 8. Buffer ensayo (hora siguiente al ensayo)
    const prevRehearsal = rehearsals.find(r => (r.time ?? (r as any).hora) === prevTime)
    if (prevRehearsal) return { status: 'buffer_rehearsal', data: prevRehearsal }

    // 9. Bloqueo total
    const fullBlock = blocks.find(b => b.type === 'FULL_DATE' || b.type === 'DATE_RANGE')
    if (fullBlock) return { status: 'blocked_full', data: fullBlock }

    // 10. Bloqueo por horas
    const timeBlock = blocks.find(b =>
      b.type === 'TIME_RANGE' && time >= (b.startTime||'') && time < (b.endTime||'')
    )
    if (timeBlock) return { status: 'blocked_partial', data: timeBlock }

    return { status: 'free', data: null }
  }

  const handleMouseDown = (time: string, slotData: any) => {
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      if (slotData.status === 'free') onBlockTime(date, time);
      else if (slotData.status === 'blocked_partial' && isAdmin) onDeleteBlock(slotData.data.id);
    }, 700);
  };

  const handleMouseUp = (time: string, slotData: any) => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (isLongPressRef.current) return;
    if (slotData.status === 'free') {
      onCreateNew(time);
    } else if (slotData.status === 'reserved' || slotData.status === 'reserved_range') {
      const res = slotData.data as Reservation;
      if (isClient && user?.email !== res.clientEmail) return;
      onViewReservation(slotData.data);
    }
  };

  // ─── Status color helpers ─────────────────────────────────────────────────
  const getReservaColors = (res: Reservation) => {
    const s = (res as any).status ?? res.status
    if (s === 'CONFIRMADA') return {
      border: 'border-emerald-300',
      bg:     'bg-emerald-50',
      text:   'text-emerald-800',
      sub:    'text-emerald-600',
      badge:  'bg-emerald-100 text-emerald-700 border-emerald-200',
      label:  'Confirmada',
      dot:    'bg-emerald-500',
    }
    if (s === 'REPROGRAMADA') return {
      border: 'border-[#0c808b]/30',
      bg:     'bg-[#e1f8ff]',
      text:   'text-[#0c808b]',
      sub:    'text-[#0c808b]',
      badge:  'bg-white text-[#0c808b] border-[#0c808b]/30',
      label:  'Reprogramada',
      dot:    'bg-[#0c808b]',
    }
    // PENDIENTE
    return {
      border: 'border-amber-300',
      bg:     'bg-amber-50',
      text:   'text-amber-800',
      sub:    'text-amber-600',
      badge:  'bg-amber-100 text-amber-700 border-amber-200',
      label:  'Pendiente',
      dot:    'bg-amber-500',
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-start shrink-0">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Agenda del Día</h4>
            <h3 className="text-xl font-serif font-bold text-slate-800 capitalize">{dateStr}</h3>
            {isAdmin && (
              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                <Info size={10} /> Mantén presionado para bloquear una hora.
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
          <div className="space-y-2">
            {hours.map(time => {
              const { status, data } = getSlotStatus(time);
              let containerClass = '';
              let content: React.ReactNode = null;

              // ── RESERVED (start hour) ────────────────────────────────────
              if (status === 'reserved') {
                const res   = data as Reservation;
                const clrs  = getReservaColors(res);
                const range = `${res.startTime || res.eventTime} → ${res.endTime}`
                const isMyReservation = !isClient || user?.email === res.clientEmail;
                const isFinalizado    = (res as any).status === 'FINALIZADO' || (res as any).status === 'Finalizado'

                if (isFinalizado) {
                  // ── FINALIZADO slot ──────────────────────────────────────
                  containerClass = `border-blue-300 bg-blue-50 ${isMyReservation ? 'cursor-pointer hover:bg-blue-100' : 'cursor-not-allowed'}`;
                  content = isMyReservation ? (
                    <div className="flex items-center justify-between w-full" onClick={() => onViewReservation(res)}>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
                          <CheckCircle size={14} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-blue-800">{res.clientName}</p>
                          <p className="text-[10px] text-blue-600 uppercase tracking-wide mt-0.5">{res.eventType}</p>
                          <p className="text-[10px] font-mono text-blue-500 mt-0.5">{range}</p>
                          <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold text-blue-600 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full">
                            ✓ Evento Finalizado
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full text-slate-400">
                      <span className="text-[10px] font-bold uppercase flex items-center gap-2"><Lock size={10} /> Reservado</span>
                    </div>
                  );

                } else if (isMyReservation) {
                  // ── PENDIENTE / CONFIRMADA slot ──────────────────────────
                  containerClass = `${clrs.border} ${clrs.bg} cursor-pointer hover:brightness-95 transition-all`;
                  content = (
                    <div className="flex items-center justify-between w-full" onClick={() => onViewReservation(res)}>
                      <div className="flex items-start gap-3">
                        {/* Color dot indicating status */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${clrs.badge} border`}>
                          
                          
                          <User size={14}
                          />
                        </div>
                        <div>
                          {/* CLIENT NAME — prominent */}
                          <p className={`text-sm font-bold ${clrs.text}`}>{res.clientName} </p>
                          <p className={`text-[10px] font-mono mt-0.5 ${clrs.sub}`}>{range}</p>
                          {/* Status badge */}
                          <span className={`inline-flex items-center gap-1 mt-1 text-[9px] font-bold border px-2 py-0.5 rounded-full ${clrs.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${clrs.dot}`} />
                            {clrs.label}
                          </span>
                        </div>
                      </div>
                      <ArrowRight size={16} className={`shrink-0 ${clrs.sub}`} />
                    </div>
                  );
                } else {
                  containerClass = "border-slate-200 bg-slate-100 cursor-not-allowed";
                  content = (
                    <div className="flex items-center justify-center w-full text-slate-400">
                      <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><Lock size={10} /> Reservado</span>
                    </div>
                  );
                }

              // ── RESERVED RANGE (intermediate hours) ─────────────────────
              } else if (status === 'reserved_range') {
                const res  = data as Reservation;
                const clrs = getReservaColors(res);
                const isMyReservation = !isClient || user?.email === res.clientEmail;
                const isFinalizado    = (res as any).status === 'FINALIZADO' || (res as any).status === 'Finalizado'

                if (isFinalizado) {
                  containerClass = "border-blue-100 bg-blue-50/50 cursor-pointer";
                  content = (
                    <div className="flex items-center gap-3 w-full opacity-70" onClick={() => onViewReservation(res)}>
                      <div className="h-full w-0.5 bg-blue-300 rounded-full" />
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">↳ {res.clientName} — En curso</span>
                    </div>
                  );
                } else if (isMyReservation) {
                  containerClass = `${clrs.border.replace('border-', 'border-').replace('300', '100')} ${clrs.bg.replace('50', '50/50')} cursor-pointer`;
                  content = (
                    <div className="flex items-center gap-3 w-full opacity-80" onClick={() => onViewReservation(res)}>
                      <div className={`h-full w-0.5 rounded-full ${clrs.dot}`} />
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${clrs.sub}`}>
                        ↳ {res.clientName} — En curso
                      </span>
                    </div>
                  );
                } else {
                  containerClass = "border-slate-200 bg-slate-100 cursor-not-allowed";
                  content = (
                    <div className="flex items-center justify-center w-full text-slate-400">
                      <span className="text-[10px] font-bold uppercase flex items-center gap-2"><Lock size={10} /> Reservado</span>
                    </div>
                  );
                }

              // ── QUOTE ────────────────────────────────────────────────────
              } else if (status === 'quote') {
                const q = data as Quotation;
                const range = `${q.startTime} → ${q.endTime}`
                if (!isClient) {
                  containerClass = "border-amber-200 bg-amber-50/70 cursor-not-allowed";
                  content = (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
                          <FileText size={13} className="text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-amber-800">{q.clientName || 'Sin nombre'}</p>
                          <p className="text-[10px] text-amber-600 font-mono mt-0.5">{range}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold border border-amber-200 px-2 py-0.5 rounded-full bg-white/60 text-amber-700 uppercase">
                        Cotización
                      </span>
                    </div>
                  );
                } else {
                  containerClass = "border-slate-200 bg-slate-100 cursor-not-allowed";
                  content = (
                    <div className="flex items-center justify-center w-full text-slate-400">
                      <span className="text-[10px] font-bold uppercase flex items-center gap-2"><Lock size={10}/> Reservado</span>
                    </div>
                  );
                }

              // ── REHEARSAL ────────────────────────────────────────────────
              } else if (status === 'rehearsal') {
                const reh      = data as Rehearsal;
                const rehTime  = reh.time ?? (reh as any).hora ?? ''
                const rangeLabel = `${rehTime} → ${addOneHour(rehTime)}`
                containerClass   = "border-slate-200 bg-slate-100 cursor-not-allowed";
                content = isClient ? (
                  <div className="flex items-center justify-center w-full text-slate-400">
                    <span className="text-[10px] font-bold uppercase flex items-center gap-2"><Lock size={10}/> Reservado</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
                        <Music size={13} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-blue-800">Ensayo Programado</p>
                        <p className="text-[10px] font-mono text-blue-500 mt-0.5">{rangeLabel}</p>
                      </div>
                    </div>
                  </div>
                );

              // ── BUFFER ───────────────────────────────────────────────────
              } else if (status === 'buffer' || status === 'buffer_rehearsal') {
                let bufferRange = ''
                if (data) {
                  const d = data as any
                  if (d.endTime) bufferRange = `${d.endTime} → ${addOneHour(d.endTime)}`
                  else if (d.time ?? d.hora) {
                    const t = d.time ?? d.hora
                    bufferRange = `${addOneHour(t)} → ${addOneHour(addOneHour(t))}`
                  }
                }
                containerClass = "border-slate-100 bg-slate-50/80 cursor-not-allowed border-dashed";
                content = isClient ? (
                  <div className="flex items-center justify-center w-full text-slate-400">
                    <span className="text-[10px] font-bold uppercase flex items-center gap-2"><Lock size={10}/> Reservado</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full text-slate-400 opacity-70">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={12} />
                      <span className="text-[10px] font-bold uppercase">Cierre / Transporte</span>
                    </div>
                    {bufferRange && <span className="text-[10px] font-mono">{bufferRange}</span>}
                  </div>
                );

              // ── BLOCKED PARTIAL ──────────────────────────────────────────
              } else if (status === 'blocked_partial') {
                containerClass = "border-red-100 bg-[repeating-linear-gradient(45deg,#fef2f2,#fef2f2_10px,#fee2e2_10px,#fee2e2_20px)] cursor-not-allowed";
                const block = data as CalendarBlock;
                content = isClient ? (
                  <div className="flex items-center justify-center w-full text-red-400">
                    <span className="text-[10px] font-bold uppercase flex items-center gap-2"><Lock size={10}/> Reservado</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-800 w-full">
                    <ShieldAlert size={14} />
                    <span className="text-[10px] font-bold uppercase truncate">{block.reason}</span>
                  </div>
                );

              // ── BLOCKED FULL ─────────────────────────────────────────────
              } else if (status === 'blocked_full') {
                containerClass = "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed";
                content = (
                  <div className="flex items-center gap-2 text-slate-400 w-full justify-center">
                    <Lock size={12} />
                    <span className="text-[10px] font-bold uppercase">No disponible</span>
                  </div>
                );

              // ── FREE ─────────────────────────────────────────────────────
              } else {
                containerClass = "border-slate-100 hover:border-primary-200 hover:bg-primary-50/30 hover:shadow-sm bg-white cursor-pointer";
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
                  <div className="flex-1 flex items-center min-w-0">{content}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
          <button
            onClick={() => onCreateNew()}
            className="w-full py-4 bg-[#dc2626] hover:bg-red-700 text-white rounded-xl text-sm font-bold uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
          >
            <Plus size={18} strokeWidth={3} />
            {isClient ? 'Solicitar Reserva' : 'Crear Reserva'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};