// === Base Types for AI Economica System ===

export enum PremiumProvider {
  CHATGPT_PLUS = 'ChatGPT Plus',
  GEMINI_PRO = 'Gemini Pro', 
  CLAUDE_PRO = 'Claude Pro',
  PERPLEXITY_PRO = 'Perplexity Pro',
  MARS_AI_PRO = 'Mars AI Pro'
}

export enum QueryType {
  PROTOCOL = 'protocol',
  DIAGNOSIS = 'diagnosis', 
  EXERCISE = 'exercise',
  GENERAL = 'general',
  RESEARCH = 'research',
  EMERGENCY = 'emergency'
}

export enum ResponseSource {
  INTERNAL_KB = 'internal_knowledge_base',
  CACHE = 'cache',
  PREMIUM_AI = 'premium_ai',
  COMBINED = 'combined'
}

export enum ConfidenceLevel {
  VERY_LOW = 'very_low',
  LOW = 'low', 
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

export enum CacheStrategy {
  AGGRESSIVE = 'aggressive',
  MODERATE = 'moderate',
  CONSERVATIVE = 'conservative',
  CUSTOM = 'custom'
}

// === Core Interfaces ===

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  type: QueryType;
  tags: string[];
  author: string;
  createdAt: Date;
  updatedAt: Date;
  confidenceScore: number; // 0-100
  sources: string[];
  validatedBy?: string;
  usageCount: number;
  avgRating: number;
  relatedEntries: string[];
  isPublic: boolean;
  specialty: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  evidence: 'high' | 'moderate' | 'low' | 'expert_opinion';
  lastReviewed?: Date;
  metadata?: Record<string, any>;
}

export interface AIQuery {
  id: string;
  query: string;
  type: QueryType;
  context?: Record<string, any>;
  patientId?: string;
  userId: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  createdAt: Date;
  language: string;
  expectedResponseTime?: number;
  metadata?: Record<string, any>;
}

export interface AIResponse {
  id: string;
  queryId: string;
  content: string;
  source: ResponseSource;
  provider?: PremiumProvider;
  confidence: ConfidenceLevel;
  generatedAt: Date;
  processingTime: number;
  tokens?: number;
  cost?: number;
  citations?: Citation[];
  relatedQueries?: string[];
  feedback?: ResponseFeedback;
  cached: boolean;
  cacheExpiry?: Date;
}

export interface Citation {
  id: string;
  title: string;
  source: string;
  url?: string;
  relevance: number; // 0-100
  type: 'internal' | 'scientific' | 'guideline' | 'expert';
}

export interface ResponseFeedback {
  helpful: boolean;
  accuracy: number; // 1-5
  completeness: number; // 1-5
  relevance: number; // 1-5
  comments?: string;
  userId: string;
  submittedAt: Date;
}

// === Cache System ===

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  ttl: number; // in milliseconds
  expiresAt: Date;
  size: number; // in bytes
  type: QueryType;
  tags: string[];
  compressed: boolean;
}

export interface CacheConfig {
  strategy: CacheStrategy;
  maxSize: number; // in MB
  defaultTTL: number; // in milliseconds
  compressionEnabled: boolean;
  typeTTLOverrides: Record<QueryType, number>;
  maxEntries: number;
  cleanupInterval: number;
  prefetchEnabled: boolean;
}

export interface CacheStats {
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  totalSize: number;
  entryCount: number;
  oldestEntry: Date;
  newestEntry: Date;
  averageSize: number;
  compressionRatio: number;
  typeDistribution: Record<QueryType, number>;
}

// === Premium Account Management ===

export interface PremiumAccount {
  id: string;
  provider: PremiumProvider;
  name: string;
  credentials: Record<string, string>;
  isActive: boolean;
  dailyLimit: number;
  monthlyLimit: number;
  dailyUsed: number;
  monthlyUsed: number;
  resetTime: Date;
  lastUsed: Date;
  successRate: number;
  avgResponseTime: number;
  priority: number; // 1-10, higher = preferred
  retryAttempts: number;
  maxRetries: number;
  timeoutMs: number;
  rateLimitPerMinute: number;
  costPerQuery: number;
  features: string[];
  restrictions: string[];
  healthStatus: 'healthy' | 'degraded' | 'unavailable';
  lastHealthCheck: Date;
}

