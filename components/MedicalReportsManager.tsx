import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Print, 
  Search, 
  Calendar, 
  Filter,
  X,
  Save,
  Upload,
  AlertCircle,
  Check,
  Clock,
  User,
  Hospital,
  Stethoscope,
  Activity
} from 'lucide-react';
import { Patient } from '../types';
import { useToast } from '../contexts/ToastContext';

interface MedicalReport {
  id: string;
  patientId: string;
  type: 'atestado' | 'laudo' | 'relatorio' | 'declaracao' | 'encaminhamento';
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
  issuedDate: string;
  status: 'draft' | 'issued' | 'sent';
  recipient?: string;
  attachments?: Array<{ name: string; url: string; type: string }>;
  templateUsed?: string;
  digitalSignature?: {
    signed: boolean;
    signedBy: string;
    signedAt: string;
    certificate: string;
  };
}

interface MedicalReportsManagerProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
}

const MedicalReportsManager: React.FC<MedicalReportsManagerProps> = ({
  patient,
  isOpen,
  onClose
}) => {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<MedicalReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState<MedicalReport | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { showToast } = useToast();

  const reportTypes = [
    { value: 'atestado', label: 'Atestado Médico', icon: FileText, color: 'bg-blue-100 text-blue-800' },
    { value: 'laudo', label: 'Laudo Fisioterapêutico', icon: Stethoscope, color: 'bg-green-100 text-green-800' },
    { value: 'relatorio', label: 'Relatório de Evolução', icon: Activity, color: 'bg-purple-100 text-purple-800' },
    { value: 'declaracao', label: 'Declaração', icon: FileText, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'encaminhamento', label: 'Encaminhamento', icon: Hospital, color: 'bg-orange-100 text-orange-800' }
  ];

  const statusOptions = [
    { value: 'draft', label: 'Rascunho', color: 'bg-gray-100 text-gray-800', icon: Edit },
    { value: 'issued', label: 'Emitido', color: 'bg-green-100 text-green-800', icon: Check },
    { value: 'sent', label: 'Enviado', color: 'bg-blue-100 text-blue-800', icon: Upload }
  ];

  const reportTemplates = {
    atestado: `ATESTADO MÉDICO

Eu, [TERAPEUTA], fisioterapeuta, CREFITO [CREFITO], atesto para os devidos fins que o(a) paciente [PACIENTE], portador(a) do CPF [CPF], encontra-se sob meus cuidados profissionais.

Diagnóstico: [DIAGNOSTICO]

Período de tratamento: [PERIODO]

Recomendações: [RECOMENDACOES]

Por ser verdade, firmo o presente atestado.

[CIDADE], [DATA]

________________________________
[TERAPEUTA]
CREFITO [CREFITO]`,

    laudo: `LAUDO FISIOTERAPÊUTICO

IDENTIFICAÇÃO DO PACIENTE:
Nome: [PACIENTE]
CPF: [CPF]
Data de Nascimento: [DATA_NASCIMENTO]

ANAMNESE:
[ANAMNESE]

EXAME FÍSICO:
[EXAME_FISICO]

DIAGNÓSTICO FISIOTERAPÊUTICO:
[DIAGNOSTICO]

OBJETIVOS DO TRATAMENTO:
[OBJETIVOS]

PLANO DE TRATAMENTO:
[PLANO_TRATAMENTO]

PROGNÓSTICO:
[PROGNOSTICO]

RECOMENDAÇÕES:
[RECOMENDACOES]

[CIDADE], [DATA]

________________________________
[TERAPEUTA]
Fisioterapeuta - CREFITO [CREFITO]`,

    relatorio: `RELATÓRIO DE EVOLUÇÃO FISIOTERAPÊUTICA

DADOS DO PACIENTE:
Nome: [PACIENTE]
CPF: [CPF]

PERÍODO AVALIADO:
De [DATA_INICIO] a [DATA_FIM]

EVOLUÇÃO CLÍNICA:
[EVOLUCAO]

OBJETIVOS ALCANÇADOS:
[OBJETIVOS_ALCANCADOS]

CONDUTAS REALIZADAS:
[CONDUTAS]

EVOLUÇÃO FUNCIONAL:
[EVOLUCAO_FUNCIONAL]

RECOMENDAÇÕES:
[RECOMENDACOES]

PRÓXIMOS PASSOS:
[PROXIMOS_PASSOS]

[CIDADE], [DATA]

________________________________
[TERAPEUTA]
Fisioterapeuta - CREFITO [CREFITO]`
  };

  useEffect(() => {
    if (isOpen && patient.id) {
      loadReports();
    }
  }, [isOpen, patient.id]);

  useEffect(() => {
    filterReports();
  }, [reports, searchTerm, typeFilter, statusFilter]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      // Mock data - in real app would come from API
      const mockReports: MedicalReport[] = [
        {
          id: '1',
          patientId: patient.id,
          type: 'atestado',
          title: 'Atestado para Atividade Física',
          content: 'Atesto que o paciente está apto para atividades físicas...',
          createdBy: 'Dr. João Silva',
          createdAt: '2024-01-15',
          issuedDate: '2024-01-15',
          status: 'issued',
          recipient: 'Academia Fitness Plus'
        },
        {
          id: '2',
          patientId: patient.id,
          type: 'laudo',
          title: 'Laudo de Fisioterapia - Lombalgia',
          content: 'Laudo detalhado sobre o tratamento de lombalgia...',
          createdBy: 'Dr. João Silva',
          createdAt: '2024-01-10',
          issuedDate: '2024-01-12',
          status: 'sent',
          recipient: 'Dr. Maria Santos - Ortopedista'
        }
      ];
      setReports(mockReports);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Erro ao carregar relatórios', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = [...reports];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(term) ||
        report.content.toLowerCase().includes(term) ||
        report.createdBy.toLowerCase().includes(term)
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(report => report.type === typeFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    setFilteredReports(filtered);
  };

  const handleSaveReport = async (reportData: Partial<MedicalReport>) => {
    try {
      if (editingReport) {
        const updatedReport = { ...editingReport, ...reportData };
        setReports(prev => prev.map(report => report.id === updatedReport.id ? updatedReport : report));
        showToast('Relatório atualizado com sucesso', 'success');
      } else {
        const newReport: MedicalReport = {
          id: Date.now().toString(),
          patientId: patient.id,
          createdBy: 'Dr. João Silva', // In real app, get from auth context
          createdAt: new Date().toISOString().split('T')[0],
          status: 'draft',
          ...reportData
        } as MedicalReport;
        
        setReports(prev => [newReport, ...prev]);
        showToast('Relatório criado com sucesso', 'success');
      }
      
      setShowForm(false);
      setEditingReport(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Erro ao salvar relatório', 'error');
    }
  };

  const handleDeleteReport = (reportId: string) => {
    if (confirm('Tem certeza que deseja excluir este relatório?')) {
      setReports(prev => prev.filter(report => report.id !== reportId));
      showToast('Relatório excluído com sucesso', 'success');
      
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
      }
    }
  };

  const getReportTypeInfo = (type: string) => {
    return reportTypes.find(t => t.value === type) || reportTypes[0];
  };

  const getStatusInfo = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const ReportForm: React.FC<{ report?: MedicalReport; onSave: (data: Partial<MedicalReport>) => void; onCancel: () => void }> = ({
    report,
    onSave,
    onCancel
  }) => {
    const [formData, setFormData] = useState({
      type: report?.type || 'atestado',
      title: report?.title || '',
      content: report?.content || '',
      issuedDate: report?.issuedDate || new Date().toISOString().split('T')[0],
      recipient: report?.recipient || '',
      status: report?.status || 'draft'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    const loadTemplate = () => {
      const template = reportTemplates[formData.type as keyof typeof reportTemplates];
      if (template) {
        setFormData(prev => ({ ...prev, content: template }));
        showToast('Template carregado', 'info');
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {report ? 'Editar Relatório' : 'Novo Relatório'}
          </h3>
          <button
            onClick={loadTemplate}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Carregar Template
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Relatório *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              >
                {reportTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Emissão</label>
              <input
                type="date"
                value={formData.issuedDate}
                onChange={(e) => setFormData({ ...formData, issuedDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Destinatário</label>
              <input
                type="text"
                value={formData.recipient}
                onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Nome do destinatário, instituição, etc."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo *</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Digite o conteúdo do relatório..."
                required
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
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center space-x-2"
            >
              <Save size={16} />
              <span>Salvar</span>
            </button>
          </div>
        </form>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FileText className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-800">Relatórios Médicos</h2>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          {showForm ? (
            <ReportForm
              report={editingReport || undefined}
              onSave={handleSaveReport}
              onCancel={() => {
                setShowForm(false);
                setEditingReport(null);
              }}
            />
          ) : selectedReport ? (
            // Report Detail View
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    ←
                  </button>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{selectedReport.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{getReportTypeInfo(selectedReport.type).label}</span>
                      <span>•</span>
                      <span>{new Date(selectedReport.issuedDate).toLocaleDateString('pt-BR')}</span>
                      <span>•</span>
                      <span>{selectedReport.createdBy}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusInfo(selectedReport.status).color}`}>
                    {getStatusInfo(selectedReport.status).label}
                  </span>
                  
                  <button
                    onClick={() => {
                      setEditingReport(selectedReport);
                      setShowForm(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                  >
                    <Edit size={16} />
                  </button>
                  
                  <button
                    onClick={() => window.print()}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-md"
                  >
                    <Print size={16} />
                  </button>
                </div>
              </div>

              {selectedReport.recipient && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-1">Destinatário</h4>
                  <p className="text-gray-900">{selectedReport.recipient}</p>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">
                    {selectedReport.content}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            // Reports List
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Relatórios e Documentos</h3>
                  <p className="text-gray-600">{reports.length} documentos</p>
                </div>
                <button
                  onClick={() => {
                    setEditingReport(null);
                    setShowForm(true);
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Novo Relatório</span>
                </button>
              </div>

              {/* Filters */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar relatórios..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos os tipos</option>
                    {reportTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos os status</option>
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>

                {(searchTerm || typeFilter || statusFilter) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setTypeFilter('');
                      setStatusFilter('');
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                  >
                    <X size={14} />
                    <span>Limpar filtros</span>
                  </button>
                )}
              </div>

              {/* Reports List */}
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Carregando relatórios...</p>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {reports.length === 0 ? 'Nenhum relatório encontrado' : 'Nenhum relatório encontrado com os filtros aplicados'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {reports.length === 0 ? 'Comece criando o primeiro relatório para este paciente.' : 'Tente ajustar os filtros para encontrar os relatórios desejados.'}
                  </p>
                  {reports.length === 0 && (
                    <button
                      onClick={() => {
                        setEditingReport(null);
                        setShowForm(true);
                      }}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                    >
                      Criar primeiro relatório
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReports.map((report) => {
                    const typeInfo = getReportTypeInfo(report.type);
                    const statusInfo = getStatusInfo(report.status);
                    
                    return (
                      <div key={report.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <typeInfo.icon className="text-gray-600" size={20} />
                              <h4 className="font-semibold text-gray-900">{report.title}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${statusInfo.color}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center space-x-4">
                                <span className="flex items-center space-x-1">
                                  <Calendar size={14} />
                                  <span>{new Date(report.issuedDate).toLocaleDateString('pt-BR')}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <User size={14} />
                                  <span>{report.createdBy}</span>
                                </span>
                              </div>
                              
                              {report.recipient && (
                                <p className="text-gray-600">Destinatário: {report.recipient}</p>
                              )}
                              
                              <p className="text-gray-600 line-clamp-2 mt-2">
                                {report.content.substring(0, 200)}...
                              </p>
                            </div>
                          </div>

                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => setSelectedReport(report)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                              title="Visualizar"
                            >
                              <Eye size={16} />
                            </button>
                            
                            <button
                              onClick={() => {
                                setEditingReport(report);
                                setShowForm(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                              title="Editar"
                            >
                              <Edit size={16} />
                            </button>
                            
                            <button
                              onClick={() => window.print()}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-md"
                              title="Imprimir"
                            >
                              <Print size={16} />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteReport(report.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalReportsManager;