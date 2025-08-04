import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Activity, 
  Heart, 
  TrendingUp, 
  CheckCircle,
  Target,
  Award,
  Settings,
  Bell,
  Sparkles,
  Zap,
  Users,
  BookOpen,
  MessageCircle,
  Camera,
  Plus,
  ChevronRight,
  Star,
  Clock,
  AlertCircle,
  Smile,
  Frown,
  Meh
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useAppointments } from '../../hooks/useAppointments';
import { usePatients } from '../../hooks/usePatients';
import { usePatientAnalytics } from '../../hooks/usePatientAnalytics';
import { Appointment, AppointmentStatus, Patient } from '../../types';
import PersonalizedHeader from '../../components/patient-portal/PersonalizedHeader';
import PainRegistrationModal from '../../components/patient-portal/PainRegistrationModal';
import ExerciseQuickStartModal from '../../components/patient-portal/ExerciseQuickStartModal';
import AppointmentSchedulingModal from '../../components/patient-portal/AppointmentSchedulingModal';
import DocumentAccessModal from '../../components/patient-portal/DocumentAccessModal';
import WidgetWrapper from '../../components/patient-portal/WidgetWrapper';

// Enhanced Stats Card with animations and interactions
const EnhancedStatCard = ({ 
  title, 
  value, 
  icon, 
  color = 'blue',
  subtitle,
  trend,
  onClick,
  notification
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  subtitle?: string;
  trend?: { direction: 'up' | 'down' | 'stable'; value: string };
  onClick?: () => void;
  notification?: number;
}) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
    green: 'bg-green-100 text-green-600 hover:bg-green-200',
    yellow: 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200',
    red: 'bg-red-100 text-red-600 hover:bg-red-200',
    purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
  };

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-gray-600'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`
        bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 
        border border-slate-100 relative overflow-hidden group
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Notification badge */}
      {notification && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {notification > 9 ? '9+' : notification}
        </div>
      )}

      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium mt-2 ${trendColors[trend.direction]}`}>
              <TrendingUp className={`w-3 h-3 ${trend.direction === 'down' ? 'rotate-180' : ''}`} />
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        
        <div className={`p-4 rounded-2xl transition-all duration-300 ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>

      {/* Interactive hover effect */}
      {onClick && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      )}
    </motion.div>
  );
};

// Pain Trend Widget
const PainTrendWidget = ({ 
  onRegisterPain, 
  analytics 
}: { 
  onRegisterPain: () => void;
  analytics?: any;
}) => {
  // Use analytics data if available, otherwise fallback to mock data
  const painData = analytics?.painTrends?.painHistory?.map((entry: any, index: number) => ({
    day: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][index % 7],
    level: entry.level
  })).slice(-7) || [
    { day: 'Seg', level: 6 },
    { day: 'Ter', level: 4 },
    { day: 'Qua', level: 3 },
    { day: 'Qui', level: 2 },
    { day: 'Sex', level: 3 },
    { day: 'Sáb', level: 2 },
    { day: 'Dom', level: 1 }
  ];

  const currentPainLevel = analytics?.painTrends?.currentLevel || painData[painData.length - 1]?.level || 0;
  const painTrend = painData.length > 1 ? painData[painData.length - 1].level - painData[painData.length - 2].level : 0;

  const getPainIcon = (level: number) => {
    if (level <= 3) return <Smile className="w-5 h-5 text-green-500" />;
    if (level <= 6) return <Meh className="w-5 h-5 text-yellow-500" />;
    return <Frown className="w-5 h-5 text-red-500" />;
  };

  const getPainColor = (level: number) => {
    if (level <= 3) return 'bg-green-100 text-green-600';
    if (level <= 6) return 'bg-yellow-100 text-yellow-600';
    return 'bg-red-100 text-red-600';
  };

  return (
    <WidgetWrapper 
      title="Tendência da Dor" 
      icon={<Heart className="w-5 h-5" />}
      action={
        <button 
          onClick={onRegisterPain}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Registrar
        </button>
      }
    >
      <div className="space-y-4">
        {/* Current Pain Level */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            {getPainIcon(currentPainLevel)}
            <div>
              <p className="text-sm font-medium text-gray-600">Nível Atual</p>
              <p className="text-2xl font-bold text-gray-900">{currentPainLevel}/10</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPainColor(currentPainLevel)}`}>
            {painTrend > 0 ? `+${painTrend}` : painTrend === 0 ? 'Estável' : painTrend}
          </div>
        </div>

        {/* Pain Chart */}
        <div className="flex items-end justify-between gap-2 h-24">
          {painData.map((data, index) => (
            <div key={data.day} className="flex flex-col items-center gap-2 flex-1">
              <div 
                className={`w-full rounded-t-lg transition-all duration-500 ${
                  data.level <= 3 ? 'bg-green-400' :
                  data.level <= 6 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                style={{ height: `${(data.level / 10) * 100}%` }}
              />
              <span className="text-xs text-gray-500 font-medium">{data.day}</span>
            </div>
          ))}
        </div>

        {/* Insights */}
        {/* Insights */}
        {analytics?.insights && analytics.insights.length > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Insight</p>
                <p className="text-sm text-blue-700">
                  {analytics.insights[0].message}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </WidgetWrapper>
  );
};

