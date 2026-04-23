import React, { useState, useMemo } from 'react';
import { User, Calendar, MapPin, Search, ChevronDown, DollarSign, ShieldAlert, AlertTriangle, Calculator, Plus, Minus, Package, Music, X, Check, ArrowLeft, Lock } from 'lucide-react';
import { User as UserType, Song, Service, TIPOS_EVENTO } from '@/types';
import { CustomDatePicker } from '@/shared/components/CustomDatePicker';

interface SelectedService {
  serviceId: string;
  quantity: number;
}

interface FormData {
  clientId?: string;
  clientName?: string;
  clientPhone?: string;
  secondaryPhone?: string;
  clientEmail?: string;
  eventDate?: string;
  eventTime?: string;
  startTime?: string;
  endTime?: string;
  eventType?: string;
  location?: string;
  notes?: string;
  homenajeado?: string;
  totalAmount?: number;
  repertoireIds?: string[];
  selectedServices?: SelectedService[];
}

interface Props {
  formData: FormData;
  isAdmin: boolean;
  isPublic?: boolean;
  isEditing?: boolean;
  isClient?: boolean;
  clients: any[];
  songs: Song[];
  services: Service[];
  availableHours?: string[];
  blockStatus?: {
    isBlocked: boolean;
    reason?: string;
    type?: string;
    hasPartialBlocks?: boolean;
    blockedRanges?: { start: string; end: string; reason: string }[];
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onDateChange: (name: string, value: string) => void;
  onClientSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onToggleSong: (id: string) => void;
  onServiceChange: (serviceId: string, quantity: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  fieldErrors?: Record<string, string | undefined>;
  isSaving?: boolean;
}

const getClienteLabel = (cliente: any): string => {
  const fullName = `${cliente.name ?? ''} ${cliente.lastName ?? ''}`.trim() || cliente.email
  const telefono = cliente.phone ?? ''
  return telefono ? `${fullName} - ${telefono}` : fullName
}

export const ReservaForm: React.FC<Props> = ({
  formData, isAdmin, isPublic = false,
  isEditing = false,
  isClient = false,
  clients, songs, services = [],
  availableHours = [],
  blockStatus = { isBlocked: false, reason: '', hasPartialBlocks: false, blockedRanges: [] },
  onChange, onDateChange, onClientSelect, onToggleSong, onServiceChange, onSubmit, onCancel,
  fieldErrors, isSaving = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // ─── FIX 1: bloquear campos si ya hay un cliente seleccionado del dropdown ──
  // Antes: lockClientFields = isEditing || isClient  (no bloqueaba al seleccionar)
  // Ahora: también se bloquea cuando el admin escoge un cliente existente (clientId poblado)
  const hasSelectedClient = isAdmin && !!formData.clientId && formData.clientId !== ''
  const lockClientFields  = isEditing || isClient || hasSelectedClient

  const activeServices      = services.filter(s => s.estado === true);
  const baseServices        = activeServices.filter(s => s.nombre.toLowerCase().includes('serenata'));
  const additionalServices  = activeServices.filter(s => !s.nombre.toLowerCase().includes('serenata'));

  const normalizeStr = (str: string) =>
    str.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const handleBaseServiceSelect = (serviceId: string) => {
    const isCurrentlySelected = (formData.selectedServices?.find(
      s => String(s.serviceId) === String(serviceId)
    )?.quantity ?? 0) > 0;
    if (!isCurrentlySelected) {
      baseServices.forEach(bs => {
        if (String(bs.id) !== String(serviceId)) {
          const selected = formData.selectedServices?.find(s => String(s.serviceId) === String(bs.id));
          if (selected && selected.quantity > 0) onServiceChange(bs.id, 0);
        }
      });
      onServiceChange(serviceId, 1);
    }
  };

  const extraHoursService  = services.find(s => normalizeStr(s.nombre) === 'hora extra');
  const extraSongsService  = services.find(s => normalizeStr(s.nombre) === 'cancion extra');

  const extraHoursQuantity = extraHoursService
    ? (formData.selectedServices?.find(s => String(s.serviceId) === String(extraHoursService.id))?.quantity || 0)
    : 0;

  const extraSongsQuantity = extraSongsService
    ? (formData.selectedServices?.find(s => String(s.serviceId) === String(extraSongsService.id))?.quantity || 0)
    : 0;

  const maxSongs         = 7 + extraSongsQuantity;
  const currentSongCount = formData.repertoireIds?.length || 0;

  const handleToggleSong = (id: string) => {
    const isSelected = formData.repertoireIds?.includes(id);
    if (!isSelected && currentSongCount >= maxSongs) {
      alert(`Has alcanzado el límite de ${maxSongs} canciones. Agrega "Canciones Extra" en Servicios Adicionales.`);
      return;
    }
    onToggleSong(id);
  };

  // ─── FIX 2: calcular total sumando TODOS los servicios seleccionados ──────
  // Antes: totalExtras solo sumaba servicios adicionales (sin el servicio base de serenata)
  // Ahora: el total mostrado refleja la suma real de todos los servicios activos
  const totalExtras = useMemo(() =>
    formData.selectedServices?.reduce((acc, item) => {
      const s = services.find(srv => String(srv.id) === String(item.serviceId));
      return acc + (s ? Number(s.precio) * item.quantity : 0);
    }, 0) ?? 0,
    [formData.selectedServices, services]
  );

  // Total calculado automáticamente (base serenata + adicionales)
  const autoTotal = useMemo(() => {
    return formData.selectedServices?.reduce((acc, item) => {
      if (item.quantity <= 0) return acc
      const s = services.find(srv => String(srv.id) === String(item.serviceId))
      return acc + (s ? Number(s.precio) * item.quantity : 0)
    }, 0) ?? 0
  }, [formData.selectedServices, services])

  // Si el admin no ha modificado manualmente el total (es 0 o undefined), usar el calculado
  const displayTotal = formData.totalAmount && formData.totalAmount > 0
    ? formData.totalAmount
    : autoTotal

  const today             = new Date().toISOString().split('T')[0];
  const filteredSongs     = searchTerm.trim() === ''
    ? []
    : songs.filter(s =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.artist.toLowerCase().includes(searchTerm.toLowerCase())
      );
  const selectedSongsList = songs.filter(s => formData.repertoireIds?.includes(s.id));

  const headerClass = isPublic
    ? "text-xl font-serif font-bold text-slate-800 mb-8 flex items-center gap-3 border-b border-orange-100/50 pb-4"
    : "text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2";
  const headerClassInline = isPublic
    ? "text-xl font-serif font-bold text-slate-800 mb-6 flex items-center gap-3"
    : "text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2";
  const labelClass    = "label-form";
  const inputClass    = "input-form";
  const lockedClass   = `${inputClass} bg-slate-50 text-slate-500 cursor-not-allowed`;

  // Handler del dropdown que también dispara recálculo del total si queda en 0
  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onClientSelect(e)
    // Si se deselecciona el cliente (value = ''), desbloquear campos
    // El padre maneja el estado, aquí solo propagamos
  }

  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  return (
    <form id="reserva-form" onSubmit={onSubmit} className="flex flex-col lg:flex-row h-full">

      {/* COLUMNA IZQUIERDA */}
      <div className={`w-full lg:w-7/12 p-8 lg:p-10 space-y-10 ${isPublic ? 'bg-white' : 'bg-white border-r border-slate-100'}`}>

        {/* 1. Datos del Cliente */}
        <div className={isPublic ? "" : "bg-white p-5 rounded-xl border border-slate-100 shadow-sm"}>
          <h4 className={headerClass}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPublic ? 'bg-orange-100 text-orange-600' : 'text-primary-600'}`}>
              <User size={isPublic ? 18 : 12} />
            </div>
            Información del Cliente
          </h4>

          {isAdmin && !isEditing && !isClient && (
            <div className="mb-4">
              <label className="label-form">BUSCAR CLIENTE REGISTRADO</label>
              
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
  <input
    type="text"
    placeholder="Escribe nombre, teléfono o correo..."
    value={clientSearch}
    onChange={(e) => {
      setClientSearch(e.target.value);
      setShowClientDropdown(true);
    }}
    onFocus={() => setShowClientDropdown(true)}
    onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
    className="w-full pl-9 pr-8 py-2 rounded-lg bg-white border border-orange-200 text-sm outline-none focus:border-orange-400 text-slate-700 font-medium"
  />
  {clientSearch && (
    <button
      type="button"
      onClick={() => {
        setClientSearch('');
        setShowClientDropdown(false);
        handleClientSelect({ target: { name: 'clientId', value: '' } } as any);
      }}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
    >
      <X size={14} />
    </button>
  )}

  {showClientDropdown && clientSearch.trim() !== '' && (
    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-orange-200 rounded-lg shadow-xl max-h-[220px] overflow-y-auto">
      {(clients ?? [])
        .filter(c => {
          const label = getClienteLabel(c).toLowerCase();
          return label.includes(clientSearch.toLowerCase());
        })
        .slice(0, 8)
        .map(c => (
          <div
            key={String(c.id)}
            onMouseDown={() => {
              setClientSearch(getClienteLabel(c));
              setShowClientDropdown(false);
              handleClientSelect({ target: { name: 'clientId', value: String(c.id) } } as any);
            }}
            className="px-4 py-3 hover:bg-orange-50 cursor-pointer border-b border-slate-50 last:border-0"
          >
            <p className="text-sm font-bold text-slate-700">
              {`${c.name ?? ''} ${c.lastName ?? ''}`.trim() || c.email}
            </p>
            <p className="text-xs text-slate-400">{c.phone ?? c.email}</p>
          </div>
        ))}
      {(clients ?? []).filter(c =>
        getClienteLabel(c).toLowerCase().includes(clientSearch.toLowerCase())
      ).length === 0 && (
        <p className="text-xs text-slate-400 text-center py-4">No se encontraron clientes.</p>
      )}
    </div>
  )}
</div>
            </div>
          )}

          {/* Aviso de bloqueo — se muestra cuando hay cliente seleccionado O en edición/cliente */}
          {lockClientFields && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 mb-4">
              <Lock size={12} className="text-slate-400" />
              <p className="text-[11px] text-slate-400 font-medium">
                {isClient
                  ? 'Tus datos se toman de tu perfil registrado.'
                  : isEditing
                  ? 'Los datos del cliente no se pueden modificar.'
                  : 'Cliente seleccionado. Los datos se cargan automáticamente.'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Nombre Completo <span className="text-orange-500">*</span></label>
              <input type="text" name="clientName" 
                value={formData.clientName || ''}
                onChange={onChange}
                disabled={lockClientFields}
                className={lockClientFields ? lockedClass : `${inputClass} ${fieldErrors?.clientName ? 'border-red-400 bg-red-50 ring-2 ring-red-100 focus:border-red-500' : ''}`}
                placeholder="Tu nombre completo" />
              {fieldErrors?.clientName && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{fieldErrors.clientName}</p>}
            </div>
            <div>
              <label className={labelClass}>Teléfono Principal <span className="text-orange-500">*</span></label>
              <input type="tel" name="clientPhone" 
                value={formData.clientPhone || ''}
                onChange={onChange}
                disabled={lockClientFields}
                className={lockClientFields ? lockedClass : `${inputClass} ${fieldErrors?.clientPhone ? 'border-red-400 bg-red-50 ring-2 ring-red-100 focus:border-red-500' : ''}`}
                placeholder="Ej: 300 123 4567" />
              {fieldErrors?.clientPhone && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{fieldErrors.clientPhone}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className={labelClass}>Teléfono Secundario</label>
              <input type="tel" name="secondaryPhone"
                value={formData.secondaryPhone || ''}
                onChange={onChange}
                disabled={lockClientFields}
                className={lockClientFields ? lockedClass : inputClass}
                placeholder="Opcional" />
            </div>
            <div>
              <label className={labelClass}>Correo Electrónico <span className="text-orange-500">*</span></label>
              <input type="email" name="clientEmail" 
                value={formData.clientEmail || ''}
                onChange={onChange}
                disabled={lockClientFields}
                className={lockClientFields ? lockedClass : `${inputClass} ${fieldErrors?.clientEmail ? 'border-red-400 bg-red-50 ring-2 ring-red-100 focus:border-red-500' : ''}`}
                placeholder="tucorreo@ejemplo.com" />
              {fieldErrors?.clientEmail && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{fieldErrors.clientEmail}</p>}
            </div>
          </div>
        </div>

        {/* 2. Detalles del Evento */}
        <div className={isPublic ? "" : "bg-white p-5 rounded-xl border border-slate-100 shadow-sm"}>
          <h4 className={headerClass}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPublic ? 'bg-orange-100 text-orange-600' : 'text-primary-600'}`}>
              <Calendar size={isPublic ? 18 : 12} />
            </div>
            Detalles del Evento
          </h4>

          <div className="mb-6">
            <label className={labelClass}>Nombre del Homenajeado</label>
            <input type="text" name="homenajeado" value={formData.homenajeado || ''} onChange={onChange}
              className={inputClass} placeholder="¿A quién va dirigida la serenata? (Opcional)" />
          </div>

          {blockStatus.isBlocked && (
            <div className="flex items-start gap-3 bg-red-50 p-4 rounded-xl border border-red-100 text-red-600 mb-6 animate-fade-in-up shadow-sm">
              <ShieldAlert size={20} className="shrink-0" />
              <div>
                <p className="text-sm font-bold uppercase tracking-wide">Fecha Bloqueada</p>
                <p className="text-xs mt-1 opacity-90">{blockStatus.reason}</p>
              </div>
            </div>
          )}

          {!blockStatus.isBlocked && blockStatus.hasPartialBlocks && (
            <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-700 mb-6 animate-fade-in-up shadow-sm">
              <AlertTriangle size={20} className="shrink-0" />
              <div>
                <p className="text-sm font-bold uppercase tracking-wide">Disponibilidad Limitada</p>
                <p className="text-xs mt-1 opacity-90">Algunas horas no están disponibles por bloqueos administrativos.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className={isPublic ? "mb-2" : ""}>
                {isPublic && <label className={labelClass}>Fecha del Evento <span className="text-orange-500">*</span></label>}
                <CustomDatePicker
                  name="eventDate"
                  label={isPublic ? undefined : "FECHA EVENTO"}
                  value={formData.eventDate || ''}
                  onChange={onDateChange}
                  minDate={today}
                  className={isPublic ? `${inputClass} !pl-12 ${fieldErrors?.eventDate ? 'border-red-400 bg-red-50 ring-2 ring-red-100 focus:border-red-500' : ''}` : (fieldErrors?.eventDate ? 'border-red-400 bg-red-50 ring-2 ring-red-100 focus:border-red-500' : '')}
                />
                {fieldErrors?.eventDate && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{fieldErrors.eventDate}</p>}
              </div>
            </div>
            <div>
              <label className={labelClass}>Tipo Evento <span className="text-orange-500">*</span></label>
              <div className="relative">
                <select name="eventType" value={formData.eventType || ''} onChange={onChange}
                  className={`${inputClass} appearance-none cursor-pointer ${fieldErrors?.eventType ? 'border-red-400 bg-red-50 ring-2 ring-red-100 focus:border-red-500' : ''}`}>
                  {TIPOS_EVENTO.map(tipo => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                {fieldErrors?.eventType && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{fieldErrors.eventType}</p>}
              </div>
            </div>
          </div>

          {/* Rango Horario */}
          <div className={`p-6 rounded-2xl border mb-6 transition-all ${blockStatus.isBlocked ? 'bg-slate-50 border-slate-200 opacity-50 pointer-events-none' : isPublic ? 'bg-orange-50/30 border-orange-100' : 'bg-orange-50/50 border-orange-100'}`}>
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-5">
                <div className="flex-1">
                  <label className={labelClass}>HORA INICIO <span className="text-orange-500">*</span></label>
                  <div className="relative">
                    <select name="startTime" 
                      value={formData.startTime || formData.eventTime || ''}
                      onChange={(e) => {
                        onChange(e);
                        onChange({ target: { name: 'eventTime', value: e.target.value } } as any);
                      }}
                      className={`${isPublic ? `${inputClass} ${fieldErrors?.startTime ? 'border-red-400 bg-red-50 ring-2 ring-red-100 focus:border-red-500' : ''}` : `w-full bg-white border ${fieldErrors?.startTime ? 'border-red-400 bg-red-50 ring-2 ring-red-100' : 'border-orange-200'} text-sm rounded-lg p-2.5 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 cursor-pointer text-slate-700 appearance-none font-medium`}`}>
                      <option value="">Seleccionar</option>
                      {availableHours.map(time => (
                        <option key={`start-${time}`} value={time}>{time}</option>
                      ))}
                      {(formData.startTime || formData.eventTime) && !availableHours.includes(formData.startTime || formData.eventTime || '') && (
                        <option value={formData.startTime || formData.eventTime}>{formData.startTime || formData.eventTime} (Actual)</option>
                      )}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-300 pointer-events-none" size={16} />
                    {fieldErrors?.startTime && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{fieldErrors.startTime}</p>}
                  </div>
                </div>
                <div className="flex-1">
                  <label className={labelClass}>HORA FIN</label>
                  <div className={`flex items-center justify-between rounded-xl px-4 border ${isPublic ? 'bg-white border-slate-200 h-[50px]' : 'bg-white border-orange-200 h-[42px]'}`}>
                    <span className={`font-mono font-bold ${isPublic ? 'text-slate-800 text-lg' : 'text-slate-700 text-sm'}`}>
                      {formData.endTime || '--:--'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
                <div className="w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <Check size={10} strokeWidth={3} />
                </div>
                <span className="font-bold text-orange-700">Duración Estimada:</span>
                <span>1 Hora (Base)</span>
                {extraHoursQuantity > 0 && (
                  <><span>+</span><span className="font-bold text-orange-700">{extraHoursQuantity} Horas Extra</span></>
                )}
              </div>
            </div>
          </div>

          {/* Tipo de Serenata */}
          <div className="mb-6">
            <label className={labelClass}>Tipo de Serenata <span className="text-orange-500">*</span></label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {baseServices.map(service => {
                const isSelected = (formData.selectedServices?.find(
                  s => String(s.serviceId) === String(service.id)
                )?.quantity ?? 0) > 0;
                return (
                  <div key={service.id} onClick={() => handleBaseServiceSelect(service.id)}
                    className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${isSelected ? 'border-orange-500 bg-orange-50 shadow-md' : fieldErrors?.serviceId ? 'border-red-400 bg-red-50 shadow-sm' : 'border-slate-200 bg-white hover:border-orange-300'}`}>
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                    <h5 className={`font-bold text-lg mb-1 ${isSelected ? 'text-orange-800' : 'text-slate-700'}`}>{service.nombre}</h5>
                    <p className="text-sm text-slate-500 mb-3">{service.descripcion}</p>
                    <p className={`font-bold ${isSelected ? 'text-orange-600' : 'text-slate-600'}`}>${service.precio.toLocaleString()}</p>
                  </div>
                );
              })}
              {fieldErrors?.serviceId && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium w-full">{fieldErrors.serviceId}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="md:col-span-2">
              <label className={labelClass}>Dirección del Evento <span className="text-orange-500">*</span></label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" name="location" value={formData.location || ''} onChange={onChange}
                  className={`${inputClass} !pl-12 ${fieldErrors?.location ? 'border-red-400 bg-red-50 ring-2 ring-red-100 focus:border-red-500' : ''}`} placeholder="Dirección completa (Calle, Barrio, Ciudad)" />
                {fieldErrors?.location && <p className="text-red-500 text-[11px] mt-1 pl-1 font-medium">{fieldErrors.location}</p>}
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Notas Adicionales</label>
            <textarea name="notes" value={formData.notes || ''} onChange={onChange}
              className={`${inputClass} min-h-[100px] resize-none`}
              placeholder="¿Alguna petición especial, dedicatoria o indicación para llegar?" />
          </div>
        </div>
      </div>

      {/* COLUMNA DERECHA */}
      <div className={`w-full lg:w-5/12 p-0 flex flex-col ${isPublic ? 'bg-slate-50 border-l border-slate-100' : 'bg-slate-50'}`}>
          {/* Servicios Adicionales */}
          <div className={`p-8 border-b border-slate-100 ${isPublic ? 'bg-slate-50/50' : 'bg-slate-50/30'}`}>
            <h4 className={headerClassInline}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPublic ? 'bg-orange-100 text-orange-600' : 'text-primary-600'}`}>
                <Package size={isPublic ? 18 : 12} />
              </div>
              Servicios Adicionales
            </h4>
            <div className="space-y-4">
              {additionalServices.map(service => {
                const selected = formData.selectedServices?.find(s => String(s.serviceId) === String(service.id));
                const quantity = selected?.quantity || 0;
                return (
                  <div key={service.id} className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${quantity > 0 ? 'bg-white border-orange-200 shadow-lg shadow-orange-900/5 ring-1 ring-orange-100' : 'bg-white border-slate-100 shadow-sm hover:border-slate-200'}`}>
                    <div>
                      <p className={`text-sm font-bold ${quantity > 0 ? 'text-slate-800' : 'text-slate-600'}`}>{service.nombre}</p>
                      <p className="text-xs text-slate-400 mt-1 font-medium">${service.precio.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 rounded-xl border border-slate-200 p-1.5">
                      <button type="button" onClick={() => onServiceChange(service.id, Math.max(0, quantity - 1))}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${quantity > 0 ? 'hover:bg-white text-slate-600 shadow-sm' : 'text-slate-300 cursor-not-allowed'}`}
                        disabled={quantity === 0}>
                        <Minus size={16} />
                      </button>
                      <span className="text-sm font-bold w-6 text-center text-slate-800">{quantity}</span>
                      <button type="button" onClick={() => onServiceChange(service.id, quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-orange-600 transition-colors shadow-sm">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {additionalServices.length === 0 && (
                <p className="text-[10px] text-slate-400 italic text-center py-2">No hay servicios extra disponibles.</p>
              )}
            </div>
          </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {/* Repertorio */}
          <div className={`p-8 border-b border-slate-100 ${isPublic ? 'bg-white' : 'bg-white'}`}>
            <div className={`flex items-center justify-between mb-6 border-b pb-4 ${isPublic ? 'border-orange-100/50' : 'border-primary-100'}`}>
              <h4 className={headerClassInline}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPublic ? 'bg-orange-100 text-orange-600' : 'text-primary-600'}`}>
                  <Music size={isPublic ? 18 : 12} />
                </div>
                Repertorio
              </h4>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Buscar canción por título o artista..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className={isPublic ? `${inputClass} pl-12` : "w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm outline-none focus:border-primary-300 transition-all"} />
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex justify-between items-center mb-3 px-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Seleccionadas: <span className={`${currentSongCount >= maxSongs ? 'text-orange-600' : 'text-slate-800'}`}>{currentSongCount}</span> / {maxSongs}
              </span>
              {currentSongCount >= maxSongs && (
                <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded-full animate-pulse">¡Límite alcanzado!</span>
              )}
            </div>

            {searchTerm && (
              <div className="border border-slate-100 rounded-xl shadow-xl bg-white mb-4 max-h-[300px] overflow-y-auto z-10 relative">
                {filteredSongs.length > 0 ? (
                  filteredSongs.map(song => {
                    const isSelected = formData.repertoireIds?.includes(song.id);
                    return (
                      <div key={song.id} onClick={() => handleToggleSong(song.id)}
                        className={`flex items-center justify-between p-4 border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50 transition-colors ${isSelected ? 'bg-orange-50/50' : ''}`}>
                        <div>
                          <p className={`text-sm font-bold ${isSelected ? 'text-orange-700' : 'text-slate-700'}`}>{song.title}</p>
                          <p className="text-xs text-slate-400 uppercase tracking-wide">{song.artist}</p>
                        </div>
                        {isSelected ? <Check size={18} className="text-orange-600" /> : <Plus size={18} className="text-slate-300" />}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 text-center py-8">No se encontraron canciones.</p>
                )}
              </div>
            )}

            {selectedSongsList.length > 0 ? (
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {selectedSongsList.map(song => (
                    <div key={song.id} className="flex items-center gap-2 bg-white text-slate-700 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 shadow-sm group hover:border-red-200 transition-colors">
                      <span>{song.title}</span>
                      <button type="button" onClick={() => onToggleSong(song.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 p-6 border-2 border-dashed border-slate-100 rounded-xl text-center">
                <p className="text-xs text-slate-400 font-medium">No has seleccionado canciones aún.</p>
                <p className="text-[10px] text-slate-300 mt-1">Puedes dejarlo vacío y decidir el día del evento.</p>
              </div>
            )}
          </div>

        </div>

        {/* Resumen de Costos */}
        <div className={`p-8 border-t border-slate-200 ${isPublic ? 'bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] relative z-20' : 'bg-white'}`}>
          <div className="space-y-3 mb-8 text-sm">
            {/* Desglose por servicio seleccionado */}
            {formData.selectedServices && formData.selectedServices
              .filter(item => item.quantity > 0)
              .map(item => {
                const s = services.find(srv => String(srv.id) === String(item.serviceId))
                if (!s) return null
                return (
                  <div key={item.serviceId} className="flex justify-between text-slate-500">
                    <span>{s.nombre}{item.quantity > 1 ? ` ×${item.quantity}` : ''}</span>
                    <span className="font-bold text-slate-700">
                      +${(Number(s.precio) * item.quantity).toLocaleString()}
                    </span>
                  </div>
                )
              })}
            <div className="h-px bg-slate-100 my-4" />
            <div className="flex flex-col">
              <div className="relative">
                <DollarSign className={`absolute left-0 top-1/2 -translate-y-1/2 ${isPublic ? 'text-slate-800' : 'text-primary-600'}`} size={isPublic ? 32 : 24} />
                <input
                  type="number"
                  name="totalAmount"
                  // ─── FIX 2: mostrar autoTotal si el valor guardado es 0 ───
                  value={displayTotal}
                  onChange={onChange}
                  disabled={true}
                  className={`w-full pl-8 pr-4 py-2 rounded-xl font-serif font-black border outline-none transition-all
                    ${isAdmin
                      ? 'bg-white border-slate-200 text-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-2xl'
                      : `bg-transparent border-transparent text-slate-800 cursor-default ${isPublic ? 'text-5xl tracking-tight' : 'text-2xl'}`
                    }`}
                />
                {!isAdmin && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    {isPublic ? <span className="text-xs font-sans font-bold text-slate-400 uppercase tracking-widest">COP</span> : <Calculator size={20} />}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={onCancel}
              className="flex-1 py-4 border border-slate-200 rounded-xl text-xs font-bold uppercase text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={blockStatus.isBlocked || isSaving}
              className={`flex-[2] py-4 text-white rounded-xl text-sm font-bold uppercase shadow-xl transition-all transform flex items-center justify-center gap-2
                ${(blockStatus.isBlocked || isSaving)
                  ? 'bg-slate-400 cursor-not-allowed shadow-none hover:translate-y-0'
                  : isPublic
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 shadow-orange-900/20 hover:-translate-y-1'
                    : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 shadow-primary-900/20 hover:-translate-y-0.5'
                }`}>
              {isSaving ? (
                <>
                  <svg className="animate-spin w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Guardando...
                </>
              ) : blockStatus.isBlocked ? (
                'Fecha Bloqueada'
              ) : (
                <>
                  Guardar Reserva
                  <ArrowLeft className="rotate-180" size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .label-form { display: block; font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; padding-left: 2px; }
        .input-form { width: 100%; padding: 10px 12px; border-radius: 8px; background-color: white; border: 1px solid #e2e8f0; color: #334155; font-size: 13px; outline: none; transition: all 0.2s; }
        .input-form.pl-9, .input-form.pl-10 { padding-left: 36px; }
        .input-form.pl-12 { padding-left: 48px; }
        .input-form:focus { border-color: #f87171; box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.1); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      `}</style>
    </form>
  );
};