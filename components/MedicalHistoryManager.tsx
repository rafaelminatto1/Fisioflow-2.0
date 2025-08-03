import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Pill, 
  AlertTriangle, 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  FileText,
  Stethoscope,
  Activity,
  User,
  Clock
} from 'lucide-react';
import { Patient, Surgery } from '../types';
import { useToast } from '../contexts/ToastContext';

interface MedicalCondition {
  id: string;
  name: string;
  diagnosedDate: string;
  severity: 'Baixa' | 'Moderada' | 'Alta';
  status: 'Ativa' | 'Controlada' | 'Resolvida';
  notes?: string;
  treatingPhysician?: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  purpose: string;
  prescribedBy: string;
  status: 'Ativa' | 'Descontinuada' | 'Temporariamente Suspensa';
  sideEffects?: string;
}

interface Allergy {
  id: string;
  allergen: string;
  type: 'Medicamento' | 'Alimento' | 'Ambiental' | 'Outros';
  severity: 'Leve' | 'Moderada' | 'Grave';
  symptoms: string;
  firstOccurrence?: string;
  lastOccurrence?: string;
  treatment?: string;
}

interface MedicalHistoryManagerProps {
  patient: Patient;
  onUpdatePatient: (updatedPatient: Patient) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

const MedicalHistoryManager: React.FC<MedicalHistoryManagerProps> = ({
  patient,
  onUpdatePatient,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'conditions' | 'medications' | 'allergies' | 'surgeries'>('conditions');
  const [conditions, setConditions] = useState<MedicalCondition[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [surgeries, setSurgeries] = useState<Surgery[]>(patient.surgeries || []);
  
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { showToast } = useToast();

  useEffect(() => {
    // Initialize with patient data
    // In real app, these would come from separate endpoints
    setConditions([]);
    setMedications([]);
    setAllergies([]);
    setSurgeries(patient.surgeries || []);
  }, [patient]);

  const tabs = [
    { id: 'conditions', label: 'Condições Médicas', icon: Stethoscope, count: conditions.length },
    { id: 'medications', label: 'Medicamentos', icon: Pill, count: medications.length },
    { id: 'allergies', label: 'Alergias', icon: AlertTriangle, count: allergies.length },
    { id: 'surgeries', label: 'Cirurgias', icon: Activity, count: surgeries.length }
  ];

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updatedPatient: Patient = {
        ...patient,
        surgeries: surgeries,
        // In real app, conditions, medications, and allergies would be separate entities
      };
      
      await onUpdatePatient(updatedPatient);
      showToast('Histórico médico atualizado com sucesso', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Erro ao salvar histórico médico', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const ConditionForm: React.FC<{ condition?: MedicalCondition; onSave: (condition: MedicalCondition) => void; onCancel: () => void }> = ({
    condition,
    onSave,
    onCancel
  }) => {
    const [formData, setFormData] = useState({
      name: condition?.name || '',
      diagnosedDate: condition?.diagnosedDate || '',
      severity: condition?.severity || 'Baixa' as const,
      status: condition?.status || 'Ativa' as const,
      notes: condition?.notes || '',
      treatingPhysician: condition?.treatingPhysician || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        id: condition?.id || Date.now().toString(),
        ...formData
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condição Médica *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data do Diagnóstico</label>
            <input
              type="date"
              value={formData.diagnosedDate}
              onChange={(e) => setFormData({ ...formData, diagnosedDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gravidade</label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="Baixa">Baixa</option>
              <option value="Moderada">Moderada</option>
              <option value="Alta">Alta</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="Ativa">Ativa</option>
              <option value="Controlada">Controlada</option>
              <option value="Resolvida">Resolvida</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Médico Responsável</label>
            <input
              type="text"
              value={formData.treatingPhysician}
              onChange={(e) => setFormData({ ...formData, treatingPhysician: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Salvar
          </button>
        </div>
      </form>
    );
  };

  const MedicationForm: React.FC<{ medication?: Medication; onSave: (medication: Medication) => void; onCancel: () => void }> = ({
    medication,
    onSave,
    onCancel
  }) => {
    const [formData, setFormData] = useState({
      name: medication?.name || '',
      dosage: medication?.dosage || '',
      frequency: medication?.frequency || '',
      startDate: medication?.startDate || '',
      endDate: medication?.endDate || '',
      purpose: medication?.purpose || '',
      prescribedBy: medication?.prescribedBy || '',
      status: medication?.status || 'Ativa' as const,
      sideEffects: medication?.sideEffects || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        id: medication?.id || Date.now().toString(),
        ...formData
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Medicamento *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dosagem</label>
            <input
              type="text"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 500mg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequência</label>
            <input
              type="text"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 2x ao dia"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="Ativa">Ativa</option>
              <option value="Descontinuada">Descontinuada</option>
              <option value="Temporariamente Suspensa">Temporariamente Suspensa</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de Fim (se aplicável)</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Finalidade</label>
            <input
              type="text"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Para que serve o medicamento"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Prescrito por</label>
            <input
              type="text"
              value={formData.prescribedBy}
              onChange={(e) => setFormData({ ...formData, prescribedBy: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Efeitos Colaterais</label>
            <textarea
              value={formData.sideEffects}
              onChange={(e) => setFormData({ ...formData, sideEffects: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Salvar
          </button>
        </div>
      </form>
    );
  };

  const renderConditions = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Condições Médicas</h3>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Nova Condição</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <ConditionForm
            condition={editingItem}
            onSave={(condition) => {
              if (editingItem) {
                setConditions(prev => prev.map(c => c.id === condition.id ? condition : c));
              } else {
                setConditions(prev => [...prev, condition]);
              }
              setShowForm(false);
              setEditingItem(null);
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
          />
        </div>
      )}

      {conditions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Stethoscope size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Nenhuma condição médica registrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conditions.map((condition) => (
            <div key={condition.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{condition.name}</h4>
                  <div className="text-sm text-gray-600 mt-1 space-y-1">
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 py-1 text-xs rounded-full 
                        ${condition.severity === 'Alta' ? 'bg-red-100 text-red-800' : 
                          condition.severity === 'Moderada' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-green-100 text-green-800'}`}>
                        {condition.severity}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full
                        ${condition.status === 'Ativa' ? 'bg-red-100 text-red-800' :
                          condition.status === 'Controlada' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'}`}>
                        {condition.status}
                      </span>
                    </div>
                    {condition.diagnosedDate && (
                      <p>Diagnosticada em: {new Date(condition.diagnosedDate).toLocaleDateString('pt-BR')}</p>
                    )}
                    {condition.treatingPhysician && (
                      <p>Médico: {condition.treatingPhysician}</p>
                    )}
                    {condition.notes && (
                      <p className="mt-2">{condition.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingItem(condition);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => setConditions(prev => prev.filter(c => c.id !== condition.id))}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMedications = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Medicamentos</h3>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowForm(true);
          }}
          className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Nova Medicação</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <MedicationForm
            medication={editingItem}
            onSave={(medication) => {
              if (editingItem) {
                setMedications(prev => prev.map(m => m.id === medication.id ? medication : m));
              } else {
                setMedications(prev => [...prev, medication]);
              }
              setShowForm(false);
              setEditingItem(null);
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
          />
        </div>
      )}

      {medications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Pill size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Nenhum medicamento registrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {medications.map((medication) => (
            <div key={medication.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{medication.name}</h4>
                  <div className="text-sm text-gray-600 mt-1 space-y-1">
                    <div className="flex items-center space-x-4">
                      <span>{medication.dosage}</span>
                      <span>{medication.frequency}</span>
                      <span className={`px-2 py-1 text-xs rounded-full
                        ${medication.status === 'Ativa' ? 'bg-green-100 text-green-800' :
                          medication.status === 'Descontinuada' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'}`}>
                        {medication.status}
                      </span>
                    </div>
                    <p>Finalidade: {medication.purpose}</p>
                    {medication.prescribedBy && (
                      <p>Prescrito por: {medication.prescribedBy}</p>
                    )}
                    {medication.startDate && (
                      <p>Iniciado em: {new Date(medication.startDate).toLocaleDateString('pt-BR')}</p>
                    )}
                    {medication.sideEffects && (
                      <p className="mt-2 text-orange-600">Efeitos colaterais: {medication.sideEffects}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingItem(medication);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => setMedications(prev => prev.filter(m => m.id !== medication.id))}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCurrentTab = () => {
    if (!showForm) {
      switch (activeTab) {
        case 'conditions': return renderConditions();
        case 'medications': return renderMedications();
        case 'allergies': return <div className="text-center py-8 text-gray-500">Seção de alergias em desenvolvimento</div>;
        case 'surgeries': return <div className="text-center py-8 text-gray-500">Seção de cirurgias em desenvolvimento</div>;
        default: return renderConditions();
      }
    }

    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Heart className="text-red-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-800">Histórico Médico</h2>
              <p className="text-gray-600">{patient.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setShowForm(false);
                  setEditingItem(null);
                }}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 text-xs rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderCurrentTab()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Fechar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
          >
            <Save size={16} />
            <span>{isLoading ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicalHistoryManager;