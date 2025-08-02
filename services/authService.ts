
import { User, Role } from '../types';
import { AuthService as SupabaseAuthService } from './supabase';
import { mockUsers } from '../data/mockData';

const SESSION_KEY = 'fisioflow_user_session';
const USE_SUPABASE = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

// Convert Supabase user to our User type
const convertSupabaseUser = (supabaseUser: any): User => {
  return {
    id: supabaseUser.id,
    name: supabaseUser.user_metadata?.first_name + ' ' + supabaseUser.user_metadata?.last_name || supabaseUser.email,
    email: supabaseUser.email,
    role: supabaseUser.user_metadata?.role || Role.Patient,
    avatarUrl: supabaseUser.user_metadata?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(supabaseUser.email)}&background=14b8a6&color=fff`,
  };
};

export const login = async (email: string, password: string): Promise<User> => {
  try {
    if (USE_SUPABASE) {
      const { data, error, success } = await SupabaseAuthService.signIn(email, password);
      
      if (!success || error) {
        throw new Error(error?.message || 'Erro de autenticação');
      }

      const user = convertSupabaseUser(data.user);
      
      // Store in session storage for compatibility
      const sessionData = {
        user,
        timestamp: Date.now(),
        supabaseSession: data.session,
      };
      
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      
      return user;
    } else {
      // Fallback to mock authentication
      return mockLogin(email, password);
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Credenciais inválidas.');
  }
};

const mockLogin = async (email: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find(u => u.email === email);
      
      // WARNING: This is for development only
      if (user && password === 'password123') {
        const sessionData = {
          user,
          timestamp: Date.now(),
        };
        
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        resolve(user);
      } else {
        reject(new Error('Credenciais inválidas.'));
      }
    }, 500);
  });
};

export const register = async (userData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  phone?: string;
}): Promise<User> => {
  try {
    if (USE_SUPABASE) {
      const { data, error, success } = await SupabaseAuthService.signUp(userData);
      
      if (!success || error) {
        throw new Error(error?.message || 'Erro ao criar conta');
      }

      if (data.user) {
        return convertSupabaseUser(data.user);
      } else {
        throw new Error('Usuário não foi criado');
      }
    } else {
      // Mock registration
      const newUser: User = {
        id: `user_${Date.now()}`,
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        role: userData.role,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.firstName + ' ' + userData.lastName)}&background=14b8a6&color=fff`,
      };
      
      mockUsers.push(newUser);
      return newUser;
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Erro ao criar conta');
  }
};

export const logout = async (): Promise<void> => {
  try {
    if (USE_SUPABASE) {
      await SupabaseAuthService.signOut();
    }
    
    // Always clear local session
    sessionStorage.removeItem(SESSION_KEY);
  } catch (error) {
    // Always clear local session, even if logout fails
    sessionStorage.removeItem(SESSION_KEY);
    throw error;
  }
};

export const getSession = (): User | null => {
  const sessionData = getSessionData();
  
  if (!sessionData) {
    return null;
  }

  // Check if session is expired (24 hours)
  const isExpired = Date.now() - sessionData.timestamp > 24 * 60 * 60 * 1000;
  
  if (isExpired) {
    logout();
    return null;
  }

  return sessionData.user;
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    if (USE_SUPABASE) {
      const { data, error, success } = await SupabaseAuthService.getCurrentUser();
      
      if (success && data) {
        const user = convertSupabaseUser(data);
        
        // Update session storage
        const sessionData = {
          user,
          timestamp: Date.now(),
        };
        
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        
        return user;
      }
    }
    
    // Fallback to session storage
    return getSession();
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    if (USE_SUPABASE) {
      const { error, success } = await SupabaseAuthService.resetPassword(email);
      
      if (!success || error) {
        throw new Error(error?.message || 'Erro ao resetar senha');
      }
    } else {
      // Mock password reset
      console.log('Mock password reset for:', email);
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Erro ao resetar senha');
  }
};

export const updatePassword = async (newPassword: string): Promise<void> => {
  try {
    if (USE_SUPABASE) {
      const { error, success } = await SupabaseAuthService.updatePassword(newPassword);
      
      if (!success || error) {
        throw new Error(error?.message || 'Erro ao atualizar senha');
      }
    } else {
      // Mock password update
      console.log('Mock password update');
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Erro ao atualizar senha');
  }
};

export const updateProfile = async (updates: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}): Promise<User> => {
  try {
    if (USE_SUPABASE) {
      const { data, error, success } = await SupabaseAuthService.updateProfile(updates);
      
      if (!success || error) {
        throw new Error(error?.message || 'Erro ao atualizar perfil');
      }

      const user = convertSupabaseUser(data);
      
      // Update session storage
      const sessionData = getSessionData();
      if (sessionData) {
        sessionData.user = user;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      }
      
      return user;
    } else {
      // Mock profile update
      const sessionData = getSessionData();
      if (sessionData) {
        const updatedUser = {
          ...sessionData.user,
          name: updates.firstName && updates.lastName 
            ? `${updates.firstName} ${updates.lastName}` 
            : sessionData.user.name,
          avatarUrl: updates.avatarUrl || sessionData.user.avatarUrl,
        };
        
        sessionData.user = updatedUser;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        
        return updatedUser;
      }
      
      throw new Error('Usuário não encontrado');
    }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Erro ao atualizar perfil');
  }
};

const getSessionData = (): {
  user: User;
  timestamp: number;
  supabaseSession?: any;
} | null => {
  try {
    const userJson = sessionStorage.getItem(SESSION_KEY);
    if (userJson) {
      return JSON.parse(userJson);
    }
  } catch (error) {
    console.error('Failed to parse session data:', error);
    sessionStorage.removeItem(SESSION_KEY);
  }
  return null;
};

// Auth state change listener for Supabase
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (USE_SUPABASE) {
    return SupabaseAuthService.onAuthStateChange((event, session) => {
      if (session?.user) {
        const user = convertSupabaseUser(session.user);
        callback(user);
      } else {
        callback(null);
      }
    });
  }
  
  // For mock auth, return a dummy unsubscribe function
  return { data: { subscription: { unsubscribe: () => {} } } };
};