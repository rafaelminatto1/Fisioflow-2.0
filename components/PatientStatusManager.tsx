import React, { useState } from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  User, 
  Calendar, 
  FileText, 
  MessageSquare,
  X,
  Save,
  Activity
} from 'lucide-react';
import { Patient } from '../types';
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

interface PatientStatusManagerProps {
  patient: Patient;
  onStatusUpdate: (patientId: string, newStatus: Patient['status'], reason: string, notes?: string) => Promise<void>;
  statusHistory: StatusChangeRecord[];
  isOpen: boolean;
  onClose: () => void;
}

const PatientStatusManager: React.FC<PatientStatusManagerProps> = ({
  patient,
  onStatusUpdate,
  statusHistory,
  isOpen,
  onClose
}) => {
  const [selectedStatus, setSelectedStatus] = useState<Patient['status']>(patient.status);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const statusOptions: Array<{
    value: Patient['status'];
    label: string;
    color: string;
    bgColor: string;
    icon: React.ComponentType<any>;
    description: string;
    reasonsRequired: boolean;
  }> = [
    {
      value: 'Ativo',
      label: 'Ativo',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: CheckCircle,
      description: 'Paciente em tratamento ativo',
      reasonsRequired: false
    },
    {
      value: 'Inativo',
      label: 'Inativo',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      icon: Clock,
      description: 'Paciente temporariamente inativo (tratamento pausado)',
      reasonsRequired: true
    },
    {
      value: 'Alta',
      label: 'Alta Médica',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      icon: Activity,
      description: 'Paciente recebeu alta médica',
      reasonsRequired: true
    }
  ];

  const commonReasons = {
    'Ativo': [
      'Retorno ao tratamento',
      'Novo paciente',
      'Reativação após pausa',
      'Transferência de outro profissional'
    ],
    'Inativo': [
      'Pausa temporária no tratamento',
      'Problemas financeiros',
      'Problemas de agenda',
      'Questões pessoais/familiares',
      'Viagem/mudança temporária',
      'Problemas de saúde não relacionados'
    ],
    'Alta': [
      'Objetivos terapêuticos atingidos',
      'Melhora completa',
      'Tratamento concluído conforme planejado',
      'Paciente não necessita mais fisioterapia',
      'Alta por abandono de tratamento',
      'Transferência para outro profissional',
      'Alta administrativa'
    ]
  };

  const getCurrentStatusInfo = () => {
    return statusOptions.find(option => option.value === patient.status);
  };

  const getSelectedStatusInfo = () => {
    return statusOptions.find(option => option.value === selectedStatus);
  };

  const handleStatusChange = async () => {
    if (selectedStatus === patient.status) {
      showToast('Status selecionado é igual ao atual', 'warning');
      return;
    }

    const statusInfo = getSelectedStatusInfo();
    if (statusInfo?.reasonsRequired && !reason.trim()) {
      showToast('Motivo é obrigatório para este status', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await onStatusUpdate(patient.id, selectedStatus, reason, notes || undefined);
      showToast(`Status do paciente alterado para ${selectedStatus}`, 'success');
      onClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Erro ao alterar status', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    const statusInfo = statusOptions.find(option => option.value === status);
    return statusInfo ? { color: statusInfo.color, bgColor: statusInfo.bgColor } : { color: 'text-gray-600', bgColor: 'bg-gray-100' };
  };

  if (!isOpen) return null;

  const currentStatusInfo = getCurrentStatusInfo();
  const selectedStatusInfo = getSelectedStatusInfo();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <User className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-800">Gerenciar Status do Paciente</h2>
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

        <div className="p-6 space-y-6">
          {/* Current Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
              <Activity size={20} />
              <span>Status Atual</span>
            </h3>
            
            {currentStatusInfo && (
              <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-full ${currentStatusInfo.bgColor}`}>
                <currentStatusInfo.icon size={16} className={currentStatusInfo.color} />
                <span className={`font-medium ${currentStatusInfo.color}`}>
                  {currentStatusInfo.label}
                </span>
              </div>
            )}
            
            <p className="text-gray-600 mt-2">
              {currentStatusInfo?.description}
            </p>
          </div>

          {/* Status Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Alterar Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {statusOptions.map((option) => (
                <div
                  key={option.value}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedStatus === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedStatus(option.value)}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`p-2 rounded-full ${option.bgColor}`}>
                      <option.icon size={20} className={option.color} />
                    </div>
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{option.description}</p>
                  
                  {option.reasonsRequired && (
                    <div className="mt-2 flex items-center space-x-1 text-xs text-orange-600">
                      <AlertCircle size={12} />
                      <span>Motivo obrigatório</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reason Selection */}
          {selectedStatus !== patient.status && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                <MessageSquare size={20} />
                <span>
                  Motivo da Alteração
                  {selectedStatusInfo?.reasonsRequired && <span className="text-red-500">*</span>}
                </span>
              </h3>
              
              <div className="space-y-3">
                {/* Common Reasons */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivos Comuns
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {commonReasons[selectedStatus]?.map((commonReason) => (
                      <button
                        key={commonReason}
                        type="button"
                        onClick={() => setReason(commonReason)}
                        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                          reason === commonReason
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        {commonReason}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo Personalizado
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite o motivo para a alteração de status..."
                  />
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações Adicionais (Opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Observações adicionais sobre a mudança de status..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Status History */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
              <Calendar size={20} />
              <span>Histórico de Status</span>
            </h3>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {statusHistory.length === 0 ? (
                <p className="text-gray-500 italic">Nenhuma alteração de status registrada</p>
              ) : (
                statusHistory.map((record) => {
                  const fromStatusColors = getStatusColor(record.fromStatus);
                  const toStatusColors = getStatusColor(record.toStatus);
                  
                  return (
                    <div key={record.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 text-xs rounded ${fromStatusColors.bgColor} ${fromStatusColors.color}`}>
                            {record.fromStatus}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className={`px-2 py-1 text-xs rounded ${toStatusColors.bgColor} ${toStatusColors.color}`}>
                            {record.toStatus}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(record.changedAt)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 font-medium">{record.reason}</p>
                      {record.notes && (
                        <p className="text-sm text-gray-600 mt-1">{record.notes}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Alterado por: {record.changedBy}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Cancelar
          </button>
          
          {selectedStatus !== patient.status && (
            <button
              onClick={handleStatusChange}
              disabled={isLoading || (selectedStatusInfo?.reasonsRequired && !reason.trim())}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Save size={16} />
              <span>{isLoading ? 'Salvando...' : 'Alterar Status'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientStatusManager;