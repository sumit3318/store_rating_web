import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { HOME_BY_ROLE } from './utils/roles';

import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import Loader from './components/Loader';
import AppLayout from './layouts/AppLayout';

import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminUserDetails from './pages/AdminUserDetails';
import AdminStores from './pages/AdminStores';
import AddUser from './pages/AddUser';
import AddStore from './pages/AddStore';
import UserDashboard from './pages/UserDashboard';
import StoreListing from './pages/StoreListing';
import OwnerDashboard from './pages/OwnerDashboard';
import ChangePassword from './pages/ChangePassword';
import NotFound from './pages/NotFound';

// "/" sends people to the right place.
function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  return <Navigate to={user ? HOME_BY_ROLE[user.role] : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>

      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/new" element={<AddUser />} />
          <Route path="/admin/users/:id" element={<AdminUserDetails />} />
          <Route path="/admin/stores" element={<AdminStores />} />
          <Route path="/admin/stores/new" element={<AddStore />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['user']} />}>
        <Route element={<AppLayout />}>
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/user/stores" element={<StoreListing />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['owner']} />}>
        <Route element={<AppLayout />}>
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
        </Route>
      </Route>

      {/* Any logged-in role */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/change-password" element={<ChangePassword />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