export interface UsageMetrics {
  provider: PremiumProvider;
  date: Date;
  queries: number;
  tokens: number;
  cost: number;
  avgResponseTime: number;
  successRate: number;
  errorTypes: Record<string, number>;
}

export interface ProviderRotationConfig {
  enabled: boolean;
  strategy: 'round_robin' | 'least_used' | 'best_performance' | 'cost_optimized';
  fallbackOrder: PremiumProvider[];
  healthCheckInterval: number;
  failoverThreshold: number;
  cooldownPeriod: number;
}

// === Configuration ===

export interface AIEconomicaConfig {
  cache: CacheConfig;
  providers: Record<PremiumProvider, Partial<PremiumAccount>>;
  rotation: ProviderRotationConfig;
  knowledge: {
    autoIndexing: boolean;
    confidenceThreshold: number;
    maxSearchResults: number;
    fuzzySearchEnabled: boolean;
    autoTagging: boolean;
    requireValidation: boolean;
  };
  security: {
    dataAnonymization: boolean;
    encryptCache: boolean;
    auditLogging: boolean;
    maxLogRetention: number;
  };
  performance: {
    maxConcurrentQueries: number;
    timeoutMs: number;
    retryAttempts: number;
    prefetchCommonQueries: boolean;
  };
  economics: {
    trackCosts: boolean;
    monthlyBudget: number;
    costAlerts: boolean;
    optimizeForCost: boolean;
  };
}

// === Analytics and Monitoring ===

export interface EconomicMetrics {
  totalQueries: number;
  sourceDistribution: Record<ResponseSource, number>;
  costSavings: number;
  avgResponseTime: number;
  cacheHitRate: number;
  knowledgeBaseSize: number;
  period: {
    start: Date;
    end: Date;
  };
  providerUsage: Record<PremiumProvider, UsageMetrics>;
  qualityMetrics: {
    avgConfidence: number;
    avgUserRating: number;
    feedbackCount: number;
  };
}

export interface Alert {
  id: string;
  type: 'limit_approaching' | 'limit_exceeded' | 'quality_degraded' | 'provider_down' | 'cache_full';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  details: Record<string, any>;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  components: {
    knowledgeBase: 'healthy' | 'degraded' | 'unavailable';
    cache: 'healthy' | 'degraded' | 'unavailable';
    providers: Record<PremiumProvider, 'healthy' | 'degraded' | 'unavailable'>;
  };
  lastCheck: Date;
  uptime: number;
  avgResponseTime: number;
  errorRate: number;
}

// === Search and Retrieval ===

