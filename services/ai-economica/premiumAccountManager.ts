import { 
  PremiumProvider, 
  PremiumAccount, 
  UsageMetrics,
  ProviderRotationConfig,
  QueryType,
  AIQuery,
  AIResponse,
  ResponseSource,
  ConfidenceLevel,
  AIEconomicaError
} from '../../types/ai-economica.types';
import { aiEconomicaLogger } from './logger';
import { AI_ECONOMICA_CONFIG, QUERY_TYPE_CONFIGS } from '../../config/ai-economica.config';

interface ProviderClient {
  query(query: AIQuery): Promise<AIResponse>;
  healthCheck(): Promise<boolean>;
  getRemainingQuota(): Promise<{ daily: number; monthly: number }>;
}

class GeminiClient implements ProviderClient {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async query(query: AIQuery): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Mock Gemini API call - in real implementation would call actual API
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500)); // Simulate API delay
      
      const mockResponse = this.generateMockResponse(query, startTime);
      
      aiEconomicaLogger.logProvider(PremiumProvider.GEMINI_PRO, 'query_completed', Date.now() - startTime, {
        queryType: query.type,
        tokensUsed: mockResponse.tokens
      });
      
      return mockResponse;
    } catch (error) {
      aiEconomicaLogger.logProvider(PremiumProvider.GEMINI_PRO, 'query_failed', Date.now() - startTime, {
        error: (error as Error).message
      });
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Mock health check
      return Math.random() > 0.1; // 90% uptime simulation
    } catch {
      return false;
    }
  }

  async getRemainingQuota(): Promise<{ daily: number; monthly: number }> {
    // Mock quota check
    return {
      daily: Math.floor(Math.random() * 1000),
      monthly: Math.floor(Math.random() * 25000)
    };
  }

  private generateMockResponse(query: AIQuery, startTime: number): AIResponse {
    const responseTemplates = {
      [QueryType.PROTOCOL]: 'Protocolo de fisioterapia recomendado: [Protocolo detalhado baseado na consulta]',
      [QueryType.DIAGNOSIS]: 'Análise diagnóstica: [Possíveis diagnósticos e recomendações]',
      [QueryType.EXERCISE]: 'Exercícios recomendados: [Lista de exercícios específicos]',
      [QueryType.RESEARCH]: 'Pesquisa científica relevante: [Estudos e evidências]',
      [QueryType.EMERGENCY]: 'PROTOCOLO DE EMERGÊNCIA: [Passos imediatos de tratamento]',
      [QueryType.GENERAL]: 'Resposta geral: [Informações relevantes sobre o tópico]'
    };

    return {
      id: `gemini_${Date.now()}`,
      queryId: query.queryId,
      content: responseTemplates[query.type] + `\n\nBaseado na consulta: "${query.query}"`,
      source: ResponseSource.PREMIUM_AI,
      provider: PremiumProvider.GEMINI_PRO,
      confidence: ConfidenceLevel.HIGH,
      generatedAt: new Date(),
      processingTime: Date.now() - startTime,
      tokens: Math.floor(query.query.length / 4 * 1.5), // Estimate tokens
      cost: 0.002, // $0.002 per query
      citations: [
        {
          id: 'cite_1',
          title: 'Clinical Guidelines 2024',
          source: 'Medical Journal',
          relevance: 95,
          type: 'scientific'
        }
      ],
      cached: false
    };
  }
}

class ChatGPTClient implements ProviderClient {
  private sessionToken: string;

  constructor(sessionToken: string) {
    this.sessionToken = sessionToken;
  }

  async query(query: AIQuery): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Mock ChatGPT API call
      await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 1000));
      
      const mockResponse: AIResponse = {
        id: `chatgpt_${Date.now()}`,
        queryId: query.queryId,
        content: `Resposta do ChatGPT Plus para: "${query.query}"\n\n[Resposta detalhada e contextualizada]`,
        source: ResponseSource.PREMIUM_AI,
        provider: PremiumProvider.CHATGPT_PLUS,
        confidence: ConfidenceLevel.HIGH,
        generatedAt: new Date(),
        processingTime: Date.now() - startTime,
        tokens: Math.floor(query.query.length / 4 * 1.8),
        cost: 0.003,
        cached: false
      };
      
      aiEconomicaLogger.logProvider(PremiumProvider.CHATGPT_PLUS, 'query_completed', mockResponse.processingTime, {
        queryType: query.type,
        tokensUsed: mockResponse.tokens
      });
      
      return mockResponse;
    } catch (error) {
      aiEconomicaLogger.logProvider(PremiumProvider.CHATGPT_PLUS, 'query_failed', Date.now() - startTime, {
        error: (error as Error).message
      });
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    return Math.random() > 0.05; // 95% uptime
  }

  async getRemainingQuota(): Promise<{ daily: number; monthly: number }> {
    return {
      daily: Math.floor(Math.random() * 800),
      monthly: Math.floor(Math.random() * 20000)
    };
  }
}

