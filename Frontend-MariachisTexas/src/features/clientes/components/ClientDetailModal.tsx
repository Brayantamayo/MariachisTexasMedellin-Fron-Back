
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User as UserIcon, MapPin, Phone, Calendar, Mail, Hash, Building, Flag, DollarSign } from 'lucide-react';
import { User } from '@/types';
import { abonoService, EnrichedPayment } from '../../abonos/services/abonoService';
import { ventaService, Sale } from '../../ventas/services/ventaService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  client: User | null;
}

export const ClientDetailModal: React.FC<Props> = ({ isOpen, onClose, client }) => {
  const [abonos, setAbonos] = useState<EnrichedPayment[]>([]);
  const [loadingAbonos, setLoadingAbonos] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);

  useEffect(() => {
    if (isOpen && client) {
      loadAbonos();
      loadSales();
    }
  }, [isOpen, client]);

  const loadAbonos = async () => {
    setLoadingAbonos(true);
    try {
      const allAbonos = await abonoService.getAbonos();
      const clientAbonos = allAbonos.filter(abono =>
        client?.email ? abono.clientEmail?.toLowerCase() === client.email.toLowerCase() : abono.clientId === client?.id
      );
      setAbonos(clientAbonos);
    } catch (error) {
      console.error('Error loading abonos:', error);
    } finally {
      setLoadingAbonos(false);
    }
  };

  const loadSales = async () => {
    setLoadingSales(true);
    try {
      const allSales = await ventaService.getSales();
      const clientSales = allSales.filter(sale =>
        client?.email ? sale.clientEmail?.toLowerCase() === client.email.toLowerCase() : sale.clientId === String(client?.id)
      );
      setSales(clientSales);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoadingSales(false);
    }
  };

  if (!isOpen || !client) {
    return null;
  }

  const DetailItem = ({ icon: Icon, label, value }) => (
      <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
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
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/10 border bg-slate-100 border-slate-200">
                <UserIcon className="text-slate-600" size={20} />
            </div>
            <div>
                <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">Detalle Cliente</h3>
                <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">Información completa</p>
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
                    {client.avatar ? (
                        <img src={client.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                            <UserIcon size={40} />
                        </div>
                    )}
                </div>
                <h2 className="text-2xl font-serif font-bold text-slate-800">{client.name} {client.lastName}</h2>
                <div className="flex gap-2 mt-2">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase">{client.role}</span>

                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailItem icon={Hash} label="Documento" value={`${client.documentType} ${client.documentNumber}`} />
                <DetailItem icon={Calendar} label="Fecha Nacimiento" value={client.birthDate} />
                <DetailItem icon={Phone} label="Teléfono" value={client.phone} />
                <DetailItem icon={Phone} label="Tel. Secundario" value={client.secondaryPhone} />
                <DetailItem icon={Mail} label="Email" value={client.email} />
                <DetailItem icon={Building} label="Ciudad" value={client.city} />
                <DetailItem icon={MapPin} label="Dirección" value={client.address} />
                <DetailItem icon={MapPin} label="Barrio" value={client.neighborhood} />
            </div>

            {/* Sección de Abonos */}
            <div className="mt-8">
                <h3 className="text-lg font-serif font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <DollarSign size={20} className="text-emerald-600" />
                    Historial de Abonos
                </h3>
                {loadingAbonos ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                        <p className="text-sm text-slate-500 mt-2">Cargando abonos...</p>
                    </div>
                ) : abonos.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-xl border border-slate-100">
                        <DollarSign size={48} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No hay abonos registrados</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {abonos.map((abono) => (
                            <div key={abono.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">
                                            ${abono.amount.toLocaleString('es-CO')}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Reserva #{abono.reservationId}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-slate-600">
                                            {new Date(abono.date).toLocaleDateString('es-CO')}
                                        </p>
                                        <p className="text-xs text-slate-500 uppercase">
                                            {abono.method}
                                        </p>
                                    </div>
                                </div>
                                {abono.notes && (
                                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                                        {abono.notes}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sección de Ventas */}
            <div className="mt-8">
                <h3 className="text-lg font-serif font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Building size={20} className="text-emerald-600" />
                    Historial de Ventas
                </h3>
                {loadingSales ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                        <p className="text-sm text-slate-500 mt-2">Cargando ventas...</p>
                    </div>
                ) : sales.length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-xl border border-slate-100">
                        <Building size={48} className="text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No hay ventas registradas</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sales.map((sale) => (
                            <div key={sale.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-sm font-bold text-slate-700">
                                            {sale.concept}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            ${sale.amount.toLocaleString('es-CO')} - {sale.type}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-slate-600">
                                            {new Date(sale.date).toLocaleDateString('es-CO')}
                                        </p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                            sale.status === 'CONFIRMADO' ? 'bg-emerald-100 text-emerald-700' : 
                                            sale.status === 'FINALIZADO' ? 'bg-blue-100 text-blue-700' : 
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                            {sale.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
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
