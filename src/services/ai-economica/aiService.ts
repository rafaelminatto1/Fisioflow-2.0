import { 
  AIQuery, 
  AIResponse, 
  QueryType, 
  ResponseSource, 
  PremiumProvider, 
  KnowledgeResult,
  SearchParams,
  Reference
} from '../../types/ai-economica.types';
import aiEconomicaConfig from '../../config/ai-economica.config';
import aiLogger, { LogCategory } from './logger';
import KnowledgeBaseService from './knowledgeBaseService';
import CacheService from './cacheService';
import PremiumAccountManager from './premiumAccountManager';

export class AIService {
  private knowledgeBase: KnowledgeBaseService;
  private cacheService: CacheService;
  private premiumManager: PremiumAccountManager;
  private requestCounter = 0;

  constructor() {
    this.knowledgeBase = new KnowledgeBaseService();
    this.cacheService = new CacheService();
    this.premiumManager = new PremiumAccountManager();

    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      aiLogger.info(LogCategory.SYSTEM, 'Inicializando AI Service Econômico');
      
      // Verificar configuração
      const errors = this.validateConfiguration();
      if (errors.length > 0) {
        aiLogger.error(LogCategory.SYSTEM, 'Erros de configuração encontrados', undefined, { errors });
        throw new Error(`Configuração inválida: ${errors.join(', ')}`);
      }

      // Teste rápido dos componentes
      await this.runHealthChecks();
      
      aiLogger.info(LogCategory.SYSTEM, 'AI Service Econômico inicializado com sucesso');
    } catch (error) {
      aiLogger.critical(LogCategory.SYSTEM, 'Falha na inicialização do AI Service', error as Error);
      throw error;
    }
  }

  async processQuery(query: AIQuery): Promise<AIResponse> {
    const startTime = Date.now();
    this.requestCounter++;
    
    aiLogger.info(LogCategory.QUERY, `Processando query ${query.id}`, {
      queryId: query.id,
      type: query.type,
      priority: query.priority
    }, { queryId: query.id });

    try {
      // Validar query
      this.validateQuery(query);

      // Gerar hash para cache se não existir
      if (!query.hash) {
        query.hash = this.cacheService.generateCacheKey(query.text, query.context);
      }

      // 1. Buscar na base de conhecimento interna
      const internalResult = await this.searchInternal(query);
      if (internalResult && internalResult.confidence >= aiEconomicaConfig.knowledgeBase.minConfidenceThreshold) {
        const responseTime = Date.now() - startTime;
        aiLogger.logQuery(query.id, query.type, ResponseSource.INTERNAL, responseTime, true);
        return internalResult;
      }

      // 2. Verificar cache
      const cachedResult = await this.searchCache(query);
      if (cachedResult) {
        const responseTime = Date.now() - startTime;
        aiLogger.logQuery(query.id, query.type, ResponseSource.CACHE, responseTime, true);
        return cachedResult;
      }

      // 3. Usar conta premium
      const premiumResult = await this.queryPremium(query);
      if (premiumResult) {
        // Cachear resultado para consultas futuras
        await this.cacheService.set(query.hash, premiumResult);
        
        const responseTime = Date.now() - startTime;
        aiLogger.logQuery(query.id, query.type, ResponseSource.PREMIUM, responseTime, true);
        return premiumResult;
      }

      // 4. Fallback - resposta padrão
      const fallbackResult = this.getDefaultResponse(query);
      const responseTime = Date.now() - startTime;
      aiLogger.logQuery(query.id, query.type, ResponseSource.INTERNAL, responseTime, false);
      
      return fallbackResult;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      aiLogger.error(LogCategory.QUERY, `Erro ao processar query ${query.id}`, error as Error, {
        queryId: query.id,
        responseTime
      }, { queryId: query.id });

      return this.getErrorResponse(query, error as Error);
    }
  }

  private async searchInternal(query: AIQuery): Promise<AIResponse | null> {
    try {
      if (!aiEconomicaConfig.knowledgeBase.enabled) {
        return null;
      }

      aiLogger.debug(LogCategory.KNOWLEDGE_BASE, `Buscando na base interna para query ${query.id}`);

      const searchParams: SearchParams = {
        text: query.text,
        type: query.type,
        symptoms: query.context.symptoms,
        diagnosis: query.context.diagnosis,
        context: query.context
      };

      const results = await this.knowledgeBase.search(searchParams);
      
      if (results.length === 0) {
        aiLogger.debug(LogCategory.KNOWLEDGE_BASE, `Nenhum resultado interno para query ${query.id}`);
        return null;
      }

      // Combinar resultados e calcular confiança
      const combinedResult = this.combineInternalResults(results, query);
      
      aiLogger.debug(LogCategory.KNOWLEDGE_BASE, `Base interna retornou ${results.length} resultados com confiança ${combinedResult.confidence}`, {
        queryId: query.id,
        resultsCount: results.length,
        confidence: combinedResult.confidence
      });

      return combinedResult;

    } catch (error) {
      aiLogger.error(LogCategory.KNOWLEDGE_BASE, 'Erro na busca interna', error as Error, { queryId: query.id });
      return null;
    }
  }

  private async searchCache(query: AIQuery): Promise<AIResponse | null> {
    try {
      if (!aiEconomicaConfig.cache.enabled) {
        return null;
      }

      aiLogger.debug(LogCategory.CACHE, `Verificando cache para query ${query.id}`);

      const cachedResponse = await this.cacheService.get(query.hash);
      
      if (cachedResponse) {
        // Atualizar metadados para indicar origem do cache
        cachedResponse.source = ResponseSource.CACHE;
        cachedResponse.queryId = query.id;
        
        aiLogger.debug(LogCategory.CACHE, `Cache hit para query ${query.id}`, {
          queryId: query.id,
          cacheKey: query.hash
        });

        return cachedResponse;
      }

      aiLogger.debug(LogCategory.CACHE, `Cache miss para query ${query.id}`);
      return null;

    } catch (error) {
      aiLogger.error(LogCategory.CACHE, 'Erro ao buscar no cache', error as Error, { 
        queryId: query.id,
        cacheKey: query.hash 
      });
      return null;
    }
  }

  private async queryPremium(query: AIQuery): Promise<AIResponse | null> {
    try {
      // Selecionar melhor provedor baseado no tipo de consulta
      const provider = await this.premiumManager.selectBestProvider(query.type);
      
      if (!provider) {
        aiLogger.warn(LogCategory.PROVIDER, `Nenhum provedor premium disponível para query ${query.id}`);
        return null;
      }

      aiLogger.debug(LogCategory.PROVIDER, `Usando provedor ${provider} para query ${query.id}`, {
        queryId: query.id,
        provider,
        queryType: query.type
      });

      // Anonimizar dados se necessário antes de enviar para provedor externo
      const anonymizedQuery = this.anonymizeQuery(query);

      // Fazer consulta ao provedor
      const response = await this.premiumManager.query(provider, anonymizedQuery);
      
      // Restaurar ID original da query
      response.queryId = query.id;
      
      // Adicionar referências da base interna se relevantes
      await this.enrichWithInternalReferences(response, query);

      aiLogger.debug(LogCategory.PROVIDER, `Provedor ${provider} retornou resposta para query ${query.id}`, {
        queryId: query.id,
        provider,
        confidence: response.confidence,
        tokensUsed: response.tokensUsed
      });

      return response;

    } catch (error) {
      aiLogger.error(LogCategory.PROVIDER, 'Erro ao consultar provedor premium', error as Error, { 
        queryId: query.id 
      });
      return null;
    }
  }

  private combineInternalResults(results: KnowledgeResult[], query: AIQuery): AIResponse {
    // Ordenar por relevância e confiança
    const sortedResults = results.sort((a, b) => {
      const scoreA = a.relevance * a.entry.confidence;
      const scoreB = b.relevance * b.entry.confidence;
      return scoreB - scoreA;
    });

    // Combinar conteúdo dos melhores resultados
    const topResults = sortedResults.slice(0, 3);
    const combinedContent = this.buildCombinedResponse(topResults, query);
    
    // Calcular confiança combinada
    const avgConfidence = topResults.reduce((sum, result) => 
      sum + result.entry.confidence, 0) / topResults.length;
    
    const avgRelevance = topResults.reduce((sum, result) => 
      sum + result.relevance, 0) / topResults.length;
    
    const combinedConfidence = (avgConfidence + avgRelevance) / 2;

    // Gerar referências
    const references: Reference[] = topResults.map(result => ({
      id: result.entry.id,
      title: result.entry.title,
      type: 'internal',
      confidence: result.entry.confidence
    }));

    // Gerar sugestões baseadas nos resultados
    const suggestions = this.generateSuggestions(topResults, query);

    return {
      id: this.generateResponseId(),
      queryId: query.id,
      content: combinedContent,
      confidence: combinedConfidence,
      source: ResponseSource.INTERNAL,
      references,
      suggestions,
      followUpQuestions: this.generateFollowUpQuestions(topResults, query),
      responseTime: 0, // Será preenchido pelo caller
      createdAt: new Date().toISOString(),
      metadata: {
        evidenceLevel: this.determineEvidenceLevel(topResults),
        reliability: avgConfidence,
        relevance: avgRelevance
      }
    };
  }

  private buildCombinedResponse(results: KnowledgeResult[], query: AIQuery): string {
    if (results.length === 0) {
      return 'Não foram encontradas informações relevantes na base de conhecimento interna.';
    }

    if (results.length === 1) {
      return this.formatSingleResult(results[0], query);
    }

    // Múltiplos resultados - combinar de forma inteligente
    const sections: string[] = [];
    
    sections.push(`Baseado na análise de ${results.length} casos similares em nossa base de conhecimento:`);
    sections.push('');

    results.forEach((result, index) => {
      const relevanceText = result.relevance > 0.8 ? 'Altamente relevante' : 
                           result.relevance > 0.6 ? 'Relevante' : 'Parcialmente relevante';
      
      sections.push(`**${index + 1}. ${result.entry.title}** (${relevanceText})`);
      
      // Resumir conteúdo se muito longo
      const content = result.entry.summary || result.entry.content;
      const truncatedContent = content.length > 200 ? 
        content.substring(0, 200) + '...' : content;
      
      sections.push(truncatedContent);
      sections.push('');
    });

    // Adicionar síntese final
    sections.push('**Síntese:**');
    sections.push(this.generateSynthesis(results, query));

    return sections.join('\n');
  }

  private formatSingleResult(result: KnowledgeResult, query: AIQuery): string {
    const entry = result.entry;
    const sections: string[] = [];
    
    sections.push(`**${entry.title}**`);
    sections.push('');
    sections.push(entry.content);
    
    if (entry.techniques.length > 0) {
      sections.push('');
      sections.push('**Técnicas aplicáveis:**');
      sections.push(entry.techniques.join(', '));
    }
    
    if (entry.contraindications.length > 0) {
      sections.push('');
      sections.push('**Contraindicações:**');
      sections.push(entry.contraindications.join(', '));
    }
    
    if (entry.references.length > 0) {
      sections.push('');
      sections.push('**Referências:**');
      entry.references.forEach(ref => sections.push(`- ${ref}`));
    }

    return sections.join('\n');
  }

  private generateSynthesis(results: KnowledgeResult[], query: AIQuery): string {
    // Análise simples para gerar síntese
    const techniques = new Set<string>();
    const conditions = new Set<string>();
    
    results.forEach(result => {
      result.entry.techniques.forEach(tech => techniques.add(tech));
      result.entry.conditions.forEach(cond => conditions.add(cond));
    });

    const sections: string[] = [];
    
    if (techniques.size > 0) {
      sections.push(`As técnicas mais recomendadas incluem: ${Array.from(techniques).slice(0, 3).join(', ')}.`);
    }
    
    if (conditions.size > 0) {
      sections.push(`Estas abordagens são especialmente eficazes para: ${Array.from(conditions).slice(0, 2).join(', ')}.`);
    }
    
    const avgSuccess = results.reduce((sum, r) => sum + r.entry.successRate, 0) / results.length;
    if (avgSuccess > 0.7) {
      sections.push(`Os casos analisados mostram uma taxa de sucesso média de ${Math.round(avgSuccess * 100)}%.`);
    }

    return sections.join(' ');
  }

  private generateSuggestions(results: KnowledgeResult[], query: AIQuery): string[] {
    const suggestions: string[] = [];
    
    // Sugestões baseadas nas técnicas mais comuns
    const techniques = new Map<string, number>();
    results.forEach(result => {
      result.entry.techniques.forEach(tech => {
        techniques.set(tech, (techniques.get(tech) || 0) + 1);
      });
    });

    const topTechniques = Array.from(techniques.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tech]) => tech);

    topTechniques.forEach(tech => {
      suggestions.push(`Considere aplicar ${tech}`);
    });

    // Sugestões baseadas no tipo de consulta
    switch (query.type) {
      case QueryType.EXERCISE_RECOMMENDATION:
        suggestions.push('Revisar contraindicações antes da prescrição');
        suggestions.push('Monitorar progressão com métricas objetivas');
        break;
      case QueryType.DIAGNOSIS_HELP:
        suggestions.push('Correlacionar com exames complementares');
        suggestions.push('Considerar diagnóstico diferencial');
        break;
      case QueryType.PROTOCOL_SUGGESTION:
        suggestions.push('Adaptar protocolo conforme resposta do paciente');
        suggestions.push('Documentar evolução no prontuário');
        break;
    }

    return suggestions.slice(0, 5); // Limitar a 5 sugestões
  }

  private generateFollowUpQuestions(results: KnowledgeResult[], query: AIQuery): string[] {
    const questions: string[] = [];
    
    // Perguntas baseadas no contexto
    if (query.context.symptoms?.length) {
      questions.push('Há outros sintomas associados?');
      questions.push('Qual a intensidade dos sintomas (0-10)?');
    }

    if (query.context.diagnosis) {
      questions.push('Há comorbidades relevantes?');
      questions.push('Qual o tempo de evolução do quadro?');
    }

    // Perguntas específicas por tipo
    switch (query.type) {
      case QueryType.EXERCISE_RECOMMENDATION:
        questions.push('Qual o nível de atividade física atual do paciente?');
        questions.push('Há limitações específicas a considerar?');
        break;
      case QueryType.PROTOCOL_SUGGESTION:
        questions.push('Quais tratamentos já foram tentados?');
        questions.push('Qual a frequência ideal de sessões?');
        break;
    }

    return questions.slice(0, 3); // Limitar a 3 perguntas
  }

  private determineEvidenceLevel(results: KnowledgeResult[]): 'low' | 'moderate' | 'high' {
    if (results.length === 0) return 'low';
    
    const avgConfidence = results.reduce((sum, r) => sum + r.entry.confidence, 0) / results.length;
    const hasReferences = results.some(r => r.entry.references.length > 0);
    const avgUsage = results.reduce((sum, r) => sum + r.entry.usageCount, 0) / results.length;

    if (avgConfidence > 0.8 && hasReferences && avgUsage > 10) return 'high';
    if (avgConfidence > 0.6 && (hasReferences || avgUsage > 5)) return 'moderate';
    return 'low';
  }

  private anonymizeQuery(query: AIQuery): AIQuery {
    if (!aiEconomicaConfig.security.anonymization.enabled) {
      return query;
    }

    const anonymized = { ...query };
    
    // Remover informações pessoais identificáveis
    if (anonymized.context.patientId) {
      anonymized.context.patientId = this.hashPersonalData(anonymized.context.patientId);
    }

    // Anonimizar texto se contém informações pessoais
    anonymized.text = this.anonymizeText(anonymized.text);

    return anonymized;
  }

  private anonymizeText(text: string): string {
    if (!aiEconomicaConfig.security.anonymization.enabled) {
      return text;
    }

    // Remover padrões de informações pessoais
    let anonymized = text;
    
    // Remover CPFs (formato XXX.XXX.XXX-XX)
    anonymized = anonymized.replace(/\d{3}\.\d{3}\.\d{3}-\d{2}/g, '[CPF_REMOVIDO]');
    
    // Remover telefones
    anonymized = anonymized.replace(/\(\d{2}\)\s?\d{4,5}-?\d{4}/g, '[TELEFONE_REMOVIDO]');
    
    // Remover emails
    anonymized = anonymized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REMOVIDO]');
    
    // Remover nomes próprios comuns (heurística simples)
    const commonNames = ['João', 'Maria', 'José', 'Ana', 'Carlos', 'Paulo', 'Pedro', 'Francisco'];
    commonNames.forEach(name => {
      const regex = new RegExp(`\\b${name}\\b`, 'gi');
      anonymized = anonymized.replace(regex, '[NOME_REMOVIDO]');
    });

    return anonymized;
  }

  private hashPersonalData(data: string): string {
    // Hash simples para dados pessoais
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `hash_${Math.abs(hash).toString(36)}`;
  }

  private async enrichWithInternalReferences(response: AIResponse, originalQuery: AIQuery): Promise<void> {
    try {
      // Buscar referências internas relevantes para enriquecer resposta premium
      const searchParams: SearchParams = {
        text: response.content.substring(0, 200), // Primeiros 200 chars da resposta
        type: originalQuery.type
      };

      const internalResults = await this.knowledgeBase.search(searchParams);
      
      if (internalResults.length > 0) {
        const internalRefs: Reference[] = internalResults
          .slice(0, 3)
          .map(result => ({
            id: result.entry.id,
            title: result.entry.title,
            type: 'internal',
            confidence: result.entry.confidence
          }));

        response.references = [...response.references, ...internalRefs];
      }
    } catch (error) {
      aiLogger.warn(LogCategory.SYSTEM, 'Erro ao enriquecer com referências internas', { error: error });
    }
  }

  private getDefaultResponse(query: AIQuery): AIResponse {
    let content = '';
    
    switch (query.type) {
      case QueryType.EXERCISE_RECOMMENDATION:
        content = 'Recomendo uma avaliação presencial detalhada para prescrição segura de exercícios. Considere exercícios de baixo impacto inicialmente.';
        break;
      case QueryType.DIAGNOSIS_HELP:
        content = 'Para um diagnóstico preciso, é essencial realizar uma avaliação clínica completa. Considere buscar consensos científicos atuais.';
        break;
      case QueryType.PROTOCOL_SUGGESTION:
        content = 'Sugiro seguir protocolos estabelecidos na literatura científica, adaptando conforme as características individuais do paciente.';
        break;
      default:
        content = 'Não foi possível fornecer uma resposta específica no momento. Recomendo consultar literatura científica atualizada ou buscar segunda opinião profissional.';
    }

    return {
      id: this.generateResponseId(),
      queryId: query.id,
      content,
      confidence: 0.3,
      source: ResponseSource.INTERNAL,
      references: [],
      suggestions: ['Consultar literatura científica', 'Buscar segunda opinião'],
      followUpQuestions: ['Há informações adicionais disponíveis?'],
      responseTime: 0,
      createdAt: new Date().toISOString(),
      metadata: {
        evidenceLevel: 'low',
        reliability: 0.3,
        relevance: 0.5
      }
    };
  }

  private getErrorResponse(query: AIQuery, error: Error): AIResponse {
    return {
      id: this.generateResponseId(),
      queryId: query.id,
      content: 'Ocorreu um erro interno ao processar sua consulta. Por favor, tente novamente ou reformule sua pergunta.',
      confidence: 0.1,
      source: ResponseSource.INTERNAL,
      references: [],
      suggestions: ['Reformular a pergunta', 'Verificar conexão', 'Tentar novamente'],
      followUpQuestions: [],
      responseTime: 0,
      createdAt: new Date().toISOString(),
      metadata: {
        evidenceLevel: 'low',
        reliability: 0.1,
        relevance: 0.1
      }
    };
  }

  private validateQuery(query: AIQuery): void {
    if (!query.id) throw new Error('Query deve ter um ID');
    if (!query.text || query.text.trim().length === 0) throw new Error('Query deve ter texto');
    if (!query.type) throw new Error('Query deve ter um tipo');
    if (!query.context) throw new Error('Query deve ter contexto');
    if (!query.context.userRole) throw new Error('Query deve especificar o role do usuário');
  }

  private validateConfiguration(): string[] {
    const errors: string[] = [];
    
    if (!aiEconomicaConfig.system.enabled) {
      errors.push('Sistema AI Econômica está desabilitado');
    }

    const enabledProviders = Object.values(aiEconomicaConfig.providers)
      .filter(p => p.enabled).length;
    
    if (enabledProviders === 0 && !aiEconomicaConfig.knowledgeBase.enabled) {
      errors.push('Nenhum provedor premium habilitado e base de conhecimento desabilitada');
    }

    return errors;
  }

  private async runHealthChecks(): Promise<void> {
    const checks = [];
    
    // Verificar base de conhecimento
    if (aiEconomicaConfig.knowledgeBase.enabled) {
      checks.push(this.knowledgeBase.getStatistics());
    }
    
    // Verificar cache
    if (aiEconomicaConfig.cache.enabled) {
      checks.push(this.cacheService.getStats());
    }
    
    // Verificar provedores premium
    const providerStats = this.premiumManager.getProviderStats();
    const availableProviders = Object.values(providerStats)
      .filter(stat => stat.enabled).length;
    
    if (availableProviders === 0) {
      aiLogger.warn(LogCategory.SYSTEM, 'Nenhum provedor premium habilitado');
    }

    await Promise.all(checks);
  }

  private generateResponseId(): string {
    return `ai_response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Métodos públicos para administração

  async getServiceStats(): Promise<{
    requests: { total: number; successful: number; failed: number };
    sources: { internal: number; cache: number; premium: number };
    performance: { avgResponseTime: number; cacheHitRate: number };
    providers: Record<string, any>;
  }> {
    const cacheStats = await this.cacheService.getStats();
    const providerStats = this.premiumManager.getProviderStats();
    
    return {
      requests: {
        total: this.requestCounter,
        successful: 0, // Seria rastreado pelo analytics
        failed: 0
      },
      sources: {
        internal: 0, // Seria rastreado pelo analytics
        cache: 0,
        premium: 0
      },
      performance: {
        avgResponseTime: 0, // Seria calculado pelo analytics
        cacheHitRate: cacheStats.hitRate || 0
      },
      providers: providerStats
    };
  }

  async testAllProviders(): Promise<Record<PremiumProvider, boolean>> {
    const results = {} as Record<PremiumProvider, boolean>;
    
    for (const provider of Object.values(PremiumProvider)) {
      try {
        results[provider] = await this.premiumManager.testProvider(provider);
      } catch (error) {
        results[provider] = false;
      }
    }
    
    return results;
  }

  async clearCache(): Promise<void> {
    await this.cacheService.clear();
    aiLogger.info(LogCategory.CACHE, 'Cache limpo por solicitação administrativa');
  }

  destroy(): void {
    this.cacheService.destroy();
    aiLogger.info(LogCategory.SYSTEM, 'AI Service destruído');
  }
}

export default AIService;