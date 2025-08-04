import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  Save, 
  X, 
  AlertTriangle,
  Repeat,
  MapPin,
  FileText,
  Bell,
  Check
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Appointment, Patient, AppointmentType, AppointmentStatus, RecurrenceRule } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { usePatients } from '../../hooks/usePatients';

// Validation schema
const appointmentSchema = z.object({
  patientId: z.string().min(1, 'Paciente é obrigatório'),
  therapistId: z.string().min(1, 'Terapeuta é obrigatório'),
  type: z.enum(['Avaliação', 'Sessão', 'Retorno', 'Grupo'], { required_error: 'Tipo é obrigatório' }),
  startTime: z.string().min(1, 'Data e hora são obrigatórias'),
  duration: z.number().min(15, 'Duração mínima é 15 minutos').max(240, 'Duração máxima é 4 horas'),
  location: z.string().optional(),
  notes: z.string().optional(),
  sendReminder: z.boolean(),
  reminderTime: z.number().optional(),
  isRecurring: z.boolean(),
  recurrenceRule: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    interval: z.number().min(1),
    endDate: z.string().optional(),
    occurrences: z.number().optional(),
    daysOfWeek: z.array(z.number()).optional()
  }).optional()
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface ConflictInfo {
  hasConflict: boolean;
  conflictingAppointments: Appointment[];
  suggestion?: {
    time: string;
    reason: string;
  };
}