class ClaudeClient implements ProviderClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async query(query: AIQuery): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2500 + 800));
      
      const mockResponse: AIResponse = {
        id: `claude_${Date.now()}`,
        queryId: query.queryId,
        content: `Análise do Claude Pro: "${query.query}"\n\n[Resposta analítica e detalhada com foco em segurança]`,
        source: ResponseSource.PREMIUM_AI,
        provider: PremiumProvider.CLAUDE_PRO,
        confidence: ConfidenceLevel.HIGH,
        generatedAt: new Date(),
        processingTime: Date.now() - startTime,
        tokens: Math.floor(query.query.length / 4 * 1.6),
        cost: 0.004,
        cached: false
      };
      
      aiEconomicaLogger.logProvider(PremiumProvider.CLAUDE_PRO, 'query_completed', mockResponse.processingTime);
      
      return mockResponse;
    } catch (error) {
      aiEconomicaLogger.logProvider(PremiumProvider.CLAUDE_PRO, 'query_failed', Date.now() - startTime, {
        error: (error as Error).message
      });
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    return Math.random() > 0.08; // 92% uptime
  }

  async getRemainingQuota(): Promise<{ daily: number; monthly: number }> {
    return {
      daily: Math.floor(Math.random() * 600),
      monthly: Math.floor(Math.random() * 15000)
    };
  }
}

class AIEconomicaPremiumAccountManager {
  private accounts: Map<PremiumProvider, PremiumAccount> = new Map();
  private clients: Map<PremiumProvider, ProviderClient> = new Map();
  private rotationConfig: ProviderRotationConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private failedProviders: Set<PremiumProvider> = new Set();
  private cooldownTimers: Map<PremiumProvider, NodeJS.Timeout> = new Map();

  constructor() {
    this.rotationConfig = AI_ECONOMICA_CONFIG.rotation;
    this.initializeAccounts();
    this.initializeClients();
    this.startHealthMonitoring();
  }

  private initializeAccounts() {
    const providerConfigs = AI_ECONOMICA_CONFIG.providers;
    
    Object.entries(providerConfigs).forEach(([provider, config]) => {
      const account: PremiumAccount = {
        id: `${provider}_account`,
        provider: provider as PremiumProvider,
        name: config.name || provider,
        credentials: {}, // Would be loaded from secure storage
        isActive: config.isActive ?? true,
        dailyLimit: config.dailyLimit || 1000,
        monthlyLimit: config.monthlyLimit || 25000,
        dailyUsed: 0,
        monthlyUsed: 0,
        resetTime: this.getNextResetTime(),
        lastUsed: new Date(),
        successRate: 95,
        avgResponseTime: 2000,
        priority: config.priority || 5,
        retryAttempts: 0,
        maxRetries: config.maxRetries || 3,
        timeoutMs: config.timeoutMs || 30000,
        rateLimitPerMinute: config.rateLimitPerMinute || 60,
        costPerQuery: config.costPerQuery || 0.002,
        features: config.features || [],
        restrictions: config.restrictions || [],
        healthStatus: 'healthy',
        lastHealthCheck: new Date()
      };
      
      this.accounts.set(provider as PremiumProvider, account);
    });
  }

  private initializeClients() {
    // Initialize API clients with mock credentials
    this.clients.set(PremiumProvider.GEMINI_PRO, new GeminiClient('mock_api_key'));
    this.clients.set(PremiumProvider.CHATGPT_PLUS, new ChatGPTClient('mock_session'));
    this.clients.set(PremiumProvider.CLAUDE_PRO, new ClaudeClient('mock_api_key'));
    
    // Perplexity and Mars AI would be initialized similarly in a real implementation
  }

