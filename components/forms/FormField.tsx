import { HTMLInputTypeAttribute, ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { cn } from '../../utils/cn';

interface BaseFormFieldProps {
  name: string;
  label?: string;
  description?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

interface InputFormFieldProps extends BaseFormFieldProps {
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'type' | 'required'>;
}

interface TextareaFormFieldProps extends BaseFormFieldProps {
  rows?: number;
  placeholder?: string;
  textareaProps?: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name' | 'required'>;
}

interface SelectFormFieldProps extends BaseFormFieldProps {
  options: { value: string | number; label: string; disabled?: boolean }[];
  placeholder?: string;
}

interface CustomFormFieldProps extends BaseFormFieldProps {
  render: (field: any, fieldState: any) => ReactNode;
}

type FormFieldProps = 
  | (InputFormFieldProps & { variant?: 'input' })
  | (TextareaFormFieldProps & { variant: 'textarea' })
  | (SelectFormFieldProps & { variant: 'select' })
  | (CustomFormFieldProps & { variant: 'custom' });

export const FormField = (props: FormFieldProps) => {
  const { control, formState: { errors } } = useFormContext();
  const error = errors[props.name];

  const baseInputClasses = cn(
    'w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm',
    'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
    'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
    'placeholder:text-slate-400',
    error && 'border-red-300 focus:ring-red-500 focus:border-red-500',
    props.className
  );

  const renderInput = (field: any): React.JSX.Element => {
    switch (props.variant) {
      case 'textarea':
        const textareaProps = props as TextareaFormFieldProps;
        return (
          <textarea
            {...field}
            id={props.name}
            rows={textareaProps.rows || 3}
            placeholder={textareaProps.placeholder}
            disabled={props.disabled}
            className={baseInputClasses}
            {...textareaProps.textareaProps}
          />
        );

      case 'select':
        const selectProps = props as SelectFormFieldProps;
        return (
          <select
            {...field}
            id={props.name}
            disabled={props.disabled}
            className={baseInputClasses}
          >
            {selectProps.placeholder && (
              <option value="" disabled>
                {selectProps.placeholder}
              </option>
            )}
            {selectProps.options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'custom':
        const customProps = props as CustomFormFieldProps;
        return customProps.render(field, { error }) as React.JSX.Element || <div />;

      default:
        const inputProps = props as InputFormFieldProps;
        return (
          <input
            {...field}
            type={inputProps.type || 'text'}
            id={props.name}
            placeholder={inputProps.placeholder}
            disabled={props.disabled}
            className={baseInputClasses}
            {...inputProps.inputProps}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      {props.label && (
        <label 
          htmlFor={props.name} 
          className="block text-sm font-medium text-slate-700"
        >
          {props.label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {props.description && (
        <p className="text-sm text-slate-500">{props.description}</p>
      )}

      <Controller
        name={props.name}
        control={control}
        render={({ field, fieldState }) => renderInput(field)}
      />

      {error && (
        <p className="text-sm text-red-600">
          {error.message as string}
        </p>
      )}
    </div>
  );
};

// Convenience components for specific field types
export const InputField = (props: Omit<InputFormFieldProps, 'variant'>) => (
  <FormField {...props} variant="input" />
);

export const TextareaField = (props: Omit<TextareaFormFieldProps, 'variant'>) => (
  <FormField {...props} variant="textarea" />
);

export const SelectField = (props: Omit<SelectFormFieldProps, 'variant'>) => (
  <FormField {...props} variant="select" />
);

export const CustomField = (props: Omit<CustomFormFieldProps, 'variant'>) => (
  <FormField {...props} variant="custom" />
);

export default FormField;