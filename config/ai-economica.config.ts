import { 
  AIEconomicaConfig, 
  PremiumProvider, 
  QueryType,
  CacheStrategy,
  DEFAULT_CACHE_CONFIG,
  DEFAULT_PROVIDER_ROTATION
} from '../types/ai-economica.types';

/**
 * Central configuration for AI Economica System
 * This file contains all configurable parameters for the economic AI system
 */
export const AI_ECONOMICA_CONFIG: AIEconomicaConfig = {
  // Cache Configuration
  cache: {
    ...DEFAULT_CACHE_CONFIG,
    // Custom overrides for production
    strategy: CacheStrategy.AGGRESSIVE, // Maximize cache usage for economy
    maxSize: 250, // 250MB for larger installations
    compressionEnabled: true,
    prefetchEnabled: true,
    cleanupInterval: 30 * 60 * 1000, // 30 minutes cleanup
  },

  // Premium Provider Configuration
  providers: {
    [PremiumProvider.GEMINI_PRO]: {
      name: 'Google Gemini Pro',
      isActive: true,
      dailyLimit: 1000,
      monthlyLimit: 25000,
      priority: 9, // Highest priority - best value
      costPerQuery: 0.002, // $0.002 per query estimate
      timeoutMs: 30000,
      rateLimitPerMinute: 60,
      maxRetries: 3,
      features: ['multimodal', 'large_context', 'reasoning'],
      restrictions: ['no_personal_data']
    },
    [PremiumProvider.CHATGPT_PLUS]: {
      name: 'ChatGPT Plus',
      isActive: true,
      dailyLimit: 800,
      monthlyLimit: 20000,
      priority: 8,
      costPerQuery: 0.003,
      timeoutMs: 45000,
      rateLimitPerMinute: 40,
      maxRetries: 2,
      features: ['conversation', 'code_analysis', 'creative'],
      restrictions: ['rate_limited', 'session_based']
    },
    [PremiumProvider.CLAUDE_PRO]: {
      name: 'Claude Pro',
      isActive: true,
      dailyLimit: 600,
      monthlyLimit: 15000,
      priority: 7,
      costPerQuery: 0.004,
      timeoutMs: 35000,
      rateLimitPerMinute: 30,
      maxRetries: 3,
      features: ['reasoning', 'analysis', 'safety'],
      restrictions: ['content_filtering']
    },
    [PremiumProvider.PERPLEXITY_PRO]: {
      name: 'Perplexity Pro',
      isActive: true,
      dailyLimit: 500,
      monthlyLimit: 12000,
      priority: 6,
      costPerQuery: 0.005,
      timeoutMs: 40000,
      rateLimitPerMinute: 25,
      maxRetries: 2,
      features: ['research', 'citations', 'real_time'],
      restrictions: ['research_focused']
    },
    [PremiumProvider.MARS_AI_PRO]: {
      name: 'Mars AI Pro',
      isActive: false, // Disabled by default until configured
      dailyLimit: 300,
      monthlyLimit: 8000,
      priority: 5,
      costPerQuery: 0.006,
      timeoutMs: 50000,
      rateLimitPerMinute: 20,
      maxRetries: 2,
      features: ['specialized', 'domain_specific'],
      restrictions: ['limited_availability']
    }
  },

  // Provider Rotation Configuration
  rotation: {
    ...DEFAULT_PROVIDER_ROTATION,
    strategy: 'cost_optimized', // Prioritize cost savings
    healthCheckInterval: 3 * 60 * 1000, // 3 minutes for production
    failoverThreshold: 0.85, // Higher threshold for production
    cooldownPeriod: 10 * 60 * 1000 // 10 minutes cooldown
  },

  // Knowledge Base Configuration
  knowledge: {
    autoIndexing: true,
    confidenceThreshold: 70, // Minimum 70% confidence for auto-approval
    maxSearchResults: 10,
    fuzzySearchEnabled: true,
    autoTagging: true,
    requireValidation: false // Enable for stricter quality control
  },

  // Security Configuration
  security: {
    dataAnonymization: true, // Always anonymize data sent to external APIs
    encryptCache: true, // Encrypt sensitive cached data
    auditLogging: true, // Log all operations for compliance
    maxLogRetention: 90 * 24 * 60 * 60 * 1000 // 90 days
  },

  // Performance Configuration
  performance: {
    maxConcurrentQueries: 10, // Limit concurrent external API calls
    timeoutMs: 60000, // Global timeout
    retryAttempts: 3,
    prefetchCommonQueries: true
  },

  // Economics Configuration
  economics: {
    trackCosts: true,
    monthlyBudget: 100, // $100 per month budget
    costAlerts: true,
    optimizeForCost: true // Prioritize cost over speed when possible
  }
};

