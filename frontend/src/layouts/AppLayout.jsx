import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ROLE_LABELS } from '../utils/roles';

// Links shown in the navbar for each role.
const NAV_LINKS = {
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/stores', label: 'Stores' },
    { to: '/admin/users/new', label: 'Add User' },
    { to: '/admin/stores/new', label: 'Add Store' },
  ],
  user: [
    { to: '/user/dashboard', label: 'Dashboard' },
    { to: '/user/stores', label: 'Stores' },
  ],
  owner: [{ to: '/owner/dashboard', label: 'Dashboard' }],
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    showToast('You have been logged out');
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <header className="navbar">
        <div className="navbar-inner">
          <span className="brand">Store Rating App</span>
          <nav className="nav-links">
            {NAV_LINKS[user.role].map((link) => (
              <NavLink key={link.to} to={link.to} end className={({ isActive }) => (isActive ? 'active' : '')}>
                {link.label}
              </NavLink>
            ))}
            <NavLink to="/change-password" className={({ isActive }) => (isActive ? 'active' : '')}>
              Change Password
            </NavLink>
          </nav>
          <div className="nav-user">
            <span className="nav-user-name" title={user.name}>
              {user.name} <span className="role-badge">{ROLE_LABELS[user.role]}</span>
            </span>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}
