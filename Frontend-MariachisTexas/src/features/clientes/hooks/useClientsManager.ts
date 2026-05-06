
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { clientService } from '../services/clientService';

export const useClientsManager = () => {
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  
  // Estados de Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Cliente seleccionado para acciones
  const [selectedClient, setSelectedClient] = useState<User | null>(null);

  // Confirmación
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, clientId: string | null}>({
      isOpen: false,
      clientId: null
  });

  // Notificaciones
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchClients = async (page: number = 1, query: string = '') => {
    setLoading(true);
    try {
      if (query.trim()) {
        const data = await clientService.searchClients(query);
        setClients(data);
        setPagination({ page: 1, limit: data.length, total: data.length, pages: 1 });
      } else {
        const data = await clientService.getClients();
        setClients(data.clients);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error(error);
      showNotification("Error cargando clientes.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Solo buscar si query tiene 2+ caracteres, sino mostrar todos
      if (searchTerm.trim().length >= 2) {
        fetchClients(1, searchTerm);
      } else if (searchTerm.trim().length === 0) {
        fetchClients(1);
      }
      // Si tiene 1 carácter, no hacer nada (esperar a que escriban más)
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handlers
  const handleCreateClient = async (clientData: any) => {
    const newClient = await clientService.createClient(clientData);
    setClients(prev => [newClient, ...prev]);
    showNotification('Nuevo cliente registrado exitosamente.');
    setIsCreateOpen(false);
  };

  const handleUpdateClient = async (clientData: any) => {
    if (!selectedClient) return;
    await clientService.updateClient(selectedClient.id, clientData);
    showNotification('Cliente actualizado exitosamente.');
    setIsEditOpen(false);
    await fetchClients(pagination.page, searchTerm); // refresca respetando página y búsqueda activa
  };

  const confirmDelete = async () => {
    if (!deleteModal.clientId) return;
    try {
        await clientService.deleteClient(deleteModal.clientId);
        setDeleteModal({ isOpen: false, clientId: null });
        showNotification('Cliente eliminado del sistema.');
        await fetchClients(pagination.page, searchTerm);
    } catch (error) {
        console.error(error);
        showNotification("No se pudo eliminar el cliente.", "error");
    }
  };

  const handleToggleStatus = async (client: User) => {
    const newStatus = !client.isActive;
    try {
        setClients(prev => prev.map(c => c.id === client.id ? { ...c, isActive: newStatus } : c));
        await clientService.toggleClientStatus(client.id, newStatus);
        showNotification(`Cliente ${newStatus ? 'activado' : 'desactivado'} correctamente.`);
    } catch (error: any) {
        console.error(error);
        fetchClients();
        const msg = error?.response?.data?.message || error?.message || 'Error al cambiar el estado.';
        showNotification(msg, "error");
    }
  };

  return {
    clients, setClients,
    loading, setLoading,
    searchTerm, setSearchTerm,
    pagination, setPagination,
    isCreateOpen, setIsCreateOpen,
    isEditOpen, setIsEditOpen,
    isDetailOpen, setIsDetailOpen,
    selectedClient, setSelectedClient,
    deleteModal, setDeleteModal,
    notification, setNotification,
    showNotification,
    fetchClients,
    handleCreateClient,
    handleUpdateClient,
    confirmDelete,
    handleToggleStatus
  };
};
