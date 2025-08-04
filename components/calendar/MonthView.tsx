import React from 'react';
import { Appointment, Therapist } from '../../types';
import { ChevronLeft, ChevronRight, Plus, MoreHorizontal } from 'lucide-react';

interface MonthViewProps {
  currentDate: Date;
  appointments: Appointment[];
  therapists: Therapist[];
  onDateSelect: (date: Date) => void;
  onAppointmentSelect: (appointment: Appointment) => void;
  onDateChange: (amount: number) => void;
  onCreateAppointment: (date: Date) => void;
}

const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  appointments,
  therapists,
  onDateSelect,
  onAppointmentSelect,
  onDateChange,
  onCreateAppointment
}) => {
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startOfWeek = new Date(startOfMonth);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Start on Monday
  
  const endOfWeek = new Date(endOfMonth);
  endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()) + 1);
  
  const days = [];
  const currentDay = new Date(startOfWeek);
  
  while (currentDay <= endOfWeek) {
    days.push(new Date(currentDay));
    currentDay.setDate(currentDay.getDate() + 1);
  }

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt => 
      apt.startTime.toDateString() === date.toDateString()
    );
  };

  const getTherapistColor = (therapistId: string) => {
    const therapist = therapists.find(t => t.id === therapistId);
    return therapist?.color || 'slate';
  };

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const monthName = currentDate.toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });

  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
        <button
          onClick={() => onDateChange(-1)}
          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-white/70 rounded-lg transition-all duration-200 backdrop-blur-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-bold text-slate-800 capitalize">
          {monthName}
        </h2>
        
        <button
          onClick={() => onDateChange(1)}
          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-white/70 rounded-lg transition-all duration-200 backdrop-blur-sm"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-3 text-center text-sm font-semibold text-slate-600 border-r border-slate-200 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayAppointments = getAppointmentsForDay(day);
          const isCurrentMonthDay = isCurrentMonth(day);
          const isTodayDay = isToday(day);
          const maxVisibleAppointments = 3;
          const visibleAppointments = dayAppointments.slice(0, maxVisibleAppointments);
          const hiddenCount = Math.max(0, dayAppointments.length - maxVisibleAppointments);

          return (
            <div
              key={day.toISOString()}
              className={`
                min-h-[120px] p-2 border-r border-b border-slate-200 
                last:border-r-0 relative group cursor-pointer
                hover:bg-blue-50/50 transition-all duration-200
                ${!isCurrentMonthDay ? 'bg-slate-50 text-slate-400' : 'bg-white'}
                ${isTodayDay ? 'bg-blue-50 ring-2 ring-blue-200 ring-inset' : ''}
              `}
              onClick={() => onDateSelect(day)}
            >
              {/* Date number */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`
                    text-sm font-semibold
                    ${isTodayDay 
                      ? 'bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs' 
                      : isCurrentMonthDay 
                        ? 'text-slate-700' 
                        : 'text-slate-400'
                    }
                  `}
                >
                  {day.getDate()}
                </span>

                {/* Add appointment button (visible on hover) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateAppointment(day);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-blue-100 rounded-md"
                >
                  <Plus className="w-3 h-3 text-blue-500" />
                </button>
              </div>

              {/* Appointments */}
              <div className="space-y-1">
                {visibleAppointments.map((appointment) => {
                  const color = getTherapistColor(appointment.therapistId);
                  return (
                    <div
                      key={appointment.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentSelect(appointment);
                      }}
                      className={`
                        px-2 py-1 rounded-md text-xs cursor-pointer
                        transition-all duration-200 hover:scale-105
                        bg-${color}-100 text-${color}-800 hover:bg-${color}-200
                        border-l-2 border-${color}-400
                        truncate flex items-center gap-1
                      `}
                      title={`${appointment.patientName} - ${appointment.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full bg-${color}-500 flex-shrink-0`} />
                      <span className="truncate">
                        {appointment.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} {appointment.patientName}
                      </span>
                    </div>
                  );
                })}

                {/* More appointments indicator */}
                {hiddenCount > 0 && (
                  <div
                    className="px-2 py-1 rounded-md text-xs cursor-pointer bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors duration-200 flex items-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateSelect(day);
                    }}
                    title={`Ver mais ${hiddenCount} consulta${hiddenCount > 1 ? 's' : ''}`}
                  >
                    <MoreHorizontal className="w-3 h-3" />
                    <span>+{hiddenCount} mais</span>
                  </div>
                )}
              </div>

              {/* Appointment density indicator */}
              {dayAppointments.length > 0 && (
                <div className="absolute bottom-1 right-1 flex gap-0.5">
                  {Array.from({ length: Math.min(dayAppointments.length, 5) }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-1 rounded-full ${
                        dayAppointments.length >= 5 ? 'bg-red-400' :
                        dayAppointments.length >= 3 ? 'bg-orange-400' :
                        'bg-green-400'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Weekend indicator */}
              {(day.getDay() === 0 || day.getDay() === 6) && isCurrentMonthDay && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-slate-300 opacity-50" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span>1-2 consultas</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              <span>3-4 consultas</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span>5+ consultas</span>
            </div>
          </div>
          <div className="text-slate-500">
            {appointments.length} consultas este mês
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthView;