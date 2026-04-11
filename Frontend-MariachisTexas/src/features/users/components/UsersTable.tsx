
import React, { useState } from 'react';
import { User, UserRole } from '@/types';
import { User as UserIcon, MapPin, Phone, Eye, Edit2, Trash2 } from 'lucide-react';
import { TablePagination } from '@/shared/components/TablePagination';

interface Props {
  users: User[];
  loading: boolean;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (user: User) => void;
}

export const UsersTable: React.FC<Props> = ({ users, loading, onView, onEdit, onDelete, onToggleStatus }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const ActionButton: React.FC<{ icon: React.ElementType, onClick: () => void, tooltip?: string }> = ({ icon: Icon, onClick, tooltip }) => (
    <button onClick={onClick} title={tooltip} className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all duration-200">
        <Icon size={16} strokeWidth={2} />
    </button>
  );

  const getRoleBadgeStyle = (role: UserRole) => {
      switch(role) {
          case UserRole.ADMIN: return 'bg-slate-900 text-white';
          case UserRole.EMPLEADO: return 'bg-primary-600 text-white';
          case UserRole.CLIENTE: return 'bg-emerald-500 text-white';
          default: return 'bg-slate-200 text-slate-600';
      }
  };

  if (loading) {
      return <div className="text-center py-20 text-slate-400">Cargando usuarios...</div>;
  }

  if (users.length === 0) {
      return <div className="text-center py-20 text-slate-400">No se encontraron usuarios.</div>;
  }

  // Pagination Logic
  const totalPages = Math.ceil(users.length / itemsPerPage);
  const currentUsers = users.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col">
      <div className="p-8 pb-4">
          <div className="hidden md:grid grid-cols-12 gap-6 px-4 pb-4 mb-2 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              <div className="col-span-4 pl-2">Usuario</div>
              <div className="col-span-2">Contacto</div>
              <div className="col-span-2 text-center">Rol</div>
              <div className="col-span-2 text-center">Estado</div>
              <div className="col-span-2 text-center">Acciones</div>
          </div>

          <div className="space-y-4">
              {currentUsers.map((user) => (
                  <div key={user.id} className="group grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-2 md:py-4 transition-all hover:bg-slate-50/50 rounded-xl">
                      
                      {/* Profile */}
                      <div className="col-span-4 flex items-center gap-5">
                          <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                              {user.avatar ? (
                                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                                      <UserIcon size={20} />
                                  </div>
                              )}
                          </div>
                          <div>
                              <h3 className="font-bold text-[#1e293b] text-sm mb-0.5">{user.name} {user.lastName}</h3>
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                  <span className="font-semibold bg-slate-100 px-1.5 rounded text-[10px]">{user.documentType}</span>
                                  {user.documentNumber}
                              </p>
                          </div>
                      </div>

                      {/* Contact */}
                      <div className="col-span-2 space-y-1">
                          <p className="text-xs text-slate-600 flex items-center gap-2">
                              <Phone size={12} className="text-slate-400" /> {user.phone}
                          </p>
                          <p className="text-xs text-slate-600 flex items-center gap-2">
                              <MapPin size={12} className="text-slate-400" /> {user.city}
                          </p>
                      </div>

                      {/* Role Badge */}
                      <div className="col-span-2 flex justify-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm ${getRoleBadgeStyle(user.role)}`}>
                              {user.role}
                          </span>
                      </div>

                      {/* Status Toggle */}
                      <div className="col-span-2 flex items-center justify-center gap-3">
                          <button 
                              onClick={() => onToggleStatus(user)} 
                              className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${user.isActive ? 'bg-[#dc2626]' : 'bg-slate-200'}`}
                          >
                              <span 
                                  className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-300 ${user.isActive ? 'translate-x-6' : 'translate-x-0'}`} 
                              />
                          </button>

                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex justify-center gap-3">
                          <ActionButton icon={Eye} onClick={() => onView(user)} tooltip="Ver detalle" />
                          {user.isActive && (
                            <>
                              <ActionButton icon={Edit2} onClick={() => onEdit(user)} tooltip="Editar usuario" />
                              {!user.hasActiveReservations && user.role !== UserRole.ADMIN && (
                                <ActionButton icon={Trash2} onClick={() => onDelete(user.id)} tooltip="Eliminar usuario" />
                              )}
                            </>
                          )}
                      </div>
                  </div>
              ))}
          </div>
      </div>
      <TablePagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={users.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};
