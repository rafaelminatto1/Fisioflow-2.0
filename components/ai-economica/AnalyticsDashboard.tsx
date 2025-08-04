import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Database, 
  Zap, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  PieChart,
  BarChart3,
  Clock,
  Users,
  Target
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, PieChart as RechartsPieChart, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AnalyticsData {
  usage: {
    internal: number;
    cache: number;
    premium: number;
    total: number;
  };
  costs: {
    saved: number;
    wouldHaveCost: number;
    actualCost: number;
    savingsPercentage: number;
  };
  performance: {
    averageResponseTime: number;
    cacheHitRate: number;
    internalHitRate: number;
    premiumUsageRate: number;
  };
  trends: Array<{
    date: string;
    internal: number;
    cache: number;
    premium: number;
    cost: number;
    savings: number;
  }>;
  providers: Array<{
    name: string;
    usage: number;
    cost: number;
    responseTime: number;
    successRate: number;
  }>;
  categories: Array<{
    name: string;
    queries: number;
    cacheHit: number;
    internalHit: number;
  }>;
}

interface AnalyticsDashboardProps {
  timeRange?: '24h' | '7d' | '30d' | '90d';
  onTimeRangeChange?: (range: '24h' | '7d' | '30d' | '90d') => void;
}

// Mock data generator for demonstration
const generateMockData = (timeRange: string): AnalyticsData => {
  const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  
  const trends = Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));
    
    return {
      date: date.toISOString().split('T')[0],
      internal: Math.floor(Math.random() * 100) + 200,
      cache: Math.floor(Math.random() * 150) + 100,
      premium: Math.floor(Math.random() * 50) + 10,
      cost: Math.random() * 20 + 5,
      savings: Math.random() * 180 + 120
    };
  });

  const totalInternal = trends.reduce((sum, day) => sum + day.internal, 0);
  const totalCache = trends.reduce((sum, day) => sum + day.cache, 0);
  const totalPremium = trends.reduce((sum, day) => sum + day.premium, 0);
  const totalCost = trends.reduce((sum, day) => sum + day.cost, 0);
  const totalSavings = trends.reduce((sum, day) => sum + day.savings, 0);

  return {
    usage: {
      internal: totalInternal,
      cache: totalCache,
      premium: totalPremium,
      total: totalInternal + totalCache + totalPremium
    },
    costs: {
      saved: totalSavings,
      wouldHaveCost: totalSavings + totalCost,
      actualCost: totalCost,
      savingsPercentage: (totalSavings / (totalSavings + totalCost)) * 100
    },
    performance: {
      averageResponseTime: 850,
      cacheHitRate: 78,
      internalHitRate: 65,
      premiumUsageRate: 12
    },
    trends,
    providers: [
      { name: 'ChatGPT Plus', usage: 45, cost: 67.5, responseTime: 1200, successRate: 98.5 },
      { name: 'Gemini Pro', usage: 30, cost: 42.0, responseTime: 950, successRate: 97.2 },
      { name: 'Claude Pro', usage: 20, cost: 35.0, responseTime: 800, successRate: 99.1 },
      { name: 'Perplexity Pro', usage: 5, cost: 8.5, responseTime: 1500, successRate: 96.8 }
    ],
    categories: [
      { name: 'Protocolos', queries: 450, cacheHit: 320, internalHit: 280 },
      { name: 'Diagnósticos', queries: 320, cacheHit: 240, internalHit: 200 },
      { name: 'Exercícios', queries: 280, cacheHit: 200, internalHit: 180 },
      { name: 'Técnicas', queries: 180, cacheHit: 130, internalHit: 100 },
      { name: 'Geral', queries: 120, cacheHit: 80, internalHit: 60 }
    ]
  };
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  timeRange = '30d',
  onTimeRangeChange
}) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'costs' | 'performance'>('overview');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setData(generateMockData(timeRange));
      setLoading(false);
    };

    loadData();
  }, [timeRange]);

  const pieData = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Base Interna', value: data.usage.internal, color: '#10B981' },
      { name: 'Cache', value: data.usage.cache, color: '#3B82F6' },
      { name: 'IA Premium', value: data.usage.premium, color: '#F59E0B' }
    ];
  }, [data]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics de IA Econômica</h2>
          <p className="text-gray-600">Monitoramento em tempo real de economia e performance</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange?.(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="24h">Últimas 24h</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
          
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {(['overview', 'usage', 'costs', 'performance'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'overview' && 'Visão Geral'}
                {tab === 'usage' && 'Uso'}
                {tab === 'costs' && 'Custos'}
                {tab === 'performance' && 'Performance'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Economia Total</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {data.costs.saved.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                {data.costs.savingsPercentage.toFixed(1)}% de economia
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Consultas Totais</p>
              <p className="text-2xl font-bold text-blue-600">
                {data.usage.total.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {data.performance.internalHitRate}% da base interna
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {data.performance.cacheHitRate}%
              </p>
              <p className="text-xs text-gray-500">
                Tempo médio: {data.performance.averageResponseTime}ms
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Uso Premium</p>
              <p className="text-2xl font-bold text-orange-600">
                {data.performance.premiumUsageRate}%
              </p>
              <p className="text-xs text-gray-500">
                R$ {data.costs.actualCost.toFixed(2)} gastos
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Target className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content based on active tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Usage Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Uso</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value.toLocaleString(), 'Consultas']} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Savings Trend */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendência de Economia</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(date) => new Date(date).getDate().toString()} />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value, name) => [
                      name === 'savings' ? `R$ ${Number(value).toFixed(2)}` : value.toLocaleString(),
                      name === 'savings' ? 'Economia' : 'Custo'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="savings" 
                    stackId="1" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cost" 
                    stackId="2" 
                    stroke="#EF4444" 
                    fill="#EF4444" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'usage' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Usage by Source */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Uso por Fonte</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(date) => new Date(date).getDate().toString()} />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value) => [value.toLocaleString(), 'Consultas']}
                  />
                  <Area type="monotone" dataKey="internal" stackId="1" stroke="#10B981" fill="#10B981" />
                  <Area type="monotone" dataKey="cache" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
                  <Area type="monotone" dataKey="premium" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Usage by Category */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Uso por Categoria</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.categories}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value.toLocaleString(), 'Consultas']} />
                  <Bar dataKey="queries" fill="#3B82F6" name="Total" />
                  <Bar dataKey="internalHit" fill="#10B981" name="Base Interna" />
                  <Bar dataKey="cacheHit" fill="#8B5CF6" name="Cache" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'costs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cost Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Breakdown de Custos</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-green-800 font-medium">Economia Total</span>
                <span className="text-green-600 font-bold">R$ {data.costs.saved.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-red-800 font-medium">Gasto Real</span>
                <span className="text-red-600 font-bold">R$ {data.costs.actualCost.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-800 font-medium">Custaria sem otimização</span>
                <span className="text-gray-600 font-bold">R$ {data.costs.wouldHaveCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Provider Costs */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Custos por Provedor</h3>
            <div className="space-y-3">
              {data.providers.map((provider, index) => (
                <div key={provider.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{provider.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">R$ {provider.cost.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">{provider.usage} consultas</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Response Times */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tempo de Resposta por Provedor</h3>
            <div className="space-y-4">
              {data.providers.map((provider, index) => (
                <div key={provider.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{provider.name}</span>
                    <span className="text-sm text-gray-600">{provider.responseTime}ms</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(provider.responseTime / 2000) * 100}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Success Rates */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Taxa de Sucesso</h3>
            <div className="space-y-4">
              {data.providers.map((provider, index) => (
                <div key={provider.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium">{provider.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold">{provider.successRate}%</span>
                    {provider.successRate > 98 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : provider.successRate > 95 ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Resumo do Período</h3>
            <p className="text-gray-600">
              Sistema de IA Econômica economizou <span className="font-bold text-green-600">
                R$ {data.costs.saved.toFixed(2)}
              </span> em {timeRange === '24h' ? '24 horas' : `${timeRange.replace('d', ' dias')}`}
            </p>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.costs.savingsPercentage.toFixed(0)}%</div>
              <div className="text-gray-600">Economia</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.usage.total.toLocaleString()}</div>
              <div className="text-gray-600">Consultas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{data.performance.cacheHitRate}%</div>
              <div className="text-gray-600">Cache Hit</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;