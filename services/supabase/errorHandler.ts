import type { AuthError, PostgrestError, StorageError } from '@supabase/supabase-js';

export interface SupabaseErrorInfo {
  type: 'auth' | 'database' | 'storage' | 'network' | 'unknown';
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
  details?: any;
}

/**
 * Centralized error handling for Supabase operations
 */
export class SupabaseErrorHandler {
  /**
   * Parse and categorize Supabase errors
   */
  static parseError(error: AuthError | PostgrestError | StorageError | Error | any): SupabaseErrorInfo {
    // Handle null/undefined errors
    if (!error) {
      return {
        type: 'unknown',
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
        userMessage: 'Ocorreu um erro desconhecido. Tente novamente.',
        retryable: true
      };
    }

    // Handle network errors
    if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
      return {
        type: 'network',
        code: 'NETWORK_ERROR',
        message: error.message || 'Network error',
        userMessage: 'Erro de conexão. Verifique sua internet e tente novamente.',
        retryable: true,
        details: error
      };
    }

    // Handle authentication errors
    if (this.isAuthError(error)) {
      return this.parseAuthError(error);
    }

    // Handle database errors
    if (this.isDatabaseError(error)) {
      return this.parseDatabaseError(error);
    }

    // Handle storage errors
    if (this.isStorageError(error)) {
      return this.parseStorageError(error);
    }

