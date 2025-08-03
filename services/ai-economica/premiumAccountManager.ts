// services/ai-economica/premiumAccountManager.ts
import { GoogleGenAI } from "@google/genai";
import { AIQuery, AIResponse, PremiumProvider, QueryType, ResponseSource, ProviderConfig, UsageStatus } from './types/ai-economica.types';
import { logger } from './logger';
import { settingsService } from './settingsService';

// Mocked Usage Tracker as per implementation plan
class UsageTracker {
    async getCurrentUsage(provider: PremiumProvider): Promise<UsageStatus> {
        // Always available in this mock
        return { status: 'available', percentage: Math.random() * 0.5 };
    }
    async recordUsage(provider: PremiumProvider, tokensUsed: number): Promise<void> {
        logger.info(`Usage recorded for ${provider}: ${tokensUsed} tokens.`);
    }
}

const usageTracker = new UsageTracker();

// From design doc
const PROVIDER_STRATEGY: Partial<Record<QueryType, PremiumProvider[]>> = {
  [QueryType.RESEARCH_QUERY]: [PremiumProvider.PERPLEXITY_PRO, PremiumProvider.GEMINI_PRO],
  [QueryType.CASE_ANALYSIS]: [PremiumProvider.MARS_AI_PRO, PremiumProvider.CLAUDE_PRO, PremiumProvider.GEMINI_PRO],
  [QueryType.DOCUMENT_ANALYSIS]: [PremiumProvider.CLAUDE_PRO, PremiumProvider.GEMINI_PRO],
  [QueryType.GENERAL_QUESTION]: [PremiumProvider.GEMINI_PRO, PremiumProvider.CHATGPT_PLUS],
};

class PremiumAccountManager {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      console.warn("VITE_GEMINI_API_KEY is not properly configured. Gemini functionality will be limited.");
      // Create a mock GoogleGenAI instance for development
      this.ai = null as any;
    } else {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  async selectBestProvider(queryType: QueryType): Promise<PremiumProvider | null> {
    const availableProviders = await this.getAvailableProviders();
    const settings = settingsService.getSettings();
    const defaultProvider = settings.defaultProvider;
    const preferredProviders = PROVIDER_STRATEGY[queryType] || [];
    
    for (const provider of preferredProviders) {
      if (availableProviders.includes(provider)) {
        return provider;
      }
    }
    
    if (availableProviders.includes(defaultProvider)) {
        return defaultProvider;
    }

    return availableProviders[0] || null;
  }

  async getAvailableProviders(): Promise<PremiumProvider[]> {
    const available: PremiumProvider[] = [];
    const providerConfigs = settingsService.getMergedProviderConfigs();

    for (const providerKey in providerConfigs) {
      const config = providerConfigs[providerKey];
      if (!config.enabled || !config.hasCredentialsConfigured) continue;

      const provider = providerKey as PremiumProvider;
      const usage = await usageTracker.getCurrentUsage(provider);
      if (usage.status === 'available' || usage.status === 'warning') {
        available.push(provider);
      }
    }
    return available;
  }

  async query(provider: PremiumProvider, query: AIQuery): Promise<AIResponse> {
    const startTime = Date.now();
    let response: AIResponse;

    try {
        switch (provider) {
        case PremiumProvider.GEMINI_PRO:
            response = await this.queryGemini(query);
            break;
        // Mocked responses for other providers
        case PremiumProvider.CHATGPT_PLUS:
        case PremiumProvider.CLAUDE_PRO:
        case PremiumProvider.PERPLEXITY_PRO:
        case PremiumProvider.MARS_AI_PRO:
        default:
            response = {
                id: `resp_${Date.now()}`,
                queryId: query.id,
                content: `Resposta simulada do ${provider} para a pergunta: "${query.text}".`,
                confidence: 0.8,
                source: ResponseSource.PREMIUM,
                provider: provider,
                references: [],
                suggestions: [],
                followUpQuestions: [],
                tokensUsed: 100,
                responseTime: 500,
                createdAt: new Date().toISOString(),
                metadata: { reliability: 0.8, relevance: 0.8 }
            };
        }
        
        await this.trackUsage(provider, response.tokensUsed || 0);
        response.responseTime = Date.now() - startTime;
        return response;

    } catch (error) {
      logger.error(`Error querying ${provider}:`, error);
      throw error;
    }
  }

  private async queryGemini(query: AIQuery): Promise<AIResponse> {
    // If no API key is configured, return a mock response
    if (!this.ai) {
      return {
        id: `resp_${Date.now()}`,
        queryId: query.id,
        content: `Resposta simulada do Gemini para desenvolvimento: "${query.text}". Configure VITE_GEMINI_API_KEY para usar a API real.`,
        confidence: 0.85,
        source: ResponseSource.PREMIUM,
        provider: PremiumProvider.GEMINI_PRO,
        references: [],
        suggestions: ["Configure a API key do Gemini", "Verifique o arquivo .env.local"],
        followUpQuestions: ["Como configurar a API key?", "Onde encontrar a chave do Gemini?"],
        tokensUsed: 50,
        responseTime: 0,
        createdAt: new Date().toISOString(),
        metadata: { reliability: 0.5, relevance: 0.8 }
      };
    }

    const result = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: query.text,
    });
    
    const tokensUsed = (query.text.length + result.text.length) / 4;
    
    return {
        id: `resp_${Date.now()}`,
        queryId: query.id,
        content: result.text,
        confidence: 0.85,
        source: ResponseSource.PREMIUM,
        provider: PremiumProvider.GEMINI_PRO,
        references: [],
        suggestions: ["Sugestão 1 vinda do Gemini.", "Sugestão 2 vinda do Gemini."],
        followUpQuestions: ["Qual o próximo passo?", "Tem mais detalhes?"],
        tokensUsed: Math.round(tokensUsed),
        responseTime: 0, // will be set in the caller
        createdAt: new Date().toISOString(),
        metadata: { reliability: 0.9, relevance: 0.9 }
    };
  }
  
  async trackUsage(provider: PremiumProvider, tokensUsed: number): Promise<void> {
    await usageTracker.recordUsage(provider, tokensUsed);
  }
}

// Lazy instantiation to avoid errors at module load time
let _premiumAccountManager: PremiumAccountManager | null = null;

export const premiumAccountManager = {
  get instance(): PremiumAccountManager {
    if (!_premiumAccountManager) {
      _premiumAccountManager = new PremiumAccountManager();
    }
    return _premiumAccountManager;
  },
  
  // Proxy methods for backward compatibility
  async selectBestProvider(queryType: QueryType): Promise<PremiumProvider | null> {
    return this.instance.selectBestProvider(queryType);
  },
  
  async getAvailableProviders(): Promise<PremiumProvider[]> {
    return this.instance.getAvailableProviders();
  },
  
  async query(provider: PremiumProvider, query: AIQuery): Promise<AIResponse> {
    return this.instance.query(provider, query);
  },
  
  async trackUsage(provider: PremiumProvider, tokensUsed: number): Promise<void> {
    return this.instance.trackUsage(provider, tokensUsed);
  }
};