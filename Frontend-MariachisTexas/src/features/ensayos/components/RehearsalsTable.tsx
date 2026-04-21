import React, { useState } from 'react';
import { Rehearsal, UserRole } from '@/types';
import { Calendar, Clock, MapPin, Music, Edit2, Trash2, Eye } from 'lucide-react';
import { TablePagination } from '@/shared/components/TablePagination';

interface Props {
  rehearsals: Rehearsal[];
  loading: boolean;
  userRole?: UserRole;
  onView: (rehearsal: Rehearsal) => void;
  onEdit: (rehearsal: Rehearsal) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (rehearsal: Rehearsal) => void;
}

export const RehearsalsTable: React.FC<Props> = ({
  rehearsals, loading, userRole, onView, onEdit, onDelete, onToggleStatus
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const canManage = userRole === UserRole.ADMIN || userRole === UserRole.EMPLEADO;

  // ─── Botón de acción reutilizable ──────────────────────────────────────────
  const ActionButton: React.FC<{
    icon: React.ElementType;
    onClick: () => void;
    tooltip?: string;
    variant?: 'default' | 'danger';
  }> = ({ icon: Icon, onClick, tooltip, variant = 'default' }) => (
    <button
      onClick={onClick}
      title={tooltip}
      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${variant === 'danger'
          ? 'bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600'
          : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
        }`}
    >
      <Icon size={16} strokeWidth={2} />
    </button>
  );

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-400">
        Cargando programación...
      </div>
    );
  }

  if (rehearsals.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        No se encontraron ensayos programados.
      </div>
    );
  }

  const totalPages = Math.ceil(rehearsals.length / itemsPerPage);
  const currentRehearsals = rehearsals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto pb-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 text-left">
              <th className="py-6 px-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Fecha y Hora</th>
              <th className="py-6 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ensayo</th>
              <th className="py-6 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ubicación</th>
              <th className="py-6 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Repertorio</th>
              <th className="py-6 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
              <th className="py-6 px-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {currentRehearsals.map(rehearsal => {
              // ✅ "LISTO" viene del mapeo del service
              const isCompleted = rehearsal.status === 'LISTO';

              return (
                <tr
                  key={rehearsal.id}
                  className={`transition-colors group ${isCompleted
                      ? 'bg-slate-50/60 opacity-75'       // visual atenuado para completados
                      : 'hover:bg-slate-50/50'
                    }`}
                >
                  {/* Fecha y Hora */}
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar size={14} className="text-slate-400" />
                      {rehearsal.date}
                      <Clock size={14} className="text-slate-400" />
                      {rehearsal.time}
                    </div>
                  </td>

                  {/* Título */}
                  <td className="py-5 px-6">
                    <span className="font-bold text-slate-800 block text-sm">
                      {rehearsal.title}
                    </span>
                  </td>

                  {/* Ubicación */}
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin size={14} className="text-slate-400" />
                      {rehearsal.location}
                    </div>
                  </td>

                  {/* Canciones */}
                  <td className="py-5 px-6 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200">
                      <Music size={12} />
                      {rehearsal.repertoireIds.length}
                    </span>
                  </td>

                  {/* Estado */}
                  <td className="py-5 px-6">
                    <div className="flex items-center justify-center gap-3">
                      {canManage ? (
                        <button
                          onClick={() => !isCompleted && onToggleStatus(rehearsal)}
                          disabled={isCompleted}
                          title={isCompleted ? 'Ensayo completado' : 'Marcar como Listo'}
                          className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${isCompleted
                              ? 'bg-emerald-500 focus-visible:ring-emerald-400 cursor-not-allowed opacity-70'
                              : 'bg-primary-500 focus-visible:ring-primary-400 cursor-pointer'
                            }`}
                        >
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isCompleted ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                        </button>
                      ) : (
                        <div className={`w-2.5 h-2.5 rounded-full ${isCompleted ? 'bg-emerald-500 shadow-sm' : 'bg-primary-500'
                          }`} />
                      )}

                      <span className={`text-[10px] font-bold uppercase tracking-wider w-20 text-center ${isCompleted ? 'text-emerald-600' : 'text-primary-600'
                        }`}>
                        {isCompleted ? 'Listo' : 'Pendiente'}
                      </span>
                    </div>
                  </td>


                  {/* Acciones */}
                  <td className="py-5 px-8">
                    <div className="flex items-center justify-center gap-2">
                      {/* Ver siempre disponible */}
                      <ActionButton
                        icon={Eye}
                        onClick={() => onView(rehearsal)}
                        tooltip="Ver detalles"

                      />

                      {canManage && (
                        <>
                          {!isCompleted && (
                            <ActionButton
                              icon={Edit2}
                              onClick={() => onEdit(rehearsal)}
                              tooltip="Editar ensayo"
                            />
                          )}
                          {
                            !isCompleted && (
                              <ActionButton
                                icon={Trash2}
                                onClick={() => onDelete(rehearsal.id)}
                                tooltip="Eliminar ensayo"
                              />
                            )
                          }

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
        totalItems={rehearsals.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};