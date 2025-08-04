import { knowledgeBaseService } from './knowledgeBaseService';
import { aiEconomicaCacheService } from './cacheService';
import { premiumAccountManager } from './premiumAccountManager';
import { searchEngine } from './searchEngine';
import { feedbackSystem } from './feedbackSystem';
import { logger } from './logger';

export interface AIQuery {
  text: string;
  type: 'protocol' | 'diagnosis' | 'exercise' | 'general' | 'research' | 'treatment';
  context?: any;
  userId?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface AIResponse {
  text: string;
  source: 'knowledge_base' | 'cache' | 'premium_ai';
  confidence: number;
  references?: string[];
  cost?: number;
  provider?: string;
  responseTime: number;
}

/**
 * Serviço principal de IA Econômica
 * Implementa o fluxo: Base Interna → Cache → Premium AI
 */
export class MainAIEconomicaService {
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      logger.info('Initializing AI Economica Service...');
      
      // Services are auto-initialized via their constructors
      this.initialized = true;
      
      logger.info('AI Economica Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AI Economica Service', error as Error);
      throw error;
    }
  }

  /**
   * Processa query seguindo a estratégia econômica
   */
  async processQuery(query: AIQuery): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Validar query
      if (!query.text || query.text.trim().length === 0) {
        throw new Error('Query text is required');
      }

      logger.info('Processing AI query', { 
        type: query.type, 
        textLength: query.text.length,
        userId: query.userId 
      });

      // 1. Primeiro: Tentar base de conhecimento interna
      const knowledgeResult = await this.searchKnowledgeBase(query);
      if (knowledgeResult) {
        logger.info('Query resolved from knowledge base', { 
          confidence: knowledgeResult.confidence,
          responseTime: Date.now() - startTime 
        });
        return knowledgeResult;
      }

      // 2. Segundo: Verificar cache
      const cacheKey = this.generateCacheKey(query);
      const cachedResult = await aiEconomicaCacheService.get<AIResponse>(cacheKey, query.type as any);
      if (cachedResult) {
        logger.info('Query resolved from cache', { 
          responseTime: Date.now() - startTime 
        });
        return {
          ...cachedResult,
          source: 'cache',
          responseTime: Date.now() - startTime
        };
      }

      // 3. Terceiro: Usar AI Premium
      const premiumResult = await this.queryPremiumAI(query);
      if (premiumResult) {
        // Armazenar no cache para futuras consultas
        await aiEconomicaCacheService.set(cacheKey, premiumResult, query.type as any);
        
        logger.info('Query resolved from premium AI', { 
          provider: premiumResult.provider,
          cost: premiumResult.cost,
          responseTime: Date.now() - startTime 
        });
        return premiumResult;
      }

      // Fallback para resposta genérica
      return this.generateFallbackResponse(query, startTime);

    } catch (error) {
      logger.error('Error processing AI query', error as Error, { query });
      return this.generateErrorResponse(error as Error, startTime);
    }
  }

  /**
   * Busca na base de conhecimento interna
   */
  private async searchKnowledgeBase(query: AIQuery): Promise<AIResponse | null> {
    try {
      const knowledgeEntries = await knowledgeBaseService.searchEntries(query.text);
      
      if (knowledgeEntries.length === 0) {
        return null;
      }

      // Buscar usando o search engine
      const searchResults = await searchEngine.search(
        { 
          text: query.text,
          category: query.type,
          limit: 5
        }, 
        knowledgeEntries
      );

      if (searchResults.length === 0 || searchResults[0].score < 0.7) {
        return null;
      }

      const bestResult = searchResults[0];
      const entry = bestResult.entry;

      return {
        text: this.formatKnowledgeResponse(entry, query),
        source: 'knowledge_base',
        confidence: bestResult.score,
        references: [entry.title],
        responseTime: 0 // Will be set by caller
      };

    } catch (error) {
      logger.warn('Knowledge base search failed', { error, query: query.text });
      return null;
    }
  }

  /**
   * Consulta AI Premium
   */
  private async queryPremiumAI(query: AIQuery): Promise<AIResponse | null> {
    try {
      // Selecionar o melhor provider baseado no tipo de query
      const provider = this.selectBestProvider(query.type);
      const account = await premiumAccountManager.selectBestAccount(provider);
      
      if (!account) {
        logger.warn('No premium accounts available', { queryType: query.type });
        return null;
      }

      // Processar query com o provider selecionado
      const result = await this.callPremiumProvider(account, query);
      
      return {
        ...result,
        source: 'premium_ai',
        provider: account.provider,
        responseTime: 0 // Will be set by caller
      };

    } catch (error) {
      logger.error('Premium AI query failed', error as Error, { query });
      return null;
    }
  }

  /**
   * Seleciona o melhor provider para o tipo de query
   */
  private selectBestProvider(queryType: string): string {
    const providerMapping = {
      'protocol': 'ClaudePro', // Claude é melhor para protocolos detalhados
      'diagnosis': 'GeminiPro', // Gemini é bom para análise médica
      'exercise': 'ChatGPTPlus', // ChatGPT é versátil para exercícios
      'research': 'PerplexityPro', // Perplexity é especializado em pesquisa
      'treatment': 'ClaudePro', // Claude para tratamentos complexos
      'general': 'ChatGPTPlus' // ChatGPT para queries gerais
    };

    return providerMapping[queryType as keyof typeof providerMapping] || 'ChatGPTPlus';
  }

  /**
   * Chama provider premium específico
   */
  private async callPremiumProvider(account: any, query: AIQuery): Promise<Partial<AIResponse>> {
    // Esta é uma implementação simulada
    // Em produção, cada provider teria sua própria implementação
    
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000)); // Simular latência
    
    const responses = [
      `Baseado na consulta sobre "${query.text.substring(0, 50)}...", recomendo o seguinte protocolo de tratamento: 1) Avaliação inicial completa, 2) Definição de objetivos terapêuticos, 3) Implementação de técnicas específicas.`,
      `Para a questão "${query.text.substring(0, 50)}...", sugiro uma abordagem multidisciplinar considerando os aspectos biomecânicos e neurofisiológicos envolvidos.`,
      `Considerando "${query.text.substring(0, 50)}...", é importante avaliar fatores como histórico clínico, limitações funcionais e objetivos do paciente.`
    ];

    return {
      text: responses[Math.floor(Math.random() * responses.length)],
      confidence: 0.8 + Math.random() * 0.2,
      cost: Math.round((Math.random() * 0.05 + 0.01) * 100) / 100 // $0.01-$0.06
    };
  }

  /**
   * Formata resposta da base de conhecimento
   */
  private formatKnowledgeResponse(entry: any, query: AIQuery): string {
    let response = `**${entry.title}**\n\n`;
    
    if (entry.content) {
      response += `${entry.content}\n\n`;
    }
    
    if (entry.techniques && entry.techniques.length > 0) {
      response += `**Técnicas recomendadas:**\n${entry.techniques.map((t: string) => `• ${t}`).join('\n')}\n\n`;
    }
    
    if (entry.precautions && entry.precautions.length > 0) {
      response += `**Precauções:**\n${entry.precautions.map((p: string) => `• ${p}`).join('\n')}\n\n`;
    }
    
    response += `*Fonte: Base de conhecimento interna*`;
    
    return response;
  }

  /**
   * Gera chave de cache para a query
   */
  private generateCacheKey(query: AIQuery): string {
    const normalizedText = query.text.toLowerCase().trim();
    const hash = this.simpleHash(normalizedText);
    return `ai_query_${query.type}_${hash}`;
  }

  /**
   * Hash simples para chave de cache
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Gera resposta de fallback
   */
  private generateFallbackResponse(query: AIQuery, startTime: number): AIResponse {
    return {
      text: 'Desculpe, não foi possível processar sua consulta no momento. Todos os recursos de IA estão temporariamente indisponíveis. Tente novamente em alguns minutos ou consulte a base de conhecimento manual.',
      source: 'knowledge_base',
      confidence: 0.1,
      responseTime: Date.now() - startTime
    };
  }

  /**
   * Gera resposta de erro
   */
  private generateErrorResponse(error: Error, startTime: number): AIResponse {
    return {
      text: 'Ocorreu um erro ao processar sua consulta. Por favor, tente reformular sua pergunta ou entre em contato com o suporte técnico.',
      source: 'knowledge_base',
      confidence: 0.0,
      responseTime: Date.now() - startTime
    };
  }

  /**
   * Registra feedback do usuário
   */
  async submitFeedback(queryId: string, rating: number, comment?: string, userId?: string): Promise<void> {
    try {
      await feedbackSystem.submitFeedback({
        id: `feedback_${Date.now()}`,
        entryId: queryId,
        userId: userId || 'anonymous',
        rating,
        comment,
        timestamp: new Date()
      });
      
      logger.info('Feedback submitted', { queryId, rating, userId });
    } catch (error) {
      logger.error('Failed to submit feedback', error as Error, { queryId, rating });
    }
  }

  /**
   * Obtém estatísticas do sistema
   */
  async getSystemStats(): Promise<{
    cacheStats: any;
    accountStats: any;
    knowledgeBaseStats: any;
  }> {
    try {
      return {
        cacheStats: aiEconomicaCacheService.getStats(),
        accountStats: premiumAccountManager.getUsageStats(),
        knowledgeBaseStats: await knowledgeBaseService.getStats()
      };
    } catch (error) {
      logger.error('Failed to get system stats', error as Error);
      throw error;
    }
  }

  /**
   * Limpa recursos ao destruir
   */
  destroy(): void {
    premiumAccountManager.destroy();
    aiEconomicaCacheService.destroy();
  }
}

// Instância singleton
export const mainAIEconomicaService = new MainAIEconomicaService();