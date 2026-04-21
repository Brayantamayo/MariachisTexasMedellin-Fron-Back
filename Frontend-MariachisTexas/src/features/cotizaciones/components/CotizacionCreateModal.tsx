import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, AlertCircle } from 'lucide-react';
import { UserRole, User as UserType, Song, Service } from '@/types';
import { clientService } from '../../clientes/services/clientService';
import { repertoireService } from '../../repertoire/services/repertoireService';
import { servicesService } from '@/src/features/servicio/services/servicesService.ts';
import { reservaService } from '../../reservas/services/reservaService';
import { blockService } from '../../bloqueos/services/blockService';
import { useAuth } from '@/shared/contexts/AuthContext.tsx';
import { CotizacionForm } from './CotizacionForm';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

// ─── Tipos de error por campo ─────────────────────────────────────────────────
export interface CotizacionFormErrors {
  clientName?:   string;
  clientPhone?:  string;
  clientEmail?:  string;
  startTime?:    string;
  baseService?:  string;
  location?:     string;
}

// ─── Validación ───────────────────────────────────────────────────────────────
const validate = (data: any, services: any[]): CotizacionFormErrors => {
  const errors: CotizacionFormErrors = {};

  if (!data.clientName?.trim())
    errors.clientName = 'El nombre del cliente es requerido';

  if (!data.clientPhone?.trim())
    errors.clientPhone = 'El teléfono principal es requerido';

  if (!data.clientEmail?.trim())
    errors.clientEmail = 'El correo electrónico es requerido';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.clientEmail.trim()))
    errors.clientEmail = 'El correo no tiene un formato válido';

  if (!data.startTime)
    errors.startTime = 'Debes seleccionar la hora de inicio';

  const hasBaseService = data.selectedServices?.some((s: any) => {
    const service = services.find((srv: any) => String(srv.id) === s.serviceId);
    return service && service.nombre.toLowerCase().includes('serenata');
  });
  if (!hasBaseService)
    errors.baseService = 'Debes seleccionar un Tipo de Serenata';

  if (!data.location?.trim())
    errors.location = 'La dirección del evento es requerida';

  return errors;
};

