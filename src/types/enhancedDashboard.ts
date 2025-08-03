// Enhanced Dashboard Types for Patient Portal

export interface PersonalizedGreeting {
  timeBasedMessage: string;
  motivationalMessage?: string;
  achievement?: Achievement;
  milestone?: Milestone;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  category: 'exercise' | 'pain_management' | 'attendance' | 'education' | 'consistency';
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  category: 'exercise' | 'pain_reduction' | 'attendance' | 'streak';
  completedAt?: Date;
  celebrationShown?: boolean;
}

export interface GamificationData {
  totalPoints: number;
  level: number;
  experiencePoints: number;
  experienceToNextLevel: number;
  badges: Badge[];
  achievements: Achievement[];
  streaks: Streak[];
  leaderboardPosition?: number;
  weeklyRank?: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface Streak {
  id: string;
  type: 'exercise' | 'pain_logging' | 'attendance' | 'education';
  currentCount: number;
  bestCount: number;
  lastActivityDate: Date;
  isActive: boolean;
  goal?: number;
}

export interface PainTrendData {
  date: Date;
  level: number;
  location?: string;
  notes?: string;
  triggers?: string[];
  medications?: string[];
  activities?: string[];
}

export interface PainInsight {
  type: 'trend' | 'correlation' | 'alert' | 'improvement';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  actionRequired?: boolean;
  suggestedActions?: string[];
  confidence: number;
}

export interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  completedSets: number;
  totalSets: number;
  completedReps: number;
  totalReps: number;
  difficultyLevel: number;
  completedAt?: Date;
  duration?: number;
  notes?: string;
  painLevelBefore?: number;
  painLevelAfter?: number;
}

export interface DailyExercisePlan {
  date: Date;
  exercises: ExerciseProgress[];
  totalDuration: number;
  completionPercentage: number;
  targetCompletion: number;
  remindersSent: number;
  skippedExercises: string[];
}

export interface EducationalContent {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'infographic' | 'quiz' | 'checklist';
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number;
  thumbnailUrl?: string;
  url: string;
  isNew: boolean;
  isRecommended: boolean;
  tags: string[];
  conditions: string[];
  completedAt?: Date;
  progressPercentage?: number;
  rating?: number;
}

export interface CommunicationMessage {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserRole: 'therapist' | 'admin' | 'assistant';
  toUserId: string;
  subject: string;
  content: string;
  type: 'message' | 'reminder' | 'alert' | 'instruction' | 'feedback';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
  sentAt: Date;
  readAt?: Date;
  attachments?: MessageAttachment[];
  requiresResponse?: boolean;
  tags: string[];
}

export interface MessageAttachment {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  size: WidgetSize;
  isVisible: boolean;
  isCollapsed: boolean;
  refreshInterval?: number;
  lastUpdated?: Date;
  config?: Record<string, any>;
}

export type WidgetType = 
  | 'personalized_header'
  | 'pain_trend'
  | 'exercise_streak'
  | 'next_appointments'
  | 'treatment_progress'
  | 'quick_actions'
  | 'educational_content'
  | 'communication'
  | 'gamification'
  | 'recent_activity'
  | 'motivational';

export interface WidgetPosition {
  x: number;
  y: number;
  gridColumn?: number;
  gridRow?: number;
}

export interface WidgetSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface DashboardPreferences {
  userId: string;
  theme: 'light' | 'dark' | 'high_contrast';
  fontSize: 'small' | 'medium' | 'large';
  animationsEnabled: boolean;
  notificationsEnabled: boolean;
  widgets: DashboardWidget[];
  layout: 'grid' | 'list' | 'compact';
  autoRefresh: boolean;
  refreshInterval: number;
  customColors?: Record<string, string>;
  accessibility: AccessibilityPreferences;
}

export interface AccessibilityPreferences {
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  screenReaderOptimized: boolean;
  keyboardNavigationEnabled: boolean;
  focusIndicatorEnhanced: boolean;
}

export interface DashboardNotification {
  id: string;
  type: 'reminder' | 'achievement' | 'alert' | 'celebration' | 'tip';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  actionRequired?: boolean;
  actions?: NotificationAction[];
  icon?: string;
  color?: string;
  expiresAt?: Date;
  createdAt: Date;
  isRead: boolean;
  isDismissed: boolean;
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'button' | 'link';
  action: string;
  isPrimary?: boolean;
  url?: string;
}

export interface PatientDashboardData {
  patient: {
    id: string;
    name: string;
    preferredName?: string;
    profileImage?: string;
    treatmentStartDate: Date;
    condition: string;
    treatmentGoals: string[];
  };
  greeting: PersonalizedGreeting;
  gamification: GamificationData;
  painData: {
    recent: PainTrendData[];
    insights: PainInsight[];
    currentLevel?: number;
    trend: 'improving' | 'stable' | 'worsening';
  };
  exerciseData: {
    todaysPlan: DailyExercisePlan;
    weeklyProgress: DailyExercisePlan[];
    streaks: Streak[];
  };
  appointments: {
    upcoming: any[];
    recent: any[];
    nextAppointment?: any;
  };
  communications: {
    unreadCount: number;
    recent: CommunicationMessage[];
    urgent: CommunicationMessage[];
  };
  educationalContent: EducationalContent[];
  notifications: DashboardNotification[];
  preferences: DashboardPreferences;
}

export interface DashboardContextType {
  data: PatientDashboardData | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  updatePreferences: (preferences: Partial<DashboardPreferences>) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  dismissNotification: (notificationId: string) => Promise<void>;
  recordPainLevel: (level: number, notes?: string) => Promise<void>;
  completeExercise: (exerciseId: string, data: Partial<ExerciseProgress>) => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  sendMessage: (content: string, subject?: string) => Promise<void>;
  markEducationalContentAsCompleted: (contentId: string) => Promise<void>;
  updateWidgetPosition: (widgetId: string, position: WidgetPosition) => Promise<void>;
  toggleWidgetVisibility: (widgetId: string) => Promise<void>;
}

// Widget-specific types
export interface PainModalData {
  level: number;
  location?: string;
  notes?: string;
  triggers?: string[];
  medications?: string[];
}

export interface ExerciseQuickStartData {
  exerciseId: string;
  startTime: Date;
  estimatedDuration: number;
}

export interface AppointmentSchedulingData {
  preferredDate?: Date;
  preferredTime?: string;
  type: string;
  notes?: string;
  isUrgent?: boolean;
}

export interface DocumentAccessData {
  documentId: string;
  accessType: 'view' | 'download' | 'share';
  sharedWith?: string[];
  expiresAt?: Date;
}