import { Appointment, RecurrenceRule } from '../../types';

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  conflictReason?: string;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflicts: Array<{
    type: 'therapist_busy' | 'patient_busy' | 'room_occupied' | 'outside_hours';
    appointment?: Appointment;
    message: string;
  }>;
  suggestions: Array<{
    start: Date;
    end: Date;
    reason: string;
  }>;
}

export interface WorkingHours {
  [key: string]: { // day of week (monday, tuesday, etc.)
    start: string; // HH:MM format
    end: string;
    breaks?: Array<{ start: string; end: string }>;
  };
}

export interface TherapistSchedule {
  therapistId: string;
  workingHours: WorkingHours;
  timeOffPeriods: Array<{
    start: Date;
    end: Date;
    reason: string;
  }>;
}

export class ConflictDetectionService {
  private defaultWorkingHours: WorkingHours = {
    monday: { start: '08:00', end: '18:00', breaks: [{ start: '12:00', end: '13:00' }] },
    tuesday: { start: '08:00', end: '18:00', breaks: [{ start: '12:00', end: '13:00' }] },
    wednesday: { start: '08:00', end: '18:00', breaks: [{ start: '12:00', end: '13:00' }] },
    thursday: { start: '08:00', end: '18:00', breaks: [{ start: '12:00', end: '13:00' }] },
    friday: { start: '08:00', end: '18:00', breaks: [{ start: '12:00', end: '13:00' }] },
    saturday: { start: '08:00', end: '14:00' },
  };

  constructor(
    private therapistSchedules: TherapistSchedule[] = [],
    private roomCapacity: Record<string, number> = {}
  ) {}

