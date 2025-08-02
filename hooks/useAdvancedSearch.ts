import { useState, useCallback, useEffect, useMemo } from 'react';
import { useDebounce } from './useDebounce';
import { searchService } from '../services/searchService';
import { 
  SearchFilters, 
  SearchResult, 
  SearchSuggestion, 
  SavedSearch,
  Patient 
} from '../types';

export interface UseAdvancedSearchOptions {
  pageSize?: number;
  debounceMs?: number;
  autoSearch?: boolean;
  userId?: string;
}

export interface UseAdvancedSearchReturn {
  // Search state
  filters: Partial<SearchFilters>;
  results: SearchResult | null;
  suggestions: SearchSuggestion[];
  loading: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  
  // Saved searches
  savedSearches: SavedSearch[];
  
  // Actions
  updateFilters: (newFilters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  search: () => Promise<void>;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  
  // Suggestions
  getSuggestions: (query: string) => Promise<void>;
  clearSuggestions: () => void;
  
  // Saved searches
  saveCurrentSearch: (name: string) => Promise<void>;
  loadSavedSearch: (search: SavedSearch) => void;
  deleteSavedSearch: (searchId: string) => Promise<void>;
  
  // Export
  exportResults: (format: 'csv' | 'xlsx' | 'pdf') => Promise<void>;
  
  // Facets
  applyFacetFilter: (facetType: string, value: string) => void;
  removeFacetFilter: (facetType: string, value: string) => void;
}

const defaultFilters: Partial<SearchFilters> = {
  text: '',
  status: [],
  ageRange: [0, 100],
  registrationDateRange: [null, null],
  lastVisitRange: [null, null],
  therapistIds: [],
  hasConditions: [],
  hasSurgeries: null,
  tags: [],
  customFilters: {}
};

export const useAdvancedSearch = (options: UseAdvancedSearchOptions = {}): UseAdvancedSearchReturn => {
  const {
    pageSize = 20,
    debounceMs = 300,
    autoSearch = true,
    userId
  } = options;

  // State
  const [filters, setFilters] = useState<Partial<SearchFilters>>(defaultFilters);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // Debounced search text for auto-search
  const debouncedSearchText = useDebounce(filters.text || '', debounceMs);

  // Computed values
  const totalPages = useMemo(() => {
    if (!results) return 0;
    return Math.ceil(results.totalCount / pageSize);
  }, [results, pageSize]);

  const hasNextPage = useMemo(() => currentPage < totalPages, [currentPage, totalPages]);
  const hasPreviousPage = useMemo(() => currentPage > 1, [currentPage]);

  // Load saved searches on mount
  useEffect(() => {
    if (userId) {
      loadSavedSearches();
    }
  }, [userId]);

  // Auto-search when debounced text changes
  useEffect(() => {
    if (autoSearch && debouncedSearchText !== undefined) {
      search();
    }
  }, [debouncedSearchText, autoSearch]);

  // Auto-search when non-text filters change
  useEffect(() => {
    if (autoSearch) {
      const { text, ...otherFilters } = filters;
      const hasOtherFilters = Object.values(otherFilters).some(value => {
        if (Array.isArray(value)) return value.length > 0;
        if (value === null || value === undefined) return false;
        if (typeof value === 'object') return Object.keys(value).length > 0;
        return true;
      });
      
      if (hasOtherFilters) {
        search();
      }
    }
  }, [filters.status, filters.ageRange, filters.therapistIds, filters.hasConditions, filters.hasSurgeries, autoSearch]);

  const loadSavedSearches = useCallback(async () => {
    if (!userId) return;
    
    try {
      const searches = await searchService.getSavedSearches(userId);
      setSavedSearches(searches);
    } catch (err) {
      console.error('Error loading saved searches:', err);
    }
  }, [userId]);

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const searchResult = await searchService.searchPatients(
        filters,
        currentPage,
        pageSize
      );
      
      setResults(searchResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao realizar busca';
      setError(errorMessage);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, pageSize]);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setCurrentPage(1);
    setResults(null);
    setSuggestions([]);
    setError(null);
  }, []);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPreviousPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const getSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const suggestionResults = await searchService.getSuggestions(query, 10);
      setSuggestions(suggestionResults);
    } catch (err) {
      console.error('Error getting suggestions:', err);
      setSuggestions([]);
    }
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  const saveCurrentSearch = useCallback(async (name: string) => {
    if (!userId) {
      throw new Error('Usuário não identificado para salvar busca');
    }

    try {
      const savedSearch = await searchService.saveSearch({
        name,
        filters: filters as SearchFilters,
        userId
      });
      
      setSavedSearches(prev => [...prev, savedSearch]);
      return savedSearch;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar busca';
      throw new Error(errorMessage);
    }
  }, [filters, userId]);

  const loadSavedSearch = useCallback((search: SavedSearch) => {
    setFilters(search.filters);
    setCurrentPage(1);
  }, []);

  const deleteSavedSearch = useCallback(async (searchId: string) => {
    try {
      await searchService.deleteSavedSearch(searchId);
      setSavedSearches(prev => prev.filter(search => search.id !== searchId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar busca salva';
      throw new Error(errorMessage);
    }
  }, []);

  const exportResults = useCallback(async (format: 'csv' | 'xlsx' | 'pdf') => {
    if (!results || results.patients.length === 0) {
      throw new Error('Nenhum resultado para exportar');
    }

    try {
      // In a real implementation, this would call an export service
      const data = results.patients;
      const filename = `pacientes_${new Date().toISOString().split('T')[0]}.${format}`;
      
      if (format === 'csv') {
        exportToCSV(data, filename);
      } else {
        // For xlsx and pdf, you would use appropriate libraries
        console.log(`Exporting ${data.length} patients to ${format}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao exportar resultados';
      throw new Error(errorMessage);
    }
  }, [results]);

  const applyFacetFilter = useCallback((facetType: string, value: string) => {
    const newFilters = { ...filters };
    
    switch (facetType) {
      case 'status':
        if (!newFilters.status) newFilters.status = [];
        if (!newFilters.status.includes(value)) {
          newFilters.status.push(value);
        }
        break;
      case 'therapist':
        if (!newFilters.therapistIds) newFilters.therapistIds = [];
        if (!newFilters.therapistIds.includes(value)) {
          newFilters.therapistIds.push(value);
        }
        break;
      case 'condition':
        if (!newFilters.hasConditions) newFilters.hasConditions = [];
        if (!newFilters.hasConditions.includes(value)) {
          newFilters.hasConditions.push(value);
        }
        break;
      case 'tag':
        if (!newFilters.tags) newFilters.tags = [];
        if (!newFilters.tags.includes(value)) {
          newFilters.tags.push(value);
        }
        break;
    }
    
    setFilters(newFilters);
    setCurrentPage(1);
  }, [filters]);

  const removeFacetFilter = useCallback((facetType: string, value: string) => {
    const newFilters = { ...filters };
    
    switch (facetType) {
      case 'status':
        if (newFilters.status) {
          newFilters.status = newFilters.status.filter(s => s !== value);
        }
        break;
      case 'therapist':
        if (newFilters.therapistIds) {
          newFilters.therapistIds = newFilters.therapistIds.filter(id => id !== value);
        }
        break;
      case 'condition':
        if (newFilters.hasConditions) {
          newFilters.hasConditions = newFilters.hasConditions.filter(c => c !== value);
        }
        break;
      case 'tag':
        if (newFilters.tags) {
          newFilters.tags = newFilters.tags.filter(t => t !== value);
        }
        break;
    }
    
    setFilters(newFilters);
    setCurrentPage(1);
  }, [filters]);

  // Trigger search when page changes
  useEffect(() => {
    if (results && currentPage > 1) {
      search();
    }
  }, [currentPage]);

  return {
    // Search state
    filters,
    results,
    suggestions,
    loading,
    error,
    
    // Pagination
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    
    // Saved searches
    savedSearches,
    
    // Actions
    updateFilters,
    clearFilters,
    search,
    nextPage,
    previousPage,
    goToPage,
    
    // Suggestions
    getSuggestions,
    clearSuggestions,
    
    // Saved searches
    saveCurrentSearch,
    loadSavedSearch,
    deleteSavedSearch,
    
    // Export
    exportResults,
    
    // Facets
    applyFacetFilter,
    removeFacetFilter
  };
};

// Helper function to export data to CSV
const exportToCSV = (data: Patient[], filename: string) => {
  const headers = [
    'Nome',
    'CPF',
    'Email',
    'Telefone',
    'Status',
    'Data de Nascimento',
    'Última Consulta',
    'Condições'
  ];
  
  const csvContent = [
    headers.join(','),
    ...data.map(patient => [
      `"${patient.name}"`,
      `"${patient.cpf}"`,
      `"${patient.email || ''}"`,
      `"${patient.phone || ''}"`,
      `"${patient.status}"`,
      `"${patient.birthDate}"`,
      `"${patient.lastVisit}"`,
      `"${patient.conditions?.join('; ') || ''}"`
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};