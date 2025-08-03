import { 
  PremiumProvider, 
  ProviderConfig, 
  UsageTracker, 
  UsageStatus, 
  AIQuery, 
  AIResponse, 
  QueryType,
  Alert,
  ResponseSourceType
} from '../../types/ai-economica.types';
import aiEconomicaConfig, { ENHANCED_PROVIDER_STRATEGY } from '../../config/ai-economica.config';
import aiLogger, { LogCategory } from './logger';

interface ProviderClient {
  query(query: AIQuery, config: ProviderConfig): Promise<AIResponse>;
  testConnection(config: ProviderConfig): Promise<boolean>;
  estimateTokens(text: string): number;
}

class ChatGPTPlusClient implements ProviderClient {
  async query(query: AIQuery, config: ProviderConfig): Promise<AIResponse> {
    try {
      // Implementação para ChatGPT Plus (web scraping seguro)
      // Esta seria uma implementação usando puppeteer ou similar
      // Por ora, simularemos a resposta
      
      const response = await this.makeWebRequest(config.endpoint, {
        message: query.text,
        context: query.context,
        model: 'gpt-4'
      }, config);

      return {
        id: this.generateResponseId(),
        queryId: query.id,
        content: response.message,
        confidence: 0.85,
        source: 'premium' as ResponseSourceType,
        provider: PremiumProvider.CHATGPT_PLUS,
        references: [],
        suggestions: response.suggestions || [],
        followUpQuestions: response.followUpQuestions || [],
        tokensUsed: this.estimateTokens(query.text + response.message),
        responseTime: response.responseTime || 0,
        createdAt: new Date().toISOString(),
        metadata: {
          reliability: 0.9,
          relevance: 0.85
        }
      };
    } catch (error) {
      aiLogger.error(LogCategory.PROVIDER, 'Erro no ChatGPT Plus', error as Error, { 
        queryId: query.id,
        provider: PremiumProvider.CHATGPT_PLUS 
      });
      throw error;
    }
  }

  async testConnection(config: ProviderConfig): Promise<boolean> {
    try {
      const testQuery: AIQuery = {
        id: 'test_' + Date.now(),
        text: 'Test connection',
        type: QueryType.GENERAL_QUESTION,
        context: { userRole: 'system' },
        priority: 'low',
        maxResponseTime: 10000,
        hash: 'test',
        createdAt: new Date().toISOString()
      };

      await this.query(testQuery, config);
      return true;
    } catch (error) {
      return false;
    }
  }

  estimateTokens(text: string): number {
    // Estimativa simples: ~4 caracteres por token
    return Math.ceil(text.length / 4);
  }

  private async makeWebRequest(endpoint: string, data: any, config: ProviderConfig): Promise<any> {
    // Esta seria a implementação real de web scraping
    // Por ora, simular resposta
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    return {
      message: `Resposta simulada do ChatGPT Plus para: ${data.message}`,
      suggestions: ['Sugestão 1', 'Sugestão 2'],
      followUpQuestions: ['Pergunta de follow-up 1?'],
      responseTime: 1500
    };
  }

