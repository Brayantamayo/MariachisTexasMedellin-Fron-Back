import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Quotation, UserRole } from '@/types';
import { cotizacionService } from '../services/cotizacionService';
import { useAuth } from '@/shared/contexts/AuthContext';
import { ConfirmationModal }     from '@/shared/components/ConfirmationModal';
import { CotizacionesTable }     from '../components/CotizacionesTable';
import { CotizacionCreateModal } from '../components/CotizacionCreateModal';
import { CotizacionEditModal }   from '../components/CotizacionEditModal';
import { CotizacionDetailModal } from '../components/CotizacionDetailModal';

export const CotizacionesPage: React.FC = () => {
  const { user } = useAuth();
  const [quotations,        setQuotations]        = useState<Quotation[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [searchTerm,        setSearchTerm]        = useState('');
  const [isCreateOpen,      setIsCreateOpen]      = useState(false);
  const [isEditOpen,        setIsEditOpen]        = useState(false);
  const [isDetailOpen,      setIsDetailOpen]      = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [notification,      setNotification]      = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [confirmConvert, setConfirmConvert] = useState<{ isOpen: boolean; id: string | null; amount: number }>({ isOpen: false, id: null, amount: 0 });
  const [cancelModal,    setCancelModal]    = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [deleteModal,    setDeleteModal]    = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const data = await cotizacionService.getQuotations();
      setQuotations(data);
    } catch {
      showNotification('Error cargando cotizaciones.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuotations(); }, [user]);

  const handleCreate = async (data: any) => {
    try {
      const newQuote = await cotizacionService.createQuotation(data);
      setQuotations(prev => [newQuote, ...prev]);
      showNotification('Cotización creada exitosamente.');
      setIsCreateOpen(false);
    } catch (error: any) {
      // Relanzar el error para que CotizacionCreateModal lo maneje
      throw error;
    }
  };

  const handleUpdate = async (data: any) => {
    if (!selectedQuotation) return;
    try {
      const updated = await cotizacionService.updateQuotation(selectedQuotation.id, data);
      setQuotations(prev => prev.map(q => q.id === updated.id ? updated : q));
      showNotification('Cotización actualizada correctamente.');
      setIsEditOpen(false);
    } catch (error: any) {
      showNotification(error?.response?.data?.message || 'Error al actualizar.', 'error');
    }
  };

  const processConversion = async () => {
    if (!confirmConvert.id) return;
    try {
      const result = await cotizacionService.convertToReservation(confirmConvert.id);
      setQuotations(prev => prev.map(q => q.id === confirmConvert.id ? result.quotation : q));
      showNotification(`¡Éxito! Reserva #${result.reservationId} creada. Se envió correo al cliente.`);
    } catch (error: any) {
      showNotification(error?.response?.data?.message || 'Error al procesar.', 'error');
    } finally {
      setConfirmConvert({ isOpen: false, id: null, amount: 0 });
    }
  };

  const processCancellation = async () => {
    if (!cancelModal.id) return;
    try {
      const updated = await cotizacionService.cancelQuotation(cancelModal.id);
      setQuotations(prev => prev.map(q => q.id === cancelModal.id ? updated : q));
      showNotification('Cotización anulada correctamente.');
    } catch (error: any) {
      showNotification(error?.response?.data?.message || 'Error al anular.', 'error');
    } finally {
      setCancelModal({ isOpen: false, id: null });
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await cotizacionService.deleteQuotation(deleteModal.id);
      setQuotations(prev => prev.filter(q => q.id !== deleteModal.id));
      showNotification('Cotización eliminada correctamente.');
    } catch (error: any) {
      showNotification(error?.response?.data?.message || 'Error al eliminar.', 'error');
    } finally {
      setDeleteModal({ isOpen: false, id: null });
    }
  };

  // ✅ PDF generado en el backend — simple y limpio
  const handleDownload = async (id: string) => {
    showNotification('Generando PDF...');
    try {
      await cotizacionService.downloadPdf(id);
      showNotification('PDF descargado correctamente.');
    } catch {
      showNotification('Error al generar el PDF.', 'error');
    }
  };

  const filteredQuotations = quotations.filter(q =>
    (q.clientName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.eventType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">

      {/* Toast */}
      {notification && createPortal(
        <div className="fixed top-6 right-6 z-[200] animate-fade-in-up">
          <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md min-w-[320px] bg-white/95 ${
            notification.type === 'success' ? 'border-emerald-100' : 'border-red-100'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
            }`}>
              {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-slate-800">{notification.type === 'success' ? '¡Éxito!' : 'Error'}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>
        </div>,
        document.body
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-800 tracking-wide uppercase">
            Cotizaciones <span className="text-[#ce1126]">Mariachi</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Gestiona propuestas comerciales y conviértelas en reservas.</p>
        </div>
        {(user?.role === UserRole.ADMIN || user?.role === UserRole.EMPLEADO) && (
          <button onClick={() => setIsCreateOpen(true)}
            className="bg-[#ce1126] hover:bg-red-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 font-bold text-xs tracking-widest uppercase">
            <Plus size={18} strokeWidth={3} /> Nueva Cotización
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden min-h-[500px]">
        <div className="p-8 pb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Buscar por cliente, ID o evento..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-full py-3 pl-11 pr-6 text-slate-600 focus:ring-2 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all placeholder:text-slate-400 text-sm" />
          </div>
        </div>

        <CotizacionesTable
          quotations={filteredQuotations}
          loading={loading}
          userRole={user?.role}
          onView={(q) => { setSelectedQuotation(q); setIsDetailOpen(true); }}
          onEdit={(q) => { setSelectedQuotation(q); setIsEditOpen(true); }}
          onConvert={(id, amount) => setConfirmConvert({ isOpen: true, id, amount })}
          onCancel={(id) => setCancelModal({ isOpen: true, id })}
          onDownload={handleDownload}
          onDelete={(id) => setDeleteModal({ isOpen: true, id })}
        />
      </div>

      {/* Modales */}
      <CotizacionCreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSave={handleCreate} />
      <CotizacionEditModal   isOpen={isEditOpen}   onClose={() => setIsEditOpen(false)}   onSave={handleUpdate} quotation={selectedQuotation} />
      <CotizacionDetailModal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} quotation={selectedQuotation} />

      <ConfirmationModal isOpen={confirmConvert.isOpen} onClose={() => setConfirmConvert({ ...confirmConvert, isOpen: false })} onConfirm={processConversion} title="¿Confirmar Cotización?" message={`Vas a convertir esta cotización en una Reserva Oficial por $${confirmConvert.amount.toLocaleString()}. Se enviará un correo al cliente con el link de registro.`} confirmText="Sí, Convertir" />
      <ConfirmationModal isOpen={cancelModal.isOpen}    onClose={() => setCancelModal({ ...cancelModal, isOpen: false })}       onConfirm={processCancellation} title="¿Anular Cotización?"   message="Estás a punto de anular esta cotización."                                                                                                                      confirmText="Sí, Anular"   />
      <ConfirmationModal isOpen={deleteModal.isOpen}    onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}       onConfirm={handleDelete}        title="¿Eliminar Cotización?" message="Estás a punto de eliminar esta cotización permanentemente. Esta acción no se puede deshacer."                                                                confirmText="Sí, eliminar" />
    </div>
  );
};