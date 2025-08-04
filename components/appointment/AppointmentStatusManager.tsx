import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Pause, 
  ArrowRight, 
  MessageSquare, 
  Bell,
  User,
  MapPin,
  FileText,
  Save,
  X,
  History
} from 'lucide-react';
import { Appointment, AppointmentStatus, Patient } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface StatusChange {
  id: string;
  fromStatus: AppointmentStatus;
  toStatus: AppointmentStatus;
  reason: string;
  notes?: string;
  changedBy: string;
  changedAt: Date;
  notificationSent?: boolean;
}

interface AppointmentStatusManagerProps {
  appointment: Appointment;
  patient: Patient;
  onStatusUpdate: (appointmentId: string, newStatus: AppointmentStatus, reason: string, notes?: string) => Promise<void>;
  onReschedule: (appointmentId: string, newDateTime: Date) => Promise<void>;
  statusHistory: StatusChange[];
  isOpen: boolean;
  onClose: () => void;
}

const AppointmentStatusManager: React.FC<AppointmentStatusManagerProps> = ({
  appointment,
  patient,
  onStatusUpdate,
  onReschedule,
  statusHistory,
  isOpen,
  onClose
}) => {
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus>(appointment.status);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [rescheduleDateTime, setRescheduleDateTime] = useState('');
  const [showReschedule, setShowReschedule] = useState(false);
  const [sendNotification, setSendNotification] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const statusOptions: Array<{
    value: AppointmentStatus;
    label: string;
    color: string;
    bgColor: string;
    icon: React.ComponentType<any>;
    description: string;
    reasonsRequired: boolean;
    allowedTransitions: AppointmentStatus[];
  }> = [
    {
      value: 'scheduled',
      label: 'Agendada',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      icon: Calendar,
      description: 'Consulta confirmada e agendada',
      reasonsRequired: false,
      allowedTransitions: ['confirmed', 'cancelled', 'rescheduled']
    },
    {
      value: 'confirmed',
      label: 'Confirmada',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: CheckCircle,
      description: 'Paciente confirmou presença',
      reasonsRequired: false,
      allowedTransitions: ['completed', 'no_show', 'cancelled']
    },
    {
      value: 'completed',
      label: 'Realizada',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      icon: CheckCircle,
      description: 'Consulta realizada com sucesso',
      reasonsRequired: false,
      allowedTransitions: []
    },
    {
      value: 'cancelled',
      label: 'Cancelada',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      icon: XCircle,
      description: 'Consulta cancelada',
      reasonsRequired: true,
      allowedTransitions: ['scheduled']
    },
    {
      value: 'no_show',
      label: 'Falta',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      icon: AlertCircle,
      description: 'Paciente não compareceu',
      reasonsRequired: true,
      allowedTransitions: ['rescheduled', 'cancelled']
    },
    {
      value: 'rescheduled',
      label: 'Reagendada',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      icon: Clock,
      description: 'Consulta reagendada para nova data',
      reasonsRequired: true,
      allowedTransitions: ['scheduled']
    }
  ];

  const commonReasons = {
    'confirmed': [
      'Paciente confirmou por telefone',
      'Confirmação via SMS/WhatsApp',
      'Confirmação presencial',
      'Confirmação automática'
    ],
    'completed': [
      'Consulta realizada conforme planejado',
      'Sessão de fisioterapia concluída',
      'Avaliação realizada',
      'Procedimento executado com sucesso'
    ],
    'cancelled': [
      'Cancelamento pelo paciente',
      'Cancelamento por motivo médico',
      'Indisponibilidade do terapeuta',
      'Problemas de agenda',
      'Emergência familiar',
      'Questões financeiras',
      'Cancelamento administrativo'
    ],
    'no_show': [
      'Paciente não compareceu sem avisar',
      'Esquecimento da consulta',
      'Problemas de transporte',
      'Emergência de última hora',
      'Confusão de horário/data'
    ],
    'rescheduled': [
      'Solicitação do paciente',
      'Conflito de agenda do terapeuta',
      'Questões de saúde do paciente',
      'Reagendamento por conveniência',
      'Feriado/ponto facultativo'
    ]
  };

  const getCurrentStatusInfo = () => {
    return statusOptions.find(option => option.value === appointment.status);
  };

  const getSelectedStatusInfo = () => {
    return statusOptions.find(option => option.value === selectedStatus);
  };

  const getAvailableTransitions = () => {
    const currentStatusInfo = getCurrentStatusInfo();
    if (!currentStatusInfo) return statusOptions;
    
    return statusOptions.filter(option => 
      currentStatusInfo.allowedTransitions.includes(option.value) || option.value === appointment.status
    );
  };

  const handleStatusChange = async () => {
    if (selectedStatus === appointment.status) {
      showToast('Status selecionado é igual ao atual', 'warning');
      return;
    }

    const statusInfo = getSelectedStatusInfo();
    if (statusInfo?.reasonsRequired && !reason.trim()) {
      showToast('Motivo é obrigatório para este status', 'error');
      return;
    }

    if (selectedStatus === 'rescheduled' && !rescheduleDateTime) {
      showToast('Nova data/hora é obrigatória para reagendamento', 'error');
      return;
    }

    setIsLoading(true);
    try {
      if (selectedStatus === 'rescheduled') {
        await onReschedule(appointment.id, new Date(rescheduleDateTime));
      } else {
        await onStatusUpdate(appointment.id, selectedStatus, reason, notes || undefined);
      }
      
      showToast(`Status alterado para ${statusInfo?.label}`, 'success');
      onClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Erro ao alterar status', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status: AppointmentStatus) => {
    const statusInfo = statusOptions.find(option => option.value === status);
    return statusInfo ? { color: statusInfo.color, bgColor: statusInfo.bgColor } : { color: 'text-gray-600', bgColor: 'bg-gray-100' };
  };

  const canTransitionTo = (targetStatus: AppointmentStatus) => {
    const currentStatusInfo = getCurrentStatusInfo();
    if (!currentStatusInfo) return true;
    
    return currentStatusInfo.allowedTransitions.includes(targetStatus) || targetStatus === appointment.status;
  };

  const getWorkflowSteps = () => {
    const workflow: Array<{ status: AppointmentStatus; label: string; completed: boolean; current: boolean }> = [
      { status: 'scheduled', label: 'Agendada', completed: false, current: false },
      { status: 'confirmed', label: 'Confirmada', completed: false, current: false },
      { status: 'completed', label: 'Realizada', completed: false, current: false }
    ];

    const statusOrder: AppointmentStatus[] = ['scheduled', 'confirmed', 'completed'];
    const currentIndex = statusOrder.indexOf(appointment.status);

    workflow.forEach((step, index) => {
      step.completed = index < currentIndex;
      step.current = index === currentIndex;
    });

    return workflow;
  };

  if (!isOpen) return null;

  const currentStatusInfo = getCurrentStatusInfo();
  const selectedStatusInfo = getSelectedStatusInfo();
  const availableTransitions = getAvailableTransitions();
  const workflowSteps = getWorkflowSteps();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Calendar className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-800">Gerenciar Status da Consulta</h2>
              <p className="text-gray-600">{patient.name} - {formatDateTime(appointment.startTime)}</p>
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
          {/* Appointment Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
              <FileText size={20} />
              <span>Informações da Consulta</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <User size={16} className="text-gray-500" />
                <span><strong>Paciente:</strong> {patient.name}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock size={16} className="text-gray-500" />
                <span><strong>Horário:</strong> {formatDateTime(appointment.startTime)}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <FileText size={16} className="text-gray-500" />
                <span><strong>Tipo:</strong> {appointment.type}</span>
              </div>
              
              {appointment.location && (
                <div className="flex items-center space-x-2">
                  <MapPin size={16} className="text-gray-500" />
                  <span><strong>Local:</strong> {appointment.location}</span>
                </div>
              )}
              
              <div className="md:col-span-2">
                <strong>Status Atual:</strong>
                {currentStatusInfo && (
                  <span className={`ml-2 inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${currentStatusInfo.bgColor} ${currentStatusInfo.color}`}>
                    <currentStatusInfo.icon size={12} />
                    <span>{currentStatusInfo.label}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Workflow Progress */}
          {appointment.status !== 'cancelled' && appointment.status !== 'no_show' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Fluxo da Consulta</h3>
              <div className="flex items-center justify-between">
                {workflowSteps.map((step, index) => (
                  <React.Fragment key={step.status}>
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        step.completed ? 'bg-green-500 text-white' :
                        step.current ? 'bg-blue-500 text-white' :
                        'bg-gray-300 text-gray-600'
                      }`}>
                        {step.completed ? <CheckCircle size={16} /> : index + 1}
                      </div>
                      <span className={`text-xs mt-1 ${step.current ? 'font-medium text-blue-600' : 'text-gray-600'}`}>
                        {step.label}
                      </span>
                    </div>
                    
                    {index < workflowSteps.length - 1 && (
                      <div className={`flex-1 h-1 mx-2 ${step.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Status Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Alterar Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableTransitions.map((option) => {
                const isCurrentStatus = option.value === appointment.status;
                const canTransition = canTransitionTo(option.value);
                
                return (
                  <div
                    key={option.value}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedStatus === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : canTransition
                        ? 'border-gray-200 hover:border-gray-300'
                        : 'border-gray-100 bg-gray-50 cursor-not-allowed'
                    } ${!canTransition ? 'opacity-50' : ''}`}
                    onClick={() => canTransition && setSelectedStatus(option.value)}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-2 rounded-full ${option.bgColor}`}>
                        <option.icon size={16} className={option.color} />
                      </div>
                      <div className="flex-1">
                        <span className={`font-medium ${isCurrentStatus ? 'text-blue-600' : ''}`}>
                          {option.label}
                        </span>
                        {isCurrentStatus && (
                          <span className="text-xs text-blue-600 ml-1">(Atual)</span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">{option.description}</p>
                    
                    {option.reasonsRequired && (
                      <div className="mt-2 flex items-center space-x-1 text-xs text-orange-600">
                        <AlertCircle size={12} />
                        <span>Motivo obrigatório</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reason and Notes */}
          {selectedStatus !== appointment.status && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Detalhes da Alteração</h3>
              
              {/* Reschedule DateTime */}
              {selectedStatus === 'rescheduled' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nova Data e Hora *
                  </label>
                  <input
                    type="datetime-local"
                    value={rescheduleDateTime}
                    onChange={(e) => setRescheduleDateTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Common Reasons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo
                  {selectedStatusInfo?.reasonsRequired && <span className="text-red-500">*</span>}
                </label>
                
                {commonReasons[selectedStatus] && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-2">Motivos comuns:</p>
                    <div className="flex flex-wrap gap-2">
                      {commonReasons[selectedStatus].map((commonReason) => (
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
                )}

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

              {/* Notification Option */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={sendNotification}
                    onChange={(e) => setSendNotification(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Enviar notificação para o paciente</span>
                  <Bell size={16} className="text-gray-400" />
                </label>
              </div>
            </div>
          )}

          {/* Status History */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
              <History size={20} />
              <span>Histórico de Status</span>
            </h3>
            
            <div className="space-y-3 max-h-48 overflow-y-auto">
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
                            {statusOptions.find(s => s.value === record.fromStatus)?.label}
                          </span>
                          <ArrowRight size={16} className="text-gray-400" />
                          <span className={`px-2 py-1 text-xs rounded ${toStatusColors.bgColor} ${toStatusColors.color}`}>
                            {statusOptions.find(s => s.value === record.toStatus)?.label}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(record.changedAt)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 font-medium">{record.reason}</p>
                      {record.notes && (
                        <p className="text-sm text-gray-600 mt-1">{record.notes}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">
                          Alterado por: {record.changedBy}
                        </p>
                        {record.notificationSent && (
                          <span className="text-xs text-green-600 flex items-center space-x-1">
                            <Bell size={12} />
                            <span>Notificação enviada</span>
                          </span>
                        )}
                      </div>
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
          
          {selectedStatus !== appointment.status && (
            <button
              onClick={handleStatusChange}
              disabled={isLoading || (selectedStatusInfo?.reasonsRequired && !reason.trim()) || (selectedStatus === 'rescheduled' && !rescheduleDateTime)}
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

export default AppointmentStatusManager;