import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Define roles to match your Django TextChoices
const ROLES = {
  ADMIN: "ADMIN",
  FARMER: "FARMER",
};

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is required, check if user has it
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect based on user's actual role
    if (user?.role === ROLES.ADMIN) {
      return <Navigate to="/admin" replace />;
    } else if (user?.role === ROLES.FARMER) {
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
