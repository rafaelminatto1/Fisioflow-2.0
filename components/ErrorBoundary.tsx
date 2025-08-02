import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  level?: 'page' | 'component' | 'app';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error details
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToService(error, errorInfo);
    }
  }

  private reportErrorToService = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      const { default: errorLoggingService } = await import('../services/errorLoggingService');
      
      await errorLoggingService.logError(error, {
        level: this.props.level || 'component',
        context: `error_boundary:${this.props.level || 'component'}`,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
      });
    } catch (loggingError) {
      console.error('Failed to log error through error logging service:', loggingError);
      
      // Ultimate fallback to localStorage
      try {
        const errorLog = {
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack,
          url: window.location.href,
          level: this.props.level || 'component',
          retryCount: this.state.retryCount,
        };
        
        const existingLogs = JSON.parse(localStorage.getItem('fisioflow_error_fallback') || '[]');
        existingLogs.push(errorLog);
        
        // Keep only last 50 errors
        if (existingLogs.length > 50) {
          existingLogs.splice(0, existingLogs.length - 50);
        }
        
        localStorage.setItem('fisioflow_error_fallback', JSON.stringify(existingLogs));
      } catch (storageError) {
        console.error('Complete error logging failure:', storageError);
      }
    }
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render different layouts based on error level
      return this.renderErrorUI();
    }

    return this.props.children;
  }

  private renderErrorUI() {
    const { level = 'component', enableRetry = true } = this.props;
    const { error, retryCount } = this.state;

    const canRetry = enableRetry && retryCount < this.maxRetries;
    const isDevMode = process.env.NODE_ENV === 'development';

    if (level === 'component') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-2">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Erro no componente
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Este componente encontrou um erro inesperado.
              </p>
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md transition-colors"
                >
                  <RefreshCw className="h-4 w-4 inline mr-1" />
                  Tentar novamente ({this.maxRetries - retryCount} restantes)
                </button>
              )}
            </div>
          </div>
          {isDevMode && error && (
            <details className="mt-3 text-xs text-red-600">
              <summary className="cursor-pointer font-medium">Detalhes do erro (dev)</summary>
              <pre className="mt-2 whitespace-pre-wrap bg-red-100 p-2 rounded">
                {error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    if (level === 'page') {
      return (
        <div className="min-h-96 flex items-center justify-center bg-slate-50 p-4">
          <div className="text-center bg-white p-8 rounded-lg shadow-sm border max-w-md">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
            <h2 className="mt-4 text-lg font-semibold text-slate-800">
              Erro na página
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Esta página encontrou um problema. Tente novamente ou volte ao início.
            </p>
            <div className="mt-4 space-x-3">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="inline-flex items-center px-4 py-2 text-sm bg-teal-500 hover:bg-teal-600 text-white rounded-md transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Tentar novamente
                </button>
              )}
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center px-4 py-2 text-sm bg-slate-500 hover:bg-slate-600 text-white rounded-md transition-colors"
              >
                <Home className="h-4 w-4 mr-1" />
                Ir ao início
              </button>
            </div>
          </div>
        </div>
      );
    }

    // App-level error (full screen)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-lg">
          <AlertTriangle className="mx-auto h-16 w-16 text-red-400" />
          <h1 className="mt-4 text-2xl font-bold text-slate-800">
            Oops! Algo deu errado
          </h1>
          <p className="mt-2 text-slate-600">
            A aplicação encontrou um erro inesperado. Nossa equipe foi notificada.
          </p>
          
          {isDevMode && error && (
            <details className="mt-4 text-left bg-slate-50 p-3 rounded-lg text-xs text-slate-500">
              <summary className="cursor-pointer font-medium">Detalhes do erro (dev)</summary>
              <pre className="mt-2 whitespace-pre-wrap">
                {error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <div className="mt-6 space-x-3">
            {canRetry && (
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center rounded-lg bg-teal-500 px-5 py-3 text-base font-medium text-white shadow-sm hover:bg-teal-600 transition-colors"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Tentar novamente
              </button>
            )}
            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-base font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              Recarregar página
            </button>
          </div>

          {retryCount >= this.maxRetries && (
            <p className="mt-3 text-sm text-slate-500">
              Máximo de tentativas atingido. Tente recarregar a página.
            </p>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