  // Provider selection and routing
  async selectOptimalProvider(query: AIQuery): Promise<PremiumProvider | null> {
    const startTime = Date.now();
    
    try {
      // Get query-specific provider preferences
      const queryConfig = QUERY_TYPE_CONFIGS[query.type];
      const preferredProviders = queryConfig?.preferredProviders || [];
      
      // Get available providers
      const availableProviders = await this.getHealthyProviders();
      
      if (availableProviders.length === 0) {
        aiEconomicaLogger.warn('No healthy providers available');
        return null;
      }
      
      // Apply selection strategy
      let selectedProvider: PremiumProvider | null = null;
      
      switch (this.rotationConfig.strategy) {
        case 'cost_optimized':
          selectedProvider = this.selectByCostOptimization(availableProviders, preferredProviders);
          break;
        case 'best_performance':
          selectedProvider = this.selectByPerformance(availableProviders, preferredProviders);
          break;
        case 'least_used':
          selectedProvider = this.selectByLeastUsed(availableProviders, preferredProviders);
          break;
        case 'round_robin':
        default:
          selectedProvider = this.selectByRoundRobin(availableProviders, preferredProviders);
          break;
      }
      
      if (selectedProvider) {
        aiEconomicaLogger.logProvider(selectedProvider, 'selected', Date.now() - startTime, {
          strategy: this.rotationConfig.strategy,
          queryType: query.type,
          availableCount: availableProviders.length
        });
      }
      
      return selectedProvider;
    } catch (error) {
      aiEconomicaLogger.error('Provider selection failed', error as Error, { queryType: query.type });
      return null;
    }
  }

  async executeQuery(provider: PremiumProvider, query: AIQuery): Promise<AIResponse> {
    const account = this.accounts.get(provider);
    if (!account) {
      throw new Error(`Provider ${provider} not configured`);
    }

    // Check limits
    if (!this.canExecuteQuery(account)) {
      const error: AIEconomicaError = new Error('Provider limit exceeded') as AIEconomicaError;
      error.code = 'LIMIT_EXCEEDED';
      error.category = 'provider';
      error.severity = 'high';
      error.context = { provider, dailyUsed: account.dailyUsed, dailyLimit: account.dailyLimit };
      error.retryable = false;
      error.suggestions = ['Try a different provider', 'Wait for limit reset'];
      throw error;
    }

    const client = this.clients.get(provider);
    if (!client) {
      throw new Error(`Client not available for ${provider}`);
    }

    const startTime = Date.now();
    
    try {
      const response = await client.query(query);
      
      // Update usage statistics
      await this.updateUsageStats(provider, response);
      
      // Update account metrics
      account.lastUsed = new Date();
      account.successRate = this.calculateSuccessRate(account, true);
      account.avgResponseTime = this.updateAverageResponseTime(account, response.processingTime);
      
      return response;
    } catch (error) {
      // Handle failures
      account.retryAttempts++;
      account.successRate = this.calculateSuccessRate(account, false);
      
      if (account.retryAttempts >= account.maxRetries) {
        this.markProviderAsFailed(provider);
      }
      
      aiEconomicaLogger.logProvider(provider, 'query_failed', Date.now() - startTime, {
        error: (error as Error).message,
        retryAttempts: account.retryAttempts
      });
      
      throw error;
    }
  }

  // Health monitoring and management
  private async getHealthyProviders(): Promise<PremiumProvider[]> {
    const healthyProviders: PremiumProvider[] = [];
    
    for (const [provider, account] of this.accounts.entries()) {
      if (account.isActive && 
          account.healthStatus !== 'unavailable' && 
          !this.failedProviders.has(provider) &&
          this.canExecuteQuery(account)) {
        healthyProviders.push(provider);
      }
    }
    
    return healthyProviders.sort((a, b) => {
      const accountA = this.accounts.get(a)!;
      const accountB = this.accounts.get(b)!;
      return accountB.priority - accountA.priority; // Higher priority first
    });
  }

