
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, MapPin, User, Wallet, FileText, Mail, Phone, Music, Star, Map, CheckSquare } from 'lucide-react';
import { Reservation, ReservationStatus, Song, UserRole } from '@/types';
import { repertoireService } from '../../repertoire/services/repertoireService';
import { useAuth } from '@/shared/contexts/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  onFinalize?: (id: string) => void;
}

export const ReservaDetailModal: React.FC<Props> = ({ isOpen, onClose, reservation, onFinalize }) => {
  const { user } = useAuth();
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const isClient = user?.role === UserRole.CLIENTE;

  // Cargar canciones para mostrar nombres en lugar de IDs
  useEffect(() => {
      if (isOpen) {
          repertoireService.getSongs().then(setAllSongs);
      }
  }, [isOpen]);

  if (!isOpen || !reservation) return null;

  const remainingBalance = reservation.totalAmount - reservation.paidAmount;
  const progressPercent = Math.min((reservation.paidAmount / reservation.totalAmount) * 100, 100);
  const isActive = reservation.status !== 'Finalizado' && reservation.status !== 'Anulado';

  const getStatusStyle = (status: ReservationStatus) => {
    switch (status) {
        case 'Pendiente': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
        case 'Confirmado': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        case 'Finalizado': return 'bg-blue-50 text-blue-600 border-blue-100';
        case 'Anulado': return 'bg-red-50 text-red-600 border-red-100';
        default: return 'bg-slate-50 text-slate-600';
    }
  };
  
  // Obtener objetos de canciones seleccionadas
  const selectedSongs = allSongs.filter(s => reservation.repertoireIds?.includes(s.id));

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">
        
        {/* Header con Estado */}
        <div className="flex items-center justify-between p-8 pb-4 bg-white border-b border-slate-100">
          <div>
              <div className="flex items-center gap-3 mb-2">
                 <h3 className="text-2xl font-serif font-bold text-slate-800 tracking-wide uppercase">
                    Reserva #{reservation.id}
                 </h3>
                 <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusStyle(reservation.status)}`}>
                    {reservation.status}
                 </span>
              </div>
              <p className="text-xs text-slate-500 font-medium tracking-wide">
                  Creada el {new Date(reservation.createdAt).toLocaleDateString()}
              </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Content - Two Columns */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30 flex flex-col md:flex-row">
            
            {/* Columna Izquierda: Información Completa */}
            <div className="w-full md:w-[60%] p-8 space-y-8 border-b md:border-b-0 md:border-r border-slate-100 bg-white">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Event Info */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Star size={14} className="text-primary-600" /> Evento
                        </h4>
                        
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Fecha y Hora</p>
                                <p className="font-bold text-slate-800 flex items-center gap-2">
                                    <Calendar size={14} className="text-slate-400" />
                                    {reservation.eventDate} 
                                    <span className="text-slate-300">|</span> 
                                    <Clock size={14} className="text-slate-400" />
                                    {reservation.eventTime}
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

                    {/* Client Info */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <User size={14} className="text-primary-600" /> Cliente
                        </h4>
                        
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5">
                                    <User size={16} className="text-slate-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">{reservation.clientName}</p>
                                    <p className="text-[10px] text-slate-400">Cliente Principal</p>
                                </div>
                            </div>
                            
                            {reservation.clientPhone && (
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Phone size={16} className="text-slate-400" />
                                    {reservation.clientPhone}
                                </div>
                            )}
                            {reservation.secondaryPhone && (
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Phone size={16} className="text-slate-400" />
                                    {reservation.secondaryPhone}
                                </div>
                            )}
                            
                            {reservation.clientEmail && (
                                <div className="flex items-center gap-3 text-sm text-slate-600 truncate" title={reservation.clientEmail}>
                                    <Mail size={16} className="text-slate-400" />
                                    {reservation.clientEmail}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-100 w-full"></div>

                {/* Location Info */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <MapPin size={14} className="text-primary-600" /> Ubicación
                    </h4>
                    <div className="flex flex-wrap gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                        {reservation.homenajeado && (
                            <div className="w-full pb-3 mb-3 border-b border-slate-200">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Homenajeado</p>
                                <p className="font-bold text-slate-800 flex items-center gap-2"><User size={12}/> {reservation.homenajeado}</p>
                            </div>
                        )}
                        <div className="flex-1 min-w-[200px]">
                            <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                {reservation.location}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">{reservation.address}</p>
                        </div>
                        {reservation.neighborhood && (
                            <div className="px-3 py-1 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 font-medium shadow-sm">
                                {reservation.neighborhood}
                            </div>
                        )}

                    </div>
                </div>

                {/* Repertoire Info */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Music size={14} className="text-primary-600" /> Repertorio Seleccionado
                        </h4>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                            {selectedSongs.length} Canciones
                        </span>
                    </div>
                    
                    {selectedSongs.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {selectedSongs.map(song => (
                                <div key={song.id} className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50/50">
                                    <Music size={12} className="text-slate-400" />
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-bold text-slate-700 truncate">{song.title}</p>
                                        <p className="text-[9px] text-slate-400 truncate">{song.artist}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 italic">No hay canciones seleccionadas específicamente.</p>
                    )}
                </div>

                {/* Notas */}
                {reservation.notes && (
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-yellow-800 text-sm">
                        <p className="font-bold text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                            <FileText size={10} /> Notas Adicionales
                        </p>
                        {reservation.notes}
                    </div>
                )}

            </div>

            {/* Columna Derecha: Pagos y Finanzas */}
            <div className="w-full md:w-[40%] p-8 bg-slate-50 flex flex-col border-l border-slate-200 shadow-inner">
                
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Wallet size={16} /> Finanzas y Pagos
                </h4>

                {/* Resumen Financiero */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-sm text-slate-500">Total Contrato</span>
                        <span className="text-xl font-serif font-bold text-slate-800">${reservation.totalAmount.toLocaleString()}</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${reservation.status === 'Confirmado' ? 'bg-emerald-500' : 'bg-primary-500'}`} 
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>

                    <div className="flex justify-between text-xs font-bold">
                        <span className="text-emerald-600">Pagado: ${reservation.paidAmount.toLocaleString()}</span>
                        <span className="text-red-500">Pendiente: ${remainingBalance.toLocaleString()}</span>
                    </div>
                </div>

                {/* Lista de Pagos */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-6 max-h-[250px] custom-scrollbar">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Historial de Pagos</h5>
                    {reservation.payments.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-sm italic border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            No se han registrado pagos.
                        </div>
                    ) : (
                        reservation.payments.map((pay) => (
                            <div key={pay.id} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm">
                                <div>
                                    <p className="font-bold text-slate-700 text-sm">${pay.amount.toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                                        {new Date(pay.date).toLocaleDateString()} • {pay.type}
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

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-8 py-3 bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-900 transition-colors"
            >
                Cerrar Detalle
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
