import { useState, useCallback, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  User, 
  Activity, 
  Tag, 
  Save, 
  Trash2,
  Download,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAdvancedSearch } from '../../hooks/useAdvancedSearch';
import { SearchFilters, SearchSuggestion, SavedSearch } from '../../types';

interface AdvancedSearchPanelProps {
  onSearchResults?: (results: any) => void;
  onError?: (error: string) => void;
  userId?: string;
  className?: string;
}

export const AdvancedSearchPanel: React.FC<AdvancedSearchPanelProps> = ({
  onSearchResults,
  onError,
  userId,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const {
    filters,
    results,
    suggestions,
    loading,
    error,
    savedSearches,
    updateFilters,
    clearFilters,
    search,
    getSuggestions,
    clearSuggestions,
    saveCurrentSearch,
    loadSavedSearch,
    deleteSavedSearch,
    exportResults,
    applyFacetFilter,
    removeFacetFilter
  } = useAdvancedSearch({
    userId,
    autoSearch: true,
    pageSize: 20
  });

  // Notify parent of results changes
  useEffect(() => {
    if (results && onSearchResults) {
      onSearchResults(results);
    }
  }, [results, onSearchResults]);

  // Notify parent of errors
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleTextSearch = useCallback((value: string) => {
    updateFilters({ text: value });
    if (value.length >= 2) {
      getSuggestions(value);
      setShowSuggestions(true);
    } else {
      clearSuggestions();
      setShowSuggestions(false);
    }
  }, [updateFilters, getSuggestions, clearSuggestions]);

  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    updateFilters({ text: suggestion.value });
    setShowSuggestions(false);
    clearSuggestions();
  }, [updateFilters, clearSuggestions]);

  const handleStatusChange = useCallback((status: string, checked: boolean) => {
    const currentStatuses = filters.status || [];
    const newStatuses = checked 
      ? [...currentStatuses, status]
      : currentStatuses.filter(s => s !== status);
    updateFilters({ status: newStatuses });
  }, [filters.status, updateFilters]);

  const handleAgeRangeChange = useCallback((min: number, max: number) => {
    updateFilters({ ageRange: [min, max] });
  }, [updateFilters]);

  const handleDateRangeChange = useCallback((
    type: 'registration' | 'lastVisit',
    startDate: string | null,
    endDate: string | null
  ) => {
    const dateRange: [Date | null, Date | null] = [
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    ];
    
    if (type === 'registration') {
      updateFilters({ registrationDateRange: dateRange });
    } else {
      updateFilters({ lastVisitRange: dateRange });
    }
  }, [updateFilters]);

  const handleSaveSearch = useCallback(async () => {
    if (!saveSearchName.trim()) return;
    
    try {
      await saveCurrentSearch(saveSearchName.trim());
      setSaveSearchName('');
      setShowSaveDialog(false);
    } catch (err) {
      console.error('Error saving search:', err);
    }
  }, [saveCurrentSearch, saveSearchName]);

  const handleExport = useCallback(async (format: 'csv' | 'xlsx' | 'pdf') => {
    try {
      await exportResults(format);
    } catch (err) {
      console.error('Error exporting results:', err);
    }
  }, [exportResults]);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;
    if (filters.text) count++;
    if (filters.status && filters.status.length > 0) count++;
    if (filters.ageRange && (filters.ageRange[0] > 0 || filters.ageRange[1] < 100)) count++;
    if (filters.registrationDateRange && (filters.registrationDateRange[0] || filters.registrationDateRange[1])) count++;
    if (filters.lastVisitRange && (filters.lastVisitRange[0] || filters.lastVisitRange[1])) count++;
    if (filters.therapistIds && filters.therapistIds.length > 0) count++;
    if (filters.hasConditions && filters.hasConditions.length > 0) count++;
    if (filters.hasSurgeries !== null) count++;
    return count;
  }, [filters]);

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Search Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-4">
          {/* Main Search Input */}
          <div className="flex-1 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar pacientes por nome, CPF, email ou telefone..."
                value={filters.text || ''}
                onChange={(e) => handleTextSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span className="text-xs text-gray-500 capitalize">
                      {suggestion.type}:
                    </span>
                    <span>{suggestion.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
            {activeFiltersCount > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {activeFiltersCount}
              </span>
            )}
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-red-600"
              title="Limpar filtros"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Save Search */}
            <button
              onClick={() => setShowSaveDialog(true)}
              className="p-2 text-gray-600 hover:text-blue-600"
              title="Salvar busca"
            >
              <Save className="w-4 h-4" />
            </button>

            {/* Export */}
            {results && results.patients.length > 0 && (
              <div className="relative group">
                <button className="p-2 text-gray-600 hover:text-green-600" title="Exportar">
                  <Download className="w-4 h-4" />
                </button>
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <button
                    onClick={() => handleExport('csv')}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-50"
                  >
                    Exportar CSV
                  </button>
                  <button
                    onClick={() => handleExport('xlsx')}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-50"
                  >
                    Exportar Excel
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-50"
                  >
                    Exportar PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Saved Searches Quick Access */}
        {savedSearches.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">Buscas salvas:</span>
            {savedSearches.slice(0, 5).map((savedSearch) => (
              <button
                key={savedSearch.id}
                onClick={() => loadSavedSearch(savedSearch)}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700"
              >
                {savedSearch.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="p-4 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Activity className="inline w-4 h-4 mr-1" />
                Status
              </label>
              <div className="space-y-2">
                {['Ativo', 'Inativo', 'Alta'].map((status) => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.status?.includes(status) || false}
                      onChange={(e) => handleStatusChange(status, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Age Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                Faixa Etária
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  min="0"
                  max="120"
                  value={filters.ageRange?.[0] || ''}
                  onChange={(e) => handleAgeRangeChange(
                    parseInt(e.target.value) || 0,
                    filters.ageRange?.[1] || 100
                  )}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  min="0"
                  max="120"
                  value={filters.ageRange?.[1] || ''}
                  onChange={(e) => handleAgeRangeChange(
                    filters.ageRange?.[0] || 0,
                    parseInt(e.target.value) || 100
                  )}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>

            {/* Registration Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Data de Cadastro
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filters.registrationDateRange?.[0]?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleDateRangeChange(
                    'registration',
                    e.target.value,
                    filters.registrationDateRange?.[1]?.toISOString().split('T')[0] || null
                  )}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="date"
                  value={filters.registrationDateRange?.[1]?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleDateRangeChange(
                    'registration',
                    filters.registrationDateRange?.[0]?.toISOString().split('T')[0] || null,
                    e.target.value
                  )}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>

            {/* Last Visit Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Última Consulta
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filters.lastVisitRange?.[0]?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleDateRangeChange(
                    'lastVisit',
                    e.target.value,
                    filters.lastVisitRange?.[1]?.toISOString().split('T')[0] || null
                  )}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="date"
                  value={filters.lastVisitRange?.[1]?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleDateRangeChange(
                    'lastVisit',
                    filters.lastVisitRange?.[0]?.toISOString().split('T')[0] || null,
                    e.target.value
                  )}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>

            {/* Conditions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="inline w-4 h-4 mr-1" />
                Condições
              </label>
              <input
                type="text"
                placeholder="Digite condições..."
                value={filters.hasConditions?.join(', ') || ''}
                onChange={(e) => updateFilters({ 
                  hasConditions: e.target.value.split(',').map(c => c.trim()).filter(c => c) 
                })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>

            {/* Surgeries */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cirurgias
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="surgeries"
                    checked={filters.hasSurgeries === true}
                    onChange={() => updateFilters({ hasSurgeries: true })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Com cirurgias</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="surgeries"
                    checked={filters.hasSurgeries === false}
                    onChange={() => updateFilters({ hasSurgeries: false })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Sem cirurgias</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="surgeries"
                    checked={filters.hasSurgeries === null}
                    onChange={() => updateFilters({ hasSurgeries: null })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Qualquer</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="p-4 bg-blue-50 border-b">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-blue-700 font-medium">Filtros ativos:</span>
            
            {filters.text && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Texto: "{filters.text}"
                <button
                  onClick={() => updateFilters({ text: '' })}
                  className="hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.status?.map((status) => (
              <span key={status} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Status: {status}
                <button
                  onClick={() => removeFacetFilter('status', status)}
                  className="hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            
            {filters.hasConditions?.map((condition) => (
              <span key={condition} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Condição: {condition}
                <button
                  onClick={() => removeFacetFilter('condition', condition)}
                  className="hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Results Summary */}
      {results && (
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {loading ? 'Buscando...' : `${results.totalCount} pacientes encontrados`}
            </span>
            {loading && (
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            )}
          </div>
        </div>
      )}

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Salvar Busca</h3>
            <input
              type="text"
              placeholder="Nome da busca..."
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSearch}
                disabled={!saveSearchName.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Searches Management */}
      {savedSearches.length > 0 && isExpanded && (
        <div className="p-4 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Buscas Salvas</h4>
          <div className="space-y-2">
            {savedSearches.map((savedSearch) => (
              <div key={savedSearch.id} className="flex items-center justify-between p-2 bg-white rounded border">
                <button
                  onClick={() => loadSavedSearch(savedSearch)}
                  className="flex-1 text-left text-sm hover:text-blue-600"
                >
                  {savedSearch.name}
                </button>
                <span className="text-xs text-gray-500">
                  {savedSearch.createdAt.toLocaleDateString()}
                </span>
                <button
                  onClick={() => deleteSavedSearch(savedSearch.id)}
                  className="ml-2 p-1 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};