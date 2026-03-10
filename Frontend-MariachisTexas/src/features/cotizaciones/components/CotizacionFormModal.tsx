
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, User, Calendar, Clock, MapPin, AlignLeft, Search, FileText, Phone, Mail, ChevronDown } from 'lucide-react';
import { Quotation, User as UserType, UserRole } from '@/types';
import { clientService } from '../../clientes/services/clientService';
import { useAuth } from '@/shared/contexts/AuthContext.tsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: Quotation | null;
}

export const CotizacionFormModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialData }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  
  const initialFormState = {
    clientId: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    eventDate: '',
    eventType: 'Serenata',
    location: '',
    startTime: '',
    endTime: '',
    repertoireNotes: '',
    totalAmount: 0
  };

  const [formData, setFormData] = useState<any>(initialFormState);
  const [clients, setClients] = useState<UserType[]>([]);

  // Generar opciones de tiempo (cada 30 min)
  const timeOptions = Array.from({ length: 48 }, (_, i) => {
      const hour = Math.floor(i / 2);
      const minute = i % 2 === 0 ? '00' : '30';
      return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  useEffect(() => {
    if (isOpen) {
        // Solo el admin necesita cargar la lista de clientes
        if (isAdmin) {
            clientService.getClients().then(setClients);
        }

        if (initialData) {
            setFormData(initialData);
        } else {
            // Nueva Cotización
            let baseData = { ...initialFormState };

            // Si es Cliente, pre-llenar sus datos automáticamente
            if (user && user.role === UserRole.CLIENTE) {
                baseData = {
                    ...baseData,
                    clientId: user.id,
                    clientName: `${user.name} ${user.lastName}`,
                    clientPhone: user.phone,
                    clientEmail: user.email,
                    location: user.address // Sugerir dirección registrada
                };
            }
            setFormData(baseData);
        }
    }
  }, [isOpen, initialData, user, isAdmin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // Autocompletar datos al seleccionar cliente (Solo Admin)
  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value;
      const client = clients.find(c => c.id === id);
      if (client) {
          setFormData((prev: any) => ({
              ...prev,
              clientId: client.id,
              clientName: `${client.name} ${client.lastName}`,
              clientPhone: client.phone,
              clientEmail: client.email
          }));
      } else {
          setFormData((prev: any) => ({ ...prev, clientId: '' }));
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.startTime || !formData.endTime) {
        alert("Por favor selecciona la hora de inicio y fin.");
        return;
    }

    if (formData.endTime <= formData.startTime && formData.endTime !== '00:00') {
       if (!confirm("La hora de fin es menor o igual a la de inicio. ¿Es un evento que termina al día siguiente?")) {
           return;
       }
    }
    
    onSave(formData);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">
        
        {/* Header Compacto */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shadow-sm">
                <FileText className="text-orange-600" size={18} />
            </div>
            <div>
                <h3 className="text-lg font-serif font-bold text-slate-800 tracking-wide uppercase">
                    {initialData ? 'Editar Cotización' : 'Nueva Cotización'}
                </h3>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30 p-6">
            <form id="cotizacion-form" onSubmit={handleSubmit} className="space-y-5">
                
                {/* 1. Datos del Cliente */}
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <User size={12} className="text-primary-600" /> Cliente
                    </h4>
                    
                    <div className="space-y-4">
                        {/* Vincular Cliente - SOLO VISIBLE PARA ADMIN */}
                        {isAdmin && (
                            <div className="bg-orange-50/50 p-3 rounded-lg border border-orange-100 mb-2">
                                <label className="label-form text-orange-800">Vincular Cliente Registrado</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" size={14} />
                                    <select 
                                        name="clientId" 
                                        value={formData.clientId} 
                                        onChange={handleClientSelect} 
                                        className="w-full pl-9 py-2 rounded-lg bg-white border border-orange-200 text-sm outline-none focus:border-orange-400 appearance-none cursor-pointer"
                                    >
                                        <option value="">-- Buscar en base de datos --</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} {c.lastName} - {c.phone}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400 pointer-events-none" size={14} />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label-form">Nombre Completo</label>
                                <input 
                                    type="text" 
                                    name="clientName" 
                                    required 
                                    value={formData.clientName} 
                                    onChange={handleChange} 
                                    className="input-form" 
                                    placeholder="Nombre cliente" 
                                    // Si es cliente y no es admin, podría ser readonly, pero permitimos editar nombre de contacto
                                />
                            </div>
                            <div>
                                <label className="label-form">Teléfono / WhatsApp</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input type="tel" name="clientPhone" required value={formData.clientPhone} onChange={handleChange} className="input-form pl-9" placeholder="300..." />
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <label className="label-form">Correo Electrónico</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input type="email" name="clientEmail" required value={formData.clientEmail} onChange={handleChange} className="input-form pl-9" placeholder="email@ejemplo.com" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Detalles del Evento */}
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Calendar size={12} className="text-primary-600" /> Evento
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="label-form">Fecha Evento</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input 
                                    type="date" 
                                    name="eventDate" 
                                    required 
                                    value={formData.eventDate} 
                                    onChange={handleChange} 
                                    className="input-form pl-9" 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="label-form">Tipo Evento</label>
                            <div className="relative">
                                <select name="eventType" value={formData.eventType} onChange={handleChange} className="input-form appearance-none cursor-pointer">
                                    <option value="Serenata">Serenata</option>
                                    <option value="Boda">Boda</option>
                                    <option value="Cumpleaños">Cumpleaños</option>
                                    <option value="Empresarial">Empresarial</option>
                                    <option value="Fúnebre">Fúnebre</option>
                                    <option value="Otro">Otro</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                            </div>
                        </div>
                    </div>

                    {/* Rango Horario Compacto */}
                    <div className="bg-orange-50/50 p-3 rounded-lg border border-orange-100 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <label className="text-[9px] text-orange-700 font-bold block mb-1">HORA INICIO</label>
                                <div className="relative">
                                    <select 
                                        name="startTime" 
                                        required 
                                        value={formData.startTime} 
                                        onChange={handleChange} 
                                        className="w-full bg-white border border-orange-200 text-sm rounded-lg p-2 outline-none focus:border-orange-400"
                                    >
                                        <option value="">Inicio</option>
                                        {timeOptions.map(time => (
                                            <option key={`start-${time}`} value={time}>{time}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <span className="text-orange-300 font-bold mt-4">-</span>
                            <div className="flex-1">
                                <label className="text-[9px] text-orange-700 font-bold block mb-1">HORA FIN</label>
                                <div className="relative">
                                    <select 
                                        name="endTime" 
                                        required 
                                        value={formData.endTime} 
                                        onChange={handleChange} 
                                        className="w-full bg-white border border-orange-200 text-sm rounded-lg p-2 outline-none focus:border-orange-400"
                                    >
                                        <option value="">Fin</option>
                                        {timeOptions.map(time => (
                                            <option key={`end-${time}`} value={time}>{time}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="label-form">Ubicación / Dirección</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input type="text" name="location" required value={formData.location} onChange={handleChange} className="input-form pl-9" placeholder="Dirección completa" />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="label-form">Notas de Repertorio</label>
                        <div className="relative">
                            <AlignLeft className="absolute left-3 top-3 text-slate-400" size={14} />
                            <textarea 
                                name="repertoireNotes" 
                                value={formData.repertoireNotes} 
                                onChange={handleChange} 
                                className="input-form pl-9 min-h-[80px] py-3 resize-none" 
                                placeholder="Canciones solicitadas..." 
                            />
                        </div>
                    </div>

                </div>

            </form>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
             <button 
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all uppercase tracking-widest"
            >
                Cancelar
            </button>
            <button 
                form="cotizacion-form"
                type="submit"
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-lg shadow-primary-900/20 hover:shadow-primary-900/30 transition-all transform hover:-translate-y-0.5"
            >
                <Save size={16} />
                Guardar
            </button>
        </div>
      </div>
      
      <style>{`
        .label-form {
            display: block;
            font-size: 9px;
            font-weight: 800;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
            padding-left: 2px;
        }
        .input-form {
            width: 100%;
            padding: 10px 12px;
            border-radius: 8px;
            background-color: white;
            border: 1px solid #e2e8f0;
            color: #334155;
            font-size: 13px;
            outline: none;
            transition: all 0.2s;
        }
        .input-form.pl-9 { padding-left: 36px; }
        .input-form:focus {
            border-color: #ef4444;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
      `}</style>
    </div>,
    document.body
  );
};
