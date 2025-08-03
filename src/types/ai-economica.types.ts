// Tipos e interfaces para o Sistema de IA Econômica

export enum PremiumProvider {
  CHATGPT_PLUS = 'chatgpt_plus',
  GEMINI_PRO = 'gemini_pro',
  CLAUDE_PRO = 'claude_pro',
  PERPLEXITY_PRO = 'perplexity_pro',
  MARS_AI_PRO = 'mars_ai_pro'
}

export enum QueryType {
  GENERAL_QUESTION = 'general_question',
  PROTOCOL_SUGGESTION = 'protocol_suggestion',
  DIAGNOSIS_HELP = 'diagnosis_help',
  EXERCISE_RECOMMENDATION = 'exercise_recommendation',
  CASE_ANALYSIS = 'case_analysis',
  RESEARCH_QUERY = 'research_query',
  DOCUMENT_ANALYSIS = 'document_analysis'
}

export enum ResponseSource {
  INTERNAL = 'internal',
  CACHE = 'cache',
  PREMIUM = 'premium'
}

export type ResponseSourceType = 'internal' | 'cache' | 'premium';

export enum UsageStatus {
  AVAILABLE = 'available',
  WARNING = 'warning',
  CRITICAL = 'critical',
  BLOCKED = 'blocked'
}

// Interfaces principais

export interface KnowledgeEntry {
  id: string;
  tenantId: string;
  type: 'protocol' | 'exercise' | 'case' | 'technique' | 'experience';
  title: string;
  content: string;
  summary: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    role: string;
    experience: number;
  };
  confidence: number;
  usageCount: number;
  successRate: number;
  references: string[];
  conditions: string[];
  techniques: string[];
  contraindications: string[];
  createdAt: string;
  updatedAt: string;
  lastUsed: string;
  metadata: {
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    evidenceLevel: 'low' | 'moderate' | 'high';
    specialty: string[];
  };
}

export interface AIQuery {
  id: string;
  text: string;
  type: QueryType;
  context: {
    patientId?: string;
    symptoms?: string[];
    diagnosis?: string;
    previousTreatments?: string[];
    userRole: string;
    specialty?: string;
  };
  priority: 'low' | 'normal' | 'high';
  maxResponseTime: number;
  hash: string;
  createdAt: string;
}

export interface AIResponse {
  id: string;
  queryId: string;
  content: string;
  confidence: number;
  source: ResponseSourceType;
  provider?: PremiumProvider;
  references: Reference[];
  suggestions: string[];
  followUpQuestions: string[];
  tokensUsed?: number;
  responseTime: number;
  createdAt: string;
  metadata: {
    evidenceLevel?: 'low' | 'moderate' | 'high';
    reliability: number;
    relevance: number;
  };
}

export interface Reference {
  id: string;
  title: string;
  url?: string;
  type: 'internal' | 'external' | 'study' | 'guideline';
  confidence: number;
}

export interface SearchParams {
  text: string;
  type?: QueryType;
  symptoms?: string[];
  diagnosis?: string;
  context?: any;
}

export interface KnowledgeResult {
  entry: KnowledgeEntry;
  relevance: number;
  matchedFields: string[];
}

