import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { mockSupabaseHelpers } from '../../src/test/mocks/supabase';
import { mockUsers } from '../../src/test/utils';
import { ReactNode } from 'react';

// Wrapper component for testing hooks
const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    mockSupabaseHelpers.resetMocks();
  });

  describe('useAuth hook', () => {
    it('should provide initial auth state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(typeof result.current.signIn).toBe('function');
      expect(typeof result.current.signUp).toBe('function');
      expect(typeof result.current.signOut).toBe('function');
      expect(typeof result.current.updateProfile).toBe('function');
      expect(typeof result.current.refreshUser).toBe('function');
      expect(typeof result.current.hasRole).toBe('function');
      expect(typeof result.current.hasAnyRole).toBe('function');
    });

    it('should handle successful sign in', async () => {
      mockSupabaseHelpers.setAuthUser(mockUsers.admin);
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        const response = await result.current.signIn('admin@test.com', 'password123');
        expect(response.error).toBeNull();
        expect(response.user).toEqual(mockUsers.admin);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUsers.admin);
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle sign in error', async () => {
      const mockError = { message: 'Invalid credentials' };
      mockSupabaseHelpers.setMockError(mockError);
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        const response = await result.current.signIn('invalid@test.com', 'wrongpassword');
        expect(response.error).toEqual(mockError);
        expect(response.user).toBeNull();
      });

      expect(result.current.user).toBeNull();
    });

    it('should handle successful sign up', async () => {
      const newUser = { ...mockUsers.patient, email: 'newuser@test.com' };
      mockSupabaseHelpers.setAuthUser(newUser);
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      const userData = {
        email: 'newuser@test.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        role: 'patient' as const,
      };

      await act(async () => {
        const response = await result.current.signUp(userData);
        expect(response.error).toBeNull();
        expect(response.user).toEqual(newUser);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(newUser);
      });
    });

    it('should handle sign up error', async () => {
      const mockError = { message: 'Email already exists' };
      mockSupabaseHelpers.setMockError(mockError);
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      const userData = {
        email: 'existing@test.com',
        password: 'password123',
        firstName: 'Existing',
        lastName: 'User',
        role: 'patient' as const,
      };

      await act(async () => {
        const response = await result.current.signUp(userData);
        expect(response.error).toEqual(mockError);
        expect(response.user).toBeNull();
      });
    });

    it('should handle sign out', async () => {
      // First sign in
      mockSupabaseHelpers.setAuthUser(mockUsers.admin);
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.signIn('admin@test.com', 'password123');
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUsers.admin);
      });

      // Then sign out
      mockSupabaseHelpers.setAuthUser(null);

      await act(async () => {
        const response = await result.current.signOut();
        expect(response.error).toBeNull();
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });
    });

    it('should handle profile update', async () => {
      const updatedUser = { 
        ...mockUsers.admin, 
        profile: { 
          ...mockUsers.admin.profile, 
          firstName: 'Updated Name' 
        } 
      };
      
      mockSupabaseHelpers.setAuthUser(mockUsers.admin);
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // Sign in first
      await act(async () => {
        await result.current.signIn('admin@test.com', 'password123');
      });

      // Update profile
      mockSupabaseHelpers.setAuthUser(updatedUser);

      await act(async () => {
        const response = await result.current.updateProfile({
          firstName: 'Updated Name',
        });
        expect(response.error).toBeNull();
        expect(response.user?.profile.firstName).toBe('Updated Name');
      });

      await waitFor(() => {
        expect(result.current.user?.profile.firstName).toBe('Updated Name');
      });
    });

    it('should check user roles correctly', async () => {
      mockSupabaseHelpers.setAuthUser(mockUsers.therapist);
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.signIn('therapist@test.com', 'password123');
      });

      await waitFor(() => {
        expect(result.current.hasRole('therapist')).toBe(true);
        expect(result.current.hasRole('admin')).toBe(false);
        expect(result.current.hasRole('patient')).toBe(false);
        
        expect(result.current.hasAnyRole(['therapist', 'admin'])).toBe(true);
        expect(result.current.hasAnyRole(['admin', 'patient'])).toBe(false);
        expect(result.current.hasAnyRole([])).toBe(false);
      });
    });

    it('should handle role checks when user is null', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.hasRole('admin')).toBe(false);
      expect(result.current.hasAnyRole(['admin', 'therapist'])).toBe(false);
    });

    it('should refresh user data', async () => {
      const refreshedUser = { 
        ...mockUsers.admin, 
        profile: { 
          ...mockUsers.admin.profile, 
          firstName: 'Refreshed Name' 
        } 
      };
      
      mockSupabaseHelpers.setAuthUser(mockUsers.admin);
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // Sign in first
      await act(async () => {
        await result.current.signIn('admin@test.com', 'password123');
      });

      // Update mock to return refreshed user
      mockSupabaseHelpers.setAuthUser(refreshedUser);

      await act(async () => {
        const user = await result.current.refreshUser();
        expect(user?.profile.firstName).toBe('Refreshed Name');
      });

      await waitFor(() => {
        expect(result.current.user?.profile.firstName).toBe('Refreshed Name');
      });
    });

    it('should handle auth state changes', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // Initially no user
      expect(result.current.user).toBeNull();

      // Simulate auth state change
      mockSupabaseHelpers.setAuthUser(mockUsers.patient);

      // Trigger auth state change (this would normally be done by Supabase)
      await act(async () => {
        // Simulate the auth state change callback
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Note: In a real test, you'd need to trigger the actual auth state change
      // This is a simplified version for demonstration
    });

    it('should handle loading states correctly', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // Initially loading
      expect(result.current.loading).toBe(true);

      // After auth check completes
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle network errors gracefully', async () => {
      const networkError = { message: 'Network error', code: 'NETWORK_ERROR' };
      mockSupabaseHelpers.setMockError(networkError);
      
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        const response = await result.current.signIn('user@test.com', 'password123');
        expect(response.error).toEqual(networkError);
        expect(response.user).toBeNull();
      });
    });
  });

  describe('AuthProvider', () => {
    it('should throw error when useAuth is used outside provider', () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
      
      consoleSpy.mockRestore();
    });

    it('should provide auth context to children', () => {
      const TestComponent = () => {
        const auth = useAuth();
        return <div data-testid="auth-context">{auth ? 'Context provided' : 'No context'}</div>;
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(getByTestId('auth-context')).toHaveTextContent('Context provided');
    });
  });
});