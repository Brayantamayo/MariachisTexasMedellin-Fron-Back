import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CalendarClock, AlertCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Reservation } from '@/types';
import { blockService } from '../../bloqueos/services/blockService';
import { reservaService } from '../services/reservaService';
import { CustomDatePicker } from '@/shared/components/CustomDatePicker';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  onSave: (id: string, data: { eventDate: string; startTime: string; endTime: string }) => Promise<void>;
}

export const ReprogramarReservaModal: React.FC<Props> = ({
  isOpen,
  onClose,
  reservation,
  onSave,
}) => {
  const [eventDate,      setEventDate]      = useState('');
  const [startTime,      setStartTime]      = useState('');
  const [endTime,        setEndTime]        = useState('');
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [blockStatus,    setBlockStatus]    = useState<any>({ isBlocked: false });
  const [saving,         setSaving]         = useState(false);
  const [globalError,    setGlobalError]    = useState<string | null>(null);

  // ─── Calcular hora fin automáticamente (igual que en el form original) ──────
  const calcEndTime = (start: string, extraHours = 0): string => {
    if (!start) return '';
    const [h, m]   = start.split(':').map(Number);
    const totalMin = h * 60 + m + (1 + extraHours) * 60;
    const newH     = Math.floor(totalMin / 60) % 24;
    const newM     = totalMin % 60;
    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
  };

  // ─── Detectar horas extra de la reserva original ─────────────────────────
  const getExtraHours = (): number => {
    if (!reservation) return 0;
    const start = reservation.startTime || reservation.eventTime || '';
    const end   = reservation.endTime   || '';
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin   = eh * 60 + em;
    const durMin   = endMin >= startMin ? endMin - startMin : 24 * 60 - startMin + endMin;
    return Math.max(0, Math.floor(durMin / 60) - 1);
  };

  const extraHours = getExtraHours();

  // ─── Inicializar con la fecha/hora actual de la reserva ──────────────────
  useEffect(() => {
    if (!isOpen || !reservation) return;
    setGlobalError(null);
    setSaving(false);

    const initDate = reservation.eventDate || '';
    const initTime = reservation.startTime || reservation.eventTime || '';

    setEventDate(initDate);
    setStartTime(initTime);
    setEndTime(reservation.endTime || calcEndTime(initTime, extraHours));

    if (initDate) loadDateData(initDate);
  }, [isOpen, reservation]);

  // ─── Cargar horas disponibles y estado de bloqueo ────────────────────────
const loadDateData = async (date: string) => {
  try {
    const [status, hours] = await Promise.all([
      blockService.checkDateStatus(date),
      reservaService.getAvailableHours(date, reservation?.id),
    ]);
    setBlockStatus(status);

    let filtered = hours;
    if (!status.isBlocked && status.hasPartialBlocks && status.blockedRanges) {
      const blockedRanges = status.blockedRanges; // ← extraer a variable local
      filtered = hours.filter((h: string) =>
        !blockedRanges.some((r: any) => h >= r.start && h < r.end)
      );
    }
    setAvailableHours(filtered);
  } catch {
    setAvailableHours([]);
  }
};

  const handleDateChange = (_name: string, value: string) => {
    setEventDate(value);
    setStartTime('');
    setEndTime('');
    setGlobalError(null);
    if (value) loadDateData(value);
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setStartTime(val);
    setEndTime(calcEndTime(val, extraHours));
    setGlobalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (!eventDate) { setGlobalError('Debes seleccionar una nueva fecha.'); return; }
    if (!startTime) { setGlobalError('Debes seleccionar una hora de inicio.'); return; }
    if (!endTime)   { setGlobalError('No se pudo calcular la hora de fin.'); return; }

    if (blockStatus.isBlocked) {
      setGlobalError(`La fecha está bloqueada: "${blockStatus.reason || 'No disponible'}".`);
      return;
    }

    // Verificar que no sea exactamente la misma fecha y hora
    const sameDateAndTime =
      eventDate === reservation?.eventDate &&
      startTime === (reservation?.startTime || reservation?.eventTime);

    if (sameDateAndTime) {
      setGlobalError('La nueva fecha y hora deben ser diferentes a las actuales.');
      return;
    }

    setSaving(true);
    try {
      await onSave(reservation!.id, { eventDate, startTime, endTime });
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Error al reprogramar la reserva.';
      setGlobalError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setGlobalError(null);
    onClose();
  };

  const today = new Date().toISOString().split('T')[0];

  if (!isOpen || !reservation) return null;

  const currentDateStr   = reservation.eventDate;
  const currentStartTime = reservation.startTime || reservation.eventTime;
  const currentEndTime   = reservation.endTime;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shadow-lg shadow-red-900/10">
              <CalendarClock className="text-red-600" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">
                Reprogramar Reserva
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Reserva #{reservation.id} · {reservation.clientName}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error global */}
        {globalError && (
          <div className="mx-6 mt-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
            <AlertCircle size={18} className="flex-shrink-0" />
            {globalError}
          </div>
        )}

        {/* Cuerpo del formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar">

          {/* Fecha y hora actuales (solo lectura) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Fecha y hora actuales
            </p>
            <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
              <span className="font-mono bg-white border border-slate-200 rounded-lg px-3 py-1.5">
                {currentDateStr}
              </span>
              <span className="text-slate-400">|</span>
              <span className="font-mono bg-white border border-slate-200 rounded-lg px-3 py-1.5">
                {currentStartTime}
              </span>
              {currentEndTime && (
                <>
                  <span className="text-slate-400">→</span>
                  <span className="font-mono bg-white border border-slate-200 rounded-lg px-3 py-1.5">
                    {currentEndTime}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Bloqueo total */}
          {blockStatus.isBlocked && (
            <div className="flex items-start gap-3 bg-red-50 p-4 rounded-xl border border-red-100 text-red-600">
              <ShieldAlert size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold uppercase tracking-wide">Fecha Bloqueada</p>
                <p className="text-xs mt-1 opacity-90">{blockStatus.reason}</p>
              </div>
            </div>
          )}

          {/* Bloqueo parcial */}
          {!blockStatus.isBlocked && blockStatus.hasPartialBlocks && (
            <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-700">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold uppercase tracking-wide">Disponibilidad Limitada</p>
                <p className="text-xs mt-1 opacity-90">Algunas horas no están disponibles.</p>
              </div>
            </div>
          )}

          {/* Nueva fecha */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">
              Nueva Fecha <span className="text-red-500">*</span>
            </label>
            <CustomDatePicker
              name="eventDate"
              label="NUEVA FECHA"
              value={eventDate}
              onChange={handleDateChange}
              minDate={today}
            />
          </div>

          {/* Nueva hora */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">
              Nueva Hora de Inicio <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={startTime}
                onChange={handleStartTimeChange}
                disabled={!eventDate || blockStatus.isBlocked}
                className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!eventDate ? 'Primero selecciona una fecha' : 'Seleccionar hora'}
                </option>
                {availableHours.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
                {/* Mostrar hora actual si no está en la lista (para que no quede en blanco) */}
                {startTime && !availableHours.includes(startTime) && (
                  <option value={startTime}>{startTime} (Actual)</option>
                )}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>

          {/* Hora de fin calculada automáticamente */}
          {endTime && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <CalendarClock size={16} className="text-red-600 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest">
                  Hora de fin calculada
                </p>
                <p className="text-sm font-bold text-red-800 font-mono">
                  {endTime}
                  {extraHours > 0 && (
                    <span className="text-[10px] font-normal text-red-600 ml-2">
                       (1h base + {extraHours}h extra)
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Aviso de que el abono se mantiene */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            <p className="text-xs text-emerald-700 font-medium">
              ✅ Los pagos realizados se mantienen. Solo se actualiza la fecha y hora del evento.
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold uppercase text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || blockStatus.isBlocked || !startTime || !eventDate}
              className="flex-[2] py-3 bg-red-500 hover:bg-red-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all hover:-translate-y-0.5 disabled:hover:translate-y-0 flex items-center justify-center gap-2 shrink-0"
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Guardando...
                </>
              ) : (
                <>
                  <CalendarClock size={16} />
                  Confirmar Reprogramación
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};