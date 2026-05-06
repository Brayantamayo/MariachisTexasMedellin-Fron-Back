import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Bookmark, AlertCircle } from 'lucide-react';
import { ReservaForm } from './ReservaForm';
import { User as UserType, Song, UserRole } from '@/types';
import { clientService } from '../../clientes/services/clientService';
import { repertoireService } from '../../repertoire/services/repertoireService';
import { reservaService } from '../services/reservaService';
import { blockService } from '../../bloqueos/services/blockService';
import { servicesService } from '@/src/features/servicio/services/servicesService.ts';
import { useAuth } from '@/shared/contexts/AuthContext';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  selectedDate?: string | null;
  selectedTime?: string | null;
}

// ─── Tipos de error por campo ─────────────────────────────────────────────────
export interface ReservaFormErrors extends Record<string, string | undefined> {
  clientName?:  string;
  clientPhone?: string;
  clientEmail?: string;
  startTime?:   string;
  baseService?: string;
  location?:    string;
}

// ─── Validación ───────────────────────────────────────────────────────────────
const validate = (data: any, services: any[], isAdmin?: boolean): ReservaFormErrors => {
  const errors: ReservaFormErrors = {};

  if (isAdmin && !data.clientId?.trim()) {
    errors.clientName = 'Debes seleccionar un cliente de la base de datos';
  }

  if (!data.clientName?.trim())
    errors.clientName = 'El nombre del cliente es requerido';

  if (!data.clientPhone?.trim())
    errors.clientPhone = 'El teléfono principal es requerido';

  if (!data.clientEmail?.trim())
    errors.clientEmail = 'El correo electrónico es requerido';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.clientEmail.trim()))
    errors.clientEmail = 'El correo no tiene un formato válido';

  if (!data.startTime && !data.eventTime)
    errors.startTime = 'Debes seleccionar la hora de inicio';

  const hasBaseService = data.selectedServices?.some((s: any) => {
    const service = services.find((srv: any) => String(srv.id) === String(s.serviceId));
    return service && service.nombre.toLowerCase().includes('serenata');
  });
  if (!hasBaseService)
    errors.baseService = 'Debes seleccionar un Tipo de Serenata';

  if (!data.location?.trim())
    errors.location = 'La dirección del evento es requerida';

  return errors;
};

// ─── Mapper de cliente ────────────────────────────────────────────────────────
const mapClienteToForm = (cliente: any) => ({
  clientId:       String(cliente.id),
  clientName:     `${cliente.name ?? ''} ${cliente.lastName ?? ''}`.trim() || cliente.email,
  clientPhone:    cliente.phone          ?? '',
  secondaryPhone: cliente.secondaryPhone ?? '',
  clientEmail:    cliente.email          ?? '',
  address:        cliente.address        ?? '',
  neighborhood:   cliente.neighborhood   ?? '',
});

