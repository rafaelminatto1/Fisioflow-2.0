import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Eye, 
  Download, 
  Trash2, 
  Clock, 
  User, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Calendar
} from 'lucide-react';
import { 
  AuditLogEntry, 
  ConsentStatus, 
  DataDeletionRequest,
  ComplianceReport 
} from '../../types';
import { 
  AuditLog,
  DataDeletionRequest as ServiceDataDeletionRequest
} from '../../services/complianceService';
import { complianceService } from '../../services/complianceService';

interface CompliancePanelProps {
  patientId: string;
  patientName: string;
  className?: string;
}

export const CompliancePanel: React.FC<CompliancePanelProps> = ({
  patientId,
  patientName,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'consent' | 'audit' | 'deletion'>('consent');
  const [consentStatus, setConsentStatus] = useState<ConsentStatus | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<ServiceDataDeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    loadComplianceData();
  }, [patientId]);

  const loadComplianceData = async () => {
    try {
      setLoading(true);
      
      const [consent, { logs }, deletions] = await Promise.all([
        complianceService.getConsentStatus(patientId),
        complianceService.getAuditLogs({ resourceType: 'patient' }, 1, 50),
        complianceService.getDeletionRequests()
      ]);

      setConsentStatus(consent);
      setAuditLogs(logs.filter(log => log.resourceId === patientId));
      setDeletionRequests(deletions.filter(req => req.patientId === patientId));
    } catch (error) {
      console.error('Error loading compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConsentChange = async (
    consentType: keyof ConsentStatus,
    granted: boolean
  ) => {
    try {
      await complianceService.updateConsent(
        patientId,
        consentType,
        granted,
        '1.0'
      );
      await loadComplianceData();
    } catch (error) {
      console.error('Error updating consent:', error);
    }
  };

  const handleExportData = async (format: 'json' | 'pdf' = 'json') => {
    try {
      const data = await complianceService.exportPatientData(patientId, 'user', format);
      
      // Create download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patient-${patientId}-data.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const handleRequestDeletion = async () => {
    if (!deleteReason.trim()) return;
    
    try {
      await complianceService.requestDataDeletion(
        patientId,
        'patient_request',
        deleteReason
      );
      setShowDeleteModal(false);
      setDeleteReason('');
      await loadComplianceData();
    } catch (error) {
      console.error('Error requesting deletion:', error);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConsentIcon = (granted: boolean, expired?: boolean) => {
    if (expired) return <XCircle className="w-5 h-5 text-red-500" />;
    return granted ? 
      <CheckCircle className="w-5 h-5 text-green-500" /> : 
      <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'VIEW_PATIENT':
        return <Eye className="w-4 h-4" />;
      case 'CREATE_PATIENT':
      case 'UPDATE_PATIENT':
        return <User className="w-4 h-4" />;
      case 'EXPORT_DATA':
        return <Download className="w-4 h-4" />;
      case 'DELETE_PATIENT':
        return <Trash2 className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border shadow-sm p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Compliance e Privacidade
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportData('json')}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Exportar Dados
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'consent', label: 'Consentimentos', icon: CheckCircle },
            { id: 'audit', label: 'Auditoria', icon: Eye },
            { id: 'deletion', label: 'Exclusão de Dados', icon: Trash2 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'consent' && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              Gerencie os consentimentos do paciente para processamento de dados conforme LGPD.
            </p>
            
            {consentStatus && (
              <div className="space-y-4">
                {Object.entries(consentStatus).map(([key, consent]) => {
                  const isExpired = consent.expiresAt && new Date(consent.expiresAt) < new Date();
                  
                  return (
                    <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getConsentIcon(consent.granted, isExpired)}
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {key === 'dataProcessing' && 'Processamento de Dados'}
                            {key === 'dataSharing' && 'Compartilhamento de Dados'}
                            {key === 'marketing' && 'Comunicações de Marketing'}
                            {key === 'research' && 'Pesquisa e Desenvolvimento'}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {consent.granted ? (
                              consent.grantedAt ? `Concedido em ${formatDate(consent.grantedAt)}` : 'Concedido'
                            ) : (
                              consent.revokedAt ? `Revogado em ${formatDate(consent.revokedAt)}` : 'Não concedido'
                            )}
                            {isExpired && ' (Expirado)'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleConsentChange(key as keyof ConsentStatus, !consent.granted)}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            consent.granted
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {consent.granted ? 'Revogar' : 'Conceder'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Histórico de todas as ações realizadas com os dados deste paciente.
            </p>
            
            <div className="space-y-2">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {log.action.replace(/_/g, ' ').toLowerCase()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Por {log.userId} • {formatDate(log.timestamp)}
                      </p>
                    </div>
                    <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      audit
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  Nenhum log de auditoria encontrado.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'deletion' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Solicite a exclusão dos dados do paciente conforme direito ao esquecimento (LGPD).
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Solicitar Exclusão
              </button>
            </div>

            <div className="space-y-2">
              {deletionRequests.length > 0 ? (
                deletionRequests.map((request) => (
                  <div key={request.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">
                        Solicitação de Exclusão
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'completed' ? 'bg-green-100 text-green-800' :
                        request.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{request.reason}</p>
                    <p className="text-xs text-gray-500">
                      Solicitado em {formatDate(request.requestDate)}
                      {request.completedAt && ` • Concluído em ${formatDate(request.completedAt)}`}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  Nenhuma solicitação de exclusão encontrada.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Solicitar Exclusão de Dados
              </h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Você está solicitando a exclusão permanente dos dados de <strong>{patientName}</strong>. 
              Esta ação é irreversível e será analisada pela equipe de compliance.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo da exclusão
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Descreva o motivo da solicitação..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleRequestDeletion}
                disabled={!deleteReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Solicitar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};