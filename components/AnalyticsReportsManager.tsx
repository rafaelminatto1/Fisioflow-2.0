import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  Activity,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Share,
  Settings,
  PieChart,
  LineChart,
  Target,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Mail,
  Printer,
  X,
  Plus
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface AnalyticsData {
  patients: {
    total: number;
    new: number;
    active: number;
    discharged: number;
    trend: number;
  };
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    showRate: number;
    trend: number;
  };
  revenue: {
    total: number;
    monthly: number;
    perPatient: number;
    trend: number;
  };
  satisfaction: {
    score: number;
    responses: number;
    trend: number;
  };
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'clinical' | 'financial' | 'operational' | 'custom';
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'on-demand';
  metrics: string[];
  charts: string[];
  filters: string[];
  lastGenerated?: string;
  isScheduled: boolean;
}

interface GeneratedReport {
  id: string;
  templateId: string;
  name: string;
  type: string;
  generatedAt: string;
  generatedBy: string;
  period: { start: string; end: string };
  status: 'generating' | 'completed' | 'error';
  format: 'pdf' | 'excel' | 'csv';
  size?: string;
  downloadUrl?: string;
  sharedWith?: string[];
}

interface AnalyticsReportsManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const AnalyticsReportsManager: React.FC<AnalyticsReportsManagerProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'scheduled'>('dashboard');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [isLoading, setIsLoading] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);

  const { showToast } = useToast();

  // Mock data initialization
  useEffect(() => {
    if (isOpen) {
      loadAnalyticsData();
      loadReportTemplates();
      loadGeneratedReports();
    }
  }, [isOpen, selectedPeriod]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Mock analytics data
      const mockData: AnalyticsData = {
        patients: {
          total: 245,
          new: 18,
          active: 189,
          discharged: 38,
          trend: 12.5
        },
        appointments: {
          total: 1250,
          completed: 1089,
          cancelled: 89,
          noShow: 72,
          showRate: 87.2,
          trend: -2.3
        },
        revenue: {
          total: 156780,
          monthly: 52260,
          perPatient: 640,
          trend: 8.7
        },
        satisfaction: {
          score: 4.7,
          responses: 203,
          trend: 3.2
        }
      };
      
      setAnalyticsData(mockData);
    } catch (error) {
      showToast('Erro ao carregar dados analíticos', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadReportTemplates = async () => {
    const templates: ReportTemplate[] = [
      {
        id: '1',
        name: 'Relatório Mensal de Pacientes',
        description: 'Análise completa da evolução dos pacientes no mês',
        type: 'clinical',
        category: 'Clínico',
        frequency: 'monthly',
        metrics: ['Novos pacientes', 'Altas', 'Taxa de adesão', 'Evolução clínica'],
        charts: ['Gráfico de evolução', 'Distribuição por condição'],
        filters: ['Período', 'Terapeuta', 'Condição'],
        isScheduled: true,
        lastGenerated: '2024-01-15'
      },
      {
        id: '2',
        name: 'Análise Financeira',
        description: 'Relatório completo de receitas, custos e rentabilidade',
        type: 'financial',
        category: 'Financeiro',
        frequency: 'monthly',
        metrics: ['Receita total', 'Receita por paciente', 'Custos operacionais'],
        charts: ['Tendência de receita', 'Distribuição por serviço'],
        filters: ['Período', 'Tipo de serviço'],
        isScheduled: true,
        lastGenerated: '2024-01-10'
      },
      {
        id: '3',
        name: 'Performance Operacional',
        description: 'Métricas de eficiência e produtividade da clínica',
        type: 'operational',
        category: 'Operacional',
        frequency: 'weekly',
        metrics: ['Taxa de ocupação', 'No-show rate', 'Tempo médio de consulta'],
        charts: ['Ocupação por sala', 'Distribuição de horários'],
        filters: ['Período', 'Sala', 'Terapeuta'],
        isScheduled: false,
        lastGenerated: '2024-01-12'
      },
      {
        id: '4',
        name: 'Satisfação do Cliente',
        description: 'Análise de satisfação e feedback dos pacientes',
        type: 'clinical',
        category: 'Qualidade',
        frequency: 'quarterly',
        metrics: ['NPS', 'Avaliação média', 'Taxa de recomendação'],
        charts: ['Evolução do NPS', 'Feedback por categoria'],
        filters: ['Período', 'Terapeuta'],
        isScheduled: true,
        lastGenerated: '2024-01-01'
      }
    ];
    setReportTemplates(templates);
  };

  const loadGeneratedReports = async () => {
    const reports: GeneratedReport[] = [
      {
        id: '1',
        templateId: '1',
        name: 'Relatório Mensal de Pacientes - Janeiro 2024',
        type: 'clinical',
        generatedAt: '2024-01-15T10:30:00',
        generatedBy: 'Dr. João Silva',
        period: { start: '2024-01-01', end: '2024-01-31' },
        status: 'completed',
        format: 'pdf',
        size: '2.3 MB',
        downloadUrl: '/reports/monthly-patients-jan2024.pdf'
      },
      {
        id: '2',
        templateId: '2',
        name: 'Análise Financeira - Dezembro 2023',
        type: 'financial',
        generatedAt: '2024-01-10T14:15:00',
        generatedBy: 'Ana Costa',
        period: { start: '2023-12-01', end: '2023-12-31' },
        status: 'completed',
        format: 'excel',
        size: '1.8 MB',
        downloadUrl: '/reports/financial-dec2023.xlsx'
      },
      {
        id: '3',
        templateId: '3',
        name: 'Performance Operacional - Semana 2',
        type: 'operational',
        generatedAt: '2024-01-12T09:00:00',
        generatedBy: 'Sistema Automático',
        period: { start: '2024-01-08', end: '2024-01-14' },
        status: 'generating',
        format: 'pdf'
      }
    ];
    setGeneratedReports(reports);
  };

  const handleGenerateReport = async (templateId: string, format: 'pdf' | 'excel' | 'csv') => {
    setIsLoading(true);
    try {
      const template = reportTemplates.find(t => t.id === templateId);
      if (!template) throw new Error('Template não encontrado');

      // Simulate report generation
      const newReport: GeneratedReport = {
        id: Date.now().toString(),
        templateId,
        name: `${template.name} - ${new Date().toLocaleDateString('pt-BR')}`,
        type: template.type,
        generatedAt: new Date().toISOString(),
        generatedBy: 'Dr. João Silva',
        period: { 
          start: new Date(Date.now() - parseInt(selectedPeriod) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        },
        status: 'generating',
        format
      };

      setGeneratedReports(prev => [newReport, ...prev]);
      showToast('Relatório sendo gerado...', 'info');

      // Simulate completion after 3 seconds
      setTimeout(() => {
        setGeneratedReports(prev => prev.map(report => 
          report.id === newReport.id 
            ? { 
                ...report, 
                status: 'completed',
                size: '2.1 MB',
                downloadUrl: `/reports/${template.name.toLowerCase().replace(/\s+/g, '-')}.${format}`
              }
            : report
        ));
        showToast('Relatório gerado com sucesso!', 'success');
      }, 3000);

    } catch (error) {
      showToast('Erro ao gerar relatório', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="text-green-600" size={16} />;
    if (trend < 0) return <TrendingUp className="text-red-600 rotate-180" size={16} />;
    return <TrendingUp className="text-gray-400" size={16} />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-green-600" size={16} />;
      case 'generating': return <Clock className="text-blue-600" size={16} />;
      case 'error': return <XCircle className="text-red-600" size={16} />;
      default: return <AlertCircle className="text-gray-400" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-800 bg-green-100';
      case 'generating': return 'text-blue-800 bg-blue-100';
      case 'error': return 'text-red-800 bg-red-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Dashboard Analítico</h3>
          <p className="text-gray-600">Visão geral dos últimos {selectedPeriod} dias</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Último ano</option>
          </select>
          
          <button
            onClick={loadAnalyticsData}
            disabled={isLoading}
            className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
          >
            <RefreshCw className={isLoading ? 'animate-spin' : ''} size={16} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Patients */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="text-blue-600" size={24} />
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon(analyticsData.patients.trend)}
                <span className={`text-sm font-medium ${getTrendColor(analyticsData.patients.trend)}`}>
                  {Math.abs(analyticsData.patients.trend)}%
                </span>
              </div>
            </div>
            <div>
              <h4 className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.patients.total)}</h4>
              <p className="text-gray-600">Total de Pacientes</p>
              <div className="mt-2 text-sm text-gray-500">
                <span className="text-green-600 font-medium">{analyticsData.patients.new} novos</span> • 
                <span className="ml-1">{analyticsData.patients.active} ativos</span>
              </div>
            </div>
          </div>

          {/* Appointments */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Calendar className="text-green-600" size={24} />
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon(analyticsData.appointments.trend)}
                <span className={`text-sm font-medium ${getTrendColor(analyticsData.appointments.trend)}`}>
                  {Math.abs(analyticsData.appointments.trend)}%
                </span>
              </div>
            </div>
            <div>
              <h4 className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.appointments.total)}</h4>
              <p className="text-gray-600">Consultas</p>
              <div className="mt-2 text-sm text-gray-500">
                <span className="text-green-600 font-medium">{analyticsData.appointments.showRate}% comparecimento</span>
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <DollarSign className="text-yellow-600" size={24} />
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon(analyticsData.revenue.trend)}
                <span className={`text-sm font-medium ${getTrendColor(analyticsData.revenue.trend)}`}>
                  {Math.abs(analyticsData.revenue.trend)}%
                </span>
              </div>
            </div>
            <div>
              <h4 className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.revenue.total)}</h4>
              <p className="text-gray-600">Receita Total</p>
              <div className="mt-2 text-sm text-gray-500">
                <span className="text-blue-600 font-medium">{formatCurrency(analyticsData.revenue.perPatient)}</span> por paciente
              </div>
            </div>
          </div>

          {/* Satisfaction */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Activity className="text-purple-600" size={24} />
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon(analyticsData.satisfaction.trend)}
                <span className={`text-sm font-medium ${getTrendColor(analyticsData.satisfaction.trend)}`}>
                  {Math.abs(analyticsData.satisfaction.trend)}%
                </span>
              </div>
            </div>
            <div>
              <h4 className="text-2xl font-bold text-gray-900">{analyticsData.satisfaction.score}/5</h4>
              <p className="text-gray-600">Satisfação</p>
              <div className="mt-2 text-sm text-gray-500">
                <span className="text-purple-600 font-medium">{analyticsData.satisfaction.responses}</span> avaliações
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">Evolução de Pacientes</h4>
            <LineChart className="text-blue-600" size={20} />
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Gráfico de linha seria renderizado aqui</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">Distribuição de Consultas</h4>
            <PieChart className="text-green-600" size={20} />
          </div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Gráfico de pizza seria renderizado aqui</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Ações Rápidas</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleGenerateReport('1', 'pdf')}
            className="p-4 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 text-left"
          >
            <FileText className="text-blue-600 mb-2" size={20} />
            <h5 className="font-medium text-gray-800">Relatório Mensal</h5>
            <p className="text-sm text-gray-600">Gerar relatório de pacientes</p>
          </button>
          
          <button
            onClick={() => handleGenerateReport('2', 'excel')}
            className="p-4 bg-white border border-green-200 rounded-lg hover:bg-green-50 text-left"
          >
            <BarChart3 className="text-green-600 mb-2" size={20} />
            <h5 className="font-medium text-gray-800">Análise Financeira</h5>
            <p className="text-sm text-gray-600">Relatório de receitas</p>
          </button>
          
          <button
            onClick={() => setActiveTab('reports')}
            className="p-4 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 text-left"
          >
            <Target className="text-purple-600 mb-2" size={20} />
            <h5 className="font-medium text-gray-800">Ver Todos</h5>
            <p className="text-sm text-gray-600">Todos os relatórios</p>
          </button>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Relatórios Disponíveis</h3>
          <p className="text-gray-600">Templates e relatórios gerados</p>
        </div>
        
        <button
          onClick={() => setShowReportForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Novo Template</span>
        </button>
      </div>

      {/* Report Templates */}
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Templates de Relatórios</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportTemplates.map((template) => (
            <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h5 className="font-semibold text-gray-800">{template.name}</h5>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                </div>
                
                <span className={`px-2 py-1 text-xs rounded-full ${
                  template.type === 'clinical' ? 'bg-blue-100 text-blue-800' :
                  template.type === 'financial' ? 'bg-green-100 text-green-800' :
                  template.type === 'operational' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {template.category}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock size={14} className="mr-2" />
                  <span>Frequência: {template.frequency}</span>
                </div>
                
                {template.lastGenerated && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar size={14} className="mr-2" />
                    <span>Último: {new Date(template.lastGenerated).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {template.isScheduled && (
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                      Agendado
                    </span>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleGenerateReport(template.id, 'pdf')}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                    title="Gerar PDF"
                  >
                    <FileText size={16} />
                  </button>
                  
                  <button
                    onClick={() => handleGenerateReport(template.id, 'excel')}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                    title="Gerar Excel"
                  >
                    <BarChart3 size={16} />
                  </button>
                  
                  <button
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-md"
                    title="Configurar"
                  >
                    <Settings size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generated Reports */}
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Relatórios Gerados</h4>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Nome</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Período</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Gerado por</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {generatedReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-800">{report.name}</p>
                        <p className="text-sm text-gray-600">{report.format.toUpperCase()}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        report.type === 'clinical' ? 'bg-blue-100 text-blue-800' :
                        report.type === 'financial' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {report.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <p>{new Date(report.period.start).toLocaleDateString('pt-BR')}</p>
                        <p className="text-gray-500">até {new Date(report.period.end).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <p className="font-medium">{report.generatedBy}</p>
                        <p className="text-gray-500">{new Date(report.generatedAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(report.status)}
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(report.status)}`}>
                          {report.status === 'completed' ? 'Concluído' :
                           report.status === 'generating' ? 'Gerando...' :
                           'Erro'}
                        </span>
                      </div>
                      {report.size && (
                        <p className="text-xs text-gray-500 mt-1">{report.size}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        {report.status === 'completed' && (
                          <>
                            <button
                              onClick={() => window.open(report.downloadUrl, '_blank')}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Download"
                            >
                              <Download size={14} />
                            </button>
                            
                            <button
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Compartilhar"
                            >
                              <Share size={14} />
                            </button>
                            
                            <button
                              className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                              title="Enviar por email"
                            >
                              <Mail size={14} />
                            </button>
                          </>
                        )}
                        
                        <button
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          title="Visualizar"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderScheduled = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Relatórios Agendados</h3>
          <p className="text-gray-600">Configuração de relatórios automáticos</p>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-3">
          <Clock className="text-yellow-600" size={20} />
          <h4 className="font-semibold text-yellow-800">Funcionalidade em Desenvolvimento</h4>
        </div>
        <p className="text-yellow-700">
          O sistema de relatórios agendados será implementado na próxima versão. 
          Inclui configuração de frequência, destinatários automáticos e alertas personalizados.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTemplates.filter(t => t.isScheduled).map((template) => (
          <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-gray-800">{template.name}</h5>
              <span className="w-3 h-3 bg-green-400 rounded-full"></span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p>Frequência: {template.frequency}</p>
              <p>Último: {template.lastGenerated ? new Date(template.lastGenerated).toLocaleDateString('pt-BR') : 'Nunca'}</p>
              <p>Próximo: Calculando...</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <BarChart3 className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-gray-800">Analytics & Relatórios</h2>
              <p className="text-gray-600">Sistema de análise e geração de relatórios</p>
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
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'reports', label: 'Relatórios', icon: FileText },
              { id: 'scheduled', label: 'Agendados', icon: Clock }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'reports' && renderReports()}
          {activeTab === 'scheduled' && renderScheduled()}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReportsManager;