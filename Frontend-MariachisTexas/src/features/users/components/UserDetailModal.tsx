
import React from 'react';
import { createPortal } from 'react-dom';
import { X, User as UserIcon, MapPin, Phone, Calendar, Mail, Hash, Briefcase, Music, Shield } from 'lucide-react';
import { User, UserRole } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export const UserDetailModal: React.FC<Props> = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  const DetailItem = ({ icon: Icon, label, value }) => (
      <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
              <Icon size={14} />
          </div>
          <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
              <p className="text-sm font-bold text-slate-700">{value || '-'}</p>
          </div>
      </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-primary-900/10 border bg-slate-100 border-slate-200">
                <UserIcon className="text-slate-600" size={20} />
            </div>
            <div>
                <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">Perfil de Usuario</h3>
                <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">Información del sistema</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
            
            {/* Header Profile */}
            <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden mb-4">
                    {user.avatar ? (
                        <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                            <UserIcon size={40} />
                        </div>
                    )}
                </div>
                <h2 className="text-2xl font-serif font-bold text-slate-800">{user.name} {user.lastName}</h2>
                <div className="flex gap-2 mt-2">
                    <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-xs font-bold uppercase flex items-center gap-1">
                        <Shield size={10} /> {user.role}
                    </span>

                </div>
            </div>

            <div className="space-y-6">
                
                {/* General Info */}
                <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Información General</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DetailItem icon={Hash} label="Documento" value={`${user.documentType} ${user.documentNumber}`} />
                        <DetailItem icon={Calendar} label="Fecha Nacimiento" value={user.birthDate} />
                        <DetailItem icon={Phone} label="Teléfono" value={user.phone} />
                        <DetailItem icon={Mail} label="Email" value={user.email} />
                        <DetailItem icon={MapPin} label="Ubicación" value={`${user.city}, ${user.address}`} />
                        <DetailItem icon={MapPin} label="Barrio" value={user.neighborhood} />
                    </div>
                </div>

                {/* Musician Info */}
                {user.role === UserRole.EMPLEADO && (
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Perfil Musical</h4>
                        <div className="bg-primary-50 p-4 rounded-xl border border-primary-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailItem icon={Music} label="Instrumento Principal" value={user.mainInstrument} />
                            <DetailItem icon={Briefcase} label="Experiencia" value={`${user.experienceYears} Años`} />
                            {user.otherInstruments && user.otherInstruments.length > 0 && (
                                <div className="md:col-span-2 flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
                                        <Music size={14} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Otros Instrumentos</p>
                                        <p className="text-sm font-bold text-slate-700">
                                            {Array.isArray(user.otherInstruments) ? user.otherInstruments.join(', ') : user.otherInstruments}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-end">
             <button onClick={onClose} className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-3 px-6 rounded-xl transition-all uppercase text-xs tracking-widest shadow-sm">
                Cerrar Detalle
            </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
