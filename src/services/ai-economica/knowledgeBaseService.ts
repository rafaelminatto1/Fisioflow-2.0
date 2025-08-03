import { 
  KnowledgeEntry, 
  SearchParams, 
  KnowledgeResult, 
  QueryType 
} from '../../types/ai-economica.types';
import aiEconomicaConfig from '../../config/ai-economica.config';
import aiLogger, { LogCategory } from './logger';

interface SearchEngine {
  index(entry: KnowledgeEntry): Promise<void>;
  search(params: SearchParams): Promise<KnowledgeResult[]>;
  updateIndex(entry: KnowledgeEntry): Promise<void>;
  removeFromIndex(entryId: string): Promise<void>;
  searchByText(text: string): Promise<KnowledgeResult[]>;
  searchBySymptoms(symptoms: string[]): Promise<KnowledgeResult[]>;
  searchByDiagnosis(diagnosis: string): Promise<KnowledgeResult[]>;
  searchByTechniques(techniques: string[]): Promise<KnowledgeResult[]>;
}

interface ContentManager {
  save(entry: KnowledgeEntry): Promise<void>;
  findById(id: string): Promise<KnowledgeEntry | null>;
  update(entry: KnowledgeEntry): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(filters?: Partial<KnowledgeEntry>): Promise<KnowledgeEntry[]>;
  findByTenant(tenantId: string): Promise<KnowledgeEntry[]>;
}

class SimpleSearchEngine implements SearchEngine {
  private indexedEntries: Map<string, KnowledgeEntry> = new Map();
  private textIndex: Map<string, Set<string>> = new Map(); // palavra -> entryIds
  private symptomIndex: Map<string, Set<string>> = new Map();
  private diagnosisIndex: Map<string, Set<string>> = new Map();
  private techniqueIndex: Map<string, Set<string>> = new Map();

  async index(entry: KnowledgeEntry): Promise<void> {
    try {
      this.indexedEntries.set(entry.id, entry);
      
      // Indexar texto
      const words = this.extractWords(entry.title + ' ' + entry.content + ' ' + entry.summary);
      words.forEach(word => {
        if (!this.textIndex.has(word)) {
          this.textIndex.set(word, new Set());
        }
        this.textIndex.get(word)!.add(entry.id);
      });

      // Indexar condições (sintomas/diagnósticos)
      entry.conditions.forEach(condition => {
        const normalizedCondition = this.normalizeText(condition);
        if (!this.diagnosisIndex.has(normalizedCondition)) {
          this.diagnosisIndex.set(normalizedCondition, new Set());
        }
        this.diagnosisIndex.get(normalizedCondition)!.add(entry.id);
      });

      // Indexar técnicas
      entry.techniques.forEach(technique => {
        const normalizedTechnique = this.normalizeText(technique);
        if (!this.techniqueIndex.has(normalizedTechnique)) {
          this.techniqueIndex.set(normalizedTechnique, new Set());
        }
        this.techniqueIndex.get(normalizedTechnique)!.add(entry.id);
      });

      // Indexar tags como sintomas potenciais
      entry.tags.forEach(tag => {
        const normalizedTag = this.normalizeText(tag);
        if (!this.symptomIndex.has(normalizedTag)) {
          this.symptomIndex.set(normalizedTag, new Set());
        }
        this.symptomIndex.get(normalizedTag)!.add(entry.id);
      });

      aiLogger.logKnowledgeBaseOperation('add', entry.id, true);
    } catch (error) {
      aiLogger.error(LogCategory.KNOWLEDGE_BASE, 'Erro ao indexar entrada', error as Error, { entryId: entry.id });
      throw error;
    }
  }

