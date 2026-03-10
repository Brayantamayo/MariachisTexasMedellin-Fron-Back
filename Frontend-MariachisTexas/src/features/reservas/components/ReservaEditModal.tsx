
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Bookmark } from 'lucide-react';
import { ReservaForm } from './ReservaForm';
import { User as UserType, Song, UserRole, Reservation } from '@/types';
import { clientService } from '../../clientes/services/clientService';
import { repertoireService } from '../../repertoire/services/repertoireService';
import { reservaService } from '../services/reservaService';
import { blockService } from '../../bloqueos/services/blockService';
import { servicesService } from '@/src/features/servicio/services/servicesService';
import { useAuth } from '@/shared/contexts/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  reservation: Reservation | null;
}

export const ReservaEditModal: React.FC<Props> = ({ isOpen, onClose, onSave, reservation }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const INCLUDED_SONGS = 7;
  const PRICE_PER_EXTRA_SONG = 10000;

  const [formData, setFormData] = useState<any>(null);
  
  const [clients, setClients] = useState<UserType[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado de Bloqueo
  const [blockStatus, setBlockStatus] = useState<any>({ isBlocked: false });

  useEffect(() => {
    if (isOpen && reservation) {
        setFormData(reservation);
        
        repertoireService.getSongs().then(setSongs);
        servicesService.getServices().then(setServices);
        if (isAdmin) {
            clientService.getClients().then(setClients);
        }
        
        checkBlockAndHours(reservation.eventDate);
        setSearchTerm('');
    }
  }, [isOpen, reservation, isAdmin]);

  // Recalcular precios
  useEffect(() => {
      if (!isOpen || !formData) return;
      
      const songCount = formData.repertoireIds?.length || 0;
      let extraSongsPrice = 0;
      if (songCount > INCLUDED_SONGS) {
          extraSongsPrice = (songCount - INCLUDED_SONGS) * PRICE_PER_EXTRA_SONG;
      }

      const servicesCost = (formData.selectedServices || []).reduce((total: number, item: any) => {
          const service = services.find(s => s.id === item.serviceId);
          return total + (service ? service.price * item.quantity : 0);
      }, 0);

      setFormData((prev: any) => ({ ...prev, totalAmount: extraSongsPrice + servicesCost }));
  }, [formData?.repertoireIds, formData?.selectedServices, isOpen, services]);

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
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, value: string) => {
      setFormData((prev: any) => ({ 
          ...prev, 
          [name]: value,
          ...(name === 'eventDate' ? { eventTime: '' } : {})
      }));
      
      if (name === 'eventDate') {
          checkBlockAndHours(value);
      }
  };

  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const clientId = e.target.value;
      const client = clients.find(c => c.id === clientId);
      if (client) {
          setFormData((prev: any) => ({
              ...prev,
              clientName: `${client.name} ${client.lastName}`,
              clientPhone: client.phone,
              secondaryPhone: client.secondaryPhone || '',
              clientEmail: client.email,
              address: client.address,
              neighborhood: client.neighborhood,
              clientId: client.id
          }));
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
  };

  const handleServiceChange = (serviceId: string, quantity: number) => {
      setFormData((prev: any) => {
          const currentServices = prev.selectedServices || [];
          const existingIndex = currentServices.findIndex((s: any) => s.serviceId === serviceId);
          
          let newServices = [...currentServices];
          if (quantity === 0) {
              if (existingIndex >= 0) newServices.splice(existingIndex, 1);
          } else {
              if (existingIndex >= 0) {
                  newServices[existingIndex] = { ...newServices[existingIndex], quantity };
              } else {
                  newServices.push({ serviceId, quantity });
              }
          }
          return { ...prev, selectedServices: newServices };
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación Bloqueo
    if (blockStatus.isBlocked) {
        alert(`No se puede actualizar: La fecha seleccionada está bloqueada por "${blockStatus.reason}".`);
        return;
    }

    if (blockStatus.hasPartialBlocks && blockStatus.blockedRanges && formData.eventTime) {
        const isTimeBlocked = blockStatus.blockedRanges.some((range: any) => 
            formData.eventTime >= range.start && formData.eventTime < range.end
        );
        if (isTimeBlocked) {
            alert(`La hora seleccionada (${formData.eventTime}) está bloqueada administrativamente.`);
            return;
        }
    }

    if (!formData.eventTime) {
        alert("Por favor selecciona una hora disponible.");
        return;
    }
    
    onSave(formData);
  };

  if (!isOpen || !formData) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">
        
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shadow-lg shadow-primary-900/10">
                <Bookmark className="text-primary-600" size={20} />
            </div>
            <div>
                <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">Editar Reserva</h3>
                <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">Modificar datos del evento #{reservation?.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
            <ReservaForm 
                formData={formData}
                isAdmin={isAdmin}
                clients={clients}
                availableHours={availableHours}
                songs={songs}
                services={services}
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
