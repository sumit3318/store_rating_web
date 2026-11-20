import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HOME_BY_ROLE } from '../utils/roles';
import Loader from './Loader';

// Login and signup pages: a logged-in user is sent to their dashboard instead.
export default function PublicOnlyRoute() {
  const { user, loading } = useAuth();

  if (loading) return <Loader text="Checking your session..." />;
  if (user) return <Navigate to={HOME_BY_ROLE[user.role]} replace />;

  return <Outlet />;
}
