import React from 'react';
import { Appointment, Therapist, AppointmentStatus } from '../types';
import { Repeat } from 'lucide-react';

interface AppointmentCardProps {
  appointment: Appointment;
  therapists: Therapist[];
  onSelect: () => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, therapists, onSelect }) => {
  const startHour = appointment.startTime.getHours();
  const startMinutes = appointment.startTime.getMinutes();
  const endHour = appointment.endTime.getHours();
  const endMinutes = appointment.endTime.getMinutes();

  const duration = (endHour * 60 + endMinutes) - (startHour * 60 + startMinutes);
  const top = ((startHour - 8) * 60 + startMinutes);
  const height = duration;

  const therapist = therapists.find(t => t.id === appointment.therapistId);
  const color = therapist?.color || 'slate';

  const statusClasses = {
    [AppointmentStatus.Scheduled]: `bg-${color}-100 border-${color}-500 text-${color}-800 hover:bg-${color}-200`,
    [AppointmentStatus.Completed]: 'bg-slate-100 border-slate-400 text-slate-600 hover:bg-slate-200',
    [AppointmentStatus.Canceled]: 'bg-red-100 border-red-400 text-red-700 line-through hover:bg-red-200',
    [AppointmentStatus.NoShow]: 'bg-yellow-100 border-yellow-500 text-yellow-800 hover:bg-yellow-200',
  };

  // This is a TailwindCSS JIT compiler limitation workaround.
  // The full class names must be present in the source code.
  // bg-sky-100 border-sky-500 text-sky-800 hover:bg-sky-200
  // bg-indigo-100 border-indigo-500 text-indigo-800 hover:bg-indigo-200
  // bg-slate-100 border-slate-500 text-slate-800 hover:bg-slate-200

  return (
    <div
      onClick={onSelect}
      className={`absolute left-2 right-2 p-2 rounded-lg border-l-4 text-xs z-10 cursor-pointer transition-colors overflow-hidden ${statusClasses[appointment.status]}`}
      style={{ top: `${top}px`, height: `${height}px`, minHeight: '30px' }}
      title={`${appointment.title}\nPaciente: ${appointment.patientName}\nTipo: ${appointment.type}`}
    >
      <div className="flex justify-between items-start">
        <p className="font-bold truncate">{appointment.patientName}</p>
        {appointment.seriesId && 
            <span className="flex-shrink-0" title="Consulta Recorrente">
                <Repeat className="w-3 h-3" />
            </span>
        }
      </div>
      <p className="truncate text-xs">{appointment.type}</p>
      <p className="truncate">{appointment.title}</p>
    </div>
  );
};

export default AppointmentCard;