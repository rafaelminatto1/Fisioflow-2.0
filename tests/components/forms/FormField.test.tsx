import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import FormField from '../../../components/forms/FormField';

const schema = z.object({
  testField: z.string().min(1, 'Campo obrigatório'),
  testSelect: z.string().min(1, 'Selecione uma opção'),
  testTextarea: z.string().min(1, 'Campo obrigatório'),
});

type FormData = z.infer<typeof schema>;

const TestFormWrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm<FormData>({
    defaultValues: {
      testField: '',
      testSelect: '',
      testTextarea: '',
    }
  });

  return (
    <FormProvider {...methods}>
      <form>{children}</form>
    </FormProvider>
  );
};

describe('FormField Component', () => {
  it('should render input field with label', () => {
    render(
      <TestFormWrapper>
        <FormField
          name="testField"
          label="Test Field"
          placeholder="Enter text"
        />
      </TestFormWrapper>
    );

    expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should render select field with options', () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
    ];

    render(
      <TestFormWrapper>
        <FormField
          name="testSelect"
          label="Test Select"
          variant="select"
          options={options}
          placeholder="Select an option"
        />
      </TestFormWrapper>
    );

    expect(screen.getByLabelText('Test Select')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Select an option')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('should render textarea field', () => {
    render(
      <TestFormWrapper>
        <FormField
          name="testTextarea"
          label="Test Textarea"
          variant="textarea"
          placeholder="Enter long text"
          rows={4}
        />
      </TestFormWrapper>
    );

    expect(screen.getByLabelText('Test Textarea')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter long text')).toBeInTheDocument();
    
    const textarea = screen.getByRole('textbox');
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveAttribute('rows', '4');
  });

  it('should render description when provided', () => {
    render(
      <TestFormWrapper>
        <FormField
          name="testField"
          label="Test Field"
          description="This is a helpful description"
        />
      </TestFormWrapper>
    );

    expect(screen.getByText('This is a helpful description')).toBeInTheDocument();
  });

  it('should show required indicator', () => {
    render(
      <TestFormWrapper>
        <FormField
          name="testField"
          label="Test Field"
          required
        />
      </TestFormWrapper>
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should render disabled field', () => {
    render(
      <TestFormWrapper>
        <FormField
          name="testField"
          label="Test Field"
          disabled
        />
      </TestFormWrapper>
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should render custom field with render prop', () => {
    const customRender = vi.fn().mockReturnValue(
      <div data-testid="custom-field">Custom Field</div>
    );

    render(
      <TestFormWrapper>
        <FormField
          name="testField"
          label="Test Field"
          variant="custom"
          render={customRender}
        />
      </TestFormWrapper>
    );

    expect(screen.getByTestId('custom-field')).toBeInTheDocument();
    expect(customRender).toHaveBeenCalled();
  });

  it('should handle input change', () => {
    render(
      <TestFormWrapper>
        <FormField
          name="testField"
          label="Test Field"
        />
      </TestFormWrapper>
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(input).toHaveValue('test value');
  });

  it('should handle select change', () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
    ];

    render(
      <TestFormWrapper>
        <FormField
          name="testSelect"
          label="Test Select"
          variant="select"
          options={options}
        />
      </TestFormWrapper>
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'option1' } });
    
    expect(select).toHaveValue('option1');
  });

  it('should apply custom className', () => {
    render(
      <TestFormWrapper>
        <FormField
          name="testField"
          label="Test Field"
          className="custom-class"
        />
      </TestFormWrapper>
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-class');
  });
});