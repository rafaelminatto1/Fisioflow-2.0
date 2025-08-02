
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Appointment, Patient, Therapist } from '../types';
import * as appointmentService from '../services/appointmentService';
import * as patientService from '../services/patientService';
import * as therapistService from '../services/therapistService';
import PageHeader from '../components/PageHeader';
import { 
  Activity, 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  CheckCircle,
  UserPlus
} from 'lucide-react';

// Quick stats component
const StatCard = ({ 
  title, 
  value, 
  change, 
  icon, 
  color = 'blue' 
}: { 
  title: string; 
  value: string | number; 
  change?: string; 
  icon: React.ReactNode; 
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
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
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Recent appointments component
const RecentAppointments = ({ appointments }: { appointments: Appointment[] }) => {
  const recentAppointments = appointments.slice(0, 5);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Calendar className="w-5 h-5 mr-2 text-blue-600" />
        Próximos Agendamentos
      </h3>
      <div className="space-y-3">
        {recentAppointments.length > 0 ? (
          recentAppointments.map((appointment) => (
            <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{appointment.patientName}</p>
                <p className="text-sm text-gray-600">{appointment.type}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {new Date(appointment.date).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-sm text-gray-600">{appointment.time}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">Nenhum agendamento próximo</p>
        )}
      </div>
    </div>
  );
};

// Quick actions component
const QuickActions = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
      <div className="grid grid-cols-2 gap-3">
        <button className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
          <UserPlus className="w-5 h-5 text-blue-600 mb-2" />
          <p className="text-sm font-medium text-blue-900">Novo Paciente</p>
        </button>
        <button className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
          <Calendar className="w-5 h-5 text-green-600 mb-2" />
          <p className="text-sm font-medium text-green-900">Agendar</p>
        </button>
        <button className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors">
          <Activity className="w-5 h-5 text-purple-600 mb-2" />
          <p className="text-sm font-medium text-purple-900">Exercícios</p>
        </button>
        <button className="p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-left transition-colors">
          <TrendingUp className="w-5 h-5 text-yellow-600 mb-2" />
          <p className="text-sm font-medium text-yellow-900">Relatórios</p>
        </button>
      </div>
    </div>
  );
};

const DashboardPage: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [therapists, setTherapists] = useState<Therapist[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { user } = useAuth();
    const { addToast } = useToast();

    useEffect(() => {
      const loadDashboardData = async () => {
        try {
          setIsLoading(true);
          setError(null);

          const [appointmentsData, patientsData, therapistsData] = await Promise.all([
            appointmentService.getAppointments(),
            patientService.getPatients(),
            therapistService.getTherapists(),
          ]);

          setAppointments(appointmentsData);
          setPatients(patientsData);
          setTherapists(therapistsData);
        } catch (err: any) {
          setError(err.message || 'Erro ao carregar dados do dashboard');
          addToast({
            type: 'error',
            title: 'Erro ao carregar dashboard',
            message: 'Não foi possível carregar os dados. Tente novamente.',
          });
        } finally {
          setIsLoading(false);
        }
      };

      loadDashboardData();
    }, [addToast]);

    if (isLoading) {
      return (
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-xl"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-10">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    // Calculate stats
    const todayAppointments = appointments.filter(apt => 
      new Date(apt.date).toDateString() === new Date().toDateString()
    ).length;
    
    const activePatients = patients.filter(patient => patient.status === 'active').length;
    const completedAppointments = appointments.filter(apt => apt.status === 'completed').length;
    const pendingAppointments = appointments.filter(apt => apt.status === 'scheduled').length;

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Bem-vindo, ${user?.profile.firstName}!`}
                subtitle="Visão geral da sua clínica e atividades do dia."
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Consultas Hoje"
                    value={todayAppointments}
                    change="+12% vs ontem"
                    icon={<Calendar className="w-6 h-6" />}
                    color="blue"
                />
                <StatCard
                    title="Pacientes Ativos"
                    value={activePatients}
                    change="+5 este mês"
                    icon={<Users className="w-6 h-6" />}
                    color="green"
                />
                <StatCard
                    title="Consultas Concluídas"
                    value={completedAppointments}
                    change="+8% vs mês anterior"
                    icon={<CheckCircle className="w-6 h-6" />}
                    color="purple"
                />
                <StatCard
                    title="Agendamentos Pendentes"
                    value={pendingAppointments}
                    icon={<Clock className="w-6 h-6" />}
                    color="yellow"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Appointments - Takes 2 columns */}
                <div className="lg:col-span-2">
                    <RecentAppointments appointments={appointments} />
                </div>
                
                {/* Quick Actions - Takes 1 column */}
                <div>
                    <QuickActions />
                </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-blue-600" />
                        Atividade Recente
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center p-3 bg-green-50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">Consulta concluída</p>
                                <p className="text-xs text-gray-600">Maria Silva - há 30 min</p>
                            </div>
                        </div>
                        <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                            <UserPlus className="w-5 h-5 text-blue-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">Novo paciente cadastrado</p>
                                <p className="text-xs text-gray-600">João Santos - há 1 hora</p>
                            </div>
                        </div>
                        <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-yellow-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">Agendamento reagendado</p>
                                <p className="text-xs text-gray-600">Ana Costa - há 2 horas</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                        Métricas da Semana
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Taxa de Comparecimento</span>
                                <span className="font-medium">92%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Satisfação do Paciente</span>
                                <span className="font-medium">4.8/5</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '96%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">Ocupação da Agenda</span>
                                <span className="font-medium">78%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
