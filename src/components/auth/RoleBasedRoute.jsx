import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/contexts/AuthContext';

export default function RoleBasedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show a spinner while authentication state is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no user is logged in, send them to the login page
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRoles = user.roles || [];

  // Strict mode: drivers and monitors that are not also admins or dispatchers
  const isDriverStrict = userRoles.includes('driver') && !userRoles.includes('admin') && !userRoles.includes('dispatcher');
  // Monitor should always be in strict mode regardless of other roles
  const isMonitorStrict = userRoles.includes('monitor');

  // Drivers may only visit the Driver Dashboard and Help pages
  if (isDriverStrict) {
    const allowedPaths = ['/DriverDashboard', '/Help'];
    const isAllowed = allowedPaths.some(p => location.pathname.toLowerCase().startsWith(p.toLowerCase()));
    if (!isAllowed) {
      console.log('⛔ Strict Driver restriction – redirecting to DriverDashboard');
      return <Navigate to="/DriverDashboard" replace />;
    }
  }

  // Monitors may only visit the TV Monitor page
  if (isMonitorStrict) {
    const allowedPaths = ['/TVMonitor'];
    const isAllowed = allowedPaths.some(p => location.pathname.toLowerCase().startsWith(p.toLowerCase()));
    if (!isAllowed) {
      console.log('⛔ Strict Monitor restriction – redirecting to TVMonitor');
      return <Navigate to="/TVMonitor" replace />;
    }
  }

  // General role guard for routes that specify allowedRoles
  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = allowedRoles.some(r => userRoles.includes(r));
    if (!hasPermission) {
      console.log(`⛔ Access denied – user roles [${userRoles}] do not include any of [${allowedRoles}]`);
      // Fallback redirects based on most specific role
      if (userRoles.includes('driver')) return <Navigate to="/DriverDashboard" replace />;
      if (userRoles.includes('monitor')) return <Navigate to="/TVMonitor" replace />;
      return <Navigate to="/Dashboard" replace />;
    }
  }

  // All checks passed – render the protected component tree
  return <>{children}</>;
}
