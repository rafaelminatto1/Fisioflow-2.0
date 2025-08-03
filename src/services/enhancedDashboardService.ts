import {
  PatientDashboardData,
  DashboardPreferences,
  WidgetPosition,
  ExerciseProgress,
  PainTrendData,
  CommunicationMessage,
  DashboardNotification,
  PersonalizedGreeting,
  GamificationData,
  Achievement,
  Badge,
  Streak,
  PainInsight,
  EducationalContent,
  DailyExercisePlan,
  DashboardWidget,
  WidgetType,
} from '../types/enhancedDashboard';

// Mock data for development - replace with real API calls
const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: '1',
    title: 'Primeira Semana',
    description: 'Completou a primeira semana de exercícios',
    icon: 'calendar',
    unlockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    category: 'exercise',
    points: 100,
    rarity: 'common',
  },
  {
    id: '2',
    title: 'Guerreiro da Dor',
    description: 'Registrou dor por 30 dias consecutivos',
    icon: 'shield',
    unlockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    category: 'pain_management',
    points: 500,
    rarity: 'epic',
  },
];

const MOCK_BADGES: Badge[] = [
  {
    id: '1',
    title: 'Constante',
    description: 'Exercícios por 7 dias seguidos',
    icon: 'flame',
    category: 'exercise',
    unlockedAt: new Date(),
    rarity: 'bronze',
  },
  {
    id: '2',
    title: 'Dedicado',
    description: 'Exercícios por 30 dias seguidos',
    icon: 'star',
    category: 'exercise',
    progress: 15,
    maxProgress: 30,
    rarity: 'silver',
  },
];

const MOCK_STREAKS: Streak[] = [
  {
    id: '1',
    type: 'exercise',
    currentCount: 7,
    bestCount: 12,
    lastActivityDate: new Date(),
    isActive: true,
    goal: 30,
  },
  {
    id: '2',
    type: 'pain_logging',
    currentCount: 15,
    bestCount: 45,
    lastActivityDate: new Date(),
    isActive: true,
  },
];

const MOCK_PAIN_DATA: PainTrendData[] = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
  level: Math.floor(Math.random() * 8) + 1,
  location: i % 3 === 0 ? 'Pescoço' : i % 3 === 1 ? 'Ombro' : 'Costas',
  notes: i % 5 === 0 ? 'Dor após exercício' : undefined,
})).reverse();

const MOCK_PAIN_INSIGHTS: PainInsight[] = [
  {
    type: 'improvement',
    title: 'Melhora consistente',
    description: 'Sua dor diminuiu 40% nas últimas duas semanas',
    severity: 'low',
    confidence: 0.9,
  },
  {
    type: 'correlation',
    title: 'Exercícios ajudam',
    description: 'Dias com exercícios mostram 30% menos dor',
    severity: 'medium',
    confidence: 0.8,
    suggestedActions: ['Continue com a rotina de exercícios', 'Considere aumentar a frequência'],
  },
];

