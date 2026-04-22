import React, { useState, useEffect } from 'react';
import { Plus, Search, CheckCircle, AlertCircle, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { servicesService } from '@/src/features/servicio/services/servicesService';
import { Service, UserRole } from '@/types';
import { useAuth } from '@/shared/contexts/AuthContext';
import { ServicesTable } from '@/src/features/servicio/components/ServicesTable';
import { ServiceCreateModal } from '@/src/features/servicio/components/ServiceCreateModal';
import { ServiceEditModal } from '@/src/features/servicio/components/ServiceEditModal';
import { ServiceDetailModal } from '@/src/features/servicio/components/ServiceDetailModal';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal';

export const ServicesPage: React.FC = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; serviceId: string | null }>({
    isOpen: false,
    serviceId: null,
  });

  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await servicesService.getServices();
      setServices(data);
    } catch (error) {
      console.error(error);
      showNotification("Error cargando servicios.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleCreate = async (serviceData: Omit<Service, 'id' | 'estado'>) => {
      const newService = await servicesService.createService(serviceData);
      setServices(prev => [newService, ...prev]);
      await fetchServices();
      showNotification('Servicio creado exitosamente.');
      setIsCreateOpen(false);
  };

  const handleUpdate = async (serviceData: Omit<Service, 'id' | 'estado'>) => {
    if (!selectedService) return;
    
      const updated = await servicesService.updateService(selectedService.id, serviceData);
      setServices(prev => prev.map(s => s.id === updated.id ? updated : s));
      await fetchServices();
      showNotification('Servicio actualizado exitosamente.');
      setIsEditOpen(false);
      setSelectedService(null);
  };

const confirmDelete = async () => {
  if (!deleteModal.serviceId) return;
  try {
    await servicesService.deleteService(deleteModal.serviceId); // ✅ sin isActive
    setServices(prev => prev.filter(s => s.id !== deleteModal.serviceId));
    showNotification('Servicio eliminado.');
  } catch (error: any) {
    showNotification(
      error?.response?.data?.message || error?.message || 'No se pudo eliminar el servicio.',
      'error'
    );
  } finally {
    setDeleteModal({ isOpen: false, serviceId: null });
  }
};

  const handleToggleStatus = async (service: Service) => {
    try {
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, estado: !service.estado } : s));
      await servicesService.toggleEstado(service.id);
    } catch (error: any) {
      console.error(error);
      fetchServices();
      showNotification(
        error?.response?.data?.message || error?.message || 'Error al cambiar estado.',
        'error'
      );
    }
  };

  const filteredServices = services.filter(service =>
  service?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  service?.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
);

  const canManage = user?.role === UserRole.ADMIN;

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      
      {notification && createPortal(
        <div className="fixed top-6 right-6 z-[200] animate-fade-in-up">
          <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md min-w-[320px] ${
            notification.type === 'success' ? 'bg-white/95 border-emerald-100 text-emerald-950' : 'bg-white/95 border-red-100 text-red-950'
          }`}>
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
            }`}>
              {notification.type === 'success' ? <CheckCircle size={20} strokeWidth={3} /> : <AlertCircle size={20} strokeWidth={3} />}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm">{notification.type === 'success' ? '¡Excelente!' : 'Atención'}</h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#1e293b] tracking-wide uppercase">SERVICIOS ADICIONALES</h1>
          <p className="text-slate-500 mt-2 text-sm">Gestiona el catálogo de servicios extra para eventos.</p>
        </div>
        {canManage && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#dc2626] hover:bg-red-700 text-white px-8 py-3 rounded-full flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 font-bold text-xs tracking-widest uppercase w-full md:w-auto"
          >
            <Plus size={16} strokeWidth={3} />
            NUEVO SERVICIO
          </button>
        )}
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-2xl md:rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-4 md:p-8 pb-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-full py-3.5 pl-12 pr-6 text-slate-600 focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all placeholder:text-slate-400 text-sm shadow-sm"
            />
          </div>
        </div>

        <ServicesTable
          services={filteredServices}
          loading={loading}
          userRole={user?.role}
          onEdit={(service) => { setSelectedService(service); setIsEditOpen(true); }}
          onDelete={(id) => setDeleteModal({ isOpen: true, serviceId: id })}
          onView={(service) => { setSelectedService(service); setIsDetailOpen(true); }}
          onToggleStatus={handleToggleStatus}
        />
      </div>

      <ServiceCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={handleCreate}
      />

      <ServiceEditModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setSelectedService(null); }}
        onSave={handleUpdate}
        service={selectedService}
      />

      <ServiceDetailModal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedService(null); }}
        service={selectedService}
      />

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={confirmDelete}
        title="¿Eliminar Servicio?"
        message="¿Estás seguro? Esta acción eliminará el servicio permanentemente."
        confirmText="Sí, Eliminar"
      />
    </div>
  );
};