import { z } from 'zod';
import { validationMessages, patterns, isValidCPF } from '../utils/formUtils';

// Patient form schemas
export const patientSchema = z.object({
  name: z
    .string()
    .min(1, validationMessages.required)
    .min(2, validationMessages.minLength(2))
    .max(100, validationMessages.maxLength(100)),
  
  cpf: z
    .string()
    .min(1, validationMessages.required)
    .refine((value) => isValidCPF(value), validationMessages.cpf),
  
  birthDate: z
    .string()
    .min(1, validationMessages.required)
    .refine((date) => {
      const parsedDate = new Date(date);
      const today = new Date();
      return parsedDate <= today;
    }, 'Data de nascimento não pode ser no futuro'),
  
  phone: z
    .string()
    .min(1, validationMessages.required)
    .regex(patterns.phone, validationMessages.phone),
  
  email: z
    .string()
    .min(1, validationMessages.required)
    .email(validationMessages.email),
  
  emergencyContact: z.object({
    name: z
      .string()
      .min(1, validationMessages.required)
      .min(2, validationMessages.minLength(2)),
    phone: z
      .string()
      .min(1, validationMessages.required)
      .regex(patterns.phone, validationMessages.phone),
  }),
  
  address: z.object({
    street: z
      .string()
      .min(1, validationMessages.required)
      .min(5, validationMessages.minLength(5)),
    city: z
      .string()
      .min(1, validationMessages.required)
      .min(2, validationMessages.minLength(2)),
    state: z
      .string()
      .min(1, validationMessages.required)
      .length(2, 'Estado deve ter 2 caracteres'),
    zip: z
      .string()
      .min(1, validationMessages.required)
      .regex(/^\d{5}-?\d{3}$/, 'CEP deve ter o formato 00000-000'),
  }),
  
  allergies: z.string().optional(),
  medicalAlerts: z.string().optional(),
  consentGiven: z.boolean().refine((val) => val === true, {
    message: 'Consentimento é obrigatório',
  }),
});

export const medicalHistorySchema = z.object({
  surgeries: z.array(z.object({
    name: z.string().min(1, validationMessages.required),
    date: z.string().min(1, validationMessages.required),
  })).optional(),
  
  conditions: z.array(z.object({
    name: z.string().min(1, validationMessages.required),
    date: z.string().min(1, validationMessages.required),
  })).optional(),
  
  medications: z.array(z.object({
    name: z.string().min(1, validationMessages.required),
    dosage: z.string().min(1, validationMessages.required),
    frequency: z.string().min(1, validationMessages.required),
  })).optional(),
  
  allergies: z.string().optional(),
  familyHistory: z.string().optional(),
});

export const trackedMetricSchema = z.object({
  name: z
    .string()
    .min(1, validationMessages.required)
    .max(50, validationMessages.maxLength(50)),
  
  unit: z
    .string()
    .min(1, validationMessages.required)
    .max(20, validationMessages.maxLength(20)),
  
  isActive: z.boolean().default(true),
});

export const metricResultSchema = z.object({
  metricId: z.string().min(1, validationMessages.required),
  value: z
    .number()
    .min(0, validationMessages.min(0))
    .max(1000, validationMessages.max(1000)),
  date: z.string().min(1, validationMessages.required),
  notes: z.string().optional(),
});

export const painLogSchema = z.object({
  patientId: z.string().min(1, validationMessages.required),
  painLevel: z
    .number()
    .min(0, 'Nível de dor deve ser entre 0 e 10')
    .max(10, 'Nível de dor deve ser entre 0 e 10'),
  location: z.string().optional(),
  description: z.string().optional(),
  triggers: z.array(z.string()).optional(),
  relief: z.array(z.string()).optional(),
  date: z.string().min(1, validationMessages.required),
});

// Quick patient search schema
export const patientSearchSchema = z.object({
  query: z.string().min(1, 'Digite pelo menos 1 caractere para buscar'),
  filters: z.object({
    status: z.enum(['Active', 'Inactive', 'Discharged']).optional(),
    therapistId: z.string().optional(),
  }).optional(),
});

// Type exports
export type PatientFormData = z.infer<typeof patientSchema>;
export type MedicalHistoryFormData = z.infer<typeof medicalHistorySchema>;
export type TrackedMetricFormData = z.infer<typeof trackedMetricSchema>;
export type MetricResultFormData = z.infer<typeof metricResultSchema>;
export type PainLogFormData = z.infer<typeof painLogSchema>;
export type PatientSearchFormData = z.infer<typeof patientSearchSchema>;