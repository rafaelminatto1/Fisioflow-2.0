import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Home } from 'lucide-react';

interface DateNavigatorProps {
  currentDate: Date;
  viewMode: 'day' | 'week' | 'month';
  onDateChange: (amount: number) => void;
  onDateSet: (date: Date) => void;
  onTodayClick: () => void;
  className?: string;
}

const DateNavigator: React.FC<DateNavigatorProps> = ({
  currentDate,
  viewMode,
  onDateChange,
  onDateSet,
  onTodayClick,
  className = ''
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(currentDate);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update temp date when current date changes
  useEffect(() => {
    setTempDate(currentDate);
  }, [currentDate]);

  const getHeaderTitle = () => {
    const options: Intl.DateTimeFormatOptions = {};
    
    switch (viewMode) {
      case 'day':
        return currentDate.toLocaleDateString('pt-BR', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });
      case 'week':
        // Get start of week (Monday)
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 4); // Friday
        
        if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
          return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} de ${startOfWeek.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`;
        } else {
          return `${startOfWeek.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        }
      case 'month':
        return currentDate.toLocaleDateString('pt-BR', { 
          month: 'long', 
          year: 'numeric' 
        });
      default:
        return '';
    }
  };

  const handleDatePickerSubmit = () => {
    onDateSet(tempDate);
    setShowDatePicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        onDateChange(-1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        onDateChange(1);
        break;
      case 'Home':
        e.preventDefault();
        onTodayClick();
        break;
      case 'Escape':
        if (showDatePicker) {
          setShowDatePicker(false);
        }
        break;
    }
  };

  const isToday = () => {
    const today = new Date();
    
    switch (viewMode) {
      case 'day':
        return currentDate.toDateString() === today.toDateString();
      case 'week':
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        return today >= startOfWeek && today <= endOfWeek;
      case 'month':
        return currentDate.getMonth() === today.getMonth() && 
               currentDate.getFullYear() === today.getFullYear();
      default:
        return false;
    }
  };

  return (
    <div className={`relative ${className}`} onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="flex items-center rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {/* Previous button */}
        <button
          onClick={() => onDateChange(-1)}
          className="p-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 group"
          title={`${viewMode === 'day' ? 'Dia anterior' : viewMode === 'week' ? 'Semana anterior' : 'Mês anterior'} (←)`}
        >
          <ChevronLeft className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
        </button>

        {/* Date display / picker trigger */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="px-4 py-3 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 min-w-0 flex-1 text-center group"
            title="Clique para escolher uma data específica"
          >
            <div className="flex items-center gap-2 justify-center">
              <Calendar className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              <span className="truncate max-w-xs">
                {getHeaderTitle()}
              </span>
            </div>
          </button>

          {/* Date picker dropdown */}
          {showDatePicker && (
            <div
              ref={datePickerRef}
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 min-w-[280px]"
            >
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">
                    Navegar para data específica
                  </h3>
                </div>

                {/* Date input */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-600">
                    Selecionar data
                  </label>
                  <input
                    ref={inputRef}
                    type="date"
                    value={tempDate.toISOString().split('T')[0]}
                    onChange={(e) => setTempDate(new Date(e.target.value + 'T12:00:00'))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Quick date shortcuts */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const today = new Date();
                      setTempDate(today);
                      onDateSet(today);
                      setShowDatePicker(false);
                    }}
                    className="px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setTempDate(tomorrow);
                      onDateSet(tomorrow);
                      setShowDatePicker(false);
                    }}
                    className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                  >
                    Amanhã
                  </button>
                  <button
                    onClick={() => {
                      const nextWeek = new Date();
                      nextWeek.setDate(nextWeek.getDate() + 7);
                      setTempDate(nextWeek);
                      onDateSet(nextWeek);
                      setShowDatePicker(false);
                    }}
                    className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                  >
                    Próxima semana
                  </button>
                  <button
                    onClick={() => {
                      const nextMonth = new Date();
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      setTempDate(nextMonth);
                      onDateSet(nextMonth);
                      setShowDatePicker(false);
                    }}
                    className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                  >
                    Próximo mês
                  </button>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="flex-1 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDatePickerSubmit}
                    className="flex-1 px-3 py-2 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors duration-200"
                  >
                    Ir para data
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Next button */}
        <button
          onClick={() => onDateChange(1)}
          className="p-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 group"
          title={`${viewMode === 'day' ? 'Próximo dia' : viewMode === 'week' ? 'Próxima semana' : 'Próximo mês'} (→)`}
        >
          <ChevronRight className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
        </button>
      </div>

      {/* Today button */}
      <button
        onClick={onTodayClick}
        disabled={isToday()}
        className={`
          ml-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
          ${isToday() 
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
            : 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-105 shadow-sm hover:shadow-md'
          }
        `}
        title="Voltar para hoje (Home)"
      >
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">Hoje</span>
        </div>
      </button>

      {/* Keyboard shortcuts hint */}
      <div className="absolute -bottom-6 left-0 text-xs text-slate-400 hidden lg:block">
        ← → para navegar • Home para hoje • Esc para fechar
      </div>
    </div>
  );
};

export default DateNavigator;