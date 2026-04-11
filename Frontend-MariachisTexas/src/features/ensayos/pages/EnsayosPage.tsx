import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Rehearsal, UserRole } from '@/types';
import { rehearsalService } from '../services/rehearsalService';
import { ConfirmationModal } from '@/shared/components/ConfirmationModal';
import { useAuth } from '@/shared/contexts/AuthContext';
import { RehearsalsTable } from '../components/RehearsalsTable';
import { RehearsalCreateModal } from '../components/RehearsalCreateModal';
import { RehearsalEditModal } from '../components/RehearsalEditModal';
import { RehearsalDetailModal } from '../components/RehearsalDetailModal';


export const EnsayosPage: React.FC = () => {
const { user } = useAuth();
const [rehearsals, setRehearsals] = useState<Rehearsal[]>([]);
const [loading, setLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState('');

// Modales
const [isCreateOpen, setIsCreateOpen] = useState(false);
const [isEditOpen, setIsEditOpen] = useState(false);
const [isDetailOpen, setIsDetailOpen] = useState(false);

const [selectedRehearsal, setSelectedRehearsal] = useState<Rehearsal | null>(null);

// Confirmación de borrado
const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, id: string | null}>({
    isOpen: false,
    id: null
});

// Notificaciones de error
const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
};


///fetch de rehearsals sirve para cargar los datos de la tabla
const fetchRehearsals = async () => {
    setLoading(true);
    try {
    const data = await rehearsalService.getRehearsals();
    setRehearsals(data);
    } catch (error) {
    console.error(error);
    showNotification("Error cargando ensayos.", "error");
    } finally {
    setLoading(false);
    }
};
///useEffect sirve para llamar a la funcion fetchRehearsals cuando se cargue la página
useEffect(() => {
    fetchRehearsals();
}, []);

///handleCreateRehearsal sirve para crear un nuevo ensayo
const handleCreateRehearsal = async (data: any) => {
    const newRehearsal = await rehearsalService.createRehearsal(data);
    setRehearsals(prev => [newRehearsal, ...prev]);
    showNotification('Ensayo programado exitosamente.');
    setIsCreateOpen(false);
};

//handleUpdateRehearsal sirve para actualizar un ensayo existente
const handleUpdateRehearsal = async (data: any) => {
if (!selectedRehearsal) return;
    const updated = await rehearsalService.updateRehearsal(selectedRehearsal.id, data);
    setRehearsals(prev => prev.map(r => r.id === updated.id ? updated : r));
    showNotification('Ensayo actualizado correctamente.');
    setIsEditOpen(false);
};

//confirmDelete sirve para confirmar la eliminación de un ensayo
const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
        await rehearsalService.deleteRehearsal(deleteModal.id);
        setRehearsals(prev => prev.filter(r => r.id !== deleteModal.id));
        showNotification('Ensayo eliminado del calendario.');
    } catch (error) {
        console.error(error);
        showNotification("Error al eliminar.", "error");
    }
};

//handleToggleStatus sirve para marcar un ensayo como listo se crea en pendiente
const [confirmModal, setConfirmModal] = useState<Rehearsal | null>(null)
const handleToggleStatus = async (rehearsal: Rehearsal) => {
  const isCompleted = rehearsal.status === 'Completado'
  if (!isCompleted) {
    setConfirmModal(rehearsal)  // abre el modal en vez de window.confirm
    return
  }
  await doToggle(rehearsal)
}

const doToggle = async (rehearsal: Rehearsal) => {
  // aquí va tu lógica actual de cambio de estado
}

const handleConfirm = async () => {
  if (!confirmModal) return
  await doToggle(confirmModal)
  setConfirmModal(null)
}

// Filtrar canciones para el selector
const filteredRehearsals = rehearsals.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.location.toLowerCase().includes(searchTerm.toLowerCase())
);

///canManage es una variable booleana que indica si el usuario tiene permisos de ADMIN o EMPLEADO para mostrar/ocultar acciones en la UI
const canManage = user?.role === UserRole.ADMIN || user?.role === UserRole.EMPLEADO;

return (
    <div className="space-y-8 animate-fade-in-up pb-10">
        
        {/* Notificaciones  de error y exito */}
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
                    <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
                        <X size={18} />
                    </button>
                </div>
            </div>,
            document.body
        )}

        {/* Parte de arriba de la pagina de ensayos  */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
            <h1 className="text-3xl font-serif font-bold text-[#1e293b] tracking-wide uppercase">Gestión de Ensayos</h1>
            <p className="text-slate-500 mt-2 text-sm">Organiza las prácticas y repertorio de la banda.</p>
            </div>
            
            {/* Aqui se manejan las acciones para ADMIN y EMPLEADO */}
            {/* Mostrar botón para ADMIN y EMPLEADO */}
            {canManage && (
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-[#dc2626] hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 font-bold text-xs tracking-widest uppercase"
                >
                <Plus size={18} strokeWidth={3} />
                Programar Ensayo
                </button>
            )}
        </div>

        {confirmModal && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
          <CheckCircle className="text-amber-600" size={20} />
        </div>
        <h3 className="font-bold text-slate-800 text-base">¿Marcar como listo?</h3>
      </div>
      <p className="text-sm text-slate-500 mb-5">
        <span className="font-medium text-slate-700">"{confirmModal.title}"</span> desaparecerá del calendario y no podrás editarlo.
      </p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setConfirmModal(null)}
          className="px-4 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          className="px-4 py-2 text-sm rounded-xl bg-primary-600 text-white hover:bg-primary-700 font-medium"
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>
)}

        {/* Contenedor principal de la tabla */}
        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden min-h-[500px]">
            
             {/* Search */}
            <div className="p-8 pb-4">
            <div className="relative max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o lugar..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-full py-3 pl-11 pr-6 text-slate-600 focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all placeholder:text-slate-400 text-sm shadow-sm"
                    />
                </div>
            </div>

            {/* componente de la tabla de ensayo */}
            <RehearsalsTable 
                rehearsals={filteredRehearsals}
                loading={loading}
                userRole={user?.role}
                onView={(r) => { setSelectedRehearsal(r); setIsDetailOpen(true); }}
                onEdit={(r) => { setSelectedRehearsal(r); setIsEditOpen(true); }}
                onDelete={(id) => setDeleteModal({ isOpen: true, id })}
                onToggleStatus={handleToggleStatus}
            />
        </div>

        {/* componente de crear ensayo */}
        <RehearsalCreateModal 
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSave={handleCreateRehearsal}
        />

        {/* componente de editar ensayo */}
        <RehearsalEditModal 
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            onSave={handleUpdateRehearsal}
            rehearsal={selectedRehearsal}
        />

        {/* componente de detalle de ensayo */}
        <RehearsalDetailModal 
            isOpen={isDetailOpen}
            onClose={() => setIsDetailOpen(false)}
            rehearsal={selectedRehearsal}
        />

        {/* componente de confirmacion de eliminacion de ensayo */}
        <ConfirmationModal 
            isOpen={deleteModal.isOpen}
            onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
            onConfirm={confirmDelete}
            title="¿Eliminar Ensayo?"
            message="Esta acción eliminará el evento del calendario. No se puede deshacer."
        />
    </div>

    
);
};
