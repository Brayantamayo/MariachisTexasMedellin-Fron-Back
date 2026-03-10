
import React, { useState } from 'react';
import { Reservation, UserRole } from '@/types';
import { Eye, DollarSign, CheckSquare, Edit2, Ban } from 'lucide-react';
import { TablePagination } from '@/shared/components/TablePagination';

interface Props {
  reservations: Reservation[];
  loading: boolean;
  userRole?: UserRole;
  onView: (res: Reservation) => void;
  onEdit: (res: Reservation) => void;
  onAddPayment: (id: string) => void;
  onFinalize: (id: string) => void;
  onCancel: (id: string) => void;
}

export const ReservasTable: React.FC<Props> = ({ 
    reservations, 
    loading, 
    userRole,
    onView, 
    onEdit, 
    onAddPayment, 
    onFinalize, 
    onCancel 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getStatusBadgeStyles = (status: string) => {
      switch(status) {
          case 'Pendiente': return 'bg-amber-50 text-amber-600 border-amber-200';
          case 'Confirmado': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
          case 'Finalizado': return 'bg-blue-50 text-blue-600 border-blue-200';
          case 'Anulado': return 'bg-slate-50 text-slate-500 border-slate-200';
          default: return 'bg-slate-50 text-slate-600 border-slate-200';
      }
  };

  const ActionButton: React.FC<{ icon: React.ElementType, onClick: () => void, tooltip?: string, variant?: 'default' | 'success' | 'indigo' | 'danger' | 'blue' }> = ({ icon: Icon, onClick, tooltip, variant = 'default' }) => {
      const variants = {
          default: 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600',
          success: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
          indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
          danger: 'bg-red-50 text-red-500 hover:bg-red-100',
          blue: 'bg-blue-50 text-blue-600 hover:bg-blue-100'
      };
      
      return (
        <button 
            onClick={onClick}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${variants[variant]}`}
            title={tooltip}
        >
            <Icon size={16} strokeWidth={2} />
        </button>
      );
  };

  if (loading) {
      return <div className="py-20 text-center text-slate-400">Cargando reservas...</div>;
  }

  if (reservations.length === 0) {
      return <div className="py-20 text-center text-slate-400">No se encontraron reservas.</div>;
  }

  // Pagination Logic
  const totalPages = Math.ceil(reservations.length / itemsPerPage);
  const currentReservations = reservations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto pb-4">
          <table className="w-full">
              <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="py-5 px-8 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                      <th className="py-5 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                      <th className="py-5 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Fecha / Hora</th>
                      <th className="py-5 px-6 text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">Saldo</th>
                      <th className="py-5 px-6 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">Estado</th>
                      <th className="py-5 px-8 text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">Acciones</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                  {currentReservations.map(res => {
                      const saldo = res.totalAmount - res.paidAmount;
                      const isActive = res.status !== 'Finalizado' && res.status !== 'Anulado';

                      return (
                          <tr key={res.id} className="hover:bg-slate-50/50 transition-colors group">
                              
                              {/* ID */}
                              <td className="py-5 px-8">
                                  <span className="font-bold text-primary-600 text-sm">#{res.id}</span>
                              </td>

                              {/* Cliente */}
                              <td className="py-5 px-6">
                                  <div className="flex flex-col">
                                      <span className="font-bold text-slate-800 text-sm">{res.clientName}</span>
                                      <span className="text-[10px] text-slate-400 uppercase tracking-wide">{res.eventType}</span>
                                  </div>
                              </td>

                              {/* Fecha / Hora */}
                              <td className="py-5 px-6">
                                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                      <span>{res.eventDate}</span>
                                      <span className="text-slate-300">|</span>
                                      <span>{res.eventTime}</span>
                                  </div>
                              </td>

                              {/* Saldo */}
                              <td className="py-5 px-6">
                                  <span className={`font-bold text-sm ${saldo > 0 ? 'text-slate-600' : 'text-emerald-600'}`}>
                                      ${saldo.toLocaleString()}
                                  </span>
                              </td>

                              {/* Estado (Badge) */}
                              <td className="py-5 px-6 text-center">
                                  <span className={`inline-block px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${getStatusBadgeStyles(res.status)}`}>
                                      {res.status}
                                  </span>
                              </td>

                              {/* Acciones */}
                              <td className="py-5 px-8">
                                  <div className="flex items-center justify-center gap-2">
                                      {/* Ver Detalle (Siempre visible) */}
                                      <ActionButton icon={Eye} onClick={() => onView(res)} tooltip="Ver Detalle" />

                                      {/* Acciones para Estados Activos (Pendiente / Confirmado) */}
                                      {isActive && userRole !== UserRole.CLIENTE && (
                                          <>
                                              {/* Registrar Abono */}
                                              <ActionButton icon={DollarSign} onClick={() => onAddPayment(res.id)} tooltip="Registrar Abono" />


                                              {/* Editar */}
                                              <ActionButton icon={Edit2} onClick={() => onEdit(res)} tooltip="Editar Reserva" />

                                              {/* Anular */}
                                              <ActionButton icon={Ban} onClick={() => onCancel(res.id)} tooltip="Anular Reserva" />
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
        totalItems={reservations.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};