export const ReservaCreateModal: React.FC<Props> = ({ isOpen, onClose, onSave, selectedDate, selectedTime }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const INCLUDED_SONGS       = 7;
  const PRICE_PER_EXTRA_SONG = 10000;

  const getInitialFormState = () => ({
    clientName:       '',
    clientPhone:      '',
    secondaryPhone:   '',
    clientEmail:      '',
    homenajeado:      '',
    eventType:        'Cumpleaños',
    eventDate:        '',
    eventTime:        '',
    startTime:        '',
    endTime:          '',
    location:         '',
    address:          '',
    neighborhood:     '',
    notes:            '',
    repertoireIds:    [] as string[],
    selectedServices: [] as { serviceId: string; quantity: number }[],
    totalAmount:      0,
    clientId:         ''
  });

  const [formData,       setFormData]       = useState<any>(getInitialFormState());
  const [clients,        setClients]        = useState<any[]>([]);
  const [songs,          setSongs]          = useState<Song[]>([]);
  const [services,       setServices]       = useState<any[]>([]);
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [blockStatus,    setBlockStatus]    = useState<any>({ isBlocked: false });
  const [saving,         setSaving]         = useState(false);
  const [globalError,    setGlobalError]    = useState<string | null>(null);
  const [errors,         setErrors]         = useState<ReservaFormErrors>({});

  const scrollContainerRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (!isOpen) {
    setFormData(getInitialFormState());
    setClients([]);
    setErrors({});
    setGlobalError(null);
    return;
  }

  setFormData(getInitialFormState());
  setErrors({});
  setGlobalError(null);

  const dateToUse = selectedDate || new Date().toISOString().split('T')[0];
  const timeToUse = selectedTime || '';

  // ─── Paralelizar todas las cargas ────────────────────────────────────────
  const fetches: Promise<any>[] = [
    repertoireService.getSongsPublic(),
    servicesService.getServices(),
    blockService.checkDateStatus(dateToUse),
    reservaService.getAvailableHours(dateToUse),
    ...(isAdmin ? [clientService.getClients()] : [Promise.resolve(null)]),
  ];

  Promise.all(fetches).then(([songs, services, status, hours, clientsData]) => {
    setSongs(songs);
    setServices(services);
    setBlockStatus(status);

    let filtered = hours;
    if (!status.isBlocked && status.hasPartialBlocks && status.blockedRanges) {
      filtered = hours.filter((hour: string) =>
        !status.blockedRanges!.some((range: any) => hour >= range.start && hour < range.end)
      );
    }

    // Si la fecha es hoy, filtrar horas que ya pasaron
    const todayStr = new Date().toISOString().split('T')[0];
    if (dateToUse === todayStr) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      filtered = filtered.filter((hour: string) => {
        const [h, m] = hour.split(':').map(Number);
        return h * 60 + m > currentMinutes;
      });
    }

    setAvailableHours(filtered);

    if (isAdmin && clientsData) setClients(clientsData.clients);
  });

  let baseState = {
    ...getInitialFormState(),
    eventDate: dateToUse,
    eventTime: timeToUse,
    startTime: timeToUse,
  };

  if (user && !isAdmin) {
    baseState = {
      ...baseState,
      clientId:       String(user.id),
      clientName:     `${user.name} ${user.lastName}`.trim(),
      clientPhone:    user.phone          || '',
      secondaryPhone: user.secondaryPhone || '',
      clientEmail:    user.email,
    };
  }

  setFormData(baseState);
}, [isOpen, selectedDate, user, isAdmin]);