export interface CacheEntry {
  key: string;
  response: AIResponse;
  createdAt: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface ProviderConfig {
  enabled: boolean;
  endpoint: string;
  credentials: {
    apiKey?: string;
    sessionToken?: string;
    refreshToken?: string;
  };
  limits: {
    monthly: number;
    daily: number;
    hourly: number;
  };
  preferences: {
    queryTypes: QueryType[];
    priority: number;
  };
}

export interface UsageTracker {
  provider: PremiumProvider;
  current: {
    monthly: number;
    daily: number;
    hourly: number;
  };
  limits: {
    monthly: number;
    daily: number;
    hourly: number;
  };
  status: UsageStatus;
  percentage: number;
  resetDates: {
    monthly: string;
    daily: string;
    hourly: string;
  };
}

export interface AnalyticsData {
  queries: {
    total: number;
    bySource: Record<ResponseSource, number>;
    byType: Record<QueryType, number>;
    byProvider: Record<PremiumProvider, number>;
  };
  performance: {
    averageResponseTime: number;
    cacheHitRate: number;
    internalSuccessRate: number;
  };
  economy: {
    estimatedSavings: number;
    premiumUsageByProvider: Record<PremiumProvider, number>;
    costAvoidance: number;
  };
  quality: {
    averageConfidence: number;
    userSatisfaction: number;
    feedbacksBySource: Record<ResponseSource, { positive: number; negative: number }>;
  };
}

export interface Alert {
  id: string;
  type: 'usage_warning' | 'usage_critical' | 'performance' | 'quality' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  provider?: PremiumProvider;
  message: string;
  data: any;
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface ErrorContext {
  queryId: string;
  query: AIQuery;
  provider?: PremiumProvider;
  source: ResponseSourceType;
  userAgent: string;
  sessionId: string;
  timestamp: string;
}

export interface AIError {
  type: 'KNOWLEDGE_BASE_UNAVAILABLE' | 'PREMIUM_LIMIT_REACHED' | 'NETWORK_ERROR' | 'INVALID_QUERY' | 'PROVIDER_ERROR';
  message: string;
  provider?: PremiumProvider;
  retryable: boolean;
  context: ErrorContext;
}

// Constantes de configuração

export const CACHE_TTL = {
  PROTOCOL_SUGGESTION: 7 * 24 * 60 * 60 * 1000, // 7 dias
  DIAGNOSIS_HELP: 30 * 24 * 60 * 60 * 1000, // 30 dias
  EXERCISE_RECOMMENDATION: 14 * 24 * 60 * 60 * 1000, // 14 dias
  GENERAL_QUESTION: 24 * 60 * 60 * 1000, // 1 dia
  CASE_ANALYSIS: 7 * 24 * 60 * 60 * 1000, // 7 dias
  RESEARCH_QUERY: 30 * 24 * 60 * 60 * 1000, // 30 dias
  DOCUMENT_ANALYSIS: 14 * 24 * 60 * 60 * 1000 // 14 dias
};

export const PROVIDER_STRATEGY: Record<QueryType, PremiumProvider[]> = {
  [QueryType.GENERAL_QUESTION]: [
    PremiumProvider.CHATGPT_PLUS,
    PremiumProvider.CLAUDE_PRO,
    PremiumProvider.GEMINI_PRO
  ],
  [QueryType.PROTOCOL_SUGGESTION]: [
    PremiumProvider.CLAUDE_PRO,
    PremiumProvider.CHATGPT_PLUS,
    PremiumProvider.GEMINI_PRO
  ],
  [QueryType.DIAGNOSIS_HELP]: [
    PremiumProvider.CLAUDE_PRO,
    PremiumProvider.GEMINI_PRO,
    PremiumProvider.CHATGPT_PLUS
  ],
  [QueryType.EXERCISE_RECOMMENDATION]: [
    PremiumProvider.CHATGPT_PLUS,
    PremiumProvider.CLAUDE_PRO,
    PremiumProvider.GEMINI_PRO
  ],
  [QueryType.CASE_ANALYSIS]: [
    PremiumProvider.CLAUDE_PRO,
    PremiumProvider.CHATGPT_PLUS,
    PremiumProvider.GEMINI_PRO
  ],
  [QueryType.RESEARCH_QUERY]: [
    PremiumProvider.PERPLEXITY_PRO,
    PremiumProvider.CLAUDE_PRO,
    PremiumProvider.GEMINI_PRO
  ],
  [QueryType.DOCUMENT_ANALYSIS]: [
    PremiumProvider.CLAUDE_PRO,
    PremiumProvider.CHATGPT_PLUS,
    PremiumProvider.GEMINI_PRO
  ]
};

export const DEFAULT_LIMITS = {
  [PremiumProvider.CHATGPT_PLUS]: {
    monthly: 2000,
    daily: 100,
    hourly: 10
  },
  [PremiumProvider.GEMINI_PRO]: {
    monthly: 3000,
    daily: 150,
    hourly: 15
  },
  [PremiumProvider.CLAUDE_PRO]: {
    monthly: 2500,
    daily: 125,
    hourly: 12
  },
  [PremiumProvider.PERPLEXITY_PRO]: {
    monthly: 1000,
    daily: 50,
    hourly: 5
  },
  [PremiumProvider.MARS_AI_PRO]: {
    monthly: 1500,
    daily: 75,
    hourly: 8
  }
};