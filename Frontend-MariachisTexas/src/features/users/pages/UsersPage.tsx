
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, CheckCircle, AlertCircle, X } from 'lucide-react';
import { userService } from '../services/userService';
import { User } from '@/types';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal';

// Componentes Modulares
import { UsersTable } from '../components/UsersTable';
import { UserCreateModal } from '../components/UserCreateModal';
import { UserEditModal } from '../components/UserEditModal';
import { UserDetailModal } from '../components/UserDetailModal';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Estado para Confirmación de Eliminación
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, userId: string | null}>({
      isOpen: false,
      userId: null
  });

  // Notificaciones
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error cargando usuarios", error);
      showNotification("Error al cargar la lista de usuarios.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // CRUD Handlers
  const handleCreateUser = async (userData: any) => {
    await userService.createUser(userData);
    // Recargar lista completa para obtener usuario con todas sus relaciones
    await fetchUsers();
    showNotification('Usuario creado exitosamente.');
    setIsCreateOpen(false);
  };

  const handleUpdateUser = async (userData: any) => {
    if (!selectedUser) return;
    await userService.updateUser(selectedUser.id, userData);
    await fetchUsers();
    showNotification('Usuario actualizado correctamente.');
    setIsEditOpen(false);
  };

  const confirmDelete = async () => {
    if (!deleteModal.userId) return;

    try {
        await userService.deleteUser(deleteModal.userId);
        setUsers(prev => prev.filter(u => u.id !== deleteModal.userId));
        showNotification('El usuario ha sido eliminado del sistema.');
    } catch (error) {
        console.error(error);
        showNotification("No se pudo eliminar el usuario.", "error");
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = !user.isActive;
    try {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: newStatus } : u));
        await userService.updateUser(user.id, { isActive: newStatus });
        showNotification(`Usuario ${newStatus ? 'activado' : 'desactivado'} correctamente.`);
    } catch (error: any) {
        console.error("Error cambiando estado", error);
        fetchUsers();
        const msg = error?.response?.data?.message || error?.message || 'Error al cambiar el estado.';
        showNotification(msg, "error");
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.documentNumber.includes(searchTerm)
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
                <button onClick={() => setNotification(null)} className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg">
                    <X size={18} />
                </button>
            </div>
        </div>,
        document.body
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1e293b] tracking-wide uppercase">Gestión de Usuarios</h1>
          <p className="text-slate-500 mt-2 text-sm">Administra músicos, clientes y administradores del sistema.</p>
        </div>
        <button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#dc2626] hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 font-bold text-xs tracking-widest uppercase"
        >
          <Plus size={18} strokeWidth={3} />
          Crear Usuario
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden min-h-[400px]">
        <div className="p-8 pb-0">
            <div className="relative max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por nombre o documento..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-full py-3 pl-11 pr-6 text-slate-600 focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all placeholder:text-slate-400 text-sm"
                />
            </div>
        </div>

        {/* Tabla Modular */}
        <UsersTable 
            users={filteredUsers}
            loading={loading}
            onView={(user) => { setSelectedUser(user); setIsDetailOpen(true); }}
            onEdit={(user) => { setSelectedUser(user); setIsEditOpen(true); }}
            onDelete={(id) => setDeleteModal({ isOpen: true, userId: id })}
            onToggleStatus={handleToggleStatus}
        />
      </div>

      {/* Modales Modulares */}
      <UserCreateModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleCreateUser}
      />

      <UserEditModal 
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleUpdateUser}
        user={selectedUser}
      />

      <UserDetailModal 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        user={selectedUser}
      />

      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={confirmDelete}
        title="¿Eliminar Usuario?"
        message="Estás a punto de eliminar este usuario permanentemente. Esta acción no se puede deshacer y perderás el historial asociado."
        confirmText="Sí, Eliminar"
      />
    </div>
  );
};
