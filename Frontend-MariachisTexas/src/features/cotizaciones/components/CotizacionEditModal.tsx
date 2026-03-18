import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText } from 'lucide-react';
import { Quotation, UserRole, User as UserType, Song, Service } from '@/types';
import { clientService } from '../../clientes/services/clientService';
import { repertoireService } from '../../repertoire/services/repertoireService';
import { servicesService } from '@/src/features/servicio/services/servicesService.ts';
import { reservaService } from '../../reservas/services/reservaService';
import { blockService } from '../../bloqueos/services/blockService';
import { useAuth } from '@/shared/contexts/AuthContext.tsx';
import { CotizacionForm } from './CotizacionForm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  quotation: Quotation | null;
}

export const CotizacionEditModal: React.FC<Props> = ({ isOpen, onClose, onSave, quotation }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const INCLUDED_SONGS       = 7;
  const PRICE_PER_EXTRA_SONG = 10000;

  const [formData,             setFormData]             = useState<any>(null);
  const [clients,              setClients]              = useState<UserType[]>([]);
  const [songs,                setSongs]                = useState<Song[]>([]);
  const [services,             setServices]             = useState<Service[]>([]);
  const [availableHours,       setAvailableHours]       = useState<string[]>([]);
  const [blockStatus,          setBlockStatus]          = useState<any>({ isBlocked: false });
  const [isManuallyOverridden, setIsManuallyOverridden] = useState(false);

  useEffect(() => {
    if (isOpen && quotation) {
      repertoireService.getSongs().then(setSongs);
      servicesService.getServices().then(setServices);
      // ✅ No cargar clientes en edición — no se puede cambiar el cliente
      setFormData(quotation);
      setIsManuallyOverridden(false);
      checkBlockAndHours(quotation.eventDate);
    }
  }, [isOpen, quotation, isAdmin]);

  useEffect(() => {
    if (!isOpen || !formData || isManuallyOverridden) return;

    const songCount       = formData.repertoireIds?.length || 0;
    const extraSongsPrice = songCount > INCLUDED_SONGS
      ? (songCount - INCLUDED_SONGS) * PRICE_PER_EXTRA_SONG
      : 0;

    const servicesCost = (formData.selectedServices || []).reduce((total: number, item: any) => {
      const service = services.find(s => String(s.id) === item.serviceId);
      return total + (service ? Number(service.precio) * item.quantity : 0);
    }, 0);

    const newTotal = extraSongsPrice + servicesCost;
    if (newTotal !== formData.totalAmount) {
      setFormData((prev: any) => ({ ...prev, totalAmount: newTotal }));
    }
  }, [formData?.startTime, formData?.endTime, formData?.repertoireIds, formData?.selectedServices, isOpen, isManuallyOverridden, services]);

  const checkBlockAndHours = async (date: string) => {
    const status = await blockService.checkDateStatus(date);
    setBlockStatus(status);
    let hours = await reservaService.getAvailableHours(date);
    if (!status.isBlocked && status.hasPartialBlocks && status.blockedRanges) {
      hours = hours.filter(hour =>
        !status.blockedRanges!.some(range => hour >= range.start && hour < range.end)
      );
    }
    setAvailableHours(hours);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'totalAmount') setIsManuallyOverridden(true);
    else if (['startTime', 'endTime'].includes(name)) setIsManuallyOverridden(false);
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value, startTime: '', endTime: '' }));
    setIsManuallyOverridden(false);
    if (name === 'eventDate') checkBlockAndHours(value);
  };

  const toggleSong = (songId: string) => {
    setFormData((prev: any) => {
      const current = prev.repertoireIds || [];
      return {
        ...prev,
        repertoireIds: current.includes(songId)
          ? current.filter((id: string) => id !== songId)
          : [...current, songId]
      };
    });
    setIsManuallyOverridden(false);
  };

  const handleServiceChange = (serviceId: string, quantity: number) => {
    setFormData((prev: any) => {
      const current       = prev.selectedServices || [];
      const existingIndex = current.findIndex((s: any) => s.serviceId === serviceId);
      let updated;
      if (existingIndex >= 0) {
        updated = quantity === 0
          ? current.filter((s: any) => s.serviceId !== serviceId)
          : current.map((s: any, i: number) => i === existingIndex ? { serviceId, quantity } : s);
      } else {
        updated = quantity > 0 ? [...current, { serviceId, quantity }] : current;
      }
      return { ...prev, selectedServices: updated };
    });
    setIsManuallyOverridden(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (blockStatus.isBlocked) { alert(`Fecha bloqueada: ${blockStatus.reason}`); return; }
    if (!formData.startTime || !formData.endTime) { alert('Selecciona hora de inicio y fin.'); return; }

    const hasBaseService = formData.selectedServices?.some((s: any) => {
      const service = services.find(srv => String(srv.id) === s.serviceId);
      return service && service.nombre.toLowerCase().includes('serenata');
    });
    if (!hasBaseService) { alert('Por favor selecciona un Tipo de Serenata.'); return; }

    if (formData.endTime <= formData.startTime && !['00:00', '00:30'].includes(formData.endTime)) {
      if (!confirm('La hora de fin es menor que la de inicio. ¿Termina al día siguiente?')) return;
    }
    onSave(formData);
  };

  if (!isOpen || !formData) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shadow-sm">
              <FileText className="text-orange-600" size={18} />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-slate-800 tracking-wide uppercase">Editar Cotización</h3>
              <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">Modificar propuesta #{quotation?.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
          <CotizacionForm
            formData={formData}
            isAdmin={isAdmin}
            isEditing={true}          // ✅ oculta buscador y bloquea campos cliente
            clients={clients}
            songs={songs}
            services={services}
            availableHours={availableHours}
            blockStatus={blockStatus}
            onChange={handleChange}
            onDateChange={handleDateChange}
            onClientSelect={() => {}} // no se usa en edición
            onToggleSong={toggleSong}
            onServiceChange={handleServiceChange}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};