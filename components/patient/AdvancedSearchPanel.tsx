
import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

interface AdvancedSearchPanelProps {
  onSearchResults?: (results: any) => void;
  onError?: (error: string) => void;
  userId?: string;
  className?: string;
}

const AdvancedSearchPanel: React.FC<AdvancedSearchPanelProps> = ({ 
  onSearchResults, 
  onError, 
  userId, 
  className = '' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [therapistId, setTherapistId] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearch = async () => {
    try {
      // Placeholder search logic - would integrate with searchService
      const filters = {
        text: searchTerm,
        status: status ? [status] : [],
        dateRange: dateRange.start && dateRange.end ? dateRange : undefined,
        therapistIds: therapistId ? [therapistId] : []
      };
      
      // Mock search results
      const results = {
        patients: [],
        totalCount: 0,
        facets: {}
      };
      
      onSearchResults?.(results);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Erro na busca');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatus('');
    setDateRange({ start: '', end: '' });
    setTherapistId('');
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 mb-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Busca Avançada</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
        >
          <Filter size={16} />
          <span>{isExpanded ? 'Ocultar' : 'Expandir'}</span>
        </button>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou prontuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Search size={16} />
          <span>Buscar</span>
        </button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os status</option>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
              <option value="Alta">Alta</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Terapeuta</label>
            <select
              value={therapistId}
              onChange={(e) => setTherapistId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os terapeutas</option>
              <option value="1">Dr. João Silva</option>
              <option value="2">Dra. Maria Santos</option>
              <option value="3">Dr. Pedro Oliveira</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2"
            >
              <X size={16} />
              <span>Limpar Filtros</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchPanel;
