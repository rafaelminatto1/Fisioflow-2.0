import { Appointment, Therapist, AppointmentStatus, AppointmentType } from '../types';
import { Repeat, Clock, User, CreditCard, CheckCircle, XCircle, AlertCircle, Circle, Users } from 'lucide-react';

interface AppointmentCardProps {
  appointment: Appointment;
  therapists: Therapist[];
  onSelect: () => void;
  isDragging?: boolean;
  isResizing?: boolean;
  showTooltip?: boolean;
}

const AppointmentCard = ({ 
  appointment, 
  therapists, 
  onSelect, 
  isDragging = false, 
  isResizing = false, 
  showTooltip = true 
}: AppointmentCardProps) => {
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

  const getAppointmentTypeIcon = () => {
    switch (appointment.type) {
      case AppointmentType.Evaluation: return <User className="w-3 h-3" />;
      case AppointmentType.Session: return <Clock className="w-3 h-3" />;
      case AppointmentType.Return: return <Repeat className="w-3 h-3" />;
      case AppointmentType.Group: return <Users className="w-3 h-3" />;
      default: return <Circle className="w-3 h-3" />;
    }
  };

  const getAppointmentTypeColor = () => {
    switch (appointment.type) {
      case AppointmentType.Evaluation: return 'var(--appointment-evaluation)';
      case AppointmentType.Session: return 'var(--appointment-session)';
      case AppointmentType.Return: return 'var(--appointment-return)';
      case AppointmentType.Group: return 'var(--appointment-group)';
      default: return 'var(--appointment-session)';
    }
  };

  const getStatusIcon = () => {
    switch (appointment.status) {
      case AppointmentStatus.Completed: return <CheckCircle className="w-3 h-3 text-green-500" />;
      case AppointmentStatus.Canceled: return <XCircle className="w-3 h-3 text-red-500" />;
      case AppointmentStatus.NoShow: return <AlertCircle className="w-3 h-3 text-orange-500" />;
      default: return <Circle className="w-3 h-3 text-blue-500" />;
    }
  };

  const statusClasses = {
    [AppointmentStatus.Scheduled]: {
      bg: `bg-${color}-50`,
      border: `border-l-4 border-${color}-400`,
      text: `text-${color}-900`,
      textSecondary: `text-${color}-700`,
      hover: `hover:bg-${color}-100 hover:shadow-lg`,
      shadow: isDragging ? 'shadow-2xl scale-105' : 'shadow-sm',
      accent: `bg-${color}-400`
    },
    [AppointmentStatus.Completed]: {
      bg: 'bg-green-50',
      border: 'border-l-4 border-green-400',
      text: 'text-green-900',
      textSecondary: 'text-green-700',
      hover: 'hover:bg-green-100 hover:shadow-lg',
      shadow: isDragging ? 'shadow-2xl scale-105' : 'shadow-sm',
      accent: 'bg-green-400'
    },
    [AppointmentStatus.Canceled]: {
      bg: 'bg-red-50',
      border: 'border-l-4 border-red-400',
      text: 'text-red-900 opacity-75',
      textSecondary: 'text-red-700 line-through',
      hover: 'hover:bg-red-100 hover:shadow-lg',
      shadow: isDragging ? 'shadow-2xl scale-105' : 'shadow-sm',
      accent: 'bg-red-400'
    },
    [AppointmentStatus.NoShow]: {
      bg: 'bg-orange-50',
      border: 'border-l-4 border-orange-400',
      text: 'text-orange-900',
      textSecondary: 'text-orange-700',
      hover: 'hover:bg-orange-100 hover:shadow-lg',
      shadow: isDragging ? 'shadow-2xl scale-105' : 'shadow-sm',
      accent: 'bg-orange-400'
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
      className={`
        absolute left-1 right-1 rounded-xl cursor-pointer overflow-hidden z-10
        transition-all duration-300 ease-out
        backdrop-blur-sm border border-white/20
        ${statusStyle.bg} ${statusStyle.border} ${statusStyle.hover} ${statusStyle.shadow}
        ${isDragging ? 'rotate-2 opacity-90' : ''}
        ${isResizing ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
        group
      `}
      style={{ 
        top: `${top}px`, 
        height: `${Math.max(height, cellHeight * 0.8)}px`,
        minHeight: `${cellHeight * 0.8}px`,
        transform: isDragging ? 'scale(1.02) rotate(1deg)' : undefined
      }}
      title={showTooltip ? `${appointment.title}\nPaciente: ${appointment.patientName}\nTipo: ${appointment.type}\nHorário: ${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}` : undefined}
    >
      {/* Colored accent strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusStyle.accent}`} />
      
      {/* Main content */}
      <div className="p-2 sm:p-3 h-full flex flex-col justify-between relative">
        {/* Header with patient name and indicators */}
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-1">
              {getAppointmentTypeIcon()}
              <p className={`font-semibold text-xs sm:text-sm truncate ${statusStyle.text}`}>
                {appointment.patientName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            {appointment.seriesId && (
              <span className="p-1 rounded-full bg-white/30 backdrop-blur-sm" title="Consulta Recorrente">
                <Repeat className="w-2.5 h-2.5 text-current opacity-70" />
              </span>
            )}
            {getStatusIcon()}
          </div>
        </div>
        
        {/* Appointment details */}
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 opacity-60" />
            <p className={`text-xs font-medium ${statusStyle.textSecondary} truncate`}>
              {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
            </p>
          </div>
          
          <p className={`text-xs ${statusStyle.textSecondary} opacity-80 truncate`}>
            {appointment.type}
          </p>
          
          {height > (cellHeight * 1.2) && appointment.title && (
            <p className={`text-xs ${statusStyle.textSecondary} opacity-75 truncate`}>
              {appointment.title}
            </p>
          )}
        </div>
        
        {/* Value and payment status */}
        {appointment.value && height > (cellHeight * 1.5) && (
          <div className="flex items-center justify-between mt-1 pt-1 border-t border-current/10">
            <div className="flex items-center gap-1">
              <CreditCard className="w-2.5 h-2.5 opacity-60" />
              <p className={`text-xs font-semibold ${statusStyle.text}`}>
                R$ {appointment.value.toFixed(2)}
              </p>
            </div>
            {appointment.paymentStatus === 'paid' && (
              <div className="w-2 h-2 rounded-full bg-green-400" title="Pago" />
            )}
          </div>
        )}
        
        {/* Hover overlay with enhanced actions */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
        
        {/* Resize handles (visible on hover) */}
        {!isDragging && (
          <>
            <div className="absolute top-0 left-0 right-0 h-1 cursor-n-resize opacity-0 group-hover:opacity-100 transition-opacity bg-blue-400/50 rounded-t-xl" />
            <div className="absolute bottom-0 left-0 right-0 h-1 cursor-s-resize opacity-0 group-hover:opacity-100 transition-opacity bg-blue-400/50 rounded-b-xl" />
          </>
        )}
      </div>
      
      {/* Quick action indicators on hover */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-white/70 backdrop-blur-sm" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/70 backdrop-blur-sm" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/70 backdrop-blur-sm" />
      </div>
    </div>
  );
};

export default AppointmentCard;