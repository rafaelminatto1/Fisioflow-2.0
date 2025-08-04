import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  DollarSign, 
  MessageSquare, 
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Appointment, Patient, Therapist, AppointmentStatus } from '@/types';

interface AppointmentTooltipProps {
  appointment: Appointment;
  patient: Patient;
  therapist: Therapist;
  position: { x: number; y: number };
  isVisible: boolean;
  onClose: () => void;
  onQuickAction?: (action: string) => void;
}

const AppointmentTooltip = ({
  appointment,
  patient,
  therapist,
  position,
  isVisible,
  onClose,
  onQuickAction
}: AppointmentTooltipProps) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [showDelay, setShowDelay] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setShowDelay(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowDelay(false);
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && showDelay && tooltipRef.current) {
      const tooltip = tooltipRef.current;
      const rect = tooltip.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      let newX = position.x + 10; // Offset from cursor
      let newY = position.y + 10;

      // Adjust horizontal position if tooltip goes off screen
      if (position.x + rect.width + 20 > viewport.width) {
        newX = position.x - rect.width - 10;
      }

      // Adjust vertical position if tooltip goes off screen
      if (position.y + rect.height + 20 > viewport.height) {
        newY = position.y - rect.height - 10;
      }

      // Ensure tooltip stays within viewport
      newX = Math.max(10, Math.min(newX, viewport.width - rect.width - 10));
      newY = Math.max(10, Math.min(newY, viewport.height - rect.height - 10));

      setAdjustedPosition({ x: newX, y: newY });
    }
  }, [isVisible, showDelay, position]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (tooltipRef.current && isVisible) {
        const rect = tooltipRef.current.getBoundingClientRect();
        const margin = 10;
        
        const isOutside = (
          event.clientX < rect.left - margin ||
          event.clientX > rect.right + margin ||
          event.clientY < rect.top - margin ||
          event.clientY > rect.bottom + margin
        );

        if (isOutside) {
          onClose();
        }
      }
    };

    if (isVisible && showDelay) {
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isVisible, showDelay, onClose]);

  if (!isVisible || !showDelay) return null;

  const getStatusInfo = () => {
    switch (appointment.status) {
      case AppointmentStatus.Scheduled:
        return { icon: <Clock className="w-4 h-4 text-blue-500" />, label: 'Agendado', color: 'text-blue-600' };
      case AppointmentStatus.Confirmed:
        return { icon: <CheckCircle className="w-4 h-4 text-green-500" />, label: 'Confirmado', color: 'text-green-600' };
      case AppointmentStatus.Completed:
        return { icon: <CheckCircle className="w-4 h-4 text-gray-500" />, label: 'Concluído', color: 'text-gray-600' };
      case AppointmentStatus.Canceled:
        return { icon: <XCircle className="w-4 h-4 text-red-500" />, label: 'Cancelado', color: 'text-red-600' };
      case AppointmentStatus.NoShow:
        return { icon: <AlertCircle className="w-4 h-4 text-orange-500" />, label: 'Faltou', color: 'text-orange-600' };
    }
  };

  const statusInfo = getStatusInfo();

  const formatDuration = () => {
    const minutes = (appointment.endTime.getTime() - appointment.startTime.getTime()) / (1000 * 60);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}min` : ''}`;
    }
    return `${mins}min`;
  };

  return (
    <div
      ref={tooltipRef}
      className="fixed z-[300] bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-w-sm fade-in"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">
            {appointment.title || appointment.type}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {statusInfo.icon}
            <span className={`text-sm font-medium ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">
            {format(appointment.startTime, 'dd/MM/yyyy', { locale: ptBR })}
          </div>
        </div>
      </div>

      {/* Time Information */}
      <div className="flex items-center gap-3 mb-3 p-2 bg-gray-50 rounded-lg">
        <Clock className="w-4 h-4 text-gray-500" />
        <div>
          <div className="font-medium text-gray-900">
            {format(appointment.startTime, 'HH:mm', { locale: ptBR })} - {format(appointment.endTime, 'HH:mm', { locale: ptBR })}
          </div>
          <div className="text-sm text-gray-500">
            Duração: {formatDuration()}
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-900">{patient.name}</span>
        </div>
        
        {patient.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-600">{patient.phone}</span>
          </div>
        )}
        
        {patient.email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-600">{patient.email}</span>
          </div>
        )}
      </div>

      {/* Therapist Information */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
          <User className="w-3 h-3 text-blue-600" />
        </div>
        <span className="text-sm text-gray-600">
          Fisioterapeuta: <span className="font-medium">{therapist.name}</span>
        </span>
      </div>

      {/* Location */}
      {appointment.location && (
        <div className="flex items-center gap-2 mb-3 text-sm">
          <MapPin className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-600">{appointment.location}</span>
        </div>
      )}

      {/* Value and Payment */}
      {appointment.value && (
        <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg mb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <span className="font-medium text-green-900">
              R$ {appointment.value.toFixed(2)}
            </span>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${
            appointment.paymentStatus === 'paid' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {appointment.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
          </span>
        </div>
      )}

      {/* Notes */}
      {appointment.notes && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Observações
            </span>
          </div>
          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
            {appointment.notes}
          </p>
        </div>
      )}

      {/* Recurrence Info */}
      {appointment.seriesId && (
        <div className="flex items-center gap-2 mb-3 text-sm">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-600">Consulta recorrente</span>
        </div>
      )}

      {/* Quick Actions */}
      {onQuickAction && appointment.status !== AppointmentStatus.Completed && (
        <div className="flex gap-2 pt-3 border-t border-gray-200">
          {appointment.status !== AppointmentStatus.Confirmed && (
            <button
              onClick={() => onQuickAction('confirm')}
              className="flex-1 px-3 py-1.5 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors"
            >
              Confirmar
            </button>
          )}
          
          {appointment.status !== AppointmentStatus.Completed && (
            <button
              onClick={() => onQuickAction('complete')}
              className="flex-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
            >
              Concluir
            </button>
          )}
          
          <button
            onClick={() => onQuickAction('edit')}
            className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
          >
            Editar
          </button>
        </div>
      )}
    </div>
  );
};

export default AppointmentTooltip;