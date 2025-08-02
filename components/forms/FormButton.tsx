import { ButtonHTMLAttributes, ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '../../utils/cn';

interface FormButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  disableOnInvalid?: boolean;
}

export const FormButton = ({ 
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  fullWidth = false,
  disableOnInvalid = false,
  className,
  disabled,
  type = 'button',
  ...props 
}: FormButtonProps) => {
  const formContext = useFormContext();
  const isFormInvalid = formContext ? !formContext.formState.isValid : false;
  const isSubmitting = formContext ? formContext.formState.isSubmitting : false;

  const isDisabled = disabled || loading || isSubmitting || (disableOnInvalid && isFormInvalid);

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-500 border border-slate-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-slate-700 hover:bg-slate-100 focus:ring-slate-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const widthClasses = fullWidth ? 'w-full' : '';

  const buttonClasses = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClasses,
    className
  );

  const showLoading = loading || isSubmitting;
  const displayText = showLoading && loadingText ? loadingText : children;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={buttonClasses}
      {...props}
    >
      {showLoading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {displayText}
    </button>
  );
};

// Specific button types for common form actions
export const SubmitButton = (props: Omit<FormButtonProps, 'type'>) => (
  <FormButton {...props} type="submit" disableOnInvalid />
);

export const CancelButton = (props: Omit<FormButtonProps, 'variant' | 'type'>) => (
  <FormButton {...props} variant="secondary" type="button" />
);

export const DeleteButton = (props: Omit<FormButtonProps, 'variant'>) => (
  <FormButton {...props} variant="danger" />
);

export default FormButton;