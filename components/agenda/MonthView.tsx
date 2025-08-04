import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Appointment, AppointmentType } from '@/types';

interface MonthViewProps {
  appointments: Appointment[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onAppointmentSelect: (appointment: Appointment) => void;
  onCreateAppointment: (date: Date) => void;
}

const MonthView = ({
  appointments,
  selectedDate,
  onDateSelect,
  onAppointmentSelect,
  onCreateAppointment
}: MonthViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = monthStart;
  const endDate = monthEnd;

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {};
    appointments.forEach(appointment => {
      const dateKey = format(appointment.startTime, 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(appointment);
    });
    return grouped;
  }, [appointments]);

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const getAppointmentIndicator = (appointment: Appointment) => {
    const colors = {
      [AppointmentType.Evaluation]: 'bg-green-500',
      [AppointmentType.Session]: 'bg-blue-500',
      [AppointmentType.Return]: 'bg-purple-500',
      [AppointmentType.Group]: 'bg-red-500',
    };
    
    return colors[appointment.type] || 'bg-blue-500';
  };

  const renderDayCell = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayAppointments = appointmentsByDate[dateKey] || [];
    const isCurrentMonth = isSameMonth(day, currentMonth);
    const isSelected = isSameDay(day, selectedDate);
    const isTodayDate = isToday(day);

    const maxVisibleAppointments = 3;
    const visibleAppointments = dayAppointments.slice(0, maxVisibleAppointments);
    const hiddenCount = Math.max(0, dayAppointments.length - maxVisibleAppointments);

    return (
      <div
        key={day.toISOString()}
        className={`
          relative min-h-[120px] p-2 border border-gray-200 cursor-pointer
          transition-all duration-200 hover:bg-gray-50
          ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
          ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
          ${isTodayDate ? 'ring-2 ring-indigo-400 bg-indigo-50' : ''}
        `}
        onClick={() => onDateSelect(day)}
      >
        {/* Date number */}
        <div className="flex justify-between items-start mb-2">
          <span className={`
            text-sm font-medium
            ${isTodayDate ? 'text-indigo-700 font-bold' : ''}
            ${isSelected ? 'text-blue-700 font-bold' : ''}
            ${!isCurrentMonth ? 'opacity-50' : ''}
          `}>
            {format(day, 'd')}
          </span>
          
          {/* Add appointment button (visible on hover) */}
          {isCurrentMonth && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateAppointment(day);
              }}
              className="opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-blue-100"
              title="Criar agendamento"
            >
              <Plus className="w-3 h-3 text-blue-600" />
            </button>
          )}
        </div>

        {/* Appointment indicators */}
        <div className="space-y-1">
          {visibleAppointments.map((appointment, index) => (
            <div
              key={appointment.id}
              onClick={(e) => {
                e.stopPropagation();
                onAppointmentSelect(appointment);
              }}
              className={`
                px-2 py-1 rounded text-xs text-white truncate cursor-pointer
                transition-all duration-150 hover:shadow-md transform hover:-translate-y-0.5
                ${getAppointmentIndicator(appointment)}
              `}
              title={`${appointment.patientName} - ${format(appointment.startTime, 'HH:mm')} - ${appointment.type}`}
            >
              <div className="flex items-center gap-1">
                <span className="">{format(appointment.startTime, 'HH:mm')}</span>
                <span className="truncate">{appointment.patientName}</span>
              </div>
            </div>
          ))}

          {/* Show "+X more" indicator if there are hidden appointments */}
          {hiddenCount > 0 && (
            <div className="px-2 py-1 bg-gray-400 text-white text-xs rounded truncate">
              +{hiddenCount} mais
            </div>
          )}
        </div>

        {/* Appointment density indicator */}
        {dayAppointments.length > 0 && (
          <div className="absolute bottom-1 right-1 flex gap-1">
            {dayAppointments.length >= 5 && (
              <div className="w-2 h-2 rounded-full bg-red-400 opacity-70" title="Dia muito ocupado" />
            )}
            {dayAppointments.length >= 3 && dayAppointments.length < 5 && (
              <div className="w-2 h-2 rounded-full bg-yellow-400 opacity-70" title="Dia ocupado" />
            )}
            {dayAppointments.length > 0 && dayAppointments.length < 3 && (
              <div className="w-2 h-2 rounded-full bg-green-400 opacity-70" title="Disponibilidade boa" />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="agenda-card">
      {/* Month navigation header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreviousMonth}
            className="agenda-button agenda-button-secondary p-2"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="agenda-button agenda-button-secondary px-3 py-2 text-sm"
            title="Ir para hoje"
          >
            Hoje
          </button>
          
          <button
            onClick={handleNextMonth}
            className="agenda-button agenda-button-secondary p-2"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0 mb-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 border-b">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden group">
        {days.map(renderDayCell)}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Avaliação</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Sessão</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded"></div>
          <span>Retorno</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Grupo</span>
        </div>
      </div>
    </div>
  );
};

export default MonthView;