useEffect(() => {
  if (!isOpen) return;

  const songCount       = formData.repertoireIds?.length || 0;
  const extraSongsPrice = songCount > INCLUDED_SONGS
    ? (songCount - INCLUDED_SONGS) * PRICE_PER_EXTRA_SONG
    : 0;

  const servicesCost = (formData.selectedServices || []).reduce((total: number, item: any) => {
    const service = services.find((s: any) => String(s.id) === String(item.serviceId));
    return total + (service ? Number(service.precio) * item.quantity : 0);
  }, 0);

  const normalizeStr      = (str: string) =>
    str.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const extraHoursService = services.find((s: any) => normalizeStr(s.nombre) === 'hora extra');
  const extraHoursQty     = extraHoursService
    ? (formData.selectedServices?.find((s: any) => String(s.serviceId) === String(extraHoursService.id))?.quantity || 0)
    : 0;

  const startTime = formData.startTime || formData.eventTime;
  let newEndTime  = '';
  if (startTime) {
    const [h, m]       = startTime.split(':').map(Number);
    const totalMinutes = h * 60 + m + (1 + extraHoursQty) * 60;
    const newH         = Math.floor(totalMinutes / 60) % 24;
    const newM         = totalMinutes % 60;
    newEndTime         = `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
  }

  setFormData((prev: any) => ({
    ...prev,
    totalAmount: extraSongsPrice + servicesCost,
    ...(newEndTime ? { endTime: newEndTime } : {}),
  }));
}, [formData.repertoireIds, formData.selectedServices, formData.startTime, formData.eventTime, isOpen, services]);

const checkBlockAndHours = async (date: string) => {
  const [status, hours] = await Promise.all([
    blockService.checkDateStatus(date),
    reservaService.getAvailableHours(date),
  ]);
  setBlockStatus(status);
  let filtered = hours;
  if (!status.isBlocked && status.hasPartialBlocks && status.blockedRanges) {
    filtered = hours.filter((hour: string) =>
      !status.blockedRanges!.some((range: any) => hour >= range.start && hour < range.end)
    );
  }
  // Si la fecha es hoy, filtrar horas que ya pasaron
  const todayStr = new Date().toISOString().split('T')[0];
  if (date === todayStr) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    filtered = filtered.filter((hour: string) => {
      const [h, m] = hour.split(':').map(Number);
      return h * 60 + m > currentMinutes;
    });
  }
  setAvailableHours(filtered);
};
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => {
      const updated = { ...prev, [name]: value };
      if (name === 'startTime') updated.eventTime = value;
      if (name === 'eventTime') updated.startTime = value;
      return updated;
    });
    if (errors[name as keyof ReservaFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleDateChange = (name: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
      ...(name === 'eventDate' ? { eventTime: '', startTime: '', endTime: '' } : {})
    }));
    if (name === 'eventDate') checkBlockAndHours(value);
  };

  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    if (!clientId) return;
    const cliente = clients.find(c => String(c.id) === String(clientId));
    if (!cliente) return;
    const mapped = mapClienteToForm(cliente);
    setFormData((prev: any) => ({ ...prev, ...mapped }));
    setErrors({});
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
  };

  const handleServiceChange = (serviceId: string, quantity: number) => {
    setFormData((prev: any) => {
      const currentServices = prev.selectedServices || [];
      const existingIndex   = currentServices.findIndex((s: any) => String(s.serviceId) === String(serviceId));
      const newServices     = [...currentServices];
      if (quantity === 0) {
        if (existingIndex >= 0) newServices.splice(existingIndex, 1);
      } else {
        if (existingIndex >= 0) newServices[existingIndex] = { ...newServices[existingIndex], quantity };
        else newServices.push({ serviceId, quantity });
      }
      return { ...prev, selectedServices: newServices };
    });
    if (errors.baseService) setErrors(prev => ({ ...prev, baseService: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);

    if (blockStatus.isBlocked) {
      setGlobalError(`No se puede crear la reserva: La fecha está bloqueada por "${blockStatus.reason || 'motivos administrativos'}".`);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (blockStatus.hasPartialBlocks && blockStatus.blockedRanges && formData.eventTime) {
      const isTimeBlocked = blockStatus.blockedRanges.some((range: any) =>
        formData.eventTime >= range.start && formData.eventTime < range.end
      );
      if (isTimeBlocked) {
        setGlobalError(`La hora seleccionada (${formData.eventTime}) no está disponible por un bloqueo administrativo.`);
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    const validationErrors = validate(formData, services, isAdmin);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstMessage = Object.values(validationErrors)[0];
      setGlobalError(firstMessage ?? null);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...formData,
        clienteId: formData.clientId,
      });
      // Solo resetear si se guarda exitosamente
      setFormData(getInitialFormState());
      setErrors({});
      setGlobalError(null);
    } catch (err: any) {
      console.error('Error al guardar reserva:', err);
      const errorMessage = getErrorMessage(err, 'Error al guardar la reserva.');
      setGlobalError(errorMessage);
      // ⚠️ NO se resetea formData para que el usuario pueda corregir y reintentar
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    setGlobalError(null);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={handleClose} />
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">

        {/* Cabecera */}
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shadow-lg shadow-primary-900/10">
              <Bookmark className="text-primary-600" size={20} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">Nueva Reserva</h3>
              <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">Complete todos los detalles del servicio</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Error global */}
        {globalError && (
          <div className="mx-6 mt-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
            <AlertCircle size={18} className="flex-shrink-0" /> {globalError}
          </div>
        )}

        {/* Formulario */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
          <ReservaForm
            formData={formData}
            isAdmin={isAdmin}
            isClient={!isAdmin}
            clients={clients}
            availableHours={availableHours}
            songs={songs}
            services={services}
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