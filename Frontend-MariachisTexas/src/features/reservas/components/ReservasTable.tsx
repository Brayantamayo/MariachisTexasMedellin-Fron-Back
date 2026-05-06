import React, { useState } from 'react';
import { Reservation, UserRole } from '@/types';
import { Eye, DollarSign, Edit2, Ban, Trash2, CalendarClock, User, FileText, Calendar, CreditCard } from 'lucide-react';
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
  // ─── NUEVO ───────────────────────────────────────────────────────────────
  onReprogramar: (res: Reservation) => void;
}

{/* Esta función devuelve el estilo de la etiqueta de estado de la reserva. */}
const getStatusBadgeStyles = (status: string) => {
  switch (status) {
    case 'PENDIENTE':      return 'bg-amber-100 text-amber-700 border-amber-300';
    case 'CONFIRMADA':     return 'bg-emerald-100 text-emerald-700 border-emerald-300';
    case 'ANULADA':        return 'bg-slate-100 text-slate-600 border-slate-300';
    case 'REPROGRAMADA': return 'bg-[#e1f8ff] text-[#0c808b] border-[#0c808b]/30';
    default:               return 'bg-slate-100 text-slate-600 border-slate-300';
  }
};

{/* Esta función convierte el estado interno de la reserva a una etiqueta legible para el usuario. */}
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'PENDIENTE':    return 'Pendiente';
    case 'CONFIRMADA':   return 'Confirmada';
    case 'ANULADA':      return 'Anulada';
    case 'REPROGRAMADA': return 'Reprogramada';
    default:             return status;
  }
};

const ActionButton: React.FC<{
  icon: React.ElementType;
  onClick: () => void;
  tooltip?: string;
  variant?: 'default' | 'success' | 'indigo' | 'danger' | 'warning';
}> = ({ icon: Icon, onClick, tooltip, variant = 'default' }) => {
  const variants = {
    default: 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600',
    success: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
    indigo:  'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
    danger:  'bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700',
    warning: 'bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700',
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
  onReprogramar,
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
                <th className="py-5 px-8 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Fecha / Hora</th>
                <th className="py-5 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cliente / Evento</th>
                <th className="py-5 px-6 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                <th className="py-5 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total / Saldo</th>
                <th className="py-5 px-8 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">

              {/* Reservas que se muestran en la tabla */}
              {currentItems.map((res, index) => {
                const total    = Number(res.totalAmount) || 0;
                const paid     = Number(res.paidAmount)  || 0;
                const saldo    = total - paid;

                // ─── LÓGICA DE ESTADOS ─────────────────────────────────────
                const isActive    = !['ANULADA', 'Anulado', 'Finalizado'].includes(res.status);
                const isAnulada   = res.status === 'ANULADA';
                // Una reserva es reprogramable si:
                // 1. Está PENDIENTE o CONFIRMADA o REPROGRAMADA
                // 2. Tiene al menos un abono registrado (paidAmount > 0)
                const canReprogramar =
                  isActive &&
                  !isClient &&
                  paid > 0 &&
                  ['PENDIENTE', 'CONFIRMADA', 'REPROGRAMADA'].includes(res.status);

                const itemNumber = (currentPage - 1) * itemsPerPage + index + 1;

                {/* contenido de la fila de la tabla */}
                return (
                  <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* ID / Fecha */}
                    <td className="py-5 px-8">
                      <div className="flex flex-col gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded w-max">
                          #{res.id?.slice(0, 8) || itemNumber}
                        </span>
                        <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-400" /> {res.eventDate}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                          {res.startTime || res.eventTime} {res.endTime ? `→ ${res.endTime}` : ''}
                        </span>
                      </div>
                    </td>

                    {/* Cliente / Evento */}
                    <td className="py-5 px-6">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-slate-800 text-sm flex items-start gap-2 max-w-[200px]">
                          <User size={12} className="text-slate-400 mt-1 shrink-0" /> 
                          <span className="line-clamp-2 leading-tight">{res.clientName || '—'}</span>
                        </span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[200px] flex items-center gap-1 uppercase font-medium">
                          <FileText size={10} className="shrink-0" /> {res.eventType || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="py-5 px-6 text-center">
                      <span className={`inline-block px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${getStatusBadgeStyles(res.status)}`}>
                        {getStatusLabel(res.status)}
                      </span>
                    </td>

                    {/* Total / Saldo */}
                    <td className="py-5 px-6">
                      <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-slate-700">
                              ${total.toLocaleString('es-CO')}
                          </span>
                          {saldo > 0 ? (
                              <span className="text-[10px] font-bold flex items-center gap-1 text-amber-600 w-max bg-amber-50 px-1.5 py-0.5 rounded">
                                  <CreditCard size={10} /> Saldo: ${saldo.toLocaleString('es-CO')}
                              </span>
                          ) : (
                              <span className="text-[10px] font-bold flex items-center gap-1 text-emerald-600 w-max bg-emerald-50 px-1.5 py-0.5 rounded">
                                  <CreditCard size={10} /> Pagado
                              </span>
                          )}
                      </div>
                    </td>

                    {/* Botones de las acciones disponibles */}
                    <td className="py-5 px-8">
                      <div className="flex items-center justify-center gap-2">
                        <ActionButton icon={Eye} onClick={() => onView(res)} tooltip="Ver Detalle" />
                        {isActive && !isClient && (
                          <>
                            <ActionButton
                              icon={Edit2}
                              onClick={() => onEdit(res)}
                              tooltip="Editar Reserva"
                            />
                            {/* ─── BOTÓN REPROGRAMAR — solo si tiene abono ─── */}
                            {canReprogramar && (
                              <ActionButton
                                icon={CalendarClock}
                                tooltip="Reprogramar Reserva"
                                onClick={() => onReprogramar(res)}
                              />
                            )}

                            {/*Boton de registrar Pago inicial*/}
                            {res.status === 'PENDIENTE' && (
                              <ActionButton
                                icon={DollarSign}
                                onClick={() => onAddPayment(res.id)}
                                tooltip="Registrar Abono"
                              />
                            )}

                            {/* ─── BOTÓN ANULAR — solo en estado PENDIENTE ─── */}
                            {res.status === 'PENDIENTE' && (
                              <ActionButton
                                icon={Ban}
                                tooltip="Anular Reserva"
                                onClick={() => setAnularModal({ open: true, reservation: res })}
                              />
                            )}
                          
                          </>
                        )}
                        {isAnulada && isAdmin && (
                          <ActionButton
                            icon={Trash2}
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