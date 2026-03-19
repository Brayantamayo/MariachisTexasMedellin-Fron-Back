import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Bookmark } from 'lucide-react';
import { ReservaForm } from './ReservaForm';
import { Song, UserRole, Reservation } from '@/types';
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

  const INCLUDED_SONGS       = 7;
  const PRICE_PER_EXTRA_SONG = 10000;

  const [formData,       setFormData]       = useState<any>(null);
  const [songs,          setSongs]          = useState<Song[]>([]);
  const [services,       setServices]       = useState<any[]>([]);
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [blockStatus,    setBlockStatus]    = useState<any>({ isBlocked: false });
  const [servicesLoaded, setServicesLoaded] = useState(false);

  // ─── CARGAR DATOS AL ABRIR ────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && reservation) {
      setServicesLoaded(false)
      setFormData({
        ...reservation,
        startTime: reservation.startTime || reservation.eventTime || '',
        endTime:   reservation.endTime   || '',
      })

      repertoireService.getSongsPublic().then(setSongs)

      servicesService.getServices().then(data => {
        setServices(data)
        setServicesLoaded(true)
      })

      // ✅ Pasar el ID de la reserva para excluirla del cálculo de horas disponibles
      checkBlockAndHours(reservation.eventDate, reservation.id)
    }
  }, [isOpen, reservation, isAdmin])

  // ─── RECALCULAR PRECIO Y HORA FIN ─────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !formData || !servicesLoaded) return

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
  }, [
    formData?.repertoireIds,
    formData?.selectedServices,
    formData?.startTime,
    formData?.eventTime,
    isOpen,
    servicesLoaded
  ])

  // ✅ reservaId opcional — cuando se edita, excluye esa reserva del bloqueo de horas
  const checkBlockAndHours = async (date: string, reservaId?: string) => {
    const status = await blockService.checkDateStatus(date)
    setBlockStatus(status)
    let hours = await reservaService.getAvailableHours(date, reservaId) // ✅ pasa el ID
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
    // ✅ Al cambiar fecha, pasar el ID solo si la fecha es la misma que la original
    // Si cambia de fecha, no excluir (la reserva ya no ocupa esa fecha)
    const sameDate = value === reservation?.eventDate
    if (name === 'eventDate') checkBlockAndHours(value, sameDate ? reservation?.id : undefined)
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
      alert(`No se puede actualizar: La fecha está bloqueada por "${blockStatus.reason}".`)
      return
    }
    if (blockStatus.hasPartialBlocks && blockStatus.blockedRanges && formData.eventTime) {
      const isTimeBlocked = blockStatus.blockedRanges.some((range: any) =>
        formData.eventTime >= range.start && formData.eventTime < range.end
      )
      if (isTimeBlocked) {
        alert(`La hora seleccionada (${formData.eventTime}) está bloqueada administrativamente.`)
        return
      }
    }
    if (!formData.eventTime) {
      alert('Por favor selecciona una hora disponible.')
      return
    }
    onSave(formData)
  }

  if (!isOpen || !formData) return null

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
            isEditing={true}
            clients={[]}
            availableHours={availableHours}
            songs={songs}
            services={services}
            blockStatus={blockStatus}
            onChange={handleChange}
            onDateChange={handleDateChange}
            onClientSelect={() => {}}
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