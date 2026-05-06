
import React, { useState } from 'react';
import { Role } from '@/types';
import { Eye, Edit2, Trash2, Shield, LayoutGrid, Check } from 'lucide-react';
import { TablePagination } from '@/shared/components/TablePagination';

interface Props {
  roles: Role[];
  loading: boolean;
  onView: (role: Role) => void;
  onEdit: (role: Role) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (role: Role) => void;
}

export const RolesTable: React.FC<Props> = ({ roles, loading, onView, onEdit, onDelete, onToggleStatus }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const isSystemRole = (role: Role) => Boolean(role.isSystem);
  
  const ActionButton: React.FC<{ icon: React.ElementType, onClick: () => void, tooltip?: string, disabled?: boolean }> = ({ icon: Icon, onClick, tooltip, disabled = false }) => (
    <button
        onClick={onClick}
        title={tooltip}
        disabled={disabled}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
            disabled
              ? 'cursor-not-allowed bg-slate-100 text-slate-300 opacity-70'
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
        }`}
    >
        <Icon size={16} strokeWidth={2} />
    </button>
  );

  const getAvatarStyle = (name: string) => {
      const isSuperAdmin = name.toLowerCase().includes('admin');
      if (isSuperAdmin) return 'bg-[#0f172a] text-white'; // Dark Slate/Black
      return 'bg-[#dc2626] text-white'; // Red Primary
  };

  if (loading) {
      return <div className="text-center py-20 text-slate-400">Cargando roles...</div>;
  }

  if (roles.length === 0) {
      return <div className="text-center py-20 text-slate-400">No se encontraron roles.</div>;
  }

  // Pagination Logic
  const totalPages = Math.ceil(roles.length / itemsPerPage);
  const currentRoles = roles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col">
      <div className="p-8 pb-4">
          <div className="hidden md:grid grid-cols-12 gap-6 px-4 pb-4 mb-2 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              <div className="col-span-5 pl-2">Perfil del Rol</div>
              <div className="col-span-3">Alcance de Permisos</div>
              <div className="col-span-2 text-center">Estado</div>
              <div className="col-span-2 text-center">Acciones</div>
          </div>

          <div className="space-y-4">
              {currentRoles.map((role) => (
                  <div key={role.id} className="group grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-2 md:py-4 transition-all hover:bg-slate-50/50 rounded-xl">
                      {(() => {
                        const locked = isSystemRole(role);
                        const actionsTooltip = locked ? 'Rol predeterminado del sistema' : undefined;

                        return (
                          <>
                      
                      {/* Role Profile */}
                      <div className="col-span-5 flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-serif font-bold shadow-sm ${getAvatarStyle(role.name)}`}>
                              {role.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                              <div className="mb-1 flex flex-wrap items-center gap-2">
                                  <h3 className="font-bold text-[#1e293b] text-sm uppercase tracking-wide">{role.name}</h3>
                                  {locked && (
                                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 border border-amber-200">
                                      Predeterminado
                                    </span>
                                  )}
                              </div>
                              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">{role.description}</p>
                          </div>
                      </div>

                      {/* Permissions Stats */}
                      <div className="col-span-3 flex items-center gap-3">
                          <div className="flex -space-x-1">
                              <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-300 shadow-sm z-30"><Shield size={14}/></div>
                              <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-300 shadow-sm z-20"><LayoutGrid size={14}/></div>
                              <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-300 shadow-sm z-10"><Check size={14}/></div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-3">
                              {role.permissions.length} Permisos
                          </span>
                      </div>

                      {/* Status Toggle */}
                      <div className="col-span-2 flex items-center justify-center gap-3">
                          <button 
                              onClick={() => onToggleStatus(role)} 
                              disabled={locked}
                              title={actionsTooltip}
                              className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${role.isActive ? 'bg-[#dc2626]' : 'bg-slate-200'} ${locked ? 'cursor-not-allowed opacity-60' : ''}`}
                          >
                              <span 
                                  className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300 ${role.isActive ? 'translate-x-6' : 'translate-x-0'}`} 
                              />
                          </button>
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex justify-center gap-3">
                          <ActionButton icon={Eye} onClick={() => onView(role)} tooltip="Ver detalle" />
                          {(role.isActive || locked) && (
                            <>
                              <ActionButton icon={Edit2} onClick={() => onEdit(role)} tooltip={actionsTooltip ?? 'Editar rol'} disabled={locked} />
                              <ActionButton icon={Trash2} onClick={() => onDelete(role.id)} tooltip={actionsTooltip ?? 'Eliminar rol'} disabled={locked} />
                            </>
                          )}
                      </div>
                          </>
                        );
                      })()}
                  </div>
              ))}
          </div>
      </div>
      <TablePagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={roles.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};