export interface SearchQuery {
  text: string;
  type?: QueryType;
  filters?: {
    tags?: string[];
    specialty?: string;
    minConfidence?: number;
    evidenceLevel?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
    author?: string;
  };
  sorting?: {
    field: 'relevance' | 'confidence' | 'date' | 'usage';
    order: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface SearchResult {
  entry: KnowledgeEntry;
  relevanceScore: number;
  highlights: string[];
  matchedTags: string[];
  reasoning: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: SearchQuery;
  processingTime: number;
  suggestions?: string[];
  filters?: {
    tags: Array<{ value: string; count: number }>;
    specialties: Array<{ value: string; count: number }>;
    evidenceLevels: Array<{ value: string; count: number }>;
  };
}

// === Quality and Validation ===

export interface QualityAssessment {
  accuracy: number; // 0-100
  completeness: number; // 0-100
  relevance: number; // 0-100
  clarity: number; // 0-100
  evidenceBased: boolean;
  citations: number;
  overallScore: number; // 0-100
  assessedBy: string;
  assessedAt: Date;
  comments?: string;
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  type: 'content' | 'format' | 'safety' | 'compliance';
  severity: 'warning' | 'error' | 'critical';
  active: boolean;
  validator: (content: string, metadata?: any) => Promise<ValidationResult>;
}

export interface ValidationResult {
  passed: boolean;
  score: number; // 0-100
  issues: Array<{
    type: string;
    severity: 'warning' | 'error' | 'critical';
    message: string;
    suggestion?: string;
  }>;
  suggestions: string[];
}

// === Admin and Management ===

export interface AdminAction {
  id: string;
  type: 'config_change' | 'cache_clear' | 'provider_toggle' | 'knowledge_approve' | 'user_action';
  description: string;
  performedBy: string;
  performedAt: Date;
  parameters: Record<string, any>;
  result: 'success' | 'failure' | 'partial';
  errorMessage?: string;
  affectedResources: string[];
}

export interface BackupInfo {
  id: string;
  type: 'knowledge_base' | 'cache' | 'configuration' | 'full';
  createdAt: Date;
  size: number;
  compressed: boolean;
  checksum: string;
  location: string;
  retentionDate: Date;
  metadata: Record<string, any>;
}

// === Integration Types ===

export interface ExternalAPI {
  provider: PremiumProvider;
  endpoint: string;
  authentication: {
    type: 'apikey' | 'oauth' | 'session' | 'custom';
    credentials: Record<string, string>;
  };
  rateLimit: {
    requests: number;
    period: number; // in milliseconds
    concurrent: number;
  };
  timeout: number;
  retries: number;
  healthCheck: {
    endpoint: string;
    interval: number;
    timeout: number;
  };
}

export interface WebhookEvent {
  id: string;
  type: 'query_completed' | 'cache_cleared' | 'provider_failed' | 'limit_reached';
  data: Record<string, any>;
  timestamp: Date;
  processed: boolean;
  retries: number;
  nextRetry?: Date;
}

// === Error Handling ===

export interface AIEconomicaError extends Error {
  code: string;
  category: 'cache' | 'provider' | 'knowledge' | 'validation' | 'config' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: Record<string, any>;
  retryable: boolean;
  retryAfter?: number;
  suggestions: string[];
}

// === Type Guards and Utilities ===

export function isKnowledgeEntry(obj: any): obj is KnowledgeEntry {
  return obj && typeof obj.id === 'string' && typeof obj.content === 'string';
}

export function isPremiumProvider(value: string): value is PremiumProvider {
  return Object.values(PremiumProvider).includes(value as PremiumProvider);
}

export function isQueryType(value: string): value is QueryType {
  return Object.values(QueryType).includes(value as QueryType);
}

export function isResponseSource(value: string): value is ResponseSource {
  return Object.values(ResponseSource).includes(value as ResponseSource);
}

// === Default Configurations ===

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  strategy: CacheStrategy.MODERATE,
  maxSize: 100, // 100MB
  defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
  compressionEnabled: true,
  typeTTLOverrides: {
    [QueryType.PROTOCOL]: 7 * 24 * 60 * 60 * 1000, // 7 days
    [QueryType.DIAGNOSIS]: 30 * 24 * 60 * 60 * 1000, // 30 days
    [QueryType.EXERCISE]: 14 * 24 * 60 * 60 * 1000, // 14 days
    [QueryType.GENERAL]: 24 * 60 * 60 * 1000, // 1 day
    [QueryType.RESEARCH]: 60 * 60 * 1000, // 1 hour
    [QueryType.EMERGENCY]: 0 // No cache for emergency queries
  },
  maxEntries: 10000,
  cleanupInterval: 60 * 60 * 1000, // 1 hour
  prefetchEnabled: true
};

export const DEFAULT_PROVIDER_ROTATION: ProviderRotationConfig = {
  enabled: true,
  strategy: 'best_performance',
  fallbackOrder: [
    PremiumProvider.GEMINI_PRO,
    PremiumProvider.CHATGPT_PLUS,
    PremiumProvider.CLAUDE_PRO,
    PremiumProvider.PERPLEXITY_PRO,
    PremiumProvider.MARS_AI_PRO
  ],
  healthCheckInterval: 5 * 60 * 1000, // 5 minutes
  failoverThreshold: 0.8, // 80% success rate minimum
  cooldownPeriod: 15 * 60 * 1000 // 15 minutes
};