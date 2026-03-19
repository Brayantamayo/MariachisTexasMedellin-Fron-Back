import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Bookmark } from 'lucide-react';
import { ReservaForm } from './ReservaForm';
import { User as UserType, Song, UserRole } from '@/types';
import { clientService } from '../../clientes/services/clientService';
import { repertoireService } from '../../repertoire/services/repertoireService';
import { reservaService } from '../services/reservaService';
import { blockService } from '../../bloqueos/services/blockService';
import { servicesService } from '@/src/features/servicio/services/servicesService.ts';
import { useAuth } from '@/shared/contexts/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  selectedDate?: string | null;
  selectedTime?: string | null;
}

export const ReservaCreateModal: React.FC<Props> = ({ isOpen, onClose, onSave, selectedDate, selectedTime }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;

  const INCLUDED_SONGS       = 7;
  const PRICE_PER_EXTRA_SONG = 10000;

  const initialFormState = {
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
  };

  const [formData,       setFormData]       = useState<any>(initialFormState);
  const [clients,        setClients]        = useState<UserType[]>([]);
  const [songs,          setSongs]          = useState<Song[]>([]);
  const [services,       setServices]       = useState<any[]>([]);
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [blockStatus,    setBlockStatus]    = useState<any>({ isBlocked: false });

  useEffect(() => {
    if (isOpen) {
      // ✅ FIX: getSongsPublic() solo trae canciones con activa = true
      // getSongs() traía TODAS incluyendo las desactivadas por el admin
      repertoireService.getSongsPublic().then(setSongs)
      servicesService.getServices().then(setServices)
      if (isAdmin) clientService.getClients().then(setClients)

      const dateToUse = selectedDate || new Date().toISOString().split('T')[0]
      const timeToUse = selectedTime || ''

      let baseState = {
        ...initialFormState,
        eventDate: dateToUse,
        eventTime: timeToUse,
        startTime: timeToUse,
      }

      // Pre-llenar datos del cliente registrado
      if (user && !isAdmin) {
        baseState = {
          ...baseState,
          clientId:       user.id,
          clientName:     `${user.name} ${user.lastName}`.trim(),
          clientPhone:    user.phone          || '',
          secondaryPhone: user.secondaryPhone || '',
          clientEmail:    user.email,
        }
      }

      setFormData(baseState)
      checkBlockAndHours(dateToUse)
    }
  }, [isOpen, selectedDate, user, isAdmin])

  useEffect(() => {
    if (!isOpen) return

    const songCount       = formData.repertoireIds?.length || 0
    const extraSongsPrice = songCount > INCLUDED_SONGS
      ? (songCount - INCLUDED_SONGS) * PRICE_PER_EXTRA_SONG
      : 0

    const servicesCost = (formData.selectedServices || []).reduce((total: number, item: any) => {
      const service = services.find((s: any) => String(s.id) === String(item.serviceId))
      return total + (service ? Number(service.precio) * item.quantity : 0)
    }, 0)

    const normalizeStr      = (str: string) =>
      str.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    const extraHoursService = services.find((s: any) => normalizeStr(s.nombre) === 'hora extra')
    const extraHoursQty     = extraHoursService
      ? (formData.selectedServices?.find((s: any) => String(s.serviceId) === String(extraHoursService.id))?.quantity || 0)
      : 0

    const startTime = formData.startTime || formData.eventTime
    let newEndTime  = ''
    if (startTime) {
      const [h, m]       = startTime.split(':').map(Number)
      const totalMinutes = h * 60 + m + (1 + extraHoursQty) * 60
      const newH         = Math.floor(totalMinutes / 60) % 24
      const newM         = totalMinutes % 60
      newEndTime         = `${newH.toString().padStart(2,'0')}:${newM.toString().padStart(2,'0')}`
    }

    setFormData((prev: any) => ({
      ...prev,
      totalAmount: extraSongsPrice + servicesCost,
      ...(newEndTime ? { endTime: newEndTime } : {}),
    }))
  }, [formData.repertoireIds, formData.selectedServices, formData.startTime, formData.eventTime, isOpen, services])

  const checkBlockAndHours = async (date: string) => {
    const status = await blockService.checkDateStatus(date)
    setBlockStatus(status)
    let hours = await reservaService.getAvailableHours(date)
    if (!status.isBlocked && status.hasPartialBlocks && status.blockedRanges) {
      hours = hours.filter(hour =>
        !status.blockedRanges!.some((range: any) => hour >= range.start && hour < range.end)
      )
    }
    setAvailableHours(hours)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: any) => {
      const updated = { ...prev, [name]: value }
      if (name === 'startTime') updated.eventTime = value
      if (name === 'eventTime') updated.startTime = value
      return updated
    })
  }

  const handleDateChange = (name: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
      ...(name === 'eventDate' ? { eventTime: '', startTime: '', endTime: '' } : {})
    }))
    if (name === 'eventDate') checkBlockAndHours(value)
  }

  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value
    const client   = clients.find(c => c.id === clientId)
    if (client) {
      setFormData((prev: any) => ({
        ...prev,
        clientName:     `${client.name} ${client.lastName}`,
        clientPhone:    client.phone,
        secondaryPhone: client.secondaryPhone || '',
        clientEmail:    client.email,
        address:        client.address,
        neighborhood:   client.neighborhood,
        clientId:       client.id
      }))
    }
  }

  const toggleSong = (songId: string) => {
    setFormData((prev: any) => {
      const current = prev.repertoireIds || []
      return {
        ...prev,
        repertoireIds: current.includes(songId)
          ? current.filter((id: string) => id !== songId)
          : [...current, songId]
      }
    })
  }

  const handleServiceChange = (serviceId: string, quantity: number) => {
    setFormData((prev: any) => {
      const currentServices = prev.selectedServices || []
      const existingIndex   = currentServices.findIndex((s: any) => String(s.serviceId) === String(serviceId))
      const newServices     = [...currentServices]
      if (quantity === 0) {
        if (existingIndex >= 0) newServices.splice(existingIndex, 1)
      } else {
        if (existingIndex >= 0) newServices[existingIndex] = { ...newServices[existingIndex], quantity }
        else newServices.push({ serviceId, quantity })
      }
      return { ...prev, selectedServices: newServices }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (blockStatus.isBlocked) {
      alert(`No se puede crear reserva: La fecha está bloqueada por "${blockStatus.reason || 'motivos administrativos'}".`)
      return
    }
    if (blockStatus.hasPartialBlocks && blockStatus.blockedRanges && formData.eventTime) {
      const isTimeBlocked = blockStatus.blockedRanges.some((range: any) =>
        formData.eventTime >= range.start && formData.eventTime < range.end
      )
      if (isTimeBlocked) {
        alert(`La hora seleccionada (${formData.eventTime}) no está disponible debido a un bloqueo administrativo.`)
        return
      }
    }
    if (!formData.eventTime) {
      alert('Por favor selecciona una hora.')
      return
    }
    onSave(formData)
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">

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
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
          <ReservaForm
            formData={formData}
            isAdmin={isAdmin}
            isClient={!isAdmin}
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
  )
}