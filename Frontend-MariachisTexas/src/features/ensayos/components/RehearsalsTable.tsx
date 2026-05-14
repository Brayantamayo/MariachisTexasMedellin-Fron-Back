import React, { useState } from 'react';
import { Rehearsal, UserRole } from '@/types';
import { Calendar, Clock, MapPin, Music, Edit2, Trash2, Eye } from 'lucide-react';
import { TablePagination } from '@/shared/components/TablePagination';
import { ActionButton } from '@/shared/components/ActionButton';

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
              // 🕒 Lógica automática: ¿Ha pasado ya el ensayo?
              const now = new Date();
              // Combinamos fecha y hora (asumiendo formato YYYY-MM-DD y HH:mm)
              const rehearsalDateTime = new Date(`${rehearsal.date}T${rehearsal.time}`);
              const isPassed = now > rehearsalDateTime;
              
              // El estado es LISTO si ya pasó el tiempo o si ya venía así de base
              const isCompleted = isPassed || rehearsal.status === 'LISTO';
              const isFuture = rehearsalDateTime > now;

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

                  {/* Estado Automático */}
                  <td className="py-5 px-6">
                    <div className="flex items-center justify-center gap-3">
                      {/* El interruptor ahora es solo visual y está deshabilitado */}
                      <div
                        title={isCompleted ? 'Ensayo finalizado' : 'Pendiente por realizar'}
                        className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors duration-300 opacity-70 ${isCompleted
                            ? 'bg-emerald-500'
                            : 'bg-primary-500'
                          }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isCompleted ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                      </div>

                      <span className={`text-[10px] font-bold uppercase tracking-wider w-20 text-center ${isCompleted ? 'text-emerald-600' : 'text-primary-600'
                        }`}>
                        {isCompleted ? 'Listo' : 'Pendiente'}
                      </span>
                    </div>
                  </td>


                  {/* Acciones */}
                  <td className="py-5 px-8">
                    <div className="flex items-center justify-center gap-2">
                      <ActionButton
                        icon={Eye}
                        onClick={() => onView(rehearsal)}
                        tooltip="Ver detalles"
                      />

                      {canManage && (
                        <>
                          {/* Solo se puede editar si no ha pasado */}
                          {!isPassed && (
                            <ActionButton
                              icon={Edit2}
                              onClick={() => onEdit(rehearsal)}
                              tooltip="Editar ensayo"
                            />
                          )}
                          
                          {/* Solo se puede eliminar si es en el futuro */}
                          {isFuture && (
                            <ActionButton
                              icon={Trash2}
                              onClick={() => onDelete(rehearsal.id)}
                              tooltip="Eliminar ensayo"
                            />
                          )}
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