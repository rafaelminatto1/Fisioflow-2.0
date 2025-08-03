import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Users, 
  Download, 
  Eye, 
  Edit, 
  Activity,
  MoreVertical,
  FileText,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import PatientRegistrationForm from '../components/PatientRegistrationForm';
import PatientSearchAndFilter from '../components/PatientSearchAndFilter';
import PatientStatusManager from '../components/PatientStatusManager';
import { Patient } from '../types';
import { usePatients } from '../hooks/usePatients';
import { useToast } from '../contexts/ToastContext';

interface StatusChangeRecord {
  id: string;
  fromStatus: string;
  toStatus: string;
  reason: string;
  changedBy: string;
  changedAt: Date;
  notes?: string;
}

const EnhancedPatientListPage: React.FC = () => {
  const navigate = useNavigate();
  const { patients, addPatient, updatePatient, loading, error } = usePatients();
  const { showToast } = useToast();
  
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>();
  const [selectedPatient, setSelectedPatient] = useState<Patient | undefined>();
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Mock status history - In real app, this would come from API
  const mockStatusHistory: StatusChangeRecord[] = [
    {
      id: '1',
      fromStatus: 'Ativo',
      toStatus: 'Inativo',
      reason: 'Pausa temporária no tratamento',
      changedBy: 'Dr. João Silva',
      changedAt: new Date('2024-01-15T10:30:00'),
      notes: 'Paciente solicitou pausa de 2 semanas devido a viagem'
    }
  ];

  const handleSavePatient = async (patientData: Omit<Patient, 'id' | 'lastVisit'>) => {
    try {
      if (editingPatient) {
        await updatePatient({ ...patientData, id: editingPatient.id, lastVisit: editingPatient.lastVisit });
      } else {
        await addPatient({ ...patientData, lastVisit: new Date().toISOString() });
      }
      setShowRegistrationForm(false);
      setEditingPatient(undefined);
    } catch (error) {
      throw error; // Let the form handle the error
    }
  };

  const handleStatusUpdate = async (patientId: string, newStatus: Patient['status'], reason: string, notes?: string) => {
    try {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) throw new Error('Paciente não encontrado');

      await updatePatient({ ...patient, status: newStatus });
      
      // In real app, you would also save the status change record
      showToast(`Status alterado para ${newStatus}`, 'success');
    } catch (error) {
      throw error;
    }
  };

  const handleExport = (patientsToExport: Patient[]) => {
    // Simple CSV export
    const headers = ['Nome', 'CPF', 'Email', 'Telefone', 'Status', 'Última Visita'];
    const csvContent = [
      headers.join(','),
      ...patientsToExport.map(patient => [
        `"${patient.name}"`,
        `"${patient.cpf}"`,
        `"${patient.email}"`,
        `"${patient.phone}"`,
        `"${patient.status}"`,
        `"${new Date(patient.lastVisit).toLocaleDateString('pt-BR')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pacientes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`${patientsToExport.length} pacientes exportados`, 'success');
  };

  const handleBulkStatusChange = (status: Patient['status']) => {
    if (selectedPatients.length === 0) {
      showToast('Selecione pelo menos um paciente', 'warning');
      return;
    }
    
    // In real app, implement bulk status change
    showToast(`Status de ${selectedPatients.length} pacientes alterado para ${status}`, 'success');
    setSelectedPatients([]);
  };

  const togglePatientSelection = (patientId: string) => {
    setSelectedPatients(prev => 
      prev.includes(patientId) 
        ? prev.filter(id => id !== patientId)
        : [...prev, patientId]
    );
  };

  const selectAllPatients = () => {
    if (selectedPatients.length === filteredPatients.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(filteredPatients.map(p => p.id));
    }
  };

  const getPatientAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const statusColorMap = {
    'Ativo': 'bg-green-100 text-green-800 border-green-200',
    'Inativo': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Alta': 'bg-blue-100 text-blue-800 border-blue-200'
  };

  const PatientCard: React.FC<{ patient: Patient }> = ({ patient }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <img 
            src={patient.avatarUrl} 
            alt={patient.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{patient.name}</h3>
            <p className="text-sm text-gray-500">{patient.email}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColorMap[patient.status]}`}>
            {patient.status}
          </span>
          
          <div className="relative">
            <button className="p-1 hover:bg-gray-100 rounded">
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Telefone:</span>
          <span>{patient.phone}</span>
        </div>
        
        {patient.birthDate && (
          <div className="flex justify-between">
            <span className="text-gray-500">Idade:</span>
            <span>{getPatientAge(patient.birthDate)} anos</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-gray-500">Última visita:</span>
          <span>{new Date(patient.lastVisit).toLocaleDateString('pt-BR')}</span>
        </div>

        {patient.conditions && patient.conditions.length > 0 && (
          <div>
            <span className="text-gray-500">Condições:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {patient.conditions.slice(0, 3).map((condition, index) => (
                <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 text-xs rounded">
                  {condition}
                </span>
              ))}
              {patient.conditions.length > 3 && (
                <span className="text-gray-500 text-xs">+{patient.conditions.length - 3} mais</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/patients/${patient.id}`)}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Eye size={12} />
            <span>Ver</span>
          </button>
          
          <button
            onClick={() => {
              setEditingPatient(patient);
              setShowRegistrationForm(true);
            }}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            <Edit size={12} />
            <span>Editar</span>
          </button>
        </div>
        
        <button
          onClick={() => {
            setSelectedPatient(patient);
            setShowStatusManager(true);
          }}
          className="flex items-center space-x-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
        >
          <Activity size={12} />
          <span>Status</span>
        </button>
      </div>
    </div>
  );

  const PatientTableRow: React.FC<{ patient: Patient; index: number }> = ({ patient, index }) => (
    <tr className={`border-b border-gray-200 hover:bg-gray-50 ${selectedPatients.includes(patient.id) ? 'bg-blue-50' : ''}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={selectedPatients.includes(patient.id)}
          onChange={() => togglePatientSelection(patient.id)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <img src={patient.avatarUrl} alt={patient.name} className="w-10 h-10 rounded-full object-cover" />
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{patient.name}</div>
            <div className="text-sm text-gray-500">{patient.email}</div>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.phone}</td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusColorMap[patient.status]}`}>
          {patient.status}
        </span>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {patient.birthDate ? `${getPatientAge(patient.birthDate)} anos` : 'N/A'}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(patient.lastVisit).toLocaleDateString('pt-BR')}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {patient.conditions?.length || 0} condições
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate(`/patients/${patient.id}`)}
            className="text-blue-600 hover:text-blue-900"
            title="Ver detalhes"
          >
            <Eye size={16} />
          </button>
          
          <button
            onClick={() => {
              setEditingPatient(patient);
              setShowRegistrationForm(true);
            }}
            className="text-gray-600 hover:text-gray-900"
            title="Editar"
          >
            <Edit size={16} />
          </button>
          
          <button
            onClick={() => {
              setSelectedPatient(patient);
              setShowStatusManager(true);
            }}
            className="text-green-600 hover:text-green-900"
            title="Gerenciar status"
          >
            <Activity size={16} />
          </button>
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Pacientes" 
          subtitle="Gerencie seus pacientes"
          icon={Users}
        />
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Pacientes" 
        subtitle={`${filteredPatients.length} pacientes encontrados`}
        icon={Users}
        actions={
          <div className="flex items-center space-x-3">
            {selectedPatients.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedPatients.length} selecionados
                </span>
                
                <select
                  onChange={(e) => handleBulkStatusChange(e.target.value as Patient['status'])}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                  defaultValue=""
                >
                  <option value="" disabled>Alterar status</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
            )}
            
            <div className="flex items-center space-x-1 border border-gray-300 rounded">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 text-sm ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Tabela
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 text-sm ${viewMode === 'cards' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Cards
              </button>
            </div>
            
            <button
              onClick={() => setShowRegistrationForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Novo Paciente</span>
            </button>
          </div>
        }
      />

      {/* Search and Filter */}
      <PatientSearchAndFilter
        patients={patients}
        onFilteredResults={setFilteredPatients}
        onExport={handleExport}
      />

      {/* Patients List */}
      <div className="bg-white rounded-lg shadow">
        {filteredPatients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum paciente encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {patients.length === 0 
                ? 'Comece cadastrando seu primeiro paciente.' 
                : 'Tente ajustar os filtros de busca.'
              }
            </p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedPatients.length === filteredPatients.length}
                      onChange={selectAllPatients}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Telefone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Idade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Visita
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condições
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPatients.map((patient, index) => (
                  <PatientTableRow key={patient.id} patient={patient} index={index} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatients.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Registration Form Modal */}
      {showRegistrationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <PatientRegistrationForm
              onSave={handleSavePatient}
              initialData={editingPatient}
              isEditing={!!editingPatient}
              onCancel={() => {
                setShowRegistrationForm(false);
                setEditingPatient(undefined);
              }}
            />
          </div>
        </div>
      )}

      {/* Status Manager Modal */}
      {selectedPatient && (
        <PatientStatusManager
          patient={selectedPatient}
          onStatusUpdate={handleStatusUpdate}
          statusHistory={mockStatusHistory}
          isOpen={showStatusManager}
          onClose={() => {
            setShowStatusManager(false);
            setSelectedPatient(undefined);
          }}
        />
      )}
    </div>
  );
};

export default EnhancedPatientListPage;