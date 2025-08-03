import { Appointment, RecurrenceRule } from '../../types';

export interface RecurrenceValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  totalOccurrences: number;
  nextOccurrences: Date[];
}

export interface RecurrencePattern {
  id: string;
  name: string;
  description: string;
  rule: RecurrenceRule;
  examples: string[];
}

export class RecurrenceService {
  // Predefined common patterns
  static commonPatterns: RecurrencePattern[] = [
    {
      id: 'weekly_same_time',
      name: 'Semanal - mesmo horário',
      description: 'Repetir toda semana no mesmo dia e horário',
      rule: { frequency: 'weekly', interval: 1 },
      examples: ['Toda segunda-feira às 14:00', 'Toda sexta-feira às 09:30']
    },
    {
      id: 'biweekly',
      name: 'Quinzenal',
      description: 'Repetir a cada duas semanas',
      rule: { frequency: 'weekly', interval: 2 },
      examples: ['A cada duas semanas na terça-feira', 'Quinzenalmente às quartas']
    },
    {
      id: 'monthly_same_date',
      name: 'Mensal - mesmo dia',
      description: 'Repetir todo mês no mesmo dia',
      rule: { frequency: 'monthly', interval: 1 },
      examples: ['Todo dia 15 do mês', 'Primeira segunda-feira do mês']
    },
    {
      id: 'twice_weekly',
      name: 'Duas vezes por semana',
      description: 'Duas sessões por semana em dias específicos',
      rule: { frequency: 'weekly', interval: 1, daysOfWeek: [1, 4] }, // Monday and Thursday
      examples: ['Segundas e quintas-feiras', 'Terças e sextas-feiras']
    },
    {
      id: 'three_weekly',
      name: 'Três vezes por semana',
      description: 'Três sessões por semana alternadas',
      rule: { frequency: 'weekly', interval: 1, daysOfWeek: [1, 3, 5] }, // Monday, Wednesday, Friday
      examples: ['Segunda, quarta e sexta', 'Terça, quinta e sábado']
    }
  ];

  /**
   * Generate appointments based on recurrence rule
   */
  static generateRecurringAppointments(
    baseAppointment: Omit<Appointment, 'id'>,
    rule: RecurrenceRule
  ): Omit<Appointment, 'id'>[] {
    const appointments: Omit<Appointment, 'id'>[] = [];
    const startDate = new Date(baseAppointment.startTime);
    const duration = new Date(baseAppointment.endTime).getTime() - new Date(baseAppointment.startTime).getTime();
    
    // Calculate end date
    const endDate = rule.endDate 
      ? new Date(rule.endDate)
      : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year default

    let currentDate = new Date(startDate);
    let occurrenceCount = 0;
    const maxOccurrences = rule.occurrences || 100;

    while (currentDate <= endDate && occurrenceCount < maxOccurrences) {
      // Skip the first occurrence (original appointment)
      if (occurrenceCount > 0) {
        const appointmentStart = new Date(currentDate);
        const appointmentEnd = new Date(appointmentStart.getTime() + duration);

        appointments.push({
          ...baseAppointment,
          startTime: appointmentStart,
          endTime: appointmentEnd,
          recurrenceRule: rule
        });
      }

      // Calculate next occurrence
      currentDate = this.getNextOccurrence(currentDate, rule);
      occurrenceCount++;

      // Safety check to prevent infinite loops
      if (occurrenceCount > 1000) {
        console.warn('Recurrence generation stopped at 1000 occurrences to prevent infinite loop');
        break;
      }
    }

    return appointments;
  }

  /**
   * Calculate the next occurrence based on recurrence rule
   */
  private static getNextOccurrence(currentDate: Date, rule: RecurrenceRule): Date {
    const nextDate = new Date(currentDate);

    switch (rule.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + rule.interval);
        break;

      case 'weekly':
        if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
          // Handle specific days of week
          const currentDayOfWeek = nextDate.getDay();
          const sortedDays = [...rule.daysOfWeek].sort((a, b) => a - b);
          
          // Find next day in the same week
          const nextDayInWeek = sortedDays.find(day => day > currentDayOfWeek);
          
          if (nextDayInWeek !== undefined) {
            // Move to next day in same week
            const daysToAdd = nextDayInWeek - currentDayOfWeek;
            nextDate.setDate(nextDate.getDate() + daysToAdd);
          } else {
            // Move to first day of next week cycle
            const daysToNextWeek = (7 - currentDayOfWeek) + sortedDays[0];
            const weeksToAdd = (rule.interval - 1) * 7;
            nextDate.setDate(nextDate.getDate() + daysToNextWeek + weeksToAdd);
          }
        } else {
          // Simple weekly recurrence
          nextDate.setDate(nextDate.getDate() + (7 * rule.interval));
        }
        break;

      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + rule.interval);
        break;

      default:
        throw new Error(`Unsupported frequency: ${rule.frequency}`);
    }

    return nextDate;
  }

  /**
   * Validate recurrence rule and calculate occurrences
   */
  static validateRecurrence(
    baseDate: Date,
    rule: RecurrenceRule
  ): RecurrenceValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!rule.frequency) {
      errors.push('Frequência é obrigatória');
    }

    if (!rule.interval || rule.interval < 1) {
      errors.push('Intervalo deve ser maior que zero');
    }

    if (rule.interval > 12 && rule.frequency === 'monthly') {
      warnings.push('Intervalo mensal muito grande pode gerar muitas ocorrências');
    }

    if (rule.interval > 4 && rule.frequency === 'weekly') {
      warnings.push('Intervalo semanal muito grande (mais de 1 mês)');
    }

    // Validate end conditions
    const hasEndDate = rule.endDate && new Date(rule.endDate) > baseDate;
    const hasOccurrences = rule.occurrences && rule.occurrences > 0;

    if (!hasEndDate && !hasOccurrences) {
      warnings.push('Recomendamos definir uma data final ou número de ocorrências');
    }

    if (rule.endDate && new Date(rule.endDate) <= baseDate) {
      errors.push('Data final deve ser posterior à data inicial');
    }

    if (rule.occurrences && rule.occurrences > 100) {
      warnings.push('Muitas ocorrências podem impactar a performance');
    }

    // Validate days of week for weekly frequency
    if (rule.frequency === 'weekly' && rule.daysOfWeek) {
      if (rule.daysOfWeek.length === 0) {
        errors.push('Pelo menos um dia da semana deve ser selecionado');
      }

      if (rule.daysOfWeek.some(day => day < 0 || day > 6)) {
        errors.push('Dias da semana inválidos (deve ser 0-6)');
      }
    }

    // Calculate total occurrences for preview
    const totalOccurrences = this.calculateTotalOccurrences(baseDate, rule);
    const nextOccurrences = this.getNextOccurrences(baseDate, rule, 5);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalOccurrences,
      nextOccurrences
    };
  }

  /**
   * Calculate total number of occurrences
   */
  private static calculateTotalOccurrences(baseDate: Date, rule: RecurrenceRule): number {
    if (rule.occurrences) {
      return rule.occurrences;
    }

    if (!rule.endDate) {
      return -1; // Infinite or unknown
    }

    const endDate = new Date(rule.endDate);
    const timeDiff = endDate.getTime() - baseDate.getTime();
    
    let estimatedOccurrences = 0;

    switch (rule.frequency) {
      case 'daily':
        estimatedOccurrences = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * rule.interval));
        break;
      case 'weekly':
        if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
          const weeksInPeriod = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 7 * rule.interval));
          estimatedOccurrences = weeksInPeriod * rule.daysOfWeek.length;
        } else {
          estimatedOccurrences = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 7 * rule.interval));
        }
        break;
      case 'monthly':
        const monthsDiff = (endDate.getFullYear() - baseDate.getFullYear()) * 12 + endDate.getMonth() - baseDate.getMonth();
        estimatedOccurrences = Math.floor(monthsDiff / rule.interval);
        break;
    }

    return Math.max(0, estimatedOccurrences);
  }

  /**
   * Get next N occurrences for preview
   */
  private static getNextOccurrences(baseDate: Date, rule: RecurrenceRule, count: number): Date[] {
    const occurrences: Date[] = [];
    let currentDate = new Date(baseDate);
    let generated = 0;

    while (generated < count) {
      currentDate = this.getNextOccurrence(currentDate, rule);
      occurrences.push(new Date(currentDate));
      generated++;

      // Safety check
      if (generated > 50) break;
    }

    return occurrences;
  }

  /**
   * Create recurrence rule from pattern
   */
  static createRuleFromPattern(patternId: string, customOptions?: Partial<RecurrenceRule>): RecurrenceRule {
    const pattern = this.commonPatterns.find(p => p.id === patternId);
    
    if (!pattern) {
      throw new Error(`Pattern not found: ${patternId}`);
    }

    return {
      ...pattern.rule,
      ...customOptions
    };
  }

  /**
   * Update recurring series
   */
  static updateRecurringSeries(
    baseAppointment: Appointment,
    updates: Partial<Omit<Appointment, 'id' | 'recurrenceRule'>>,
    updateMode: 'this_only' | 'this_and_future' | 'all_series'
  ): Array<{ appointment: Appointment; action: 'update' | 'delete' | 'create' }> {
    const changes: Array<{ appointment: Appointment; action: 'update' | 'delete' | 'create' }> = [];

    // This implementation would depend on how appointments are stored
    // For now, return the base appointment update
    changes.push({
      appointment: { ...baseAppointment, ...updates },
      action: 'update'
    });

    return changes;
  }

  /**
   * Cancel recurring series
   */
  static cancelRecurringSeries(
    baseAppointment: Appointment,
    cancelMode: 'this_only' | 'this_and_future' | 'all_series',
    reason?: string
  ): Array<{ appointmentId: string; action: 'cancel' | 'delete' }> {
    const cancellations: Array<{ appointmentId: string; action: 'cancel' | 'delete' }> = [];

    // This implementation would depend on how appointments are stored
    // For now, return the base appointment cancellation
    cancellations.push({
      appointmentId: baseAppointment.id,
      action: 'cancel'
    });

    return cancellations;
  }

  /**
   * Find conflicts in recurring series
   */
  static findRecurringConflicts(
    baseAppointment: Omit<Appointment, 'id'>,
    rule: RecurrenceRule,
    existingAppointments: Appointment[]
  ): Array<{ date: Date; conflicts: string[] }> {
    const conflicts: Array<{ date: Date; conflicts: string[] }> = [];
    const recurringAppointments = this.generateRecurringAppointments(baseAppointment, rule);

    recurringAppointments.forEach(appointment => {
      const appointmentConflicts: string[] = [];

      existingAppointments.forEach(existing => {
        if (this.appointmentsOverlap(appointment, existing)) {
          appointmentConflicts.push(
            `Conflito com consulta existente às ${existing.startTime.toLocaleTimeString('pt-BR')}`
          );
        }
      });

      if (appointmentConflicts.length > 0) {
        conflicts.push({
          date: new Date(appointment.startTime),
          conflicts: appointmentConflicts
        });
      }
    });

    return conflicts;
  }

  /**
   * Check if two appointments overlap
   */
  private static appointmentsOverlap(
    app1: Omit<Appointment, 'id'>,
    app2: Appointment
  ): boolean {
    const start1 = new Date(app1.startTime);
    const end1 = new Date(app1.endTime);
    const start2 = new Date(app2.startTime);
    const end2 = new Date(app2.endTime);

    // Check therapist conflict
    if (app1.therapistId === app2.therapistId) {
      return start1 < end2 && end1 > start2;
    }

    // Check patient conflict
    if (app1.patientId === app2.patientId) {
      return start1 < end2 && end1 > start2;
    }

    return false;
  }

  /**
   * Format recurrence description for display
   */
  static formatRecurrenceDescription(rule: RecurrenceRule): string {
    const { frequency, interval, daysOfWeek, endDate, occurrences } = rule;

    let description = '';

    // Base frequency
    switch (frequency) {
      case 'daily':
        description = interval === 1 ? 'Diariamente' : `A cada ${interval} dias`;
        break;
      case 'weekly':
        if (daysOfWeek && daysOfWeek.length > 0) {
          const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
          const selectedDays = daysOfWeek.map(day => dayNames[day]).join(', ');
          description = interval === 1 
            ? `Semanalmente (${selectedDays})`
            : `A cada ${interval} semanas (${selectedDays})`;
        } else {
          description = interval === 1 ? 'Semanalmente' : `A cada ${interval} semanas`;
        }
        break;
      case 'monthly':
        description = interval === 1 ? 'Mensalmente' : `A cada ${interval} meses`;
        break;
    }

    // End condition
    if (occurrences) {
      description += `, ${occurrences} ocorrências`;
    } else if (endDate) {
      description += `, até ${new Date(endDate).toLocaleDateString('pt-BR')}`;
    }

    return description;
  }

  /**
   * Get day names in Portuguese
   */
  static getDayNames(): string[] {
    return ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  }

  /**
   * Get short day names in Portuguese
   */
  static getShortDayNames(): string[] {
    return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  }
}

export default RecurrenceService;