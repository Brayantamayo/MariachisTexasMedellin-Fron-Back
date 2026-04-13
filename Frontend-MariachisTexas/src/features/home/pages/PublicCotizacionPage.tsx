import React, { useState, useEffect } from 'react';
import { CheckCircle, Star } from 'lucide-react';
import { Song, Service } from '@/types';
import { repertoireService } from '../../repertoire/services/repertoireService';
import { servicesService } from '../../servicio/services/servicesService';
import { reservaService } from '../../reservas/services/reservaService';
import { blockService } from '../../bloqueos/services/blockService';
import { cotizacionService } from '../../cotizaciones/services/cotizacionService';
import { useAuth } from '@/shared/contexts/AuthContext';
import { CotizacionForm, CotizacionFormErrors } from '../../cotizaciones/components/CotizacionForm';
import toast from 'react-hot-toast';

interface Props {
  onNavigate?: (path: string) => void;
}

export const PublicCotizacionPage: React.FC<Props> = ({ onNavigate }) => {
  const { user, isAuthenticated } = useAuth();

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
  const [errors,               setErrors]               = useState<CotizacionFormErrors>({});
  const [songs,                setSongs]                = useState<Song[]>([]);
  const [services,             setServices]             = useState<Service[]>([]);
  const [availableHours,       setAvailableHours]       = useState<string[]>([]);
  const [blockStatus,          setBlockStatus]          = useState<any>({ isBlocked: false });
  const [isSubmitting,         setIsSubmitting]         = useState(false);
  const [isSuccess,            setIsSuccess]            = useState(false);
  const [isManuallyOverridden, setIsManuallyOverridden] = useState(false);

  const fieldRefs = React.useRef<{ [key: string]: HTMLElement | null }>({});
  const registerFieldRef = (name: string, el: HTMLElement | null) => {
    fieldRefs.current[name] = el;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [songsData, servicesData] = await Promise.all([
          repertoireService.getSongsPublic(),
          servicesService.getServices()
        ])
        setSongs(songsData)
        setServices(servicesData)

        let baseData = { ...initialFormState }

        // ✅ Pre-rellenar si el usuario está logueado — campos en inglés según User
        if (isAuthenticated && user) {
          baseData = {
            ...baseData,
            clientId:       user.id,
            clientName:     `${user.name} ${user.lastName}`.trim(),
            clientPhone:    user.phone,
            secondaryPhone: user.secondaryPhone || '',
            clientEmail:    user.email,
            location:       user.address
          }
        }

        setFormData(baseData)
        checkBlockAndHours(baseData.eventDate)
      } catch (error) {
        console.error('Error loading data', error)
        toast.error('Error al cargar datos iniciales')
      }
    }
    loadData()
  }, [isAuthenticated, user])

  // Cálculo automático del precio
  useEffect(() => {
    if (isManuallyOverridden) return

    const songCount       = formData.repertoireIds?.length || 0
    const extraSongsPrice = songCount > INCLUDED_SONGS
      ? (songCount - INCLUDED_SONGS) * PRICE_PER_EXTRA_SONG
      : 0

    const servicesCost = (formData.selectedServices || []).reduce((total: number, item: any) => {
      const service = services.find(s => String(s.id) === item.serviceId)
      return total + (service ? Number(service.precio) * item.quantity : 0)
    }, 0)

    setFormData((prev: any) => ({ ...prev, totalAmount: extraSongsPrice + servicesCost }))
  }, [formData.startTime, formData.endTime, formData.repertoireIds, formData.selectedServices, isManuallyOverridden, services])

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
    if (['startTime', 'endTime'].includes(name)) setIsManuallyOverridden(false)
    setFormData((prev: any) => ({ ...prev, [name]: value }))
    // Limpiar error al escribir
    if (errors[name as keyof CotizacionFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleDateChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value, startTime: '', endTime: '' }))
    setIsManuallyOverridden(false)
    if (name === 'eventDate') {
      checkBlockAndHours(value)
      if (errors.eventDate) setErrors(prev => ({ ...prev, eventDate: undefined }))
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
    setIsManuallyOverridden(false)
  }

  const handleServiceChange = (serviceId: string, quantity: number) => {
    setFormData((prev: any) => {
      const current       = prev.selectedServices || []
      const existingIndex = current.findIndex((s: any) => s.serviceId === serviceId)
      let updated
      if (existingIndex >= 0) {
        updated = quantity === 0
          ? current.filter((s: any) => s.serviceId !== serviceId)
          : current.map((s: any, i: number) => i === existingIndex ? { serviceId, quantity } : s)
      } else {
        updated = quantity > 0 ? [...current, { serviceId, quantity }] : current
      }
      return { ...prev, selectedServices: updated }
    })
    setIsManuallyOverridden(false)
    if (errors.baseService) setErrors(prev => ({ ...prev, baseService: undefined }))
  }

  const validateForm = (): boolean => {
    const newErrors: CotizacionFormErrors = {}

    if (!formData.clientName?.trim())   newErrors.clientName  = 'El nombre es obligatorio'
    if (!formData.clientPhone?.trim())  newErrors.clientPhone = 'El teléfono es obligatorio'
    
    // Validación de Email
    if (!formData.clientEmail?.trim()) {
      newErrors.clientEmail = 'El correo es obligatorio'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      newErrors.clientEmail = 'Formato de correo inválido'
    }

    if (!formData.location?.trim())     newErrors.location    = 'La dirección es obligatoria'
    if (!formData.eventDate)            newErrors.eventDate   = 'La fecha es obligatoria'
    if (!formData.startTime)            newErrors.startTime   = 'La hora de inicio es obligatoria'

    const hasBaseService = formData.selectedServices?.some((s: any) => {
      const service = services.find(srv => String(srv.id) === s.serviceId)
      return service && service.nombre.toLowerCase().includes('serenata')
    })
    if (!hasBaseService) {
      newErrors.baseService = 'Debes seleccionar un tipo de serenata'
    }

    setErrors(newErrors)

    // Enfocar el primer error
    const firstError = Object.keys(newErrors)[0] as keyof CotizacionFormErrors
    if (firstError) {
      const el = fieldRefs.current[firstError]
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        el.focus()
      }
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    if (!validateForm()) {
      toast.error('Por favor, completa los campos obligatorios correctamente.')
      return
    }

    if (blockStatus.isBlocked) { 
      toast.error(`Fecha bloqueada: ${blockStatus.reason}`)
      return 
    }

    setIsSubmitting(true)
    try {
      await cotizacionService.createQuotation(formData)
      setIsSuccess(true)
      toast.success('¡Cotización enviada con éxito!')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || 'Error al enviar la cotización')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Pantalla de éxito ────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 pt-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 max-w-md w-full p-8 rounded-3xl shadow-2xl text-center relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-white mb-3">¡Cotización Recibida!</h2>
          <p className="text-slate-300 mb-8 leading-relaxed">
            Hemos recibido tu solicitud. Nos pondremos en contacto a{' '}
            <strong className="text-orange-400">{formData.clientPhone}</strong> o{' '}
            <strong className="text-orange-400">{formData.clientEmail}</strong>.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => onNavigate?.('/')}
              className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all border border-white/5">
              Volver al Inicio
            </button>
            <button
              onClick={() => { setIsSuccess(false); setFormData(initialFormState); window.scrollTo(0, 0) }}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold rounded-xl hover:from-orange-400 hover:to-red-500 transition-all">
              Nueva Cotización
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Formulario ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050505] pb-24 pt-32 px-4 font-sans relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-orange-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-900/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
            <Star size={12} className="text-orange-400 fill-orange-400" />
            <span className="text-orange-200 font-bold tracking-[0.2em] text-[10px] uppercase">Planea tu Evento Perfecto</span>
            <Star size={12} className="text-orange-400 fill-orange-400" />
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-medium tracking-tight text-white mb-6 drop-shadow-2xl">
            Solicitar{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-200 via-orange-400 to-orange-200">
              Cotización
            </span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-base leading-relaxed font-light">
            Personaliza tu experiencia con{' '}
            <span className="text-white font-medium">Mariachis Texas</span>.
            Selecciona tu repertorio, fecha y servicios para obtener un presupuesto inmediato.
          </p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl shadow-black/50 overflow-hidden border border-white/10">
          <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-red-500 to-orange-500" />
          <CotizacionForm
            formData={formData}
            isAdmin={false}
            isPublic={true}
            isSubmitting={isSubmitting}
            clients={[]}
            songs={songs}
            services={services}
            availableHours={availableHours}
            blockStatus={blockStatus}
            fieldErrors={errors}
            registerFieldRef={registerFieldRef}
            onChange={handleChange}
            onDateChange={handleDateChange}
            onClientSelect={() => {}}
            onToggleSong={toggleSong}
            onServiceChange={handleServiceChange}
            onSubmit={handleSubmit}
            onCancel={() => onNavigate?.('/')}
          />
        </div>

        <div className="text-center mt-12 text-slate-500 text-xs uppercase tracking-widest opacity-60">
          Mariachis Texas © {new Date().getFullYear()} • Música con Pasión
        </div>
      </div>
    </div>
  )
}