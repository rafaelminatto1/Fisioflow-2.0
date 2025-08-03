import { useState, useEffect } from 'react';
import { 
  Settings, 
  BarChart3, 
  Database, 
  Brain, 
  AlertTriangle, 
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Trash2
} from 'lucide-react';
import { 
  PremiumProvider, 
  AnalyticsData,
  Alert as AlertType
} from '../../types/ai-economica.types';
import AIService from '../../services/ai-economica/aiService';
import AnalyticsService from '../../services/ai-economica/analyticsService';
import PremiumAccountManager from '../../services/ai-economica/premiumAccountManager';
import CacheService from '../../services/ai-economica/cacheService';
import KnowledgeBaseService from '../../services/ai-economica/knowledgeBaseService';

interface AdminPanelProps {
  className?: string;
}

const AdminPanel = ({ className = '' }: AdminPanelProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [serviceStats, setServiceStats] = useState<any>(null);
  const [providerTests, setProviderTests] = useState<Record<PremiumProvider, boolean>>({
    [PremiumProvider.CHATGPT_PLUS]: false,
    [PremiumProvider.GEMINI_PRO]: false,
    [PremiumProvider.CLAUDE_PRO]: false,
    [PremiumProvider.PERPLEXITY_PRO]: false,
    [PremiumProvider.MARS_AI_PRO]: false
  });
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Services
  const aiService = new AIService();
  const analyticsService = new AnalyticsService();
  const premiumManager = new PremiumAccountManager();
  const cacheService = new CacheService();
  const knowledgeBase = new KnowledgeBaseService();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [
        analyticsData,
        serviceStatsData,
        providerTestResults
      ] = await Promise.all([
        analyticsService.getCurrentAnalytics(),
        aiService.getServiceStats(),
        aiService.testAllProviders()
      ]);

      setAnalytics(analyticsData);
      setServiceStats(serviceStatsData);
      setProviderTests(providerTestResults);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const handleClearCache = async () => {
    if (confirm('Tem certeza que deseja limpar todo o cache?')) {
      await aiService.clearCache();
      await refreshData();
    }
  };

  const exportAnalytics = () => {
    if (analytics) {
      const dataStr = JSON.stringify(analytics, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `analytics_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'providers', label: 'Provedores', icon: Brain },
    { id: 'knowledge', label: 'Base de Conhecimento', icon: Database },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-lg">Carregando dados...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Painel de Administração - IA Econômica</h1>
          <div className="flex gap-3">
            <button
              onClick={exportAnalytics}
              className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab 
            analytics={analytics} 
            serviceStats={serviceStats} 
          />
        )}
        
        {activeTab === 'providers' && (
          <ProvidersTab 
            providerTests={providerTests}
            serviceStats={serviceStats}
            onRefresh={refreshData}
          />
        )}
        
        {activeTab === 'knowledge' && (
          <KnowledgeTab />
        )}
        
        {activeTab === 'performance' && (
          <PerformanceTab 
            analytics={analytics}
            onClearCache={handleClearCache}
          />
        )}
        
        {activeTab === 'alerts' && (
          <AlertsTab alerts={alerts} />
        )}
        
        {activeTab === 'settings' && (
          <SettingsTab />
        )}
      </div>
    </div>
  );
};

// Componente Overview Tab
const OverviewTab = ({ analytics, serviceStats }: { analytics: AnalyticsData | null, serviceStats: any }) => {
  if (!analytics || !serviceStats) return <div>Carregando...</div>;

  const economyReport = {
    totalSavings: analytics.economy.estimatedSavings + analytics.economy.costAvoidance,
    monthlyProjection: analytics.economy.estimatedSavings * 1.2,
    roi: analytics.economy.costAvoidance > 0 ? analytics.economy.estimatedSavings / analytics.economy.costAvoidance : 0
  };

  return (
    <div className="space-y-6">
      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total de Consultas</p>
              <p className="text-2xl font-bold text-blue-900">{analytics.queries.total}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Economia Estimada</p>
              <p className="text-2xl font-bold text-green-900">
                ${economyReport.totalSavings.toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Tempo Médio de Resposta</p>
              <p className="text-2xl font-bold text-purple-900">
                {analytics.performance.averageResponseTime.toFixed(0)}ms
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Taxa de Cache Hit</p>
              <p className="text-2xl font-bold text-orange-900">
                {(analytics.performance.cacheHitRate * 100).toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Fonte */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Distribuição por Fonte</h3>
          <div className="space-y-3">
            {Object.entries(analytics.queries.bySource).map(([source, count]) => {
              const percentage = (count / analytics.queries.total) * 100;
              const colors = {
                internal: 'bg-green-500',
                cache: 'bg-blue-500',
                premium: 'bg-orange-500'
              };
              
              return (
                <div key={source} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${colors[source as keyof typeof colors]}`} />
                    <span className="capitalize">{source}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">{count}</span>
                    <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Economia por Provedor */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Uso por Provedor Premium</h3>
          <div className="space-y-3">
            {Object.entries(analytics.economy.premiumUsageByProvider).map(([provider, usage]) => (
              <div key={provider} className="flex items-center justify-between">
                <span className="capitalize">{provider.replace('_', ' ')}</span>
                <span className="text-sm font-medium">{usage} tokens</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projeção de Economia */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Projeção de Economia</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Este Mês</p>
            <p className="text-2xl font-bold text-green-600">
              ${economyReport.totalSavings.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Projeção Mensal</p>
            <p className="text-2xl font-bold text-blue-600">
              ${economyReport.monthlyProjection.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">ROI</p>
            <p className="text-2xl font-bold text-purple-600">
              {economyReport.roi.toFixed(1)}x
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente Providers Tab
const ProvidersTab = ({ 
  providerTests, 
  serviceStats, 
  onRefresh 
}: { 
  providerTests: Record<PremiumProvider, boolean>,
  serviceStats: any,
  onRefresh: () => void
}) => {
  const providerLabels = {
    [PremiumProvider.CHATGPT_PLUS]: 'ChatGPT Plus',
    [PremiumProvider.GEMINI_PRO]: 'Google Gemini Pro',
    [PremiumProvider.CLAUDE_PRO]: 'Claude Pro',
    [PremiumProvider.PERPLEXITY_PRO]: 'Perplexity Pro',
    [PremiumProvider.MARS_AI_PRO]: 'Mars AI Pro'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Status dos Provedores Premium</h3>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Testar Conexões
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(providerLabels).map(([provider, label]) => {
          const isOnline = providerTests[provider as PremiumProvider];
          const stats = serviceStats?.providers?.[provider];
          
          return (
            <div key={provider} className="border rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{label}</h4>
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              {stats && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Status:</span>
                    <span className={`font-medium ${
                      stats.status === 'available' ? 'text-green-600' :
                      stats.status === 'warning' ? 'text-yellow-600' :
                      stats.status === 'critical' ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {stats.status}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Uso Mensal:</span>
                    <span>{stats.usage.monthly.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Limite Mensal:</span>
                    <span>{stats.limits.monthly.toLocaleString()}</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        stats.percentage < 0.6 ? 'bg-green-500' :
                        stats.percentage < 0.8 ? 'bg-yellow-500' :
                        stats.percentage < 0.95 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(stats.percentage * 100, 100)}%` }}
                    />
                  </div>
                  
                  <div className="text-xs text-gray-600 text-center">
                    {(stats.percentage * 100).toFixed(1)}% utilizado
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Componente Knowledge Tab
const KnowledgeTab = () => {
  const [stats, setStats] = useState<any>(null);
  const knowledgeBase = new KnowledgeBaseService();

  useEffect(() => {
    loadKnowledgeStats();
  }, []);

  const loadKnowledgeStats = async () => {
    try {
      const statistics = await knowledgeBase.getStatistics();
      setStats(statistics);
    } catch (error) {
      console.error('Erro ao carregar estatísticas da base de conhecimento:', error);
    }
  };

  if (!stats) return <div>Carregando estatísticas...</div>;

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <h4 className="font-medium text-blue-900 mb-2">Total de Entradas</h4>
          <p className="text-3xl font-bold text-blue-600">{stats.totalEntries}</p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-6">
          <h4 className="font-medium text-green-900 mb-2">Confiança Média</h4>
          <p className="text-3xl font-bold text-green-600">
            {(stats.averageConfidence * 100).toFixed(1)}%
          </p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-6">
          <h4 className="font-medium text-purple-900 mb-2">Taxa de Sucesso</h4>
          <p className="text-3xl font-bold text-purple-600">
            {(stats.averageSuccessRate * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Distribuição por Tipo */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Distribuição por Tipo</h3>
        <div className="space-y-3">
          {Object.entries(stats.byType).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between">
              <span className="capitalize">{type}</span>
              <span className="font-medium">{count as number}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Entradas Mais Usadas */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Conhecimentos Mais Utilizados</h3>
        <div className="space-y-3">
          {stats.mostUsed.slice(0, 5).map((entry: any, index: number) => (
            <div key={entry.id} className="flex items-center justify-between p-3 bg-white rounded border">
              <div className="flex-1">
                <p className="font-medium">{entry.title}</p>
                <p className="text-sm text-gray-600">Por {entry.author.name}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{entry.usageCount} usos</p>
                <p className="text-sm text-gray-600">
                  Confiança: {(entry.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente Performance Tab
const PerformanceTab = ({ 
  analytics, 
  onClearCache 
}: { 
  analytics: AnalyticsData | null,
  onClearCache: () => void
}) => {
  const [cacheStats, setCacheStats] = useState<any>(null);
  const cacheService = new CacheService();

  useEffect(() => {
    loadCacheStats();
  }, []);

  const loadCacheStats = async () => {
    try {
      const stats = await cacheService.getStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas do cache:', error);
    }
  };

  if (!analytics) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      {/* Métricas de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <h4 className="font-medium text-blue-900 mb-2">Tempo Médio de Resposta</h4>
          <p className="text-3xl font-bold text-blue-600">
            {analytics.performance.averageResponseTime.toFixed(0)}ms
          </p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-6">
          <h4 className="font-medium text-green-900 mb-2">Taxa de Cache Hit</h4>
          <p className="text-3xl font-bold text-green-600">
            {(analytics.performance.cacheHitRate * 100).toFixed(1)}%
          </p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-6">
          <h4 className="font-medium text-purple-900 mb-2">Sucesso Base Interna</h4>
          <p className="text-3xl font-bold text-purple-600">
            {(analytics.performance.internalSuccessRate * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Cache Management */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Gerenciamento de Cache</h3>
          <button
            onClick={onClearCache}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Limpar Cache
          </button>
        </div>

        {cacheStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Entradas em Memória</p>
              <p className="text-xl font-bold">{cacheStats.memoryEntries}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Entradas LocalStorage</p>
              <p className="text-xl font-bold">{cacheStats.localStorageEntries}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Entradas IndexedDB</p>
              <p className="text-xl font-bold">{cacheStats.indexedDBEntries}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Tamanho Total</p>
              <p className="text-xl font-bold">
                {(cacheStats.totalSize / 1024).toFixed(1)}KB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente Alerts Tab
const AlertsTab = ({ alerts }: { alerts: AlertType[] }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Alertas do Sistema</h3>
      
      {alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum alerta ativo</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border-l-4 p-4 rounded-lg ${
                alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{alert.message}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                  {alert.provider && (
                    <p className="text-sm text-gray-600">
                      Provedor: {alert.provider}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                  alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                  alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {alert.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente Settings Tab
const SettingsTab = () => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Configurações do Sistema</h3>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <p className="text-yellow-800">
            As configurações avançadas estão em desenvolvimento. 
            Por enquanto, as configurações podem ser alteradas no arquivo de configuração.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6">
          <h4 className="font-medium mb-4">Base de Conhecimento</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Habilitada</span>
              <span className="text-green-600">Sim</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Threshold de Confiança</span>
              <span>0.7</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Busca Fuzzy</span>
              <span className="text-green-600">Sim</span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6">
          <h4 className="font-medium mb-4">Cache</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Habilitado</span>
              <span className="text-green-600">Sim</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Tamanho Máximo</span>
              <span>100MB</span>
            </div>
            <div className="flex justify-between items-center">
              <span>TTL Padrão</span>
              <span>24h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;