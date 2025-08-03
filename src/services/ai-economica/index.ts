// Sistema de IA Econômica - Exports principais
// Este arquivo centraliza todas as exportações do sistema de IA Econômica

// Serviços principais
export { default as AIService } from './aiService';
export { default as KnowledgeBaseService } from './knowledgeBaseService';
export { default as CacheService } from './cacheService';
export { default as PremiumAccountManager } from './premiumAccountManager';
export { default as AnalyticsService } from './analyticsService';

// Import das classes para uso interno
import AIServiceClass from './aiService';
import KnowledgeBaseServiceClass from './knowledgeBaseService';
import CacheServiceClass from './cacheService';
import PremiumAccountManagerClass from './premiumAccountManager';
import AnalyticsServiceClass from './analyticsService';

// Sistema de logging
export { default as aiLogger, aiLogger as logger, log, LogCategory, LogLevel } from './logger';

// Tipos e interfaces
export * from '../../types/ai-economica.types';

// Configurações
export { default as aiEconomicaConfig } from '../../config/ai-economica.config';

// Instância singleton do sistema principal
import AIService from './aiService';
import AnalyticsService from './analyticsService';

// Instâncias globais (singleton pattern)
let globalAIService: AIServiceClass | null = null;
let globalAnalyticsService: AnalyticsServiceClass | null = null;

export const getAIService = (): AIServiceClass => {
  if (!globalAIService) {
    globalAIService = new AIServiceClass();
  }
  return globalAIService;
};

export const getAnalyticsService = (): AnalyticsServiceClass => {
  if (!globalAnalyticsService) {
    globalAnalyticsService = new AnalyticsServiceClass();
  }
  return globalAnalyticsService;
};

// Função de conveniência para processar consultas
export const processAIQuery = async (
  queryText: string,
  queryType: import('../../types/ai-economica.types').QueryType,
  context: any = {}
) => {
  const aiService = getAIService();
  const analyticsService = getAnalyticsService();
  
  const query: import('../../types/ai-economica.types').AIQuery = {
    id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text: queryText,
    type: queryType,
    context: {
      userRole: context.userRole || 'user',
      ...context
    },
    priority: context.priority || 'normal',
    maxResponseTime: context.maxResponseTime || 30000,
    hash: '',
    createdAt: new Date().toISOString()
  };

  const startTime = Date.now();
  
  try {
    const response = await aiService.processQuery(query);
    const responseTime = Date.now() - startTime;
    
    // Rastrear a consulta para analytics
    analyticsService.trackQuery(query, response, responseTime);
    
    return response;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    analyticsService.trackQueryFailure(query, error as Error, responseTime);
    throw error;
  }
};

// Função de conveniência para adicionar conhecimento
export const addKnowledge = async (knowledgeData: Partial<import('../../types/ai-economica.types').KnowledgeEntry>) => {
  const knowledgeBase = new KnowledgeBaseServiceClass();
  
  return await knowledgeBase.addKnowledge(knowledgeData as any);
};

// Função de conveniência para buscar conhecimento
export const searchKnowledge = async (searchParams: import('../../types/ai-economica.types').SearchParams) => {
  const knowledgeBase = new KnowledgeBaseServiceClass();
  
  return await knowledgeBase.search(searchParams);
};

// Função de conveniência para obter analytics
export const getAnalytics = async () => {
  const analyticsService = getAnalyticsService();
  return analyticsService.getCurrentAnalytics();
};

// Função de conveniência para obter relatório detalhado
export const getDetailedReport = async (period: '24h' | '7d' | '30d' = '30d') => {
  const analyticsService = getAnalyticsService();
  return analyticsService.getDetailedReport(period);
};

// Função de conveniência para limpar cache
export const clearCache = async () => {
  const aiService = getAIService();
  return await aiService.clearCache();
};

// Função para destruir instâncias (cleanup)
export const destroyServices = () => {
  if (globalAIService) {
    globalAIService.destroy();
    globalAIService = null;
  }
  
  if (globalAnalyticsService) {
    globalAnalyticsService.destroy();
    globalAnalyticsService = null;
  }
};

// Hook para React (se necessário)
export const useAIEconomica = () => {
  return {
    processQuery: processAIQuery,
    addKnowledge,
    searchKnowledge,
    getAnalytics,
    getDetailedReport,
    clearCache
  };
};

// Constantes úteis
export const AI_ECONOMICA_VERSION = '1.0.0';
export const AI_ECONOMICA_BUILD_DATE = new Date().toISOString();

// Status do sistema
export const getSystemStatus = async () => {
  try {
    const aiService = getAIService();
    const stats = await aiService.getServiceStats();
    const analytics = await getAnalytics();
    
    return {
      status: 'operational',
      version: AI_ECONOMICA_VERSION,
      buildDate: AI_ECONOMICA_BUILD_DATE,
      uptime: Date.now(), // Simplified
      stats,
      analytics: {
        totalQueries: analytics.queries.total,
        cacheHitRate: analytics.performance.cacheHitRate,
        averageResponseTime: analytics.performance.averageResponseTime,
        estimatedSavings: analytics.economy.estimatedSavings
      }
    };
  } catch (error) {
    return {
      status: 'error',
      version: AI_ECONOMICA_VERSION,
      buildDate: AI_ECONOMICA_BUILD_DATE,
      error: (error as Error).message
    };
  }
};

// Inicialização do sistema
export const initializeAIEconomica = async (config?: Partial<typeof import('../../config/ai-economica.config').AI_ECONOMICA_CONFIG>) => {
  try {
    // Aplicar configurações customizadas se fornecidas
    if (config) {
      const currentConfig = await import('../../config/ai-economica.config');
      Object.assign(currentConfig.AI_ECONOMICA_CONFIG, config);
    }
    
    // Inicializar serviços
    const aiService = getAIService();
    const analyticsService = getAnalyticsService();
    
    // Executar verificações de saúde
    const systemStatus = await getSystemStatus();
    
    console.log('✅ Sistema de IA Econômica inicializado com sucesso');
    console.log('📊 Status:', systemStatus.status);
    console.log('🔄 Versão:', systemStatus.version);
    
    return {
      success: true,
      status: systemStatus,
      services: {
        ai: aiService,
        analytics: analyticsService
      }
    };
    
  } catch (error) {
    console.error('❌ Erro na inicialização do Sistema de IA Econômica:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
};

// Default export
export default {
  // Serviços
  AIService: AIServiceClass,
  KnowledgeBaseService: KnowledgeBaseServiceClass,
  CacheService: CacheServiceClass,
  PremiumAccountManager: PremiumAccountManagerClass,
  AnalyticsService: AnalyticsServiceClass,
  
  // Funções de conveniência
  processAIQuery,
  addKnowledge,
  searchKnowledge,
  getAnalytics,
  getDetailedReport,
  clearCache,
  
  // Utilitários
  getSystemStatus,
  initializeAIEconomica,
  destroyServices,
  
  // Instâncias globais
  getAIService,
  getAnalyticsService,
  
  // Constantes
  AI_ECONOMICA_VERSION,
  AI_ECONOMICA_BUILD_DATE
};