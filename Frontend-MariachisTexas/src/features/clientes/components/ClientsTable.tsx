
import React from 'react';
import { User } from '@/types';
import { User as UserIcon, MapPin, Phone, Eye, Edit2, Trash2, Mail, Hash } from 'lucide-react';
import { TablePagination } from '@/shared/components/TablePagination';

interface Props {
  clients: User[];
  loading: boolean;
  pagination: { page: number; limit: number; total: number; pages: number };
  onView: (client: User) => void;
  onEdit: (client: User) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (client: User) => void;
  onPageChange: (page: number) => void;
}

export const ClientsTable: React.FC<Props> = ({ clients, loading, pagination, onView, onEdit, onDelete, onToggleStatus, onPageChange }) => {
  
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
      return <div className="text-center py-20 text-slate-400">Cargando clientes...</div>;
  }

  if (clients.length === 0) {
      return <div className="text-center py-20 text-slate-400">No se encontraron clientes.</div>;
  }

  // Usar clients directamente, paginación manejada en backend
  const currentClients = clients;

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto p-8 pb-4">
          <table className="w-full">
              <thead>
                  <tr className="border-b border-slate-100 text-left">
                      <th className="py-5 px-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cliente / Documento</th>
                      <th className="py-5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ubicación / Zona</th>
                      <th className="py-5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Contacto</th>
                      <th className="py-5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                      <th className="py-5 px-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                  {currentClients.map((client) => (
                      <tr key={client.id} className="hover:bg-slate-50/50 transition-colors group">
                          
                          {/* Profile */}
                          <td className="py-5 px-8">
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shadow-sm flex-shrink-0 bg-emerald-50 flex items-center justify-center text-emerald-600">
                                      {client.avatar ? (
                                          <img src={client.avatar} alt={client.name} className="w-full h-full object-cover" />
                                      ) : (
                                          <UserIcon size={18} />
                                      )}
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-slate-800 text-sm">{client.name} {client.lastName}</h3>
                                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                          <Hash size={10} /> {client.documentType} {client.documentNumber}
                                      </p>
                                  </div>
                              </div>
                          </td>

                          {/* Location */}
                          <td className="py-5 px-6">
                              <div className="flex flex-col gap-1">
                                  <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                      <MapPin size={12} className="text-slate-400" /> {client.city}
                                  </span>
                                  <span className="text-[10px] text-slate-500 pl-5 truncate max-w-[150px]" title={client.address}>
                                      {client.address}
                                  </span>
                              </div>
                          </td>

                          {/* Contact */}
                          <td className="py-5 px-6">
                              <div className="flex flex-col gap-1">
                                  <p className="text-xs text-slate-600 flex items-center gap-2 font-medium">
                                      <Phone size={12} className="text-slate-400" /> {client.phone}
                                  </p>
                                  <p className="text-[10px] text-slate-500 flex items-center gap-2 truncate max-w-[180px]" title={client.email}>
                                      <Mail size={12} className="text-slate-400" /> {client.email}
                                  </p>
                              </div>
                          </td>

                          {/* Status Toggle */}
                          <td className="py-5 px-6">
                              <div className="flex items-center justify-center gap-3">
                                  <button 
                                      onClick={() => onToggleStatus(client)} 
                                      className={`relative w-10 h-5 rounded-full transition-all duration-300 focus:outline-none ${client.isActive ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                  >
                                      <span 
                                          className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full shadow-sm transition-transform duration-300 ${client.isActive ? 'translate-x-5' : 'translate-x-0'}`} 
                                      />
                                  </button>
                              </div>
                          </td>

                          {/* Actions */}
                          <td className="py-5 px-8">
                              <div className="flex items-center justify-center gap-2">
                                  <ActionButton icon={Eye} onClick={() => onView(client)} tooltip="Ver detalle" />
                                  {client.isActive && (
                                    <>
                                      <ActionButton icon={Edit2} onClick={() => onEdit(client)} tooltip="Editar cliente" />
                                      {!client.hasActiveReservations && (
                                        <ActionButton icon={Trash2} onClick={() => onDelete(client.id)} tooltip="Eliminar cliente" variant="danger" />
                                      )}
                                    </>
                                  )}
                              </div>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
      <TablePagination 
        currentPage={pagination.page}
        totalPages={pagination.pages}
        onPageChange={onPageChange}
        totalItems={pagination.total}
        itemsPerPage={pagination.limit}
      />
    </div>
  );
};
