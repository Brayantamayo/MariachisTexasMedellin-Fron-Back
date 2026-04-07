
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, CheckCircle, AlertCircle, Calendar, User, FileText, CreditCard } from 'lucide-react';
import { Sale, ventaService } from '../services/ventaService';
import { reservaService } from '../../reservas/services/reservaService';
import { abonoService } from '../../abonos/services/abonoService';
import { useAuth } from '@/shared/contexts/AuthContext';
import { UserRole, Reservation } from '@/types';

// Componentes Modulares
import { VentasTable } from '../components/VentasTable';
import { VentaCreateModal } from '../components/VentaCreateModal';
import { VentaEditModal } from '../components/VentaEditModal';
import { VentaDetailModal } from '../components/VentaDetailModal';
import { AbonoCreateModal } from '../../abonos/components/AbonoCreateModal';

export const VentasPage: React.FC = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false);
  
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [abonoReservationId, setAbonoReservationId] = useState<string | null>(null);

  // Notification
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const [salesData, reservationsData] = await Promise.all([
          ventaService.getSales(),
          reservaService.getReservations()
      ]);
      
      // 1. Procesar TODAS las ventas del backend (directas y por reserva)
      const backendSales: Sale[] = salesData.map(s => ({
          ...s,
          status: 'Completado'
      }));

      // 2. Si hay reservas SIN venta asociada y tienen pagos, mostrarlas como "en proceso"
      // (Las que ya tienen venta ya están en backendSales)
      const reservationSalesInProgress: Sale[] = [];
      reservationsData
          .filter(r => r.status === 'Confirmado' && r.paidAmount > 0 && r.paidAmount < r.totalAmount)
          .forEach(r => {
              // Verificar si ya existe en ventas del backend
              const alreadyExists = backendSales.some(s => s.reservationId === r.id);
              if (!alreadyExists) {
                  const lastPaymentDate = r.payments.length > 0 
                      ? r.payments[r.payments.length - 1].date.split('T')[0]
                      : new Date().toISOString().split('T')[0];
                  
                  reservationSalesInProgress.push({
                      id: `V-RES-${r.id}`,
                      date: lastPaymentDate,
                      type: 'Por Reserva',
                      clientName: r.clientName,
                      clientId: r.clientId,
                      concept: `Servicio: ${r.eventType} (#${r.id})`,
                      method: r.payments.length > 0 ? r.payments[r.payments.length - 1].method : 'Pendiente',
                      amount: r.paidAmount,
                      totalAmount: r.totalAmount,
                      pendingAmount: r.totalAmount - r.paidAmount,
                      reservationId: r.id,
                      reservationStatus: 'Confirmado' as any,
                      status: 'Completado'
                  });
              }
          });
      
      let combinedData = [...backendSales, ...reservationSalesInProgress];
      
      // Ordenar por fecha descendente
      combinedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // FILTRO DE SEGURIDAD: Si es cliente, solo ve sus compras
      if (user && user.role === UserRole.CLIENTE) {
          combinedData = combinedData.filter(s => 
              s.clientId === user.id || 
              s.clientName.toLowerCase().includes(user.name.toLowerCase())
          );
      }

      setSales(combinedData);
    } catch (error) {
      console.error(error);
      showNotification("Error cargando ventas.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [user]);

  const handleCreateSale = async (data: any) => {
      try {
          // Validación básica
          if (!data.clienteId || data.clienteId === '0') {
              showNotification("❌ Debes seleccionar un cliente válido", "error");
              return;
          }
          if (!data.amount || Number(data.amount) <= 0) {
              showNotification("❌ El monto debe ser mayor a 0", "error");
              return;
          }
          if (data.type === 'Por Reserva' && !data.reservationId) {
              showNotification("❌ Debes seleccionar una reserva", "error");
              return;
          }
          
          await ventaService.createSale(data);
          await fetchSales(); // Re-fetch all to sync reservations and sales
          showNotification('✅ Venta registrada exitosamente.');
          setIsCreateOpen(false);
      } catch (error: any) {
          console.error(error);
          const errorMsg = error?.response?.data?.message || error?.message || "Error al registrar la venta";
          showNotification(`❌ ${errorMsg}`, "error");
      }
  };

  const handleUpdateSale = async (data: any) => {
      if (!selectedSale) return;
      try {
          const updated = await ventaService.updateSale(selectedSale.id, data);
          setSales(prev => prev.map(s => s.id === updated.id ? updated : s));
          showNotification('Venta actualizada exitosamente.');
          setIsEditOpen(false);
      } catch (error) {
          console.error(error);
          showNotification("Error al actualizar la venta.", "error");
      }
  };

  const handleDownload = async (id: string) => {
      showNotification('Generando factura...', 'success');
      try {
          await ventaService.downloadInvoice(id);
          showNotification('Factura descargada correctamente.');
      } catch (error) {
          showNotification('Error al descargar.', 'error');
      }
  };

  const handleSaveAbono = async (data: any) => {
      try {
          await abonoService.createAbono(data);
          // Reutilizamos fetchSales para actualizar todo
          await fetchSales();
          showNotification('✅ Abono registrado exitosamente.');
          setIsAbonoModalOpen(false);
      } catch (error) {
          console.error(error);
          showNotification('Error al registrar abono.', 'error');
      }
  };

  const filteredSales = sales.filter(s => 
      s.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isClient = user?.role === UserRole.CLIENTE;

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      
      {/* Toast */}
      {notification && createPortal(
        <div className="fixed top-6 right-6 z-[200] animate-fade-in-up">
            <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md min-w-[320px] ${
                notification.type === 'success' ? 'bg-white/95 border-emerald-100' : 'bg-white/95 border-red-100'
            }`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                }`}>
                    {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} /> }
                </div>
                <div className="flex-1">
                    <h4 className={`font-bold text-sm ${notification.type === 'success' ? 'text-emerald-950' : 'text-red-950'}`}>
                        {notification.type === 'success' ? 'Notificación' : 'Error'}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">{notification.message}</p>
                </div>
            </div>
        </div>,
        document.body
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1e293b] tracking-wide uppercase">
            {isClient ? 'Mis Compras' : 'Gestión de Ventas'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {isClient ? 'Historial de tus pagos, facturas y servicios contratados.' : 'Registro de ingresos, facturación y pagos directos.'}
          </p>
        </div>
        
        {/* Solo Admin y Empleado pueden registrar ventas manualmente */}
        {!isClient && (
            <button 
                onClick={() => setIsCreateOpen(true)}
                className="bg-[#dc2626] hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 font-bold text-xs tracking-widest uppercase"
            >
            <Plus size={18} strokeWidth={3} />
            Registrar Venta
            </button>
        )}
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden min-h-[500px]">
        
        {/* Search & Filter */}
        <div className="p-8 pb-4">
             <div className="relative max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder={isClient ? "Buscar por concepto o ID..." : "Buscar venta, cliente o ID..."} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-full py-3 pl-11 pr-6 text-slate-600 focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all placeholder:text-slate-400 text-sm shadow-sm"
                />
            </div>
        </div>

        {/* Modular Table */}
        <VentasTable 
            sales={filteredSales}
            loading={loading}
            isClient={isClient}
            onView={(sale) => { setSelectedSale(sale); setIsDetailOpen(true); }}
            onEdit={(sale) => { setSelectedSale(sale); setIsEditOpen(true); }}
            onAddPayment={(id) => { setAbonoReservationId(id); setIsAbonoModalOpen(true); }}
            onDownload={handleDownload}
        />
      </div>

      <AbonoCreateModal 
        isOpen={isAbonoModalOpen}
        onClose={() => setIsAbonoModalOpen(false)}
        onSave={handleSaveAbono}
        initialReservationId={abonoReservationId}
      />

      {/* Modal de Registro */}
      {!isClient && (
          <VentaCreateModal 
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSave={handleCreateSale}
          />
      )}

      {/* Modal de Edición */}
      {!isClient && (
          <VentaEditModal 
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            onSave={handleUpdateSale}
            sale={selectedSale}
          />
      )}

      {/* Modal de Detalle */}
      <VentaDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        sale={selectedSale}
        onDownload={handleDownload}
      />

    </div>
  );
};
