
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, CheckCircle, AlertCircle, X, FileText } from 'lucide-react';
import { EnrichedPayment } from '../services/abonoService';
import { abonoService } from '../services/abonoService';
import { reservaService } from '../../reservas/services/reservaService';
import { useAuth } from '@/shared/contexts/AuthContext';
import { Reservation, UserRole } from '@/types';

// Componentes Modulares
import { AbonosTable } from '../components/AbonosTable';
import { AbonoCreateModal } from '../components/AbonoCreateModal';
import { AbonoDetailModal } from '../components/AbonoDetailModal';

export const AbonosPage: React.FC = () => {
  const { user } = useAuth();
  const [abonos, setAbonos] = useState<EnrichedPayment[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAbono, setSelectedAbono] = useState<EnrichedPayment | null>(null);

  // Notificaciones
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchAbonos = async () => {
    setLoading(true);
    try {
      const [abonosData, reservationsData] = await Promise.all([
          abonoService.getAbonos(),
          reservaService.getReservations()
      ]);
      
      let filteredAbonos = abonosData;
      let filteredReservations = reservationsData;

      if (user && user.role === UserRole.CLIENTE) {
          filteredAbonos = abonosData.filter(a =>
            a.clientEmail?.toLowerCase() === user.email.toLowerCase() ||
            a.clientId === user.id ||
            a.clientName.toLowerCase().includes(user.name.toLowerCase())
          );
          filteredReservations = reservationsData.filter(r =>
            r.clientEmail?.toLowerCase() === user.email.toLowerCase() ||
            r.clientId === user.id ||
            r.clientName.toLowerCase().includes(user.name.toLowerCase())
          );
      }

      setAbonos(filteredAbonos);
      setReservations(filteredReservations);
    } catch (error) {
      console.error(error);
      showNotification("Error cargando datos de abonos.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAbonos();
  }, []);

  const handleCreateAbono = async (data: any) => {
      try {
          const newAbono = await abonoService.createAbono(data);
          setAbonos(prev => [newAbono, ...prev]);
          showNotification('✅ Abono registrado con éxito.');
          setIsCreateOpen(false);
      } catch (error) {
          console.error(error);
          showNotification("Error al registrar el abono.", "error");
      }
  };

  const handleDownloadPdf = async () => {
    showNotification('Generando PDF de abonos...', 'success');
    try {
      const response = await fetch('/api/abonos/download/pdf', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Error al descargar PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'abonos.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showNotification('PDF descargado correctamente.');
    } catch (error) {
      console.error(error);
      showNotification('Error al descargar PDF.', 'error');
    }
  };

  const handleDownload = async (id: string) => {
    showNotification('Descargando comprobante...', 'success');
    try {
      await abonoService.downloadComprobante(id);
      showNotification('Comprobante descargado correctamente.');
    } catch (error) {
      showNotification('Error al descargar comprobante.', 'error');
    }
  };

  const filteredAbonos = abonos.filter(a => 
      a.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.id.includes(searchTerm) ||
      a.reservationId.includes(searchTerm)
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
                        {notification.type === 'success' ? 'Éxito' : 'Atención'}
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1e293b] tracking-wide uppercase">
            {isClient ? 'Mis Abonos' : 'Gestión de Abonos'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {isClient ? 'Consulta el estado de tus pagos y descarga tus comprobantes.' : 'Historial de pagos y generación de comprobantes.'}
          </p>
        </div>
        {!isClient && (
            <button 
                onClick={() => setIsCreateOpen(true)}
                className="bg-[#dc2626] hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 font-bold text-xs tracking-widest uppercase"
            >
              <Plus size={18} strokeWidth={3} />
              Registrar Abono
            </button>
        )}
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden min-h-[500px]">
        
        {/* Search */}
        <div className="p-8 pb-4">
             <div className="relative max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Buscar por cliente, reserva o ID..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-full py-3 pl-11 pr-6 text-slate-600 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all placeholder:text-slate-400 text-sm"
                />
            </div>
        </div>

        {/* Modular Table */}
        <AbonosTable
            abonos={abonos}
            reservations={reservations}
            loading={loading}
            onView={(abono) => { setSelectedAbono(abono); setIsDetailOpen(true); }}
            onDownload={handleDownload}
        />
      </div>

      {/* Modal Creación */}
      <AbonoCreateModal 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onSave={handleCreateAbono} 
      />

      {/* Modal Detalle */}
      <AbonoDetailModal 
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        abono={selectedAbono}
        onDownload={handleDownload}
      />

    </div>
  );
};
