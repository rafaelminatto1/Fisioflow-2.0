import { 
  PremiumProvider, 
  QueryType, 
  ProviderConfig, 
  DEFAULT_LIMITS,
  CACHE_TTL,
  PROVIDER_STRATEGY 
} from '../types/ai-economica.types';

// Configuração central do sistema de IA Econômica
export const AI_ECONOMICA_CONFIG = {
  // Configurações gerais
  system: {
    enabled: true,
    fallbackToBasic: true,
    maxConcurrentQueries: 10,
    defaultTimeout: 30000, // 30 segundos
    retryAttempts: 3,
    retryDelay: 1000 // 1 segundo
  },

  // Configurações da base de conhecimento
  knowledgeBase: {
    enabled: true,
    minConfidenceThreshold: 0.7,
    maxResults: 10,
    indexingEnabled: true,
    autoSummary: true,
    fuzzySearch: true,
    fuzzyThreshold: 0.8
  },

  // Configurações de cache
  cache: {
    enabled: true,
    maxSize: 100 * 1024 * 1024, // 100MB
    maxEntries: 10000,
    defaultTTL: CACHE_TTL.GENERAL_QUESTION,
    cleanupInterval: 60 * 60 * 1000, // 1 hora
    enableIndexedDB: true,
    enableLocalStorage: true,
    localStorageMaxSize: 5 * 1024 * 1024 // 5MB
  },

  // Configurações dos provedores premium
  providers: {
    [PremiumProvider.CHATGPT_PLUS]: {
      enabled: true,
      endpoint: 'https://chat.openai.com/backend-api/conversation',
      credentials: {
        apiKey: '',
        sessionToken: '',
        refreshToken: ''
      },
      limits: DEFAULT_LIMITS[PremiumProvider.CHATGPT_PLUS],
      preferences: {
        queryTypes: [
          QueryType.GENERAL_QUESTION,
          QueryType.EXERCISE_RECOMMENDATION,
          QueryType.CASE_ANALYSIS
        ],
        priority: 1
      }
    } as ProviderConfig,

    [PremiumProvider.GEMINI_PRO]: {
      enabled: true,
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      credentials: {
        apiKey: '',
        sessionToken: '',
        refreshToken: ''
      },
      limits: DEFAULT_LIMITS[PremiumProvider.GEMINI_PRO],
      preferences: {
        queryTypes: [
          QueryType.DIAGNOSIS_HELP,
          QueryType.RESEARCH_QUERY,
          QueryType.DOCUMENT_ANALYSIS
        ],
        priority: 2
      }
    } as ProviderConfig,

    [PremiumProvider.CLAUDE_PRO]: {
      enabled: true,
      endpoint: 'https://claude.ai/api/conversation',
      credentials: {
        apiKey: '',
        sessionToken: '',
        refreshToken: ''
      },
      limits: DEFAULT_LIMITS[PremiumProvider.CLAUDE_PRO],
      preferences: {
        queryTypes: [
          QueryType.PROTOCOL_SUGGESTION,
          QueryType.CASE_ANALYSIS,
          QueryType.DIAGNOSIS_HELP
        ],
        priority: 1
      }
    } as ProviderConfig,

    [PremiumProvider.PERPLEXITY_PRO]: {
      enabled: true,
      endpoint: 'https://www.perplexity.ai/api/conversation',
      credentials: {
        apiKey: '',
        sessionToken: '',
        refreshToken: ''
      },
      limits: DEFAULT_LIMITS[PremiumProvider.PERPLEXITY_PRO],
      preferences: {
        queryTypes: [QueryType.RESEARCH_QUERY],
        priority: 1
      }
    } as ProviderConfig,

    [PremiumProvider.MARS_AI_PRO]: {
      enabled: false, // Desabilitado por padrão até configuração
      endpoint: 'https://mars.ai/api/chat',
      credentials: {
        apiKey: '',
        sessionToken: '',
        refreshToken: ''
      },
      limits: DEFAULT_LIMITS[PremiumProvider.MARS_AI_PRO],
      preferences: {
        queryTypes: [QueryType.GENERAL_QUESTION],
        priority: 3
      }
    } as ProviderConfig
  },

  // Configurações de analytics
  analytics: {
    enabled: true,
    trackQueries: true,
    trackPerformance: true,
    trackEconomy: true,
    trackQuality: true,
    retentionDays: 90,
    aggregationIntervals: {
      realTime: 5 * 60 * 1000, // 5 minutos
      hourly: 60 * 60 * 1000, // 1 hora
      daily: 24 * 60 * 60 * 1000, // 1 dia
      monthly: 30 * 24 * 60 * 60 * 1000 // 30 dias
    }
  },

  // Configurações de alertas
  alerts: {
    enabled: true,
    thresholds: {
      usageWarning: 0.8, // 80%
      usageCritical: 0.95, // 95%
      performanceWarning: 5000, // 5 segundos
      performanceCritical: 10000, // 10 segundos
      qualityWarning: 0.6, // 60% confiança
      qualityCritical: 0.4 // 40% confiança
    },
    channels: {
      email: true,
      dashboard: true,
      console: true
    },
    rateLimiting: {
      maxAlertsPerHour: 10,
      cooldownPeriod: 300000 // 5 minutos
    }
  },

  // Configurações de segurança
  security: {
    encryption: {
      enabled: true,
      algorithm: 'AES-256-GCM',
      keyRotationDays: 90
    },
    anonymization: {
      enabled: true,
      preserveContext: true,
      hashPersonalData: true
    },
    audit: {
      enabled: true,
      logLevel: 'info',
      includeQueries: false, // Por privacidade
      includeResponses: false,
      retentionDays: 365
    }
  },

  // Configurações de desenvolvimento
  development: {
    mockProviders: false,
    enableDebugLogs: process.env.NODE_ENV === 'development',
    bypassCache: false,
    forceProvider: null as PremiumProvider | null,
    simulateNetworkDelay: 0
  }
};

