
import React, { useState } from 'react';
import { Quotation, UserRole } from '@/types';
import { User, FileText, Calendar, Eye, Download, Edit2, CheckSquare, Ban } from 'lucide-react';
import { TablePagination } from '@/shared/components/TablePagination';

interface Props {
  quotations: Quotation[];
  loading: boolean;
  userRole?: UserRole;
  onView: (q: Quotation) => void;
  onEdit: (q: Quotation) => void;
  onConvert: (id: string, amount: number) => void;
  onCancel: (id: string) => void;
  onDownload: (id: string) => void;
}

export const CotizacionesTable: React.FC<Props> = ({ 
    quotations, loading, userRole, onView, onEdit, onConvert, onCancel, onDownload 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Refined ActionButton
  const ActionButton: React.FC<{ icon: React.ElementType, onClick: () => void, tooltip?: string }> = ({ icon: Icon, onClick, tooltip }) => (
    <button 
        onClick={onClick}
        title={tooltip}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-200 shadow-sm"
    >
        <Icon size={14} strokeWidth={2} />
    </button>
  );

  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'En Espera': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
          case 'Convertida': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
          case 'Anulada': return 'bg-white/5 text-gray-500 border border-white/10';
          default: return 'bg-white/5 text-gray-400 border border-white/10';
      }
  };

  if (loading) {
      return <div className="text-center py-20 text-gray-500">Cargando cotizaciones...</div>;
  }

  if (quotations.length === 0) {
      return <div className="text-center py-20 text-gray-500">No se encontraron registros.</div>;
  }

  // Pagination Logic
  const totalPages = Math.ceil(quotations.length / itemsPerPage);
  const currentQuotations = quotations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto pb-4">
          <table className="w-full">
              <thead>
                  <tr className="border-b border-slate-200 text-left">
                      <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">ID</th>
                      <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                      <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Evento</th>
                      <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor</th>
                      <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                      <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {currentQuotations.map(quote => {
                      const isActive = quote.status === 'En Espera';
                      return (
                          <tr key={quote.id} className="hover:bg-slate-50 transition-colors group">
                              
                              {/* ID */}
                              <td className="py-4 px-4 text-center whitespace-nowrap">
                                  <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                    #{quote.id}
                                  </span>
                              </td>

                              {/* Cliente */}
                              <td className="py-4 px-4">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 text-xs border border-indigo-100">
                                          <User size={14} />
                                      </div>
                                      <div>
                                          <p className="font-bold text-slate-700 text-xs">{quote.clientName}</p>
                                          <p className="text-[10px] text-slate-400">{quote.clientPhone}</p>
                                      </div>
                                  </div>
                              </td>

                              {/* Evento */}
                              <td className="py-4 px-4">
                                  <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                          <FileText size={12} className="text-orange-500" /> 
                                          {quote.eventType}
                                      </div>
                                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                          <Calendar size={10} /> 
                                          {quote.eventDate}
                                      </div>
                                  </div>
                              </td>

                              {/* Valor */}
                              <td className="py-4 px-4">
                                  <span className="text-xs font-bold text-slate-700 font-mono">
                                      ${quote.totalAmount.toLocaleString()}
                                  </span>
                              </td>

                              {/* Estado */}
                              <td className="py-4 px-4 text-center">
                                  <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(quote.status)}`}>
                                      {quote.status}
                                  </span>
                              </td>

                              {/* Acciones */}
                              <td className="py-4 px-4">
                                  <div className="flex items-center justify-center gap-1.5">
                                      <ActionButton icon={Eye} onClick={() => onView(quote)} tooltip="Ver Detalle" />
                                      <ActionButton icon={Download} onClick={() => onDownload(quote.id)} tooltip="Descargar PDF" />

                                      {isActive && (
                                          <>
                                              <ActionButton icon={Edit2} onClick={() => onEdit(quote)} tooltip="Editar" />
                                              
                                              {userRole !== UserRole.CLIENTE && (
                                                  <ActionButton icon={CheckSquare} onClick={() => onConvert(quote.id, quote.totalAmount)} tooltip="Confirmar" />
                                              )}
                                              
                                              <ActionButton icon={Ban} onClick={() => onCancel(quote.id)} tooltip="Anular" />
                                          </>
                                      )}
                                  </div>
                              </td>
                          </tr>
                      );
                  })}
              </tbody>
          </table>
      </div>
      <TablePagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={quotations.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};
