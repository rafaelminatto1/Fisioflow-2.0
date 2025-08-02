import { z } from 'zod';
import { validationMessages } from '../utils/formUtils';
import { AppointmentType, AppointmentStatus } from '../types';

// Appointment schemas
export const appointmentSchema = z.object({
  patientId: z.string().min(1, validationMessages.required),
  therapistId: z.string().min(1, validationMessages.required),
  
  startTime: z.string().min(1, validationMessages.required),
  endTime: z.string().min(1, validationMessages.required),
  
  title: z
    .string()
    .min(1, validationMessages.required)
    .max(100, validationMessages.maxLength(100)),
  
  type: z.nativeEnum(AppointmentType),
  
  value: z
    .number()
    .min(0, validationMessages.min(0))
    .max(10000, validationMessages.max(10000)),
  
  observations: z.string().optional(),
  
  // Recurrence fields
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.object({
    frequency: z.literal('weekly'),
    days: z.array(z.number().min(0).max(6)),
    until: z.string(),
  }).optional(),
}).refine((data) => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return end > start;
}, {
  message: 'Horário de término deve ser posterior ao início',
  path: ['endTime'],
});

export const appointmentUpdateSchema = appointmentSchema.extend({
  id: z.string().min(1, validationMessages.required),
  status: z.nativeEnum(AppointmentStatus),
  paymentStatus: z.enum(['paid', 'pending']),
});

export const rescheduleAppointmentSchema = z.object({
  appointmentId: z.string().min(1, validationMessages.required),
  newStartTime: z.string().min(1, validationMessages.required),
  newEndTime: z.string().min(1, validationMessages.required),
  reason: z.string().min(1, 'Motivo do reagendamento é obrigatório'),
}).refine((data) => {
  const start = new Date(data.newStartTime);
  const end = new Date(data.newEndTime);
  return end > start;
}, {
  message: 'Horário de término deve ser posterior ao início',
  path: ['newEndTime'],
});

export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().min(1, validationMessages.required),
  reason: z.string().min(1, 'Motivo do cancelamento é obrigatório'),
  refundRequested: z.boolean().default(false),
});

export const appointmentSearchSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  patientId: z.string().optional(),
  therapistId: z.string().optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  type: z.nativeEnum(AppointmentType).optional(),
});

// SOAP Note schema
export const soapNoteSchema = z.object({
  appointmentId: z.string().min(1, validationMessages.required),
  patientId: z.string().min(1, validationMessages.required),
  
  subjective: z
    .string()
    .min(1, validationMessages.required)
    .min(10, validationMessages.minLength(10)),
  
  objective: z
    .string()
    .min(1, validationMessages.required)
    .min(10, validationMessages.minLength(10)),
  
  assessment: z
    .string()
    .min(1, validationMessages.required)
    .min(10, validationMessages.minLength(10)),
  
  plan: z
    .string()
    .min(1, validationMessages.required)
    .min(10, validationMessages.minLength(10)),
  
  bodyParts: z.array(z.string()).optional(),
  
  painScale: z
    .number()
    .min(0, 'Escala de dor deve ser entre 0 e 10')
    .max(10, 'Escala de dor deve ser entre 0 e 10')
    .optional(),
  
  metricResults: z.array(z.object({
    metricId: z.string(),
    value: z.number(),
  })).optional(),
  
  nextAppointmentRecommendation: z.string().optional(),
});

// Availability schema
export const availabilitySchema = z.object({
  therapistId: z.string().min(1, validationMessages.required),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido'),
  isActive: z.boolean().default(true),
}).refine((data) => {
  const start = data.startTime.split(':').map(Number);
  const end = data.endTime.split(':').map(Number);
  const startMinutes = start[0] * 60 + start[1];
  const endMinutes = end[0] * 60 + end[1];
  return endMinutes > startMinutes;
}, {
  message: 'Horário de término deve ser posterior ao início',
  path: ['endTime'],
});

// Type exports
export type AppointmentFormData = z.infer<typeof appointmentSchema>;
export type AppointmentUpdateFormData = z.infer<typeof appointmentUpdateSchema>;
export type RescheduleAppointmentFormData = z.infer<typeof rescheduleAppointmentSchema>;
export type CancelAppointmentFormData = z.infer<typeof cancelAppointmentSchema>;
export type AppointmentSearchFormData = z.infer<typeof appointmentSearchSchema>;
export type SoapNoteFormData = z.infer<typeof soapNoteSchema>;
export type AvailabilityFormData = z.infer<typeof availabilitySchema>;