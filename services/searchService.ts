import { Patient } from '../types';

export interface SearchFilters {
  text: string;
  status: string[];
  ageRange: [number, number];
  registrationDateRange: [Date | null, Date | null];
  lastVisitRange: [Date | null, Date | null];
  therapistIds: string[];
  hasConditions: string[];
  hasSurgeries: boolean | null;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: Date;
  userId: string;
}

export interface SearchResult {
  patients: Patient[];
  totalCount: number;
  facets: SearchFacets;
}

export interface SearchFacets {
  statuses: { value: string; count: number }[];
  therapists: { id: string; name: string; count: number }[];
  conditions: { value: string; count: number }[];
  ageGroups: { range: string; count: number }[];
}

export interface SearchSuggestion {
  type: 'patient' | 'condition' | 'therapist';
  value: string;
  label: string;
  score: number;
}

class SearchService {
  private searchIndex: Map<string, string> = new Map();
  private savedSearches: SavedSearch[] = [];

  constructor() {
    this.loadSavedSearches();
  }

  async searchPatients(
    filters: Partial<SearchFilters>,
    page: number = 1,
    pageSize: number = 50
  ): Promise<SearchResult> {
    // In a real implementation, this would query a search engine like Elasticsearch
    // For now, we'll implement client-side filtering
    
    const { getPatients } = await import('./patientService');
    const allPatients = await getPatients();
    
    let filteredPatients = allPatients;

    // Apply text search
    if (filters.text) {
      const searchText = filters.text.toLowerCase();
      filteredPatients = filteredPatients.filter(patient => 
        patient.name.toLowerCase().includes(searchText) ||
        patient.cpf.includes(searchText) ||
        patient.email?.toLowerCase().includes(searchText) ||
        patient.phone?.includes(searchText) ||
        patient.conditions?.some(condition => 
          condition.toLowerCase().includes(searchText)
        )
      );
    }

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      filteredPatients = filteredPatients.filter(patient =>
        filters.status!.includes(patient.status)
      );
    }

    // Apply age range filter
    if (filters.ageRange) {
      const [minAge, maxAge] = filters.ageRange;
      filteredPatients = filteredPatients.filter(patient => {
        const age = this.calculateAge(patient.birthDate);
        return age >= minAge && age <= maxAge;
      });
    }

    // Apply registration date range filter
    if (filters.registrationDateRange && 
        (filters.registrationDateRange[0] || filters.registrationDateRange[1])) {
      filteredPatients = filteredPatients.filter(patient => {
        const registrationDate = new Date(patient.registrationDate || patient.lastVisit);
        const [startDate, endDate] = filters.registrationDateRange!;
        
        if (startDate && registrationDate < startDate) return false;
        if (endDate && registrationDate > endDate) return false;
        return true;
      });
    }

    // Apply last visit range filter
    if (filters.lastVisitRange && 
        (filters.lastVisitRange[0] || filters.lastVisitRange[1])) {
      filteredPatients = filteredPatients.filter(patient => {
        const lastVisit = new Date(patient.lastVisit);
        const [startDate, endDate] = filters.lastVisitRange!;
        
        if (startDate && lastVisit < startDate) return false;
        if (endDate && lastVisit > endDate) return false;
        return true;
      });
    }

    // Apply therapist filter
    if (filters.therapistIds && filters.therapistIds.length > 0) {
      filteredPatients = filteredPatients.filter(patient =>
        filters.therapistIds!.includes(patient.therapistId || '')
      );
    }

    // Apply conditions filter
    if (filters.hasConditions && filters.hasConditions.length > 0) {
      filteredPatients = filteredPatients.filter(patient =>
        patient.conditions?.some(condition =>
          filters.hasConditions!.some(filterCondition =>
            condition.toLowerCase().includes(filterCondition.toLowerCase())
          )
        )
      );
    }

    // Apply surgeries filter
    if (filters.hasSurgeries !== null && filters.hasSurgeries !== undefined) {
      filteredPatients = filteredPatients.filter(patient => {
        const hasSurgeries = patient.surgeries && patient.surgeries.length > 0;
        return hasSurgeries === filters.hasSurgeries;
      });
    }

    // Calculate facets
    const facets = this.calculateFacets(allPatients);

    // Pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedPatients = filteredPatients.slice(startIndex, startIndex + pageSize);

