
import { 
  AIQuery, 
  AIResponse, 
  ResponseSource, 
  QueryType,
  PremiumProvider,
  ConfidenceLevel,
  SearchQuery,
  EconomicMetrics,
  AIEconomicaError
} from '../../types/ai-economica.types';
import { knowledgeBaseService } from './knowledgeBaseService';
import { aiEconomicaCacheService } from './cacheService';
import { aiEconomicaPremiumAccountManager } from './premiumAccountManager';
import { aiEconomicaLogger } from './logger';
import { AI_ECONOMICA_CONFIG, QUALITY_THRESHOLDS } from '../../config/ai-economica.config';

interface QueryProcessingResult {
  response: AIResponse;
  source: ResponseSource;
  processingTime: number;
  cost: number;
  fromCache: boolean;
}

interface CombinedResponse {
  primary: AIResponse;
  secondary?: AIResponse;
  combined: AIResponse;
  sources: ResponseSource[];
  confidence: number;
}

class AIEconomicaService {
  private processingQueue: Map<string, Promise<AIResponse>> = new Map();
  private economics: EconomicMetrics;
  private activeQueries: Set<string> = new Set();

  constructor() {
    this.economics = this.initializeEconomics();
  }

  // Main query processing orchestrator
  async processQuery(query: AIQuery): Promise<AIResponse> {
    const startTime = Date.now();
    const queryKey = this.generateQueryKey(query);
    
    // Deduplicate identical concurrent queries
    if (this.processingQueue.has(queryKey)) {
      aiEconomicaLogger.logQuery(query.id, query.type, 'Deduplicating concurrent query');
      return await this.processingQueue.get(queryKey)!;
    }

    // Track active query
    this.activeQueries.add(query.id);
    
    const processingPromise = this.executeQueryFlow(query);
    this.processingQueue.set(queryKey, processingPromise);

    try {
      const response = await processingPromise;
      
      // Update economics
      this.updateEconomics(query, response, Date.now() - startTime);
      
      aiEconomicaLogger.logQuery(query.id, query.type, 'Query completed', {
        source: response.source,
        processingTime: Date.now() - startTime,
        cost: response.cost
      });
      
      return response;
    } catch (error) {
      aiEconomicaLogger.error('Query processing failed', error as Error, { 
        queryId: query.id, 
        type: query.type 
      });
      
      // Return fallback response
      return this.generateFallbackResponse(query, error as Error);
    } finally {
      // Cleanup
      this.processingQueue.delete(queryKey);
      this.activeQueries.delete(query.id);
    }
  }

  // Core query execution flow
  private async executeQueryFlow(query: AIQuery): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Step 1: Check knowledge base first (highest priority)
      const knowledgeResult = await this.searchKnowledgeBase(query);
      if (this.isResponseAcceptable(knowledgeResult)) {
        aiEconomicaLogger.logQuery(query.id, query.type, 'Knowledge base hit', {
          confidence: knowledgeResult.confidence,
          processingTime: Date.now() - startTime
        });
        return knowledgeResult;
      }

      // Step 2: Check cache
      const cacheResult = await this.searchCache(query);
      if (cacheResult) {
        aiEconomicaLogger.logQuery(query.id, query.type, 'Cache hit', {
          processingTime: Date.now() - startTime
        });
        return cacheResult;
      }

      // Step 3: Use premium AI providers
      const premiumResult = await this.queryPremiumProviders(query);
      if (premiumResult) {
        // Cache the result for future use
        await this.cacheResponse(query, premiumResult);
        
        aiEconomicaLogger.logQuery(query.id, query.type, 'Premium provider response', {
          provider: premiumResult.provider,
          processingTime: Date.now() - startTime,
          cost: premiumResult.cost
        });
        
        return premiumResult;
      }

      // Step 4: Fallback to knowledge base with lower threshold
      const fallbackKnowledge = await this.searchKnowledgeBase(query, 0.3); // Lower confidence threshold
      if (fallbackKnowledge.confidence > 0) {
        aiEconomicaLogger.logQuery(query.id, query.type, 'Fallback knowledge base response', {
          confidence: fallbackKnowledge.confidence
        });
        return fallbackKnowledge;
      }

