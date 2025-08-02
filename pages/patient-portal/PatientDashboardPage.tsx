
import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import * as treatmentService from '../../services/treatmentService';
import * as appointmentService from '../../services/appointmentService';
import { TreatmentPlan, Appointment, AppointmentStatus } from '../../types';
import { 
  Target, 
  Calendar, 
  Activity, 
  Heart, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Award
} from 'lucide-react';

// Stats card component for patient dashboard
const PatientStatCard = ({ 
  title, 
  value, 
  icon, 
  color = 'blue',
  subtitle 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  subtitle?: string;
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

// Next appointments component
const NextAppointments = ({ appointments }: { appointments: Appointment[] }) => {
  const upcomingAppointments = appointments
    .filter(apt => new Date(apt.startTime) > new Date())
    .slice(0, 3);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Calendar className="w-5 h-5 mr-2 text-blue-600" />
        Próximas Consultas
      </h3>
      <div className="space-y-3">
        {upcomingAppointments.length > 0 ? (
          upcomingAppointments.map((appointment) => (
            <div key={appointment.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{appointment.title}</p>
                <p className="text-sm text-gray-600">{appointment.type}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {new Date(appointment.startTime).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(appointment.startTime).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Nenhuma consulta agendada</p>
            <button className="mt-2 text-sm text-blue-600 hover:text-blue-700">
              Agendar consulta
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Treatment progress component
const TreatmentProgress = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Target className="w-5 h-5 mr-2 text-green-600" />
        Progresso do Tratamento
      </h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Exercícios Concluídos</span>
            <span className="font-medium">12/20</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Consultas Realizadas</span>
            <span className="font-medium">8/12</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '67%' }}></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Melhora da Dor</span>
            <span className="font-medium">7/10 → 3/10</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-purple-600 h-2 rounded-full" style={{ width: '80%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick actions for patients
const PatientQuickActions = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
      <div className="grid grid-cols-2 gap-3">
        <button className="p-3 bg-red-50 hover:bg-red-100 rounded-lg text-left transition-colors">
          <Heart className="w-5 h-5 text-red-600 mb-2" />
          <p className="text-sm font-medium text-red-900">Diário de Dor</p>
        </button>
        <button className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
          <Activity className="w-5 h-5 text-blue-600 mb-2" />
          <p className="text-sm font-medium text-blue-900">Exercícios</p>
        </button>
        <button className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
          <Calendar className="w-5 h-5 text-green-600 mb-2" />
          <p className="text-sm font-medium text-green-900">Agendar</p>
        </button>
        <button className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors">
          <BookOpen className="w-5 h-5 text-purple-600 mb-2" />
          <p className="text-sm font-medium text-purple-900">Documentos</p>
        </button>
      </div>
    </div>
  );
};


const PatientDashboardPage: React.FC = () => {
    const { user } = useAuth();
    const { success, error, showToast } = useToast();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const loadPatientData = async () => {
        try {
          setIsLoading(true);
          // In a real app, this would filter by patient ID
          const appointmentsData = await appointmentService.getAppointments();
          setAppointments(appointmentsData);
        } catch (err: any) {
          error('Não foi possível carregar suas informações.');
        } finally {
          setIsLoading(false);
        }
      };

      loadPatientData();
    }, [showToast]);

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

    // Calculate patient stats
    const completedAppointments = appointments.filter(apt => apt.status === AppointmentStatus.Completed).length;
    const upcomingAppointments = appointments.filter(apt => 
      new Date(apt.startTime) > new Date() && apt.status === AppointmentStatus.Scheduled
    ).length;

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Bem-vindo(a), ${user?.name.split(' ')[0]}!`}
                subtitle="Acompanhe seu progresso e mantenha-se em dia com seu tratamento."
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <PatientStatCard
                    title="Próximas Consultas"
                    value={upcomingAppointments}
                    icon={<Calendar className="w-6 h-6" />}
                    color="blue"
                    subtitle="Esta semana"
                />
                <PatientStatCard
                    title="Consultas Realizadas"
                    value={completedAppointments}
                    icon={<CheckCircle className="w-6 h-6" />}
                    color="green"
                    subtitle="Total"
                />
                <PatientStatCard
                    title="Nível de Dor Atual"
                    value="3/10"
                    icon={<Heart className="w-6 h-6" />}
                    color="red"
                    subtitle="Última medição"
                />
                <PatientStatCard
                    title="Exercícios Concluídos"
                    value="12/20"
                    icon={<Activity className="w-6 h-6" />}
                    color="purple"
                    subtitle="Esta semana"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Next Appointments - Takes 2 columns */}
                <div className="lg:col-span-2">
                    <NextAppointments appointments={appointments} />
                </div>
                
                {/* Quick Actions - Takes 1 column */}
                <div>
                    <PatientQuickActions />
                </div>
            </div>

            {/* Treatment Progress and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TreatmentProgress />
                
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                        Atividade Recente
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center p-3 bg-green-50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">Exercício concluído</p>
                                <p className="text-xs text-gray-600">Alongamento cervical - há 2 horas</p>
                            </div>
                        </div>
                        <div className="flex items-center p-3 bg-red-50 rounded-lg">
                            <Heart className="w-5 h-5 text-red-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">Dor registrada</p>
                                <p className="text-xs text-gray-600">Nível 3/10 - há 4 horas</p>
                            </div>
                        </div>
                        <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-600 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-900">Consulta agendada</p>
                                <p className="text-xs text-gray-600">Fisioterapia - amanhã às 14h</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Motivational Section */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 rounded-xl text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Continue assim!</h3>
                        <p className="text-blue-100">
                            Você está fazendo um ótimo progresso. Mantenha a consistência com seus exercícios.
                        </p>
                    </div>
                    <Award className="w-12 h-12 text-yellow-300" />
                </div>
            </div>
        </div>
    );
};

export default PatientDashboardPage;