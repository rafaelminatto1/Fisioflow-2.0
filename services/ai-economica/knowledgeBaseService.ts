
import { 
  KnowledgeEntry, 
  QueryType, 
  SearchQuery, 
  SearchResult, 
  SearchResponse,
  QualityAssessment,
  ValidationResult
} from '../../types/ai-economica.types';
import { aiEconomicaLogger } from './logger';
import { AI_ECONOMICA_CONFIG } from '../../config/ai-economica.config';

class KnowledgeBaseService {
  private entries: KnowledgeEntry[] = [];
  private searchIndex: Map<string, Set<string>> = new Map();
  private initialized = false;

  constructor() {
    this.initializeKnowledgeBase();
  }

  // Initialization and data loading
  private async initializeKnowledgeBase() {
    if (this.initialized) return;

    try {
      await this.loadInitialData();
      this.buildSearchIndex();
      this.initialized = true;
      
      aiEconomicaLogger.logKnowledge('Knowledge base initialized', undefined, {
        entryCount: this.entries.length,
        indexSize: this.searchIndex.size
      });
    } catch (error) {
      aiEconomicaLogger.error('Failed to initialize knowledge base', error as Error);
    }
  }

  private async loadInitialData() {
    // Mock initial knowledge base data - comprehensive physiotherapy knowledge
    const mockEntries: KnowledgeEntry[] = [
      {
        id: '1',
        title: 'Protocolo de Fisioterapia para Lesão de LCA',
        content: `Protocolo completo para reabilitação de lesão do ligamento cruzado anterior (LCA):

        FASE 1 (0-2 semanas pós-cirurgia):
        - Controle da dor e edema
        - Mobilização passiva do joelho (0-90°)
        - Exercícios isométricos de quadríceps
        - Treino de marcha com muletas

        FASE 2 (2-6 semanas):
        - Amplitude de movimento ativa (0-120°)
        - Fortalecimento isotônico inicial
        - Exercícios proprioceptivos básicos
        - Bicicleta estacionária sem resistência

        FASE 3 (6-12 semanas):
        - Fortalecimento progressivo
        - Exercícios funcionais
        - Treino proprioceptivo avançado
        - Início do treino de corrida

        FASE 4 (12-24 semanas):
        - Exercícios pliométricos
        - Treino esportivo específico
        - Testes funcionais
        - Retorno ao esporte

        Critérios de progressão:
        - Ausência de dor e edema
        - Amplitude de movimento completa
        - Força muscular adequada (>90% do membro contralateral)
        - Testes funcionais satisfatórios`,
        type: QueryType.PROTOCOL,
        tags: ['LCA', 'joelho', 'reabilitação', 'protocolo', 'cirurgia', 'ortopedia'],
        author: 'Dr. Carlos Silva',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        confidenceScore: 95,
        sources: [
          'Protocolo ACSM 2023',
          'Guidelines FIFA 11+',
          'Cochrane Review - ACL Rehabilitation'
        ],
        validatedBy: 'Dr. Maria Santos - Ortopedista',
        usageCount: 127,
        avgRating: 4.8,
        relatedEntries: ['2', '15', '23'],
        isPublic: true,
        specialty: 'Ortopedia',
        difficulty: 'advanced',
        evidence: 'high',
        lastReviewed: new Date('2024-01-15'),
        metadata: {
          averageRecoveryTime: '6-9 meses',
          successRate: 92,
          complications: ['rigidez', 'fraqueza muscular', 'instabilidade residual']
        }
      },
      {
        id: '2',
        title: 'Exercícios para Fortalecimento de Core',
        content: `Série de exercícios para fortalecimento da musculatura do core:

        EXERCÍCIOS BÁSICOS:
        1. Prancha frontal
           - 3 séries de 30-60 segundos
           - Foco na ativação do transverso do abdome
           - Evitar compensações na coluna

        2. Prancha lateral
           - 3 séries de 20-45 segundos cada lado
           - Importante para estabilização lateral
           - Progressão com elevação de membros

        3. Dead bug
           - 3 séries de 10-15 repetições
           - Excelente para coordenação
           - Controle de movimento lento

        4. Bird dog
           - 3 séries de 10 repetições cada lado
           - Fortalece extensores da coluna
           - Melhora propriocepção

        EXERCÍCIOS INTERMEDIÁRIOS:
        1. Ponte com uma perna
        2. Mountain climbers controlado
        3. Russian twists
        4. Hollow body hold

        EXERCÍCIOS AVANÇADOS:
        1. Turkish get-up
        2. Renegade rows
        3. Bear crawl
        4. Single arm farmer's walk

        Progressão:
        - Iniciantes: 2-3x/semana, exercícios básicos
        - Intermediários: 3-4x/semana, combinação básico/intermediário
        - Avançados: 4-5x/semana, todos os níveis

        Contraindicações:
        - Hérnia de disco aguda
        - Lombalgia aguda severa
        - Gravidez (adaptações necessárias)`,
        type: QueryType.EXERCISE,
        tags: ['core', 'fortalecimento', 'estabilização', 'coluna', 'abdome', 'exercícios'],
        author: 'Dra. Ana Rodrigues',
        createdAt: new Date('2023-12-15'),
        updatedAt: new Date('2024-01-10'),
        confidenceScore: 88,
        sources: [
          'American Journal of Sports Medicine',
          'Core Stability Research McGill',
          'ACSM Exercise Guidelines'
        ],
        validatedBy: 'Prof. João Santos - Biomecânica',
        usageCount: 234,
        avgRating: 4.7,
        relatedEntries: ['5', '12', '18'],
        isPublic: true,
        specialty: 'Musculoesquelético',
        difficulty: 'intermediate',
        evidence: 'high',
        lastReviewed: new Date('2024-01-10'),
        metadata: {
          duration: '20-30 minutos',
          equipment: 'peso corporal',
          targetMuscles: ['transverso', 'multífidos', 'diafragma', 'assoalho pélvico']
        }
      },
      {
        id: '3',
        title: 'Diagnóstico Diferencial de Dor Lombar',
        content: `Abordagem sistemática para diagnóstico diferencial da dor lombar:

        CLASSIFICAÇÃO POR ORIGEM:
        
        1. MECÂNICA (85-90% dos casos):
           - Síndrome facetária
           - Hérnia de disco
           - Estenose espinal
           - Espondilolistese
           - Síndrome miofascial

        2. NÃO MECÂNICA (5-10%):
           - Infecciosa (osteomielite, discite)
           - Inflamatória (espondilite anquilosante)
           - Neoplásica (primária ou metastática)
           - Metabólica (osteoporose)

        3. VISCERAL (2-5%):
           - Aneurisma de aorta
           - Patologia renal
           - Doença inflamatória pélvica
           - Úlcera péptica

        RED FLAGS (sinais de alerta):
        - Idade <20 ou >50 anos no primeiro episódio
        - Dor noturna constante
        - Perda de peso inexplicada
        - Febre
        - Déficit neurológico progressivo
        - Incontinência urinária/fecal
        - História de câncer
        - Uso de corticosteroides
        - Abuso de drogas intravenosas

        YELLOW FLAGS (fatores psicossociais):
        - Medo-evitação
        - Catastrofização
        - Depressão
        - Problemas no trabalho
        - Baixa expectativa de melhora

        AVALIAÇÃO CLÍNICA:
        1. História detalhada
        2. Exame físico completo
        3. Testes especiais
        4. Avaliação neurológica
        5. Screening para red flags

        EXAMES COMPLEMENTARES:
        - Raio-X: fraturas, espondilolistese
        - RM: hérnias, estenose, infecção
        - TC: detalhes ósseos
        - Cintilografia: metástases, infecção`,
        type: QueryType.DIAGNOSIS,
        tags: ['lombar', 'diagnóstico', 'dor', 'coluna', 'red flags', 'avaliação'],
        author: 'Dr. Pedro Martinez',
        createdAt: new Date('2023-11-20'),
        updatedAt: new Date('2024-01-05'),
        confidenceScore: 92,
        sources: [
          'Clinical Practice Guidelines Low Back Pain',
          'Spine Journal Diagnostic Criteria',
          'European Guidelines for Management of Chronic Low Back Pain'
        ],
        validatedBy: 'Dr. Fernando Costa - Neurocirurgião',
        usageCount: 189,
        avgRating: 4.9,
        relatedEntries: ['7', '11', '19'],
        isPublic: true,
        specialty: 'Ortopedia',
        difficulty: 'advanced',
        evidence: 'high',
        lastReviewed: new Date('2024-01-05'),
        metadata: {
          prevalence: '80% população adulta',
          recurrence: '40-60% em 1 ano',
          chronicityRisk: '10-15%'
        }
      },
      {
        id: '4',
        title: 'Protocolo de Emergência para Lesão Medular',
        content: `PROTOCOLO DE EMERGÊNCIA - SUSPEITA DE LESÃO MEDULAR

        AVALIAÇÃO INICIAL:
        1. ABC (via aérea, respiração, circulação)
        2. Imobilização completa da coluna
        3. Avaliação neurológica rápida
        4. Mecanismo de trauma

        IMOBILIZAÇÃO:
        - Colar cervical rígido
        - Prancha rígida
        - Fixação da cabeça
        - Rolamento em bloco

        AVALIAÇÃO NEUROLÓGICA:
        1. Escala de ASIA
        2. Teste de sensibilidade
        3. Teste motor
        4. Reflexos tendinosos
        5. Reflexo bulbocavernoso

        SINAIS DE LESÃO MEDULAR:
        - Paralisia ou paresia
        - Perda sensorial
        - Choque medular (hipotensão + bradicardia)
        - Priapismo
        - Incontinência
        - Arreflexia

        NÍVEIS DE LESÃO:
        - C1-C4: Quadriplegia completa
        - C5-C8: Quadriplegia incompleta
        - T1-T12: Paraplegia
        - L1-S5: Síndrome da cauda equina

        TRATAMENTO EMERGENCIAL:
        1. Manter pressão arterial média >85-90 mmHg
        2. Corticosteroides (controverso)
        3. Imobilização rigorosa
        4. Transporte urgente
        5. Comunicação com equipe neurocirúrgica

        COMPLICAÇÕES AGUDAS:
        - Insuficiência respiratória
        - Choque neurogênico
        - Disreflexia autonômica
        - Tromboembolismo
        - Úlceras de pressão

        NÃO FAZER:
        - Mobilizar sem imobilização
        - Testar amplitude de movimento
        - Administrar sedativos
        - Descuidar da hipotermia`,
        type: QueryType.EMERGENCY,
        tags: ['medular', 'emergência', 'trauma', 'protocolo', 'imobilização', 'neurológico'],
        author: 'Dr. Rafael Emergency',
        createdAt: new Date('2023-10-15'),
        updatedAt: new Date('2023-12-20'),
        confidenceScore: 98,
        sources: [
          'ATLS Guidelines',
          'ASIA Standards',
          'Emergency Medicine Protocols'
        ],
        validatedBy: 'Dr. Lucas Trauma - Neurocirurgia',
        usageCount: 67,
        avgRating: 5.0,
        relatedEntries: ['16', '22'],
        isPublic: true,
        specialty: 'Neurologia',
        difficulty: 'advanced',
        evidence: 'high',
        lastReviewed: new Date('2023-12-20'),
        metadata: {
          timeToTreatment: '< 8 horas crítico',
          mortalityRate: '4-17%',
          functionalOutcome: 'variável por nível'
        }
      },
      {
        id: '5',
        title: 'Pesquisa: Eficácia da Terapia Manual vs Exercícios',
        content: `REVISÃO SISTEMÁTICA: Terapia Manual vs Exercício Terapêutico na Lombalgia Crônica

        OBJETIVO:
        Comparar a eficácia da terapia manual isolada versus exercício terapêutico versus combinação de ambos no tratamento da lombalgia crônica não específica.

        METODOLOGIA:
        - Busca em PubMed, Cochrane, EMBASE
        - Período: 2015-2023
        - RCTs com mínimo 50 participantes
        - Follow-up mínimo 3 meses
        - Outcomes: dor (VAS), funcionalidade (ODI), qualidade de vida

        RESULTADOS:
        Total de 24 estudos incluídos (n=3.247 participantes)

        TERAPIA MANUAL:
        - Redução dor: 2.1 pontos VAS (IC95%: 1.8-2.4)
        - Melhora ODI: 8.5 pontos (IC95%: 6.2-10.8)
        - Efeito curto prazo mais significativo

        EXERCÍCIO TERAPÊUTICO:
        - Redução dor: 1.8 pontos VAS (IC95%: 1.5-2.1)
        - Melhora ODI: 12.3 pontos (IC95%: 9.7-14.9)
        - Efeito sustentado longo prazo

        COMBINAÇÃO:
        - Redução dor: 2.8 pontos VAS (IC95%: 2.4-3.2)
        - Melhora ODI: 15.7 pontos (IC95%: 13.1-18.3)
        - Melhores resultados em todos os outcomes

        HETEROGENEIDADE:
        - I² = 68% para outcomes de dor
        - Variabilidade nas técnicas de terapia manual
        - Diferentes protocolos de exercício

        QUALIDADE DA EVIDÊNCIA:
        - 18 estudos alta qualidade (PEDro ≥6)
        - 6 estudos qualidade moderada
        - Baixo risco de viés na maioria

        CONCLUSÕES:
        1. Combinação de terapia manual + exercício superior
        2. Exercício isolado melhor para efeitos longo prazo
        3. Terapia manual eficaz para alívio imediato
        4. Personalização baseada em subgrupos

        LIMITAÇÕES:
        - Variabilidade nas intervenções
        - Diferentes populações estudadas
        - Seguimento máximo 12 meses

        IMPLICAÇÕES CLÍNICAS:
        - Abordagem multimodal recomendada
        - Considerar preferências do paciente
        - Avaliar custo-efetividade`,
        type: QueryType.RESEARCH,
        tags: ['pesquisa', 'terapia manual', 'exercício', 'lombalgia', 'evidência', 'RCT'],
        author: 'Dra. Mariana Research',
        createdAt: new Date('2023-09-10'),
        updatedAt: new Date('2023-12-01'),
        confidenceScore: 91,
        sources: [
          'Cochrane Database of Systematic Reviews',
          'Physical Therapy Journal',
          'Spine Journal Meta-analysis'
        ],
        validatedBy: 'Prof. Antonio Evidence - USP',
        usageCount: 156,
        avgRating: 4.6,
        relatedEntries: ['3', '8', '14'],
        isPublic: true,
        specialty: 'Baseado em Evidências',
        difficulty: 'advanced',
        evidence: 'high',
        lastReviewed: new Date('2023-12-01'),
        metadata: {
          studyType: 'systematic review',
          evidenceLevel: '1A',
          recommendation: 'forte'
        }
      }
    ];

    this.entries = mockEntries;
  }