  async search(params: SearchParams): Promise<KnowledgeResult[]> {
    const results = new Map<string, KnowledgeResult>();

    try {
      // Busca por texto
      if (params.text) {
        const textResults = await this.searchByText(params.text);
        textResults.forEach(result => {
          const existing = results.get(result.entry.id);
          if (existing) {
            existing.relevance = Math.max(existing.relevance, result.relevance);
            existing.matchedFields = [...new Set([...existing.matchedFields, ...result.matchedFields])];
          } else {
            results.set(result.entry.id, result);
          }
        });
      }

      // Busca por sintomas
      if (params.symptoms?.length) {
        const symptomResults = await this.searchBySymptoms(params.symptoms);
        symptomResults.forEach(result => {
          const existing = results.get(result.entry.id);
          if (existing) {
            existing.relevance += result.relevance * 0.8; // Peso menor para sintomas
            existing.matchedFields = [...new Set([...existing.matchedFields, ...result.matchedFields])];
          } else {
            result.relevance *= 0.8;
            results.set(result.entry.id, result);
          }
        });
      }

      // Busca por diagnóstico
      if (params.diagnosis) {
        const diagnosisResults = await this.searchByDiagnosis(params.diagnosis);
        diagnosisResults.forEach(result => {
          const existing = results.get(result.entry.id);
          if (existing) {
            existing.relevance += result.relevance * 1.2; // Peso maior para diagnóstico
            existing.matchedFields = [...new Set([...existing.matchedFields, ...result.matchedFields])];
          } else {
            result.relevance *= 1.2;
            results.set(result.entry.id, result);
          }
        });
      }

      const finalResults = Array.from(results.values())
        .sort((a, b) => {
          // Ordenar por relevância e confiança
          const scoreA = a.relevance * a.entry.confidence;
          const scoreB = b.relevance * b.entry.confidence;
          return scoreB - scoreA;
        })
        .slice(0, aiEconomicaConfig.knowledgeBase.maxResults);

      aiLogger.logKnowledgeBaseOperation('search', undefined, true);
      return finalResults;
    } catch (error) {
      aiLogger.error(LogCategory.KNOWLEDGE_BASE, 'Erro na busca', error as Error, { params });
      return [];
    }
  }

  async searchByText(text: string): Promise<KnowledgeResult[]> {
    const words = this.extractWords(text);
    const entryScores = new Map<string, number>();

    words.forEach(word => {
      const entryIds = this.textIndex.get(word);
      if (entryIds) {
        entryIds.forEach(entryId => {
          entryScores.set(entryId, (entryScores.get(entryId) || 0) + 1);
        });
      }

      // Busca fuzzy se habilitada
      if (aiEconomicaConfig.knowledgeBase.fuzzySearch) {
        this.textIndex.forEach((entryIds, indexedWord) => {
          if (this.calculateSimilarity(word, indexedWord) >= aiEconomicaConfig.knowledgeBase.fuzzyThreshold) {
            entryIds.forEach(entryId => {
              entryScores.set(entryId, (entryScores.get(entryId) || 0) + 0.5);
            });
          }
        });
      }
    });

    return Array.from(entryScores.entries())
      .map(([entryId, score]) => {
        const entry = this.indexedEntries.get(entryId);
        if (!entry) return null;

        return {
          entry,
          relevance: score / words.length,
          matchedFields: ['content', 'title', 'summary']
        };
      })
      .filter((result): result is KnowledgeResult => result !== null);
  }

  async searchBySymptoms(symptoms: string[]): Promise<KnowledgeResult[]> {
    const entryScores = new Map<string, number>();

    symptoms.forEach(symptom => {
      const normalizedSymptom = this.normalizeText(symptom);
      const entryIds = this.symptomIndex.get(normalizedSymptom);
      
      if (entryIds) {
        entryIds.forEach(entryId => {
          entryScores.set(entryId, (entryScores.get(entryId) || 0) + 1);
        });
      }
    });

    return Array.from(entryScores.entries())
      .map(([entryId, score]) => {
        const entry = this.indexedEntries.get(entryId);
        if (!entry) return null;

        return {
          entry,
          relevance: score / symptoms.length,
          matchedFields: ['tags', 'conditions']
        };
      })
      .filter((result): result is KnowledgeResult => result !== null);
  }

  async searchByDiagnosis(diagnosis: string): Promise<KnowledgeResult[]> {
    const normalizedDiagnosis = this.normalizeText(diagnosis);
    const entryIds = this.diagnosisIndex.get(normalizedDiagnosis);
    
    if (!entryIds) return [];

    return Array.from(entryIds)
      .map(entryId => {
        const entry = this.indexedEntries.get(entryId);
        if (!entry) return null;

        return {
          entry,
          relevance: 1.0,
          matchedFields: ['conditions']
        };
      })
      .filter((result): result is KnowledgeResult => result !== null);
  }

