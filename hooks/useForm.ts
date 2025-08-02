import { useForm as useHookForm, UseFormReturn, UseFormProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodSchema, ZodType, ZodTypeDef } from 'zod';
import { useCallback, useEffect } from 'react';

interface UseFormOptions<T> extends Omit<UseFormProps<T>, 'resolver'> {
  schema: ZodType<T, ZodTypeDef, T>;
  onSubmit?: (data: T) => void | Promise<void>;
  onError?: (errors: any) => void;
  transformOnSubmit?: (data: T) => T;
  resetOnSubmitSuccess?: boolean;
}

interface UseFormResult<T> extends UseFormReturn<T> {
  submitHandler: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
  hasErrors: boolean;
  isDirty: boolean;
  isValid: boolean;
}

export const useForm = <T extends Record<string, any>>({
  schema,
  onSubmit,
  onError,
  transformOnSubmit,
  resetOnSubmitSuccess = false,
  ...options
}: UseFormOptions<T>): UseFormResult<T> => {
  const form = useHookForm<T>({
    resolver: zodResolver(schema as any),
    mode: 'onChange',
    ...options,
  });

  const {
    handleSubmit,
    formState: { isSubmitting, errors, isDirty, isValid },
    reset,
  } = form;

  const submitHandler = useCallback(
    async (data: T) => {
      try {
        const transformedData = transformOnSubmit ? transformOnSubmit(data) : data;
        
        if (onSubmit) {
          await onSubmit(transformedData);
          
          if (resetOnSubmitSuccess) {
            reset();
          }
        }
      } catch (error) {
        console.error('Form submission error:', error);
        if (onError) {
          onError(error);
        }
      }
    },
    [onSubmit, onError, transformOnSubmit, resetOnSubmitSuccess, reset]
  );

  const hasErrors = Object.keys(errors).length > 0;

  return {
    ...form,
    submitHandler: handleSubmit(submitHandler),
    isSubmitting,
    hasErrors,
    isDirty,
    isValid,
  };
};

export default useForm;