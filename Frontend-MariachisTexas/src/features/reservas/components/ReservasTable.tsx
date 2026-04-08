import React, { useState } from 'react';
import { Reservation, UserRole } from '@/types';
import { Eye, DollarSign, Edit2, Ban, Trash2 } from 'lucide-react';
import { TablePagination } from '@/shared/components/TablePagination';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal';
import { AnularReservaModal } from '@/shared/components/AnularReservaModal';

interface Props {
  reservations: Reservation[];
  loading: boolean;
  userRole?: UserRole;
  onView: (res: Reservation) => void;
  onEdit: (res: Reservation) => void;
  onAddPayment: (id: string) => void;
  onFinalize: (id: string) => void;
  onCancel: (id: string, motivo: string) => void;
  onDelete: (id: string) => void;
}

{/* Esta función devuelve el estilo de la etiqueta de estado de la reserva. */}
const getStatusBadgeStyles = (status: string) => {
  switch (status) {
    case 'PENDIENTE':  return 'bg-amber-50 text-amber-600 border-amber-200';
    case 'CONFIRMADA': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    case 'ANULADA':    return 'bg-slate-50 text-slate-500 border-slate-200';
    default:           return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

{/* Esta función convierte el estado interno de la reserva a una etiqueta legible para el usuario. */}
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDIENTE':  return 'Pendiente';
    case 'CONFIRMADA': return 'Confirmada';
    case 'ANULADA':    return 'Anulada';
    default:           return status;
  }
};

const ActionButton: React.FC<{
  icon: React.ElementType;
  onClick: () => void;
  tooltip?: string;
  variant?: 'default' | 'success' | 'indigo' | 'danger';
}> = ({ icon: Icon, onClick, tooltip, variant = 'default' }) => {
  const variants = {
    default: 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600',
    success: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
    indigo:  'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
    danger:  'bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600',
  };
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${variants[variant]}`}
    >
      <Icon size={16} strokeWidth={2} />
    </button>
  );
};

export const ReservasTable: React.FC<Props> = ({
  reservations, loading, userRole,
  onView, onEdit, onAddPayment, onFinalize, onCancel, onDelete,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [anularModal, setAnularModal] = useState<{ open: boolean; reservation: Reservation | null }>({
    open: false, reservation: null,
  });

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string }>({
    open: false, id: '',
  });


  ///esto se muestra cuando se carga la página
  if (loading) return <div className="py-20 text-center text-slate-400">Cargando reservas...</div>;
  if (!reservations.length) return <div className="py-20 text-center text-slate-400">No se encontraron reservas.</div>;

  const totalPages   = Math.ceil(reservations.length / itemsPerPage);
  const currentItems = reservations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const isClient = userRole === UserRole.CLIENTE;
  const isAdmin  = userRole === UserRole.ADMIN;

  {/* Tabla de reservas*/}
  return (
    <>
      <div className="flex flex-col">
        <div className="overflow-x-auto pb-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-5 px-8 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                <th className="py-5 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="py-5 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Evento</th>
                <th className="py-5 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Fecha / Hora</th>
                <th className="py-5 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Saldo</th>
                <th className="py-5 px-6 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="py-5 px-8 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">

              {/* Reservas que se muestran en la tabla */}
              {currentItems.map(res => {
                const total    = Number(res.totalAmount) || 0;
                const paid     = Number(res.paidAmount)  || 0;
                const saldo    = total - paid;
                const isActive  = !['ANULADA', 'Anulado', 'Finalizado'].includes(res.status);
                const isAnulada = res.status === 'ANULADA';

                {/* contenido de la fila de la tabla */}
                return (
                  <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-5 px-8">
                      <span className="font-bold text-primary-600 text-sm">#{res.id}</span>
                    </td>
                    <td className="py-5 px-6">
                      <span className="font-bold text-slate-800 text-sm">{res.clientName || '—'}</span>
                    </td>
                    <td className="py-5 px-6">
                      <span className="text-[11px] text-slate-500 uppercase tracking-wide font-medium">
                        {res.eventType || '—'}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                        <span>{res.eventDate}</span>
                        <span className="text-slate-300">|</span>
                        <span>{res.startTime || res.eventTime}</span>
                        {res.endTime && (
                          <><span className="text-slate-300">→</span><span>{res.endTime}</span></>
                        )}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`font-bold text-sm ${saldo > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                        ${saldo.toLocaleString('es-CO')}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-center">
                      <span className={`inline-block px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${getStatusBadgeStyles(res.status)}`}>
                        {getStatusLabel(res.status)}
                      </span>
                    </td>

                  {/* Botones de las acciones disponibles */}
                    <td className="py-5 px-8">
                      <div className="flex items-center justify-center gap-2">
                        <ActionButton icon={Eye} onClick={() => onView(res)} tooltip="Ver Detalle" />
                        {isActive && !isClient && (
                          <>
                            <ActionButton icon={DollarSign} onClick={() => onAddPayment(res.id)} tooltip="Registrar Abono"  />
                            <ActionButton icon={Edit2}      onClick={() => onEdit(res)}           tooltip="Editar Reserva"  />
                            <ActionButton
                              icon={Ban}
                              tooltip="Anular Reserva"
                              onClick={() => setAnularModal({ open: true, reservation: res })}
                            />
                          </>
                        )}
                        {isAnulada && isAdmin && (
                          <ActionButton
                            icon={Trash2}
                            variant="danger"
                            tooltip="Eliminar"
                            onClick={() => setDeleteModal({ open: true, id: res.id })}
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
          totalItems={reservations.length}
          itemsPerPage={itemsPerPage}
        />
      </div>


      {/* El modal de anulación de reserva */}
      <AnularReservaModal
        isOpen={anularModal.open}
        reservation={anularModal.reservation}
        onClose={() => setAnularModal({ open: false, reservation: null })}
        onConfirm={(id, motivo) => {
          setAnularModal({ open: false, reservation: null }); 
          onCancel(id, motivo);                               
        }}
      />


      {/* El modal de confirmación de eliminación */} 
      <ConfirmationModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: '' })}
        onConfirm={() => {
          setDeleteModal({ open: false, id: '' });
          onDelete(deleteModal.id);
        }}

        title="¿Eliminar Reserva?"
        message="Estás a punto de eliminar esta reserva permanentemente. Esta acción no se puede deshacer y se perderá el historial asociado."
        confirmText="Sí, eliminar"
      />
    </>
  );
};