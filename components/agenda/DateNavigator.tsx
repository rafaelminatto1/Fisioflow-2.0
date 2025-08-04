import { useState } from 'react';
import { format, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, startOfWeek, startOfMonth, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, Home } from 'lucide-react';

export type ViewMode = 'day' | 'week' | 'month';

interface DateNavigatorProps {
  currentDate: Date;
  viewMode: ViewMode;
  onDateChange: (date: Date) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onTodayClick: () => void;
}

const DateNavigator = ({
  currentDate,
  viewMode,
  onDateChange,
  onViewModeChange,
  onTodayClick
}: DateNavigatorProps) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(format(currentDate, 'yyyy-MM-dd'));

  const handlePrevious = () => {
    let newDate = currentDate;
    switch (viewMode) {
      case 'day':
        newDate = subDays(currentDate, 1);
        break;
      case 'week':
        newDate = subWeeks(currentDate, 1);
        break;
      case 'month':
        newDate = subMonths(currentDate, 1);
        break;
    }
    onDateChange(newDate);
  };

  const handleNext = () => {
    let newDate = currentDate;
    switch (viewMode) {
      case 'day':
        newDate = addDays(currentDate, 1);
        break;
      case 'week':
        newDate = addWeeks(currentDate, 1);
        break;
      case 'month':
        newDate = addMonths(currentDate, 1);
        break;
    }
    onDateChange(newDate);
  };

  const handleDatePickerSubmit = () => {
    const selectedDate = new Date(tempDate);
    if (!isNaN(selectedDate.getTime())) {
      onDateChange(selectedDate);
    }
    setShowDatePicker(false);
  };

  const getDateRangeText = () => {
    switch (viewMode) {
      case 'day':
        return format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
        const weekEnd = addDays(weekStart, 6);
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${format(weekStart, 'dd', { locale: ptBR })} - ${format(weekEnd, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
        } else {
          return `${format(weekStart, "dd 'de' MMM", { locale: ptBR })} - ${format(weekEnd, "dd 'de' MMM 'de' yyyy", { locale: ptBR })}`;
        }
      case 'month':
        return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
      default:
        return '';
    }
  };

  const isCurrentDateToday = isToday(currentDate);

  return (
    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevious}
            className="agenda-button agenda-button-secondary p-2 hover:scale-105 transition-transform"
            title="Período anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleNext}
            className="agenda-button agenda-button-secondary p-2 hover:scale-105 transition-transform"
            title="Próximo período"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Today button */}
        <button
          onClick={onTodayClick}
          className={`
            agenda-button flex items-center gap-2 px-3 py-2 transition-all duration-200
            ${isCurrentDateToday ? 'agenda-button-primary' : 'agenda-button-secondary'}
            hover:scale-105
          `}
          title="Ir para hoje"
        >
          <Home className="w-4 h-4" />
          <span className="font-medium">Hoje</span>
        </button>

        {/* Date range display with picker */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            title="Selecionar data específica"
          >
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-lg font-semibold text-gray-900 capitalize">
              {getDateRangeText()}
            </span>
          </button>

          {/* Date picker dropdown */}
          {showDatePicker && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-[250px] fade-in">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Selecionar data:
                </label>
                <input
                  type="date"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDatePickerSubmit}
                    className="agenda-button agenda-button-primary flex-1"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="agenda-button agenda-button-secondary flex-1"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View mode selector */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        {[
          { mode: 'day' as ViewMode, label: 'Dia' },
          { mode: 'week' as ViewMode, label: 'Semana' },
          { mode: 'month' as ViewMode, label: 'Mês' }
        ].map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => onViewModeChange(mode)}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
              ${viewMode === mode
                ? 'bg-white text-blue-600 shadow-sm scale-105'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Click outside handler for date picker */}
      {showDatePicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDatePicker(false)}
        />
      )}
    </div>
  );
};

export default DateNavigator;