  async searchByTechniques(techniques: string[]): Promise<KnowledgeResult[]> {
    const entryScores = new Map<string, number>();

    techniques.forEach(technique => {
      const normalizedTechnique = this.normalizeText(technique);
      const entryIds = this.techniqueIndex.get(normalizedTechnique);
      
      if (entryIds) {
        entryIds.forEach(entryId => {
          entryScores.set(entryId, (entryScores.get(entryId) || 0) + 1);
        });
      }
    });

    return Array.from(entryScores.entries())
      .map(([entryId, score]) => {
        const entry = this.indexedEntries.get(entryId);
        if (!entry) return null;

        return {
          entry,
          relevance: score / techniques.length,
          matchedFields: ['techniques']
        };
      })
      .filter((result): result is KnowledgeResult => result !== null);
  }

  async updateIndex(entry: KnowledgeEntry): Promise<void> {
    await this.removeFromIndex(entry.id);
    await this.index(entry);
  }

  async removeFromIndex(entryId: string): Promise<void> {
    // Remover de todos os índices
    this.textIndex.forEach(entryIds => entryIds.delete(entryId));
    this.symptomIndex.forEach(entryIds => entryIds.delete(entryId));
    this.diagnosisIndex.forEach(entryIds => entryIds.delete(entryId));
    this.techniqueIndex.forEach(entryIds => entryIds.delete(entryId));
    
    this.indexedEntries.delete(entryId);
  }

  private extractWords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .map(word => this.normalizeText(word));
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private calculateSimilarity(word1: string, word2: string): number {
    const len1 = word1.length;
    const len2 = word2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;

    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = word1[i - 1] === word2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const maxLen = Math.max(len1, len2);
    return 1 - (matrix[len1][len2] / maxLen);
  }
}

class LocalStorageContentManager implements ContentManager {
  private storageKey = 'ai_economica_knowledge_base';

  async save(entry: KnowledgeEntry): Promise<void> {
    try {
      const entries = await this.loadAll();
      entries.set(entry.id, entry);
      await this.saveAll(entries);
      aiLogger.logKnowledgeBaseOperation('add', entry.id, true);
    } catch (error) {
      aiLogger.error(LogCategory.KNOWLEDGE_BASE, 'Erro ao salvar entrada', error as Error, { entryId: entry.id });
      throw error;
    }
  }

  async findById(id: string): Promise<KnowledgeEntry | null> {
    try {
      const entries = await this.loadAll();
      return entries.get(id) || null;
    } catch (error) {
      aiLogger.error(LogCategory.KNOWLEDGE_BASE, 'Erro ao buscar entrada por ID', error as Error, { entryId: id });
      return null;
    }
  }

  async update(entry: KnowledgeEntry): Promise<void> {
    try {
      const entries = await this.loadAll();
      if (entries.has(entry.id)) {
        entry.updatedAt = new Date().toISOString();
        entries.set(entry.id, entry);
        await this.saveAll(entries);
        aiLogger.logKnowledgeBaseOperation('update', entry.id, true);
      } else {
        throw new Error(`Entrada ${entry.id} não encontrada`);
      }
    } catch (error) {
      aiLogger.error(LogCategory.KNOWLEDGE_BASE, 'Erro ao atualizar entrada', error as Error, { entryId: entry.id });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const entries = await this.loadAll();
      if (entries.delete(id)) {
        await this.saveAll(entries);
        aiLogger.logKnowledgeBaseOperation('delete', id, true);
      } else {
        throw new Error(`Entrada ${id} não encontrada`);
      }
    } catch (error) {
      aiLogger.error(LogCategory.KNOWLEDGE_BASE, 'Erro ao deletar entrada', error as Error, { entryId: id });
      throw error;
    }
  }

  async findAll(filters?: Partial<KnowledgeEntry>): Promise<KnowledgeEntry[]> {
    try {
      const entries = await this.loadAll();
      let results = Array.from(entries.values());

      if (filters) {
        results = results.filter(entry => {
          return Object.entries(filters).every(([key, value]) => {
            if (value === undefined) return true;
            return (entry as any)[key] === value;
          });
        });
      }

      return results.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      aiLogger.error(LogCategory.KNOWLEDGE_BASE, 'Erro ao buscar todas as entradas', error as Error);
      return [];
    }
  }

