import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  icon: LucideIcon | React.ElementType;
  onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  tooltip?: string;
  variant?: 'default' | 'danger' | 'success' | 'warning' | 'info';
  size?: number;
  className?: string;
  disabled?: boolean;
  active?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ 
  icon: Icon, 
  onClick, 
  tooltip, 
  variant = 'default', 
  size = 14,
  className = '',
  disabled = false,
  active = false
}) => {
  const variants = {
    default: active 
      ? 'bg-red-50 text-red-600 ring-2 ring-red-100 shadow-sm shadow-red-200/50' 
      : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600',
    danger:  'bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700',
    success: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700',
    warning: 'bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700',
    info:    'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700',
  };

  return (
    <button
      onClick={(e) => !disabled && onClick && onClick(e)}
      title={tooltip}
      type="button"
      disabled={disabled}
      className={`
        w-8 h-8 rounded-lg flex items-center justify-center 
        transition-all duration-300 transform 
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95 hover:-translate-y-0.5'}
        ${variants[variant]}
        ${className}
      `}
    >
      <Icon size={size} strokeWidth={2.5} />
    </button>
  );
};
