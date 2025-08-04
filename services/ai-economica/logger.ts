
import { 
  QueryType, 
  PremiumProvider, 
  Alert, 
  AIEconomicaError,
  UsageMetrics,
  SystemHealth 
} from '../../types/ai-economica.types';
import { AI_ECONOMICA_CONFIG } from '../../config/ai-economica.config';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: 'system' | 'query' | 'cache' | 'provider' | 'knowledge' | 'security' | 'performance';
  message: string;
  context?: Record<string, any>;
  userId?: string;
  queryId?: string;
  provider?: PremiumProvider;
  duration?: number;
  error?: Error;
  metadata?: Record<string, any>;
}

export interface AIMetrics {
  queriesTotal: number;
  queriesByType: Record<QueryType, number>;
  queriesBySource: Record<string, number>;
  averageResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  costSavings: number;
  providerUsage: Record<PremiumProvider, UsageMetrics>;
}

class AIEconomicaLogger {
  private logs: LogEntry[] = [];
  private alerts: Alert[] = [];
  private metrics: AIMetrics;
  private isEnabled: boolean = true;
  private logLevel: LogLevel = LogLevel.INFO;
  private maxLogEntries: number = 10000;
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.metrics = this.initializeMetrics();
    this.setupMetricsCollection();
    this.loadConfiguration();
  }

  // Core logging methods
  debug(message: string, context?: Record<string, any>, metadata?: Record<string, any>) {
    this.log(LogLevel.DEBUG, 'system', message, context, metadata);
  }

  info(message: string, context?: Record<string, any>, metadata?: Record<string, any>) {
    this.log(LogLevel.INFO, 'system', message, context, metadata);
  }

  warn(message: string, context?: Record<string, any>, metadata?: Record<string, any>) {
    this.log(LogLevel.WARN, 'system', message, context, metadata);
  }

  error(message: string, error?: Error, context?: Record<string, any>, metadata?: Record<string, any>) {
    this.log(LogLevel.ERROR, 'system', message, context, metadata, error);
  }

  critical(message: string, error?: Error, context?: Record<string, any>, metadata?: Record<string, any>) {
    this.log(LogLevel.CRITICAL, 'system', message, context, metadata, error);
    this.createAlert('critical', message, context || {});
  }

  // Specialized logging methods
  logQuery(
    queryId: string, 
    queryType: QueryType, 
    message: string, 
    context?: Record<string, any>
  ) {
    this.log(LogLevel.INFO, 'query', message, { 
      ...context, 
      queryId, 
      queryType 
    }, undefined, undefined, queryId);
    
    this.updateQueryMetrics(queryType);
  }

  logCache(operation: 'hit' | 'miss' | 'set' | 'clear', key: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, 'cache', `Cache ${operation}: ${key}`, context);
    this.updateCacheMetrics(operation);
  }

  logProvider(
    provider: PremiumProvider, 
    operation: string, 
    duration?: number, 
    context?: Record<string, any>
  ) {
    this.log(LogLevel.INFO, 'provider', `${provider}: ${operation}`, 
      { ...context, provider, duration }, 
      undefined, undefined, undefined, provider
    );
    
    this.updateProviderMetrics(provider, duration);
  }

  logKnowledge(operation: string, entryId?: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, 'knowledge', `Knowledge ${operation}`, { 
      ...context, 
      entryId 
    });
  }

  logSecurity(event: string, severity: 'info' | 'warning' | 'critical', context?: Record<string, any>) {
    const level = severity === 'critical' ? LogLevel.CRITICAL : 
                  severity === 'warning' ? LogLevel.WARN : LogLevel.INFO;
    
    this.log(level, 'security', `Security: ${event}`, context);
    
    if (severity === 'critical') {
      this.createAlert('critical', `Security event: ${event}`, context || {});
    }
  }

  logPerformance(operation: string, duration: number, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, 'performance', `Performance: ${operation} took ${duration}ms`, 
      { ...context, duration }
    );
    
    // Alert if operation takes too long
    if (duration > 30000) { // 30 seconds
      this.createAlert('warning', `Slow operation: ${operation} took ${duration}ms`, context || {});
    }
  }

  // Error handling
  logError(error: AIEconomicaError, context?: Record<string, any>) {
    const level = error.severity === 'critical' ? LogLevel.CRITICAL : 
                  error.severity === 'high' ? LogLevel.ERROR : LogLevel.WARN;
    
    this.log(level, error.category, error.message, { 
      ...context, 
      code: error.code,
      retryable: error.retryable,
      suggestions: error.suggestions
    }, undefined, error);

    if (error.severity === 'critical' || error.severity === 'high') {
      this.createAlert(
        error.severity === 'critical' ? 'critical' : 'error',
        error.message,
        { code: error.code, context: error.context }
      );
    }
  }

  // Alert management
  private createAlert(
    severity: 'info' | 'warning' | 'error' | 'critical',
    message: string,
    details: Record<string, any>
  ) {
    const alert: Alert = {
      id: this.generateId(),
      type: this.determineAlertType(message, details),
      severity,
      message,
      details,
      createdAt: new Date(),
      acknowledged: false,
      resolved: false
    };

    this.alerts.push(alert);
    
    // Keep only recent alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-500);
    }

    // Emit alert for real-time notifications
    this.emitAlert(alert);
  }

  private determineAlertType(message: string, details: Record<string, any>): Alert['type'] {
    if (message.includes('limit') || message.includes('quota')) {
      return message.includes('exceeded') ? 'limit_exceeded' : 'limit_approaching';
    }
    if (message.includes('provider') && message.includes('down')) {
      return 'provider_down';
    }
    if (message.includes('cache') && message.includes('full')) {
      return 'cache_full';
    }
    if (message.includes('quality') || message.includes('confidence')) {
      return 'quality_degraded';
    }
    return 'limit_approaching'; // Default
  }

  // Metrics collection
  private initializeMetrics(): AIMetrics {
    return {
      queriesTotal: 0,
      queriesByType: {
        [QueryType.PROTOCOL]: 0,
        [QueryType.DIAGNOSIS]: 0,
        [QueryType.EXERCISE]: 0,
        [QueryType.GENERAL]: 0,
        [QueryType.RESEARCH]: 0,
        [QueryType.EMERGENCY]: 0
      },
      queriesBySource: {
        'internal_knowledge_base': 0,
        'cache': 0,
        'premium_ai': 0,
        'combined': 0
      },
      averageResponseTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
      costSavings: 0,
      providerUsage: {
        [PremiumProvider.GEMINI_PRO]: this.createEmptyUsageMetrics(PremiumProvider.GEMINI_PRO),
        [PremiumProvider.CHATGPT_PLUS]: this.createEmptyUsageMetrics(PremiumProvider.CHATGPT_PLUS),
        [PremiumProvider.CLAUDE_PRO]: this.createEmptyUsageMetrics(PremiumProvider.CLAUDE_PRO),
        [PremiumProvider.PERPLEXITY_PRO]: this.createEmptyUsageMetrics(PremiumProvider.PERPLEXITY_PRO),
        [PremiumProvider.MARS_AI_PRO]: this.createEmptyUsageMetrics(PremiumProvider.MARS_AI_PRO)
      }
    };
  }

  private createEmptyUsageMetrics(provider: PremiumProvider): UsageMetrics {
    return {
      provider,
      date: new Date(),
      queries: 0,
      tokens: 0,
      cost: 0,
      avgResponseTime: 0,
      successRate: 0,
      errorTypes: {}
    };
  }

  private updateQueryMetrics(queryType: QueryType) {
    this.metrics.queriesTotal++;
    this.metrics.queriesByType[queryType]++;
  }

  private updateCacheMetrics(operation: 'hit' | 'miss' | 'set' | 'clear') {
    if (operation === 'hit') {
      this.metrics.queriesBySource.cache++;
    }
    
    // Calculate cache hit rate
    const totalCacheOperations = this.metrics.queriesBySource.cache + 
      this.logs.filter(log => log.category === 'cache' && log.message.includes('miss')).length;
    
    this.metrics.cacheHitRate = totalCacheOperations > 0 ? 
      (this.metrics.queriesBySource.cache / totalCacheOperations) * 100 : 0;
  }

  private updateProviderMetrics(provider: PremiumProvider, duration?: number) {
    const usage = this.metrics.providerUsage[provider];
    usage.queries++;
    
    if (duration) {
      usage.avgResponseTime = (usage.avgResponseTime * (usage.queries - 1) + duration) / usage.queries;
    }
  }

  // System health monitoring
  getSystemHealth(): SystemHealth {
    const recentErrors = this.logs.filter(log => 
      log.level >= LogLevel.ERROR && 
      Date.now() - log.timestamp.getTime() < 3600000 // Last hour
    ).length;

    const totalRecent = this.logs.filter(log => 
      Date.now() - log.timestamp.getTime() < 3600000
    ).length;

    const errorRate = totalRecent > 0 ? (recentErrors / totalRecent) * 100 : 0;

    return {
      overall: errorRate > 10 ? 'critical' : errorRate > 5 ? 'degraded' : 'healthy',
      components: {
        knowledgeBase: 'healthy', // Would check actual KB health
        cache: this.metrics.cacheHitRate > 70 ? 'healthy' : 'degraded',
        providers: Object.fromEntries(
          Object.entries(this.metrics.providerUsage).map(([provider, usage]) => [
            provider,
            usage.successRate > 90 ? 'healthy' : usage.successRate > 70 ? 'degraded' : 'unavailable'
          ])
        ) as Record<PremiumProvider, 'healthy' | 'degraded' | 'unavailable'>
      },
      lastCheck: new Date(),
      uptime: Date.now() - (this.logs[0]?.timestamp.getTime() || Date.now()),
      avgResponseTime: this.metrics.averageResponseTime,
      errorRate
    };
  }

  // Configuration and management
  private loadConfiguration() {
    const config = AI_ECONOMICA_CONFIG;
    this.isEnabled = config.security.auditLogging;
    this.maxLogEntries = Math.min(this.maxLogEntries, 50000); // Reasonable limit
  }

  private setupMetricsCollection() {
    // Update metrics every 5 minutes
    this.metricsInterval = setInterval(() => {
      this.calculateDerivedMetrics();
      this.cleanupOldLogs();
    }, 5 * 60 * 1000);
  }

  private calculateDerivedMetrics() {
    // Calculate average response time
    const recentLogs = this.logs.filter(log => 
      log.duration && Date.now() - log.timestamp.getTime() < 3600000
    );
    
    if (recentLogs.length > 0) {
      this.metrics.averageResponseTime = recentLogs.reduce((sum, log) => 
        sum + (log.duration || 0), 0
      ) / recentLogs.length;
    }

    // Calculate error rate
    const recentErrors = this.logs.filter(log => 
      log.level >= LogLevel.ERROR && 
      Date.now() - log.timestamp.getTime() < 3600000
    ).length;
    
    const totalRecent = this.logs.filter(log => 
      Date.now() - log.timestamp.getTime() < 3600000
    ).length;
    
    this.metrics.errorRate = totalRecent > 0 ? (recentErrors / totalRecent) * 100 : 0;
  }

  private cleanupOldLogs() {
    const retentionTime = AI_ECONOMICA_CONFIG.security.maxLogRetention;
    const cutoffTime = Date.now() - retentionTime;
    
    this.logs = this.logs.filter(log => log.timestamp.getTime() > cutoffTime);
    
    // Keep logs within max entries limit
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-this.maxLogEntries);
    }
  }

  // Core logging implementation
  private log(
    level: LogLevel,
    category: LogEntry['category'],
    message: string,
    context?: Record<string, any>,
    metadata?: Record<string, any>,
    error?: Error,
    queryId?: string,
    provider?: PremiumProvider
  ) {
    if (!this.isEnabled || level < this.logLevel) return;

    const logEntry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      category,
      message,
      context,
      metadata,
      error,
      queryId,
      provider
    };

    this.logs.push(logEntry);
    
    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      this.outputToConsole(logEntry);
    }

    // Cleanup if needed
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(-Math.floor(this.maxLogEntries * 0.8));
    }
  }

  private outputToConsole(entry: LogEntry) {
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevel[entry.level];
    const message = `[${level}] ${timestamp} [${entry.category}]: ${entry.message}`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.context);
        break;
      case LogLevel.INFO:
        console.info(message, entry.context);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.context);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(message, entry.error, entry.context);
        break;
    }
  }

  private emitAlert(alert: Alert) {
    // In a real implementation, this would emit events to a notification system
    if (process.env.NODE_ENV === 'development') {
      console.warn(`🚨 ALERT [${alert.severity}]: ${alert.message}`, alert.details);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Public API for accessing logs and metrics
  getLogs(filters?: {
    level?: LogLevel;
    category?: LogEntry['category'];
    startTime?: Date;
    endTime?: Date;
    queryId?: string;
    provider?: PremiumProvider;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filters) {
      if (filters.level !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.level >= filters.level!);
      }
      if (filters.category) {
        filteredLogs = filteredLogs.filter(log => log.category === filters.category);
      }
      if (filters.startTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startTime!);
      }
      if (filters.endTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endTime!);
      }
      if (filters.queryId) {
        filteredLogs = filteredLogs.filter(log => log.queryId === filters.queryId);
      }
      if (filters.provider) {
        filteredLogs = filteredLogs.filter(log => log.provider === filters.provider);
      }
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getMetrics(): AIMetrics {
    return { ...this.metrics };
  }

  getAlerts(unacknowledgedOnly: boolean = false): Alert[] {
    return unacknowledgedOnly 
      ? this.alerts.filter(alert => !alert.acknowledged)
      : [...this.alerts];
  }

  acknowledgeAlert(alertId: string, userId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = new Date();
    }
  }

  resolveAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
    }
  }

  // Export functionality
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'category', 'message', 'context'];
      const csvRows = [
        headers.join(','),
        ...this.logs.map(log => [
          log.timestamp.toISOString(),
          LogLevel[log.level],
          log.category,
          `"${log.message.replace(/"/g, '""')}"`,
          `"${JSON.stringify(log.context || {}).replace(/"/g, '""')}"`
        ].join(','))
      ];
      return csvRows.join('\n');
    }
    
    return JSON.stringify(this.logs, null, 2);
  }

  // Cleanup
  destroy() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }
}

// Singleton instance
export const aiEconomicaLogger = new AIEconomicaLogger();

// Legacy compatibility
export const logger = {
  info: (message: string, ...args: any[]) => aiEconomicaLogger.info(message, { args }),
  warn: (message: string, ...args: any[]) => aiEconomicaLogger.warn(message, { args }),
  error: (message: string, ...args: any[]) => aiEconomicaLogger.error(message, undefined, { args }),
  debug: (message: string, ...args: any[]) => aiEconomicaLogger.debug(message, { args })
};

export default aiEconomicaLogger;