// Estratégia de priorização atualizada com configurações
export const ENHANCED_PROVIDER_STRATEGY = {
  ...PROVIDER_STRATEGY,
  
  // Adicionar lógica de fallback dinâmica
  getFallbackChain: (queryType: QueryType): PremiumProvider[] => {
    const primary = PROVIDER_STRATEGY[queryType] || [];
    const allProviders = Object.values(PremiumProvider);
    const fallbacks = allProviders.filter(p => !primary.includes(p));
    return [...primary, ...fallbacks];
  },

  // Configuração de balanceamento de carga
  loadBalancing: {
    enabled: true,
    algorithm: 'round_robin', // 'round_robin', 'least_used', 'weighted'
    weights: {
      [PremiumProvider.CHATGPT_PLUS]: 3,
      [PremiumProvider.CLAUDE_PRO]: 3,
      [PremiumProvider.GEMINI_PRO]: 2,
      [PremiumProvider.PERPLEXITY_PRO]: 1,
      [PremiumProvider.MARS_AI_PRO]: 1
    }
  }
};

// Configurações específicas por ambiente
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const envConfigs = {
    development: {
      system: {
        ...AI_ECONOMICA_CONFIG.system,
        retryAttempts: 1
      },
      development: {
        ...AI_ECONOMICA_CONFIG.development,
        enableDebugLogs: true,
        mockProviders: true
      }
    },
    
    production: {
      system: {
        ...AI_ECONOMICA_CONFIG.system,
        retryAttempts: 3
      },
      development: {
        ...AI_ECONOMICA_CONFIG.development,
        enableDebugLogs: false,
        mockProviders: false
      }
    },
    
    testing: {
      system: {
        ...AI_ECONOMICA_CONFIG.system,
        retryAttempts: 1
      },
      development: {
        ...AI_ECONOMICA_CONFIG.development,
        enableDebugLogs: true,
        mockProviders: true,
        bypassCache: true
      }
    }
  };

  return {
    ...AI_ECONOMICA_CONFIG,
    ...envConfigs[env as keyof typeof envConfigs]
  };
};

// Validação de configuração
export const validateConfig = (config: typeof AI_ECONOMICA_CONFIG): string[] => {
  const errors: string[] = [];

  // Validar provedores habilitados
  const enabledProviders = Object.entries(config.providers)
    .filter(([_, provider]) => provider.enabled)
    .map(([key, _]) => key);

  if (enabledProviders.length === 0) {
    errors.push('Pelo menos um provedor premium deve estar habilitado');
  }

  // Validar limites
  for (const [providerKey, provider] of Object.entries(config.providers)) {
    if (provider.enabled) {
      if (!provider.limits.monthly || provider.limits.monthly <= 0) {
        errors.push(`Limite mensal inválido para ${providerKey}`);
      }
      if (!provider.limits.daily || provider.limits.daily <= 0) {
        errors.push(`Limite diário inválido para ${providerKey}`);
      }
    }
  }

  // Validar configurações de cache
  if (config.cache.enabled) {
    if (config.cache.maxSize <= 0) {
      errors.push('Tamanho máximo do cache deve ser maior que zero');
    }
    if (config.cache.maxEntries <= 0) {
      errors.push('Número máximo de entradas do cache deve ser maior que zero');
    }
  }

  return errors;
};

export default getEnvironmentConfig();