  // Search functionality
  async search(searchQuery: SearchQuery): Promise<SearchResponse> {
    const startTime = Date.now();
    
    try {
      await this.ensureInitialized();
      
      let results = await this.performSearch(searchQuery);
      
      // Apply filters
      if (searchQuery.filters) {
        results = this.applyFilters(results, searchQuery.filters);
      }

      // Apply sorting
      if (searchQuery.sorting) {
        results = this.applySorting(results, searchQuery.sorting);
      }

      // Apply pagination
      const total = results.length;
      if (searchQuery.pagination) {
        const { page, limit } = searchQuery.pagination;
        const startIndex = (page - 1) * limit;
        results = results.slice(startIndex, startIndex + limit);
      }

      const processingTime = Date.now() - startTime;
      
      aiEconomicaLogger.logKnowledge('Search completed', undefined, {
        query: searchQuery.text,
        resultsCount: results.length,
        totalMatches: total,
        processingTime
      });

      return {
        results,
        total,
        query: searchQuery,
        processingTime,
        suggestions: this.generateSuggestions(searchQuery.text),
        filters: this.generateFilterOptions(this.entries)
      };

    } catch (error) {
      aiEconomicaLogger.error('Search failed', error as Error, { query: searchQuery.text });
      throw error;
    }
  }

  private async performSearch(searchQuery: SearchQuery): Promise<SearchResult[]> {
    const searchText = searchQuery.text.toLowerCase();
    const searchTerms = searchText.split(' ').filter(term => term.length > 2);
    
    const results: SearchResult[] = [];

    for (const entry of this.entries) {
      let relevanceScore = 0;
      const highlights: string[] = [];
      const matchedTags: string[] = [];
      
      // Title matching (highest weight)
      if (entry.title.toLowerCase().includes(searchText)) {
        relevanceScore += 100;
        highlights.push(this.highlightText(entry.title, searchText));
      } else {
        // Check individual terms in title
        searchTerms.forEach(term => {
          if (entry.title.toLowerCase().includes(term)) {
            relevanceScore += 80;
          }
        });
      }
      
      // Content matching
      if (entry.content.toLowerCase().includes(searchText)) {
        relevanceScore += 70;
        highlights.push(this.extractRelevantSnippet(entry.content, searchText));
      } else {
        // Check individual terms in content
        searchTerms.forEach(term => {
          if (entry.content.toLowerCase().includes(term)) {
            relevanceScore += 50;
          }
        });
      }
      
      // Tag matching
      entry.tags.forEach(tag => {
        if (tag.toLowerCase().includes(searchText)) {
          relevanceScore += 90;
          matchedTags.push(tag);
        } else {
          searchTerms.forEach(term => {
            if (tag.toLowerCase().includes(term)) {
              relevanceScore += 60;
              matchedTags.push(tag);
            }
          });
        }
      });
      
      // Type matching
      if (searchQuery.type && entry.type === searchQuery.type) {
        relevanceScore += 30;
      }
      
      // Boost based on usage and rating
      relevanceScore += entry.usageCount * 0.1;
      relevanceScore += entry.avgRating * 5;
      relevanceScore += entry.confidenceScore * 0.5;
      
      // Only include if there's some relevance
      if (relevanceScore > 0) {
        results.push({
          entry,
          relevanceScore,
          highlights: highlights.slice(0, 3), // Limit to 3 highlights
          matchedTags: [...new Set(matchedTags)], // Remove duplicates
          reasoning: this.generateReasoningText(entry, relevanceScore, matchedTags)
        });
      }
    }
    
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private applyFilters(results: SearchResult[], filters: SearchQuery['filters']): SearchResult[] {
    if (!filters) return results;
    
    return results.filter(result => {
      const entry = result.entry;
      
      // Tag filter
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => 
          entry.tags.some(entryTag => entryTag.toLowerCase().includes(tag.toLowerCase()))
        );
        if (!hasMatchingTag) return false;
      }
      
      // Specialty filter
      if (filters.specialty && !entry.specialty.toLowerCase().includes(filters.specialty.toLowerCase())) {
        return false;
      }
      
      // Minimum confidence filter
      if (filters.minConfidence && entry.confidenceScore < filters.minConfidence) {
        return false;
      }
      
      // Evidence level filter
      if (filters.evidenceLevel && filters.evidenceLevel.length > 0) {
        if (!filters.evidenceLevel.includes(entry.evidence)) {
          return false;
        }
      }
      
      // Date range filter
      if (filters.dateRange) {
        const entryDate = new Date(entry.updatedAt);
        if (entryDate < filters.dateRange.start || entryDate > filters.dateRange.end) {
          return false;
        }
      }
      
      // Author filter
      if (filters.author && !entry.author.toLowerCase().includes(filters.author.toLowerCase())) {
        return false;
      }
      
      return true;
    });
  }

  private applySorting(results: SearchResult[], sorting: SearchQuery['sorting']): SearchResult[] {
    if (!sorting) return results;
    
    const { field, order } = sorting;
    const multiplier = order === 'desc' ? -1 : 1;
    
    return results.sort((a, b) => {
      let comparison = 0;
      
      switch (field) {
        case 'relevance':
          comparison = a.relevanceScore - b.relevanceScore;
          break;
        case 'confidence':
          comparison = a.entry.confidenceScore - b.entry.confidenceScore;
          break;
        case 'date':
          comparison = new Date(a.entry.updatedAt).getTime() - new Date(b.entry.updatedAt).getTime();
          break;
        case 'usage':
          comparison = a.entry.usageCount - b.entry.usageCount;
          break;
        default:
          comparison = a.relevanceScore - b.relevanceScore;
      }
      
      return comparison * multiplier;
    });
  }

  // Knowledge base management
  async addEntry(entry: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'avgRating'>): Promise<KnowledgeEntry> {
    const newEntry: KnowledgeEntry = {
      ...entry,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      avgRating: 0,
      relatedEntries: []
    };
    
    // Validate entry
    const validation = await this.validateEntry(newEntry);
    if (!validation.passed) {
      throw new Error(`Validation failed: ${validation.issues.map(i => i.message).join(', ')}`);
    }
    
    this.entries.push(newEntry);
    this.updateSearchIndex(newEntry);
    
    aiEconomicaLogger.logKnowledge('Entry added', newEntry.id, {
      title: newEntry.title,
      type: newEntry.type,
      author: newEntry.author
    });
    
    return newEntry;
  }

  async updateEntry(id: string, updates: Partial<KnowledgeEntry>): Promise<KnowledgeEntry> {
    const entryIndex = this.entries.findIndex(e => e.id === id);
    if (entryIndex === -1) {
      throw new Error(`Entry with id ${id} not found`);
    }
    
    const updatedEntry = {
      ...this.entries[entryIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    // Validate updated entry
    const validation = await this.validateEntry(updatedEntry);
    if (!validation.passed) {
      throw new Error(`Validation failed: ${validation.issues.map(i => i.message).join(', ')}`);
    }
    
    this.entries[entryIndex] = updatedEntry;
    this.updateSearchIndex(updatedEntry);
    
    aiEconomicaLogger.logKnowledge('Entry updated', id, {
      title: updatedEntry.title,
      changes: Object.keys(updates)
    });
    
    return updatedEntry;
  }

  async deleteEntry(id: string): Promise<void> {
    const entryIndex = this.entries.findIndex(e => e.id === id);
    if (entryIndex === -1) {
      throw new Error(`Entry with id ${id} not found`);
    }
    
    const entry = this.entries[entryIndex];
    this.entries.splice(entryIndex, 1);
    this.removeFromSearchIndex(entry);
    
    aiEconomicaLogger.logKnowledge('Entry deleted', id, {
      title: entry.title
    });
  }

  async getEntry(id: string): Promise<KnowledgeEntry | null> {
    await this.ensureInitialized();
    
    const entry = this.entries.find(e => e.id === id);
    if (entry) {
      // Increment usage count
      entry.usageCount++;
      aiEconomicaLogger.logKnowledge('Entry accessed', id, {
        title: entry.title,
        usageCount: entry.usageCount
      });
    }
    
    return entry || null;
  }

  // Quality assessment and validation
  async validateEntry(entry: KnowledgeEntry): Promise<ValidationResult> {
    const issues: ValidationResult['issues'] = [];
    const suggestions: string[] = [];
    let score = 100;
    
    // Title validation
    if (!entry.title || entry.title.length < 10) {
      issues.push({
        type: 'title',
        severity: 'error',
        message: 'Title must be at least 10 characters long'
      });
      score -= 20;
    }
    
    // Content validation
    if (!entry.content || entry.content.length < 100) {
      issues.push({
        type: 'content',
        severity: 'error',
        message: 'Content must be at least 100 characters long'
      });
      score -= 30;
    }
    
    // Tags validation
    if (!entry.tags || entry.tags.length === 0) {
      issues.push({
        type: 'tags',
        severity: 'warning',
        message: 'At least one tag is recommended for better searchability'
      });
      score -= 10;
      suggestions.push('Add relevant tags to improve discoverability');
    }
    
    // Sources validation
    if (!entry.sources || entry.sources.length === 0) {
      issues.push({
        type: 'sources',
        severity: 'warning',
        message: 'Sources are recommended for credibility'
      });
      score -= 15;
      suggestions.push('Add reliable sources to support the content');
    }
    
    // Confidence score validation
    if (entry.confidenceScore < AI_ECONOMICA_CONFIG.knowledge.confidenceThreshold) {
      issues.push({
        type: 'confidence',
        severity: 'warning',
        message: `Confidence score below threshold (${AI_ECONOMICA_CONFIG.knowledge.confidenceThreshold})`
      });
      score -= 10;
    }
    
    return {
      passed: issues.filter(i => i.severity === 'error').length === 0,
      score: Math.max(0, score),
      issues,
      suggestions
    };
  }

  async assessQuality(entryId: string, assessorId: string): Promise<QualityAssessment> {
    const entry = await this.getEntry(entryId);
    if (!entry) {
      throw new Error(`Entry ${entryId} not found`);
    }
    
    // Mock quality assessment - in real implementation would use ML or expert review
    const assessment: QualityAssessment = {
      accuracy: this.calculateAccuracyScore(entry),
      completeness: this.calculateCompletenessScore(entry),
      relevance: this.calculateRelevanceScore(entry),
      clarity: this.calculateClarityScore(entry),
      evidenceBased: entry.sources.length > 0 && entry.evidence !== 'low',
      citations: entry.sources.length,
      overallScore: 0,
      assessedBy: assessorId,
      assessedAt: new Date(),
      comments: 'Automated quality assessment'
    };
    
    // Calculate overall score
    assessment.overallScore = Math.round(
      (assessment.accuracy + assessment.completeness + assessment.relevance + assessment.clarity) / 4
    );
    
    return assessment;
  }

  // Analytics and reporting
  getKnowledgeBaseStats() {
    const stats = {
      totalEntries: this.entries.length,
      entriesByType: {} as Record<QueryType, number>,
      entriesBySpecialty: {} as Record<string, number>,
      averageConfidence: 0,
      averageRating: 0,
      totalUsage: 0,
      topAuthors: [] as Array<{ author: string; count: number }>,
      recentlyAdded: this.entries
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10),
      mostUsed: this.entries
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 10)
    };
    
    // Calculate statistics
    this.entries.forEach(entry => {
      // By type
      stats.entriesByType[entry.type] = (stats.entriesByType[entry.type] || 0) + 1;
      
      // By specialty
      stats.entriesBySpecialty[entry.specialty] = (stats.entriesBySpecialty[entry.specialty] || 0) + 1;
      
      // Totals
      stats.totalUsage += entry.usageCount;
    });
    
    // Averages
    if (this.entries.length > 0) {
      stats.averageConfidence = this.entries.reduce((sum, e) => sum + e.confidenceScore, 0) / this.entries.length;
      stats.averageRating = this.entries.reduce((sum, e) => sum + e.avgRating, 0) / this.entries.length;
    }
    
    // Top authors
    const authorCounts: Record<string, number> = {};
    this.entries.forEach(entry => {
      authorCounts[entry.author] = (authorCounts[entry.author] || 0) + 1;
    });
    
    stats.topAuthors = Object.entries(authorCounts)
      .map(([author, count]) => ({ author, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return stats;
  }

  // Helper methods
  private buildSearchIndex() {
    this.searchIndex.clear();
    
    this.entries.forEach(entry => {
      this.indexEntry(entry);
    });
  }

  private indexEntry(entry: KnowledgeEntry) {
    const terms = [
      ...entry.title.toLowerCase().split(/\s+/),
      ...entry.content.toLowerCase().split(/\s+/),
      ...entry.tags.map(tag => tag.toLowerCase()),
      entry.specialty.toLowerCase(),
      entry.author.toLowerCase()
    ].filter(term => term.length > 2);
    
    terms.forEach(term => {
      if (!this.searchIndex.has(term)) {
        this.searchIndex.set(term, new Set());
      }
      this.searchIndex.get(term)!.add(entry.id);
    });
  }

  private updateSearchIndex(entry: KnowledgeEntry) {
    // Remove old entry if it exists
    this.removeFromSearchIndex(entry);
    // Add updated entry
    this.indexEntry(entry);
  }

  private removeFromSearchIndex(entry: KnowledgeEntry) {
    this.searchIndex.forEach((entryIds, term) => {
      entryIds.delete(entry.id);
      if (entryIds.size === 0) {
        this.searchIndex.delete(term);
      }
    });
  }

  private highlightText(text: string, searchTerm: string): string {
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  private extractRelevantSnippet(content: string, searchTerm: string): string {
    const index = content.toLowerCase().indexOf(searchTerm.toLowerCase());
    if (index === -1) return content.substring(0, 150) + '...';
    
    const start = Math.max(0, index - 75);
    const end = Math.min(content.length, index + searchTerm.length + 75);
    
    let snippet = content.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    
    return this.highlightText(snippet, searchTerm);
  }

  private generateReasoningText(entry: KnowledgeEntry, relevanceScore: number, matchedTags: string[]): string {
    const reasons: string[] = [];
    
    if (matchedTags.length > 0) {
      reasons.push(`Matched tags: ${matchedTags.join(', ')}`);
    }
    
    if (entry.confidenceScore > 90) {
      reasons.push('High confidence content');
    }
    
    if (entry.usageCount > 100) {
      reasons.push('Frequently used by professionals');
    }
    
    if (entry.avgRating > 4.5) {
      reasons.push('Highly rated by users');
    }
    
    if (entry.evidence === 'high') {
      reasons.push('Strong evidence base');
    }
    
    return reasons.join(' • ');
  }

  private generateSuggestions(searchText: string): string[] {
    // Simple suggestion system - in real implementation would use more sophisticated NLP
    const commonSuggestions = [
      'protocolo',
      'exercício',
      'diagnóstico',
      'reabilitação',
      'tratamento',
      'fisioterapia'
    ];
    
    return commonSuggestions
      .filter(suggestion => suggestion.includes(searchText.toLowerCase()) || searchText.toLowerCase().includes(suggestion))
      .slice(0, 5);
  }

  private generateFilterOptions(entries: KnowledgeEntry[]) {
    const tags = new Set<string>();
    const specialties = new Set<string>();
    const evidenceLevels = new Set<string>();
    
    entries.forEach(entry => {
      entry.tags.forEach(tag => tags.add(tag));
      specialties.add(entry.specialty);
      evidenceLevels.add(entry.evidence);
    });
    
    return {
      tags: Array.from(tags).map(tag => ({ value: tag, count: this.getTagCount(tag) })),
      specialties: Array.from(specialties).map(specialty => ({ value: specialty, count: this.getSpecialtyCount(specialty) })),
      evidenceLevels: Array.from(evidenceLevels).map(level => ({ value: level, count: this.getEvidenceLevelCount(level) }))
    };
  }

  private getTagCount(tag: string): number {
    return this.entries.filter(entry => entry.tags.includes(tag)).length;
  }

  private getSpecialtyCount(specialty: string): number {
    return this.entries.filter(entry => entry.specialty === specialty).length;
  }

  private getEvidenceLevelCount(level: string): number {
    return this.entries.filter(entry => entry.evidence === level).length;
  }

  private calculateAccuracyScore(entry: KnowledgeEntry): number {
    // Mock calculation based on sources and validation
    let score = 70;
    if (entry.sources.length > 0) score += 15;
    if (entry.validatedBy) score += 10;
    if (entry.evidence === 'high') score += 5;
    return Math.min(100, score);
  }

  private calculateCompletenessScore(entry: KnowledgeEntry): number {
    let score = 60;
    if (entry.content.length > 500) score += 20;
    if (entry.tags.length > 3) score += 10;
    if (entry.sources.length > 2) score += 10;
    return Math.min(100, score);
  }

  private calculateRelevanceScore(entry: KnowledgeEntry): number {
    let score = 75;
    if (entry.usageCount > 50) score += 15;
    if (entry.avgRating > 4.0) score += 10;
    return Math.min(100, score);
  }

  private calculateClarityScore(entry: KnowledgeEntry): number {
    // Mock calculation based on content structure
    let score = 80;
    if (entry.content.includes('OBJETIVO:') || entry.content.includes('PROTOCOLO:')) score += 10;
    if (entry.content.includes('\n')) score += 10; // Has formatting
    return Math.min(100, score);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initializeKnowledgeBase();
    }
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
export default knowledgeBaseService;
