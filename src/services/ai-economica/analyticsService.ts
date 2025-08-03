import { 
  AnalyticsData, 
  PremiumProvider, 
  QueryType, 
  ResponseSource, 
  ResponseSourceType,
  Alert,
  AIQuery,
  AIResponse
} from '../../types/ai-economica.types';
import aiEconomicaConfig from '../../config/ai-economica.config';
import aiLogger, { LogCategory } from './logger';

interface QueryMetrics {
  id: string;
  queryId: string;
  type: QueryType;
  source: ResponseSourceType;
  provider?: PremiumProvider;
  responseTime: number;
  tokensUsed: number;
  confidence: number;
  success: boolean;
  timestamp: string;
  userFeedback?: 'positive' | 'negative';
}

interface EconomyMetrics {
  date: string;
  providerUsage: Record<PremiumProvider, number>;
  estimatedCost: number;
  estimatedSavings: number;
  cacheHitRate: number;
  internalSuccessRate: number;
}

interface PerformanceMetrics {
  date: string;
  avgResponseTime: number;
  successRate: number;
  errorRate: number;
  throughput: number;
  peakConcurrency: number;
}

export class AnalyticsService {
  private queryMetrics: QueryMetrics[] = [];
  private economyHistory: EconomyMetrics[] = [];
  private performanceHistory: PerformanceMetrics[] = [];
  private alerts: Alert[] = [];
  private aggregationTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeService();
  }

  private initializeService(): void {
    try {
      // Carregar dados persistidos
      this.loadPersistedData();
      
      // Configurar agregação periódica
      this.setupPeriodicAggregation();
      
      // Configurar limpeza de dados antigos
      this.setupDataCleanup();
      
      aiLogger.info(LogCategory.ANALYTICS, 'Analytics Service inicializado');
    } catch (error) {
      aiLogger.error(LogCategory.ANALYTICS, 'Erro na inicialização do Analytics', error as Error);
    }
  }

  trackQuery(query: AIQuery, response: AIResponse, responseTime: number): void {
    try {
      const metric: QueryMetrics = {
        id: this.generateMetricId(),
        queryId: query.id,
        type: query.type,
        source: response.source,
        provider: response.provider,
        responseTime,
        tokensUsed: response.tokensUsed || 0,
        confidence: response.confidence,
        success: true,
        timestamp: new Date().toISOString()
      };

      this.queryMetrics.push(metric);
      this.limitMetricsSize();

      aiLogger.debug(LogCategory.ANALYTICS, 'Query rastreada', {
        queryId: query.id,
        source: response.source,
        responseTime
      });

    } catch (error) {
      aiLogger.error(LogCategory.ANALYTICS, 'Erro ao rastrear query', error as Error);
    }
  }

  trackQueryFailure(query: AIQuery, error: Error, responseTime: number): void {
    try {
      const metric: QueryMetrics = {
        id: this.generateMetricId(),
        queryId: query.id,
        type: query.type,
        source: 'internal' as ResponseSourceType, // Default para falhas
        responseTime,
        tokensUsed: 0,
        confidence: 0,
        success: false,
        timestamp: new Date().toISOString()
      };

      this.queryMetrics.push(metric);
      this.limitMetricsSize();

    } catch (trackError) {
      aiLogger.error(LogCategory.ANALYTICS, 'Erro ao rastrear falha', trackError as Error);
    }
  }

  trackUserFeedback(queryId: string, feedback: 'positive' | 'negative'): void {
    try {
      const metric = this.queryMetrics.find(m => m.queryId === queryId);
      if (metric) {
        metric.userFeedback = feedback;
        this.persistData();
        
        aiLogger.debug(LogCategory.ANALYTICS, 'Feedback do usuário registrado', {
          queryId,
          feedback
        });
      }
    } catch (error) {
      aiLogger.error(LogCategory.ANALYTICS, 'Erro ao registrar feedback', error as Error);
    }
  }

  addAlert(alert: Alert): void {
    try {
      this.alerts.push(alert);
      
      // Manter apenas alertas dos últimos 30 dias
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      this.alerts = this.alerts.filter(a => 
        new Date(a.createdAt).getTime() > thirtyDaysAgo
      );

      this.persistData();
      
      aiLogger.info(LogCategory.ANALYTICS, 'Alerta adicionado', {
        alertId: alert.id,
        type: alert.type,
        severity: alert.severity
      });

    } catch (error) {
      aiLogger.error(LogCategory.ANALYTICS, 'Erro ao adicionar alerta', error as Error);
    }
  }

  resolveAlert(alertId: string): void {
    try {
      const alert = this.alerts.find(a => a.id === alertId);
      if (alert && !alert.resolved) {
        alert.resolved = true;
        alert.resolvedAt = new Date().toISOString();
        this.persistData();
        
        aiLogger.info(LogCategory.ANALYTICS, 'Alerta resolvido', { alertId });
      }
    } catch (error) {
      aiLogger.error(LogCategory.ANALYTICS, 'Erro ao resolver alerta', error as Error);
    }
  }

  getCurrentAnalytics(): AnalyticsData {
    try {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Filtrar métricas por período
      const recent24h = this.queryMetrics.filter(m => 
        new Date(m.timestamp) >= last24Hours
      );
      const recent7d = this.queryMetrics.filter(m => 
        new Date(m.timestamp) >= last7Days
      );
      const recent30d = this.queryMetrics.filter(m => 
        new Date(m.timestamp) >= last30Days
      );

      return {
        queries: this.calculateQueryMetrics(recent30d),
        performance: this.calculatePerformanceMetrics(recent24h),
        economy: this.calculateEconomyMetrics(recent30d),
        quality: this.calculateQualityMetrics(recent7d)
      };

    } catch (error) {
      aiLogger.error(LogCategory.ANALYTICS, 'Erro ao calcular analytics', error as Error);
      return this.getEmptyAnalytics();
    }
  }

  getDetailedReport(period: '24h' | '7d' | '30d' = '30d'): {
    summary: AnalyticsData;
    trends: {
      queryTrends: Array<{ date: string; count: number; avgResponseTime: number }>;
      sourceTrends: Array<{ date: string; internal: number; cache: number; premium: number }>;
      economyTrends: Array<{ date: string; savings: number; cost: number }>;
    };
    topQueries: Array<{ type: QueryType; count: number; avgConfidence: number }>;
    alerts: Alert[];
  } {
    try {
      const periodMs = this.getPeriodMs(period);
      const startDate = new Date(Date.now() - periodMs);
      
      const periodMetrics = this.queryMetrics.filter(m => 
        new Date(m.timestamp) >= startDate
      );

      const summary = this.getCurrentAnalytics();
      const trends = this.calculateTrends(periodMetrics, period);
      const topQueries = this.calculateTopQueries(periodMetrics);
      const recentAlerts = this.alerts.filter(a => 
        new Date(a.createdAt) >= startDate
      );

      return {
        summary,
        trends,
        topQueries,
        alerts: recentAlerts
      };

    } catch (error) {
      aiLogger.error(LogCategory.ANALYTICS, 'Erro ao gerar relatório detalhado', error as Error);
      return {
        summary: this.getEmptyAnalytics(),
        trends: { queryTrends: [], sourceTrends: [], economyTrends: [] },
        topQueries: [],
        alerts: []
      };
    }
  }

  getEconomyReport(): {
    currentMonth: {
      totalSavings: number;
      providerCosts: Record<PremiumProvider, number>;
      avoidedCosts: number;
      roi: number;
    };
    projections: {
      monthlyProjection: number;
      yearlyProjection: number;
      optimizationPotential: number;
    };
    recommendations: string[];
  } {
    try {
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const monthlyMetrics = this.queryMetrics.filter(m => 
        new Date(m.timestamp) >= currentMonth
      );

      const currentMonthData = this.calculateEconomyMetrics(monthlyMetrics);
      const projections = this.calculateEconomyProjections(monthlyMetrics);
      const recommendations = this.generateEconomyRecommendations(monthlyMetrics);

      return {
        currentMonth: {
          totalSavings: currentMonthData.estimatedSavings,
          providerCosts: this.calculateProviderCosts(monthlyMetrics),
          avoidedCosts: currentMonthData.costAvoidance,
          roi: this.calculateROI(monthlyMetrics)
        },
        projections,
        recommendations
      };

    } catch (error) {
      aiLogger.error(LogCategory.ANALYTICS, 'Erro ao gerar relatório de economia', error as Error);
      return {
        currentMonth: { totalSavings: 0, providerCosts: {} as any, avoidedCosts: 0, roi: 0 },
        projections: { monthlyProjection: 0, yearlyProjection: 0, optimizationPotential: 0 },
        recommendations: []
      };
    }
  }

  private calculateQueryMetrics(metrics: QueryMetrics[]) {
    const total = metrics.length;
    const bySource = metrics.reduce((acc, m) => {
      acc[m.source] = (acc[m.source] || 0) + 1;
      return acc;
    }, {} as Record<ResponseSource, number>);

    const byType = metrics.reduce((acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1;
      return acc;
    }, {} as Record<QueryType, number>);

    const byProvider = metrics
      .filter(m => m.provider)
      .reduce((acc, m) => {
        acc[m.provider!] = (acc[m.provider!] || 0) + 1;
        return acc;
      }, {} as Record<PremiumProvider, number>);

    return { total, bySource, byType, byProvider };
  }

  private calculatePerformanceMetrics(metrics: QueryMetrics[]) {
    if (metrics.length === 0) {
      return {
        averageResponseTime: 0,
        cacheHitRate: 0,
        internalSuccessRate: 0
      };
    }

    const totalResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0);
    const averageResponseTime = totalResponseTime / metrics.length;

    const cacheHits = metrics.filter(m => m.source === ResponseSource.CACHE).length;
    const cacheHitRate = cacheHits / metrics.length;

    const internalQueries = metrics.filter(m => m.source === ResponseSource.INTERNAL);
    const internalSuccess = internalQueries.filter(m => m.success).length;
    const internalSuccessRate = internalQueries.length > 0 ? 
      internalSuccess / internalQueries.length : 0;

    return {
      averageResponseTime,
      cacheHitRate,
      internalSuccessRate
    };
  }

  private calculateEconomyMetrics(metrics: QueryMetrics[]) {
    const premiumQueries = metrics.filter(m => m.source === ResponseSource.PREMIUM);
    const totalTokensUsed = premiumQueries.reduce((sum, m) => sum + m.tokensUsed, 0);

    // Estimativas de custo baseadas em tokens
    const estimatedCostPerToken = 0.002; // $0.002 por 1K tokens (estimativa)
    const premiumUsageByProvider = premiumQueries.reduce((acc, m) => {
      if (m.provider) {
        acc[m.provider] = (acc[m.provider] || 0) + m.tokensUsed;
      }
      return acc;
    }, {} as Record<PremiumProvider, number>);

    // Calcular economia vs APIs pagas
    const wouldPayPerToken = 0.02; // $0.02 por 1K tokens em APIs pagas
    const estimatedSavings = totalTokensUsed * (wouldPayPerToken - estimatedCostPerToken) / 1000;
    const costAvoidance = (metrics.length - premiumQueries.length) * 0.05; // $0.05 por query evitada

    return {
      estimatedSavings,
      premiumUsageByProvider,
      costAvoidance
    };
  }

  private calculateQualityMetrics(metrics: QueryMetrics[]) {
    if (metrics.length === 0) {
      return {
        averageConfidence: 0,
        userSatisfaction: 0,
        feedbacksBySource: {} as Record<ResponseSource, { positive: number; negative: number }>
      };
    }

    const totalConfidence = metrics.reduce((sum, m) => sum + m.confidence, 0);
    const averageConfidence = totalConfidence / metrics.length;

    const withFeedback = metrics.filter(m => m.userFeedback);
    const positiveFeedback = withFeedback.filter(m => m.userFeedback === 'positive').length;
    const userSatisfaction = withFeedback.length > 0 ? 
      positiveFeedback / withFeedback.length : 0;

    const feedbacksBySource = metrics.reduce((acc, m) => {
      if (m.userFeedback) {
        if (!acc[m.source]) {
          acc[m.source] = { positive: 0, negative: 0 };
        }
        acc[m.source][m.userFeedback]++;
      }
      return acc;
    }, {} as Record<ResponseSource, { positive: number; negative: number }>);

    return {
      averageConfidence,
      userSatisfaction,
      feedbacksBySource
    };
  }

  private calculateTrends(metrics: QueryMetrics[], period: string) {
    const groupSize = period === '24h' ? 1 : period === '7d' ? 1 : 7; // dias para agrupar
    const groups = this.groupMetricsByDate(metrics, groupSize);

    const queryTrends = groups.map(group => ({
      date: group.date,
      count: group.metrics.length,
      avgResponseTime: group.metrics.reduce((sum, m) => sum + m.responseTime, 0) / group.metrics.length || 0
    }));

    const sourceTrends = groups.map(group => {
      const internal = group.metrics.filter(m => m.source === ResponseSource.INTERNAL).length;
      const cache = group.metrics.filter(m => m.source === ResponseSource.CACHE).length;
      const premium = group.metrics.filter(m => m.source === ResponseSource.PREMIUM).length;
      
      return { date: group.date, internal, cache, premium };
    });

    const economyTrends = groups.map(group => {
      const economy = this.calculateEconomyMetrics(group.metrics);
      return {
        date: group.date,
        savings: economy.estimatedSavings,
        cost: Object.values(economy.premiumUsageByProvider).reduce((sum, usage) => sum + usage * 0.002, 0)
      };
    });

    return { queryTrends, sourceTrends, economyTrends };
  }

  private calculateTopQueries(metrics: QueryMetrics[]) {
    const queryTypes = metrics.reduce((acc, m) => {
      if (!acc[m.type]) {
        acc[m.type] = { count: 0, totalConfidence: 0 };
      }
      acc[m.type].count++;
      acc[m.type].totalConfidence += m.confidence;
      return acc;
    }, {} as Record<QueryType, { count: number; totalConfidence: number }>);

    return Object.entries(queryTypes)
      .map(([type, data]) => ({
        type: type as QueryType,
        count: data.count,
        avgConfidence: data.totalConfidence / data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateProviderCosts(metrics: QueryMetrics[]): Record<PremiumProvider, number> {
    return metrics
      .filter(m => m.provider)
      .reduce((acc, m) => {
        const cost = m.tokensUsed * 0.002 / 1000; // Estimativa
        acc[m.provider!] = (acc[m.provider!] || 0) + cost;
        return acc;
      }, {} as Record<PremiumProvider, number>);
  }

  private calculateROI(metrics: QueryMetrics[]): number {
    const economy = this.calculateEconomyMetrics(metrics);
    const totalCost = Object.values(this.calculateProviderCosts(metrics))
      .reduce((sum, cost) => sum + cost, 0);
    
    return totalCost > 0 ? (economy.estimatedSavings + economy.costAvoidance) / totalCost : 0;
  }

  private calculateEconomyProjections(monthlyMetrics: QueryMetrics[]) {
    const currentEconomy = this.calculateEconomyMetrics(monthlyMetrics);
    const daysInMonth = new Date().getDate();
    const remainingDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - daysInMonth;
    
    const dailyAvgSavings = currentEconomy.estimatedSavings / daysInMonth;
    const monthlyProjection = currentEconomy.estimatedSavings + (dailyAvgSavings * remainingDays);
    const yearlyProjection = monthlyProjection * 12;
    
    // Potencial de otimização baseado na taxa de cache hits
    const cacheHitRate = this.calculatePerformanceMetrics(monthlyMetrics).cacheHitRate;
    const optimizationPotential = (1 - cacheHitRate) * yearlyProjection * 0.2; // 20% de melhoria potencial

    return {
      monthlyProjection,
      yearlyProjection,
      optimizationPotential
    };
  }

  private generateEconomyRecommendations(metrics: QueryMetrics[]): string[] {
    const recommendations: string[] = [];
    const performance = this.calculatePerformanceMetrics(metrics);
    const providerUsage = this.calculateProviderCosts(metrics);

    // Recomendações baseadas na taxa de cache
    if (performance.cacheHitRate < 0.6) {
      recommendations.push('Considere aumentar o TTL do cache para consultas frequentes');
    }

    // Recomendações baseadas no uso da base interna
    if (performance.internalSuccessRate < 0.4) {
      recommendations.push('Incentive fisioterapeutas a contribuir mais para a base de conhecimento');
    }

    // Recomendações baseadas no uso de provedores
    const mostUsedProvider = Object.entries(providerUsage)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (mostUsedProvider && mostUsedProvider[1] > 100) {
      recommendations.push(`Considere otimizar o uso do ${mostUsedProvider[0]} para reduzir custos`);
    }

    // Recomendações gerais
    const totalQueries = metrics.length;
    const premiumQueries = metrics.filter(m => m.source === ResponseSource.PREMIUM).length;
    
    if (premiumQueries / totalQueries > 0.5) {
      recommendations.push('Alta dependência de provedores premium - considere expandir a base interna');
    }

    return recommendations.slice(0, 5); // Máximo 5 recomendações
  }

  private groupMetricsByDate(metrics: QueryMetrics[], groupSizeDays: number) {
    const groups = new Map<string, QueryMetrics[]>();
    
    metrics.forEach(metric => {
      const date = new Date(metric.timestamp);
      const groupDate = new Date(date);
      groupDate.setHours(0, 0, 0, 0);
      
      // Agrupar por período
      if (groupSizeDays > 1) {
        const dayOfYear = Math.floor((groupDate.getTime() - new Date(groupDate.getFullYear(), 0, 0).getTime()) / (24 * 60 * 60 * 1000));
        const groupNumber = Math.floor(dayOfYear / groupSizeDays);
        groupDate.setTime(new Date(groupDate.getFullYear(), 0, groupNumber * groupSizeDays).getTime());
      }
      
      const key = groupDate.toISOString().split('T')[0];
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(metric);
    });

    return Array.from(groups.entries()).map(([date, metrics]) => ({
      date,
      metrics
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  private getPeriodMs(period: string): number {
    switch (period) {
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      default: return 30 * 24 * 60 * 60 * 1000;
    }
  }

  private setupPeriodicAggregation(): void {
    if (!aiEconomicaConfig.analytics.enabled) return;

    const interval = aiEconomicaConfig.analytics.aggregationIntervals.hourly;
    
    this.aggregationTimer = setInterval(() => {
      this.aggregateHourlyData();
    }, interval);
  }

  private setupDataCleanup(): void {
    // Limpeza diária de dados antigos
    setInterval(() => {
      this.cleanupOldData();
    }, 24 * 60 * 60 * 1000);
  }

  private aggregateHourlyData(): void {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const hourlyMetrics = this.queryMetrics.filter(m => {
        const timestamp = new Date(m.timestamp);
        return timestamp >= oneHourAgo && timestamp < now;
      });

      if (hourlyMetrics.length > 0) {
        const performance: PerformanceMetrics = {
          date: now.toISOString(),
          avgResponseTime: hourlyMetrics.reduce((sum, m) => sum + m.responseTime, 0) / hourlyMetrics.length,
          successRate: hourlyMetrics.filter(m => m.success).length / hourlyMetrics.length,
          errorRate: hourlyMetrics.filter(m => !m.success).length / hourlyMetrics.length,
          throughput: hourlyMetrics.length,
          peakConcurrency: this.estimatePeakConcurrency(hourlyMetrics)
        };

        this.performanceHistory.push(performance);

        const economy: EconomyMetrics = {
          date: now.toISOString(),
          providerUsage: this.calculateProviderUsage(hourlyMetrics),
          estimatedCost: this.calculateEstimatedCost(hourlyMetrics),
          estimatedSavings: this.calculateEconomyMetrics(hourlyMetrics).estimatedSavings,
          cacheHitRate: this.calculatePerformanceMetrics(hourlyMetrics).cacheHitRate,
          internalSuccessRate: this.calculatePerformanceMetrics(hourlyMetrics).internalSuccessRate
        };

        this.economyHistory.push(economy);
      }

      this.persistData();
    } catch (error) {
      aiLogger.error(LogCategory.ANALYTICS, 'Erro na agregação horária', error as Error);
    }
  }

  private cleanupOldData(): void {
    const retentionMs = aiEconomicaConfig.analytics.retentionDays * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - retentionMs);

    // Limpar métricas antigas
    this.queryMetrics = this.queryMetrics.filter(m => 
      new Date(m.timestamp) > cutoffDate
    );

    this.performanceHistory = this.performanceHistory.filter(p => 
      new Date(p.date) > cutoffDate
    );

    this.economyHistory = this.economyHistory.filter(e => 
      new Date(e.date) > cutoffDate
    );

    this.persistData();
    
    aiLogger.info(LogCategory.ANALYTICS, 'Dados antigos limpos', {
      cutoffDate: cutoffDate.toISOString()
    });
  }

  private estimatePeakConcurrency(metrics: QueryMetrics[]): number {
    // Estimativa simples baseada em sobreposição de tempos de resposta
    const timestamps = metrics.map(m => ({
      start: new Date(m.timestamp).getTime(),
      end: new Date(m.timestamp).getTime() + m.responseTime
    }));

    let maxConcurrency = 0;
    
    for (const timestamp of timestamps) {
      const concurrent = timestamps.filter(t => 
        t.start <= timestamp.start && t.end > timestamp.start
      ).length;
      
      maxConcurrency = Math.max(maxConcurrency, concurrent);
    }

    return maxConcurrency;
  }

  private calculateProviderUsage(metrics: QueryMetrics[]): Record<PremiumProvider, number> {
    return metrics
      .filter(m => m.provider)
      .reduce((acc, m) => {
        acc[m.provider!] = (acc[m.provider!] || 0) + m.tokensUsed;
        return acc;
      }, {} as Record<PremiumProvider, number>);
  }

  private calculateEstimatedCost(metrics: QueryMetrics[]): number {
    return metrics
      .filter(m => m.provider)
      .reduce((sum, m) => sum + (m.tokensUsed * 0.002 / 1000), 0);
  }

  private limitMetricsSize(): void {
    const maxMetrics = 100000; // Máximo de 100k métricas em memória
    
    if (this.queryMetrics.length > maxMetrics) {
      this.queryMetrics = this.queryMetrics.slice(-maxMetrics);
    }
  }

  private getEmptyAnalytics(): AnalyticsData {
    return {
      queries: {
        total: 0,
        bySource: {} as Record<ResponseSource, number>,
        byType: {} as Record<QueryType, number>,
        byProvider: {} as Record<PremiumProvider, number>
      },
      performance: {
        averageResponseTime: 0,
        cacheHitRate: 0,
        internalSuccessRate: 0
      },
      economy: {
        estimatedSavings: 0,
        premiumUsageByProvider: {} as Record<PremiumProvider, number>,
        costAvoidance: 0
      },
      quality: {
        averageConfidence: 0,
        userSatisfaction: 0,
        feedbacksBySource: {} as Record<ResponseSource, { positive: number; negative: number }>
      }
    };
  }

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private persistData(): void {
    try {
      const data = {
        queryMetrics: this.queryMetrics.slice(-10000), // Persistir apenas os últimos 10k
        economyHistory: this.economyHistory.slice(-1000),
        performanceHistory: this.performanceHistory.slice(-1000),
        alerts: this.alerts
      };

      localStorage.setItem('ai_economica_analytics', JSON.stringify(data));
    } catch (error) {
      aiLogger.error(LogCategory.ANALYTICS, 'Erro ao persistir dados de analytics', error as Error);
    }
  }

  private loadPersistedData(): void {
    try {
      const stored = localStorage.getItem('ai_economica_analytics');
      if (stored) {
        const data = JSON.parse(stored);
        
        this.queryMetrics = data.queryMetrics || [];
        this.economyHistory = data.economyHistory || [];
        this.performanceHistory = data.performanceHistory || [];
        this.alerts = data.alerts || [];
      }
    } catch (error) {
      aiLogger.error(LogCategory.ANALYTICS, 'Erro ao carregar dados persistidos', error as Error);
    }
  }

  destroy(): void {
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
    }
    this.persistData();
  }
}

export default AnalyticsService;