// Exercise Streak Widget
const ExerciseStreakWidget = ({ 
  onStartExercise, 
  analytics 
}: { 
  onStartExercise: () => void;
  analytics?: any;
}) => {
  const streakCount = analytics?.exerciseMetrics?.streakDays || 12;
  const weeklyGoal = analytics?.exerciseMetrics?.weeklyGoal || 5;
  const completedThisWeek = analytics?.exerciseMetrics?.completedThisWeek || 4;
  const todayCompleted = analytics?.exerciseMetrics?.todayCompleted || false;

  return (
    <WidgetWrapper 
      title="Sequência de Exercícios" 
      icon={<Activity className="w-5 h-5" />}
    >
      <div className="space-y-4">
        {/* Streak Counter */}
        <div className="text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            <span className="text-3xl font-bold text-gray-900">{streakCount}</span>
            <span className="text-lg text-gray-600">dias</span>
          </div>
          <p className="text-sm text-gray-600">Sequência atual</p>
        </div>

        {/* Weekly Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Meta semanal</span>
            <span className="text-gray-600">{completedThisWeek}/{weeklyGoal}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div 
              className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(completedThisWeek / weeklyGoal) * 100}%` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
        </div>

        {/* Today's Status */}
        <div className={`p-3 rounded-lg ${todayCompleted ? 'bg-green-50' : 'bg-yellow-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {todayCompleted ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Clock className="w-5 h-5 text-yellow-500" />
              )}
              <span className="text-sm font-medium text-gray-700">
                {todayCompleted ? 'Exercícios de hoje concluídos!' : 'Pendente hoje'}
              </span>
            </div>
            {!todayCompleted && (
              <button
                onClick={onStartExercise}
                className="px-3 py-1 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
              >
                Iniciar
              </button>
            )}
          </div>
        </div>

        {/* Achievement */}
        <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
          <Award className="w-4 h-4 text-purple-500" />
          <span className="text-sm text-purple-700">Próximo: Conquistador (15 dias)</span>
        </div>
      </div>
    </WidgetWrapper>
  );
};

// Next Appointments Widget
const NextAppointmentsWidget = ({ appointments, onScheduleNew }: { 
  appointments: Appointment[]; 
  onScheduleNew: () => void; 
}) => {
  const upcomingAppointments = appointments
    .filter(apt => new Date(apt.startTime) > new Date())
    .slice(0, 3);

  return (
    <WidgetWrapper 
      title="Próximas Consultas" 
      icon={<Calendar className="w-5 h-5" />}
      action={
        <button 
          onClick={onScheduleNew}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Agendar
        </button>
      }
    >
      <div className="space-y-3">
        {upcomingAppointments.length > 0 ? (
          upcomingAppointments.map((appointment) => (
            <motion.div 
              key={appointment.id} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{appointment.type}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(appointment.startTime).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {new Date(appointment.startTime).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
                <p className="text-xs text-gray-500">
                  {appointment.title}
                </p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-6">
            <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 mb-3">Nenhuma consulta agendada</p>
            <button 
              onClick={onScheduleNew}
              className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              Agendar primeira consulta
            </button>
          </div>
        )}
      </div>
    </WidgetWrapper>
  );
};

// Quick Actions Widget
const QuickActionsWidget = ({ 
  onPainRegister, 
  onExerciseStart, 
  onScheduleAppointment, 
  onAccessDocuments 
}: {
  onPainRegister: () => void;
  onExerciseStart: () => void;
  onScheduleAppointment: () => void;
  onAccessDocuments: () => void;
}) => {
  const actions = [
    {
      title: 'Diário de Dor',
      icon: <Heart className="w-5 h-5" />,
      color: 'red',
      onClick: onPainRegister,
      notification: true
    },
    {
      title: 'Exercícios',
      icon: <Activity className="w-5 h-5" />,
      color: 'blue',
      onClick: onExerciseStart,
      notification: false
    },
    {
      title: 'Agendar',
      icon: <Calendar className="w-5 h-5" />,
      color: 'green',
      onClick: onScheduleAppointment,
      notification: false
    },
    {
      title: 'Documentos',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'purple',
      onClick: onAccessDocuments,
      notification: false
    }
  ];

  const colorClasses = {
    red: 'bg-red-50 hover:bg-red-100 text-red-600',
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-600',
    green: 'bg-green-50 hover:bg-green-100 text-green-600',
    purple: 'bg-purple-50 hover:bg-purple-100 text-purple-600'
  };

  return (
    <WidgetWrapper title="Ações Rápidas" icon={<Zap className="w-5 h-5" />}>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <motion.button
            key={action.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={action.onClick}
            className={`p-4 rounded-xl text-left transition-all duration-200 relative ${colorClasses[action.color as keyof typeof colorClasses]}`}
          >
            {action.notification && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
            )}
            <div className="mb-2">{action.icon}</div>
            <p className="text-sm font-medium">{action.title}</p>
          </motion.button>
        ))}
      </div>
    </WidgetWrapper>
  );
};

// Main Enhanced Patient Dashboard Page
const EnhancedPatientDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { appointments, isLoading: isLoadingAppointments } = useAppointments();
  const { patients } = usePatients();
  const { analytics, isLoading: isLoadingAnalytics } = usePatientAnalytics();
  
  // Modal states
  const [showPainModal, setShowPainModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  // Get current patient data
  const currentPatient = useMemo(() => {
    return patients.find(p => p.id === user?.id) || null;
  }, [patients, user]);

  // Calculate stats from analytics or fallback to manual calculation
  const stats = useMemo(() => {
    if (analytics) {
      return {
        upcomingAppointments: analytics.appointmentMetrics.upcomingCount,
        completedAppointments: analytics.appointmentMetrics.completedCount,
        currentPainLevel: `${analytics.painTrends.currentLevel}/10`,
        exercisesCompleted: `${analytics.exerciseMetrics.completedThisWeek}/${analytics.exerciseMetrics.weeklyGoal}`
      };
    }

    // Fallback calculation
    const completed = appointments.filter(apt => apt.status === AppointmentStatus.Completed).length;
    const upcoming = appointments.filter(apt => 
      new Date(apt.startTime) > new Date() && apt.status === AppointmentStatus.Scheduled
    ).length;

    return {
      upcomingAppointments: upcoming,
      completedAppointments: completed,
      currentPainLevel: '3/10',
      exercisesCompleted: '12/20'
    };
  }, [appointments, analytics]);

  // Modal handlers
  const handlePainRegister = () => setShowPainModal(true);
  const handleExerciseStart = () => setShowExerciseModal(true);
  const handleScheduleAppointment = () => setShowAppointmentModal(true);
  const handleAccessDocuments = () => setShowDocumentModal(true);

  if (isLoadingAppointments || isLoadingAnalytics) {
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
    <div className="space-y-8">
      {/* Personalized Header */}
      <PersonalizedHeader />

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EnhancedStatCard
          title="Próximas Consultas"
          value={stats.upcomingAppointments}
          icon={<Calendar className="w-6 h-6" />}
          color="blue"
          subtitle="Esta semana"
          trend={{ direction: 'up', value: '+2 vs última semana' }}
          onClick={handleScheduleAppointment}
          notification={stats.upcomingAppointments > 0 ? stats.upcomingAppointments : undefined}
        />
        
        <EnhancedStatCard
          title="Consultas Realizadas"
          value={stats.completedAppointments}
          icon={<CheckCircle className="w-6 h-6" />}
          color="green"
          subtitle="Total"
          trend={{ direction: 'up', value: '+3 este mês' }}
        />
        
        <EnhancedStatCard
          title="Nível de Dor"
          value={stats.currentPainLevel}
          icon={<Heart className="w-6 h-6" />}
          color="red"
          subtitle="Última medição"
          trend={{ direction: 'down', value: '-40% esta semana' }}
          onClick={handlePainRegister}
          notification={1}
        />
        
        <EnhancedStatCard
          title="Exercícios"
          value={stats.exercisesCompleted}
          icon={<Activity className="w-6 h-6" />}
          color="purple"
          subtitle="Esta semana"
          trend={{ direction: 'up', value: '60% completos' }}
          onClick={handleExerciseStart}
        />
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Main Widgets */}
        <div className="lg:col-span-8 space-y-6">
          {/* Pain Trend Widget */}
          <PainTrendWidget 
            onRegisterPain={handlePainRegister} 
            analytics={analytics}
          />

          {/* Next Appointments */}
          <NextAppointmentsWidget 
            appointments={appointments} 
            onScheduleNew={handleScheduleAppointment}
          />

          {/* Exercise Progress */}
          <ExerciseStreakWidget 
            onStartExercise={handleExerciseStart}
            analytics={analytics}
          />
        </div>

        {/* Right Column - Quick Actions & Secondary Widgets */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions */}
          <QuickActionsWidget
            onPainRegister={handlePainRegister}
            onExerciseStart={handleExerciseStart}
            onScheduleAppointment={handleScheduleAppointment}
            onAccessDocuments={handleAccessDocuments}
          />

          {/* Treatment Progress */}
          <WidgetWrapper title="Progresso Geral" icon={<Target className="w-5 h-5" />}>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Tratamento</span>
                  <span className="font-medium">{analytics?.treatmentProgress?.overallProgress || 75}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${analytics?.treatmentProgress?.overallProgress || 75}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Redução da Dor</span>
                  <span className="font-medium">{analytics?.treatmentProgress?.painReduction || 71}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${analytics?.treatmentProgress?.painReduction || 71}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Adesão</span>
                  <span className="font-medium">{analytics?.treatmentProgress?.adherenceRate || 85}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${analytics?.treatmentProgress?.adherenceRate || 85}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </WidgetWrapper>

          {/* Recent Activity */}
          <WidgetWrapper title="Atividade Recente" icon={<TrendingUp className="w-5 h-5" />}>
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
          </WidgetWrapper>
        </div>
      </div>

      {/* Motivational Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 p-8 rounded-2xl text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%23ffffff%22%20fill-opacity=%220.1%22%3E%3Ccircle%20cx=%226%22%20cy=%226%22%20r=%226%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />
        
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-300" />
              Parabéns pelo seu progresso!
            </h3>
            <p className="text-blue-100 text-lg">
              {analytics?.insights?.[0]?.message || 'Você completou 80% dos seus exercícios esta semana e sua dor diminuiu significativamente.'}
            </p>
            <p className="text-blue-200 mt-2">
              Continue assim! Sua dedicação está fazendo toda a diferença.
            </p>
          </div>
          <div className="hidden md:block">
            <Award className="w-20 h-20 text-yellow-300" />
          </div>
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {showPainModal && (
          <PainRegistrationModal
            isOpen={showPainModal}
            onClose={() => setShowPainModal(false)}
            onSubmit={(painData) => {
              console.log('Pain registered:', painData);
              showToast('Dor registrada com sucesso!', 'success');
              setShowPainModal(false);
            }}
          />
        )}

        {showExerciseModal && (
          <ExerciseQuickStartModal
            isOpen={showExerciseModal}
            onClose={() => setShowExerciseModal(false)}
            onStartExercise={(exerciseId) => {
              console.log('Exercise started:', exerciseId);
              showToast('Exercício iniciado!', 'success');
              setShowExerciseModal(false);
            }}
          />
        )}

        {showAppointmentModal && (
          <AppointmentSchedulingModal
            isOpen={showAppointmentModal}
            onClose={() => setShowAppointmentModal(false)}
            onSchedule={(appointmentData) => {
              console.log('Appointment scheduled:', appointmentData);
              showToast('Consulta agendada com sucesso!', 'success');
              setShowAppointmentModal(false);
            }}
          />
        )}

        {showDocumentModal && (
          <DocumentAccessModal
            isOpen={showDocumentModal}
            onClose={() => setShowDocumentModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedPatientDashboardPage;