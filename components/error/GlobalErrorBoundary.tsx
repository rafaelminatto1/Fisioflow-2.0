import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Gerar ID único para o erro
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || 'unknown';
    
    // Log detalhado do erro
    console.error('Global Error Boundary caught an error:', {
      errorId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    });

    // Atualizar state com informações do erro
    this.setState({
      error,
      errorInfo
    });

    // Chamar callback personalizado se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Reportar erro para serviço de monitoramento
    this.reportError(error, errorInfo, errorId);

    // Tentar recuperação automática para certos tipos de erro
    this.attemptAutoRecovery(error);
  }

  /**
   * Reporta erro para serviços de monitoramento
   */
  private reportError(error: Error, errorInfo: ErrorInfo, errorId: string): void {
    try {
      // Exemplo com Sentry (se disponível)
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.withScope((scope: any) => {
          scope.setTag('errorBoundary', 'GlobalErrorBoundary');
          scope.setContext('errorInfo', {
            componentStack: errorInfo.componentStack,
            errorId
          });
          (window as any).Sentry.captureException(error);
        });
      }

      // Log para analytics personalizado
      if (typeof gtag !== 'undefined') {
        gtag('event', 'exception', {
          description: error.message,
          fatal: true,
          error_id: errorId
        });
      }

      // Armazenar localmente para debug
      const errorReport = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        retryCount: this.retryCount
      };

      const storedErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      storedErrors.push(errorReport);
      
      // Manter apenas os últimos 10 erros
      if (storedErrors.length > 10) {
        storedErrors.splice(0, storedErrors.length - 10);
      }
      
      localStorage.setItem('app_errors', JSON.stringify(storedErrors));

    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  /**
   * Tenta recuperação automática para certos tipos de erro
   */
  private attemptAutoRecovery(error: Error): void {
    // Recuperação automática para erros de rede
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      setTimeout(() => {
        if (this.retryCount < this.maxRetries) {
          this.handleRetry();
        }
      }, 2000);
    }

    // Recuperação automática para erros de chunk loading (lazy loading)
    if (error.message.includes('Loading chunk') || error.message.includes('ChunkLoadError')) {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  /**
   * Tenta recuperar do erro
   */
  private handleRetry = (): void => {
    this.retryCount++;
    
    console.log(`Attempting error recovery (attempt ${this.retryCount}/${this.maxRetries})`);
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  /**
   * Recarrega a página
   */
  private handleReload = (): void => {
    window.location.reload();
  };

  /**
   * Navega para página inicial
   */
  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  /**
   * Copia detalhes do erro para clipboard
   */
  private handleCopyError = async (): Promise<void> => {
    if (!this.state.error || !this.state.errorInfo) return;

    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error.message,
      stack: this.state.error.stack,
      componentStack: this.state.errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
      alert('Detalhes do erro copiados para a área de transferência!');
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  /**
   * Determina se o erro é crítico
   */
  private isCriticalError(error: Error): boolean {
    const criticalPatterns = [
      'SecurityError',
      'ReferenceError',
      'SyntaxError',
      'Cannot read properties of undefined'
    ];

    return criticalPatterns.some(pattern => 
      error.message.includes(pattern) || error.name.includes(pattern)
    );
  }

  /**
   * Gera sugestões baseadas no tipo de erro
   */
  private getErrorSuggestions(error: Error): string[] {
    const suggestions: string[] = [];

    if (error.message.includes('Network') || error.message.includes('fetch')) {
      suggestions.push('Verifique sua conexão com a internet');
      suggestions.push('Tente novamente em alguns minutos');
    }

    if (error.message.includes('Loading chunk')) {
      suggestions.push('Limpe o cache do navegador');
      suggestions.push('Atualize a página');
    }

    if (error.message.includes('undefined') || error.message.includes('null')) {
      suggestions.push('Este pode ser um erro temporário');
      suggestions.push('Tente fazer logout e login novamente');
    }

    if (suggestions.length === 0) {
      suggestions.push('Tente recarregar a página');
      suggestions.push('Se o problema persistir, entre em contato com o suporte');
    }

    return suggestions;
  }

  render() {
    if (this.state.hasError) {
      // Usar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error = this.state.error!;
      const isCritical = this.isCriticalError(error);
      const suggestions = this.getErrorSuggestions(error);
      const canRetry = this.retryCount < this.maxRetries && !isCritical;

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isCritical ? 'bg-red-100' : 'bg-yellow-100'
              }`}>
                <AlertTriangle className={`w-6 h-6 ${
                  isCritical ? 'text-red-600' : 'text-yellow-600'
                }`} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {isCritical ? 'Erro Crítico' : 'Algo deu errado'}
                </h1>
                <p className="text-sm text-gray-500">
                  ID do erro: {this.state.errorId}
                </p>
              </div>
            </div>

            {/* Error Message */}
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                Ocorreu um erro inesperado na aplicação.
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Detalhes técnicos
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto max-h-32">
                    <div className="font-semibold mb-1">Erro:</div>
                    <div className="mb-2">{error.message}</div>
                    {error.stack && (
                      <>
                        <div className="font-semibold mb-1">Stack:</div>
                        <div>{error.stack}</div>
                      </>
                    )}
                  </div>
                </details>
              )}
            </div>

            {/* Suggestions */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                O que você pode fazer:
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-gray-400 mt-1">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Tentar Novamente ({this.maxRetries - this.retryCount} tentativas restantes)
                </button>
              )}
              
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar Página
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                Ir para Início
              </button>

              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={this.handleCopyError}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Bug className="w-4 h-4" />
                  Copiar Detalhes do Erro
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">
                Se o problema persistir, entre em contato com o suporte técnico
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;