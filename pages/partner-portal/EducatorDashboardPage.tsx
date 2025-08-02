import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { 
  Users, 
  Activity, 
  CheckCircle, 
  TrendingUp, 
  Calendar,
  Award,
  Clock,
  Target,
  BookOpen,
  MessageCircle
} from 'lucide-react';

const PartnerStatCard = ({ 
  title, 
  value, 
  icon, 
  color = 'indigo',
  change,
  subtitle 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color?: 'indigo' | 'green' | 'blue' | 'purple' | 'yellow';
  change?: string;
  subtitle?: string;
}) => {
  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className="text-sm text-green-600 mt-1">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              {change}
            </p>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Recent clients component
const RecentClients = () => {
  const clients = [
    { id: 1, name: 'Maria Silva', lastSession: '2024-01-15', progress: 85 },
    { id: 2, name: 'João Santos', lastSession: '2024-01-14', progress: 72 },
    { id: 3, name: 'Ana Costa', lastSession: '2024-01-13', progress: 91 },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Users className="w-5 h-5 mr-2 text-indigo-600" />
        Clientes Recentes
      </h3>
      <div className="space-y-3">
        {clients.map((client) => (
          <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">{client.name}</p>
              <p className="text-sm text-gray-600">
                Última sessão: {new Date(client.lastSession).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{client.progress}%</p>
              <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${client.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Quick actions for partners
const PartnerQuickActions = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
      <div className="grid grid-cols-2 gap-3">
        <button className="p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-left transition-colors">
          <Activity className="w-5 h-5 text-indigo-600 mb-2" />
          <p className="text-sm font-medium text-indigo-900">Novo Treino</p>
        </button>
        <button className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
          <Calendar className="w-5 h-5 text-green-600 mb-2" />
          <p className="text-sm font-medium text-green-900">Agendar</p>
        </button>
        <button className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
          <BookOpen className="w-5 h-5 text-blue-600 mb-2" />
          <p className="text-sm font-medium text-blue-900">Exercícios</p>
        </button>
        <button className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors">
          <MessageCircle className="w-5 h-5 text-purple-600 mb-2" />
          <p className="text-sm font-medium text-purple-900">Mensagens</p>
        </button>
      </div>
    </div>
  );
};

const EducatorDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const { success, error } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      // Simulate loading partner data
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);

      return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
      return (
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Boas-vindas, ${user?.name.split(' ')[0]}!`}
                subtitle="Acompanhe os pacientes encaminhados e seus progressos."
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <PartnerStatCard 
                  title="Clientes Ativos" 
                  value="8" 
                  icon={<Users className="w-6 h-6" />} 
                  color="indigo"
                  change="+2 este mês"
                />
                <PartnerStatCard 
                  title="Planos de Treino" 
                  value="15" 
                  icon={<Activity className="w-6 h-6" />} 
                  color="blue"
                  change="+3 esta semana"
                />
                <PartnerStatCard 
                  title="Sessões Concluídas" 
                  value="42" 
                  icon={<CheckCircle className="w-6 h-6" />} 
                  color="green"
                  subtitle="Este mês"
                />
                <PartnerStatCard 
                  title="Taxa de Adesão" 
                  value="89%" 
                  icon={<Target className="w-6 h-6" />} 
                  color="purple"
                  change="+5% vs mês anterior"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Clients - Takes 2 columns */}
                <div className="lg:col-span-2">
                    <RecentClients />
                </div>
                
                {/* Quick Actions - Takes 1 column */}
                <div>
                    <PartnerQuickActions />
                </div>
            </div>

            {/* Additional Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                        Performance Semanal
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Sessões Realizadas</span>
                                <span className="font-medium">12/15</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-green-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Satisfação dos Clientes</span>
                                <span className="font-medium">4.9/5</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '98%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Planos Ativos</span>
                                <span className="font-medium">8/10</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-blue-600" />
                        Próximas Atividades
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">Sessão com Maria Silva</p>
                                <p className="text-xs text-gray-600">Hoje às 14:00</p>
                            </div>
                        </div>
                        <div className="flex items-center p-3 bg-green-50 rounded-lg">
                            <Activity className="w-5 h-5 text-green-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">Criar plano para João Santos</p>
                                <p className="text-xs text-gray-600">Amanhã</p>
                            </div>
                        </div>
                        <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                            <MessageCircle className="w-5 h-5 text-purple-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">Feedback de Ana Costa</p>
                                <p className="text-xs text-gray-600">Pendente</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Achievement Section */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-xl text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Parabéns pelo seu trabalho!</h3>
                        <p className="text-indigo-100">
                            Você manteve 89% de adesão dos seus clientes este mês. Continue assim!
                        </p>
                    </div>
                    <Award className="w-12 h-12 text-yellow-300" />
                </div>
            </div>
        </div>
    );
};

export default EducatorDashboardPage;
