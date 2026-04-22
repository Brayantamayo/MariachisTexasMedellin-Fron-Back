import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Calendar, AlertCircle } from 'lucide-react';
import { RehearsalForm } from './RehearsalForm';
import { Rehearsal, Song } from '@/types';
import { repertoireService } from '../../repertoire/services/repertoireService';
import { reservaService } from '../../reservas/services/reservaService';
import { blockService } from '../../bloqueos/services/blockService';
import { getErrorMessage } from '@/shared/utils/getErrorMessage';

///esta es la interfaz de props para el modal de edición de ensayo. Recibe el estado de apertura, funciones de cierre y guardado, y los datos del ensayo a editar.  
interface Props {
isOpen:    boolean;
onClose:   () => void;
onSave:    (data: any) => Promise<void>; 
rehearsal: Rehearsal | null;
}

interface FormErrors {
title?:    string;
location?: string;
date?:     string;
time?:     string;
}

///esta función valida los datos del formulario y devuelve un objeto de errores si hay alguno.
const validate = (formData: any, blockStatus: any): FormErrors => {
const errors: FormErrors = {};
if (!formData.title?.trim())    errors.title    = 'El nombre del ensayo es obligatorio.';
if (!formData.location?.trim()) errors.location = 'El lugar es obligatorio.';
if (!formData.date)             errors.date     = 'La fecha es obligatoria.';
if (blockStatus.isBlocked)      errors.date     = `Fecha bloqueada: ${blockStatus.reason || 'Restricción administrativa'}.`;
if (!formData.time)             errors.time     = 'Selecciona una hora válida.';
return errors;
};

///esta es la función de renderizado del modal de edición de ensayo. Recibe el estado de apertura, funciones de cierre y guardado, y los datos del ensayo a editar.
export const RehearsalEditModal: React.FC<Props> = ({ isOpen, onClose, onSave, rehearsal }) => {
const [formData,       setFormData]       = useState<any>(null);
const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
const [availableHours, setAvailableHours] = useState<string[]>([]);
const [blockStatus,    setBlockStatus]    = useState<any>({ isBlocked: false });
const [errors,         setErrors]         = useState<FormErrors>({});
const [globalError,    setGlobalError]    = useState<string | null>(null);
const [saving,         setSaving]         = useState(false);

///esta función se ejecuta cuando el modal se abre y carga los datos del ensayo a editar.
useEffect(() => {
    if (rehearsal && isOpen) {
    setFormData({ ...rehearsal });
    setErrors({});
    setGlobalError(null);
    const loadData = async () => {
        const songs = await repertoireService.getSongs();
        setAvailableSongs(songs);
        await checkBlockAndHours(rehearsal.date);
    };
    loadData();
    }
}, [rehearsal, isOpen]);

///esta función verifica si el evento está bloqueado y si hay horas disponibles para reservar.
const checkBlockAndHours = async (date: string) => {
    const status = await blockService.checkDateStatus(date);
    setBlockStatus(status);
    let hours = await reservaService.getAvailableHours(date);
    if (!status.isBlocked && status.hasPartialBlocks && status.blockedRanges) {
    hours = hours.filter(hour =>
        !status.blockedRanges!.some((range: any) => hour >= range.start && hour < range.end)
    );
    }
    setAvailableHours(hours);
};

///esta función actualiza los datos del formulario cuando cambia el valor de un campo.
const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) setErrors(prev => ({ ...prev, [name]: undefined }));
};

///esta función actualiza los datos del formulario cuando cambia el valor de una fecha.
const handleDateChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value, time: '' }));
    if (name === 'date') checkBlockAndHours(value);
    if (errors.date || errors.time) setErrors(prev => ({ ...prev, date: undefined, time: undefined }));
};

///esta función activa o desactiva la selección de una canción en el repertorio.
const toggleSongSelection = (songId: string) => {
    setFormData((prev: any) => {
    const exists = prev.repertoireIds.includes(songId);
    return {
        ...prev,
        repertoireIds: exists
        ? prev.repertoireIds.filter((id: string) => id !== songId)
        : [...prev.repertoireIds, songId],
    };
    });
};

///esta función valida los datos del formulario y, si son válidos, guarda los cambios.
const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setGlobalError(null);

    const validationErrors = validate(formData, blockStatus);
    if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
      return; // ✅ No cierra el modal
    }

    setSaving(true);
    try {
    await onSave(formData);
    setErrors({});
    } catch (err) {
    setGlobalError(getErrorMessage(err, 'Error al actualizar el ensayo.')); 
    } finally {
    setSaving(false);
    }
};

///esta función cierra el modal.
const handleClose = () => {
    setErrors({});
    setGlobalError(null);
    onClose();
};

if (!isOpen || !formData) return null;

/// esta es la vista al editar 
return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleClose} />
    <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 bg-white border-b border-slate-100">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shadow-lg">
            <Calendar className="text-red-600" size={24} />
            </div>
            <div>
            <h3 className="text-xl font-serif font-bold text-slate-800 tracking-wide uppercase">Editar Ensayo</h3>
            <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">Modificando: {rehearsal?.title}</p>
            </div>
        </div>
        <button onClick={handleClose} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-lg transition-colors">
            <X size={20} />
        </button>
        </div>

        {/* error en el backend */}
        {globalError && (
        <div className="mx-8 mt-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
            <AlertCircle size={18} className="flex-shrink-0" /> {globalError}
        </div>
        )}

        {/* Formulario */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        <RehearsalForm
            formData={formData}
            availableSongs={availableSongs}
            availableHours={availableHours}
            blockStatus={blockStatus}
            onChange={handleChange}
            onDateChange={handleDateChange}
            onToggleSong={toggleSongSelection}
            onSubmit={handleSubmit}
            errors={errors}  
        />
        </div>

        {/* Pie de página */}
        <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-end gap-4">
        <button onClick={handleClose} disabled={saving}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest px-4 py-2 disabled:opacity-50">
            Cancelar
        </button>

        {/* Botón de guardar */}
        <button
            onClick={() => handleSubmit()}
            disabled={blockStatus.isBlocked || saving}
            className={`px-8 py-4 rounded-xl text-xs font-bold tracking-widest uppercase flex items-center gap-3 shadow-xl transition-all transform hover:-translate-y-0.5
            ${blockStatus.isBlocked
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-[#dc2626] hover:bg-red-700 text-white shadow-red-900/10'
            } disabled:opacity-60`}
        >
            {saving
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
            : <><Save size={18} /> {blockStatus.isBlocked ? 'Fecha Bloqueada' : 'Guardar Cambios'}</>
            }
        </button>
        
        </div>
    </div>
    </div>,
    document.body
);
};