  private generateResponseId(): string {
    return `chatgpt_response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

class GeminiProClient implements ProviderClient {
  async query(query: AIQuery, config: ProviderConfig): Promise<AIResponse> {
    try {
      const response = await this.makeAPIRequest(config, {
        contents: [{
          parts: [{ text: this.buildPrompt(query) }]
        }]
      });

      return {
        id: this.generateResponseId(),
        queryId: query.id,
        content: response.candidates[0].content.parts[0].text,
        confidence: 0.88,
        source: 'premium' as ResponseSourceType,
        provider: PremiumProvider.GEMINI_PRO,
        references: [],
        suggestions: [],
        followUpQuestions: [],
        tokensUsed: response.usageMetadata?.totalTokenCount || this.estimateTokens(query.text + response.candidates[0].content.parts[0].text),
        responseTime: response.responseTime || 0,
        createdAt: new Date().toISOString(),
        metadata: {
          reliability: 0.88,
          relevance: 0.87
        }
      };
    } catch (error) {
      aiLogger.error(LogCategory.PROVIDER, 'Erro no Gemini Pro', error as Error, { 
        queryId: query.id,
        provider: PremiumProvider.GEMINI_PRO 
      });
      throw error;
    }
  }

  async testConnection(config: ProviderConfig): Promise<boolean> {
    try {
      const response = await this.makeAPIRequest(config, {
        contents: [{ parts: [{ text: 'Test' }] }]
      });
      return !!response.candidates;
    } catch (error) {
      return false;
    }
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 3.5);
  }

  private buildPrompt(query: AIQuery): string {
    let prompt = query.text;
    
    if (query.context) {
      if (query.context.symptoms?.length) {
        prompt += `\n\nSintomas: ${query.context.symptoms.join(', ')}`;
      }
      if (query.context.diagnosis) {
        prompt += `\n\nDiagnóstico: ${query.context.diagnosis}`;
      }
      if (query.context.previousTreatments?.length) {
        prompt += `\n\nTratamentos anteriores: ${query.context.previousTreatments.join(', ')}`;
      }
    }

    return prompt;
  }

  private async makeAPIRequest(config: ProviderConfig, data: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${config.endpoint}?key=${config.credentials.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      result.responseTime = Date.now() - startTime;
      
      return result;
    } catch (error) {
      throw new Error(`Falha na comunicação com Gemini Pro: ${error}`);
    }
  }

  private generateResponseId(): string {
    return `gemini_response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

class ClaudeProClient implements ProviderClient {
  async query(query: AIQuery, config: ProviderConfig): Promise<AIResponse> {
    try {
      // Implementação para Claude Pro (similar ao ChatGPT, web scraping)
      const response = await this.makeWebRequest(config.endpoint, {
        message: query.text,
        context: query.context
      }, config);

      return {
        id: this.generateResponseId(),
        queryId: query.id,
        content: response.message,
        confidence: 0.90,
        source: 'premium' as ResponseSourceType,
        provider: PremiumProvider.CLAUDE_PRO,
        references: response.references || [],
        suggestions: response.suggestions || [],
        followUpQuestions: response.followUpQuestions || [],
        tokensUsed: this.estimateTokens(query.text + response.message),
        responseTime: response.responseTime || 0,
        createdAt: new Date().toISOString(),
        metadata: {
          reliability: 0.92,
          relevance: 0.89
        }
      };
    } catch (error) {
      aiLogger.error(LogCategory.PROVIDER, 'Erro no Claude Pro', error as Error, { 
        queryId: query.id,
        provider: PremiumProvider.CLAUDE_PRO 
      });
      throw error;
    }
  }

  async testConnection(config: ProviderConfig): Promise<boolean> {
    try {
      await this.makeWebRequest(config.endpoint, { message: 'Test' }, config);
      return true;
    } catch (error) {
      return false;
    }
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 3.8);
  }

  private async makeWebRequest(endpoint: string, data: any, config: ProviderConfig): Promise<any> {
    // Simulação da implementação Claude Pro
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 1800));
    
