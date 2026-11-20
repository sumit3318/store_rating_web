import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HOME_BY_ROLE } from '../utils/roles';
import Loader from './Loader';

// Wraps a group of routes.
//  - not logged in            -> /login
//  - logged in, wrong role    -> that user's own dashboard
//  - no `roles` prop          -> any logged-in user may enter
// This only hides pages. The real protection is the role check in the backend.
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader text="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={HOME_BY_ROLE[user.role]} replace />;

  return <Outlet />;
}
