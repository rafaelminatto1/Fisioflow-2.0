import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Users, Calendar, CheckCircle, Clock, AlertCircle, XCircle, ChevronDown } from 'lucide-react';
import { Appointment, Therapist, AppointmentStatus, AppointmentType } from '../../types';

export interface FilterOptions {
  search: string;
  therapists: string[];
  types: AppointmentType[];
  statuses: AppointmentStatus[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  paymentStatus: ('paid' | 'pending')[];
  showRecurring: boolean | null; // null = all, true = only recurring, false = only single
}

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  therapists: Therapist[];
  appointments: Appointment[];
  isVisible: boolean;
  onToggleVisibility: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  therapists,
  appointments,
  isVisible,
  onToggleVisibility
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [expandedSections, setExpandedSections] = useState({
    therapists: false,
    types: false,
    status: false,
    payment: false,
    advanced: false
  });

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchTerm });
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const appointmentTypes: AppointmentType[] = ['Avaliação', 'Sessão', 'Retorno'];
  const statuses: AppointmentStatus[] = ['scheduled', 'completed', 'cancelled', 'no_show'];
  const paymentStatuses: ('paid' | 'pending')[] = ['paid', 'pending'];

  const statusIcons = {
    [AppointmentStatus.Scheduled]: <Clock className="w-4 h-4 text-blue-500" />,
    [AppointmentStatus.Completed]: <CheckCircle className="w-4 h-4 text-green-500" />,
    [AppointmentStatus.Canceled]: <XCircle className="w-4 h-4 text-red-500" />,
    [AppointmentStatus.NoShow]: <AlertCircle className="w-4 h-4 text-orange-500" />
  };

  const statusLabels = {
    [AppointmentStatus.Scheduled]: 'Agendado',
    [AppointmentStatus.Completed]: 'Concluído',
    [AppointmentStatus.Canceled]: 'Cancelado',
    [AppointmentStatus.NoShow]: 'Falta'
  };

  const handleTherapistToggle = (therapistId: string) => {
    const newTherapists = filters.therapists.includes(therapistId)
      ? filters.therapists.filter(id => id !== therapistId)
      : [...filters.therapists, therapistId];
    
    onFiltersChange({ ...filters, therapists: newTherapists });
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

  const handlePaymentStatusToggle = (status: 'paid' | 'pending') => {
    const newPaymentStatuses = filters.paymentStatus.includes(status)
      ? filters.paymentStatus.filter(s => s !== status)
      : [...filters.paymentStatus, status];
    
    onFiltersChange({ ...filters, paymentStatus: newPaymentStatuses });
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    onFiltersChange({
      search: '',
      therapists: [],
      types: [],
      statuses: [],
      dateRange: { start: null, end: null },
      paymentStatus: [],
      showRecurring: null
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.therapists.length > 0) count++;
    if (filters.types.length > 0) count++;
    if (filters.statuses.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.paymentStatus.length > 0) count++;
    if (filters.showRecurring !== null) count++;
    return count;
  };

  const activeFiltersCount = getActiveFilterCount();

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <button
        onClick={onToggleVisibility}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200
          ${isVisible 
            ? 'bg-blue-500 text-white border-blue-500 shadow-lg' 
            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }
        `}
      >
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filtros</span>
        {activeFiltersCount > 0 && (
          <span className={`
            px-2 py-0.5 text-xs font-bold rounded-full
            ${isVisible ? 'bg-white/20 text-white' : 'bg-blue-500 text-white'}
          `}>
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isVisible && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Filtros</h3>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs font-medium text-slate-500 hover:text-red-500 transition-colors duration-200"
                  >
                    Limpar tudo
                  </button>
                )}
                <button
                  onClick={onToggleVisibility}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                <Search className="w-4 h-4 inline mr-2" />
                Buscar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome do paciente, terapeuta ou observações..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {filters.search && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-md flex items-center gap-1">
                    "{filters.search}"
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        onFiltersChange({ ...filters, search: '' });
                      }}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                </div>
              )}
            </div>

            {/* Therapists Filter */}
            <div className="space-y-2">
              <button
                onClick={() => toggleSection('therapists')}
                className="flex items-center justify-between w-full text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors duration-200"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Terapeutas
                  {filters.therapists.length > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">
                      {filters.therapists.length}
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedSections.therapists ? 'rotate-180' : ''}`} />
              </button>
              
              {expandedSections.therapists && (
                <div className="space-y-2 pl-6">
                  {therapists.map((therapist) => (
                    <label key={therapist.id} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.therapists.includes(therapist.id)}
                        onChange={() => handleTherapistToggle(therapist.id)}
                        className="rounded border-slate-300 text-blue-500 focus:ring-blue-500 focus:ring-2"
                      />
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-${therapist.color}-400`} />
                        <span className="text-sm text-slate-700 group-hover:text-blue-600 transition-colors duration-200">
                          {therapist.name}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              
              {filters.therapists.length > 0 && (
                <div className="flex flex-wrap gap-1 pl-6">
                  {filters.therapists.map((therapistId) => {
                    const therapist = therapists.find(t => t.id === therapistId);
                    return therapist ? (
                      <span
                        key={therapistId}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-md flex items-center gap-1"
                      >
                        <div className={`w-2 h-2 rounded-full bg-${therapist.color}-400`} />
                        {therapist.name}
                        <button
                          onClick={() => handleTherapistToggle(therapistId)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            {/* Appointment Types */}
            <div className="space-y-2">
              <button
                onClick={() => toggleSection('types')}
                className="flex items-center justify-between w-full text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors duration-200"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Tipos de Consulta
                  {filters.types.length > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">
                      {filters.types.length}
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedSections.types ? 'rotate-180' : ''}`} />
              </button>
              
              {expandedSections.types && (
                <div className="grid grid-cols-2 gap-2 pl-6">
                  {appointmentTypes.map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.types.includes(type)}
                        onChange={() => handleTypeToggle(type)}
                        className="rounded border-slate-300 text-blue-500 focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm text-slate-700 group-hover:text-blue-600 transition-colors duration-200">
                        {type}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <button
                onClick={() => toggleSection('status')}
                className="flex items-center justify-between w-full text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors duration-200"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Status
                  {filters.statuses.length > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-bold rounded-full">
                      {filters.statuses.length}
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedSections.status ? 'rotate-180' : ''}`} />
              </button>
              
              {expandedSections.status && (
                <div className="space-y-2 pl-6">
                  {statuses.map((status) => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={filters.statuses.includes(status)}
                        onChange={() => handleStatusToggle(status)}
                        className="rounded border-slate-300 text-blue-500 focus:ring-blue-500 focus:ring-2"
                      />
                      <div className="flex items-center gap-2">
                        {statusIcons[status]}
                        <span className="text-sm text-slate-700 group-hover:text-blue-600 transition-colors duration-200">
                          {statusLabels[status]}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                <Calendar className="w-4 h-4 inline mr-2" />
                Período
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={filters.dateRange.start?.toISOString().split('T')[0] || ''}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    dateRange: {
                      ...filters.dateRange,
                      start: e.target.value ? new Date(e.target.value) : null
                    }
                  })}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Data inicial"
                />
                <input
                  type="date"
                  value={filters.dateRange.end?.toISOString().split('T')[0] || ''}
                  onChange={(e) => onFiltersChange({
                    ...filters,
                    dateRange: {
                      ...filters.dateRange,
                      end: e.target.value ? new Date(e.target.value) : null
                    }
                  })}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Data final"
                />
              </div>
            </div>

            {/* Quick Date Presets */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  const today = new Date();
                  onFiltersChange({
                    ...filters,
                    dateRange: { start: today, end: today }
                  });
                }}
                className="px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
              >
                Hoje
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const weekStart = new Date(today);
                  const weekEnd = new Date(today);
                  weekStart.setDate(today.getDate() - today.getDay() + 1);
                  weekEnd.setDate(weekStart.getDate() + 6);
                  onFiltersChange({
                    ...filters,
                    dateRange: { start: weekStart, end: weekEnd }
                  });
                }}
                className="px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
              >
                Esta semana
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                  onFiltersChange({
                    ...filters,
                    dateRange: { start: monthStart, end: monthEnd }
                  });
                }}
                className="px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
              >
                Este mês
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;