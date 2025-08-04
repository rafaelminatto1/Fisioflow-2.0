
import { useState, useEffect, useMemo } from 'react';
import { Patient, Appointment, AppointmentStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { usePatients } from './usePatients';
import { useAppointments } from './useAppointments';
import { analyticsService } from '../services/analyticsService';

export interface PatientAnalytics {
  // Treatment Progress
  treatmentProgress: {
    overallProgress: number;
    exercisesCompleted: number;
    totalExercises: number;
    appointmentsCompleted: number;
    totalAppointments: number;
    painReduction: number;
    adherenceRate: number;
  };

  // Pain Tracking
  painTrends: {
    currentLevel: number;
    weeklyAverage: number;
    monthlyAverage: number;
    trend: 'improving' | 'stable' | 'worsening';
    reductionPercentage: number;
    painHistory: Array<{
      date: string;
      level: number;
      location?: string;
      notes?: string;
    }>;
  };

  // Exercise Analytics
  exerciseMetrics: {
    streakDays: number;
    weeklyGoalProgress: number;
    completedThisWeek: number;
    weeklyGoal: number;
    todayCompleted: boolean;
    favoriteExercises: string[];
    difficultyProgression: number;
  };

  // Appointment Analytics
  appointmentMetrics: {
    attendanceRate: number;
    punctualityScore: number;
    nextAppointment?: Appointment;
    upcomingCount: number;
    completedCount: number;
    missedCount: number;
    averageRating: number;
  };

  // Gamification Data
  gamification: {
    totalPoints: number;
    level: number;
    progressToNextLevel: number;
    badges: Array<{
      id: string;
      name: string;
      description: string;
      unlockedAt: string;
      category: 'exercise' | 'attendance' | 'progress' | 'milestone';
    }>;
    achievements: Array<{
      id: string;
      title: string;
      description: string;
      completedAt: string;
      points: number;
    }>;
    streaks: {
      current: number;
      longest: number;
      type: 'exercise' | 'attendance' | 'pain_logging';
    };
  };

  // Health Insights
  insights: Array<{
    id: string;
    type: 'positive' | 'neutral' | 'warning' | 'celebration';
    title: string;
    message: string;
    actionable?: boolean;
    actionText?: string;
    priority: 'low' | 'medium' | 'high';
    category: 'pain' | 'exercise' | 'appointment' | 'progress' | 'goal';
  }>;

  // Goals and Milestones
  goals: {
    current: Array<{
      id: string;
      title: string;
      description: string;
      target: number;
      current: number;
      unit: string;
      deadline?: string;
      category: 'pain' | 'exercise' | 'attendance' | 'custom';
    }>;
    completed: Array<{
      id: string;
      title: string;
      completedAt: string;
      category: string;
    }>;
  };
}

export const usePatientAnalytics = (): {
  analytics: PatientAnalytics | null;
  isLoading: boolean;
  error: string | null;
  refreshAnalytics: () => Promise<void>;
  // Legacy support
  stats: any;
  demographics: any;
  loading: boolean;
} => {
  const { user } = useAuth();
  const { patients } = usePatients();
  const { appointments } = useAppointments();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Legacy state for backward compatibility
  const [stats, setStats] = useState<any>(null);
  const [demographics, setDemographics] = useState<any>(null);

  // Get current patient data
  const currentPatient = useMemo(() => {
    return patients.find(p => p.id === user?.id) || null;
  }, [patients, user]);

  // Calculate analytics based on patient data
  const analytics = useMemo((): PatientAnalytics | null => {
    if (!currentPatient) return null;

    try {
      // Mock data for demonstration - in production this would come from various services
      const mockPainHistory = [
        { date: '2024-01-28', level: 7, location: 'lower back' },
        { date: '2024-01-29', level: 6, location: 'lower back' },
        { date: '2024-01-30', level: 5, location: 'lower back' },
        { date: '2024-01-31', level: 4, location: 'lower back' },
        { date: '2024-02-01', level: 3, location: 'lower back' },
        { date: '2024-02-02', level: 3, location: 'lower back' },
        { date: '2024-02-03', level: 2, location: 'lower back' },
      ];

      const patientAppointments = appointments.filter(apt => apt.patientId === currentPatient.id);
      const completedAppointments = patientAppointments.filter(apt => apt.status === AppointmentStatus.Completed);
      const upcomingAppointments = patientAppointments.filter(apt => 
        new Date(apt.startTime) > new Date() && apt.status === AppointmentStatus.Scheduled
      );

      // Treatment Progress Calculations
      const exercisesCompleted = 12; // Mock data
      const totalExercises = 20;
      const painReduction = Math.round(((7 - 2) / 7) * 100); // 71% reduction from initial 7 to current 2
      const adherenceRate = 85; // Mock adherence rate

      const treatmentProgress = {
        overallProgress: Math.round((exercisesCompleted / totalExercises + completedAppointments.length / 15 + adherenceRate / 100) / 3 * 100),
        exercisesCompleted,
        totalExercises,
        appointmentsCompleted: completedAppointments.length,
        totalAppointments: patientAppointments.length,
        painReduction,
        adherenceRate
      };

      // Pain Trends
      const currentPainLevel = mockPainHistory[mockPainHistory.length - 1]?.level || 0;
      const weeklyAverage = mockPainHistory.slice(-7).reduce((sum, p) => sum + p.level, 0) / Math.max(mockPainHistory.slice(-7).length, 1);
      const monthlyAverage = mockPainHistory.reduce((sum, p) => sum + p.level, 0) / Math.max(mockPainHistory.length, 1);
      
      let trend: 'improving' | 'stable' | 'worsening' = 'stable';
      if (currentPainLevel < weeklyAverage - 0.5) trend = 'improving';
      else if (currentPainLevel > weeklyAverage + 0.5) trend = 'worsening';

      const painTrends = {
        currentLevel: currentPainLevel,
        weeklyAverage: Math.round(weeklyAverage * 10) / 10,
        monthlyAverage: Math.round(monthlyAverage * 10) / 10,
        trend,
        reductionPercentage: painReduction,
        painHistory: mockPainHistory
      };

      // Exercise Metrics
      const streakDays = 12;
      const weeklyGoal = 5;
      const completedThisWeek = 4;
      
      const exerciseMetrics = {
        streakDays,
        weeklyGoalProgress: Math.round((completedThisWeek / weeklyGoal) * 100),
        completedThisWeek,
        weeklyGoal,
        todayCompleted: false,
        favoriteExercises: ['Alongamento cervical', 'Fortalecimento lombar', 'Caminhada'],
        difficultyProgression: 75
      };

      // Appointment Metrics
      const attendanceRate = completedAppointments.length > 0 ? 
        Math.round((completedAppointments.length / Math.max(completedAppointments.length + 1, 1)) * 100) : 100;
      
      const appointmentMetrics = {
        attendanceRate,
        punctualityScore: 95,
        nextAppointment: upcomingAppointments[0],
        upcomingCount: upcomingAppointments.length,
        completedCount: completedAppointments.length,
        missedCount: 1,
        averageRating: 4.8
      };

      // Gamification Data
      const totalPoints = 2450;
      const level = Math.floor(totalPoints / 350) + 1;
      const pointsForCurrentLevel = (level - 1) * 350;
      const pointsForNextLevel = level * 350;
      const progressToNextLevel = Math.round(((totalPoints - pointsForCurrentLevel) / (pointsForNextLevel - pointsForCurrentLevel)) * 100);

      const gamification = {
        totalPoints,
        level,
        progressToNextLevel,
        badges: [
          {
            id: '1',
            name: 'Primeiro Passo',
            description: 'Completou a primeira sessão de fisioterapia',
            unlockedAt: '2024-01-15T10:00:00Z',
            category: 'milestone' as const
          },
          {
            id: '2',
            name: 'Disciplinado',
            description: '10 dias consecutivos de exercícios',
            unlockedAt: '2024-01-25T09:00:00Z',
            category: 'exercise' as const
          },
          {
            id: '3',
            name: 'Pontual',
            description: '5 consultas sem atraso',
            unlockedAt: '2024-02-01T14:00:00Z',
            category: 'attendance' as const
          }
        ],
        achievements: [
          {
            id: '1',
            title: 'Redução de Dor Significativa',
            description: 'Reduziu a dor em mais de 50%',
            completedAt: '2024-02-02T16:00:00Z',
            points: 500
          },
          {
            id: '2',
            title: 'Sequência de Ouro',
            description: 'Completou exercícios por 10 dias seguidos',
            completedAt: '2024-01-30T20:00:00Z',
            points: 300
          }
        ],
        streaks: {
          current: streakDays,
          longest: 15,
          type: 'exercise' as const
        }
      };

      // Generate Insights
      const insights = [
        {
          id: '1',
          type: 'celebration' as const,
          title: 'Excelente Progresso!',
          message: 'Sua dor diminuiu 71% desde o início do tratamento. Continue assim!',
          priority: 'high' as const,
          category: 'progress' as const
        },
        {
          id: '2',
          type: 'positive' as const,
          title: 'Sequência Impressionante',
          message: `Você está há ${streakDays} dias consecutivos fazendo exercícios. Está muito próximo de bater seu recorde!`,
          priority: 'medium' as const,
          category: 'exercise' as const
        },
        {
          id: '3',
          type: 'neutral' as const,
          title: 'Meta Semanal',
          message: `Falta apenas 1 sessão para completar sua meta semanal de ${weeklyGoal} exercícios.`,
          actionable: true,
          actionText: 'Fazer exercício agora',
          priority: 'medium' as const,
          category: 'goal' as const
        }
      ];

      // Goals and Milestones
      const goals = {
        current: [
          {
            id: '1',
            title: 'Reduzir Dor para Nível 1',
            description: 'Objetivo de reduzir a dor para o nível mínimo',
            target: 1,
            current: currentPainLevel,
            unit: '/10',
            category: 'pain' as const
          },
          {
            id: '2',
            title: 'Completar Programa de Exercícios',
            description: 'Finalizar todos os exercícios prescritos',
            target: totalExercises,
            current: exercisesCompleted,
            unit: 'exercícios',
            deadline: '2024-03-15',
            category: 'exercise' as const
          },
          {
            id: '3',
            title: 'Manter Sequência de 30 Dias',
            description: 'Realizar exercícios por 30 dias consecutivos',
            target: 30,
            current: streakDays,
            unit: 'dias',
            category: 'exercise' as const
          }
        ],
        completed: [
          {
            id: '1',
            title: 'Primeira Semana Completa',
            completedAt: '2024-01-22T18:00:00Z',
            category: 'milestone'
          }
        ]
      };

      return {
        treatmentProgress,
        painTrends,
        exerciseMetrics,
        appointmentMetrics,
        gamification,
        insights,
        goals
      };

    } catch (err) {
      console.error('Error calculating patient analytics:', err);
      setError('Erro ao calcular métricas do paciente');
      return null;
    }
  }, [currentPatient, appointments]);

  // Legacy analytics fetch for backward compatibility
  useEffect(() => {
    const fetchLegacyAnalytics = async () => {
      try {
        const [statsData, demographicsData] = await Promise.all([
          analyticsService.getPatientStatistics(),
          analyticsService.getPatientDemographics(),
        ]);
        setStats(statsData);
        setDemographics(demographicsData);
      } catch (e) {
        console.warn('Legacy analytics fetch failed:', e);
      }
    };

    fetchLegacyAnalytics();
  }, []);

  // Refresh analytics function
  const refreshAnalytics = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real app, this would fetch fresh data from the backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      // The analytics will be recalculated due to the useMemo dependency
    } catch (err) {
      setError('Erro ao atualizar métricas');
    } finally {
      setIsLoading(false);
    }
  };

  // Set initial loading state
  useEffect(() => {
    if (analytics !== null) {
      setIsLoading(false);
    }
  }, [analytics]);

  return {
    analytics,
    isLoading,
    error,
    refreshAnalytics,
    // Legacy support
    stats,
    demographics,
    loading: isLoading
  };
};