  async findByTenant(tenantId: string): Promise<KnowledgeEntry[]> {
    return this.findAll({ tenantId });
  }

  private async loadAll(): Promise<Map<string, KnowledgeEntry>> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return new Map();

      const data = JSON.parse(stored);
      return new Map(Object.entries(data));
    } catch (error) {
      aiLogger.error(LogCategory.KNOWLEDGE_BASE, 'Erro ao carregar dados do localStorage', error as Error);
      return new Map();
    }
  }

  private async saveAll(entries: Map<string, KnowledgeEntry>): Promise<void> {
    try {
      const data = Object.fromEntries(entries);
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        // Implementar limpeza automática se necessário
        aiLogger.warn(LogCategory.KNOWLEDGE_BASE, 'Quota do localStorage excedida, implementar limpeza');
      }
      throw error;
    }
  }
}

export class KnowledgeBaseService {
  private searchEngine: SearchEngine;
  private contentManager: ContentManager;

  constructor() {
    this.searchEngine = new SimpleSearchEngine();
    this.contentManager = new LocalStorageContentManager();
    this.initializeIndexes();
  }

  private async initializeIndexes(): Promise<void> {
    try {
      aiLogger.info(LogCategory.KNOWLEDGE_BASE, 'Inicializando índices da base de conhecimento');
      
      const entries = await this.contentManager.findAll();
      for (const entry of entries) {
        await this.searchEngine.index(entry);
      }
      
      aiLogger.info(LogCategory.KNOWLEDGE_BASE, `Índices inicializados com ${entries.length} entradas`);
    } catch (error) {
      aiLogger.error(LogCategory.KNOWLEDGE_BASE, 'Erro ao inicializar índices', error as Error);
    }
  }

  async addKnowledge(entry: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const fullEntry: KnowledgeEntry = {
      ...entry,
      id: this.generateEntryId(),
      confidence: this.calculateInitialConfidence(entry as any),
      usageCount: 0,
      successRate: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };

    // Validar entrada
    this.validateEntry(fullEntry);

    // Gerar resumo automático se habilitado
    if (aiEconomicaConfig.knowledgeBase.autoSummary && !fullEntry.summary) {
      fullEntry.summary = this.generateSummary(fullEntry.content);
    }

    await this.contentManager.save(fullEntry);
    await this.searchEngine.index(fullEntry);

    return fullEntry.id;
  }

  async search(params: SearchParams): Promise<KnowledgeResult[]> {
    if (!aiEconomicaConfig.knowledgeBase.enabled) {
      return [];
    }

    const results = await this.searchEngine.search(params);
    
    // Filtrar por threshold de confiança
    const filteredResults = results.filter(result => 
      result.entry.confidence >= aiEconomicaConfig.knowledgeBase.minConfidenceThreshold
    );

    // Atualizar estatísticas de uso
    for (const result of filteredResults) {
      result.entry.lastUsed = new Date().toISOString();
      result.entry.usageCount++;
      await this.contentManager.update(result.entry);
    }

    return this.rankResults(filteredResults, params);
  }

  async updateConfidence(entryId: string, feedback: 'positive' | 'negative'): Promise<void> {
    const entry = await this.contentManager.findById(entryId);
    if (!entry) {
      throw new Error(`Entrada ${entryId} não encontrada`);
    }

    const adjustment = feedback === 'positive' ? 0.05 : -0.05;
    entry.confidence = Math.max(0.1, Math.min(1.0, entry.confidence + adjustment));
    
    // Atualizar taxa de sucesso
    const totalFeedbacks = entry.usageCount;
    if (totalFeedbacks > 0) {
      const currentSuccesses = entry.successRate * totalFeedbacks;
      const newSuccesses = feedback === 'positive' ? currentSuccesses + 1 : currentSuccesses;
      entry.successRate = Math.max(0, Math.min(1, newSuccesses / (totalFeedbacks + 1)));
    }

    await this.contentManager.update(entry);
    await this.searchEngine.updateIndex(entry);
  }

  async getEntryById(id: string): Promise<KnowledgeEntry | null> {
    return this.contentManager.findById(id);
  }

  async updateEntry(entry: KnowledgeEntry): Promise<void> {
    this.validateEntry(entry);
    await this.contentManager.update(entry);
    await this.searchEngine.updateIndex(entry);
  }

