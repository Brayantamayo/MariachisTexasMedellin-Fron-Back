import React from 'react';
import { Zap, Clock, User as UserIcon, MapPin as MapPinIcon, Info } from 'lucide-react';
import { format12h } from '@/shared/utils/time';

interface UpcomingReservationsBannerProps {
  reservations: any[];
  onView: (res: any) => void;
}

export const UpcomingReservationsBanner: React.FC<UpcomingReservationsBannerProps> = ({ reservations, onView }) => {
  const today = new Date();
  const twoDaysFromNow = new Date();
  twoDaysFromNow.setDate(today.getDate() + 2);

  const upcoming = reservations.filter(r => {
    if (r.status === 'ANULADA' || r.status === 'FINALIZADO') return false;
    const eventDate = new Date(r.eventDate + 'T00:00:00');
    return eventDate >= new Date(today.toDateString()) && eventDate <= twoDaysFromNow;
  });

  if (!upcoming.length) return null;

  return (
    <div className="mb-6 animate-fade-in px-4">
      <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
            <Zap size={20} className="text-white" fill="currentColor" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter">
              Próximas <span className="text-red-500">Serenatas</span>
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{upcoming.length} eventos pronto</p>
          </div>
        </div>

        <div className="h-px md:h-10 w-full md:w-px bg-slate-200" />

        <div className="flex-1 flex gap-3 overflow-x-auto pb-2 md:pb-0 custom-scrollbar-hide">
          {upcoming.map(res => (
            <div 
              key={res.id} 
              onClick={() => onView(res)}
              className="flex items-center gap-3 bg-slate-50 hover:bg-red-50 border border-slate-100 p-2.5 rounded-2xl transition-all cursor-pointer whitespace-nowrap min-w-[200px]"
            >
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-100 shadow-sm shrink-0">
                <span className="text-[10px] font-black text-red-600">{res.eventDate.split('-')[2]}</span>
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-700 truncate">{res.clientName}</p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {format12h(res.startTime || res.eventTime)}
                  {res.endTime && <span className="mx-1">→ {format12h(res.endTime)}</span>}
                  <span className="mx-2">•</span>
                  {res.location?.split(',')[0] || res.address?.split(',')[0]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