  /**
   * Detects conflicts for a new appointment
   */
  detectConflicts(
    newAppointment: {
      therapistId: string;
      patientId: string;
      startTime: Date;
      endTime: Date;
      location?: string;
    },
    existingAppointments: Appointment[],
    excludeAppointmentId?: string
  ): ConflictResult {
    const conflicts: ConflictResult['conflicts'] = [];
    
    // Filter out the appointment being edited
    const relevantAppointments = existingAppointments.filter(
      app => app.id !== excludeAppointmentId
    );

    // Check working hours
    const workingHoursConflict = this.checkWorkingHours(
      newAppointment.therapistId,
      newAppointment.startTime,
      newAppointment.endTime
    );
    if (workingHoursConflict) {
      conflicts.push(workingHoursConflict);
    }

    // Check therapist availability
    const therapistConflicts = this.checkTherapistConflicts(
      newAppointment.therapistId,
      newAppointment.startTime,
      newAppointment.endTime,
      relevantAppointments
    );
    conflicts.push(...therapistConflicts);

    // Check patient availability
    const patientConflicts = this.checkPatientConflicts(
      newAppointment.patientId,
      newAppointment.startTime,
      newAppointment.endTime,
      relevantAppointments
    );
    conflicts.push(...patientConflicts);

    // Check room capacity
    if (newAppointment.location) {
      const roomConflicts = this.checkRoomConflicts(
        newAppointment.location,
        newAppointment.startTime,
        newAppointment.endTime,
        relevantAppointments
      );
      conflicts.push(...roomConflicts);
    }

    // Generate suggestions if there are conflicts
    const suggestions = conflicts.length > 0
      ? this.generateSuggestions(newAppointment, relevantAppointments)
      : [];

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      suggestions
    };
  }

  /**
   * Check if the appointment is within working hours
   */
  private checkWorkingHours(
    therapistId: string,
    startTime: Date,
    endTime: Date
  ): ConflictResult['conflicts'][0] | null {
    const schedule = this.getTherapistSchedule(therapistId);
    const dayOfWeek = this.getDayOfWeek(startTime);
    const workingDay = schedule.workingHours[dayOfWeek];

    if (!workingDay) {
      return {
        type: 'outside_hours',
        message: `Terapeuta não trabalha às ${this.getDayName(dayOfWeek)}s`
      };
    }

    const startHour = this.getTimeString(startTime);
    const endHour = this.getTimeString(endTime);

    if (startHour < workingDay.start || endHour > workingDay.end) {
      return {
        type: 'outside_hours',
        message: `Horário fora do expediente (${workingDay.start} - ${workingDay.end})`
      };
    }

    // Check breaks
    if (workingDay.breaks) {
      for (const breakPeriod of workingDay.breaks) {
        if (this.timeOverlaps(startHour, endHour, breakPeriod.start, breakPeriod.end)) {
          return {
            type: 'outside_hours',
            message: `Conflito com horário de almoço (${breakPeriod.start} - ${breakPeriod.end})`
          };
        }
      }
    }

    return null;
  }

  /**
   * Check for therapist conflicts
   */
  private checkTherapistConflicts(
    therapistId: string,
    startTime: Date,
    endTime: Date,
    appointments: Appointment[]
  ): ConflictResult['conflicts'] {
    const conflicts: ConflictResult['conflicts'] = [];

    const therapistAppointments = appointments.filter(
      app => app.therapistId === therapistId && app.status !== 'cancelled'
    );

    for (const appointment of therapistAppointments) {
      if (this.dateTimeOverlaps(startTime, endTime, appointment.startTime, appointment.endTime)) {
        conflicts.push({
          type: 'therapist_busy',
          appointment,
          message: `Terapeuta já tem consulta agendada às ${appointment.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
        });
      }
    }

    return conflicts;
  }

  /**
   * Check for patient conflicts
   */
  private checkPatientConflicts(
    patientId: string,
    startTime: Date,
    endTime: Date,
    appointments: Appointment[]
  ): ConflictResult['conflicts'] {
    const conflicts: ConflictResult['conflicts'] = [];

    const patientAppointments = appointments.filter(
      app => app.patientId === patientId && app.status !== 'cancelled'
    );

    for (const appointment of patientAppointments) {
      if (this.dateTimeOverlaps(startTime, endTime, appointment.startTime, appointment.endTime)) {
        conflicts.push({
          type: 'patient_busy',
          appointment,
          message: `Paciente já tem consulta agendada às ${appointment.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
        });
      }
    }

    return conflicts;
  }

  /**
   * Check for room capacity conflicts
   */
  private checkRoomConflicts(
    location: string,
    startTime: Date,
    endTime: Date,
    appointments: Appointment[]
  ): ConflictResult['conflicts'] {
    const conflicts: ConflictResult['conflicts'] = [];
    const capacity = this.roomCapacity[location] || 1;

    const overlappingAppointments = appointments.filter(app => 
      app.location === location && 
      app.status !== 'cancelled' &&
      this.dateTimeOverlaps(startTime, endTime, app.startTime, app.endTime)
    );

    if (overlappingAppointments.length >= capacity) {
      conflicts.push({
        type: 'room_occupied',
        message: `${location} já está ocupada (capacidade: ${capacity})`
      });
    }

    return conflicts;
  }

  /**
   * Generate alternative time suggestions
   */
  private generateSuggestions(
    newAppointment: {
      therapistId: string;
      patientId: string;
      startTime: Date;
      endTime: Date;
      location?: string;
    },
    existingAppointments: Appointment[]
  ): ConflictResult['suggestions'] {
    const suggestions: ConflictResult['suggestions'] = [];
    const duration = newAppointment.endTime.getTime() - newAppointment.startTime.getTime();
    
    // Try to find next available slot on the same day
    const sameDay = this.findNextAvailableSlot(
      newAppointment.therapistId,
      newAppointment.startTime,
      duration,
      existingAppointments,
      false
    );
    
    if (sameDay) {
      suggestions.push({
        start: sameDay.start,
        end: sameDay.end,
        reason: 'Próximo horário disponível no mesmo dia'
      });
    }

    // Try next business day
    const nextDay = new Date(newAppointment.startTime);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(8, 0, 0, 0); // Start at 8 AM

    const nextDaySlot = this.findNextAvailableSlot(
      newAppointment.therapistId,
      nextDay,
      duration,
      existingAppointments,
      true
    );

    if (nextDaySlot) {
      suggestions.push({
        start: nextDaySlot.start,
        end: nextDaySlot.end,
        reason: 'Próximo dia útil disponível'
      });
    }

    // Try earlier on the same day
    const earlierSlot = this.findEarlierSlot(
      newAppointment.therapistId,
      newAppointment.startTime,
      duration,
      existingAppointments
    );

    if (earlierSlot) {
      suggestions.push({
        start: earlierSlot.start,
        end: earlierSlot.end,
        reason: 'Horário anterior disponível no mesmo dia'
      });
    }

    return suggestions.slice(0, 3); // Return up to 3 suggestions
  }

  /**
   * Find the next available time slot
   */
  private findNextAvailableSlot(
    therapistId: string,
    startFrom: Date,
    duration: number,
    existingAppointments: Appointment[],
    allowNextDay: boolean = false
  ): { start: Date; end: Date } | null {
    const schedule = this.getTherapistSchedule(therapistId);
    const maxDaysAhead = allowNextDay ? 7 : 0;
    
    for (let dayOffset = 0; dayOffset <= maxDaysAhead; dayOffset++) {
      const testDate = new Date(startFrom);
      testDate.setDate(testDate.getDate() + dayOffset);
      
      const dayOfWeek = this.getDayOfWeek(testDate);
      const workingDay = schedule.workingHours[dayOfWeek];
      
      if (!workingDay) continue;

      const [startHour, startMinute] = workingDay.start.split(':').map(Number);
      const [endHour, endMinute] = workingDay.end.split(':').map(Number);
      
      testDate.setHours(dayOffset === 0 ? Math.max(startFrom.getHours(), startHour) : startHour);
      testDate.setMinutes(dayOffset === 0 ? (testDate.getHours() === startFrom.getHours() ? startFrom.getMinutes() : 0) : 0);
      testDate.setSeconds(0);
      testDate.setMilliseconds(0);

      const endOfDay = new Date(testDate);
      endOfDay.setHours(endHour, endMinute, 0, 0);

      // Try 15-minute intervals
      while (testDate.getTime() + duration <= endOfDay.getTime()) {
        const slotEnd = new Date(testDate.getTime() + duration);
        
        const conflictResult = this.detectConflicts(
          {
            therapistId,
            patientId: 'temp',
            startTime: testDate,
            endTime: slotEnd
          },
          existingAppointments
        );

        if (!conflictResult.hasConflict) {
          return { start: new Date(testDate), end: slotEnd };
        }

        testDate.setMinutes(testDate.getMinutes() + 15);
      }
    }

    return null;
  }

  /**
   * Find an earlier slot on the same day
   */
  private findEarlierSlot(
    therapistId: string,
    originalTime: Date,
    duration: number,
    existingAppointments: Appointment[]
  ): { start: Date; end: Date } | null {
    const schedule = this.getTherapistSchedule(therapistId);
    const dayOfWeek = this.getDayOfWeek(originalTime);
    const workingDay = schedule.workingHours[dayOfWeek];
    
    if (!workingDay) return null;

    const [startHour, startMinute] = workingDay.start.split(':').map(Number);
    const testDate = new Date(originalTime);
    testDate.setHours(startHour, startMinute, 0, 0);

    // Try slots before the original time
    while (testDate.getTime() + duration <= originalTime.getTime()) {
      const slotEnd = new Date(testDate.getTime() + duration);
      
      const conflictResult = this.detectConflicts(
        {
          therapistId,
          patientId: 'temp',
          startTime: testDate,
          endTime: slotEnd
        },
        existingAppointments
      );

      if (!conflictResult.hasConflict) {
        return { start: new Date(testDate), end: slotEnd };
      }

      testDate.setMinutes(testDate.getMinutes() + 15);
    }

    return null;
  }

  /**
   * Get available time slots for a given day and therapist
   */
  getAvailableSlots(
    therapistId: string,
    date: Date,
    duration: number,
    existingAppointments: Appointment[]
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const schedule = this.getTherapistSchedule(therapistId);
    const dayOfWeek = this.getDayOfWeek(date);
    const workingDay = schedule.workingHours[dayOfWeek];

    if (!workingDay) return slots;

    const [startHour, startMinute] = workingDay.start.split(':').map(Number);
    const [endHour, endMinute] = workingDay.end.split(':').map(Number);

    const currentSlot = new Date(date);
    currentSlot.setHours(startHour, startMinute, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(endHour, endMinute, 0, 0);

    // Generate 15-minute slots
    while (currentSlot.getTime() + duration <= endOfDay.getTime()) {
      const slotEnd = new Date(currentSlot.getTime() + duration);
      
      const conflictResult = this.detectConflicts(
        {
          therapistId,
          patientId: 'temp',
          startTime: currentSlot,
          endTime: slotEnd
        },
        existingAppointments
      );

      slots.push({
        start: new Date(currentSlot),
        end: slotEnd,
        available: !conflictResult.hasConflict,
        conflictReason: conflictResult.hasConflict 
          ? conflictResult.conflicts[0]?.message 
          : undefined
      });

      currentSlot.setMinutes(currentSlot.getMinutes() + 15);
    }

    return slots;
  }

  /**
   * Validate recurring appointment pattern
   */
  validateRecurrence(
    baseAppointment: {
      therapistId: string;
      patientId: string;
      startTime: Date;
      endTime: Date;
    },
    recurrenceRule: RecurrenceRule,
    existingAppointments: Appointment[]
  ): Array<{ date: Date; conflicts: ConflictResult['conflicts'] }> {
    const conflictDates: Array<{ date: Date; conflicts: ConflictResult['conflicts'] }> = [];
    
    let currentDate = new Date(baseAppointment.startTime);
    const endDate = recurrenceRule.endDate 
      ? new Date(recurrenceRule.endDate) 
      : new Date(currentDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days default
    
    let count = 0;
    const maxOccurrences = recurrenceRule.occurrences || 50;

    while (currentDate <= endDate && count < maxOccurrences) {
      if (count > 0) { // Skip first occurrence
        const appointmentEnd = new Date(currentDate.getTime() + (baseAppointment.endTime.getTime() - baseAppointment.startTime.getTime()));
        
        const conflicts = this.detectConflicts(
          {
            ...baseAppointment,
            startTime: currentDate,
            endTime: appointmentEnd
          },
          existingAppointments
        );

        if (conflicts.hasConflict) {
          conflictDates.push({
            date: new Date(currentDate),
            conflicts: conflicts.conflicts
          });
        }
      }

      // Calculate next occurrence
      switch (recurrenceRule.frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + recurrenceRule.interval);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (7 * recurrenceRule.interval));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + recurrenceRule.interval);
          break;
      }
      
      count++;
    }

    return conflictDates;
  }

  // Helper methods
  private getTherapistSchedule(therapistId: string): TherapistSchedule {
    return this.therapistSchedules.find(s => s.therapistId === therapistId) || {
      therapistId,
      workingHours: this.defaultWorkingHours,
      timeOffPeriods: []
    };
  }

  private getDayOfWeek(date: Date): string {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  }

  private getDayName(dayOfWeek: string): string {
    const names: Record<string, string> = {
      monday: 'Segunda-feira',
      tuesday: 'Terça-feira',
      wednesday: 'Quarta-feira',
      thursday: 'Quinta-feira',
      friday: 'Sexta-feira',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };
    return names[dayOfWeek] || dayOfWeek;
  }

  private getTimeString(date: Date): string {
    return date.toTimeString().slice(0, 5); // HH:MM format
  }

  private timeOverlaps(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && end1 > start2;
  }

  private dateTimeOverlaps(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 < end2 && end1 > start2;
  }
}

export default ConflictDetectionService;