    return {
      message: `Resposta simulada do Claude Pro para: ${data.message}`,
      references: [],
      suggestions: ['Sugestão Claude 1', 'Sugestão Claude 2'],
      followUpQuestions: ['Follow-up Claude?'],
      responseTime: 1800
    };
  }

  private generateResponseId(): string {
    return `claude_response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

class PerplexityProClient implements ProviderClient {
  async query(query: AIQuery, config: ProviderConfig): Promise<AIResponse> {
    try {
      const response = await this.makeWebRequest(config.endpoint, {
        query: query.text,
        context: query.context
      }, config);

      return {
        id: this.generateResponseId(),
        queryId: query.id,
        content: response.answer,
        confidence: 0.82,
        source: 'premium' as ResponseSourceType,
        provider: PremiumProvider.PERPLEXITY_PRO,
        references: response.sources || [],
        suggestions: [],
        followUpQuestions: response.relatedQuestions || [],
        tokensUsed: this.estimateTokens(query.text + response.answer),
        responseTime: response.responseTime || 0,
        createdAt: new Date().toISOString(),
        metadata: {
          evidenceLevel: 'high',
          reliability: 0.85,
          relevance: 0.83
        }
      };
    } catch (error) {
      aiLogger.error(LogCategory.PROVIDER, 'Erro no Perplexity Pro', error as Error, { 
        queryId: query.id,
        provider: PremiumProvider.PERPLEXITY_PRO 
      });
      throw error;
    }
  }

  async testConnection(config: ProviderConfig): Promise<boolean> {
    try {
      await this.makeWebRequest(config.endpoint, { query: 'Test' }, config);
      return true;
    } catch (error) {
      return false;
    }
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4.2);
  }

  private async makeWebRequest(endpoint: string, data: any, config: ProviderConfig): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    return {
      answer: `Resposta do Perplexity Pro com fontes para: ${data.query}`,
      sources: [
        { title: 'Fonte científica 1', url: 'https://example.com/1', type: 'study' },
        { title: 'Fonte científica 2', url: 'https://example.com/2', type: 'guideline' }
      ],
      relatedQuestions: ['Pergunta relacionada 1?', 'Pergunta relacionada 2?'],
      responseTime: 2800
    };
  }

  private generateResponseId(): string {
    return `perplexity_response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class PremiumAccountManager {
  private providers: Map<PremiumProvider, ProviderConfig> = new Map();
  private clients: Map<PremiumProvider, ProviderClient> = new Map();
  private usageTrackers: Map<PremiumProvider, UsageTracker> = new Map();
  private lastProviderUsed: Map<QueryType, PremiumProvider> = new Map();

  constructor() {
    this.initializeProviders();
    this.initializeClients();
    this.initializeUsageTrackers();
    this.setupUsageReset();
  }

  private initializeProviders(): void {
    // Carregar configurações dos provedores
    Object.entries(aiEconomicaConfig.providers).forEach(([providerKey, config]) => {
      const provider = providerKey as PremiumProvider;
      this.providers.set(provider, { ...config } as ProviderConfig);
    });
  }

  private initializeClients(): void {
    this.clients.set(PremiumProvider.CHATGPT_PLUS, new ChatGPTPlusClient());
    this.clients.set(PremiumProvider.GEMINI_PRO, new GeminiProClient());
    this.clients.set(PremiumProvider.CLAUDE_PRO, new ClaudeProClient());
    this.clients.set(PremiumProvider.PERPLEXITY_PRO, new PerplexityProClient());
    // Mars AI Pro seria implementado similarmente
  }

  private initializeUsageTrackers(): void {
    this.providers.forEach((config, provider) => {
      const tracker: UsageTracker = {
        provider,
        current: { monthly: 0, daily: 0, hourly: 0 },
        limits: { 
          monthly: config.limits.monthly, 
          daily: config.limits.daily, 
          hourly: config.limits.hourly 
        },
        status: UsageStatus.AVAILABLE,
        percentage: 0,
        resetDates: {
          monthly: this.getNextMonthReset(),
          daily: this.getNextDayReset(),
          hourly: this.getNextHourReset()
        }
      };
      
      this.usageTrackers.set(provider, tracker);
      this.loadUsageFromStorage(provider);
    });
  }

  async selectBestProvider(queryType: QueryType): Promise<PremiumProvider | null> {
    try {
      const availableProviders = await this.getAvailableProviders();
      
      if (availableProviders.length === 0) {
        aiLogger.warn(LogCategory.PROVIDER, 'Nenhum provedor premium disponível');
        return null;
      }

      // Aplicar estratégia de seleção
      const strategy = ENHANCED_PROVIDER_STRATEGY;
      const preferredProviders = strategy[queryType] || strategy.getFallbackChain(queryType);
      
      // Encontrar primeiro provedor preferido disponível
      for (const provider of preferredProviders) {
        if (availableProviders.includes(provider)) {
          // Aplicar balanceamento de carga se habilitado
          if (strategy.loadBalancing.enabled) {
            return this.applyLoadBalancing(availableProviders, queryType);
          }
          return provider;
        }
      }

      // Se nenhum preferido está disponível, usar qualquer disponível
      return availableProviders[0];
    } catch (error) {
      aiLogger.error(LogCategory.PROVIDER, 'Erro ao selecionar provedor', error as Error, { queryType });
      return null;
    }
  }

  async getAvailableProviders(): Promise<PremiumProvider[]> {
    const available: PremiumProvider[] = [];
    
    for (const [provider, config] of this.providers) {
      if (!config.enabled) continue;
      
      const tracker = this.usageTrackers.get(provider);
      if (!tracker) continue;
      
      // Verificar se não atingiu limites críticos
      if (tracker.status === UsageStatus.AVAILABLE || tracker.status === UsageStatus.WARNING) {
        available.push(provider);
      }
    }
    
    return available;
  }

  async query(provider: PremiumProvider, query: AIQuery): Promise<AIResponse> {
    const config = this.providers.get(provider);
    const client = this.clients.get(provider);
    
    if (!config || !client) {
      throw new Error(`Provedor ${provider} não configurado`);
    }

    if (!config.enabled) {
      throw new Error(`Provedor ${provider} está desabilitado`);
    }

    const tracker = this.usageTrackers.get(provider);
    if (!tracker || tracker.status === UsageStatus.BLOCKED) {
      throw new Error(`Provedor ${provider} bloqueado por limite de uso`);
    }

    try {
      const startTime = Date.now();
      const response = await client.query(query, config);
      const endTime = Date.now();
      
      response.responseTime = endTime - startTime;
      
      // Registrar uso
      await this.trackUsage(provider, response.tokensUsed || 0);
      
      // Atualizar último provedor usado
      this.lastProviderUsed.set(query.type, provider);
      
      aiLogger.logProviderUsage(provider, query.type, response.tokensUsed || 0, true);
      
      return response;
    } catch (error) {
      aiLogger.logProviderUsage(provider, query.type, 0, false);
      throw error;
    }
  }

  async trackUsage(provider: PremiumProvider, tokensUsed: number): Promise<void> {
    const tracker = this.usageTrackers.get(provider);
    if (!tracker) return;

    // Atualizar contadores
    tracker.current.hourly += tokensUsed;
    tracker.current.daily += tokensUsed;
    tracker.current.monthly += tokensUsed;

    // Calcular percentual baseado no limite mais restritivo
    const hourlyPercent = tracker.current.hourly / tracker.limits.hourly;
    const dailyPercent = tracker.current.daily / tracker.limits.daily;
    const monthlyPercent = tracker.current.monthly / tracker.limits.monthly;
    
    tracker.percentage = Math.max(hourlyPercent, dailyPercent, monthlyPercent);

    // Atualizar status
    if (tracker.percentage >= 1.0) {
      tracker.status = UsageStatus.BLOCKED;
    } else if (tracker.percentage >= aiEconomicaConfig.alerts.thresholds.usageCritical) {
      tracker.status = UsageStatus.CRITICAL;
    } else if (tracker.percentage >= aiEconomicaConfig.alerts.thresholds.usageWarning) {
      tracker.status = UsageStatus.WARNING;
    } else {
      tracker.status = UsageStatus.AVAILABLE;
    }

    // Salvar no storage
    this.saveUsageToStorage(provider);

    // Verificar alertas
    await this.checkUsageAlerts(provider, tracker);
  }

  async getCurrentUsage(provider: PremiumProvider): Promise<UsageTracker> {
    const tracker = this.usageTrackers.get(provider);
    if (!tracker) {
      throw new Error(`Tracker não encontrado para provedor ${provider}`);
    }
    
    return { ...tracker };
  }

  async testProvider(provider: PremiumProvider): Promise<boolean> {
    const config = this.providers.get(provider);
    const client = this.clients.get(provider);
    
    if (!config || !client) return false;
    
    try {
      return await client.testConnection(config);
    } catch (error) {
      aiLogger.error(LogCategory.PROVIDER, `Teste de conexão falhou para ${provider}`, error as Error);
      return false;
    }
  }

  async updateProviderConfig(provider: PremiumProvider, newConfig: Partial<ProviderConfig>): Promise<void> {
    const currentConfig = this.providers.get(provider);
    if (!currentConfig) {
      throw new Error(`Provedor ${provider} não encontrado`);
    }

    const updatedConfig = { ...currentConfig, ...newConfig };
    this.providers.set(provider, updatedConfig);
    
    // Atualizar tracker se limites mudaram
    if (newConfig.limits) {
      const tracker = this.usageTrackers.get(provider);
      if (tracker) {
        tracker.limits = updatedConfig.limits;
        this.usageTrackers.set(provider, tracker);
      }
    }

    aiLogger.info(LogCategory.PROVIDER, `Configuração atualizada para ${provider}`, newConfig);
  }

  getProviderStats(): Record<PremiumProvider, {
    enabled: boolean;
    status: UsageStatus;
    usage: { hourly: number; daily: number; monthly: number };
    limits: { perHour: number; daily: number; monthly: number };
    percentage: number;
    lastUsed?: Date;
  }> {
    const stats = {} as any;
    
    this.providers.forEach((config, provider) => {
      const tracker = this.usageTrackers.get(provider);
      const lastUsed = this.lastProviderUsed.get(QueryType.GENERAL_QUESTION); // Aproximação
      
      stats[provider] = {
        enabled: config.enabled,
        status: tracker?.status || UsageStatus.BLOCKED,
        usage: tracker?.current || { hourly: 0, daily: 0, monthly: 0 },
        limits: tracker?.limits || { perHour: 0, daily: 0, monthly: 0 },
        percentage: tracker?.percentage || 0,
        lastUsed: lastUsed === provider ? new Date() : undefined
      };
    });
    
    return stats;
  }

  private applyLoadBalancing(availableProviders: PremiumProvider[], queryType: QueryType): PremiumProvider {
    const strategy = ENHANCED_PROVIDER_STRATEGY.loadBalancing;
    
    switch (strategy.algorithm) {
      case 'round_robin':
        return this.roundRobinSelection(availableProviders, queryType);
      case 'least_used':
        return this.leastUsedSelection(availableProviders);
      case 'weighted':
        return this.weightedSelection(availableProviders, strategy.weights);
      default:
        return availableProviders[0];
    }
  }

  private roundRobinSelection(providers: PremiumProvider[], queryType: QueryType): PremiumProvider {
    const lastUsed = this.lastProviderUsed.get(queryType);
    
    if (!lastUsed) return providers[0];
    
    const lastIndex = providers.indexOf(lastUsed);
    const nextIndex = (lastIndex + 1) % providers.length;
    
    return providers[nextIndex];
  }

  private leastUsedSelection(providers: PremiumProvider[]): PremiumProvider {
    let leastUsed = providers[0];
    let minUsage = Number.MAX_SAFE_INTEGER;
    
    providers.forEach(provider => {
      const tracker = this.usageTrackers.get(provider);
      if (tracker && tracker.current.monthly < minUsage) {
        minUsage = tracker.current.monthly;
        leastUsed = provider;
      }
    });
    
    return leastUsed;
  }

  private weightedSelection(providers: PremiumProvider[], weights: Record<PremiumProvider, number>): PremiumProvider {
    const weightedProviders: Array<{ provider: PremiumProvider; weight: number }> = [];
    
    providers.forEach(provider => {
      const weight = weights[provider] || 1;
      const tracker = this.usageTrackers.get(provider);
      
      // Ajustar peso baseado no uso atual
      const adjustedWeight = tracker ? weight * (1 - tracker.percentage) : weight;
      
      weightedProviders.push({ provider, weight: adjustedWeight });
    });
    
    // Seleção weighted random
    const totalWeight = weightedProviders.reduce((sum, item) => sum + item.weight, 0);
    const random = Math.random() * totalWeight;
    
    let accumWeight = 0;
    for (const item of weightedProviders) {
      accumWeight += item.weight;
      if (random <= accumWeight) {
        return item.provider;
      }
    }
    
    return providers[0];
  }

  private async checkUsageAlerts(provider: PremiumProvider, tracker: UsageTracker): Promise<void> {
    if (!aiEconomicaConfig.alerts.enabled) return;

    const thresholds = aiEconomicaConfig.alerts.thresholds;
    
    if (tracker.percentage >= thresholds.usageCritical && tracker.status === UsageStatus.CRITICAL) {
      await this.sendAlert(provider, 'usage_critical', {
        percentage: tracker.percentage,
        current: tracker.current,
        limits: tracker.limits
      });
    } else if (tracker.percentage >= thresholds.usageWarning && tracker.status === UsageStatus.WARNING) {
      await this.sendAlert(provider, 'usage_warning', {
        percentage: tracker.percentage,
        current: tracker.current,
        limits: tracker.limits
      });
    }
  }

  private async sendAlert(provider: PremiumProvider, type: string, data: any): Promise<void> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: type as any,
      severity: type.includes('critical') ? 'critical' : 'medium',
      provider,
      message: this.generateAlertMessage(provider, type, data),
      data,
      createdAt: new Date().toISOString(),
      resolved: false
    };

    aiLogger.warn(LogCategory.PROVIDER, alert.message, alert);
    
    // Aqui seria implementado o envio real de alertas (email, dashboard, etc.)
  }

  private generateAlertMessage(provider: PremiumProvider, type: string, data: any): string {
    switch (type) {
      case 'usage_warning':
        return `Provedor ${provider} atingiu ${Math.round(data.percentage * 100)}% do limite mensal`;
      case 'usage_critical':
        return `Provedor ${provider} atingiu ${Math.round(data.percentage * 100)}% do limite mensal - CRÍTICO`;
      default:
        return `Alerta para provedor ${provider}: ${type}`;
    }
  }

  private setupUsageReset(): void {
    // Reset horário
    setInterval(() => {
      this.resetHourlyUsage();
    }, 60 * 60 * 1000);

    // Reset diário
    setInterval(() => {
      this.resetDailyUsage();
    }, 24 * 60 * 60 * 1000);

    // Reset mensal (verificar a cada hora)
    setInterval(() => {
      this.checkMonthlyReset();
    }, 60 * 60 * 1000);
  }

  private resetHourlyUsage(): void {
    this.usageTrackers.forEach((tracker, provider) => {
      tracker.current.hourly = 0;
      tracker.resetDates.hourly = this.getNextHourReset();
      this.recalculateStatus(tracker);
      this.saveUsageToStorage(provider);
    });
  }

  private resetDailyUsage(): void {
    this.usageTrackers.forEach((tracker, provider) => {
      tracker.current.daily = 0;
      tracker.resetDates.daily = this.getNextDayReset();
      this.recalculateStatus(tracker);
      this.saveUsageToStorage(provider);
    });
  }

  private checkMonthlyReset(): void {
    const now = new Date();
    
    this.usageTrackers.forEach((tracker, provider) => {
      const resetDate = new Date(tracker.resetDates.monthly);
      
      if (now >= resetDate) {
        tracker.current.monthly = 0;
        tracker.resetDates.monthly = this.getNextMonthReset();
        this.recalculateStatus(tracker);
        this.saveUsageToStorage(provider);
        
        aiLogger.info(LogCategory.PROVIDER, `Reset mensal realizado para ${provider}`);
      }
    });
  }

  private recalculateStatus(tracker: UsageTracker): void {
    const hourlyPercent = tracker.current.hourly / tracker.limits.hourly;
    const dailyPercent = tracker.current.daily / tracker.limits.daily;
    const monthlyPercent = tracker.current.monthly / tracker.limits.monthly;
    
    tracker.percentage = Math.max(hourlyPercent, dailyPercent, monthlyPercent);

    if (tracker.percentage >= 1.0) {
      tracker.status = UsageStatus.BLOCKED;
    } else if (tracker.percentage >= aiEconomicaConfig.alerts.thresholds.usageCritical) {
      tracker.status = UsageStatus.CRITICAL;
    } else if (tracker.percentage >= aiEconomicaConfig.alerts.thresholds.usageWarning) {
      tracker.status = UsageStatus.WARNING;
    } else {
      tracker.status = UsageStatus.AVAILABLE;
    }
  }

  private getNextHourReset(): string {
    const next = new Date();
    next.setHours(next.getHours() + 1, 0, 0, 0);
    return next.toISOString();
  }

  private getNextDayReset(): string {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    next.setHours(0, 0, 0, 0);
    return next.toISOString();
  }

  private getNextMonthReset(): string {
    const next = new Date();
    next.setMonth(next.getMonth() + 1, 1);
    next.setHours(0, 0, 0, 0);
    return next.toISOString();
  }

  private saveUsageToStorage(provider: PremiumProvider): void {
    const tracker = this.usageTrackers.get(provider);
    if (tracker) {
      localStorage.setItem(`usage_${provider}`, JSON.stringify(tracker));
    }
  }

  private loadUsageFromStorage(provider: PremiumProvider): void {
    try {
      const stored = localStorage.getItem(`usage_${provider}`);
      if (stored) {
        const tracker: UsageTracker = JSON.parse(stored);
        
        // Verificar se dados não expiraram
        const now = new Date();
        if (new Date(tracker.resetDates.hourly) <= now) {
          tracker.current.hourly = 0;
          tracker.resetDates.hourly = this.getNextHourReset();
        }
        
        this.usageTrackers.set(provider, tracker);
      }
    } catch (error) {
      aiLogger.error(LogCategory.PROVIDER, `Erro ao carregar uso do ${provider}`, error as Error);
    }
  }
}

export default PremiumAccountManager;