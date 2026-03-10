
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, Edit2, Trash2, Eye, Calendar, Clock, Lock, CheckCircle, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { CalendarBlock } from '@/types';
import { blockService } from '../services/blockService';
import { BlockFormModal } from '../components/BlockFormModal';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal';
import { TablePagination } from '@/shared/components/TablePagination';

export const BlocksPage: React.FC = () => {
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<CalendarBlock | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Confirmación
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string | null}>({
      isOpen: false,
      id: null
  });

  // Notificaciones
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const data = await blockService.getBlocks();
      setBlocks(data);
    } catch (error) {
      console.error(error);
      showNotification("Error cargando bloqueos.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  const handleSave = async (data: any) => {
    try {
      if (editingBlock && !isViewOnly) {
        const updated = await blockService.updateBlock(editingBlock.id, data);
        setBlocks(prev => prev.map(b => b.id === updated.id ? updated : b));
        showNotification('Bloqueo actualizado correctamente.');
      } else {
        const newBlock = await blockService.createBlock(data);
        setBlocks(prev => [newBlock, ...prev]);
        showNotification('Bloqueo registrado exitosamente.');
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      showNotification("Error al guardar el bloqueo.", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
        await blockService.deleteBlock(deleteModal.id);
        setBlocks(prev => prev.filter(b => b.id !== deleteModal.id));
        showNotification('Bloqueo eliminado del calendario.');
    } catch (error) {
        console.error(error);
        showNotification("Error al eliminar.", "error");
    }
  };

  const toggleStatus = async (block: CalendarBlock) => {
      const newStatus = !block.isActive;
      try {
          setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, isActive: newStatus } : b));
          await blockService.updateBlock(block.id, { isActive: newStatus });
          // Feedback visual es suficiente
      } catch (error) {
          console.error(error);
          fetchBlocks();
          showNotification("Error al cambiar estado.", "error");
      }
  };

  const filteredBlocks = blocks.filter(b => 
      b.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredBlocks.length / itemsPerPage);
  const currentBlocks = filteredBlocks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Helper para mostrar fechas amigables
  const renderDateDisplay = (block: CalendarBlock) => {
      const start = new Date(block.startDate + 'T00:00:00'); // Forzar local time
      const end = new Date(block.endDate + 'T00:00:00');
      
      const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
      
      if (block.type === 'FULL_DATE') {
          return (
             <div className="flex items-center gap-2">
                 <Calendar size={14} className="text-slate-400" />
                 <span className="font-bold text-slate-700">{start.toLocaleDateString('es-ES', options)}</span>
                 <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 uppercase font-bold">Todo el día</span>
             </div>
          );
      } else if (block.type === 'TIME_RANGE') {
          return (
             <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="font-bold text-slate-700">{start.toLocaleDateString('es-ES', options)}</span>
                 </div>
                 <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock size={12} className="text-slate-400" />
                    {block.startTime} - {block.endTime}
                 </div>
             </div>
          );
      } else {
          return (
             <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="font-bold text-slate-700">{start.toLocaleDateString('es-ES', options)}</span>
                    <span className="text-slate-300">➜</span>
                    <span className="font-bold text-slate-700">{end.toLocaleDateString('es-ES', options)}</span>
                 </div>
                 <span className="text-[10px] text-slate-400 pl-6">Varios días</span>
             </div>
          );
      }
  };

  const getTypeBadge = (type: string) => {
      switch(type) {
          case 'FULL_DATE': return { label: 'Día Completo', class: 'bg-red-50 text-red-600 border-red-100' };
          case 'TIME_RANGE': return { label: 'Por Horas', class: 'bg-orange-50 text-orange-600 border-orange-100' };
          case 'DATE_RANGE': return { label: 'Varios Días', class: 'bg-purple-50 text-purple-600 border-purple-100' };
          default: return { label: type, class: 'bg-slate-50 text-slate-600' };
      }
  };

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
                            {notification.type === 'success' ? 'Éxito' : 'Error'}
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
                <h1 className="text-3xl font-serif font-bold text-[#1e293b] tracking-wide uppercase">Bloqueos de Calendario</h1>
                <p className="text-slate-500 mt-2 text-sm">Gestiona la disponibilidad y restringe fechas.</p>
            </div>
            <button 
                onClick={() => { setEditingBlock(null); setIsViewOnly(false); setIsModalOpen(true); }}
                className="bg-[#dc2626] hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 font-bold text-xs tracking-widest uppercase"
            >
                <Plus size={18} strokeWidth={3} />
                Registrar Bloqueo
            </button>
        </div>

        {/* Main Table Container */}
        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            
             {/* Search */}
             <div className="p-8 pb-4">
                 <div className="relative max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar por motivo..." 
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full bg-white border border-slate-200 rounded-full py-3 pl-11 pr-6 text-slate-600 focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all placeholder:text-slate-400 text-sm shadow-sm"
                    />
                </div>
            </div>

            {/* Listado de Bloqueos (Tabla) */}
            <div className="overflow-x-auto">
                 <table className="w-full">
                     <thead>
                         <tr className="border-b border-slate-100 text-left">
                             <th className="py-6 px-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Motivo y Descripción</th>
                             <th className="py-6 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tipo</th>
                             <th className="py-6 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Fechas / Horas</th>
                             <th className="py-6 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Estado</th>
                             <th className="py-6 px-8 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Acciones</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan={5} className="py-20 text-center text-slate-400">Cargando bloqueos...</td></tr>
                        ) : filteredBlocks.length === 0 ? (
                            <tr><td colSpan={5} className="py-20 text-center text-slate-400">No hay bloqueos registrados.</td></tr>
                        ) : (
                            currentBlocks.map(block => {
                                const badge = getTypeBadge(block.type);
                                return (
                                    <tr key={block.id} className="hover:bg-slate-50/50 transition-colors group">
                                        
                                        {/* Motivo */}
                                        <td className="py-5 px-8">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1">
                                                    <ShieldAlert size={16} className="text-red-500" />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-slate-800 block text-sm">{block.reason}</span>
                                                    <span className="text-xs text-slate-400 block max-w-[250px] truncate" title={block.description}>
                                                        {block.description || 'Sin descripción adicional.'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Tipo Badge */}
                                        <td className="py-5 px-6">
                                            <span className={`inline-block px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${badge.class}`}>
                                                {badge.label}
                                            </span>
                                        </td>

                                        {/* Fechas */}
                                        <td className="py-5 px-6">
                                            {renderDateDisplay(block)}
                                        </td>

                                        {/* Estado (Toggle) */}
                                        <td className="py-5 px-6">
                                            <div className="flex items-center justify-center gap-3">
                                                <div 
                                                    onClick={() => toggleStatus(block)}
                                                    className={`w-11 h-6 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300 ${block.isActive ? 'bg-red-600' : 'bg-slate-200'}`}
                                                >
                                                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${block.isActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider w-16 text-center ${block.isActive ? 'text-red-600' : 'text-slate-400'}`}>
                                                    {block.isActive ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Acciones */}
                                        <td className="py-5 px-8">
                                            <div className="flex items-center justify-center gap-2">
                                                <ActionButton 
                                                    icon={Eye} 
                                                    onClick={() => { setEditingBlock(block); setIsViewOnly(true); setIsModalOpen(true); }}
                                                    tooltip="Ver detalles"
                                                />
                                                <ActionButton 
                                                    icon={Edit2} 
                                                    onClick={() => { setEditingBlock(block); setIsViewOnly(false); setIsModalOpen(true); }}
                                                    tooltip="Editar"
                                                />
                                                <ActionButton 
                                                    icon={Trash2} 
                                                    onClick={() => setDeleteModal({ isOpen: true, id: block.id })}
                                                    tooltip="Eliminar"
                                                />
                                            </div>
                                        </td>

                                    </tr>
                                );
                            })
                        )}
                     </tbody>
                 </table>
            </div>
            
            <div className="mt-auto">
              <TablePagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredBlocks.length}
                itemsPerPage={itemsPerPage}
              />
            </div>
        </div>

        <BlockFormModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSave}
            initialData={editingBlock}
            isViewOnly={isViewOnly}
        />

        <ConfirmationModal 
            isOpen={deleteModal.isOpen}
            onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
            onConfirm={confirmDelete}
            title="¿Eliminar Bloqueo?"
            message="Esta acción liberará la fecha en el calendario. ¿Estás seguro?"
        />
    </div>
  );
};

// Componente auxiliar para botones de acción
const ActionButton: React.FC<{ 
    icon: React.ElementType, 
    onClick: () => void, 
    tooltip?: string
}> = ({ icon: Icon, onClick, tooltip }) => (
    <button 
        onClick={onClick}
        title={tooltip}
        className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all duration-200 hover:scale-105"
    >
        <Icon size={16} strokeWidth={2} />
    </button>
);
