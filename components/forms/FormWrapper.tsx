import { ReactNode, FormHTMLAttributes } from 'react';
import { UseFormReturn, FormProvider } from 'react-hook-form';

interface FormWrapperProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  children: ReactNode;
  form: UseFormReturn<any>;
  onSubmit: (data: any) => void | Promise<void>;
  className?: string;
}

export const FormWrapper = ({ 
  children, 
  form, 
  onSubmit, 
  className = '',
  ...props 
}: FormWrapperProps) => {
  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  });

  return (
    <FormProvider {...form}>
      <form 
        onSubmit={handleSubmit}
        className={`space-y-4 ${className}`}
        noValidate
        {...props}
      >
        {children}
      </form>
    </FormProvider>
  );
};

export default FormWrapper;