import { supabase } from './supabaseClient';
import type { 
  AuthResponse, 
  User, 
  Session,
  AuthError,
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials
} from '@supabase/supabase-js';

export interface UserRegistration {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'therapist' | 'patient' | 'partner' | 'admin';
  phone?: string;
}

export interface ProfileUpdate {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  preferences?: Record<string, any>;
}

export interface AuthServiceResponse<T = any> {
  data: T | null;
  error: AuthError | Error | null;
  success: boolean;
}

export class AuthService {
  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<AuthServiceResponse<{ user: User; session: Session }>> {
    try {
      const credentials: SignInWithPasswordCredentials = { email, password };
      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      
      if (error) {
        return { data: null, error, success: false };
      }
      
      return { data, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown sign in error'), 
        success: false 
      };
    }
  }

  /**
   * Sign up new user with profile creation
   */
  static async signUp(userData: UserRegistration): Promise<AuthServiceResponse<{ user: User; session: Session | null }>> {
    try {
      const { email, password, firstName, lastName, role, phone } = userData;
      
      const credentials: SignUpWithPasswordCredentials = {
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role,
            phone: phone || null
          }
        }
      };
      
      const { data, error } = await supabase.auth.signUp(credentials);
      
      if (error) {
        return { data: null, error, success: false };
      }
      
      // If user is created, create profile record
      if (data.user) {
        const profileError = await this.createUserProfile(data.user.id, {
          firstName,
          lastName,
          role,
          phone
        });
        
        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Note: User is still created in auth, but profile creation failed
        }
      }
      
      // Ensure data has the correct structure
      if (!data?.user) {
        throw new Error('User creation failed - no user data returned');
      }
      
      return { 
        data: { 
          user: data.user, 
          session: data.session 
        }, 
        error: null, 
        success: true 
      };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown sign up error'), 
        success: false 
      };
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<AuthServiceResponse<void>> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { data: null, error, success: false };
      }
      
      return { data: null, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown sign out error'), 
        success: false 
      };
    }
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<AuthServiceResponse<User>> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        return { data: null, error, success: false };
      }
      
      return { data: user, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown get user error'), 
        success: false 
      };
    }
  }

  /**
   * Update password for current user
   */
  static async updatePassword(newPassword: string): Promise<AuthServiceResponse<void>> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        return { data: null, error, success: false };
      }
      
      return { data: null, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown update password error'), 
        success: false 
      };
    }
  }

  /**
   * Get current session
   */
  static async getCurrentSession(): Promise<AuthServiceResponse<Session>> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        return { data: null, error, success: false };
      }
      
      return { data: session, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown get session error'), 
        success: false 
      };
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(updates: ProfileUpdate): Promise<AuthServiceResponse<any>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return { data: null, error: userError || new Error('User not authenticated'), success: false };
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
          phone: updates.phone,
          avatar: updates.avatar,
          preferences: updates.preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        return { data: null, error, success: false };
      }
      
      return { data, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown profile update error'), 
        success: false 
      };
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string): Promise<AuthServiceResponse<void>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        return { data: null, error, success: false };
      }
      
      return { data: null, error: null, success: true };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown password reset error'), 
        success: false 
      };
    }
  }

  /**
   * Create user profile in profiles table
   */
  private static async createUserProfile(userId: string, profileData: {
    firstName: string;
    lastName: string;
    role: string;
    phone?: string;
  }): Promise<Error | null> {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          role: profileData.role,
          phone: profileData.phone || null,
          preferences: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      return error;
    } catch (error) {
      return error instanceof Error ? error : new Error('Unknown profile creation error');
    }
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export default AuthService;