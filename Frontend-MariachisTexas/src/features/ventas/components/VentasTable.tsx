
import React, { useState } from 'react';
import { Sale } from '../services/ventaService';
import { Eye, Download, User, FileText, Calendar, CreditCard, Edit2 } from 'lucide-react';
import { TablePagination } from '@/shared/components/TablePagination';

interface Props {
  sales: Sale[];
  loading: boolean;
  isClient: boolean;
  onView: (sale: Sale) => void;
  onEdit: (sale: Sale) => void;
  onAddPayment: (reservationId: string) => void;
  onDownload: (id: string) => void;
}

export const VentasTable: React.FC<Props> = ({ sales, loading, isClient, onView, onEdit, onAddPayment, onDownload }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const ActionButton: React.FC<{ icon: React.ElementType, onClick: () => void, tooltip?: string, variant?: 'default' | 'danger' }> = ({ icon: Icon, onClick, tooltip, variant = 'default' }) => (
    <button 
        onClick={onClick}
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
      return <div className="text-center py-20 text-slate-400">Cargando registros...</div>;
  }

  if (sales.length === 0) {
      return <div className="text-center py-20 text-slate-400">No se encontraron registros.</div>;
  }

  // Pagination Logic
  const totalPages = Math.ceil(sales.length / itemsPerPage);
  const currentSales = sales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto p-8 pb-4">
          <table className="w-full">
              <thead>
                  <tr className="border-b border-slate-100 text-left">
                      <th className="py-5 px-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">ID Venta</th>
                      <th className="py-5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                          {isClient ? 'Concepto' : 'Cliente / Concepto'}
                      </th>
                      <th className="py-5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                      <th className="py-5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total / Saldo</th>
                      <th className="py-5 px-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                  {currentSales.map(sale => (
                          <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
                                                        {/* ID */}
                              <td className="py-5 px-8">
                              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">#{sale.id}</span>
                              </td>

                          {/* Cliente / Concepto */}
                          <td className="py-5 px-6">
                              <div className="flex flex-col">
                                  {!isClient && (
                                      <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                          <User size={12} className="text-slate-400" /> {sale.clientName}
                                      </span>
                                  )}
                                  <span className={`text-[10px] text-slate-400 truncate max-w-[200px] flex items-center gap-1 ${isClient ? 'text-sm font-medium text-slate-700' : 'mt-0.5'}`}>
                                      <FileText size={10} /> {sale.concept}
                                  </span>
                              </div>
                          </td>

                          {/* Estado Badge */}
                          <td className="py-5 px-6 text-center">
                              {sale.reservationStatus ? (
                                  <span className={`inline-block px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${
                                      sale.reservationStatus === 'CANCELADA'  ? 'bg-red-50 text-red-600 border-red-100'
                                    : sale.reservationStatus === 'FINALIZADO' ? 'bg-blue-50 text-blue-600 border-blue-100'
                                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                  }`}>
                                      {sale.reservationStatus === 'CANCELADA'  ? 'Cancelada'
                                     : sale.reservationStatus === 'FINALIZADO' ? 'Finalizado'
                                     : 'Confirmado'}
                                  </span>
                              ) : (
                                  <span className="inline-block px-3 py-1 rounded-lg border border-slate-100 bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                      Venta Directa
                                  </span>
                              )}
                          </td>

                          {/* Monto */}
                          <td className="py-5 px-6">
                              <div className="flex flex-col">
                                  <span className="text-sm font-bold text-slate-700">
                                      ${sale.amount.toLocaleString()}
                                  </span>
                                  {sale.totalAmount && sale.totalAmount !== sale.amount && (
                                      <span className="text-[10px] text-slate-400">
                                          Total Reserva: ${sale.totalAmount.toLocaleString()}
                                      </span>
                                  )}
                                  {sale.pendingAmount !== undefined && (
                                      <span className={`text-[10px] font-bold flex items-center gap-1 ${sale.pendingAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                          <CreditCard size={10} /> 
                                          {sale.pendingAmount > 0 ? `Saldo: $${sale.pendingAmount.toLocaleString()}` : 'Pagado'}
                                      </span>
                                  )}
                                  {!sale.reservationId && (
                                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                          <CreditCard size={10} /> {sale.method}
                                      </span>
                                  )}
                              </div>
                          </td>

                          {/* Acciones */}
                          <td className="py-5 px-8">
                              <div className="flex items-center justify-center gap-2">
                                  <ActionButton icon={Eye} onClick={() => onView(sale)} tooltip="Ver Detalle" />
                                  {!isClient && sale.reservationStatus === 'Confirmado' && sale.reservationId && (
                                      <ActionButton icon={CreditCard} onClick={() => onAddPayment(sale.reservationId!)} tooltip="Registrar Abono" />
                                  )}
                                  {!isClient && !sale.reservationStatus && (
                                      <ActionButton icon={Edit2} onClick={() => onEdit(sale)} tooltip="Editar Venta" />
                                  )}
                                  <ActionButton icon={Download} onClick={() => onDownload(sale.id)} tooltip="Descargar Factura" variant="danger" />
                              </div>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
      <TablePagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={sales.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};