  private async performHealthCheck(provider: PremiumProvider): Promise<void> {
    const account = this.accounts.get(provider);
    const client = this.clients.get(provider);
    
    if (!account || !client) return;
    
    const startTime = Date.now();
    
    try {
      const isHealthy = await client.healthCheck();
      const responseTime = Date.now() - startTime;
      
      if (isHealthy) {
        account.healthStatus = 'healthy';
        this.failedProviders.delete(provider);
        
        // Clear any existing cooldown
        const cooldownTimer = this.cooldownTimers.get(provider);
        if (cooldownTimer) {
          clearTimeout(cooldownTimer);
          this.cooldownTimers.delete(provider);
        }
      } else {
        account.healthStatus = 'degraded';
      }
      
      account.lastHealthCheck = new Date();
      account.avgResponseTime = this.updateAverageResponseTime(account, responseTime);
      
      aiEconomicaLogger.logProvider(provider, 'health_check', responseTime, {
        status: account.healthStatus,
        isHealthy
      });
      
    } catch (error) {
      account.healthStatus = 'unavailable';
      this.markProviderAsFailed(provider);
      
      aiEconomicaLogger.logProvider(provider, 'health_check_failed', Date.now() - startTime, {
        error: (error as Error).message
      });
    }
  }

  private markProviderAsFailed(provider: PremiumProvider): void {
    this.failedProviders.add(provider);
    
    // Set cooldown period
    const cooldownTimer = setTimeout(() => {
      this.failedProviders.delete(provider);
      this.cooldownTimers.delete(provider);
      
      aiEconomicaLogger.logProvider(provider, 'cooldown_expired', 0, {
        cooldownPeriod: this.rotationConfig.cooldownPeriod
      });
    }, this.rotationConfig.cooldownPeriod);
    
    this.cooldownTimers.set(provider, cooldownTimer);
    
    aiEconomicaLogger.logProvider(provider, 'marked_failed', 0, {
      cooldownPeriod: this.rotationConfig.cooldownPeriod
    });
  }

  // Provider selection strategies
  private selectByCostOptimization(available: PremiumProvider[], preferred: PremiumProvider[]): PremiumProvider {
    // Prefer cheaper providers from the preferred list
    const preferredAvailable = available.filter(p => preferred.includes(p));
    const candidates = preferredAvailable.length > 0 ? preferredAvailable : available;
    
    return candidates.sort((a, b) => {
      const accountA = this.accounts.get(a)!;
      const accountB = this.accounts.get(b)!;
      return accountA.costPerQuery - accountB.costPerQuery;
    })[0];
  }

  private selectByPerformance(available: PremiumProvider[], preferred: PremiumProvider[]): PremiumProvider {
    // Prefer fastest, most reliable providers
    const preferredAvailable = available.filter(p => preferred.includes(p));
    const candidates = preferredAvailable.length > 0 ? preferredAvailable : available;
    
    return candidates.sort((a, b) => {
      const accountA = this.accounts.get(a)!;
      const accountB = this.accounts.get(b)!;
      
      // Score based on success rate and response time
      const scoreA = accountA.successRate - (accountA.avgResponseTime / 1000);
      const scoreB = accountB.successRate - (accountB.avgResponseTime / 1000);
      
      return scoreB - scoreA;
    })[0];
  }

  private selectByLeastUsed(available: PremiumProvider[], preferred: PremiumProvider[]): PremiumProvider {
    // Select the provider with the most remaining quota
    const preferredAvailable = available.filter(p => preferred.includes(p));
    const candidates = preferredAvailable.length > 0 ? preferredAvailable : available;
    
    return candidates.sort((a, b) => {
      const accountA = this.accounts.get(a)!;
      const accountB = this.accounts.get(b)!;
      
      const remainingA = (accountA.dailyLimit - accountA.dailyUsed) / accountA.dailyLimit;
      const remainingB = (accountB.dailyLimit - accountB.dailyUsed) / accountB.dailyLimit;
      
      return remainingB - remainingA;
    })[0];
  }

  private selectByRoundRobin(available: PremiumProvider[], preferred: PremiumProvider[]): PremiumProvider {
    // Simple round-robin selection
    const preferredAvailable = available.filter(p => preferred.includes(p));
    const candidates = preferredAvailable.length > 0 ? preferredAvailable : available;
    
    // For simplicity, just return the first available (in a real implementation would maintain state)
    return candidates[0];
  }

