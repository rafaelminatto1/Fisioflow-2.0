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
    
    // Show user-friendly toast notification
    if (showToast && typeof window !== 'undefined') {
      // Dynamically import toast to avoid circular dependencies
      import('../contexts/ToastContext').then(({ useToast }) => {
        // This won't work directly since useToast is a hook
        // We'll handle this in the component level instead
      }).catch(() => {
        // Fallback to console if toast is not available
        console.warn('Toast system not available for error notification');
      });
    }
    
    if (onError) {
      onError(error, { context });
    }

    // Send to error logging service
    import('../services/errorLoggingService').then(({ default: errorLoggingService }) => {
      errorLoggingService.logError(error, {
        level: 'component',
        context: context || 'manual_report',
      }).catch((loggingError) => {
        console.error('Failed to log error:', loggingError);
      });
    }).catch(() => {
      console.warn('Error logging service not available');
    });
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