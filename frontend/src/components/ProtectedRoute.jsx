import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import t from '../theme';

export default function ProtectedRoute({ role: requiredRole, children }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className={`h-8 w-8 animate-spin rounded-full border-4 ${t.spinner} border-t-transparent`} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/login" replace />;
  return children;
}