/**
 * Environment-specific configurations
 */
export const ENV_CONFIGS = {
  development: {
    ...AI_ECONOMICA_CONFIG,
    cache: {
      ...AI_ECONOMICA_CONFIG.cache,
      maxSize: 50, // Smaller cache for development
      cleanupInterval: 10 * 60 * 1000 // More frequent cleanup
    },
    performance: {
      ...AI_ECONOMICA_CONFIG.performance,
      maxConcurrentQueries: 3 // Lower concurrency in development
    },
    economics: {
      ...AI_ECONOMICA_CONFIG.economics,
      monthlyBudget: 20 // Lower budget for development
    }
  },
  
  production: {
    ...AI_ECONOMICA_CONFIG,
    security: {
      ...AI_ECONOMICA_CONFIG.security,
      encryptCache: true,
      auditLogging: true
    },
    performance: {
      ...AI_ECONOMICA_CONFIG.performance,
      maxConcurrentQueries: 15, // Higher concurrency in production
      prefetchCommonQueries: true
    }
  },

  testing: {
    ...AI_ECONOMICA_CONFIG,
    providers: {
      // Disable all external providers in testing
      ...Object.fromEntries(
        Object.entries(AI_ECONOMICA_CONFIG.providers).map(([key, config]) => [
          key, 
          { ...config, isActive: false }
        ])
      )
    },
    cache: {
      ...AI_ECONOMICA_CONFIG.cache,
      maxSize: 10, // Very small cache for testing
      defaultTTL: 60 * 1000 // 1 minute TTL for testing
    }
  }
};

/**
 * Query type specific configurations
 */
export const QUERY_TYPE_CONFIGS = {
  [QueryType.EMERGENCY]: {
    cacheEnabled: false, // Never cache emergency queries
    preferredProviders: [PremiumProvider.GEMINI_PRO, PremiumProvider.CHATGPT_PLUS],
    maxResponseTime: 10000, // 10 seconds max
    retryAttempts: 1, // No retries for emergency
    bypassKnowledgeBase: false // Still check knowledge base first
  },

  [QueryType.PROTOCOL]: {
    cacheEnabled: true,
    cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
    preferredProviders: [PremiumProvider.CLAUDE_PRO, PremiumProvider.GEMINI_PRO],
    maxResponseTime: 30000,
    retryAttempts: 3,
    bypassKnowledgeBase: false
  },

  [QueryType.DIAGNOSIS]: {
    cacheEnabled: true,
    cacheTTL: 30 * 24 * 60 * 60 * 1000, // 30 days
    preferredProviders: [PremiumProvider.GEMINI_PRO, PremiumProvider.CLAUDE_PRO],
    maxResponseTime: 45000,
    retryAttempts: 2,
    bypassKnowledgeBase: false
  },

  [QueryType.EXERCISE]: {
    cacheEnabled: true,
    cacheTTL: 14 * 24 * 60 * 60 * 1000, // 14 days
    preferredProviders: [PremiumProvider.CHATGPT_PLUS, PremiumProvider.GEMINI_PRO],
    maxResponseTime: 25000,
    retryAttempts: 2,
    bypassKnowledgeBase: false
  },

  [QueryType.RESEARCH]: {
    cacheEnabled: true,
    cacheTTL: 60 * 60 * 1000, // 1 hour (research changes frequently)
    preferredProviders: [PremiumProvider.PERPLEXITY_PRO, PremiumProvider.GEMINI_PRO],
    maxResponseTime: 60000,
    retryAttempts: 3,
    bypassKnowledgeBase: false
  },

  [QueryType.GENERAL]: {
    cacheEnabled: true,
    cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    preferredProviders: [PremiumProvider.GEMINI_PRO, PremiumProvider.CHATGPT_PLUS],
    maxResponseTime: 20000,
    retryAttempts: 2,
    bypassKnowledgeBase: false
  }
};

