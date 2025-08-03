import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Activity,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  Filter,
  UserCheck,
  UserX,
  UserPlus
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { analyticsService } from '../services/analyticsService';
import { 
  AnalyticsMetric, 
  DemographicData, 
  TrendData, 
  PatientSegment,
  PredictiveMetrics as TypesPredictiveMetrics,
  PerformanceMetrics as TypesPerformanceMetrics 
} from '../types';
import { 
  PredictiveMetrics, 
  PerformanceMetrics 
} from '../services/analyticsService';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: React.ReactNode;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon, 
  loading = false 
}) => {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-2"></div>
          ) : (
            <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          )}
          {change !== undefined && !loading && (
            <div className={`flex items-center mt-2 text-sm ${
              changeType === 'increase' ? 'text-green-600' : 'text-red-600'
            }`}>
              {changeType === 'increase' ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <div className="text-gray-400">
          {icon}
        </div>
      </div>
    </div>
  );
};

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
  onExport?: () => void;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children, loading = false, onExport }) => {
  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {onExport && (
          <button
            onClick={onExport}
            className="text-gray-400 hover:text-gray-600"
            title="Exportar dados"
          >
            <Download className="w-5 h-5" />
          </button>
        )}
      </div>
      {loading ? (
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      ) : (
        children
      )}
    </div>
  );
};

const PatientAnalyticsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [demographics, setDemographics] = useState<DemographicData | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [segments, setSegments] = useState<PatientSegment[]>([]);
  const [predictive, setPredictive] = useState<PredictiveMetrics | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const [
        metricsData,
        demographicsData,
        trendsData,
        segmentsData,
        predictiveData,
        performanceData
      ] = await Promise.all([
        analyticsService.getBasicMetrics(),
        analyticsService.getDemographicData(),
        analyticsService.getTrendData(selectedPeriod),
        analyticsService.getPatientSegments(),
        analyticsService.getPredictiveMetrics(),
        analyticsService.getPerformanceMetrics()
      ]);

      setMetrics(metricsData);
      setDemographics(demographicsData);
      setTrends(trendsData);
      setSegments(segmentsData);
      setPredictive(predictiveData as TypesPredictiveMetrics);
      setPerformance(performanceData as TypesPerformanceMetrics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const exportData = (type: string) => {
    // In a real implementation, this would export the data
    console.log(`Exporting ${type} data...`);
  };

  const mainMetrics = useMemo(() => {
    if (!metrics.length) return [];
    
    return [
      {
        title: 'Total de Pacientes',
        value: metrics.find(m => m.id === 'total_patients')?.value || 0,
        change: metrics.find(m => m.id === 'total_patients')?.trend,
        changeType: (metrics.find(m => m.id === 'total_patients')?.trend || 0) >= 0 ? 'increase' as const : 'decrease' as const,
        icon: <Users className="w-8 h-8" />
      },
      {
        title: 'Pacientes Ativos',
        value: metrics.find(m => m.id === 'active_patients')?.value || 0,
        change: metrics.find(m => m.id === 'active_patients')?.trend,
        changeType: (metrics.find(m => m.id === 'active_patients')?.trend || 0) >= 0 ? 'increase' as const : 'decrease' as const,
        icon: <UserCheck className="w-8 h-8" />
      },
      {
        title: 'Novos Pacientes (Mês)',
        value: metrics.find(m => m.id === 'new_patients_month')?.value || 0,
        change: metrics.find(m => m.id === 'new_patients_month')?.trend,
        changeType: (metrics.find(m => m.id === 'new_patients_month')?.trend || 0) >= 0 ? 'increase' as const : 'decrease' as const,
        icon: <UserPlus className="w-8 h-8" />
      },
      {
        title: 'Pacientes de Alta',
        value: metrics.find(m => m.id === 'discharged_patients')?.value || 0,
        change: metrics.find(m => m.id === 'discharged_patients')?.trend,
        changeType: (metrics.find(m => m.id === 'discharged_patients')?.trend || 0) >= 0 ? 'increase' as const : 'decrease' as const,
        icon: <UserX className="w-8 h-8" />
      }
    ];
  }, [metrics]);

  return (
    <>
      <PageHeader
        title="Analytics de Pacientes"
        subtitle="Análise detalhada de dados e métricas dos pacientes."
      >
        <div className="flex items-center gap-3">
          {/* Period Filter */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">Última Semana</option>
            <option value="month">Último Mês</option>
            <option value="quarter">Último Trimestre</option>
            <option value="year">Último Ano</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              refreshing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>

          {/* Export Button */}
          <button
            onClick={() => exportData('full_report')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Relatório
          </button>
        </div>
      </PageHeader>

      <div className="space-y-6">
        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainMetrics.map((metric, index) => (
            <MetricCard
              key={index}
              title={metric.title}
              value={metric.value}
              change={metric.change}
              changeType={metric.changeType}
              icon={metric.icon}
              loading={loading}
            />
          ))}
        </div>

        {/* Performance Metrics */}
        {performance && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Taxa de Retenção"
              value={`${(performance.patientRetentionRate * 100).toFixed(1)}%`}
              icon={<Activity className="w-8 h-8" />}
              loading={loading}
            />
            <MetricCard
              title="Duração Média do Tratamento"
              value={`${performance.averageTreatmentDuration} dias`}
              icon={<Calendar className="w-8 h-8" />}
              loading={loading}
            />
            <MetricCard
              title="Taxa de Comparecimento"
              value={`${(performance.appointmentShowRate * 100).toFixed(1)}%`}
              icon={<UserCheck className="w-8 h-8" />}
              loading={loading}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Demographics Chart */}
          <ChartCard
            title="Distribuição por Faixa Etária"
            loading={loading}
            onExport={() => exportData('age_distribution')}
          >
            {demographics && (
              <div className="space-y-4">
                {demographics.ageDistribution.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{item.range} anos</span>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>

          {/* Status Distribution */}
          <ChartCard
            title="Distribuição por Status"
            loading={loading}
            onExport={() => exportData('status_distribution')}
          >
            {demographics && (
              <div className="space-y-4">
                {demographics.statusDistribution.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{item.status}</span>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            item.status === 'Ativo' ? 'bg-green-600' :
                            item.status === 'Inativo' ? 'bg-yellow-600' : 'bg-gray-600'
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </div>

        {/* Trends Chart */}
        <ChartCard
          title="Tendências de Pacientes"
          loading={loading}
          onExport={() => exportData('trends')}
        >
          {trends.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Novos Pacientes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Pacientes Ativos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-500 rounded"></div>
                  <span>Altas</span>
                </div>
              </div>
              
              <div className="h-64 flex items-end justify-between gap-2">
                {trends.slice(-12).map((trend, index) => {
                  const maxValue = Math.max(...trends.map(t => Math.max(t.newPatients, t.activePatients, t.dischargedPatients)));
                  return (
                    <div key={index} className="flex flex-col items-center gap-1 flex-1">
                      <div className="flex flex-col items-center gap-1 h-48 justify-end">
                        <div
                          className="w-4 bg-blue-500 rounded-t"
                          style={{ height: `${(trend.newPatients / maxValue) * 100}%` }}
                          title={`Novos: ${trend.newPatients}`}
                        ></div>
                        <div
                          className="w-4 bg-green-500"
                          style={{ height: `${(trend.activePatients / maxValue) * 100}%` }}
                          title={`Ativos: ${trend.activePatients}`}
                        ></div>
                        <div
                          className="w-4 bg-gray-500 rounded-b"
                          style={{ height: `${(trend.dischargedPatients / maxValue) * 100}%` }}
                          title={`Altas: ${trend.dischargedPatients}`}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 text-center transform -rotate-45 origin-center">
                        {trend.period}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ChartCard>

        {/* Patient Segments */}
        <ChartCard
          title="Segmentos de Pacientes"
          loading={loading}
          onExport={() => exportData('segments')}
        >
          {segments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {segments.map((segment, index) => (
                <div key={segment.id} className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">{segment.name}</h4>
                  <p className="text-2xl font-bold text-blue-600 mb-2">{segment.patientCount}</p>
                  <p className="text-sm text-gray-500">
                    Atualizado em {segment.lastUpdated.toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        {/* Predictive Analytics */}
        {predictive && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Pacientes em Risco de Churn"
              loading={loading}
              onExport={() => exportData('churn_risk')}
            >
              <div className="space-y-3">
                {predictive.churnRisk.slice(0, 5).map((risk, index) => (
                  <div key={risk.patientId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Paciente {risk.patientId}</p>
                      <p className="text-sm text-gray-500">{risk.factors.join(', ')}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      risk.score >= 70 ? 'bg-red-100 text-red-800' :
                      risk.score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {risk.score}%
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>

            <ChartCard
              title="Previsão de Demanda"
              loading={loading}
              onExport={() => exportData('demand_forecast')}
            >
              <div className="space-y-3">
                {predictive.demandForecast.slice(0, 6).map((forecast, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{forecast.period}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {forecast.predictedAppointments} consultas
                      </span>
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        forecast.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
                        forecast.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {Math.round(forecast.confidence * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        )}

        {/* Top Conditions */}
        {demographics && (
          <ChartCard
            title="Condições Mais Comuns"
            loading={loading}
            onExport={() => exportData('conditions')}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {demographics.conditionDistribution.slice(0, 8).map((condition, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{condition.condition}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{condition.count}</span>
                    <div className={`w-8 h-2 rounded-full ${
                      index < 3 ? 'bg-red-500' :
                      index < 6 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        )}
      </div>
    </>
  );
};

export default PatientAnalyticsPage;