const MOCK_EDUCATIONAL_CONTENT: EducationalContent[] = [
  {
    id: '1',
    title: 'Como gerenciar dor cervical',
    description: 'Aprenda técnicas eficazes para reduzir a dor no pescoço',
    type: 'article',
    category: 'pain_management',
    difficulty: 'beginner',
    estimatedReadTime: 5,
    url: '#',
    isNew: true,
    isRecommended: true,
    tags: ['dor', 'pescoço', 'exercícios'],
    conditions: ['cervicalgia'],
  },
  {
    id: '2',
    title: 'Exercícios para fortalecer o core',
    description: 'Video demonstrando exercícios essenciais para o core',
    type: 'video',
    category: 'exercise',
    difficulty: 'intermediate',
    estimatedReadTime: 15,
    url: '#',
    isNew: false,
    isRecommended: true,
    tags: ['core', 'fortalecimento'],
    conditions: ['lombalgia'],
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

const MOCK_COMMUNICATIONS: CommunicationMessage[] = [
  {
    id: '1',
    fromUserId: 'therapist1',
    fromUserName: 'Dr. Maria Silva',
    fromUserRole: 'therapist',
    toUserId: 'patient1',
    subject: 'Progresso excelente!',
    content: 'Parabéns pelo seu progresso esta semana. Continue assim!',
    type: 'feedback',
    priority: 'normal',
    isRead: false,
    sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    tags: ['progresso', 'motivação'],
  },
  {
    id: '2',
    fromUserId: 'therapist1',
    fromUserName: 'Dr. Maria Silva',
    fromUserRole: 'therapist',
    toUserId: 'patient1',
    subject: 'Lembrete: Consulta amanhã',
    content: 'Lembre-se da sua consulta amanhã às 14h. Traga os resultados dos exercícios.',
    type: 'reminder',
    priority: 'high',
    isRead: true,
    sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    readAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
    tags: ['consulta', 'lembrete'],
  },
];

const MOCK_NOTIFICATIONS: DashboardNotification[] = [
  {
    id: '1',
    type: 'reminder',
    title: 'Hora dos exercícios!',
    message: 'Você tem 3 exercícios pendentes para hoje.',
    priority: 'medium',
    category: 'exercise',
    actionRequired: true,
    actions: [
      { id: '1', label: 'Ver exercícios', type: 'link', action: '/exercises', isPrimary: true },
      { id: '2', label: 'Lembrar mais tarde', type: 'button', action: 'snooze' },
    ],
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
    isRead: false,
    isDismissed: false,
  },
  {
    id: '2',
    type: 'achievement',
    title: '🎉 Nova conquista!',
    message: 'Você desbloqueou o badge "Constante" por exercitar-se 7 dias seguidos!',
    priority: 'high',
    category: 'gamification',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    isRead: false,
    isDismissed: false,
  },
];

// Generate personalized greeting based on time and data
function generatePersonalizedGreeting(
  userName: string,
  painData: PainTrendData[],
  exerciseStreak: number,
  achievements: Achievement[]
): PersonalizedGreeting {
  const hour = new Date().getHours();
  let timeBasedMessage = '';

  if (hour < 12) {
    timeBasedMessage = `Bom dia, ${userName}!`;
  } else if (hour < 18) {
    timeBasedMessage = `Boa tarde, ${userName}!`;
  } else {
    timeBasedMessage = `Boa noite, ${userName}!`;
  }

  let motivationalMessage = '';
  
  // Add motivational message based on recent data
  if (exerciseStreak >= 7) {
    motivationalMessage = `Você está em uma sequência incrível de ${exerciseStreak} dias de exercícios!`;
  } else if (painData.length > 0 && painData[painData.length - 1].level < 4) {
    motivationalMessage = 'Que ótimo ver que sua dor está controlada hoje!';
  } else {
    motivationalMessage = 'Vamos continuar trabalhando juntos na sua recuperação.';
  }

  // Check for recent achievements
  const recentAchievement = achievements.find(
    a => new Date(a.unlockedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  );

  return {
    timeBasedMessage,
    motivationalMessage,
    achievement: recentAchievement,
  };
}

// Generate default dashboard widgets
function generateDefaultWidgets(): DashboardWidget[] {
  const widgets: Array<{ type: WidgetType; title: string; position: { x: number; y: number } }> = [
    { type: 'personalized_header', title: 'Saudação Personalizada', position: { x: 0, y: 0 } },
    { type: 'quick_actions', title: 'Ações Rápidas', position: { x: 2, y: 0 } },
    { type: 'pain_trend', title: 'Tendência da Dor', position: { x: 0, y: 1 } },
    { type: 'exercise_streak', title: 'Sequência de Exercícios', position: { x: 1, y: 1 } },
    { type: 'next_appointments', title: 'Próximas Consultas', position: { x: 0, y: 2 } },
    { type: 'communication', title: 'Comunicações', position: { x: 2, y: 2 } },
    { type: 'educational_content', title: 'Conteúdo Educativo', position: { x: 0, y: 3 } },
    { type: 'gamification', title: 'Gamificação', position: { x: 1, y: 3 } },
  ];

  return widgets.map((widget, index) => ({
    id: widget.type,
    type: widget.type,
    title: widget.title,
    position: widget.position,
    size: { width: 1, height: 1 },
    isVisible: true,
    isCollapsed: false,
    refreshInterval: 300,
    lastUpdated: new Date(),
  }));
}

// API Functions

export async function getPatientDashboardData(patientId: string): Promise<PatientDashboardData> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const gamificationData: GamificationData = {
    totalPoints: 1250,
    level: 5,
    experiencePoints: 250,
    experienceToNextLevel: 500,
    badges: MOCK_BADGES,
    achievements: MOCK_ACHIEVEMENTS,
    streaks: MOCK_STREAKS,
    leaderboardPosition: 12,
    weeklyRank: 3,
  };

  const exerciseStreak = gamificationData.streaks.find(s => s.type === 'exercise')?.currentCount || 0;
  
  const dashboardData: PatientDashboardData = {
    patient: {
      id: patientId,
      name: 'João Silva',
      preferredName: 'João',
      treatmentStartDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      condition: 'Cervicalgia',
      treatmentGoals: ['Reduzir dor cervical', 'Melhorar mobilidade', 'Fortalecer musculatura'],
    },
    greeting: generatePersonalizedGreeting('João', MOCK_PAIN_DATA, exerciseStreak, MOCK_ACHIEVEMENTS),
    gamification: gamificationData,
    painData: {
      recent: MOCK_PAIN_DATA,
      insights: MOCK_PAIN_INSIGHTS,
      currentLevel: MOCK_PAIN_DATA[MOCK_PAIN_DATA.length - 1]?.level,
      trend: 'improving',
    },
    exerciseData: {
      todaysPlan: {
        date: new Date(),
        exercises: [
          {
            exerciseId: '1',
            exerciseName: 'Alongamento cervical lateral',
            completedSets: 2,
            totalSets: 3,
            completedReps: 10,
            totalReps: 15,
            difficultyLevel: 2,
            completedAt: new Date(),
          },
          {
            exerciseId: '2',
            exerciseName: 'Rotação de ombros',
            completedSets: 0,
            totalSets: 2,
            completedReps: 0,
            totalReps: 20,
            difficultyLevel: 1,
          },
          {
            exerciseId: '3',
            exerciseName: 'Fortalecimento do trapézio',
            completedSets: 1,
            totalSets: 2,
            completedReps: 8,
            totalReps: 12,
            difficultyLevel: 3,
          },
        ],
        totalDuration: 45,
        completionPercentage: 33,
        targetCompletion: 100,
        remindersSent: 1,
        skippedExercises: [],
      },
      weeklyProgress: [],
      streaks: MOCK_STREAKS,
    },
    appointments: {
      upcoming: [],
      recent: [],
    },
    communications: {
      unreadCount: 1,
      recent: MOCK_COMMUNICATIONS,
      urgent: MOCK_COMMUNICATIONS.filter(c => c.priority === 'high' || c.priority === 'urgent'),
    },
    educationalContent: MOCK_EDUCATIONAL_CONTENT,
    notifications: MOCK_NOTIFICATIONS,
    preferences: {
      userId: patientId,
      theme: 'light',
      fontSize: 'medium',
      animationsEnabled: true,
      notificationsEnabled: true,
      widgets: generateDefaultWidgets(),
      layout: 'grid',
      autoRefresh: true,
      refreshInterval: 300,
      accessibility: {
        highContrast: false,
        largeText: false,
        reduceMotion: false,
        screenReaderOptimized: false,
        keyboardNavigationEnabled: true,
        focusIndicatorEnhanced: false,
      },
    },
  };

  return dashboardData;
}

export async function updateDashboardPreferences(
  patientId: string,
  preferences: Partial<DashboardPreferences>
): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real implementation, this would save to the backend
  console.log('Updating preferences for patient:', patientId, preferences);
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 200));
  console.log('Marking notification as read:', notificationId);
}

