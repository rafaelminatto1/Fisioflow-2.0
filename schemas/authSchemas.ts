import { z } from 'zod';
import { validationMessages, patterns, isValidCPF } from '../utils/formUtils';
import { Role } from '../types';

// Base validation schemas
export const emailSchema = z
  .string()
  .min(1, validationMessages.required)
  .email(validationMessages.email);

export const passwordSchema = z
  .string()
  .min(8, validationMessages.minLength(8))
  .regex(patterns.strongPassword, validationMessages.strongPassword);

export const nameSchema = z
  .string()
  .min(1, validationMessages.required)
  .min(2, validationMessages.minLength(2))
  .max(100, validationMessages.maxLength(100))
  .regex(patterns.onlyLetters, 'Nome deve conter apenas letras');

export const phoneSchema = z
  .string()
  .min(1, validationMessages.required)
  .regex(patterns.phone, validationMessages.phone);

export const cpfSchema = z
  .string()
  .min(1, validationMessages.required)
  .refine((value) => isValidCPF(value), validationMessages.cpf);

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, validationMessages.required),
});

export const registerSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  role: z.nativeEnum(Role),
  phone: phoneSchema.optional(),
  terms: z.boolean().refine((val) => val === true, {
    message: 'Você deve aceitar os termos de uso',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: validationMessages.passwordMismatch,
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: validationMessages.passwordMismatch,
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, validationMessages.required),
  newPassword: passwordSchema,
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: validationMessages.passwordMismatch,
  path: ['confirmNewPassword'],
});

export const updateProfileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema.optional(),
  avatar: z.string().url().optional().or(z.literal('')),
  preferences: z.record(z.any()).optional(),
});

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;