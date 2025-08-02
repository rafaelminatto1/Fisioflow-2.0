
import { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import Toast from '../components/ui/Toast';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

export interface ToastContextType {
  showToast: (
    message: string, 
    type?: ToastMessage['type'], 
    options?: {
      duration?: number;
      action?: ToastMessage['action'];
      persistent?: boolean;
    }
  ) => string;
  success: (message: string, options?: Omit<Parameters<ToastContextType['showToast']>[2], 'type'>) => string;
  error: (message: string, options?: Omit<Parameters<ToastContextType['showToast']>[2], 'type'>) => string;
  info: (message: string, options?: Omit<Parameters<ToastContextType['showToast']>[2], 'type'>) => string;
  warning: (message: string, options?: Omit<Parameters<ToastContextType['showToast']>[2], 'type'>) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const DEFAULT_DURATION = 5000;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((
    message: string, 
    type: ToastMessage['type'] = 'info',
    options: {
      duration?: number;
      action?: ToastMessage['action'];
      persistent?: boolean;
    } = {}
  ): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const duration = options.persistent ? undefined : (options.duration ?? DEFAULT_DURATION);
    
    const newToast: ToastMessage = {
      id,
      message,
      type,
      duration,
      action: options.action,
      persistent: options.persistent,
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after duration if not persistent
    if (!options.persistent && duration) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Convenience methods
  const success = useCallback((message: string, options = {}) => 
    showToast(message, 'success', options), [showToast]
  );

  const error = useCallback((message: string, options = {}) => 
    showToast(message, 'error', options), [showToast]
  );

  const info = useCallback((message: string, options = {}) => 
    showToast(message, 'info', options), [showToast]
  );

  const warning = useCallback((message: string, options = {}) => 
    showToast(message, 'warning', options), [showToast]
  );

  const contextValue: ToastContextType = {
    showToast,
    success,
    error,
    info,
    warning,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
        {toasts.map(toast => (
          <Toast 
            key={toast.id} 
            toast={toast} 
            onRemove={removeToast} 
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