/**
 * Cost optimization rules
 */
export const COST_OPTIMIZATION_RULES = {
  // Use knowledge base aggressively
  knowledgeBaseFirst: true,
  
  // Cache preferences
  aggressiveCaching: true,
  prefetchCommonQueries: true,
  
  // Provider selection rules
  providerSelection: {
    preferCheaper: true,
    maxCostPerQuery: 0.01, // $0.01 max per query
    degradeGracefully: true, // Use cheaper providers when approaching limits
    
    // Cost thresholds for provider switching
    costThresholds: {
      daily: 5.00, // $5 daily limit
      weekly: 25.00, // $25 weekly limit  
      monthly: 100.00 // $100 monthly limit
    }
  },
  
  // Batching and optimization
  batchQueries: true,
  optimizePrompts: true,
  compressResponses: true,
  
  // Fallback strategies
  fallbacks: {
    useKnowledgeBaseOnly: true, // Fall back to KB only when limits hit
    degradedMode: true, // Simplified responses when necessary
    queueNonUrgent: true // Queue non-urgent queries for off-peak times
  }
};

/**
 * Quality thresholds and requirements
 */
export const QUALITY_THRESHOLDS = {
  minimumConfidence: 60, // 60% minimum confidence for responses
  knowledgeBaseConfidence: 70, // 70% for internal knowledge
  externalAPIConfidence: 80, // 80% for external API responses
  
  // Response quality metrics
  minimumCitations: 1, // At least 1 citation for research queries
  maxResponseLength: 5000, // Max 5000 characters
  
  // Validation rules
  requireEvidenceBased: true, // Require evidence for medical advice
  filterUnsafeContent: true, // Filter potentially harmful content
  validateMedicalAccuracy: true // Validate medical information
};

/**
 * Get configuration for current environment
 */
export function getConfig(): AIEconomicaConfig {
  const env = process.env.NODE_ENV || 'development';
  return ENV_CONFIGS[env as keyof typeof ENV_CONFIGS] || ENV_CONFIGS.development;
}

/**
 * Get configuration for specific query type
 */
export function getQueryTypeConfig(type: QueryType) {
  return QUERY_TYPE_CONFIGS[type];
}

/**
 * Validate configuration
 */
export function validateConfig(config: AIEconomicaConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate cache configuration
  if (config.cache.maxSize <= 0) {
    errors.push('Cache max size must be greater than 0');
  }
  
  if (config.cache.defaultTTL <= 0) {
    errors.push('Cache default TTL must be greater than 0');
  }
  
  // Validate provider configuration
  const activeProviders = Object.values(config.providers).filter(p => p.isActive);
  if (activeProviders.length === 0) {
    errors.push('At least one provider must be active');
  }
  
  // Validate economic settings
  if (config.economics.monthlyBudget <= 0) {
    errors.push('Monthly budget must be greater than 0');
  }
  
  // Validate performance settings
  if (config.performance.maxConcurrentQueries <= 0) {
    errors.push('Max concurrent queries must be greater than 0');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export default getConfig();