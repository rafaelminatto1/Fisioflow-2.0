import { PremiumProvider, QueryType, ResponseSource, Alert } from '../../types/ai-economica.types';
import aiEconomicaConfig from '../../config/ai-economica.config';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  context?: {
    userId?: string;
    sessionId?: string;
    queryId?: string;
    provider?: PremiumProvider;
    source?: ResponseSource;
  };
  stack?: string;
}

export enum LogCategory {
  SYSTEM = 'system',
  QUERY = 'query',
  CACHE = 'cache',
  KNOWLEDGE_BASE = 'knowledge_base',
  PROVIDER = 'provider',
  ANALYTICS = 'analytics',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  ERROR = 'error'
}

class AIEconomicaLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 10000;
  private persistenceEnabled = true;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupPeriodicCleanup();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!aiEconomicaConfig.development.enableDebugLogs && level === LogLevel.DEBUG) {
      return false;
    }
    return true;
  }

  private addLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    this.logs.push(entry);
    
    // Manter apenas os logs mais recentes
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log no console se habilitado
    if (aiEconomicaConfig.development.enableDebugLogs) {
      this.logToConsole(entry);
    }

    // Persistir se necessário
    if (this.persistenceEnabled && aiEconomicaConfig.security.audit.enabled) {
      this.persistLog(entry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[AI-ECONOMICA] [${timestamp}] [${LogLevel[entry.level]}] [${entry.category}]`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.data || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(prefix, entry.message, entry.data || '', entry.stack || '');
        break;
    }
  }

  private async persistLog(entry: LogEntry): Promise<void> {
    try {
      // Armazenar logs em localStorage para debugging local
      const storedLogs = localStorage.getItem('ai_economica_logs');
      const logs = storedLogs ? JSON.parse(storedLogs) : [];
      
      logs.push(entry);
      
      // Manter apenas os logs dos últimos 7 dias
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const filteredLogs = logs.filter((log: LogEntry) => 
        new Date(log.timestamp).getTime() > sevenDaysAgo
      );
      
      localStorage.setItem('ai_economica_logs', JSON.stringify(filteredLogs.slice(-1000)));
    } catch (error) {
      console.error('Erro ao persistir log:', error);
    }
  }

  private setupPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000); // Limpar a cada hora
  }

  private cleanup(): void {
    const retentionMs = aiEconomicaConfig.security.audit.retentionDays * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - retentionMs;
    
    this.logs = this.logs.filter(log => 
      new Date(log.timestamp).getTime() > cutoffTime
    );
  }

  // Métodos públicos de logging

  debug(category: LogCategory, message: string, data?: any, context?: LogEntry['context']): void {
    this.addLog({
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      category,
      message,
      data,
      context: { ...context, sessionId: this.sessionId }
    });
  }

  info(category: LogCategory, message: string, data?: any, context?: LogEntry['context']): void {
    this.addLog({
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      category,
      message,
      data,
      context: { ...context, sessionId: this.sessionId }
    });
  }

  warn(category: LogCategory, message: string, data?: any, context?: LogEntry['context']): void {
    this.addLog({
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      category,
      message,
      data,
      context: { ...context, sessionId: this.sessionId }
    });
  }

  error(category: LogCategory, message: string, error?: Error, data?: any, context?: LogEntry['context']): void {
    this.addLog({
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      category,
      message,
      data,
      context: { ...context, sessionId: this.sessionId },
      stack: error?.stack
    });
  }

  critical(category: LogCategory, message: string, error?: Error, data?: any, context?: LogEntry['context']): void {
    this.addLog({
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: LogLevel.CRITICAL,
      category,
      message,
      data,
      context: { ...context, sessionId: this.sessionId },
      stack: error?.stack
    });
  }

  // Métodos especializados

  logQuery(queryId: string, queryType: QueryType, source: ResponseSource, responseTime: number, success: boolean): void {
    this.info(LogCategory.QUERY, `Query processada: ${success ? 'sucesso' : 'falha'}`, {
      queryId,
      queryType,
      source,
      responseTime,
      success
    }, { queryId, source });
  }

  logProviderUsage(provider: PremiumProvider, queryType: QueryType, tokensUsed: number, success: boolean): void {
    this.info(LogCategory.PROVIDER, `Uso do provedor: ${provider}`, {
      provider,
      queryType,
      tokensUsed,
      success
    }, { provider });
  }

  logCacheOperation(operation: 'hit' | 'miss' | 'set' | 'cleanup', key: string, size?: number): void {
    this.debug(LogCategory.CACHE, `Cache ${operation}: ${key}`, {
      operation,
      key,
      size
    });
  }

  logKnowledgeBaseOperation(operation: 'search' | 'add' | 'update' | 'delete', entryId?: string, success: boolean = true): void {
    this.info(LogCategory.KNOWLEDGE_BASE, `Base de conhecimento ${operation}`, {
      operation,
      entryId,
      success
    });
  }

  logPerformanceMetric(metric: string, value: number, threshold?: number): void {
    const level = threshold && value > threshold ? LogLevel.WARN : LogLevel.INFO;
    this.addLog({
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level,
      category: LogCategory.PERFORMANCE,
      message: `Métrica de performance: ${metric}`,
      data: { metric, value, threshold },
      context: { sessionId: this.sessionId }
    });
  }

  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', details: any): void {
    const level = severity === 'high' ? LogLevel.CRITICAL : 
                 severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;
    
    this.addLog({
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level,
      category: LogCategory.SECURITY,
      message: `Evento de segurança: ${event}`,
      data: { event, severity, details },
      context: { sessionId: this.sessionId }
    });
  }

  // Métodos de consulta

  getLogs(options: {
    level?: LogLevel;
    category?: LogCategory;
    limit?: number;
    since?: Date;
    provider?: PremiumProvider;
    queryId?: string;
  } = {}): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (options.level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= options.level!);
    }

    if (options.category) {
      filteredLogs = filteredLogs.filter(log => log.category === options.category);
    }

    if (options.since) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= options.since!
      );
    }

    if (options.provider) {
      filteredLogs = filteredLogs.filter(log => 
        log.context?.provider === options.provider
      );
    }

    if (options.queryId) {
      filteredLogs = filteredLogs.filter(log => 
        log.context?.queryId === options.queryId
      );
    }

    // Ordenar por timestamp (mais recentes primeiro)
    filteredLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (options.limit) {
      filteredLogs = filteredLogs.slice(0, options.limit);
    }

    return filteredLogs;
  }

  getLogStats(): {
    total: number;
    byLevel: Record<string, number>;
    byCategory: Record<string, number>;
    last24Hours: number;
    errors: number;
  } {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);

    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      last24Hours: 0,
      errors: 0
    };

    this.logs.forEach(log => {
      // Por nível
      const levelName = LogLevel[log.level];
      stats.byLevel[levelName] = (stats.byLevel[levelName] || 0) + 1;

      // Por categoria
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;

      // Últimas 24 horas
      if (new Date(log.timestamp).getTime() > last24Hours) {
        stats.last24Hours++;
      }

      // Erros
      if (log.level >= LogLevel.ERROR) {
        stats.errors++;
      }
    });

    return stats;
  }

  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    }

    // CSV format
    const headers = 'ID,Timestamp,Level,Category,Message,Context';
    const rows = this.logs.map(log => [
      log.id,
      log.timestamp,
      LogLevel[log.level],
      log.category,
      `"${log.message.replace(/"/g, '""')}"`,
      log.context ? `"${JSON.stringify(log.context).replace(/"/g, '""')}"` : ''
    ].join(','));

    return [headers, ...rows].join('\n');
  }

  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('ai_economica_logs');
    this.info(LogCategory.SYSTEM, 'Logs limpos manualmente');
  }
}

// Instância singleton
export const aiLogger = new AIEconomicaLogger();

// Função de conveniência para logging rápido
export const log = {
  debug: (message: string, data?: any) => aiLogger.debug(LogCategory.SYSTEM, message, data),
  info: (message: string, data?: any) => aiLogger.info(LogCategory.SYSTEM, message, data),
  warn: (message: string, data?: any) => aiLogger.warn(LogCategory.SYSTEM, message, data),
  error: (message: string, error?: Error, data?: any) => aiLogger.error(LogCategory.SYSTEM, message, error, data),
  critical: (message: string, error?: Error, data?: any) => aiLogger.critical(LogCategory.SYSTEM, message, error, data)
};

export default aiLogger;