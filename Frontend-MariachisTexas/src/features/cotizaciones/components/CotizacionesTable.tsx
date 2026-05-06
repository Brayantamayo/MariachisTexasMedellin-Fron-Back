import React, { useState } from 'react';
import { Quotation, UserRole } from '@/types';
import { User, FileText, Calendar, Eye, Download, Edit2, CheckSquare, Ban, Trash2 } from 'lucide-react';
import { TablePagination } from '@/shared/components/TablePagination';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal';

interface Props {
  quotations: Quotation[];
  loading: boolean;
  userRole?: UserRole;
  onView: (q: Quotation) => void;
  onEdit: (q: Quotation) => void;
  onConvert: (id: string, amount: number) => void;
  onCancel: (id: string) => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void; 
}

export const CotizacionesTable: React.FC<Props> = ({
  quotations, loading, userRole,
  onView, onEdit, onConvert, onCancel, onDownload, onDelete
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ✅ Estado del modal de confirmación
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string }>({
    open: false, id: ''
  });

  const ActionButton: React.FC<{
    icon: React.ElementType;
    onClick: () => void;
    tooltip?: string;
    variant?: 'default' | 'danger'
  }> = ({ icon: Icon, onClick, tooltip, variant = 'default' }) => {
    const styles = {
      default: 'bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-600 border border-slate-200',
      danger:  'bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 border border-red-100',
    };
    return (
      <button onClick={onClick} title={tooltip}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm ${styles[variant]}`}>
        <Icon size={14} strokeWidth={2} />
      </button>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EN_ESPERA':  return 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
      case 'CONVERTIDA': return 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
      case 'ANULADA':    return 'bg-slate-100 text-slate-400 border border-slate-200';
      default:           return 'bg-slate-100 text-slate-400 border border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'EN_ESPERA':  return 'En Espera';
      case 'CONVERTIDA': return 'Aceptada';
      case 'ANULADA':    return 'Anulada';
      default:           return status;
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Cargando cotizaciones...</div>;
  if (quotations.length === 0) return <div className="text-center py-20 text-slate-400">No se encontraron registros.</div>;

  const totalPages   = Math.ceil(quotations.length / itemsPerPage);
  const currentItems = quotations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <div className="flex flex-col">
        <div className="overflow-x-auto pb-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">#</th>
                <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Evento</th>
                <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor</th>
                <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                <th className="py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.map((quote, index) => {
                const isActive  = quote.status === 'EN_ESPERA';
                const isAnulada = quote.status === 'ANULADA';
                const isStaff   = userRole === UserRole.ADMIN || userRole === UserRole.EMPLEADO;
                const isAdmin   = userRole === UserRole.ADMIN;
                const itemNumber = (currentPage - 1) * itemsPerPage + index + 1;

                return (
                  <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4 text-center">
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                        {itemNumber}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-700 text-xs">{quote.clientName}</p>
                          <p className="text-[10px] text-slate-400">{quote.clientPhone}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <FileText size={12} className="text-orange-500" /> {quote.eventType}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium whitespace-nowrap">
                          <Calendar size={10} /> {quote.eventDate}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="text-xs font-bold text-slate-700 font-mono">
                        ${quote.totalAmount.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(quote.status)}`}>
                        {getStatusLabel(quote.status)}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <ActionButton icon={Eye}      onClick={() => onView(quote)}              tooltip="Ver Detalle" />
                        <ActionButton icon={Download} onClick={() => onDownload(quote.id)}       tooltip="Descargar PDF" />
                        {isActive && isStaff && (
                          <>
                            <ActionButton icon={Edit2}       onClick={() => onEdit(quote)}                          tooltip="Editar" />
                            <ActionButton icon={CheckSquare} onClick={() => onConvert(quote.id, quote.totalAmount)} tooltip="Confirmar" />
                            <ActionButton icon={Ban}         onClick={() => onCancel(quote.id)}                     tooltip="Anular" />
                          </>
                        )}
                        {/* ✅ Eliminar solo si está ANULADA y es admin */}
                        {isAnulada && isAdmin && (
                          <ActionButton
                            icon={Trash2}
                            variant="danger"
                            tooltip="Eliminar"
                            onClick={() => setDeleteModal({ open: true, id: quote.id })}
                          />
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

      {/* ✅ Modal de confirmación */}
      <ConfirmationModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: '' })}
        onConfirm={() => onDelete(deleteModal.id)}
        title="¿Eliminar Cotización?"
        message="Estás a punto de eliminar esta cotización permanentemente. Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
      />
    </>
  );
};