export async function dismissNotification(notificationId: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 200));
  console.log('Dismissing notification:', notificationId);
}

export async function recordPainLevel(
  patientId: string,
  painData: Omit<PainTrendData, 'date'> & { date: Date }
): Promise<PainTrendData> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const newPainData: PainTrendData = {
    date: painData.date,
    level: painData.level,
    location: painData.location,
    notes: painData.notes,
    triggers: painData.triggers,
    medications: painData.medications,
    activities: painData.activities,
  };

  console.log('Recording pain level for patient:', patientId, newPainData);
  return newPainData;
}

export async function completeExercise(
  patientId: string,
  exerciseId: string,
  exerciseData: Partial<ExerciseProgress>
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('Completing exercise for patient:', patientId, exerciseId, exerciseData);
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 200));
  console.log('Marking message as read:', messageId);
}

export async function sendMessage(
  patientId: string,
  content: string,
  subject?: string
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('Sending message from patient:', patientId, { subject, content });
}

export async function markEducationalContentAsCompleted(
  patientId: string,
  contentId: string
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log('Marking educational content as completed:', patientId, contentId);
}

export async function updateWidgetPosition(
  patientId: string,
  widgetId: string,
  position: WidgetPosition
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 200));
  console.log('Updating widget position:', patientId, widgetId, position);
}

export async function toggleWidgetVisibility(
  patientId: string,
  widgetId: string
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 200));
  console.log('Toggling widget visibility:', patientId, widgetId);
}