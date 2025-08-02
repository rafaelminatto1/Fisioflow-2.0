import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Toast from '../../../components/ui/Toast';
import type { ToastMessage } from '../../../contexts/ToastContext';

const mockToast: ToastMessage = {
  id: '1',
  message: 'Test message',
  type: 'success',
  duration: 3000
};

const mockOnRemove = vi.fn();
const mockOnDismiss = vi.fn();

describe('Toast Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render toast with message', () => {
    render(<Toast toast={mockToast} onRemove={mockOnRemove} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should render success toast with correct styling', () => {
    render(<Toast toast={mockToast} onRemove={mockOnRemove} />);
    const toastElement = screen.getByText('Test message').closest('div[class*="bg-green-50"]');
    expect(toastElement).toBeInTheDocument();
    expect(toastElement).toHaveClass('border-green-200');
  });

  it('should render error toast with correct styling', () => {
    const errorToast = { ...mockToast, type: 'error' as const };
    render(<Toast toast={errorToast} onRemove={mockOnRemove} />);
    const toastElement = screen.getByText('Test message').closest('div[class*="bg-red-50"]');
    expect(toastElement).toBeInTheDocument();
    expect(toastElement).toHaveClass('border-red-200');
  });

  it('should render warning toast with correct styling', () => {
    const warningToast = { ...mockToast, type: 'warning' as const };
    render(<Toast toast={warningToast} onRemove={mockOnRemove} />);
    const toastElement = screen.getByText('Test message').closest('div[class*="bg-amber-50"]');
    expect(toastElement).toBeInTheDocument();
    expect(toastElement).toHaveClass('border-amber-200');
  });

  it('should render info toast with correct styling', () => {
    const infoToast = { ...mockToast, type: 'info' as const };
    render(<Toast toast={infoToast} onRemove={mockOnRemove} />);
    const toastElement = screen.getByText('Test message').closest('div[class*="bg-blue-50"]');
    expect(toastElement).toBeInTheDocument();
    expect(toastElement).toHaveClass('border-blue-200');
  });

  it('should call onRemove when close button is clicked', async () => {
    render(<Toast toast={mockToast} onRemove={mockOnRemove} />);
    const closeButton = screen.getByText('Fechar');
    fireEvent.click(closeButton.closest('button')!);
    
    // Wait for the animation delay
    await new Promise(resolve => setTimeout(resolve, 350));
    
    expect(mockOnRemove).toHaveBeenCalledWith(mockToast.id);
  });

  it('should render action button when action is provided', () => {
    const toastWithAction = {
      ...mockToast,
      action: {
        label: 'Undo',
        onClick: vi.fn()
      }
    };
    render(<Toast toast={toastWithAction} onRemove={mockOnRemove} />);
    expect(screen.getByText('Undo')).toBeInTheDocument();
  });

  it('should call action onClick when action button is clicked', () => {
    const actionOnClick = vi.fn();
    const toastWithAction = {
      ...mockToast,
      action: {
        label: 'Undo',
        onClick: actionOnClick
      }
    };
    render(<Toast toast={toastWithAction} onRemove={mockOnRemove} />);
    const actionButton = screen.getByText('Undo');
    fireEvent.click(actionButton);
    expect(actionOnClick).toHaveBeenCalled();
  });

  it('should show close button even for persistent toasts', () => {
    const persistentToast = { ...mockToast, persistent: true };
    render(<Toast toast={persistentToast} onRemove={mockOnRemove} />);
    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeInTheDocument();
  });
});