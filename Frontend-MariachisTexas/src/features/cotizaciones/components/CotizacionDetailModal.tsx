import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, MapPin, User, Music, DollarSign, Mail, Phone, Tag, Package } from 'lucide-react';
import { Quotation, Song, Service } from '@/types';
import { repertoireService } from '../../repertoire/services/repertoireService';
import { servicesService } from '@/src/features/servicio/services/servicesService.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation | null;
}

export const CotizacionDetailModal: React.FC<Props> = ({ isOpen, onClose, quotation }) => {
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [allServices,   setAllServices]   = useState<Service[]>([]);

  useEffect(() => {
    if (isOpen && quotation) {
      repertoireService.getSongs().then(allSongs => {
        setSelectedSongs(allSongs.filter(s => quotation.repertoireIds?.includes(s.id)));
      });
      servicesService.getServices().then(setAllServices);
    }
  }, [isOpen, quotation]);

  if (!isOpen || !quotation) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EN_ESPERA':  return 'bg-yellow-50 text-yellow-600 border-yellow-200';
      case 'CONVERTIDA': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'ANULADA':    return 'bg-slate-50 text-slate-500 border-slate-200';
      default:           return 'bg-slate-50 text-slate-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'EN_ESPERA':  return 'En Espera';
      case 'CONVERTIDA': return 'Convertida';
      case 'ANULADA':    return 'Anulada';
      default:           return status;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-serif font-bold text-slate-800">Cotización</h3>
              <span className="font-mono text-sm text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">#{quotation.id}</span>
              <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(quotation.status)}`}>
                {getStatusLabel(quotation.status)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
              <Calendar size={12} /> Generada el {new Date(quotation.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col md:flex-row min-h-full">

            {/* ── COLUMNA IZQUIERDA ─────────────────────────────────────── */}
            <div className="w-full md:w-1/2 p-8 space-y-6 border-b md:border-b-0 md:border-r border-slate-100">

              {/* Cliente */}
              <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <User size={14} className="text-primary-600" /> Cliente
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400"><User size={14} /></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Nombre</p>
                      <p className="font-bold text-slate-700 text-sm">{quotation.clientName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400"><Phone size={14} /></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Teléfono Principal</p>
                      <p className="font-bold text-slate-700 text-sm">{quotation.clientPhone}</p>
                    </div>
                  </div>
                  {quotation.secondaryPhone && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400"><Phone size={14} /></div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Teléfono Secundario</p>
                        <p className="font-bold text-slate-700 text-sm">{quotation.secondaryPhone}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400"><Mail size={14} /></div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                      <p className="font-bold text-slate-700 text-sm truncate">{quotation.clientEmail}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Valor Cotizado</p>
                  <p className="text-[10px] text-slate-500">Moneda: COP</p>
                </div>
                <p className="text-3xl font-serif font-bold tracking-tight flex items-center gap-1">
                  <DollarSign size={24} className="text-emerald-500" />
                  {quotation.totalAmount.toLocaleString()}
                </p>
              </div>

              {/* ✅ Repertorio — debajo del total */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Music size={14} className="text-primary-600" /> Repertorio Solicitado
                </h4>

                {selectedSongs.length > 0 ? (
                  <div className="space-y-2 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
                    {selectedSongs.map(song => (
                      <div key={song.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                          <Music size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">{song.title}</p>
                          <p className="text-[10px] text-slate-400 uppercase">{song.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <p className="text-xs text-slate-400 italic">No se seleccionaron canciones específicas.</p>
                  </div>
                )}

                
              </div>
            </div>

            {/* ── COLUMNA DERECHA ───────────────────────────────────────── */}
            <div className="w-full md:w-1/2 p-8 space-y-6 bg-slate-50">

              {/* Evento */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Calendar size={14} className="text-primary-600" /> Evento
                </h4>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                  {quotation.homenajeado && (
                    <div className="pb-4 border-b border-slate-50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Homenajeado</p>
                      <p className="font-bold text-slate-800 flex items-center gap-2"><User size={12} /> {quotation.homenajeado}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo</p>
                      <p className="font-bold text-slate-800 flex items-center gap-2"><Tag size={12} /> {quotation.eventType}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha</p>
                      <p className="font-bold text-slate-800 flex items-center gap-2"><Calendar size={12} /> {quotation.eventDate}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Horario</p>
                      <p className="font-bold text-slate-800 flex items-center gap-2"><Clock size={12} /> {quotation.startTime} - {quotation.endTime}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Ubicación</p>
                    <p className="font-bold text-slate-800 flex items-center gap-2"><MapPin size={12} /> {quotation.location}</p>
                  </div>
                </div>
              </div>

              {/* Servicios */}
              {quotation.selectedServices && quotation.selectedServices.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Package size={14} className="text-primary-600" /> Servicios Contratados
                  </h4>
                  <div className="space-y-2">
                    {quotation.selectedServices.map(item => {
                      const service = allServices.find(s => String(s.id) === item.serviceId);
                      if (!service) return null;
                      return (
                        <div key={item.serviceId} className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                          <div>
                            <p className="text-sm font-bold text-slate-700">{service.nombre}</p>
                            <p className="text-[10px] text-slate-400">${Number(service.precio).toLocaleString()} c/u · x{item.quantity}</p>
                          </div>
                          <p className="text-sm font-bold text-orange-600">
                            ${(Number(service.precio) * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notas del evento */}
              {quotation.notes && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Tag size={14} className="text-primary-600" /> Notas del Evento
                  </h4>
                  <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-sm text-slate-600 italic">"{quotation.notes}"</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-end shrink-0">
          <button onClick={onClose}
            className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-sm">
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};