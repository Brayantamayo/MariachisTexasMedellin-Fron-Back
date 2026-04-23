import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, MapPin, User, Wallet, FileText, Mail, Phone, Music, Star, Package, Check, Ban, CalendarClock } from 'lucide-react';
import { Reservation, Song, UserRole } from '@/types';
import { repertoireService } from '../../repertoire/services/repertoireService';
import { servicesService } from '@/src/features/servicio/services/servicesService';
import { useAuth } from '@/shared/contexts/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  onFinalize?: (id: string) => void;
  onCancel?: (id: string, motivo: string) => void;
  onReschedule?: (reservation: Reservation) => void;
}

// Limpiar __CONTACTO__ de notas
const limpiarNotas = (notas: string | null | undefined): string => {
  if (!notas) return ''
  return notas.split('\n').filter(l => !l.startsWith('__CONTACTO__:')).join('\n').trim()
}

// Estados del backend en mayúsculas → label y estilo
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'PENDIENTE':  return 'bg-yellow-50 text-yellow-600 border-yellow-100'
    case 'CONFIRMADA': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
    case 'ANULADA':    return 'bg-red-50 text-red-600 border-red-100'
    case 'REPROGRAMADA': return 'bg-[#e1f8ff] text-[#0c808b] border-[#0c808b]/30'
    // Legacy por si acaso
    case 'Pendiente':  return 'bg-yellow-50 text-yellow-600 border-yellow-100'
    case 'Confirmado': return 'bg-emerald-50 text-emerald-600 border-emerald-100'
    case 'Finalizado': return 'bg-blue-50 text-blue-600 border-blue-100'
    case 'Anulado':    return 'bg-red-50 text-red-600 border-red-100'
    default:           return 'bg-slate-50 text-slate-600'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDIENTE':  return 'Pendiente'
    case 'CONFIRMADA': return 'Confirmada'
    case 'ANULADA':    return 'Anulada'
    case 'REPROGRAMADA': return 'Reprogramada'
    default:           return status
  }
}

