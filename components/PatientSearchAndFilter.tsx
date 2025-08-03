import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  Users, 
  AlertCircle,
  Download,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Patient, SearchFilters } from '../types';

interface PatientSearchAndFilterProps {
  patients: Patient[];
  onFilteredResults: (filteredPatients: Patient[]) => void;
  onExport?: (filteredPatients: Patient[]) => void;
}

interface FilterState {
  searchQuery: string;
  status: string[];
  ageRange: [number, number];
  therapistId: string[];
  dateRange: {
    start: string;
    end: string;
  };
  conditions: string[];
  hasAlerts: boolean | null;
  gender: string[];
}

const PatientSearchAndFilter: React.FC<PatientSearchAndFilterProps> = ({
  patients,
  onFilteredResults,
  onExport
}) => {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    status: [],
    ageRange: [0, 100],
    therapistId: [],
    dateRange: { start: '', end: '' },
    conditions: [],
    hasAlerts: null,
    gender: []
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [showSavedFilters, setShowSavedFilters] = useState(false);
  const [savedFilters, setSavedFilters] = useState<Array<{name: string, filters: FilterState}>>([]);

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const therapists = Array.from(new Set(patients.map(p => p.therapistId).filter(Boolean)));
    const conditions = Array.from(new Set(patients.flatMap(p => p.conditions || [])));
    const statuses = Array.from(new Set(patients.map(p => p.status)));
    const genders = Array.from(new Set(patients.map(p => p.gender).filter(Boolean)));

    return {
      therapists,
      conditions,
      statuses,
      genders
    };
  }, [patients]);

  // Calculate age from birth date
  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Filter patients based on current filters
  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchFields = [
          patient.name,
          patient.cpf,
          patient.email,
          patient.phone,
          ...(patient.conditions || [])
        ].join(' ').toLowerCase();
        
        if (!searchFields.includes(query)) return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(patient.status)) {
        return false;
      }

      // Gender filter
      if (filters.gender.length > 0 && (!patient.gender || !filters.gender.includes(patient.gender))) {
        return false;
      }

      // Age range filter
      if (patient.birthDate) {
        const age = calculateAge(patient.birthDate);
        if (age < filters.ageRange[0] || age > filters.ageRange[1]) {
          return false;
        }
      }

      // Therapist filter
      if (filters.therapistId.length > 0 && (!patient.therapistId || !filters.therapistId.includes(patient.therapistId))) {
        return false;
      }

      // Date range filter (registration date)
      if (filters.dateRange.start && patient.registrationDate) {
        const regDate = new Date(patient.registrationDate);
        const startDate = new Date(filters.dateRange.start);
        if (regDate < startDate) return false;
      }
      
      if (filters.dateRange.end && patient.registrationDate) {
        const regDate = new Date(patient.registrationDate);
        const endDate = new Date(filters.dateRange.end);
        if (regDate > endDate) return false;
      }

      // Conditions filter
      if (filters.conditions.length > 0) {
        const patientConditions = patient.conditions || [];
        const hasMatchingCondition = filters.conditions.some(condition => 
          patientConditions.includes(condition)
        );
        if (!hasMatchingCondition) return false;
      }

      // Has alerts filter
      if (filters.hasAlerts !== null) {
        const hasAlerts = Boolean(patient.medicalAlerts && patient.medicalAlerts.trim());
        if (hasAlerts !== filters.hasAlerts) return false;
      }

      return true;
    });
  }, [patients, filters]);

  // Update filtered results when they change
  useEffect(() => {
    onFilteredResults(filteredPatients);
  }, [filteredPatients, onFilteredResults]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: 'status' | 'therapistId' | 'conditions' | 'gender', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      searchQuery: '',
      status: [],
      ageRange: [0, 100],
      therapistId: [],
      dateRange: { start: '', end: '' },
      conditions: [],
      hasAlerts: null,
      gender: []
    });
  };

  const saveCurrentFilter = () => {
    const name = prompt('Nome para este filtro:');
    if (name) {
      setSavedFilters(prev => [...prev, { name, filters: { ...filters } }]);
    }
  };

  const loadSavedFilter = (savedFilter: {name: string, filters: FilterState}) => {
    setFilters(savedFilter.filters);
    setShowSavedFilters(false);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.status.length > 0) count++;
    if (filters.gender.length > 0) count++;
    if (filters.ageRange[0] > 0 || filters.ageRange[1] < 100) count++;
    if (filters.therapistId.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.conditions.length > 0) count++;
    if (filters.hasAlerts !== null) count++;
    return count;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Search size={20} className="text-gray-500" />
          <h3 className="text-lg font-semibold">Busca e Filtros</h3>
          {getActiveFilterCount() > 0 && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
              {getActiveFilterCount()} filtros ativos
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {onExport && (
            <button
              onClick={() => onExport(filteredPatients)}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              <Download size={16} />
              <span>Exportar ({filteredPatients.length})</span>
            </button>
          )}
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Filter size={16} />
            <span>{isExpanded ? 'Ocultar' : 'Expandir'}</span>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por nome, CPF, email, telefone ou condições..."
          value={filters.searchQuery}
          onChange={(e) => updateFilter('searchQuery', e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Results Counter */}
      <div className="text-sm text-gray-600 mb-4">
        Mostrando {filteredPatients.length} de {patients.length} pacientes
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-4 border-t pt-4">
          {/* Quick Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={saveCurrentFilter}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Salvar Filtro
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setShowSavedFilters(!showSavedFilters)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Filtros Salvos ({savedFilters.length})
              </button>
            </div>
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"
            >
              <X size={16} />
              <span>Limpar Tudo</span>
            </button>
          </div>

          {/* Saved Filters */}
          {showSavedFilters && savedFilters.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex flex-wrap gap-2">
                {savedFilters.map((saved, index) => (
                  <button
                    key={index}
                    onClick={() => loadSavedFilter(saved)}
                    className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-100"
                  >
                    {saved.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="space-y-1">
                {filterOptions.statuses.map(status => (
                  <label key={status} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={() => toggleArrayFilter('status', status)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Gender Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
              <div className="space-y-1">
                {filterOptions.genders.map(gender => (
                  <label key={gender} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.gender.includes(gender)}
                      onChange={() => toggleArrayFilter('gender', gender)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{gender}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Age Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Faixa Etária ({filters.ageRange[0]} - {filters.ageRange[1]} anos)
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.ageRange[0]}
                  onChange={(e) => updateFilter('ageRange', [parseInt(e.target.value), filters.ageRange[1]])}
                  className="w-full"
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.ageRange[1]}
                  onChange={(e) => updateFilter('ageRange', [filters.ageRange[0], parseInt(e.target.value)])}
                  className="w-full"
                />
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Cadastro</label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, start: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Data inicial"
                />
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, end: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  placeholder="Data final"
                />
              </div>
            </div>

            {/* Conditions Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condições</label>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {filterOptions.conditions.map(condition => (
                  <label key={condition} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.conditions.includes(condition)}
                      onChange={() => toggleArrayFilter('conditions', condition)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{condition}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Alerts Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alertas Médicos</label>
              <div className="space-y-1">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="hasAlerts"
                    checked={filters.hasAlerts === true}
                    onChange={() => updateFilter('hasAlerts', true)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Com alertas</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="hasAlerts"
                    checked={filters.hasAlerts === false}
                    onChange={() => updateFilter('hasAlerts', false)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Sem alertas</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="hasAlerts"
                    checked={filters.hasAlerts === null}
                    onChange={() => updateFilter('hasAlerts', null)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Todos</span>
                </label>
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {getActiveFilterCount() > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-800 font-medium mb-2">Filtros Ativos:</div>
              <div className="flex flex-wrap gap-2">
                {filters.searchQuery && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Busca: "{filters.searchQuery}"
                  </span>
                )}
                {filters.status.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Status: {filters.status.join(', ')}
                  </span>
                )}
                {filters.gender.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Gênero: {filters.gender.join(', ')}
                  </span>
                )}
                {(filters.ageRange[0] > 0 || filters.ageRange[1] < 100) && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Idade: {filters.ageRange[0]}-{filters.ageRange[1]} anos
                  </span>
                )}
                {filters.conditions.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    Condições: {filters.conditions.length} selecionada(s)
                  </span>
                )}
                {filters.hasAlerts !== null && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {filters.hasAlerts ? 'Com alertas' : 'Sem alertas'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientSearchAndFilter;