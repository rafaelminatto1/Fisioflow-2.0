import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  PatientDashboardData,
  DashboardContextType,
  DashboardPreferences,
  WidgetPosition,
  ExerciseProgress,
  PainModalData,
  DashboardNotification,
} from '../types/enhancedDashboard';
import * as enhancedDashboardService from '../services/enhancedDashboardService';

// Action types for the reducer
type DashboardAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DATA'; payload: PatientDashboardData }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<DashboardPreferences> }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'DISMISS_NOTIFICATION'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: DashboardNotification }
  | { type: 'UPDATE_PAIN_DATA'; payload: any }
  | { type: 'UPDATE_EXERCISE_PROGRESS'; payload: { exerciseId: string; data: Partial<ExerciseProgress> } }
  | { type: 'MARK_MESSAGE_READ'; payload: string }
  | { type: 'UPDATE_WIDGET_POSITION'; payload: { widgetId: string; position: WidgetPosition } }
  | { type: 'TOGGLE_WIDGET_VISIBILITY'; payload: string };

// Initial state
interface DashboardState {
  data: PatientDashboardData | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  data: null,
  isLoading: true,
  error: null,
};

// Reducer function
function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_DATA':
      return { ...state, data: action.payload, isLoading: false, error: null };
    
    case 'UPDATE_PREFERENCES':
      if (!state.data) return state;
      return {
        ...state,
        data: {
          ...state.data,
          preferences: { ...state.data.preferences, ...action.payload },
        },
      };
    
    case 'MARK_NOTIFICATION_READ':
      if (!state.data) return state;
      return {
        ...state,
        data: {
          ...state.data,
          notifications: state.data.notifications.map(notification =>
            notification.id === action.payload
              ? { ...notification, isRead: true }
              : notification
          ),
        },
      };
    
    case 'DISMISS_NOTIFICATION':
      if (!state.data) return state;
      return {
        ...state,
        data: {
          ...state.data,
          notifications: state.data.notifications.map(notification =>
            notification.id === action.payload
              ? { ...notification, isDismissed: true }
              : notification
          ),
        },
      };
    
    case 'ADD_NOTIFICATION':
      if (!state.data) return state;
      return {
        ...state,
        data: {
          ...state.data,
          notifications: [action.payload, ...state.data.notifications],
        },
      };
    
    case 'UPDATE_PAIN_DATA':
      if (!state.data) return state;
      return {
        ...state,
        data: {
          ...state.data,
          painData: {
            ...state.data.painData,
            recent: [action.payload, ...state.data.painData.recent.slice(0, 29)],
            currentLevel: action.payload.level,
          },
        },
      };
    
    case 'UPDATE_EXERCISE_PROGRESS':
      if (!state.data) return state;
      const updatedExercises = state.data.exerciseData.todaysPlan.exercises.map(exercise =>
        exercise.exerciseId === action.payload.exerciseId
          ? { ...exercise, ...action.payload.data }
          : exercise
      );
      
      const completionPercentage = (updatedExercises.filter(e => e.completedAt).length / updatedExercises.length) * 100;
      
      return {
        ...state,
        data: {
          ...state.data,
          exerciseData: {
            ...state.data.exerciseData,
            todaysPlan: {
              ...state.data.exerciseData.todaysPlan,
              exercises: updatedExercises,
              completionPercentage,
            },
          },
        },
      };
    
    case 'MARK_MESSAGE_READ':
      if (!state.data) return state;
      return {
        ...state,
        data: {
          ...state.data,
          communications: {
            ...state.data.communications,
            recent: state.data.communications.recent.map(message =>
              message.id === action.payload
                ? { ...message, isRead: true, readAt: new Date() }
                : message
            ),
            unreadCount: Math.max(0, state.data.communications.unreadCount - 1),
          },
        },
      };
    
    case 'UPDATE_WIDGET_POSITION':
      if (!state.data) return state;
      return {
        ...state,
        data: {
          ...state.data,
          preferences: {
            ...state.data.preferences,
            widgets: state.data.preferences.widgets.map(widget =>
              widget.id === action.payload.widgetId
                ? { ...widget, position: action.payload.position }
                : widget
            ),
          },
        },
      };
    
    case 'TOGGLE_WIDGET_VISIBILITY':
      if (!state.data) return state;
      return {
        ...state,
        data: {
          ...state.data,
          preferences: {
            ...state.data.preferences,
            widgets: state.data.preferences.widgets.map(widget =>
              widget.id === action.payload
                ? { ...widget, isVisible: !widget.isVisible }
                : widget
            ),
          },
        },
      };
    
    default:
      return state;
  }
}

// Create context
const EnhancedDashboardContext = createContext<DashboardContextType | null>(null);

// Provider component
interface EnhancedDashboardProviderProps {
  children: React.ReactNode;
}

export const EnhancedDashboardProvider: React.FC<EnhancedDashboardProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const { user } = useAuth();
  const { success, error } = useToast();

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    if (!user?.id) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const dashboardData = await enhancedDashboardService.getPatientDashboardData(user.id);
      dispatch({ type: 'SET_DATA', payload: dashboardData });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Erro ao carregar dados do dashboard' });
      error('Erro ao carregar dados do dashboard');
    }
  }, [user?.id, error]);

  // Refresh data
  const refreshData = useCallback(async () => {
    await loadDashboardData();
  }, [loadDashboardData]);

  // Update preferences
  const updatePreferences = useCallback(async (preferences: Partial<DashboardPreferences>) => {
    if (!user?.id) return;

    try {
      await enhancedDashboardService.updateDashboardPreferences(user.id, preferences);
      dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
      success('Preferências atualizadas com sucesso');
    } catch (err: any) {
      error('Erro ao atualizar preferências');
      throw err;
    }
  }, [user?.id, success, error]);

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      await enhancedDashboardService.markNotificationAsRead(notificationId);
      dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notificationId });
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Dismiss notification
  const dismissNotification = useCallback(async (notificationId: string) => {
    try {
      await enhancedDashboardService.dismissNotification(notificationId);
      dispatch({ type: 'DISMISS_NOTIFICATION', payload: notificationId });
    } catch (err: any) {
      console.error('Error dismissing notification:', err);
    }
  }, []);

  // Record pain level
  const recordPainLevel = useCallback(async (level: number, notes?: string) => {
    if (!user?.id) return;

    try {
      const painData = await enhancedDashboardService.recordPainLevel(user.id, {
        level,
        notes,
        date: new Date(),
      });
      
      dispatch({ type: 'UPDATE_PAIN_DATA', payload: painData });
      success(`Nível de dor ${level}/10 registrado com sucesso`);

      // Add achievement notification if it's a streak
      const notification: DashboardNotification = {
        id: Date.now().toString(),
        type: 'celebration',
        title: 'Dor registrada!',
        message: 'Continue monitorando sua dor para melhor acompanhamento.',
        priority: 'low',
        category: 'pain_tracking',
        createdAt: new Date(),
        isRead: false,
        isDismissed: false,
      };
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    } catch (err: any) {
      error('Erro ao registrar nível de dor');
      throw err;
    }
  }, [user?.id, success, error]);

  // Complete exercise
  const completeExercise = useCallback(async (exerciseId: string, data: Partial<ExerciseProgress>) => {
    if (!user?.id) return;

    try {
      await enhancedDashboardService.completeExercise(user.id, exerciseId, {
        ...data,
        completedAt: new Date(),
      });
      
      dispatch({ type: 'UPDATE_EXERCISE_PROGRESS', payload: { exerciseId, data: { ...data, completedAt: new Date() } } });
      success('Exercício concluído com sucesso!');

      // Add celebration notification
      const notification: DashboardNotification = {
        id: Date.now().toString(),
        type: 'celebration',
        title: '🎉 Exercício concluído!',
        message: 'Parabéns! Você está fazendo um ótimo progresso.',
        priority: 'medium',
        category: 'exercise',
        createdAt: new Date(),
        isRead: false,
        isDismissed: false,
      };
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
    } catch (err: any) {
      error('Erro ao completar exercício');
      throw err;
    }
  }, [user?.id, success, error]);

  // Mark message as read
  const markMessageAsRead = useCallback(async (messageId: string) => {
    try {
      await enhancedDashboardService.markMessageAsRead(messageId);
      dispatch({ type: 'MARK_MESSAGE_READ', payload: messageId });
    } catch (err: any) {
      console.error('Error marking message as read:', err);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (content: string, subject?: string) => {
    if (!user?.id) return;

    try {
      await enhancedDashboardService.sendMessage(user.id, content, subject);
      success('Mensagem enviada com sucesso');
      await refreshData(); // Refresh to get updated communications
    } catch (err: any) {
      error('Erro ao enviar mensagem');
      throw err;
    }
  }, [user?.id, success, error, refreshData]);

  // Mark educational content as completed
  const markEducationalContentAsCompleted = useCallback(async (contentId: string) => {
    if (!user?.id) return;

    try {
      await enhancedDashboardService.markEducationalContentAsCompleted(user.id, contentId);
      success('Conteúdo marcado como concluído');
      await refreshData();
    } catch (err: any) {
      error('Erro ao marcar conteúdo como concluído');
      throw err;
    }
  }, [user?.id, success, error, refreshData]);

  // Update widget position
  const updateWidgetPosition = useCallback(async (widgetId: string, position: WidgetPosition) => {
    if (!user?.id) return;

    try {
      await enhancedDashboardService.updateWidgetPosition(user.id, widgetId, position);
      dispatch({ type: 'UPDATE_WIDGET_POSITION', payload: { widgetId, position } });
    } catch (err: any) {
      console.error('Error updating widget position:', err);
    }
  }, [user?.id]);

  // Toggle widget visibility
  const toggleWidgetVisibility = useCallback(async (widgetId: string) => {
    if (!user?.id) return;

    try {
      await enhancedDashboardService.toggleWidgetVisibility(user.id, widgetId);
      dispatch({ type: 'TOGGLE_WIDGET_VISIBILITY', payload: widgetId });
    } catch (err: any) {
      console.error('Error toggling widget visibility:', err);
    }
  }, [user?.id]);

  // Load data when user changes
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh data periodically
  useEffect(() => {
    if (!state.data?.preferences.autoRefresh) return;

    const interval = setInterval(() => {
      loadDashboardData();
    }, (state.data.preferences.refreshInterval || 300) * 1000); // Convert to milliseconds

    return () => clearInterval(interval);
  }, [state.data?.preferences.autoRefresh, state.data?.preferences.refreshInterval, loadDashboardData]);

  const contextValue: DashboardContextType = {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refreshData,
    updatePreferences,
    markNotificationAsRead,
    dismissNotification,
    recordPainLevel,
    completeExercise,
    markMessageAsRead,
    sendMessage,
    markEducationalContentAsCompleted,
    updateWidgetPosition,
    toggleWidgetVisibility,
  };

  return (
    <EnhancedDashboardContext.Provider value={contextValue}>
      {children}
    </EnhancedDashboardContext.Provider>
  );
};

// Hook to use the dashboard context
export const useEnhancedDashboard = () => {
  const context = useContext(EnhancedDashboardContext);
  if (!context) {
    throw new Error('useEnhancedDashboard must be used within an EnhancedDashboardProvider');
  }
  return context;
};

export default EnhancedDashboardContext;