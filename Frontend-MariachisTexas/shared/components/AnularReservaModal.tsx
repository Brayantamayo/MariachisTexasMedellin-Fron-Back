import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldAlert, Calendar, Clock } from 'lucide-react';
import { Reservation } from '@/types';

interface Props {
  isOpen: boolean;
  reservation: Reservation | null;
  onClose: () => void;
  onConfirm: (id: string, motivo: string) => void;
}

export const AnularReservaModal: React.FC<Props> = ({
  isOpen,
  reservation,
  onClose,
  onConfirm,
}) => {
  const [motivo, setMotivo] = useState('');

  // Limpiar el motivo cada vez que se abre el modal
  useEffect(() => {
    if (isOpen) setMotivo('');
  }, [isOpen]);

  if (!isOpen || !reservation) return null;

  const handleConfirm = () => {
    onConfirm(reservation.id, motivo.trim());
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-slate-200 animate-fade-in-up">

        {/* Franja superior roja */}
        <div className="h-1 w-full bg-gradient-to-r from-red-400 via-red-500 to-red-400" />

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="p-7">

          {/* Ícono + título */}
          <div className="flex items-start gap-4 mb-5">
            <div className="shrink-0 w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center ring-4 ring-red-50">
              <ShieldAlert className="text-red-500" size={20} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-tight">
                Anular reserva
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Esta acción es irreversible y liberará el horario.
              </p>
            </div>
          </div>

          {/* Chip de la reserva */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 mb-5 flex items-center gap-3">
            <span className="text-xs font-bold text-primary-600 bg-primary-50 border border-primary-100 px-2 py-1 rounded-lg shrink-0">
              #{reservation.id}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">
                {reservation.clientName}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar size={10} />
                  {reservation.eventDate}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {reservation.startTime} — {reservation.endTime}
                </span>
              </div>
            </div>
          </div>

          {/* Campo de motivo */}
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Motivo de anulación
            <span className="ml-1 font-normal normal-case tracking-normal text-slate-300">(opcional)</span>
          </label>
          <textarea
            rows={3}
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Ej: El cliente canceló por inconvenientes de último momento..."
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 placeholder-slate-300 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-100 transition-all"
          />

          {/* Botones */}
          <div className="flex gap-2.5 mt-5">
            <button
              onClick={onClose}
              className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="flex-[1.4] bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md shadow-red-900/20 transition-all"
            >
              Confirmar anulación
            </button>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};