import React from 'react';
import { Appointment, Therapist } from '../../types';
import { Clock, Users, AlertTriangle, Coffee } from 'lucide-react';

interface TimeSlot {
  hour: number;
  minute: number;
  isBlocked?: boolean;
  blockReason?: 'lunch' | 'break' | 'unavailable';
  occupancy: number; // 0-100%
  appointments: Appointment[];
  conflicts: boolean;
}

interface AvailabilityIndicatorProps {
  date: Date;
  appointments: Appointment[];
  therapists: Therapist[];
  viewMode: 'day' | 'week';
  workingHours?: {
    start: number; // 7 for 7 AM
    end: number;   // 20 for 8 PM
  };
  breaks?: {
    lunch: { start: number; end: number }; // e.g., { start: 12, end: 13 }
    breaks: Array<{ start: number; end: number; reason: string }>;
  };
  showHeatmap?: boolean;
  showConflicts?: boolean;
  showBlockedTimes?: boolean;
}

const AvailabilityIndicator: React.FC<AvailabilityIndicatorProps> = ({
  date,
  appointments,
  therapists,
  viewMode,
  workingHours = { start: 7, end: 20 },
  breaks = { 
    lunch: { start: 12, end: 13 },
    breaks: [
      { start: 10, end: 10.25, reason: 'Pausa' },
      { start: 15, end: 15.25, reason: 'Pausa' }
    ]
  },
  showHeatmap = true,
  showConflicts = true,
  showBlockedTimes = true
}) => {
  const hours = Array.from(
    { length: workingHours.end - workingHours.start }, 
    (_, i) => i + workingHours.start
  );

  const isTimeBlocked = (hour: number): { blocked: boolean; reason?: string } => {
    // Check lunch break
    if (hour >= breaks.lunch.start && hour < breaks.lunch.end) {
      return { blocked: true, reason: 'Almoço' };
    }

    // Check other breaks
    for (const breakTime of breaks.breaks) {
      if (hour >= breakTime.start && hour < breakTime.end) {
        return { blocked: true, reason: breakTime.reason };
      }
    }

    return { blocked: false };
  };

  const getTimeSlotData = (hour: number): TimeSlot => {
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(date);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    // Get appointments in this hour slot
    const slotAppointments = appointments.filter(apt => {
      const aptStart = apt.startTime.getTime();
      const aptEnd = apt.endTime.getTime();
      const slotStartTime = slotStart.getTime();
      const slotEndTime = slotEnd.getTime();

      return (aptStart < slotEndTime && aptEnd > slotStartTime);
    });

    // Calculate occupancy based on appointment coverage
    let totalCoverage = 0;
    const uniqueTherapists = new Set<string>();

    slotAppointments.forEach(apt => {
      uniqueTherapists.add(apt.therapistId);
      const overlapStart = Math.max(apt.startTime.getTime(), slotStart.getTime());
      const overlapEnd = Math.min(apt.endTime.getTime(), slotEnd.getTime());
      const overlapDuration = overlapEnd - overlapStart;
      const hourDuration = 60 * 60 * 1000; // 1 hour in milliseconds
      totalCoverage += overlapDuration / hourDuration;
    });

    const maxCapacity = therapists.length;
    const occupancy = Math.min(100, (totalCoverage / maxCapacity) * 100);

    // Check for conflicts (multiple appointments at same time for same therapist)
    const conflicts = slotAppointments.some(apt1 => 
      slotAppointments.some(apt2 => 
        apt1.id !== apt2.id && 
        apt1.therapistId === apt2.therapistId &&
        apt1.startTime < apt2.endTime && 
        apt1.endTime > apt2.startTime
      )
    );

    const blockInfo = isTimeBlocked(hour);

    return {
      hour,
      minute: 0,
      isBlocked: blockInfo.blocked,
      blockReason: blockInfo.reason as any,
      occupancy,
      appointments: slotAppointments,
      conflicts
    };
  };

  const getOccupancyColor = (occupancy: number, hasConflicts: boolean = false) => {
    if (hasConflicts) return 'bg-red-400';

    if (occupancy >= 90) return 'bg-red-500';
    if (occupancy >= 70) return 'bg-orange-500';
    if (occupancy >= 50) return 'bg-yellow-500';
    if (occupancy >= 30) return 'bg-blue-400';
    if (occupancy > 0) return 'bg-green-400';
    return 'bg-slate-200';
  };

  const getOccupancyLabel = (occupancy: number) => {
    if (occupancy >= 90) return 'Lotado';
    if (occupancy >= 70) return 'Quase lotado';
    if (occupancy >= 50) return 'Ocupado';
    if (occupancy >= 30) return 'Moderado';
    if (occupancy > 0) return 'Disponível';
    return 'Livre';
  };

  const renderDayIndicators = () => {
    return (
      <div className="space-y-1">
        {hours.map(hour => {
          const slotData = getTimeSlotData(hour);
          const timeString = `${hour.toString().padStart(2, '0')}:00`;

          return (
            <div
              key={hour}
              className={`
                flex items-center gap-3 p-2 rounded-lg transition-all duration-200
                ${slotData.isBlocked ? 'bg-slate-100' : 'bg-white hover:bg-slate-50'}
                ${slotData.conflicts ? 'ring-2 ring-red-400 ring-opacity-50' : ''}
                border border-slate-200
              `}
            >
              {/* Time */}
              <div className="w-16 text-sm font-medium text-slate-600">
                {timeString}
              </div>

              {/* Visual indicator */}
              <div className="flex items-center gap-2 flex-1">
                {slotData.isBlocked ? (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Coffee className="w-4 h-4" />
                    <span className="text-sm">{slotData.blockReason}</span>
                  </div>
                ) : (
                  <>
                    {/* Occupancy bar */}
                    {showHeatmap && (
                      <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getOccupancyColor(slotData.occupancy, slotData.conflicts)}`}
                          style={{ width: `${slotData.occupancy}%` }}
                        />
                      </div>
                    )}

                    {/* Occupancy percentage */}
                    <div className="w-12 text-xs text-slate-600 text-right">
                      {Math.round(slotData.occupancy)}%
                    </div>

                    {/* Appointment count */}
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Users className="w-3 h-3" />
                      <span>{slotData.appointments.length}</span>
                    </div>

                    {/* Conflict indicator */}
                    {showConflicts && slotData.conflicts && (
                      <div className="flex items-center gap-1 text-red-500" title="Conflitos detectados">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Status label */}
              <div className="w-20 text-xs text-right">
                {slotData.isBlocked ? (
                  <span className="text-slate-500">Bloqueado</span>
                ) : (
                  <span
                    className={`
                      ${slotData.conflicts ? 'text-red-600 font-semibold' : 
                        slotData.occupancy >= 70 ? 'text-orange-600' :
                        slotData.occupancy >= 30 ? 'text-blue-600' :
                        'text-green-600'}
                    `}
                  >
                    {slotData.conflicts ? 'Conflito' : getOccupancyLabel(slotData.occupancy)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekHeatmap = () => {
    const weekDays = Array.from({ length: 5 }, (_, i) => {
      const day = new Date(date);
      day.setDate(day.getDate() - day.getDay() + 1 + i); // Monday to Friday
      return day;
    });

    return (
      <div className="space-y-4">
        {/* Heatmap grid */}
        <div className="grid grid-cols-6 gap-2">
          {/* Header */}
          <div className="text-xs font-medium text-slate-600 text-center">
            Hora
          </div>
          {weekDays.map(day => (
            <div key={day.toISOString()} className="text-xs font-medium text-slate-600 text-center">
              {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
              <br />
              {day.getDate()}
            </div>
          ))}

          {/* Heatmap cells */}
          {hours.map(hour => (
            <React.Fragment key={hour}>
              <div className="text-xs text-slate-600 text-center py-2">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDays.map(day => {
                const dayAppointments = appointments.filter(apt => 
                  apt.startTime.toDateString() === day.toDateString()
                );
                const slotData = getTimeSlotData(hour);
                
                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className={`
                      h-8 rounded-md border border-slate-200 transition-all duration-200 cursor-pointer
                      ${slotData.isBlocked ? 'bg-slate-100 opacity-50' : getOccupancyColor(slotData.occupancy, slotData.conflicts)}
                      hover:scale-105 hover:shadow-sm
                    `}
                    title={`${day.toLocaleDateString('pt-BR')}, ${hour}:00 - ${slotData.occupancy.toFixed(0)}% ocupado${slotData.conflicts ? ' (Conflitos!)' : ''}`}
                  >
                    {slotData.conflicts && (
                      <div className="w-full h-full flex items-center justify-center">
                        <AlertTriangle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-slate-200"></div>
            <span className="text-slate-600">Livre</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-400"></div>
            <span className="text-slate-600">Disponível</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-500"></div>
            <span className="text-slate-600">Ocupado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-500"></div>
            <span className="text-slate-600">Quase lotado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-slate-600">Lotado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-400 flex items-center justify-center">
              <AlertTriangle className="w-2 h-2 text-white" />
            </div>
            <span className="text-slate-600">Conflito</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          Indicador de Disponibilidade
        </h3>
        
        {/* Summary stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span className="text-slate-600">
              {hours.filter(h => {
                const slot = getTimeSlotData(h);
                return !slot.isBlocked && slot.occupancy < 50;
              }).length} livres
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span className="text-slate-600">
              {hours.filter(h => {
                const slot = getTimeSlotData(h);
                return !slot.isBlocked && slot.occupancy >= 70;
              }).length} ocupados
            </span>
          </div>
          {showConflicts && (
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-red-500" />
              <span className="text-red-600">
                {hours.filter(h => getTimeSlotData(h).conflicts).length} conflitos
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {viewMode === 'day' ? renderDayIndicators() : renderWeekHeatmap()}
    </div>
  );
};

export default AvailabilityIndicator;