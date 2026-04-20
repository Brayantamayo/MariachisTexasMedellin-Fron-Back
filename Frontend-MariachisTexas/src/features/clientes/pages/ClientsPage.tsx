
import React from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, CheckCircle, AlertCircle, X } from 'lucide-react';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal';
import { useClientsManager } from '../hooks/useClientsManager';

// Nuevos componentes granulares
import { ClientsTable } from '../components/ClientsTable';
import { ClientCreateModal } from '../components/ClientCreateModal';
import { ClientEditModal } from '../components/ClientEditModal';
import { ClientDetailModal } from '../components/ClientDetailModal';

export const ClientsPage: React.FC = () => {
  const {
    clients,
    loading,
    searchTerm, setSearchTerm,
    pagination,
    isCreateOpen, setIsCreateOpen,
    isEditOpen, setIsEditOpen,
    isDetailOpen, setIsDetailOpen,
    selectedClient, setSelectedClient,
    deleteModal, setDeleteModal,
    notification, setNotification,
    handleCreateClient,
    handleUpdateClient,
    confirmDelete,
    handleToggleStatus,
    fetchClients
  } = useClientsManager();

  // Filtros (ahora manejado en backend)
  const filteredClients = clients;

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
          <h1 className="text-3xl font-serif font-bold text-[#1e293b] tracking-wide uppercase">Gestión de Clientes</h1>
          <p className="text-slate-500 mt-2 text-sm">Administra la base de datos de clientes y contactos.</p>
        </div>
        <button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#dc2626] hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 font-bold text-xs tracking-widest uppercase"
        >
          <Plus size={18} strokeWidth={3} />
          Nuevo Cliente
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden min-h-[400px]">
        
        {/* Search */}
        <div className="p-8 pb-0">
            <div className="relative max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por nombre, documento o teléfono..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-full py-3 pl-11 pr-6 text-slate-600 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all placeholder:text-slate-400 text-sm"
                />
            </div>
        </div>

        {/* Tabla Modular */}
        <ClientsTable 
            clients={filteredClients}
            loading={loading}
            pagination={pagination}
            onView={(client) => { setSelectedClient(client); setIsDetailOpen(true); }}
            onEdit={(client) => { setSelectedClient(client); setIsEditOpen(true); }}
            onDelete={(id) => setDeleteModal({ isOpen: true, clientId: id })}
            onToggleStatus={handleToggleStatus}
            onPageChange={(page) => fetchClients(page, searchTerm)}
        />
      </div>

      {/* Modales Modulares */}
      <ClientCreateModal 
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleCreateClient}
      />

      <ClientEditModal 
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleUpdateClient}
        client={selectedClient}
      />

      <ClientDetailModal 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        client={selectedClient}
      />

      <ConfirmationModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={confirmDelete}
        title="¿Eliminar Cliente?"
        message="Estás a punto de eliminar este cliente. Esta acción no se puede deshacer."
        confirmText="Sí, Eliminar"
      />
    </div>
  );
};
