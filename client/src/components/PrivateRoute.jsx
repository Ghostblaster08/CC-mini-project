import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  console.log('🔐 PrivateRoute check:', { user, loading, roles });

  if (loading) {
    console.log('⏳ PrivateRoute: Still loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user) {
    console.log('❌ PrivateRoute: No user, redirecting to login');
    return <Navigate to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    console.log('❌ PrivateRoute: User role not authorized', user.role, 'Required:', roles);
    return <Navigate to="/unauthorized" />;
  }

  console.log('✅ PrivateRoute: Access granted');
  return children;
};

export default PrivateRoute;
