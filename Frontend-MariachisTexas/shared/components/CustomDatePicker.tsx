
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface CustomDatePickerProps {
  value: string;
  onChange: (name: string, value: string) => void;
  name: string;
  label?: string;
  required?: boolean;
  minDate?: string;
  className?: string;
}

export const CustomDatePicker = React.forwardRef<HTMLDivElement, CustomDatePickerProps>(
  ({ value, onChange, name, label, required, minDate, className }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [navDate, setNavDate] = useState(value ? new Date(value + 'T00:00:00') : new Date());
    const internalRef = useRef<HTMLDivElement>(null);

    // Merge forwarded ref with internal ref
    React.useImperativeHandle(ref, () => internalRef.current!);

    useEffect(() => {
      if (value) {
          setNavDate(new Date(value + 'T00:00:00'));
      }
    }, [value]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (internalRef.current && !internalRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
    const days = ["D", "L", "M", "M", "J", "V", "S"];

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const handlePrevMonth = (e: React.MouseEvent) => {
      e.preventDefault();
      setNavDate(new Date(navDate.getFullYear(), navDate.getMonth() - 1, 1));
    };

    const handleNextMonth = (e: React.MouseEvent) => {
      e.preventDefault();
      setNavDate(new Date(navDate.getFullYear(), navDate.getMonth() + 1, 1));
    };

    const handleDayClick = (day: number) => {
      const month = (navDate.getMonth() + 1).toString().padStart(2, '0');
      const dayStr = day.toString().padStart(2, '0');
      const dateStr = `${navDate.getFullYear()}-${month}-${dayStr}`;
      onChange(name, dateStr);
      setIsOpen(false);
    };

    const renderCalendarDays = () => {
      const totalDays = getDaysInMonth(navDate.getFullYear(), navDate.getMonth());
      const firstDay = getFirstDayOfMonth(navDate.getFullYear(), navDate.getMonth()); 
      const blanks = Array(firstDay).fill(null);
      const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
      
      const allCells = [...blanks, ...daysArray];

      return (
        <div className="grid grid-cols-7 gap-0.5 mt-2">
          {allCells.map((day, index) => {
            if (day === null) return <div key={`blank-${index}`} className="h-5 w-5" />;
            
            const currentDayStr = `${navDate.getFullYear()}-${(navDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const isSelected = value === currentDayStr;
            const isDisabled = minDate ? currentDayStr < minDate : false;

            return (
              <button
                key={day}
                onClick={(e) => { 
                    e.preventDefault(); 
                    if (!isDisabled) handleDayClick(day); 
                }}
                disabled={isDisabled}
                className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-200 mx-auto
                  ${isSelected 
                    ? 'bg-red-600 text-white shadow-sm' 
                    : isDisabled
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
      );
    };

    return (
      <div className="relative w-full" ref={internalRef}>
        {label && <label className="label-form mb-1 block">{label} {required && <span className="text-red-500">*</span>}</label>}
        <div 
          className="relative group cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-slate-600 transition-colors" size={14} />
          <input
            type="text"
            readOnly
            name={name}
            value={value || ''}
            placeholder="YYYY-MM-DD"
            className={className || "input-form pl-9 cursor-pointer text-xs font-bold text-slate-700"}
          />
        </div>

        {isOpen && (
          // Width reduced to 185px to fit in compact columns
          <div className="absolute top-full right-0 mt-1 p-2 bg-white rounded-xl shadow-2xl border border-slate-200 z-[60] w-[185px] animate-fade-in-up ring-1 ring-black/5">
            {/* Header */}
            <div className="flex items-center justify-between mb-1 bg-[#0f172a] rounded-lg p-1.5 text-white shadow-md">
              <button onClick={handlePrevMonth} className="p-0.5 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft size={12} /></button>
              <span className="text-[9px] font-serif font-bold tracking-widest uppercase">
                {months[navDate.getMonth()]} {navDate.getFullYear()}
              </span>
              <button onClick={handleNextMonth} className="p-0.5 hover:bg-white/10 rounded-full transition-colors"><ChevronRight size={12} /></button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 gap-0.5 text-center mb-1 border-b border-slate-100 pb-1">
              {days.map((d, i) => (
                <span key={i} className="text-[8px] font-bold text-slate-400">{d}</span>
              ))}
            </div>

            {/* Calendar Grid */}
            {renderCalendarDays()}
          </div>
        )}
        <style>{`
          .label-form {
              display: block;
              font-size: 9px;
              font-weight: 700;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 2px;
              padding-left: 2px;
          }
          .input-form {
              width: 100%;
              padding: 8px 10px;
              border-radius: 8px;
              background-color: white;
              border: 1px solid #e2e8f0;
              color: #334155;
              font-size: 12px;
              outline: none;
              transition: all 0.2s;
          }
          .input-form:focus {
              border-color: #cbd5e1;
              box-shadow: 0 0 0 2px rgba(226, 232, 240, 0.5);
          }
        `}</style>
      </div>
    );
  }
);
