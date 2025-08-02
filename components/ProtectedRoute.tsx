
import { ReactNode } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageLoader from './ui/PageLoader';
import { Role } from '../types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: Role[];
  fallback?: ReactNode;
}

const ProtectedRoute = ({ children, allowedRoles, fallback }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading, hasAnyRole } = useAuth();
  const location = ReactRouterDOM.useLocation();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <ReactRouterDOM.Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (!hasAnyRole(allowedRoles)) {
    // Show custom fallback if provided
    if (fallback) {
      return <>{fallback}</>;
    }

    // Default behavior: redirect to appropriate dashboard
    const defaultRoute = getDashboardRoute(user?.role);
    return <ReactRouterDOM.Navigate to={defaultRoute} replace />;
  }

  return <>{children}</>;
};

// Helper function to get the appropriate dashboard route based on user role
const getDashboardRoute = (role?: Role): string => {
  switch (role) {
    case Role.Patient:
      return '/portal/dashboard';
    case Role.EducadorFisico:
      return '/partner/dashboard';
    case Role.Therapist:
    case Role.Admin:
    default:
      return '/dashboard';
  }
};

export default ProtectedRoute;
