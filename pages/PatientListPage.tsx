

import { useState, useMemo, useContext } from 'react';
import { Plus, Search, Filter, BarChart3, Download, Users } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { Patient, SearchResult } from '../types';
import * as ReactRouterDOM from 'react-router-dom';
import PatientFormModal from '../components/PatientFormModal';
import Skeleton from '../components/ui/Skeleton';
import { usePatients } from '../hooks/usePatients';
import { AdvancedSearchPanel } from '../components/patient/AdvancedSearchPanel';
import { AuthContext } from '../contexts/AuthContext';


const PatientRow: React.FC<{ patient: Patient; showConditions?: boolean }> = ({ patient, showConditions = false }) => {
  const navigate = ReactRouterDOM.useNavigate();
  const statusColorMap = {
    'Ativo': 'bg-green-100 text-green-800',
    'Inativo': 'bg-yellow-100 text-yellow-800',
    'Alta': 'bg-slate-100 text-slate-800',
    'Active': 'bg-green-100 text-green-800',
    'Inactive': 'bg-yellow-100 text-yellow-800',
    'Discharged': 'bg-slate-100 text-slate-800',
  } as const;
  const lastVisitDate = new Date(patient.lastVisit);
  const formattedLastVisit = !isNaN(lastVisitDate.getTime()) ? lastVisitDate.toLocaleDateString('pt-BR') : 'N/A';


  return (
    <tr 
        className="border-b border-slate-200 hover:bg-slate-50 cursor-pointer"
        onClick={() => navigate(`/patients/${patient.id}`)}
    >
      <td className="p-4 whitespace-nowrap">
        <div className="flex items-center">
          <img className="h-10 w-10 rounded-full object-cover" src={patient.avatarUrl} alt={patient.name} />
          <div className="ml-4">
            <div className="text-sm font-medium text-slate-900">{patient.name}</div>
            <div className="text-sm text-slate-500">{patient.email}</div>
          </div>
        </div>
      </td>
      <td className="p-4 whitespace-nowrap text-sm text-slate-500">{patient.phone}</td>
      <td className="p-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[patient.status as keyof typeof statusColorMap]}`}>
          {patient.status}
        </span>
      </td>
      <td className="p-4 whitespace-nowrap text-sm text-slate-500">{formattedLastVisit}</td>
      {showConditions && (
        <td className="p-4 whitespace-nowrap text-sm text-slate-500">
          {patient.conditions && patient.conditions.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {patient.conditions.slice(0, 2).map((condition, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  {condition}
                </span>
              ))}
              {patient.conditions.length > 2 && (
                <span className="text-xs text-slate-400">+{patient.conditions.length - 2}</span>
              )}
            </div>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </td>
      )}
    </tr>
  );
};


const PatientListPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [useAdvancedSearch, setUseAdvancedSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Legacy search states for fallback
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const { patients, isLoading, error, addPatient } = usePatients();
  const { user } = useContext(AuthContext);
  const navigate = ReactRouterDOM.useNavigate();

  // Get displayed patients based on search mode
  const displayedPatients = useMemo(() => {
    if (useAdvancedSearch && searchResults) {
      return searchResults.patients;
    }
    
    // Legacy filtering for backward compatibility
    if (!patients) return [];
    return patients
      .filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.cpf.includes(searchTerm)
      )
      .filter(patient =>
        statusFilter === 'All' || patient.status === statusFilter
      );
  }, [useAdvancedSearch, searchResults, patients, searchTerm, statusFilter]);

  const totalCount = useMemo(() => {
    if (useAdvancedSearch && searchResults) {
      return searchResults.totalCount;
    }
    return displayedPatients.length;
  }, [useAdvancedSearch, searchResults, displayedPatients]);
  
  const handleSavePatient = async (patientData: Omit<Patient, 'id' | 'lastVisit'>) => {
    await addPatient(patientData);
    setIsModalOpen(false);
  };

  const handleSearchResults = (results: SearchResult) => {
    setSearchResults(results);
    setSearchError(null);
  };

  const handleSearchError = (error: string) => {
    setSearchError(error);
    setSearchResults(null);
  };

  const renderContent = () => {
    const colSpan = useAdvancedSearch ? 5 : 4;
    
    if (isLoading && !useAdvancedSearch) {
      return Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
            <td className="p-4" colSpan={colSpan}><Skeleton className="h-12 w-full" /></td>
        </tr>
      ));
    }

    if (error && !useAdvancedSearch) {
        return <tr><td colSpan={colSpan} className="text-center p-10 text-red-500">Falha ao carregar pacientes.</td></tr>;
    }

    if (searchError) {
        return <tr><td colSpan={colSpan} className="text-center p-10 text-red-500">{searchError}</td></tr>;
    }

    if (displayedPatients.length === 0) {
        return <tr><td colSpan={colSpan} className="text-center p-10 text-slate-500">Nenhum paciente encontrado.</td></tr>;
    }

    return displayedPatients.map((patient) => (
      <PatientRow key={patient.id} patient={patient} showConditions={useAdvancedSearch} />
    ));
  };

  return (
    <>
      <PageHeader
        title="Gestão de Pacientes"
        subtitle={`Adicione, visualize e gerencie as informações dos seus pacientes. ${totalCount} paciente${totalCount !== 1 ? 's' : ''} ${useAdvancedSearch ? 'encontrado' : 'cadastrado'}${totalCount !== 1 ? 's' : ''}.`}
      >
        <div className="flex items-center gap-3">
          {/* Analytics Button */}
          <button
            onClick={() => navigate('/patients/analytics')}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            <BarChart3 className="-ml-1 mr-2 h-5 w-5" />
            Analytics
          </button>

          {/* Search Mode Toggle */}
          <button
            onClick={() => setUseAdvancedSearch(!useAdvancedSearch)}
            className={`inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
              useAdvancedSearch
                ? 'border-transparent bg-sky-500 text-white hover:bg-sky-600'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Search className="-ml-1 mr-2 h-5 w-5" />
            {useAdvancedSearch ? 'Busca Avançada' : 'Busca Simples'}
          </button>

          {/* Add Patient Button */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-lg border border-transparent bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            <Plus className="-ml-1 mr-2 h-5 w-5" />
            Novo Paciente
          </button>
        </div>
      </PageHeader>
      
      <PatientFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePatient}
      />

      {/* Search Interface */}
      {useAdvancedSearch ? (
        <AdvancedSearchPanel
          onSearchResults={handleSearchResults}
          onError={handleSearchError}
          userId={user?.id}
          className="mb-6"
        />
      ) : (
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
            <div className="relative w-full sm:w-auto sm:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="relative w-full sm:w-auto">
               <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="All">Todos os Status</option>
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
                <option value="Alta">Alta</option>
                <option value="Active">Ativo</option>
                <option value="Inactive">Inativo</option>
                <option value="Discharged">Alta</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Patient Table */}
      <div className="bg-white p-6 rounded-2xl shadow-sm">

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nome</th>
                <th scope="col" className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contato</th>
                <th scope="col" className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Última Visita</th>
                {useAdvancedSearch && (
                  <th scope="col" className="p-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Condições</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {renderContent()}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default PatientListPage;