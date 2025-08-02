import { useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useErrorHandler } from '../components/ErrorBoundaryProvider';

interface UseErrorHandlingOptions {
  showToast?: boolean;
  toastMessage?: string;
  context?: string;
}

export const useErrorHandling = () => {
  const { reportError, handleAsyncError } = useErrorHandler();
  const { error: showErrorToast } = useToast();

  const handleError = useCallback((
    error: Error, 
    options: UseErrorHandlingOptions = {}
  ) => {
    const { 
      showToast = true, 
      toastMessage = 'Ocorreu um erro inesperado. Tente novamente.',
      context 
    } = options;

    // Report error through error boundary system
    reportError(error, context, false); // Don't let ErrorBoundary handle toast

    // Show user-friendly toast
    if (showToast) {
      showErrorToast(toastMessage, {
        action: {
          label: 'Reportar',
          onClick: () => {
            // Could open a feedback modal or send additional details
            console.log('User requested to report error:', error.message);
          }
        }
      });
    }
  }, [reportError, showErrorToast]);

  const handleAsyncOperation = useCallback(async <T>(
    asyncOperation: () => Promise<T>,
    options: UseErrorHandlingOptions = {}
  ): Promise<T | null> => {
    try {
      return await handleAsyncError(asyncOperation(), options.context);
    } catch (error) {
      handleError(
        error instanceof Error ? error : new Error(String(error)),
        options
      );
      return null;
    }
  }, [handleAsyncError, handleError]);

  const wrapAsyncFunction = useCallback(<TArgs extends any[], TReturn>(
    asyncFn: (...args: TArgs) => Promise<TReturn>,
    options: UseErrorHandlingOptions = {}
  ) => {
    return async (...args: TArgs): Promise<TReturn | null> => {
      return handleAsyncOperation(() => asyncFn(...args), options);
    };
  }, [handleAsyncOperation]);

  return {
    handleError,
    handleAsyncOperation,
    wrapAsyncFunction,
    reportError: (error: Error, context?: string) => reportError(error, context, false),
  };
};

// Hook for handling form submission errors specifically
export const useFormErrorHandling = () => {
  const { handleError } = useErrorHandling();

  const handleFormError = useCallback((error: Error, fieldName?: string) => {
    const context = fieldName ? `form_field:${fieldName}` : 'form_submission';
    const message = fieldName 
      ? `Erro no campo "${fieldName}". Verifique os dados e tente novamente.`
      : 'Erro ao enviar formulário. Verifique os dados e tente novamente.';

    handleError(error, {
      context,
      toastMessage: message,
    });
  }, [handleError]);

  return { handleFormError };
};

// Hook for API call error handling
export const useApiErrorHandling = () => {
  const { handleError } = useErrorHandling();

  const handleApiError = useCallback((error: Error, operation?: string) => {
    const context = operation ? `api:${operation}` : 'api_call';
    
    // Different messages based on error type
    let message = 'Erro de conexão. Verifique sua internet e tente novamente.';
    
    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      message = 'Sua sessão expirou. Faça login novamente.';
    } else if (error.message.includes('forbidden') || error.message.includes('403')) {
      message = 'Você não tem permissão para esta ação.';
    } else if (error.message.includes('not found') || error.message.includes('404')) {
      message = 'Recurso não encontrado.';
    } else if (error.message.includes('server') || error.message.includes('500')) {
      message = 'Erro interno do servidor. Tente novamente em alguns minutos.';
    }

    handleError(error, {
      context,
      toastMessage: message,
    });
  }, [handleError]);

  return { handleApiError };
};