    return {
      patients: paginatedPatients,
      totalCount: filteredPatients.length,
      facets
    };
  }

  async getSuggestions(query: string, limit: number = 10): Promise<SearchSuggestion[]> {
    if (!query || query.length < 2) return [];

    const { getPatients } = await import('./patientService');
    const allPatients = await getPatients();
    
    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();

    // Patient name suggestions
    allPatients.forEach(patient => {
      if (patient.name.toLowerCase().includes(queryLower)) {
        suggestions.push({
          type: 'patient',
          value: patient.name,
          label: `${patient.name} - ${patient.cpf}`,
          score: this.calculateSuggestionScore(patient.name, query)
        });
      }
    });

    // Condition suggestions
    const conditions = new Set<string>();
    allPatients.forEach(patient => {
      patient.conditions?.forEach(condition => {
        if (condition.toLowerCase().includes(queryLower)) {
          conditions.add(condition);
        }
      });
    });

    conditions.forEach(condition => {
      suggestions.push({
        type: 'condition',
        value: condition,
        label: `Condição: ${condition}`,
        score: this.calculateSuggestionScore(condition, query)
      });
    });

    // Sort by score and limit
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async saveSearch(search: Omit<SavedSearch, 'id' | 'createdAt'>): Promise<SavedSearch> {
    const newSearch: SavedSearch = {
      ...search,
      id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };

    this.savedSearches.push(newSearch);
    this.persistSavedSearches();
    
    return newSearch;
  }

  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    return this.savedSearches.filter(search => search.userId === userId);
  }

  async deleteSavedSearch(searchId: string): Promise<void> {
    this.savedSearches = this.savedSearches.filter(search => search.id !== searchId);
    this.persistSavedSearches();
  }

  async buildSearchIndex(patients: Patient[]): Promise<void> {
    // Build search index for faster text searching
    this.searchIndex.clear();
    
    patients.forEach(patient => {
      const searchableText = [
        patient.name,
        patient.cpf,
        patient.email || '',
        patient.phone || '',
        ...(patient.conditions || []),
        ...(patient.surgeries || [])
      ].join(' ').toLowerCase();
      
      this.searchIndex.set(patient.id, searchableText);
    });
  }

  private calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  private calculateFacets(patients: Patient[]): SearchFacets {
    const statusCounts = new Map<string, number>();
    const therapistCounts = new Map<string, { name: string; count: number }>();
    const conditionCounts = new Map<string, number>();
    const ageGroupCounts = new Map<string, number>();

    patients.forEach(patient => {
      // Status facets
      statusCounts.set(patient.status, (statusCounts.get(patient.status) || 0) + 1);

      // Therapist facets
      if (patient.therapistId) {
        const current = therapistCounts.get(patient.therapistId) || { name: 'Terapeuta', count: 0 };
        therapistCounts.set(patient.therapistId, { ...current, count: current.count + 1 });
      }

      // Condition facets
      patient.conditions?.forEach(condition => {
        conditionCounts.set(condition, (conditionCounts.get(condition) || 0) + 1);
      });

      // Age group facets
      const age = this.calculateAge(patient.birthDate);
      const ageGroup = this.getAgeGroup(age);
      ageGroupCounts.set(ageGroup, (ageGroupCounts.get(ageGroup) || 0) + 1);
    });

    return {
      statuses: Array.from(statusCounts.entries()).map(([value, count]) => ({ value, count })),
      therapists: Array.from(therapistCounts.entries()).map(([id, data]) => ({ id, name: data.name, count: data.count })),
      conditions: Array.from(conditionCounts.entries()).map(([value, count]) => ({ value, count })),
      ageGroups: Array.from(ageGroupCounts.entries()).map(([range, count]) => ({ range, count }))
    };
  }

  private getAgeGroup(age: number): string {
    if (age < 18) return '0-17';
    if (age < 30) return '18-29';
    if (age < 45) return '30-44';
    if (age < 60) return '45-59';
    if (age < 75) return '60-74';
    return '75+';
  }

  private calculateSuggestionScore(text: string, query: string): number {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    if (textLower === queryLower) return 100;
    if (textLower.startsWith(queryLower)) return 90;
    if (textLower.includes(queryLower)) return 70;
    
    // Calculate similarity based on character overlap
    const similarity = this.calculateStringSimilarity(textLower, queryLower);
    return Math.floor(similarity * 50);
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private loadSavedSearches(): void {
    try {
      const saved = localStorage.getItem('fisioflow_saved_searches');
      if (saved) {
        this.savedSearches = JSON.parse(saved).map((search: any) => ({
          ...search,
          createdAt: new Date(search.createdAt),
          filters: {
            ...search.filters,
            registrationDateRange: search.filters.registrationDateRange?.map((date: string | null) => 
              date ? new Date(date) : null
            ),
            lastVisitRange: search.filters.lastVisitRange?.map((date: string | null) => 
              date ? new Date(date) : null
            )
          }
        }));
      }
    } catch (error) {
      console.warn('Error loading saved searches:', error);
      this.savedSearches = [];
    }
  }

  private persistSavedSearches(): void {
    try {
      localStorage.setItem('fisioflow_saved_searches', JSON.stringify(this.savedSearches));
    } catch (error) {
      console.warn('Error saving searches:', error);
    }
  }
}

export const searchService = new SearchService();