    // Handle generic errors
    return {
      type: 'unknown',
      code: error.code || 'GENERIC_ERROR',
      message: error.message || 'An error occurred',
      userMessage: 'Ocorreu um erro. Tente novamente.',
      retryable: true,
      details: error
    };
  }

  /**
   * Parse authentication errors
   */
  private static parseAuthError(error: AuthError): SupabaseErrorInfo {
    const errorMappings: Record<string, { userMessage: string; retryable: boolean }> = {
      'invalid_credentials': {
        userMessage: 'Email ou senha incorretos.',
        retryable: false
      },
      'email_not_confirmed': {
        userMessage: 'Por favor, confirme seu email antes de fazer login.',
        retryable: false
      },
      'signup_disabled': {
        userMessage: 'Cadastro temporariamente desabilitado.',
        retryable: false
      },
      'email_address_invalid': {
        userMessage: 'Endereço de email inválido.',
        retryable: false
      },
      'password_too_short': {
        userMessage: 'A senha deve ter pelo menos 6 caracteres.',
        retryable: false
      },
      'weak_password': {
        userMessage: 'A senha é muito fraca. Use uma senha mais forte.',
        retryable: false
      },
      'user_already_registered': {
        userMessage: 'Este email já está cadastrado.',
        retryable: false
      },
      'session_not_found': {
        userMessage: 'Sessão expirada. Faça login novamente.',
        retryable: false
      },
      'token_expired': {
        userMessage: 'Token expirado. Faça login novamente.',
        retryable: false
      },
      'refresh_token_not_found': {
        userMessage: 'Sessão inválida. Faça login novamente.',
        retryable: false
      }
    };

    const mapping = errorMappings[error.message] || {
      userMessage: 'Erro de autenticação. Tente novamente.',
      retryable: true
    };

    return {
      type: 'auth',
      code: error.message || 'AUTH_ERROR',
      message: error.message || 'Authentication error',
      userMessage: mapping.userMessage,
      retryable: mapping.retryable,
      details: error
    };
  }

  /**
   * Parse database errors
   */
  private static parseDatabaseError(error: PostgrestError): SupabaseErrorInfo {
    const errorMappings: Record<string, { userMessage: string; retryable: boolean }> = {
      'PGRST116': {
        userMessage: 'Registro não encontrado.',
        retryable: false
      },
      'PGRST301': {
        userMessage: 'Acesso negado a este recurso.',
        retryable: false
      },
      '23505': { // unique_violation
        userMessage: 'Este registro já existe.',
        retryable: false
      },
      '23503': { // foreign_key_violation
        userMessage: 'Não é possível excluir este registro pois está sendo usado.',
        retryable: false
      },
      '23502': { // not_null_violation
        userMessage: 'Campos obrigatórios não foram preenchidos.',
        retryable: false
      },
      '42P01': { // undefined_table
        userMessage: 'Recurso não disponível no momento.',
        retryable: true
      },
      '42703': { // undefined_column
        userMessage: 'Erro de configuração. Contate o suporte.',
        retryable: false
      }
    };

    const mapping = errorMappings[error.code] || {
      userMessage: 'Erro no banco de dados. Tente novamente.',
      retryable: true
    };

    return {
      type: 'database',
      code: error.code || 'DATABASE_ERROR',
      message: error.message || 'Database error',
      userMessage: mapping.userMessage,
      retryable: mapping.retryable,
      details: error
    };
  }

  /**
   * Parse storage errors
   */
  private static parseStorageError(error: StorageError): SupabaseErrorInfo {
    const errorMappings: Record<string, { userMessage: string; retryable: boolean }> = {
      'BucketNotFound': {
        userMessage: 'Local de armazenamento não encontrado.',
        retryable: false
      },
      'ObjectNotFound': {
        userMessage: 'Arquivo não encontrado.',
        retryable: false
      },
      'InvalidBucketName': {
        userMessage: 'Nome do local de armazenamento inválido.',
        retryable: false
      },
      'PayloadTooLarge': {
        userMessage: 'Arquivo muito grande. Tamanho máximo permitido excedido.',
        retryable: false
      },
      'InvalidMimeType': {
        userMessage: 'Tipo de arquivo não permitido.',
        retryable: false
      },
      'DuplicateObject': {
        userMessage: 'Arquivo com este nome já existe.',
        retryable: false
      }
    };

    const mapping = errorMappings[error.message] || {
      userMessage: 'Erro no armazenamento de arquivos. Tente novamente.',
      retryable: true
    };

    return {
      type: 'storage',
      code: error.message || 'STORAGE_ERROR',
      message: error.message || 'Storage error',
      userMessage: mapping.userMessage,
      retryable: mapping.retryable,
      details: error
    };
  }

  /**
   * Check if error is an authentication error
   */
  private static isAuthError(error: any): error is AuthError {
    return error && (
      error.__isAuthError === true ||
      error.status === 400 ||
      error.status === 401 ||
      error.status === 403 ||
      ['invalid_credentials', 'email_not_confirmed', 'signup_disabled'].includes(error.message)
    );
  }

  /**
   * Check if error is a database error
   */
  private static isDatabaseError(error: any): error is PostgrestError {
    return error && (
      error.code !== undefined ||
      error.hint !== undefined ||
      error.details !== undefined ||
      typeof error.code === 'string'
    );
  }

  /**
   * Check if error is a storage error
   */
  private static isStorageError(error: any): error is StorageError {
    return error && (
      error.statusCode !== undefined ||
      ['BucketNotFound', 'ObjectNotFound', 'PayloadTooLarge'].includes(error.message)
    );
  }

  /**
   * Determine if an error should trigger a retry
   */
  static shouldRetry(error: SupabaseErrorInfo, attemptCount: number = 0): boolean {
    if (!error.retryable || attemptCount >= 3) {
      return false;
    }

    // Don't retry auth errors or validation errors
    if (error.type === 'auth' || error.code.includes('validation')) {
      return false;
    }

    // Retry network errors and some database errors
    return error.type === 'network' || 
           (error.type === 'database' && ['42P01', 'connection'].some(code => error.code.includes(code)));
  }

  /**
   * Get retry delay in milliseconds (exponential backoff)
   */
  static getRetryDelay(attemptCount: number): number {
    return Math.min(1000 * Math.pow(2, attemptCount), 10000);
  }

  /**
   * Log error for monitoring/debugging
   */
  static logError(error: SupabaseErrorInfo, context?: string): void {
    const logData = {
      timestamp: new Date().toISOString(),
      context: context || 'unknown',
      type: error.type,
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      details: error.details
    };

    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.error('Supabase Error:', logData);
    }

    // In production, you might want to send to a logging service
    // Example: sendToLoggingService(logData);
  }
}

export default SupabaseErrorHandler;