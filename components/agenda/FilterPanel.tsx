import { useState, useEffect } from 'react';
import { Search, Filter, X, User, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { AppointmentType, AppointmentStatus, Therapist } from '@/types';

export interface FilterOptions {
  search: string;
  therapistIds: string[];
  types: AppointmentType[];
  statuses: AppointmentStatus[];
  dateRange: {
    start: string;
    end: string;
  };
}

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  therapists: Therapist[];
  onClearFilters: () => void;
  className?: string;
}

const FilterPanel = ({
  filters,
  onFiltersChange,
  therapists,
  onClearFilters,
  className = ''
}: FilterPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchTerm });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleTherapistToggle = (therapistId: string) => {
    const newTherapistIds = filters.therapistIds.includes(therapistId)
      ? filters.therapistIds.filter(id => id !== therapistId)
      : [...filters.therapistIds, therapistId];
    
    onFiltersChange({ ...filters, therapistIds: newTherapistIds });
  };

  const handleTypeToggle = (type: AppointmentType) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    
    onFiltersChange({ ...filters, types: newTypes });
  };

  const handleStatusToggle = (status: AppointmentStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    
    onFiltersChange({ ...filters, statuses: newStatuses });
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value
      }
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.therapistIds.length > 0) count++;
    if (filters.types.length > 0) count++;
    if (filters.statuses.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  const getTypeIcon = (type: AppointmentType) => {
    switch (type) {
      case AppointmentType.Evaluation: return <User className="w-4 h-4" />;
      case AppointmentType.Session: return <Clock className="w-4 h-4" />;
      case AppointmentType.Return: return <Calendar className="w-4 h-4" />;
      case AppointmentType.Group: return <User className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.Scheduled: return <Clock className="w-4 h-4" />;
      case AppointmentStatus.Confirmed: return <CheckCircle className="w-4 h-4" />;
      case AppointmentStatus.Completed: return <CheckCircle className="w-4 h-4" />;
      case AppointmentStatus.Canceled: return <XCircle className="w-4 h-4" />;
      case AppointmentStatus.NoShow: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: AppointmentType) => {
    const colors = {
      [AppointmentType.Evaluation]: 'bg-green-100 text-green-800 border-green-200',
      [AppointmentType.Session]: 'bg-blue-100 text-blue-800 border-blue-200',
      [AppointmentType.Return]: 'bg-purple-100 text-purple-800 border-purple-200',
      [AppointmentType.Group]: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[type];
  };

  const getStatusColor = (status: AppointmentStatus) => {
    const colors = {
      [AppointmentStatus.Scheduled]: 'bg-blue-100 text-blue-800 border-blue-200',
      [AppointmentStatus.Confirmed]: 'bg-green-100 text-green-800 border-green-200',
      [AppointmentStatus.Completed]: 'bg-gray-100 text-gray-800 border-gray-200',
      [AppointmentStatus.Canceled]: 'bg-red-100 text-red-800 border-red-200',
      [AppointmentStatus.NoShow]: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[status];
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Filtros</h3>
            {activeFilterCount > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={onClearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Limpar filtros
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <Filter className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Bar - Always visible */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por paciente, terapeuta ou observações..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Filters */}
      {isExpanded && (
        <div className="p-4 space-y-6 slide-up">
          {/* Therapist Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Fisioterapeutas
            </label>
            <div className="space-y-2">
              {therapists.map(therapist => (
                <label key={therapist.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.therapistIds.includes(therapist.id)}
                    onChange={() => handleTherapistToggle(therapist.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{therapist.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Appointment Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipos de Consulta
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.values(AppointmentType).map(type => (
                <button
                  key={type}
                  onClick={() => handleTypeToggle(type)}
                  className={`
                    inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all
                    ${filters.types.includes(type)
                      ? getTypeColor(type) + ' ring-2 ring-offset-1 ring-current/20'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  {getTypeIcon(type)}
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.values(AppointmentStatus).map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusToggle(status)}
                  className={`
                    inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all
                    ${filters.statuses.includes(status)
                      ? getStatusColor(status) + ' ring-2 ring-offset-1 ring-current/20'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  {getStatusIcon(status)}
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Período
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data inicial</label>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data final</label>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Chips */}
      {activeFilterCount > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                <Search className="w-3 h-3" />
                <span>"{filters.search}"</span>
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
            
            {filters.therapistIds.map(therapistId => {
              const therapist = therapists.find(t => t.id === therapistId);
              return therapist ? (
                <div key={therapistId} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  <User className="w-3 h-3" />
                  <span>{therapist.name}</span>
                  <button
                    onClick={() => handleTherapistToggle(therapistId)}
                    className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ) : null;
            })}

            {filters.types.map(type => (
              <div key={type} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                {getTypeIcon(type)}
                <span>{type}</span>
                <button
                  onClick={() => handleTypeToggle(type)}
                  className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}

            {filters.statuses.map(status => (
              <div key={status} className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                {getStatusIcon(status)}
                <span>{status}</span>
                <button
                  onClick={() => handleStatusToggle(status)}
                  className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;