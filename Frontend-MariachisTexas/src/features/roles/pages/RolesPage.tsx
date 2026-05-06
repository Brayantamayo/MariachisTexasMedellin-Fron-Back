
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, CheckCircle, AlertCircle, X } from 'lucide-react';
import { roleService } from '../services/roleService';
import { Role } from '@/types';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

// Componentes Modulares
import { RolesTable } from '../components/RolesTable';
import { RoleCreateModal } from '../components/RoleCreateModal';
import { RoleEditModal } from '../components/RoleEditModal';
import { RoleDetailModal } from '../components/RoleDetailModal';

export const RolesPage: React.FC = () => {
  const SYSTEM_ROLE_NAMES = new Set(['ADMIN', 'EMPLEADO', 'CLIENTE']);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; roleId: string | null }>({ isOpen: false, roleId: null });

  // Notificaciones
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const isSystemRole = (role?: Role | null) =>
    Boolean(role?.isSystem) || SYSTEM_ROLE_NAMES.has(role?.name?.trim().toUpperCase() ?? '');

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await roleService.getRoles();
      setRoles(data);
    } catch (error) {
      console.error("Error cargando roles", error);
      showNotification("Error al cargar la lista de roles.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // CRUD Handlers
  const handleCreateRole = async (roleData: any) => {
    try {
        const newRole = await roleService.createRole(roleData);
        setRoles(prevRoles => [newRole, ...prevRoles]);
        showNotification('Nuevo rol creado exitosamente.');
        setIsCreateOpen(false);
    } catch (error) {
      console.error(error);
      showNotification("Error al crear el rol.", "error");
      throw error;
    }
  };

  const handleUpdateRole = async (roleData: any) => {
    if (!selectedRole) return;
    if (isSystemRole(selectedRole)) {
      showNotification('Los roles predeterminados no se pueden editar.', 'error');
      return;
    }
    try {
        const updatedRole = await roleService.updateRole(selectedRole.id, roleData);
        setRoles(prevRoles => prevRoles.map(role => 
            role.id === updatedRole.id ? updatedRole : role
        ));
        showNotification('El rol ha sido actualizado correctamente.');
        setIsEditOpen(false);
    } catch (error) {
      console.error(error);
      showNotification(getErrorMessage(error, "Error al actualizar el rol."), "error");
      throw error;
    }
  };

  const handleDelete = (id: string) => {
    const role = roles.find(r => r.id === id);
    if (isSystemRole(role)) {
      showNotification('Los roles predeterminados no se pueden eliminar.', 'error');
      return;
    }
    setDeleteModal({ isOpen: true, roleId: id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.roleId) return;
    const role = roles.find(r => r.id === deleteModal.roleId);
    if (isSystemRole(role)) {
      showNotification('Los roles predeterminados no se pueden eliminar.', 'error');
      setDeleteModal({ isOpen: false, roleId: null });
      return;
    }
    try {
      await roleService.deleteRole(deleteModal.roleId);
      setRoles(prev => prev.filter(r => r.id !== deleteModal.roleId));
      showNotification('El rol ha sido eliminado del sistema.');
    } catch (error) {
      console.error("Error eliminando", error);
      showNotification(getErrorMessage(error, "No se pudo eliminar el rol."), "error");
    } finally {
      setDeleteModal({ isOpen: false, roleId: null });
    }
  };

  const handleToggleStatus = async (role: Role) => {
    if (isSystemRole(role)) {
      showNotification('Los roles predeterminados no pueden cambiar de estado.', 'error');
      return;
    }
    const newStatus = !role.isActive;
    try {
        setRoles(prev => prev.map(r => r.id === role.id ? { ...r, isActive: newStatus } : r));
        await roleService.updateRole(role.id, { isActive: newStatus });
        showNotification(`Rol ${newStatus ? 'activado' : 'desactivado'} correctamente.`);
    } catch (error) {
        console.error("Error cambiando estado", error);
        fetchRoles(); 
        showNotification(getErrorMessage(error, "Error al cambiar el estado."), "error");
    }
  };

  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      
      {/* Toast Notification */}
      {notification && createPortal(
        <div className="fixed top-6 right-6 z-[200] animate-fade-in-up">
            <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md min-w-[320px] ${
                notification.type === 'success' 
                ? 'bg-white/95 border-emerald-100 shadow-emerald-900/5' 
                : 'bg-white/95 border-red-100 shadow-red-900/5'
            }`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                }`}>
                    {notification.type === 'success' ? <CheckCircle size={20} strokeWidth={3} /> : <AlertCircle size={20} strokeWidth={3} />}
                </div>
                <div className="flex-1">
                    <h4 className={`font-bold text-sm ${notification.type === 'success' ? 'text-emerald-950' : 'text-red-950'}`}>
                        {notification.type === 'success' ? '¡Excelente!' : '¡Atención!'}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">{notification.message}</p>
                </div>
                <button 
                    onClick={() => setNotification(null)} 
                    className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg"
                >
                    <X size={18} />
                </button>
            </div>
        </div>,
        document.body
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1e293b] tracking-wide uppercase">
            Gestión de Roles
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Configura los niveles de acceso y seguridad de tu equipo.
          </p>
        </div>
        <button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#dc2626] hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 font-bold text-xs tracking-widest uppercase"
        >
          <Plus size={18} strokeWidth={3} />
          Crear Nuevo Rol
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden min-h-[400px]">
        
        {/* Search */}
        <div className="p-8 pb-0">
            <div className="relative max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar rol por nombre..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-full py-3 pl-11 pr-6 text-slate-600 focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all placeholder:text-slate-400 text-sm"
                />
            </div>
        </div>

        {/* Modular Table */}
        <RolesTable 
            roles={filteredRoles}
            loading={loading}
            onView={(role) => { setSelectedRole(role); setIsDetailOpen(true); }}
            onEdit={(role) => {
              if (isSystemRole(role)) {
                showNotification('Los roles predeterminados no se pueden editar.', 'error');
                return;
              }
              setSelectedRole(role);
              setIsEditOpen(true);
            }}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
        />
      </div>

      {/* Modals */}
      <RoleCreateModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleCreateRole}
      />

      <RoleEditModal 
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleUpdateRole}
        role={selectedRole}
      />

      <RoleDetailModal 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        role={selectedRole}
      />

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={confirmDelete}
        title="¿Eliminar Rol?"
        message="Estás a punto de eliminar este rol permanentemente. Esta acción no se puede deshacer y los usuarios asignados perderán su acceso."
        confirmText="Sí, Eliminar"
      />
    </div>
  );
};