  async deleteEntry(id: string): Promise<void> {
    await this.contentManager.delete(id);
    await this.searchEngine.removeFromIndex(id);
  }

  async getAllEntries(tenantId?: string): Promise<KnowledgeEntry[]> {
    if (tenantId) {
      return this.contentManager.findByTenant(tenantId);
    }
    return this.contentManager.findAll();
  }

  async getStatistics(): Promise<{
    totalEntries: number;
    byType: Record<string, number>;
    byAuthor: Record<string, number>;
    averageConfidence: number;
    averageSuccessRate: number;
    mostUsed: KnowledgeEntry[];
    recentlyAdded: KnowledgeEntry[];
  }> {
    const entries = await this.contentManager.findAll();
    
    const stats = {
      totalEntries: entries.length,
      byType: {} as Record<string, number>,
      byAuthor: {} as Record<string, number>,
      averageConfidence: 0,
      averageSuccessRate: 0,
      mostUsed: [] as KnowledgeEntry[],
      recentlyAdded: [] as KnowledgeEntry[]
    };

    if (entries.length === 0) return stats;

    // Calcular estatísticas
    let totalConfidence = 0;
    let totalSuccessRate = 0;

    entries.forEach(entry => {
      // Por tipo
      stats.byType[entry.type] = (stats.byType[entry.type] || 0) + 1;
      
      // Por autor
      stats.byAuthor[entry.author.name] = (stats.byAuthor[entry.author.name] || 0) + 1;
      
      // Acumular para médias
      totalConfidence += entry.confidence;
      totalSuccessRate += entry.successRate;
    });

    stats.averageConfidence = totalConfidence / entries.length;
    stats.averageSuccessRate = totalSuccessRate / entries.length;

    // Mais usados (top 10)
    stats.mostUsed = entries
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    // Recentemente adicionados (últimos 10)
    stats.recentlyAdded = entries
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return stats;
  }

  private validateEntry(entry: KnowledgeEntry): void {
    const required = ['title', 'content', 'type', 'author', 'tenantId'];
    for (const field of required) {
      if (!(entry as any)[field]) {
        throw new Error(`Campo obrigatório ausente: ${field}`);
      }
    }

    if (entry.title.length < 5) {
      throw new Error('Título deve ter pelo menos 5 caracteres');
    }

    if (entry.content.length < 20) {
      throw new Error('Conteúdo deve ter pelo menos 20 caracteres');
    }

    if (!['protocol', 'exercise', 'case', 'technique', 'experience'].includes(entry.type)) {
      throw new Error('Tipo inválido');
    }
  }

  private calculateInitialConfidence(entry: Partial<KnowledgeEntry>): number {
    let confidence = 0.5; // Base

    // Bonus por autor experiente
    if (entry.author && entry.author.experience > 5) confidence += 0.2;
    
    // Bonus por referências
    if (entry.references && entry.references.length > 0) confidence += 0.1;
    
    // Bonus por detalhamento
    if (entry.content && entry.content.length > 500) confidence += 0.1;
    
    // Bonus por tags relevantes
    if (entry.tags && entry.tags.length >= 3) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  private generateSummary(content: string): string {
    // Implementação simples de resumo automático
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length <= 2) return content;
    
    // Pegar as primeiras 2 sentenças como resumo
    return sentences.slice(0, 2).join('. ').trim() + '.';
  }

  private rankResults(results: KnowledgeResult[], params: SearchParams): KnowledgeResult[] {
    return results.sort((a, b) => {
      // Combinar relevância, confiança e uso recente
      const scoreA = a.relevance * a.entry.confidence * this.getRecencyBonus(a.entry);
      const scoreB = b.relevance * b.entry.confidence * this.getRecencyBonus(b.entry);
      
      return scoreB - scoreA;
    });
  }

  private getRecencyBonus(entry: KnowledgeEntry): number {
    const daysSinceLastUse = (Date.now() - new Date(entry.lastUsed).getTime()) / (1000 * 60 * 60 * 24);
    
    // Bonus decresce com o tempo
    if (daysSinceLastUse < 7) return 1.2;
    if (daysSinceLastUse < 30) return 1.1;
    if (daysSinceLastUse < 90) return 1.0;
    return 0.9;
  }

  private generateEntryId(): string {
    return `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default KnowledgeBaseService;