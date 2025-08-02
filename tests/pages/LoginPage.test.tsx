import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render, mockUsers } from '../../src/test/utils';
import { mockSupabaseHelpers } from '../../src/test/mocks/supabase';
import LoginPage from '../../pages/LoginPage';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocation = { state: null };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
    Link: ({ children, to, ...props }: any) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    mockSupabaseHelpers.resetMocks();
    mockNavigate.mockClear();
  });

  it('should render login form', () => {
    render(<LoginPage />);
    
    expect(screen.getByText('FisioFlow')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    render(<LoginPage />);
    
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    
    // Clear the default values
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    
    fireEvent.change(emailInput, { target: { value: '' } });
    fireEvent.change(passwordInput, { target: { value: '' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Email é obrigatório')).toBeInTheDocument();
      expect(screen.getByText('Senha é obrigatória')).toBeInTheDocument();
    });
  });

  it('should show validation error for invalid email', async () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Email inválido')).toBeInTheDocument();
    });
  });

  it('should show validation error for short password', async () => {
    render(<LoginPage />);
    
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    
    fireEvent.change(passwordInput, { target: { value: '123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Senha deve ter pelo menos 6 caracteres')).toBeInTheDocument();
    });
  });

  it('should toggle password visibility', () => {
    render(<LoginPage />);
    
    const passwordInput = screen.getByLabelText(/senha/i);
    const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should handle successful login', async () => {
    mockSupabaseHelpers.setAuthUser(mockUsers.admin);
    
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    
    fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  it('should handle login error', async () => {
    mockSupabaseHelpers.setMockError('Invalid credentials');
    
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    
    fireEvent.change(emailInput, { target: { value: 'wrong@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('should redirect patient to patient portal', async () => {
    mockSupabaseHelpers.setAuthUser(mockUsers.patient);
    
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    
    fireEvent.change(emailInput, { target: { value: 'patient@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/portal/dashboard', { replace: true });
    });
  });

  it('should redirect partner to partner portal', async () => {
    mockSupabaseHelpers.setAuthUser(mockUsers.partner);
    
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    
    fireEvent.change(emailInput, { target: { value: 'partner@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/partner/dashboard', { replace: true });
    });
  });

  it('should show forgot password form', () => {
    render(<LoginPage />);
    
    const forgotPasswordLink = screen.getByText('Esqueceu a senha?');
    fireEvent.click(forgotPasswordLink);
    
    expect(screen.getByText('Recuperar Senha')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar email/i })).toBeInTheDocument();
  });

  it('should handle forgot password submission', async () => {
    render(<LoginPage />);
    
    // Open forgot password form
    const forgotPasswordLink = screen.getByText('Esqueceu a senha?');
    fireEvent.click(forgotPasswordLink);
    
    // Fill and submit form
    const emailInput = screen.getByPlaceholderText('seu@email.com');
    const submitButton = screen.getByRole('button', { name: /enviar email/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    // Should show loading state
    expect(screen.getByRole('button', { name: /enviar email/i })).toBeDisabled();
    
    // Should return to login form after success
    await waitFor(() => {
      expect(screen.getByText('FisioFlow')).toBeInTheDocument();
      expect(screen.queryByText('Recuperar Senha')).not.toBeInTheDocument();
    });
  });

  it('should show register link', () => {
    render(<LoginPage />);
    
    const registerLink = screen.getByText('Cadastre-se');
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('should show test accounts information', () => {
    render(<LoginPage />);
    
    expect(screen.getByText('admin@fisioflow.com')).toBeInTheDocument();
    expect(screen.getByText('therapist@fisioflow.com')).toBeInTheDocument();
    expect(screen.getByText('patient@fisioflow.com')).toBeInTheDocument();
    expect(screen.getByText('password123')).toBeInTheDocument();
  });

  it('should show loading state during login', async () => {
    // Mock a delayed response
    mockSupabaseHelpers.setAuthUser(mockUsers.admin);
    
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    
    fireEvent.change(emailInput, { target: { value: 'admin@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    // Should show loading state
    expect(submitButton).toBeDisabled();
    expect(screen.getByRole('button')).toHaveClass('disabled:bg-blue-300');
  });

  it('should preserve redirect location after login', async () => {
    // Mock location with redirect state
    mockLocation.state = { from: { pathname: '/patients' } };
    mockSupabaseHelpers.setAuthUser(mockUsers.therapist);
    
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    
    fireEvent.change(emailInput, { target: { value: 'therapist@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/patients', { replace: true });
    });
  });
});