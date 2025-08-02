import { DatabaseService } from './supabase';

interface ErrorLog {
  message: string;
  stack?: string;
  component_stack?: string;
  context?: string;
  level: 'component' | 'page' | 'app' | 'api' | 'form';
  user_agent: string;
  url: string;
  timestamp: string;
  user_id?: string;
  retry_count?: number;
  session_id?: string;
}

class ErrorLoggingService {
  private static instance: ErrorLoggingService;
  private isOnline = navigator.onLine;
  private errorQueue: ErrorLog[] = [];
  private readonly MAX_QUEUE_SIZE = 50;
  private readonly STORAGE_KEY = 'fisioflow_error_queue';

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', this.processErrorQueue.bind(this));
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Load queued errors from localStorage
    this.loadQueueFromStorage();

    // Process queue on initialization if online
    if (this.isOnline) {
      this.processErrorQueue();
    }
  }

  static getInstance(): ErrorLoggingService {
    if (!ErrorLoggingService.instance) {
      ErrorLoggingService.instance = new ErrorLoggingService();
    }
    return ErrorLoggingService.instance;
  }

  async logError(
    error: Error, 
    options: {
      level?: ErrorLog['level'];
      context?: string;
      componentStack?: string;
      userId?: string;
      retryCount?: number;
    } = {}
  ): Promise<void> {
    const errorLog: ErrorLog = {
      message: error.message,
      stack: error.stack,
      component_stack: options.componentStack,
      context: options.context || 'unknown',
      level: options.level || 'component',
      user_agent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      user_id: options.userId,
      retry_count: options.retryCount || 0,
      session_id: this.getSessionId(),
    };

    if (this.isOnline) {
      try {
        await this.sendErrorToDatabase(errorLog);
      } catch (dbError) {
        console.warn('Failed to send error to database, queuing for later:', dbError);
        this.queueError(errorLog);
      }
    } else {
      this.queueError(errorLog);
    }
  }

  private async sendErrorToDatabase(errorLog: ErrorLog): Promise<void> {
    try {
      await DatabaseService.create('error_logs', errorLog);
    } catch (error) {
      // If database is not available, don't throw - just queue
      throw new Error(`Database logging failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private queueError(errorLog: ErrorLog): void {
    this.errorQueue.push(errorLog);
    
    // Limit queue size
    if (this.errorQueue.length > this.MAX_QUEUE_SIZE) {
      this.errorQueue.shift(); // Remove oldest error
    }

    this.saveQueueToStorage();
  }

  private async processErrorQueue(): Promise<void> {
    this.isOnline = true;
    
    if (this.errorQueue.length === 0) {
      return;
    }

    const errors = [...this.errorQueue];
    const failedErrors: ErrorLog[] = [];

    for (const errorLog of errors) {
      try {
        await this.sendErrorToDatabase(errorLog);
      } catch (error) {
        failedErrors.push(errorLog);
      }
    }

    // Keep only failed errors in queue
    this.errorQueue = failedErrors;
    this.saveQueueToStorage();
  }

  private saveQueueToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.errorQueue));
    } catch (error) {
      console.warn('Failed to save error queue to localStorage:', error);
    }
  }

  private loadQueueFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.errorQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load error queue from localStorage:', error);
      this.errorQueue = [];
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('fisioflow_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('fisioflow_session_id', sessionId);
    }
    return sessionId;
  }

  // Method to get error statistics (for admin dashboard)
  async getErrorStats(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
    total: number;
    byLevel: Record<string, number>;
    byContext: Record<string, number>;
    recent: ErrorLog[];
  } | null> {
    try {
      const hours = {
        '1h': 1,
        '24h': 24,
        '7d': 24 * 7,
        '30d': 24 * 30,
      }[timeRange];

      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      
      const { data: errors } = await DatabaseService.query('error_logs', {
        filters: [
          { field: 'timestamp', operator: 'gte', value: since }
        ],
        orderBy: [{ field: 'timestamp', direction: 'desc' }],
        limit: 1000,
      });

      if (!errors || errors.length === 0) {
        return {
          total: 0,
          byLevel: {},
          byContext: {},
          recent: [],
        };
      }

      const byLevel: Record<string, number> = {};
      const byContext: Record<string, number> = {};

      errors.forEach((error: any) => {
        byLevel[error.level] = (byLevel[error.level] || 0) + 1;
        byContext[error.context] = (byContext[error.context] || 0) + 1;
      });

      return {
        total: errors.length,
        byLevel,
        byContext,
        recent: errors.slice(0, 10),
      };
    } catch (error) {
      console.error('Failed to get error stats:', error);
      return null;
    }
  }

  // Clear old errors (cleanup function)
  async clearOldErrors(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();
      
      await DatabaseService.delete('error_logs', {
        filters: [
          { field: 'timestamp', operator: 'lt', value: cutoffDate }
        ]
      });
    } catch (error) {
      console.error('Failed to clear old errors:', error);
    }
  }
}

// Export singleton instance
export const errorLoggingService = ErrorLoggingService.getInstance();
export default errorLoggingService;