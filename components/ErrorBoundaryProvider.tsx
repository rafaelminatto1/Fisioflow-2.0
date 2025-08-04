import { createContext, useContext, ReactNode, useCallback } from 'react';
import ErrorBoundary from './ErrorBoundary';

interface ErrorContextType {
  reportError: (error: Error, context?: string, showToast?: boolean) => void;
  handleAsyncError: (promise: Promise<any>, context?: string) => Promise<any>;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

interface ErrorBoundaryProviderProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

export const ErrorBoundaryProvider = ({ children, onError }: ErrorBoundaryProviderProps) => {
  const reportError = useCallback((error: Error, context?: string, showToast = true) => {
    console.error(`Error in ${context || 'unknown context'}:`, error);
    
    // Show user-friendly notification (simplified approach)
    if (showToast && typeof window !== 'undefined') {
      // Create a simple notification without external dependencies
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        max-width: 400px;
      `;
      notification.textContent = `Erro: ${error.message}`;
      document.body.appendChild(notification);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 5000);
    }
    
    if (onError) {
      onError(error, { context });
    }

    // Send to error logging service (safer approach without dynamic imports)
    try {
      // Use a simplified logging approach to avoid import issues
      const errorData = {
        message: error.message,
        stack: error.stack,
        context: context || 'manual_report',
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
      };
      
      // Store in localStorage as fallback
      if (typeof window !== 'undefined' && window.localStorage) {
        const errors = JSON.parse(localStorage.getItem('fisioflow_errors') || '[]');
        errors.push(errorData);
        // Keep only last 50 errors
        if (errors.length > 50) errors.splice(0, errors.length - 50);
        localStorage.setItem('fisioflow_errors', JSON.stringify(errors));
      }
    } catch (loggingError) {
      console.warn('Failed to store error locally:', loggingError);
    }
  }, [onError]);

  const handleAsyncError = useCallback(async (promise: Promise<any>, context?: string) => {
    try {
      return await promise;
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), context);
      throw error; // Re-throw so calling code can handle it appropriately
    }
  }, [reportError]);

  return (
    <ErrorContext.Provider value={{ reportError, handleAsyncError }}>
      <ErrorBoundary level="app" onError={onError}>
        {children}
      </ErrorBoundary>
    </ErrorContext.Provider>
  );
};

export const useErrorHandler = () => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useErrorHandler must be used within an ErrorBoundaryProvider');
  }
  return context;
};

// HOC for wrapping components with error boundaries
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryConfig?: {
    level?: 'page' | 'component';
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: any) => void;
  }
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary
      level={errorBoundaryConfig?.level || 'component'}
      fallback={errorBoundaryConfig?.fallback}
      onError={errorBoundaryConfig?.onError}
    >
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Higher-order component for pages
export const withPageErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>
) => withErrorBoundary(Component, { level: 'page' });

export default ErrorBoundaryProvider;