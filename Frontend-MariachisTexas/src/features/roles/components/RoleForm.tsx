import React from 'react';
import { AlertCircle, BarChart3, Check } from 'lucide-react';
import { AVAILABLE_MODULES } from '../data/permissions';

export interface RoleFormErrors {
  name?: string;
  description?: string;
  permissions?: string;
}

interface Props {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onTogglePermission: (moduleId: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loadingPermissions?: boolean;
  errors?: RoleFormErrors;
  registerFieldRef?: (field: string, el: HTMLElement | null) => void;
}

export const RoleForm: React.FC<Props> = ({
  formData,
  onChange,
  onTogglePermission,
  onSubmit,
  loadingPermissions,
  errors = {},
  registerFieldRef,
}) => {
  return (
    <form id="role-form" onSubmit={onSubmit} className="space-y-8">
      <div className="space-y-5">
        <div>
          <label className="mb-2 block pl-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Nombre del Rol
          </label>
          <input
            ref={el => registerFieldRef?.('name', el)}
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={onChange}
            className={`w-full rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none shadow-sm transition-all placeholder:text-slate-300 ${
              errors.name
                ? 'border border-red-300 bg-red-50/70 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                : 'border border-slate-200 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
            }`}
            placeholder="Ej: Gerente de Ventas"
          />
          {errors.name && (
            <p className="mt-1.5 flex items-center gap-1.5 pl-1 text-[11px] font-medium text-red-500">
              <AlertCircle size={12} /> {errors.name}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block pl-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Descripcion
          </label>
          <textarea
            ref={el => registerFieldRef?.('description', el)}
            name="description"
            rows={2}
            value={formData.description}
            onChange={onChange}
            className={`w-full resize-none rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none shadow-sm transition-all placeholder:text-slate-300 ${
              errors.description
                ? 'border border-red-300 bg-red-50/70 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                : 'border border-slate-200 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
            }`}
            placeholder="Que funciones tendra este rol?"
          />
          {errors.description && (
            <p className="mt-1.5 flex items-center gap-1.5 pl-1 text-[11px] font-medium text-red-500">
              <AlertCircle size={12} /> {errors.description}
            </p>
          )}
        </div>
      </div>

      <div className="h-px w-full bg-slate-100" />

      <div>
        <div className="mb-4 flex items-center justify-between px-1">
          <h4 className="text-xs font-serif font-bold uppercase tracking-widest text-slate-700">
            Acceso a Modulos
          </h4>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-400">
            {formData.permissions.length} Permitidos
          </span>
        </div>

        {loadingPermissions ? (
          <div className="flex items-center justify-center gap-2 py-10 text-xs font-bold uppercase tracking-widest text-slate-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-primary-500" />
            Cargando permisos...
          </div>
        ) : (
          <div
            ref={el => registerFieldRef?.('permissions', el)}
            className={`grid grid-cols-1 gap-4 rounded-2xl transition-all md:grid-cols-2 ${
              errors.permissions ? 'ring-2 ring-red-100' : ''
            }`}
          >
            {AVAILABLE_MODULES.map(module => {
              const isAllowed = formData.permissions.includes(module.id);
              const Icon = module.icon ?? BarChart3;

              return (
                <div
                  key={module.id}
                  onClick={() => onTogglePermission(module.id)}
                  className={`relative flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all ${
                    isAllowed
                      ? 'border-emerald-500 bg-white shadow-md shadow-emerald-900/5'
                      : errors.permissions
                      ? 'border-red-200 bg-red-50/40 hover:border-red-300'
                      : 'border-transparent bg-slate-50 opacity-80 hover:border-slate-200 hover:bg-white hover:opacity-100'
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
                      isAllowed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    <Icon size={20} />
                  </div>

                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <h5 className={`text-sm font-bold ${isAllowed ? 'text-slate-800' : 'text-slate-500'}`}>
                        {module.label}
                      </h5>
                      <div
                        className={`relative h-5 w-10 rounded-full transition-colors duration-300 ${
                          isAllowed ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`absolute left-1 top-1 h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                            isAllowed ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-400">{module.description}</p>
                  </div>

                  {isAllowed && (
                    <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-sm">
                      <Check size={10} className="text-white" strokeWidth={4} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {errors.permissions && (
          <p className="mt-2 flex items-center gap-1.5 pl-1 text-[11px] font-medium text-red-500">
            <AlertCircle size={12} /> {errors.permissions}
          </p>
        )}
      </div>
    </form>
  );
};
