
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, FileText } from 'lucide-react';
import { UserRole, User as UserType, Song, Service } from '@/types';
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
}

export const CotizacionCreateModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const INCLUDED_SONGS = 7;
  const PRICE_PER_EXTRA_SONG = 10000;
  
  const initialFormState = {
    clientId: '',
    clientName: '',
    clientPhone: '',
    secondaryPhone: '',
    clientEmail: '',
    homenajeado: '',
    eventDate: new Date().toISOString().split('T')[0], // Default today
    eventType: 'Serenata',
    location: '',
    startTime: '',
    endTime: '',
    repertoireIds: [] as string[],
    selectedServices: [] as { serviceId: string; quantity: number }[],
    repertoireNotes: '',
    totalAmount: 0
  };

  const [formData, setFormData] = useState<any>(initialFormState);
  const [clients, setClients] = useState<UserType[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [blockStatus, setBlockStatus] = useState<any>({ isBlocked: false });

  // Estado para controlar si el admin editó manualmente el precio
  const [isManuallyOverridden, setIsManuallyOverridden] = useState(false);

  useEffect(() => {
    if (isOpen) {
        repertoireService.getSongs().then(setSongs);
        servicesService.getServices().then(setServices);
        if (isAdmin) {
            clientService.getClients().then(setClients);
        }

        let baseData = { ...initialFormState };
        if (user && user.role === UserRole.CLIENTE) {
            baseData = {
                ...baseData,
                clientId: user.id,
                clientName: `${user.name} ${user.lastName}`,
                clientPhone: user.phone,
                secondaryPhone: user.secondaryPhone || '',
                clientEmail: user.email,
                location: user.address
            };
        }
        setFormData(baseData);
        setIsManuallyOverridden(false);
        checkBlockAndHours(baseData.eventDate);
    }
  }, [isOpen, user, isAdmin]);

  // Lógica de Cálculo de Precio Automático
  useEffect(() => {
      if (!isOpen || isManuallyOverridden) return;

      const calculateTotal = () => {
          // 1. Calcular Canciones Extra
          const songCount = formData.repertoireIds?.length || 0;
          let extraSongsPrice = 0;
          if (songCount > INCLUDED_SONGS) {
              extraSongsPrice = (songCount - INCLUDED_SONGS) * PRICE_PER_EXTRA_SONG;
          }

          // 2. Calcular Servicios Extra
          const servicesCost = (formData.selectedServices || []).reduce((total: number, item: any) => {
              const service = services.find(s => s.id === item.serviceId);
              return total + (service ? service.price * item.quantity : 0);
          }, 0);

          return extraSongsPrice + servicesCost;
      };

      const newTotal = calculateTotal();
      setFormData((prev: any) => ({ ...prev, totalAmount: newTotal }));

  }, [formData.startTime, formData.endTime, formData.repertoireIds, formData.selectedServices, isOpen, isManuallyOverridden, services]);

  const checkBlockAndHours = async (date: string) => {
      // 1. Verificar bloqueo
      const status = await blockService.checkDateStatus(date);
      setBlockStatus(status);

      // 2. Cargar horas
      let hours = await reservaService.getAvailableHours(date);
      
      // 3. Filtrar parciales
      if (!status.isBlocked && status.hasPartialBlocks && status.blockedRanges) {
          hours = hours.filter(hour => {
              return !status.blockedRanges!.some(range => hour >= range.start && hour < range.end);
          });
      }
      setAvailableHours(hours);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Si el admin edita el totalAmount, marcamos como manual para detener el cálculo automático
    if (name === 'totalAmount') {
        setIsManuallyOverridden(true);
    }
    // Si cambia cualquier otro parámetro que afecta el precio, reactivamos el cálculo automático
    else if (['startTime', 'endTime'].includes(name)) {
        setIsManuallyOverridden(false);
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler para el CustomDatePicker
  const handleDateChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value, startTime: '', endTime: '' }));
    setIsManuallyOverridden(false);
    if (name === 'eventDate') {
        checkBlockAndHours(value);
    }
  };

  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value;
      const client = clients.find(c => c.id === id);
      if (client) {
          setFormData(prev => ({
              ...prev,
              clientId: client.id,
              clientName: `${client.name} ${client.lastName}`,
              clientPhone: client.phone,
              secondaryPhone: client.secondaryPhone || '',
              clientEmail: client.email,
              location: client.address
          }));
          setIsManuallyOverridden(false);
      } else {
          setFormData(prev => ({ ...prev, clientId: '' }));
      }
  };

  const toggleSong = (songId: string) => {
      setFormData((prev: any) => {
          const current = prev.repertoireIds || [];
          if (current.includes(songId)) {
              return { ...prev, repertoireIds: current.filter((id: string) => id !== songId) };
          } else {
              return { ...prev, repertoireIds: [...current, songId] };
          }
      });
      setIsManuallyOverridden(false); // Recalcular costo canciones
  };

  const handleServiceChange = (serviceId: string, quantity: number) => {
      setFormData((prev: any) => {
          const current = prev.selectedServices || [];
          const existingIndex = current.findIndex((s: any) => s.serviceId === serviceId);
          
          let updated;
          if (existingIndex >= 0) {
              if (quantity === 0) {
                  updated = current.filter((s: any) => s.serviceId !== serviceId);
              } else {
                  updated = [...current];
                  updated[existingIndex] = { serviceId, quantity };
              }
          } else {
              if (quantity > 0) {
                  updated = [...current, { serviceId, quantity }];
              } else {
                  updated = current;
              }
          }
          return { ...prev, selectedServices: updated };
      });
      setIsManuallyOverridden(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (blockStatus.isBlocked) {
        alert(`La fecha está bloqueada: ${blockStatus.reason}`);
        return;
    }

    if (!formData.startTime || !formData.endTime) {
        alert("Por favor selecciona la hora de inicio y fin.");
        return;
    }

    const hasBaseService = formData.selectedServices?.some((s: any) => {
        const service = services.find(srv => srv.id === s.serviceId);
        return service && service.name.toLowerCase().includes('serenata');
    });

    if (!hasBaseService) {
        alert("Por favor selecciona un Tipo de Serenata.");
        return;
    }

    if (formData.endTime <= formData.startTime && formData.endTime !== '00:00' && formData.endTime !== '00:30') {
       if (!confirm("La hora de fin es menor o igual a la de inicio. ¿Es un evento que termina al día siguiente?")) {
           return;
       }
    }
    onSave(formData);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">
        
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
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
            <CotizacionForm 
                formData={formData}
                isAdmin={isAdmin}
                clients={clients}
                songs={songs}
                services={services}
                availableHours={availableHours}
                blockStatus={blockStatus}
                onChange={handleChange}
                onDateChange={handleDateChange}
                onClientSelect={handleClientSelect}
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