      // Step 5: Generate error response
      throw new Error('No suitable response found from any source');

    } catch (error) {
      aiEconomicaLogger.error('Query flow failed', error as Error, { queryId: query.id });
      throw error;
    }
  }

  // Knowledge base search
  private async searchKnowledgeBase(query: AIQuery, minConfidence?: number): Promise<AIResponse> {
    const searchQuery: SearchQuery = {
      text: query.query,
      type: query.type,
      filters: query.context ? {
        tags: query.context.tags,
        specialty: query.context.specialty,
        minConfidence: minConfidence || QUALITY_THRESHOLDS.knowledgeBaseConfidence
      } : undefined,
      sorting: { field: 'confidence', order: 'desc' },
      pagination: { page: 1, limit: 5 }
    };

    const searchResponse = await knowledgeBaseService.search(searchQuery);
    
    if (searchResponse.results.length === 0) {
      return this.createEmptyResponse(query, ResponseSource.INTERNAL_KB);
    }

    const bestResult = searchResponse.results[0];
    const confidence = this.mapConfidenceToLevel(bestResult.entry.confidenceScore);
    
    return {
      id: `kb_${Date.now()}`,
      queryId: query.id,
      content: this.formatKnowledgeResponse(bestResult.entry, query),
      source: ResponseSource.INTERNAL_KB,
      confidence,
      generatedAt: new Date(),
      processingTime: searchResponse.processingTime,
      citations: [
        {
          id: bestResult.entry.id,
          title: bestResult.entry.title,
          source: `Knowledge Base - ${bestResult.entry.author}`,
          relevance: bestResult.relevanceScore,
          type: 'internal'
        }
      ],
      relatedQueries: bestResult.entry.relatedEntries.slice(0, 3),
      cached: false,
      cost: 0 // No cost for internal knowledge
    };
  }

  // Cache operations
  private async searchCache(query: AIQuery): Promise<AIResponse | null> {
    const cacheKey = this.generateCacheKey(query);
    const cachedResponse = await aiEconomicaCacheService.get<AIResponse>(cacheKey, query.type);
    
    if (cachedResponse) {
      // Update cache metadata
      return {
        ...cachedResponse,
        cached: true,
        generatedAt: new Date(), // Update access time
        cost: 0 // No additional cost for cached responses
      };
    }
    
    return null;
  }

  private async cacheResponse(query: AIQuery, response: AIResponse): Promise<void> {
    const cacheKey = this.generateCacheKey(query);
    
    // Don't cache emergency queries or low-confidence responses
    if (query.type === QueryType.EMERGENCY || 
        response.confidence === ConfidenceLevel.VERY_LOW) {
      return;
    }
    
    await aiEconomicaCacheService.set(cacheKey, response, query.type);
  }

  // Premium provider orchestration
  private async queryPremiumProviders(query: AIQuery): Promise<AIResponse | null> {
    try {
      // Select optimal provider
      const provider = await aiEconomicaPremiumAccountManager.selectOptimalProvider(query);
      
      if (!provider) {
        aiEconomicaLogger.warn('No premium providers available', { queryType: query.type });
        return null;
      }

      // Execute query
      const response = await aiEconomicaPremiumAccountManager.executeQuery(provider, query);
      
      // Post-process and validate response
      return this.postProcessPremiumResponse(response, query);
      
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        const aiError = error as AIEconomicaError;
        
        if (aiError.code === 'LIMIT_EXCEEDED' && aiError.retryable) {
          // Try alternative provider
          return await this.tryAlternativeProvider(query, aiError.context?.provider);
        }
      }
      
      aiEconomicaLogger.error('Premium provider query failed', error as Error, { 
        queryId: query.id 
      });
      
      return null;
    }
  }

  private async tryAlternativeProvider(query: AIQuery, excludeProvider?: PremiumProvider): Promise<AIResponse | null> {
    try {
      const accounts = await aiEconomicaPremiumAccountManager.getAccountStats();
      const availableProviders = Array.from(accounts.keys())
        .filter(provider => provider !== excludeProvider && accounts.get(provider)?.isActive);
      
      if (availableProviders.length === 0) {
        return null;
      }
      
      // Select best alternative (simple selection for fallback)
      const alternativeProvider = availableProviders[0];
      
      aiEconomicaLogger.info('Trying alternative provider', { 
        original: excludeProvider, 
        alternative: alternativeProvider 
      });
      
      return await aiEconomicaPremiumAccountManager.executeQuery(alternativeProvider, query);
    } catch (error) {
      aiEconomicaLogger.error('Alternative provider also failed', error as Error);
      return null;
    }
  }

  // Response processing and validation
  private postProcessPremiumResponse(response: AIResponse, query: AIQuery): AIResponse {
    // Validate response quality
    const qualityScore = this.assessResponseQuality(response, query);
    
    if (qualityScore < QUALITY_THRESHOLDS.minimumConfidence) {
      aiEconomicaLogger.warn('Low quality response detected', {
        queryId: query.id,
        provider: response.provider,
        qualityScore
      });
    }

    // Add safety filters for medical content
    if (this.containsMedicalContent(query) && !this.isMedicallySound(response)) {
      response.content = this.addMedicalDisclaimer(response.content);
    }

    return response;
  }

  private assessResponseQuality(response: AIResponse, query: AIQuery): number {
    let score = 70; // Base score
    
    // Check response length
    if (response.content.length > 100) score += 10;
    if (response.content.length > 500) score += 10;
    
    // Check for citations
    if (response.citations && response.citations.length > 0) score += 15;
    
    // Check confidence level
    switch (response.confidence) {
      case ConfidenceLevel.VERY_HIGH: score += 15; break;
      case ConfidenceLevel.HIGH: score += 10; break;
      case ConfidenceLevel.MEDIUM: score += 5; break;
      default: score -= 5; break;
    }
    
    // Query-specific validation
    if (query.type === QueryType.EMERGENCY && response.content.includes('EMERGÊNCIA')) {
      score += 20;
    }
    
    return Math.min(100, Math.max(0, score));
  }

  // Combined response generation (for complex queries)
  private async generateCombinedResponse(query: AIQuery): Promise<CombinedResponse | null> {
    const promises = [
      this.searchKnowledgeBase(query),
      this.queryPremiumProviders(query)
    ];
    
    const results = await Promise.allSettled(promises);
    const responses = results
      .filter((result): result is PromiseFulfilledResult<AIResponse> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
    
    if (responses.length === 0) return null;
    
    const primary = responses[0];
    const secondary = responses[1];
    
    // Combine responses intelligently
    const combined: AIResponse = {
      id: `combined_${Date.now()}`,
      queryId: query.id,
      content: this.combineResponseContent(primary, secondary),
      source: ResponseSource.COMBINED,
      confidence: this.calculateCombinedConfidence(responses),
      generatedAt: new Date(),
      processingTime: Math.max(...responses.map(r => r.processingTime)),
      citations: this.mergeCitations(responses),
      relatedQueries: this.mergeRelatedQueries(responses),
      cached: false,
      cost: responses.reduce((sum, r) => sum + (r.cost || 0), 0)
    };
    
    return {
      primary,
      secondary,
      combined,
      sources: responses.map(r => r.source),
      confidence: this.mapConfidenceFromLevel(combined.confidence)
    };
  }

  // Utility methods
  private generateQueryKey(query: AIQuery): string {
    const content = `${query.query}_${query.type}_${JSON.stringify(query.context || {})}`;
    return btoa(content).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  private generateCacheKey(query: AIQuery): string {
    return `ai_query_${this.generateQueryKey(query)}`;
  }

  private isResponseAcceptable(response: AIResponse): boolean {
    return response.confidence !== ConfidenceLevel.VERY_LOW && 
           response.content.length > 50;
  }

  private createEmptyResponse(query: AIQuery, source: ResponseSource): AIResponse {
    return {
      id: `empty_${Date.now()}`,
      queryId: query.id,
      content: '',
      source,
      confidence: ConfidenceLevel.VERY_LOW,
      generatedAt: new Date(),
      processingTime: 0,
      cached: false,
      cost: 0
    };
  }

  private formatKnowledgeResponse(entry: any, query: AIQuery): string {
    let formatted = entry.content;
    
    // Add context-specific formatting
    if (query.type === QueryType.PROTOCOL) {
      formatted = `## ${entry.title}\n\n${formatted}`;
    }
    
    // Add source attribution
    formatted += `\n\n*Fonte: ${entry.author} - Base de Conhecimento Interna*`;
    
    return formatted;
  }

  private mapConfidenceToLevel(score: number): ConfidenceLevel {
    if (score >= 90) return ConfidenceLevel.VERY_HIGH;
    if (score >= 80) return ConfidenceLevel.HIGH;
    if (score >= 60) return ConfidenceLevel.MEDIUM;
    if (score >= 40) return ConfidenceLevel.LOW;
    return ConfidenceLevel.VERY_LOW;
  }

  private mapConfidenceFromLevel(level: ConfidenceLevel): number {
    switch (level) {
      case ConfidenceLevel.VERY_HIGH: return 95;
      case ConfidenceLevel.HIGH: return 85;
      case ConfidenceLevel.MEDIUM: return 70;
      case ConfidenceLevel.LOW: return 50;
      default: return 30;
    }
  }

  private combineResponseContent(primary: AIResponse, secondary?: AIResponse): string {
    let combined = primary.content;
    
    if (secondary && secondary.content !== primary.content) {
      combined += `\n\n### Informação Complementar:\n${secondary.content}`;
    }
    
    return combined;
  }

  private calculateCombinedConfidence(responses: AIResponse[]): ConfidenceLevel {
    if (responses.length === 0) return ConfidenceLevel.VERY_LOW;
    
    const avgScore = responses.reduce((sum, r) => 
      sum + this.mapConfidenceFromLevel(r.confidence), 0
    ) / responses.length;
    
    return this.mapConfidenceToLevel(avgScore);
  }

  private mergeCitations(responses: AIResponse[]): any[] {
    const allCitations = responses.flatMap(r => r.citations || []);
    // Remove duplicates by title
    const unique = allCitations.filter((citation, index, self) => 
      index === self.findIndex(c => c.title === citation.title)
    );
    return unique.slice(0, 5); // Limit to 5 citations
  }

  private mergeRelatedQueries(responses: AIResponse[]): string[] {
    const allRelated = responses.flatMap(r => r.relatedQueries || []);
    return [...new Set(allRelated)].slice(0, 3); // Limit to 3 unique related queries
  }

  private containsMedicalContent(query: AIQuery): boolean {
    const medicalKeywords = ['dor', 'sintoma', 'diagnóstico', 'tratamento', 'medicamento', 'lesão'];
    return medicalKeywords.some(keyword => 
      query.query.toLowerCase().includes(keyword)
    );
  }

  private isMedicallySound(response: AIResponse): boolean {
    // Simple validation - in real implementation would be more sophisticated
    const unsafeTerms = ['certamente', 'definitivamente', 'garanto', 'cure-se'];
    return !unsafeTerms.some(term => 
      response.content.toLowerCase().includes(term)
    );
  }

  private addMedicalDisclaimer(content: string): string {
    const disclaimer = '\n\n**⚠️ Aviso Médico:** Esta informação é apenas educativa e não substitui a consulta médica profissional. Sempre consulte um profissional de saúde qualificado para diagnóstico e tratamento.';
    return content + disclaimer;
  }

  private generateFallbackResponse(query: AIQuery, error: Error): AIResponse {
    return {
      id: `fallback_${Date.now()}`,
      queryId: query.id,
      content: `Desculpe, não foi possível processar sua consulta no momento. ${
        query.type === QueryType.EMERGENCY 
          ? 'Para emergências médicas, procure atendimento médico imediato.' 
          : 'Tente novamente em alguns minutos ou reformule sua pergunta.'
      }`,
      source: ResponseSource.INTERNAL_KB,
      confidence: ConfidenceLevel.VERY_LOW,
      generatedAt: new Date(),
      processingTime: 0,
      cached: false,
      cost: 0
    };
  }

  // Economics and analytics
  private initializeEconomics(): EconomicMetrics {
    return {
      totalQueries: 0,
      sourceDistribution: {
        [ResponseSource.INTERNAL_KB]: 0,
        [ResponseSource.CACHE]: 0,
        [ResponseSource.PREMIUM_AI]: 0,
        [ResponseSource.COMBINED]: 0
      },
      costSavings: 0,
      avgResponseTime: 0,
      cacheHitRate: 0,
      knowledgeBaseSize: 0,
      period: {
        start: new Date(),
        end: new Date()
      },
      providerUsage: {
        [PremiumProvider.GEMINI_PRO]: { provider: PremiumProvider.GEMINI_PRO, date: new Date(), queries: 0, tokens: 0, cost: 0, avgResponseTime: 0, successRate: 0, errorTypes: {} },
        [PremiumProvider.CHATGPT_PLUS]: { provider: PremiumProvider.CHATGPT_PLUS, date: new Date(), queries: 0, tokens: 0, cost: 0, avgResponseTime: 0, successRate: 0, errorTypes: {} },
        [PremiumProvider.CLAUDE_PRO]: { provider: PremiumProvider.CLAUDE_PRO, date: new Date(), queries: 0, tokens: 0, cost: 0, avgResponseTime: 0, successRate: 0, errorTypes: {} },
        [PremiumProvider.PERPLEXITY_PRO]: { provider: PremiumProvider.PERPLEXITY_PRO, date: new Date(), queries: 0, tokens: 0, cost: 0, avgResponseTime: 0, successRate: 0, errorTypes: {} },
        [PremiumProvider.MARS_AI_PRO]: { provider: PremiumProvider.MARS_AI_PRO, date: new Date(), queries: 0, tokens: 0, cost: 0, avgResponseTime: 0, successRate: 0, errorTypes: {} }
      },
      qualityMetrics: {
        avgConfidence: 0,
        avgUserRating: 0,
        feedbackCount: 0
      }
    };
  }

  private updateEconomics(query: AIQuery, response: AIResponse, processingTime: number): void {
    this.economics.totalQueries++;
    this.economics.sourceDistribution[response.source]++;
    this.economics.avgResponseTime = (this.economics.avgResponseTime * (this.economics.totalQueries - 1) + processingTime) / this.economics.totalQueries;
    
    // Calculate cost savings
    if (response.source === ResponseSource.INTERNAL_KB || response.source === ResponseSource.CACHE) {
      this.economics.costSavings += 0.003; // Assume $0.003 saved per non-premium query
    }
    
    // Update cache hit rate
    const cacheHits = this.economics.sourceDistribution[ResponseSource.CACHE];
    this.economics.cacheHitRate = (cacheHits / this.economics.totalQueries) * 100;
  }

  // Public API
  async getEconomicMetrics(): Promise<EconomicMetrics> {
    return { ...this.economics };
  }

  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    activeQueries: number;
    cacheHealth: any;
    providerHealth: any;
  }> {
    const cacheHealth = await aiEconomicaCacheService.getCacheHealth();
    const providerStats = await aiEconomicaPremiumAccountManager.getAccountStats();
    
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    
    if (this.activeQueries.size > 50) status = 'degraded';
    if (this.activeQueries.size > 100) status = 'critical';
    if (cacheHealth.health === 'poor') status = 'degraded';
    
    return {
      status,
      activeQueries: this.activeQueries.size,
      cacheHealth,
      providerHealth: Array.from(providerStats.entries()).map(([provider, account]) => ({
        provider,
        status: account.healthStatus,
        usagePercent: (account.dailyUsed / account.dailyLimit) * 100
      }))
    };
  }

  // Cleanup
  destroy(): void {
    this.processingQueue.clear();
    this.activeQueries.clear();
  }
}

export const aiEconomicaService = new AIEconomicaService();

// Legacy compatibility
export const aiService = {
  processQuery: (query: AIQuery) => aiEconomicaService.processQuery(query),
  getStats: () => aiEconomicaService.getEconomicMetrics(),
  getLogs: () => aiEconomicaLogger.getLogs({ level: undefined }),
  getSystemHealth: () => aiEconomicaService.getSystemHealth()
};

export default aiEconomicaService;