  // Usage tracking and statistics
  private async updateUsageStats(provider: PremiumProvider, response: AIResponse): Promise<void> {
    const account = this.accounts.get(provider);
    if (!account) return;
    
    // Update usage counters
    account.dailyUsed++;
    account.monthlyUsed++;
    
    // Check if we need to create alerts
    const dailyUsagePercent = (account.dailyUsed / account.dailyLimit) * 100;
    const monthlyUsagePercent = (account.monthlyUsed / account.monthlyLimit) * 100;
    
    if (dailyUsagePercent >= 80) {
      aiEconomicaLogger.warn(`${provider} approaching daily limit`, {
        used: account.dailyUsed,
        limit: account.dailyLimit,
        percentage: dailyUsagePercent
      });
    }
    
    if (monthlyUsagePercent >= 80) {
      aiEconomicaLogger.warn(`${provider} approaching monthly limit`, {
        used: account.monthlyUsed,
        limit: account.monthlyLimit,
        percentage: monthlyUsagePercent
      });
    }
  }

  // Utility methods
  private canExecuteQuery(account: PremiumAccount): boolean {
    return account.dailyUsed < account.dailyLimit && 
           account.monthlyUsed < account.monthlyLimit &&
           account.healthStatus !== 'unavailable';
  }

  private calculateSuccessRate(account: PremiumAccount, wasSuccessful: boolean): number {
    // Simple exponential moving average
    const alpha = 0.1; // Smoothing factor
    const newValue = wasSuccessful ? 100 : 0;
    return account.successRate * (1 - alpha) + newValue * alpha;
  }

  private updateAverageResponseTime(account: PremiumAccount, newTime: number): number {
    // Simple exponential moving average
    const alpha = 0.2;
    return account.avgResponseTime * (1 - alpha) + newTime * alpha;
  }

  private getNextResetTime(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  private startHealthMonitoring(): void {
    if (this.rotationConfig.healthCheckInterval > 0) {
      this.healthCheckInterval = setInterval(async () => {
        for (const provider of this.accounts.keys()) {
          await this.performHealthCheck(provider);
        }
      }, this.rotationConfig.healthCheckInterval);
    }
  }

  // Public API
  async getAccountStats(): Promise<Map<PremiumProvider, PremiumAccount>> {
    return new Map(this.accounts);
  }

  async getUsageMetrics(): Promise<UsageMetrics[]> {
    const metrics: UsageMetrics[] = [];
    
    for (const [provider, account] of this.accounts.entries()) {
      metrics.push({
        provider,
        date: new Date(),
        queries: account.dailyUsed,
        tokens: account.dailyUsed * 100, // Estimate
        cost: account.dailyUsed * account.costPerQuery,
        avgResponseTime: account.avgResponseTime,
        successRate: account.successRate,
        errorTypes: {} // Would track specific error types
      });
    }
    
    return metrics;
  }

  async resetDailyLimits(): Promise<void> {
    for (const account of this.accounts.values()) {
      account.dailyUsed = 0;
      account.resetTime = this.getNextResetTime();
    }
    
    aiEconomicaLogger.info('Daily limits reset for all providers');
  }

  // Cleanup
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    for (const timer of this.cooldownTimers.values()) {
      clearTimeout(timer);
    }
    this.cooldownTimers.clear();
  }
}

export const aiEconomicaPremiumAccountManager = new AIEconomicaPremiumAccountManager();

// Legacy compatibility
export const premiumAccountManager = {
  selectBestProvider: (queryType: QueryType) => {
    const mockQuery: AIQuery = { 
      id: 'temp', 
      queryId: 'temp',
      query: 'temp', 
      type: queryType, 
      userId: 'temp', 
      priority: 'medium', 
      createdAt: new Date(), 
      language: 'pt-BR'
    };
    return aiEconomicaPremiumAccountManager.selectOptimalProvider(mockQuery);
  },
  
  query: (provider: PremiumProvider, query: AIQuery) => 
    aiEconomicaPremiumAccountManager.executeQuery(provider, query),
    
  getAvailableProviders: () => 
    aiEconomicaPremiumAccountManager.getAccountStats().then(stats => 
      Array.from(stats.keys()).filter(provider => stats.get(provider)?.isActive)
    ),
    
  trackUsage: async (provider: PremiumProvider, tokensUsed: number) => {
    aiEconomicaLogger.logProvider(provider, 'usage_tracked', 0, { tokensUsed });
  }
};

export default aiEconomicaPremiumAccountManager;