export const ReservaDetailModal: React.FC<Props> = ({ isOpen, onClose, reservation, onFinalize, onCancel, onReschedule }) => {
  const { user } = useAuth();
  const [allSongs,    setAllSongs]    = useState<Song[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState('');

  useEffect(() => {
    if (isOpen) {
      repertoireService.getSongs().then(setAllSongs)
      servicesService.getServices().then(setAllServices)
      setShowCancelConfirm(false);
      setCancelMotivo('');
    }
  }, [isOpen])

  if (!isOpen || !reservation) return null;

  const totalAmount    = reservation.totalAmount    || 0
  const paidAmount     = reservation.paidAmount     || 0
  const remainingBalance = totalAmount - paidAmount
  const progressPercent  = totalAmount > 0 ? Math.min((paidAmount / totalAmount) * 100, 100) : 0
  const isActive = !['ANULADA', 'Anulado', 'Finalizado'].includes(reservation.status)
  const isClient = user?.role === UserRole.CLIENTE
  const isAdmin  = user?.role === UserRole.ADMIN || user?.role === UserRole.EMPLEADO
  const canActOnReservation = isActive && isAdmin;

  const selectedSongs = allSongs.filter(s => reservation.repertoireIds?.includes(s.id))

  const contratados = (reservation.selectedServices || [])
    .filter(item => item.quantity > 0)
    .map(item => {
      const service = allServices.find(s => String(s.id) === item.serviceId)
      return service ? { ...service, quantity: item.quantity } : null
    })
    .filter(Boolean)

  // Limpiar notas — quitar __CONTACTO__
  const notasLimpias = limpiarNotas(reservation.notes)

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-8 pb-4 bg-white border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-serif font-bold text-slate-800 uppercase">Reserva #{reservation.id}</h3>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusStyle(reservation.status)}`}>
                {getStatusLabel(reservation.status)}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Creada el {new Date(reservation.createdAt).toLocaleDateString('es-CO')}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30 flex flex-col md:flex-row">

          {/* Columna Izquierda */}
          <div className="w-full md:w-[60%] p-8 space-y-8 border-b md:border-b-0 md:border-r border-slate-100 bg-white">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              {/* Evento */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Star size={14} className="text-primary-600" /> Evento
                </h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Fecha y Hora</p>
                    <p className="font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                      <Calendar size={14} className="text-slate-400" />
                      {reservation.eventDate}
                      <span className="text-slate-300">|</span>
                      <Clock size={14} className="text-slate-400" />
                      {reservation.startTime || reservation.eventTime}
                      {(reservation.endTime) && (
                        <><span className="text-slate-300">→</span>{reservation.endTime}</>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Ocasión</p>
                    <p className="text-sm text-slate-700 font-medium">{reservation.eventType}</p>
                  </div>
                  {reservation.homenajeado && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Homenajeado</p>
                      <p className="text-sm text-slate-700 font-medium">{reservation.homenajeado}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Cliente */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <User size={14} className="text-primary-600" /> Cliente
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <User size={16} className="text-slate-400 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{reservation.clientName}</p>
                      <p className="text-[10px] text-slate-400">Cliente Principal</p>
                    </div>
                  </div>
                  {reservation.clientPhone && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Phone size={16} className="text-slate-400" />{reservation.clientPhone}
                    </div>
                  )}
                  {reservation.secondaryPhone && (
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <Phone size={16} className="text-slate-400" />{reservation.secondaryPhone}
                    </div>
                  )}
                  {reservation.clientEmail && (
                    <div className="flex items-center gap-3 text-sm text-slate-600 truncate">
                      <Mail size={16} className="text-slate-400" />{reservation.clientEmail}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Ubicación */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <MapPin size={14} className="text-primary-600" /> Ubicación
              </h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-800 text-sm">{reservation.location || reservation.address}</p>
                {reservation.address && reservation.address !== reservation.location && (
                  <p className="text-xs text-slate-500 mt-1">{reservation.address}</p>
                )}
              </div>
            </div>

            {/* Servicios Contratados */}
            {contratados.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Package size={14} className="text-primary-600" /> Servicios Contratados
                </h4>
                <div className="space-y-2">
                  {contratados.map((service: any) => (
                    <div key={service.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                          <Check size={12} className="text-orange-600" strokeWidth={3} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">{service.nombre}</p>
                          <p className="text-[10px] text-slate-400">${Number(service.precio).toLocaleString()} c/u</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-500">x{service.quantity}</p>
                        <p className="text-sm font-bold text-orange-600">
                          ${(Number(service.precio) * service.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Repertorio */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Music size={14} className="text-primary-600" /> Repertorio
                </h4>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                  {selectedSongs.length} Canciones
                </span>
              </div>
              {selectedSongs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedSongs.map(song => (
                    <div key={song.id} className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50/50">
                      <Music size={12} className="text-slate-400 flex-shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-700 truncate">{song.title}</p>
                        <p className="text-[9px] text-slate-400 truncate">{song.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No hay canciones seleccionadas.</p>
              )}
            </div>

            {/* Notas — limpias sin __CONTACTO__ */}
            {notasLimpias && (
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-yellow-800 text-sm">
                <p className="font-bold text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <FileText size={10} /> Notas Adicionales
                </p>
                {notasLimpias}
              </div>
            )}

          </div>

          {/* Columna Derecha: Finanzas */}
          <div className="w-full md:w-[40%] p-8 bg-slate-50 flex flex-col border-l border-slate-200">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Wallet size={16} /> Finanzas y Pagos
            </h4>

            {/* Resumen Financiero */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm text-slate-500">Total Contrato</span>
                <span className="text-xl font-serif font-bold text-slate-800">${totalAmount.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${reservation.status === 'CONFIRMADA' || reservation.status === 'Confirmado' ? 'bg-emerald-500' : 'bg-primary-500'}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span className="text-emerald-600">Pagado: ${paidAmount.toLocaleString()}</span>
                <span className="text-red-500">Pendiente: ${remainingBalance.toLocaleString()}</span>
              </div>
            </div>

            {/* Historial de Pagos */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[250px] custom-scrollbar">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Historial de Pagos</h5>
              {!reservation.payments?.length ? (
                <div className="text-center py-8 text-slate-400 text-sm italic border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  No se han registrado pagos.
                </div>
              ) : (
                reservation.payments.map((pay) => (
                  <div key={pay.id} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="font-bold text-slate-700 text-sm">${pay.amount.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                        {new Date(pay.date).toLocaleDateString('es-CO')} • {pay.method}
                      </p>
                    </div>
                    <span className="text-[10px] bg-slate-50 px-2 py-1 rounded text-slate-500 font-bold border border-slate-100">
                      {pay.method}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3">

          {/* Confirmación inline de cancelación */}
          {showCancelConfirm ? (
            <div className="flex flex-1 items-center gap-3 flex-wrap">
              <input
                type="text"
                value={cancelMotivo}
                onChange={e => setCancelMotivo(e.target.value)}
                placeholder="Motivo de cancelación (opcional)"
                className="flex-1 min-w-[200px] px-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
              <button
                onClick={() => { onCancel?.(reservation.id, cancelMotivo); onClose(); }}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Confirmar Cancelación
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Volver
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-3 flex-wrap">
                {canActOnReservation && onCancel && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
                  >
                    <Ban size={14} /> Cancelar Serenata
                  </button>
                )}
                {canActOnReservation && onReschedule && (
                  <button
                    onClick={() => { onReschedule(reservation); onClose(); }}
                    className="flex items-center gap-2 px-6 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
                  >
                    <CalendarClock size={14} /> Reprogramar
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="px-8 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-900 transition-colors"
              >
                Cerrar
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};