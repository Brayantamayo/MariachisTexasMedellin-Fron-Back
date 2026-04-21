
import React, { useState } from 'react';
import { EnrichedPayment } from '../services/abonoService';
import { Eye, Download, FileText, Calendar, CreditCard, User, ChevronDown, ChevronUp } from 'lucide-react';
import { TablePagination } from '@/shared/components/TablePagination';
import { Reservation } from '@/types';

interface Props {
  abonos: EnrichedPayment[];
  reservations: Reservation[];
  loading: boolean;
  onView: (abono: EnrichedPayment) => void;
  onDownload: (id: string) => void;
}

export const AbonosTable: React.FC<Props> = ({ abonos, reservations, loading, onView, onDownload }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedResId, setExpandedResId] = useState<string | null>(null);
  const itemsPerPage = 10;
  
  const ActionButton: React.FC<{ icon: React.ElementType, onClick: () => void, tooltip?: string, variant?: 'default' | 'danger' }> = ({ icon: Icon, onClick, tooltip, variant = 'default' }) => (
    <button 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 
            ${variant === 'danger' 
                ? 'bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-600' 
                : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
            }`}
        title={tooltip}
    >
        <Icon size={16} strokeWidth={2} />
    </button>
  );

  if (loading) {
      return <div className="text-center py-20 text-slate-400">Cargando datos...</div>;
  }

  // Mostrar todas las reservas con abonos, incluyendo las anuladas
  const relevantReservations = reservations.filter(r => r.paidAmount > 0);

  if (relevantReservations.length === 0) {
      return <div className="text-center py-20 text-slate-400">No se encontraron reservas con abonos.</div>;
  }

  // Pagination Logic
  const totalPages = Math.ceil(relevantReservations.length / itemsPerPage);
  const currentReservations = relevantReservations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleExpand = (id: string) => {
      setExpandedResId(expandedResId === id ? null : id);
  };

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto p-8 pb-4">
          <table className="w-full">
              <thead>
                  <tr className="border-b border-slate-100 text-left">
                      <th className="py-5 px-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Reserva</th>
                      <th className="py-5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                      <th className="py-5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                      <th className="py-5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total</th>
                      <th className="py-5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pagado</th>
                      <th className="py-5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pendiente</th>
                      <th className="py-5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Abonos</th>
                      <th className="py-5 px-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                  {currentReservations.map(res => {
                      const resAbonos = abonos.filter(a => a.reservationId === res.id);
                      const isExpanded = expandedResId === res.id;
                      const pending = res.totalAmount - res.paidAmount;

                      return (
                          <React.Fragment key={res.id}>
                              <tr 
                                onClick={() => toggleExpand(res.id)}
                                className={`hover:bg-slate-50/50 transition-colors group cursor-pointer ${isExpanded ? 'bg-slate-50/80' : ''}`}
                              >
                                  {/* ID */}
                                  <td className="py-5 px-8">
                                      <div className="flex items-center gap-3">
                                          {isExpanded ? <ChevronUp size={16} className="text-primary-600" /> : <ChevronDown size={16} className="text-slate-400" />}
                                          <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">#{res.id}</span>
                                      </div>
                                  </td>

                                  {/* Cliente */}
                                  <td className="py-5 px-6">
                                      <div className="flex flex-col">
                                          <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                              <User size={12} className="text-slate-400" /> {res.clientName}
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mt-0.5">
                                              {res.eventType}
                                          </span>
                                      </div>
                                  </td>

                                  {/* Estado */}
                                  <td className="py-5 px-6">
                                      {(() => {
                                          const isAnulada = res.status === 'ANULADA' || res.status === 'Anulado';
                                          const isConfirmed = res.status === 'CONFIRMADA' || res.status === 'Confirmado' || (pending <= 0 && !isAnulada);
                                          
                                          return (
                                              <span className={`inline-block px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${
                                                  isAnulada
                                                    ? 'bg-red-50 text-red-600 border-red-100'
                                                    : isConfirmed
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                              }`}>
                                                  {isAnulada ? 'Anulada'
                                                   : isConfirmed ? 'Confirmada'
                                                   : 'Pendiente'}
                                              </span>
                                          );
                                      })()}
                                  </td>

                                  {/* Total */}
                                  <td className="py-5 px-6">
                                      <span className="text-sm font-bold text-slate-700">
                                          ${res.totalAmount.toLocaleString()}
                                      </span>
                                  </td>

                                  {/* Pagado */}
                                  <td className="py-5 px-6">
                                      <span className="text-sm font-bold text-emerald-600">
                                          ${res.paidAmount.toLocaleString()}
                                      </span>
                                  </td>

                                  {/* Pendiente */}
                                  <td className="py-5 px-6">
                                      <span className={`text-sm font-bold ${pending > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                          ${pending.toLocaleString()}
                                      </span>
                                  </td>

                                  {/* Cant Abonos */}
                                  <td className="py-5 px-6 text-center">
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold">
                                          {resAbonos.length}
                                      </span>
                                  </td>

                                  {/* Acciones */}
                                  <td className="py-5 px-8">
                                      <div className="flex items-center justify-center gap-2">
                                          <button
                                            onClick={(e) => { e.stopPropagation(); toggleExpand(res.id); }}
                                            className="text-xs font-bold text-primary-600 hover:text-primary-700 underline underline-offset-4"
                                          >
                                              {isExpanded ? 'Ocultar' : 'Ver Abonos'}
                                          </button>
                                      </div>
                                  </td>
                              </tr>

                              {/* Expanded Row with Abonos List */}
                              {isExpanded && (
                                  <tr>
                                      <td colSpan={7} className="bg-slate-50/50 px-8 py-4">
                                          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                              <div className="grid grid-cols-5 bg-slate-50 px-6 py-3 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                  <span>ID Pago</span>
                                                  <span>Fecha</span>
                                                  <span>Método</span>
                                                  <span>Monto</span>
                                                  <span className="text-center">Acciones</span>
                                              </div>
                                              <div className="divide-y divide-slate-50">
                                                  {resAbonos.length > 0 ? resAbonos.map(abono => (
                                                      <div key={abono.id} className="grid grid-cols-5 px-6 py-4 items-center hover:bg-slate-50/30 transition-colors">
                                                          <span className="font-mono text-[10px] font-bold text-slate-500">#{abono.id}</span>
                                                          <span className="text-xs text-slate-600 flex items-center gap-2">
                                                              <Calendar size={12} className="text-slate-400" />
                                                              {new Date(abono.date).toLocaleDateString()}
                                                          </span>
                                                          <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                                                              <CreditCard size={12} className="text-slate-400" />
                                                              {abono.method}
                                                          </span>
                                                          <span className="text-xs font-bold text-emerald-600">${abono.amount.toLocaleString()}</span>
                                                          <div className="flex justify-center gap-2">
                                                              <ActionButton icon={Eye} onClick={() => onView(abono)} tooltip="Ver Detalle" />
                                                              <ActionButton icon={Download} onClick={() => onDownload(abono.id)} tooltip="Descargar" variant="danger" />
                                                          </div>
                                                      </div>
                                                  )) : (
                                                      <div className="py-8 text-center text-slate-400 text-xs italic">
                                                          No hay abonos registrados para esta reserva.
                                                      </div>
                                                  )}
                                              </div>
                                          </div>
                                      </td>
                                  </tr>
                              )}
                          </React.Fragment>
                      );
                  })}
              </tbody>
          </table>
      </div>
      <TablePagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={relevantReservations.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};