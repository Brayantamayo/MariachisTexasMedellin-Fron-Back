import React, { useState } from 'react';
import { Edit2, Trash2, Eye, Briefcase } from 'lucide-react';
import { Service, UserRole } from '@/types';
import { TablePagination } from '@/shared/components/TablePagination';

interface Props {
  services: Service[];
  loading: boolean;
  userRole?: UserRole;
  onEdit: (service: Service) => void;
  // ✅ Firma actualizada: pasa id y estado (isActive)
  onDelete: (id: string) => void;
  onView: (service: Service) => void;
  onToggleStatus: (service: Service) => void;
}

export const ServicesTable: React.FC<Props> = ({ 
  services, loading, userRole, onEdit, onDelete, onView, onToggleStatus 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const canManage = userRole === UserRole.ADMIN;

  const ActionButton: React.FC<{ icon: React.ElementType, onClick: () => void, tooltip?: string }> = ({ icon: Icon, onClick, tooltip }) => (
    <button 
      onClick={onClick}
      title={tooltip}
      className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
    >
      <Icon size={16} strokeWidth={2} />
    </button>
  );


  {/* Si no hay servicios cargados, mostrar mensaje de cargando */}
  if (loading) return <div className="text-center py-20 text-slate-400">Cargando servicios...</div>;
  if (services.length === 0) return <div className="text-center py-20 text-slate-400">No hay servicios registrados.</div>;



  {/* Total de paginas y servicios que se mostraran en la paginacion */}
  const totalPages = Math.ceil(services.length / itemsPerPage);
  const currentServices = services.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  {/* Tabla de servicios */}
  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto pb-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 text-left">
              <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Servicio</th>
              <th className="hidden md:table-cell py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Descripción</th>
              <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Precio</th>
              <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
              <th className="py-4 px-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {currentServices.map((service) => (
              <tr key={service.id} className={`transition-colors group ${service.estado ? 'hover:bg-slate-50/50' : 'opacity-60'}`}>



                {/* Nombre del servicio */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 border border-red-100 flex-shrink-0">
                      <Briefcase size={18} strokeWidth={1.5} />
                    </div>
                    <span className="font-bold text-sm text-slate-800">{service.nombre}</span>
                  </div>
                </td>


                {/* Descripción del servicio */}
                <td className="hidden md:table-cell py-4 px-4">
                  <p className="text-xs text-slate-500 max-w-xs truncate font-medium">{service.descripcion}</p>
                </td>


                {/* Precio del servicio */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1 text-slate-700 font-mono text-sm font-bold">
                    <span className="text-slate-400">$</span>
                    {Number(service.precio).toLocaleString()}
                  </div>
                </td>



                {/* Cambio de estado  */}
                <td className="py-4 px-4">
                  <div className="flex items-center justify-center">
                    {canManage ? (
                      <button
                        onClick={() => onToggleStatus(service)}
                        className={`relative w-9 h-5 rounded-full transition-all duration-300 focus:outline-none ${service.estado ? 'bg-emerald-500' : 'bg-slate-200'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300 ${service.estado ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    ) : (
                      <div className={`w-2 h-2 rounded-full ${service.estado ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    )}
                  </div>
                </td>


                {/* Acciones que tiene cuando se cambia de estado  */} 
                <td className="py-4 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <ActionButton icon={Eye} onClick={() => onView(service)} tooltip="Ver Detalle" />
                      
                    {canManage && (
                      <>
                        {/* Editar servicio */}
                        {service.estado && (
                          <ActionButton icon={Edit2} onClick={() => onEdit(service)} tooltip="Editar" />
                        )}

                        {/* Eliminar servicio */}
                        {service.estado && (
                          <ActionButton icon={Trash2} onClick={() => onDelete(service.id)} tooltip="Eliminar" />
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


      {/* Paginacion de la pagina de servicios  */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={services.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};