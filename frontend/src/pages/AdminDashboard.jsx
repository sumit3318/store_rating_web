import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../services/endpoints';
import { getErrorMessage } from '../services/api';
import Loader from '../components/Loader';
import StatCard from '../components/StatCard';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.stats().then(setStats).catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!stats) return <Loader />;

  return (
    <>
      <h1>Admin Dashboard</h1>

      <div className="stat-grid">
        <StatCard label="Total Users" value={stats.totalUsers} />
        <StatCard label="Total Stores" value={stats.totalStores} />
        <StatCard label="Total Ratings" value={stats.totalRatings} />
      </div>

      <div className="card">
        <h2>Quick actions</h2>
        <div className="button-row">
          <Link className="btn btn-primary" to="/admin/users/new">Add User</Link>
          <Link className="btn btn-primary" to="/admin/stores/new">Add Store</Link>
          <Link className="btn btn-outline" to="/admin/users">View Users</Link>
          <Link className="btn btn-outline" to="/admin/stores">View Stores</Link>
        </div>
      </div>
    </>
  );
}
