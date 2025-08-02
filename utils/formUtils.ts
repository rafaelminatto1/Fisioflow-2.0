import { UseFormReturn } from 'react-hook-form';
import { ZodSchema, ZodError } from 'zod';

/**
 * Create form configuration with Zod validation
 */
export interface FormConfig<T> {
  schema: ZodSchema<T>;
  defaultValues?: Partial<T>;
  mode?: 'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all';
}

/**
 * Parse form errors from Zod validation
 */
export const parseZodErrors = (error: ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  
  return errors;
};

/**
 * Common form validation messages in Portuguese
 */
export const validationMessages = {
  required: 'Este campo é obrigatório',
  email: 'Digite um email válido',
  minLength: (min: number) => `Mínimo de ${min} caracteres`,
  maxLength: (max: number) => `Máximo de ${max} caracteres`,
  min: (min: number) => `Valor mínimo: ${min}`,
  max: (max: number) => `Valor máximo: ${max}`,
  pattern: 'Formato inválido',
  passwordMismatch: 'As senhas não coincidem',
  phone: 'Digite um telefone válido',
  cpf: 'Digite um CPF válido',
  cnpj: 'Digite um CNPJ válido',
  date: 'Digite uma data válida',
  time: 'Digite um horário válido',
  url: 'Digite uma URL válida',
  strongPassword: 'A senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e número',
};

/**
 * Common regex patterns for validation
 */
export const patterns = {
  email: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  phone: /^(\+55\s?)?(\(?[1-9]{2}\)?\s?)?([9]?\d{4}[-.\s]?\d{4})$/,
  cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  cnpj: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  onlyNumbers: /^\d+$/,
  onlyLetters: /^[a-zA-ZÀ-ÿ\s]+$/,
  alphanumeric: /^[a-zA-Z0-9À-ÿ\s]+$/,
};

/**
 * Format phone number for display
 */
export const formatPhone = (phone: string): string => {
  const numbers = phone.replace(/\D/g, '');
  
  if (numbers.length === 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (numbers.length === 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};

/**
 * Format CPF for display
 */
export const formatCPF = (cpf: string): string => {
  const numbers = cpf.replace(/\D/g, '');
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Format CNPJ for display
 */
export const formatCNPJ = (cnpj: string): string => {
  const numbers = cnpj.replace(/\D/g, '');
  return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

/**
 * Remove formatting from string (keep only numbers)
 */
export const removeFormatting = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Validate CPF algorithm
 */
export const isValidCPF = (cpf: string): boolean => {
  const numbers = removeFormatting(cpf);
  
  if (numbers.length !== 11 || /^(.)\1*$/.test(numbers)) {
    return false;
  }
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers.charAt(i)) * (10 - i);
  }
  
  let remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers.charAt(i)) * (11 - i);
  }
  
  remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  
  return remainder === parseInt(numbers.charAt(10));
};

/**
 * Validate CNPJ algorithm
 */
export const isValidCNPJ = (cnpj: string): boolean => {
  const numbers = removeFormatting(cnpj);
  
  if (numbers.length !== 14 || /^(.)\1*$/.test(numbers)) {
    return false;
  }
  
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers.charAt(i)) * weights1[i];
  }
  
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (digit1 !== parseInt(numbers.charAt(12))) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers.charAt(i)) * weights2[i];
  }
  
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return digit2 === parseInt(numbers.charAt(13));
};

/**
 * Transform form data before submission
 */
export const transformFormData = <T extends Record<string, any>>(
  data: T, 
  transformers: Partial<Record<keyof T, (value: unknown) => unknown>>
): T => {
  const transformed = { ...data };
  
  Object.entries(transformers).forEach(([key, transformer]) => {
    if (transformer && key in transformed) {
      const typedKey = key as keyof T;
      transformed[typedKey] = transformer(transformed[typedKey]) as T[keyof T];
    }
  });
  
  return transformed;
};

/**
 * Reset form with optional new default values
 */
export const resetFormWithDefaults = <T>(
  form: UseFormReturn<T>, 
  defaultValues?: Partial<T>
) => {
  form.reset(defaultValues as any);
  form.clearErrors();
};

/**
 * Check if form has unsaved changes
 */
export const hasUnsavedChanges = <T>(form: UseFormReturn<T>): boolean => {
  return form.formState.isDirty;
};

/**
 * Get form field error message
 */
export const getFieldError = <T>(form: UseFormReturn<T>, fieldName: keyof T): string | undefined => {
  const error = form.formState.errors[fieldName];
  if (error && typeof error === 'object' && 'message' in error) {
    return error.message as string;
  }
  return undefined;
};

export default {
  parseZodErrors,
  validationMessages,
  patterns,
  formatPhone,
  formatCPF,
  formatCNPJ,
  removeFormatting,
  isValidCPF,
  isValidCNPJ,
  transformFormData,
  resetFormWithDefaults,
  hasUnsavedChanges,
  getFieldError,
};