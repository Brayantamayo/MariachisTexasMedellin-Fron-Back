import React from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, MapPin, User, Music, DollarSign, Mail, Phone, Tag, Package, CreditCard, Download } from 'lucide-react';
import { Sale } from '../services/ventaService';
import { format12h } from '@/shared/utils/time';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onDownload: (id: string) => void;
}

export const VentaDetailModal: React.FC<Props> = ({ isOpen, onClose, sale, onDownload }) => {
  if (!isOpen || !sale) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmado': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Finalizado': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Anulado':    return 'bg-slate-50 text-slate-500 border-slate-200';
      default:           return 'bg-slate-50 text-slate-600 border-slate-200';
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
              <h3 className="text-xl font-serif font-bold text-slate-800 uppercase tracking-tight">Venta</h3>
              <span className="font-mono text-sm text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">#{sale.id}</span>
              <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(sale.status)}`}>
                {sale.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
              <Calendar size={12} /> Generada el {sale.date}
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
                      <p className="font-bold text-slate-700 text-sm">{sale.clientName}</p>
                    </div>
                  </div>
                  
                  {sale.clientPhone && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400"><Phone size={14} /></div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Teléfono Principal</p>
                        <p className="font-bold text-slate-700 text-sm">{sale.clientPhone}</p>
                      </div>
                    </div>
                  )}

                  {sale.secondaryPhone && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400"><Phone size={14} /></div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Teléfono Secundario</p>
                        <p className="font-bold text-slate-700 text-sm">{sale.secondaryPhone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400"><Mail size={14} /></div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                      <p className="font-bold text-slate-700 text-sm truncate">{sale.clientEmail || 'No registrado'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Monto Total</p>
                  <p className="text-[10px] text-slate-500">Moneda: COP</p>
                </div>
                <p className="text-3xl font-serif font-bold tracking-tight flex items-center gap-1">
                  <DollarSign size={24} className="text-emerald-500" />
                  {sale.amount.toLocaleString()}
                </p>
              </div>

              {/* Abonos */}
              {sale.abonos && sale.abonos.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <CreditCard size={14} className="text-primary-600" /> Historial de Abonos
                  </h4>
                  <div className="space-y-3">
                    {sale.abonos.map((abono, i) => (
                      <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-5">
                          <CreditCard size={40} />
                        </div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Abono #{i+1}</p>
                            <p className="text-sm font-bold text-slate-700">{new Date(abono.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                          </div>
                          <p className="text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                            + ${abono.amount.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded">
                            <Tag size={10} /> {abono.method}
                          </div>
                        </div>
                        {abono.notes && (
                          <p className="text-[10px] text-slate-400 italic mt-2 border-t border-slate-50 pt-2">
                            "{abono.notes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Resumen de Pago */}
                  <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="flex justify-between items-center text-xs font-bold text-emerald-800">
                      <span>Total Abonado:</span>
                      <span>${sale.abonos.reduce((sum, a) => sum + a.amount, 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Repertorio */}
              {sale.repertoire && sale.repertoire.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Music size={14} className="text-primary-600" /> Repertorio
                  </h4>
                  <div className="space-y-2 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
                    {sale.repertoire.map((song, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                          <Music size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">{song.titulo}</p>
                          <p className="text-[10px] text-slate-400 uppercase">{song.artista}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── COLUMNA DERECHA ───────────────────────────────────────── */}
            <div className="w-full md:w-1/2 p-8 space-y-6 bg-slate-50">

              {/* Evento */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Calendar size={14} className="text-primary-600" /> Evento
                </h4>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
                  <div className="pb-4 border-b border-slate-50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Homenajeado</p>
                    <p className="font-bold text-slate-800 flex items-center gap-2"><User size={12} /> {sale.homenajeado || 'No registrado'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo</p>
                      <p className="font-bold text-slate-800 flex items-center gap-2 uppercase"><Tag size={12} /> {sale.eventType || 'DIRECTA'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha</p>
                      <p className="font-bold text-slate-800 flex items-center gap-2"><Calendar size={12} /> {sale.eventDate || sale.date}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Horario</p>
                      <p className="font-bold text-slate-800 flex items-center gap-2">
                        <Clock size={12} /> {format12h(sale.eventTime || '00:00')} - {format12h(sale.eventEndTime || '00:00')}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Ubicación</p>
                    <p className="font-bold text-slate-800 flex items-center gap-2"><MapPin size={12} /> {sale.eventLocation || 'Presencial / Local'}</p>
                  </div>
                </div>
              </div>

              {/* Servicios */}
              {sale.services && sale.services.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Package size={14} className="text-primary-600" /> Servicios Contratados
                  </h4>
                  <div className="space-y-2">
                    {sale.services.map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div>
                          <p className="text-sm font-bold text-slate-700">{item.nombre}</p>
                          <p className="text-[10px] text-slate-400">${item.precio.toLocaleString()} c/u · x{item.cantidad}</p>
                        </div>
                        <p className="text-sm font-bold text-orange-600">
                          ${(item.precio * item.cantidad).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas */}
              {sale.notes && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Tag size={14} className="text-primary-600" /> Notas Internas
                  </h4>
                  <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-sm text-slate-600 italic">"{sale.notes}"</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-end shrink-0 gap-3">
          <button onClick={onClose}
            className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-100 transition-colors shadow-sm">
            Cerrar Detalle
          </button>
          <button onClick={() => onDownload(sale.id)}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg hover:-translate-y-0.5">
            <Download size={16} /> Descargar PDF
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