export const CotizacionCreateModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const INCLUDED_SONGS       = 7;
  const PRICE_PER_EXTRA_SONG = 10000;

  const initialFormState = {
    clientId:         '',
    clientName:       '',
    clientPhone:      '',
    secondaryPhone:   '',
    clientEmail:      '',
    homenajeado:      '',
    eventDate:        new Date().toISOString().split('T')[0],
    eventType:        'Serenata',
    location:         '',
    startTime:        '',
    endTime:          '',
    repertoireIds:    [] as string[],
    selectedServices: [] as { serviceId: string; quantity: number }[],
    repertoireNotes:  '',
    totalAmount:      0
  };

  const [formData,             setFormData]             = useState<any>(initialFormState);
  const [clients,              setClients]              = useState<UserType[]>([]);
  const [songs,                setSongs]                = useState<Song[]>([]);
  const [services,             setServices]             = useState<Service[]>([]);
  const [availableHours,       setAvailableHours]       = useState<string[]>([]);
  const [blockStatus,          setBlockStatus]          = useState<any>({ isBlocked: false });
  const [isManuallyOverridden, setIsManuallyOverridden] = useState(false);
  const [saving,               setSaving]               = useState(false);
  const [globalError,          setGlobalError]          = useState<string | null>(null);
  const [errors,               setErrors]               = useState<CotizacionFormErrors>({});

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      repertoireService.getSongs().then(setSongs);
      servicesService.getServices().then(setServices);
      if (isAdmin) clientService.getClients().then(({ clients }) => setClients(clients));

      let baseData = { ...initialFormState };

      if (user && user.role === UserRole.CLIENTE) {
        baseData = {
          ...baseData,
          clientId:       user.id,
          clientName:     `${user.name} ${user.lastName}`,
          clientPhone:    user.phone,
          secondaryPhone: user.secondaryPhone || '',
          clientEmail:    user.email,
          location:       user.address
        };
      }

      setFormData(baseData);
      setErrors({});
      setGlobalError(null);
      setIsManuallyOverridden(false);
      checkBlockAndHours(baseData.eventDate);
    }
  }, [isOpen, user, isAdmin]);

  useEffect(() => {
    if (!isOpen || isManuallyOverridden) return;

    const songCount       = formData.repertoireIds?.length || 0;
    const extraSongsPrice = songCount > INCLUDED_SONGS
      ? (songCount - INCLUDED_SONGS) * PRICE_PER_EXTRA_SONG
      : 0;

    const servicesCost = (formData.selectedServices || []).reduce((total: number, item: any) => {
      const service = services.find(s => String(s.id) === item.serviceId);
      return total + (service ? Number(service.precio) * item.quantity : 0);
    }, 0);

    setFormData((prev: any) => ({ ...prev, totalAmount: extraSongsPrice + servicesCost }));
  }, [formData.startTime, formData.endTime, formData.repertoireIds, formData.selectedServices, isOpen, isManuallyOverridden, services]);

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
    // Limpiar error del campo al modificarlo
    if (errors[name as keyof CotizacionFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleDateChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value, startTime: '', endTime: '' }));
    setIsManuallyOverridden(false);
    if (name === 'eventDate') checkBlockAndHours(value);
  };

  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id     = e.target.value;
    const client = clients.find(c => c.id === id);
    if (client) {
      setFormData((prev: any) => ({
        ...prev,
        clientId:       client.id,
        clientName:     `${client.name} ${client.lastName}`,
        clientPhone:    client.phone,
        secondaryPhone: client.secondaryPhone || '',
        clientEmail:    client.email,
        location:       client.address
      }));
      setErrors({});
      setIsManuallyOverridden(false);
    } else {
      setFormData((prev: any) => ({ ...prev, clientId: '' }));
    }
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
    // Limpiar error de servicio base al seleccionar uno
    if (errors.baseService) setErrors(prev => ({ ...prev, baseService: undefined }));
    setIsManuallyOverridden(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    // ─── Validación de fecha bloqueada ───────────────────────────────────────
    if (blockStatus.isBlocked) {
      setGlobalError(`La fecha está bloqueada: ${blockStatus.reason}`);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // ─── Validación de campos ────────────────────────────────────────────────
    const validationErrors = validate(formData, services);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Mostrar primer error como globalError también para que sea visible
      const firstMessage = Object.values(validationErrors)[0];
      setGlobalError(firstMessage ?? null);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      // Solo resetear si se guarda exitosamente
      setFormData({ ...initialFormState });
      setErrors({});
      setGlobalError(null);
    } catch (err: any) {
      console.error('Error al guardar cotización:', err);
      const errorMessage = getErrorMessage(err, 'Error al guardar la cotización.');
      setGlobalError(errorMessage);
      
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({ ...initialFormState });
    setErrors({});
    setGlobalError(null);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose}></div>
      <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shadow-sm">
              <FileText className="text-[#ce1126]" size={18} />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-slate-800 tracking-wide uppercase">Nueva Cotización</h3>
              <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">Crear propuesta comercial</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Error global */}
        {globalError && (
          <div className="mx-6 mt-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
            <AlertCircle size={18} className="flex-shrink-0" /> {globalError}
          </div>
        )}

        {/* Formulario */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
          <CotizacionForm
            formData={formData}
            isAdmin={isAdmin}
            clients={clients}
            songs={songs}
            services={services}
            availableHours={availableHours}
            blockStatus={blockStatus}
            fieldErrors={errors}
            onChange={handleChange}
            onDateChange={handleDateChange}
            onClientSelect={handleClientSelect}
            onToggleSong={toggleSong}
            onServiceChange={handleServiceChange}
            onSubmit={handleSubmit}
            onCancel={handleClose}
            isSaving={saving}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};