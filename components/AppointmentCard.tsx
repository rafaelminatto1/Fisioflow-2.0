import { Appointment, Therapist, AppointmentStatus } from '../types';
import { Repeat } from 'lucide-react';

interface AppointmentCardProps {
  appointment: Appointment;
  therapists: Therapist[];
  onSelect: () => void;
}

const AppointmentCard = ({ appointment, therapists, onSelect }: AppointmentCardProps) => {
  const startHour = appointment.startTime.getHours();
  const startMinutes = appointment.startTime.getMinutes();
  const endHour = appointment.endTime.getHours();
  const endMinutes = appointment.endTime.getMinutes();

  const duration = (endHour * 60 + endMinutes) - (startHour * 60 + startMinutes);
  
  // Responsive cell height based on screen size
  const getCellHeight = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640 ? 48 : 64;
    }
    return 64; // Default for SSR
  };
  
  const cellHeight = getCellHeight();
  const top = ((startHour - 7) * cellHeight) + (startMinutes * cellHeight / 60);
  const height = (duration * cellHeight) / 60;

  const therapist = therapists.find(t => t.id === appointment.therapistId);
  const color = therapist?.color || 'slate';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const statusClasses = {
    [AppointmentStatus.Scheduled]: {
      bg: `bg-${color}-100`,
      border: `border-l-4 border-${color}-500`,
      text: `text-${color}-800`,
      hover: `hover:bg-${color}-200`,
      shadow: 'shadow-sm hover:shadow-md'
    },
    [AppointmentStatus.Completed]: {
      bg: 'bg-green-50',
      border: 'border-l-4 border-green-500',
      text: 'text-green-700',
      hover: 'hover:bg-green-100',
      shadow: 'shadow-sm hover:shadow-md'
    },
    [AppointmentStatus.Canceled]: {
      bg: 'bg-red-50',
      border: 'border-l-4 border-red-400',
      text: 'text-red-600 line-through',
      hover: 'hover:bg-red-100',
      shadow: 'shadow-sm hover:shadow-md'
    },
    [AppointmentStatus.NoShow]: {
      bg: 'bg-orange-50',
      border: 'border-l-4 border-orange-400',
      text: 'text-orange-700',
      hover: 'hover:bg-orange-100',
      shadow: 'shadow-sm hover:shadow-md'
    },
  };

  const statusStyle = statusClasses[appointment.status];

  // This is a TailwindCSS JIT compiler limitation workaround.
  // The full class names must be present in the source code.
  // bg-sky-100 border-sky-500 text-sky-800 hover:bg-sky-200
  // bg-indigo-100 border-indigo-500 text-indigo-800 hover:bg-indigo-200
  // bg-slate-100 border-slate-500 text-slate-800 hover:bg-slate-200

  return (
    <div
      onClick={onSelect}
      className={`absolute left-1 right-1 p-2 sm:p-3 rounded-lg cursor-pointer transition-all duration-200 overflow-hidden z-10 
        ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text} ${statusStyle.hover} ${statusStyle.shadow}`}
      style={{ 
        top: `${top}px`, 
        height: `${Math.max(height, cellHeight * 0.8)}px`,
        minHeight: `${cellHeight * 0.8}px`
      }}
      title={`${appointment.title}\nPaciente: ${appointment.patientName}\nTipo: ${appointment.type}\nHorário: ${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}`}
    >
      <div className="flex justify-between items-start mb-1">
        <p className="font-semibold text-xs sm:text-sm truncate flex-1 pr-1 sm:pr-2">
          {appointment.patientName}
        </p>
        {appointment.seriesId && (
          <span className="flex-shrink-0 p-0.5 sm:p-1 rounded-full bg-white/20" title="Consulta Recorrente">
            <Repeat className="w-2 h-2 sm:w-3 sm:h-3" />
          </span>
        )}
      </div>
      
      <div className="space-y-0.5 sm:space-y-1">
        <p className="text-xs font-medium opacity-75 truncate">
          {appointment.type}
        </p>
        
        <p className="text-xs opacity-60 truncate">
          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
        </p>
        
        {height > (cellHeight * 1.2) && appointment.title && (
          <p className="text-xs opacity-75 truncate">
            {appointment.title}
          </p>
        )}
        
        {appointment.value && height > (cellHeight * 1.8) && (
          <p className="text-xs font-medium opacity-80">
            R$ {appointment.value.toFixed(2)}
          </p>
        )}
      </div>
      
      {/* Status indicator */}
      <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
          appointment.status === AppointmentStatus.Scheduled ? `bg-${color}-500` :
          appointment.status === AppointmentStatus.Completed ? 'bg-green-500' :
          appointment.status === AppointmentStatus.Canceled ? 'bg-red-400' :
          'bg-orange-400'
        }`}></div>
      </div>
    </div>
  );
};

export default AppointmentCard;