interface AppointmentSchedulerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Omit<Appointment, 'id'>) => Promise<void>;
  existingAppointments: Appointment[];
  editingAppointment?: Appointment;
  selectedDate?: Date;
  selectedTime?: string;
}

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
  isOpen,
  onClose,
  onSave,
  existingAppointments,
  editingAppointment,
  selectedDate,
  selectedTime
}) => {
  const [step, setStep] = useState(1);
  const [conflictInfo, setConflictInfo] = useState<ConflictInfo>({ hasConflict: false, conflictingAppointments: [] });
  const [isLoading, setIsLoading] = useState(false);
  const { patients } = usePatients();
  const { showToast } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    reset
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: '',
      therapistId: '',
      type: 'Sessão',
      startTime: selectedDate && selectedTime 
        ? `${selectedDate.toISOString().split('T')[0]}T${selectedTime}` 
        : '',
      duration: 60,
      location: 'Sala 1',
      notes: '',
      sendReminder: true,
      reminderTime: 24,
      isRecurring: false,
    }
  });

  const watchedValues = watch();

  // Mock therapist data - in real app would come from API
  const therapists = [
    { id: '1', name: 'Dr. João Silva', specialty: 'Fisioterapia Geral' },
    { id: '2', name: 'Dra. Maria Santos', specialty: 'Fisioterapia Neurológica' },
    { id: '3', name: 'Dr. Pedro Oliveira', specialty: 'Fisioterapia Esportiva' }
  ];

  const appointmentTypes: Array<{ value: AppointmentType; label: string; duration: number; color: string }> = [
    { value: 'Avaliação', label: 'Avaliação Inicial', duration: 90, color: 'bg-blue-100 text-blue-800' },
    { value: 'Sessão', label: 'Sessão de Fisioterapia', duration: 60, color: 'bg-green-100 text-green-800' },
    { value: 'Retorno', label: 'Consulta de Retorno', duration: 30, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'Grupo', label: 'Terapia em Grupo', duration: 90, color: 'bg-purple-100 text-purple-800' }
  ];

  const locations = [
    'Sala 1', 'Sala 2', 'Sala 3', 'Ginásio', 'Piscina', 'Sala de Grupo'
  ];

  const reminderOptions = [
    { value: 1, label: '1 hora antes' },
    { value: 24, label: '1 dia antes' },
    { value: 48, label: '2 dias antes' },
    { value: 168, label: '1 semana antes' }
  ];

  // Initialize form with editing data
  useEffect(() => {
    if (editingAppointment) {
      reset({
        patientId: editingAppointment.patientId,
        therapistId: editingAppointment.therapistId,
        type: editingAppointment.type,
        startTime: editingAppointment.startTime.toString().slice(0, 16),
        duration: Math.round((new Date(editingAppointment.endTime).getTime() - new Date(editingAppointment.startTime).getTime()) / (1000 * 60)),
        location: editingAppointment.location || 'Sala 1',
        notes: editingAppointment.notes || '',
        sendReminder: true,
        reminderTime: 24,
        isRecurring: false,
      });
    }
  }, [editingAppointment, reset]);

  // Update duration when type changes
  useEffect(() => {
    const selectedType = appointmentTypes.find(t => t.value === watchedValues.type);
    if (selectedType && !editingAppointment) {
      setValue('duration', selectedType.duration);
    }
  }, [watchedValues.type, setValue, editingAppointment]);

  // Check for conflicts when time or duration changes
  useEffect(() => {
    if (watchedValues.startTime && watchedValues.duration && watchedValues.therapistId) {
      checkForConflicts();
    }
  }, [watchedValues.startTime, watchedValues.duration, watchedValues.therapistId]);

  const checkForConflicts = () => {
    const startTime = new Date(watchedValues.startTime);
    const endTime = new Date(startTime.getTime() + watchedValues.duration * 60000);

    const conflicts = existingAppointments.filter(appointment => {
      // Skip self when editing
      if (editingAppointment && appointment.id === editingAppointment.id) {
        return false;
      }

      const appStart = new Date(appointment.startTime);
      const appEnd = new Date(appointment.endTime);
      
      // Check therapist conflict
      if (appointment.therapistId === watchedValues.therapistId) {
        return (startTime < appEnd && endTime > appStart);
      }
      
      return false;
    });

    if (conflicts.length > 0) {
      // Find next available slot
      const suggestion = findNextAvailableSlot(startTime, watchedValues.duration);
      setConflictInfo({
        hasConflict: true,
        conflictingAppointments: conflicts,
        suggestion
      });
    } else {
      setConflictInfo({ hasConflict: false, conflictingAppointments: [] });
    }
  };

  const findNextAvailableSlot = (requestedTime: Date, duration: number) => {
    const workingHours = { start: 8, end: 18 }; // 8 AM to 6 PM
    let currentTime = new Date(requestedTime);
    
    // Try same day first
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      const testTime = new Date(currentTime);
      testTime.setHours(hour, 0, 0, 0);
      
      if (isTimeSlotAvailable(testTime, duration)) {
        return {
          time: testTime.toISOString().slice(0, 16),
          reason: 'Próximo horário disponível no mesmo dia'
        };
      }
    }

    // Try next day
    const nextDay = new Date(currentTime);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(workingHours.start, 0, 0, 0);
    
    return {
      time: nextDay.toISOString().slice(0, 16),
      reason: 'Próximo horário disponível no dia seguinte'
    };
  };

  const isTimeSlotAvailable = (startTime: Date, duration: number): boolean => {
    const endTime = new Date(startTime.getTime() + duration * 60000);
    
    return !existingAppointments.some(appointment => {
      if (editingAppointment && appointment.id === editingAppointment.id) {
        return false;
      }
      
      const appStart = new Date(appointment.startTime);
      const appEnd = new Date(appointment.endTime);
      
      return appointment.therapistId === watchedValues.therapistId &&
             (startTime < appEnd && endTime > appStart);
    });
  };

  const generateRecurringAppointments = (baseAppointment: Omit<Appointment, 'id'>, rule: RecurrenceRule): Omit<Appointment, 'id'>[] => {
    const appointments: Omit<Appointment, 'id'>[] = [];
    const startDate = new Date(baseAppointment.startTime);
    const endDate = rule.endDate ? new Date(rule.endDate) : new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days default
    
    let currentDate = new Date(startDate);
    let count = 0;
    const maxOccurrences = rule.occurrences || 50;

    while (currentDate <= endDate && count < maxOccurrences) {
      if (count > 0) { // Skip first occurrence (original appointment)
        const appointmentStart = new Date(currentDate);
        const appointmentEnd = new Date(appointmentStart.getTime() + (new Date(baseAppointment.endTime).getTime() - new Date(baseAppointment.startTime).getTime()));
        
        appointments.push({
          ...baseAppointment,
          startTime: appointmentStart,
          endTime: appointmentEnd,
          recurrenceRule: rule
        });
      }

      // Calculate next occurrence
      switch (rule.frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + rule.interval);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (7 * rule.interval));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + rule.interval);
          break;
      }
      
      count++;
    }

    return appointments;
  };

  const onSubmit = async (data: AppointmentFormData) => {
    if (conflictInfo.hasConflict && step === 1) {
      setStep(2); // Go to conflict resolution step
      return;
    }

    setIsLoading(true);
    try {
      const startTime = new Date(data.startTime);
      const endTime = new Date(startTime.getTime() + data.duration * 60000);

      const appointment: Omit<Appointment, 'id'> = {
        patientId: data.patientId,
        therapistId: data.therapistId,
        type: data.type,
        status: 'scheduled' as AppointmentStatus,
        startTime,
        endTime,
        location: data.location,
        notes: data.notes,
        recurrenceRule: data.isRecurring && data.recurrenceRule ? {
          ...data.recurrenceRule,
          days: data.recurrenceRule.daysOfWeek || [],
          until: data.recurrenceRule.endDate || ''
        } : undefined
      };

      await onSave(appointment);

      // Handle recurring appointments
      if (data.isRecurring && data.recurrenceRule) {
        const recurringAppointments = generateRecurringAppointments(appointment, data.recurrenceRule);
        for (const recurringAppointment of recurringAppointments) {
          await onSave(recurringAppointment);
        }
        showToast(`Agendamento criado com ${recurringAppointments.length + 1} ocorrências`, 'success');
      } else {
        showToast('Agendamento criado com sucesso', 'success');
      }

      onClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Erro ao criar agendamento', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Informações do Agendamento</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Patient Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Paciente *
          </label>
          <Controller
            name="patientId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um paciente</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name} - {patient.phone}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.patientId && (
            <p className="text-red-500 text-sm mt-1">{errors.patientId.message}</p>
          )}
        </div>

        {/* Therapist Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Terapeuta *
          </label>
          <Controller
            name="therapistId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um terapeuta</option>
                {therapists.map(therapist => (
                  <option key={therapist.id} value={therapist.id}>
                    {therapist.name} - {therapist.specialty}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.therapistId && (
            <p className="text-red-500 text-sm mt-1">{errors.therapistId.message}</p>
          )}
        </div>

        {/* Appointment Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Consulta *
          </label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                {appointmentTypes.map(type => (
                  <label key={type.value} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      {...field}
                      value={type.value}
                      checked={field.value === type.value}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{type.label}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${type.color}`}>
                          {type.duration} min
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          />
          {errors.type && (
            <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
          )}
        </div>

        {/* Date and Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data e Hora *
          </label>
          <Controller
            name="startTime"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            )}
          />
          {errors.startTime && (
            <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>
          )}
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duração (minutos) *
          </label>
          <Controller
            name="duration"
            control={control}
            render={({ field }) => (
              <input
                {...field}
                type="number"
                min="15"
                max="240"
                step="15"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            )}
          />
          {errors.duration && (
            <p className="text-red-500 text-sm mt-1">{errors.duration.message}</p>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Local
          </label>
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                {locations.map(location => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observações
          </label>
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <textarea
                {...field}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Observações sobre o agendamento..."
              />
            )}
          />
        </div>

        {/* Reminder Options */}
        <div>
          <label className="flex items-center space-x-2 mb-2">
            <Controller
              name="sendReminder"
              control={control}
              render={({ field }) => (
                <input
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  type="checkbox"
                  checked={field.value}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              )}
            />
            <span className="text-sm font-medium text-gray-700">Enviar lembrete</span>
          </label>
          
          {watchedValues.sendReminder && (
            <Controller
              name="reminderTime"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  {reminderOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            />
          )}
        </div>

        {/* Recurring Options */}
        <div>
          <label className="flex items-center space-x-2 mb-2">
            <Controller
              name="isRecurring"
              control={control}
              render={({ field }) => (
                <input
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  type="checkbox"
                  checked={field.value}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              )}
            />
            <span className="text-sm font-medium text-gray-700">Consulta recorrente</span>
          </label>
          
          {watchedValues.isRecurring && (
            <div className="space-y-2">
              <Controller
                name="recurrenceRule.frequency"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                )}
              />
              
              <Controller
                name="recurrenceRule.occurrences"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    min="1"
                    max="52"
                    placeholder="Número de ocorrências"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                )}
              />
            </div>
          )}
        </div>
      </div>

      {/* Conflict Warning */}
      {conflictInfo.hasConflict && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="text-red-600 mt-1" size={20} />
            <div className="flex-1">
              <h4 className="text-red-800 font-medium">Conflito de Horário Detectado</h4>
              <p className="text-red-700 text-sm mt-1">
                Existe um agendamento conflitante para este terapeuta no horário selecionado.
              </p>
              {conflictInfo.suggestion && (
                <div className="mt-3">
                  <p className="text-sm text-red-700 mb-2">Sugestão:</p>
                  <button
                    type="button"
                    onClick={() => setValue('startTime', conflictInfo.suggestion!.time)}
                    className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
                  >
                    {conflictInfo.suggestion.reason} - {new Date(conflictInfo.suggestion.time).toLocaleString('pt-BR')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Resolução de Conflito</h3>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-yellow-800 font-medium">Conflitos Detectados</h4>
        <div className="mt-3 space-y-2">
          {conflictInfo.conflictingAppointments.map((appointment, index) => (
            <div key={index} className="bg-white p-3 rounded border">
              <p className="text-sm">
                <strong>Paciente:</strong> {patients.find(p => p.id === appointment.patientId)?.name}
              </p>
              <p className="text-sm">
                <strong>Horário:</strong> {new Date(appointment.startTime).toLocaleString('pt-BR')} - {new Date(appointment.endTime).toLocaleString('pt-BR')}
              </p>
              <p className="text-sm">
                <strong>Tipo:</strong> {appointment.type}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium">Opções:</h4>
        
        <button
          type="button"
          onClick={() => setStep(1)}
          className="w-full p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <div className="font-medium">Alterar horário</div>
          <div className="text-sm text-gray-600">Voltar e selecionar um horário diferente</div>
        </button>

        {conflictInfo.suggestion && (
          <button
            type="button"
            onClick={() => {
              setValue('startTime', conflictInfo.suggestion!.time);
              setStep(1);
            }}
            className="w-full p-3 text-left border border-blue-300 rounded-lg hover:bg-blue-50"
          >
            <div className="font-medium text-blue-800">Usar horário sugerido</div>
            <div className="text-sm text-blue-600">
              {new Date(conflictInfo.suggestion.time).toLocaleString('pt-BR')} - {conflictInfo.suggestion.reason}
            </div>
          </button>
        )}

        <button
          type="button"
          onClick={() => handleSubmit(onSubmit)()}
          className="w-full p-3 text-left border border-red-300 rounded-lg hover:bg-red-50"
        >
          <div className="font-medium text-red-800">Forçar agendamento</div>
          <div className="text-sm text-red-600">Criar mesmo com conflito (não recomendado)</div>
        </button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Calendar className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {editingAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
              </h2>
              <p className="text-gray-600">
                {step === 1 ? 'Preencha as informações do agendamento' : 'Resolva os conflitos de horário'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Indicator */}
        {!editingAppointment && (
          <div className="px-6 py-4 border-b">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                  {step > 1 ? <Check size={14} /> : '1'}
                </div>
                <span className="text-sm font-medium">Informações</span>
              </div>
              
              <div className={`flex-1 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              
              <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                  2
                </div>
                <span className="text-sm font-medium">Confirmação</span>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {step === 1 ? renderStep1() : renderStep2()}

          {/* Footer */}
          <div className="flex items-center justify-between pt-6 border-t mt-6">
            <div>
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Voltar
                </button>
              )}
            </div>

            <div className="space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              
              {step === 1 && (
                <button
                  type="submit"
                  disabled={!isValid || isLoading}
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save size={16} />
                  <span>
                    {isLoading ? 'Salvando...' : 
                     conflictInfo.hasConflict ? 'Verificar Conflitos' : 
                     editingAppointment ? 'Atualizar' : 'Criar Agendamento'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentScheduler;