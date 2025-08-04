import { KnowledgeEntry, SearchResult, SearchQuery } from '@/types/ai-economica.types';

export class SearchEngine {
  private stopWords = new Set([
    'a', 'o', 'e', 'de', 'do', 'da', 'em', 'para', 'com', 'por', 'que', 'se', 'na', 'no',
    'um', 'uma', 'os', 'as', 'dos', 'das', 'são', 'foi', 'ter', 'seu', 'sua', 'seus', 'suas'
  ]);

  /**
   * Realiza busca inteligente na base de conhecimento
   */
  async search(query: SearchQuery, knowledgeBase: KnowledgeEntry[]): Promise<SearchResult[]> {
    const normalizedQuery = this.normalizeQuery(query.text);
    const queryTerms = this.extractTerms(normalizedQuery);

    if (queryTerms.length === 0) {
      return [];
    }

    // Calcular relevância para cada entrada
    const scoredResults = knowledgeBase.map(entry => ({
      entry,
      score: this.calculateRelevanceScore(entry, queryTerms, query)
    }));

    // Filtrar e ordenar resultados
    const relevantResults = scoredResults
      .filter(result => result.score > 0.1) // Threshold mínimo de relevância
      .sort((a, b) => b.score - a.score)
      .slice(0, query.limit || 10);

    return relevantResults.map(result => ({
      entry: result.entry,
      score: result.score,
      highlights: this.generateHighlights(result.entry, queryTerms),
      matchedFields: this.getMatchedFields(result.entry, queryTerms)
    }));
  }

  /**
   * Busca por sintomas específicos
   */
  async searchBySymptoms(symptoms: string[], knowledgeBase: KnowledgeEntry[]): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    for (const entry of knowledgeBase) {
      const matchedSymptoms = symptoms.filter(symptom => 
        entry.symptoms?.some(entrySymptom => 
          this.fuzzyMatch(symptom, entrySymptom, 0.8)
        )
      );

      if (matchedSymptoms.length > 0) {
        const score = (matchedSymptoms.length / symptoms.length) * entry.confidence;
        results.push({
          entry,
          score,
          highlights: matchedSymptoms,
          matchedFields: ['symptoms']
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Busca por diagnóstico
   */
  async searchByDiagnosis(diagnosis: string, knowledgeBase: KnowledgeEntry[]): Promise<SearchResult[]> {
    const normalizedDiagnosis = this.normalizeText(diagnosis);
    const results: SearchResult[] = [];

    for (const entry of knowledgeBase) {
      if (entry.diagnosis) {
        const normalizedEntryDiagnosis = this.normalizeText(entry.diagnosis);
        const similarity = this.calculateSimilarity(normalizedDiagnosis, normalizedEntryDiagnosis);
        
        if (similarity > 0.6) {
          results.push({
            entry,
            score: similarity * entry.confidence,
            highlights: [entry.diagnosis],
            matchedFields: ['diagnosis']
          });
        }
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Busca por técnicas de tratamento
   */
  async searchByTechniques(technique: string, knowledgeBase: KnowledgeEntry[]): Promise<SearchResult[]> {
    const normalizedTechnique = this.normalizeText(technique);
    const results: SearchResult[] = [];

    for (const entry of knowledgeBase) {
      if (entry.techniques) {
        const matchedTechniques = entry.techniques.filter(entryTechnique => 
          this.fuzzyMatch(normalizedTechnique, this.normalizeText(entryTechnique), 0.7)
        );

        if (matchedTechniques.length > 0) {
          results.push({
            entry,
            score: (matchedTechniques.length / entry.techniques.length) * entry.confidence,
            highlights: matchedTechniques,
            matchedFields: ['techniques']
          });
        }
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Busca com correção automática (fuzzy search)
   */
  async fuzzySearch(query: string, knowledgeBase: KnowledgeEntry[], threshold = 0.6): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const normalizedQuery = this.normalizeText(query);

    for (const entry of knowledgeBase) {
      let maxScore = 0;
      const matchedFields: string[] = [];
      const highlights: string[] = [];

      // Buscar no título
      if (entry.title) {
        const similarity = this.calculateSimilarity(normalizedQuery, this.normalizeText(entry.title));
        if (similarity > threshold) {
          maxScore = Math.max(maxScore, similarity);
          matchedFields.push('title');
          highlights.push(entry.title);
        }
      }

      // Buscar no conteúdo
      if (entry.content) {
        const similarity = this.calculateSimilarity(normalizedQuery, this.normalizeText(entry.content));
        if (similarity > threshold * 0.8) { // Threshold menor para conteúdo
          maxScore = Math.max(maxScore, similarity * 0.9);
          matchedFields.push('content');
        }
      }

      // Buscar nas tags
      if (entry.tags) {
        const tagMatches = entry.tags.filter(tag => 
          this.calculateSimilarity(normalizedQuery, this.normalizeText(tag)) > threshold
        );
        if (tagMatches.length > 0) {
          maxScore = Math.max(maxScore, 0.8);
          matchedFields.push('tags');
          highlights.push(...tagMatches);
        }
      }

      if (maxScore > 0) {
        results.push({
          entry,
          score: maxScore * entry.confidence,
          highlights,
          matchedFields
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Normaliza query removendo acentos e caracteres especiais
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/g, ' ') // Remove pontuação
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normaliza texto para comparação
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extrai termos relevantes da query
   */
  private extractTerms(normalizedQuery: string): string[] {
    return normalizedQuery
      .split(' ')
      .filter(term => term.length > 2 && !this.stopWords.has(term))
      .filter((term, index, arr) => arr.indexOf(term) === index); // Remove duplicatas
  }

  /**
   * Calcula score de relevância para uma entrada
   */
  private calculateRelevanceScore(
    entry: KnowledgeEntry, 
    queryTerms: string[], 
    query: SearchQuery
  ): number {
    let score = 0;
    let matches = 0;

    const fields = [
      { text: entry.title, weight: 3.0 },
      { text: entry.content, weight: 1.0 },
      { text: entry.diagnosis, weight: 2.5 },
      { text: entry.symptoms?.join(' '), weight: 2.0 },
      { text: entry.techniques?.join(' '), weight: 1.8 },
      { text: entry.tags?.join(' '), weight: 1.5 }
    ];

    for (const field of fields) {
      if (!field.text) continue;

      const normalizedField = this.normalizeText(field.text);
      const fieldTerms = this.extractTerms(normalizedField);

      for (const queryTerm of queryTerms) {
        // Exact match
        if (fieldTerms.includes(queryTerm)) {
          score += field.weight * 1.0;
          matches++;
        }
        // Partial match
        else if (fieldTerms.some(fieldTerm => fieldTerm.includes(queryTerm) || queryTerm.includes(fieldTerm))) {
          score += field.weight * 0.7;
          matches++;
        }
        // Fuzzy match
        else {
          for (const fieldTerm of fieldTerms) {
            const similarity = this.calculateSimilarity(queryTerm, fieldTerm);
            if (similarity > 0.8) {
              score += field.weight * similarity * 0.5;
              matches++;
              break;
            }
          }
        }
      }
    }

    // Normalizar score
    const normalizedScore = score / (queryTerms.length * 10);
    
    // Aplicar fatores de boost
    let finalScore = normalizedScore * entry.confidence;

    // Boost por categoria relevante
    if (query.category && entry.category === query.category) {
      finalScore *= 1.3;
    }

    // Boost por especialidade relevante
    if (query.specialty && entry.specialty === query.specialty) {
      finalScore *= 1.2;
    }

    // Penalizar se poucos matches
    const matchRatio = matches / queryTerms.length;
    if (matchRatio < 0.3) {
      finalScore *= matchRatio;
    }

    return Math.min(finalScore, 1.0);
  }

  /**
   * Calcula similaridade entre duas strings usando algoritmo de Jaro-Winkler
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    const matchDistance = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
    const str1Matches = new Array(str1.length).fill(false);
    const str2Matches = new Array(str2.length).fill(false);
    
    let matches = 0;
    let transpositions = 0;

    // Find matches
    for (let i = 0; i < str1.length; i++) {
      const start = Math.max(0, i - matchDistance);
      const end = Math.min(i + matchDistance + 1, str2.length);

      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        str1Matches[i] = true;
        str2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0.0;

    // Find transpositions
    let k = 0;
    for (let i = 0; i < str1.length; i++) {
      if (!str1Matches[i]) continue;
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }

    const jaro = (matches / str1.length + matches / str2.length + (matches - transpositions / 2) / matches) / 3;
    
    // Jaro-Winkler prefix bonus
    let prefix = 0;
    for (let i = 0; i < Math.min(str1.length, str2.length, 4); i++) {
      if (str1[i] === str2[i]) prefix++;
      else break;
    }

    return jaro + 0.1 * prefix * (1 - jaro);
  }

  /**
   * Verifica match fuzzy entre duas strings
   */
  private fuzzyMatch(str1: string, str2: string, threshold: number): boolean {
    return this.calculateSimilarity(str1, str2) >= threshold;
  }

  /**
   * Gera highlights para os resultados
   */
  private generateHighlights(entry: KnowledgeEntry, queryTerms: string[]): string[] {
    const highlights: string[] = [];

    if (entry.title) {
      const titleHighlights = this.extractHighlights(entry.title, queryTerms);
      highlights.push(...titleHighlights);
    }

    if (entry.content) {
      const contentHighlights = this.extractHighlights(entry.content, queryTerms, 100);
      highlights.push(...contentHighlights);
    }

    return highlights.slice(0, 5); // Limite de highlights
  }

  /**
   * Extrai trechos relevantes com highlights
   */
  private extractHighlights(text: string, queryTerms: string[], maxLength = 50): string[] {
    const normalizedText = this.normalizeText(text);
    const highlights: string[] = [];

    for (const term of queryTerms) {
      const index = normalizedText.indexOf(term);
      if (index !== -1) {
        const start = Math.max(0, index - 20);
        const end = Math.min(text.length, index + term.length + 20);
        let highlight = text.substring(start, end);
        
        if (start > 0) highlight = '...' + highlight;
        if (end < text.length) highlight = highlight + '...';
        
        highlights.push(highlight);
      }
    }

    return highlights;
  }

  /**
   * Identifica campos que tiveram match
   */
  private getMatchedFields(entry: KnowledgeEntry, queryTerms: string[]): string[] {
    const matchedFields: string[] = [];
    const fields = ['title', 'content', 'diagnosis', 'symptoms', 'techniques', 'tags'];

    for (const field of fields) {
      const fieldValue = entry[field as keyof KnowledgeEntry];
      if (!fieldValue) continue;

      const fieldText = Array.isArray(fieldValue) ? fieldValue.join(' ') : String(fieldValue);
      const normalizedField = this.normalizeText(fieldText);

      for (const term of queryTerms) {
        if (normalizedField.includes(term)) {
          matchedFields.push(field);
          break;
        }
      }
    }

    return matchedFields;
  }
}

export const searchEngine = new SearchEngine();