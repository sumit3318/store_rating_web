import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../services/endpoints';
import { getErrorMessage } from '../services/api';
import useDebounce from '../hooks/useDebounce';
import useSort from '../hooks/useSort';
import Loader from '../components/Loader';
import SortableTh from '../components/SortableTh';
import { ROLE_LABELS } from '../utils/roles';

export default function AdminUsers() {
  const [filters, setFilters] = useState({ name: '', email: '', address: '', role: '' });
  const debouncedFilters = useDebounce(filters);
  const { sort, toggleSort } = useSort('name');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering and sorting happen in the database; we just re-fetch when they change.
  useEffect(() => {
    let ignore = false; // drops the answer of an outdated request
    setLoading(true);
    adminApi
      .listUsers({ ...debouncedFilters, ...sort })
      .then((res) => { if (!ignore) { setUsers(res.users); setError(''); } })
      .catch((err) => { if (!ignore) setError(getErrorMessage(err)); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [debouncedFilters, sort]);

  function handleFilterChange(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <div className="page-header">
        <h1>Users</h1>
        <Link className="btn btn-primary" to="/admin/users/new">+ Add User</Link>
      </div>

      <div className="card filter-bar">
        <input name="name" placeholder="Filter by name" value={filters.name} onChange={handleFilterChange} />
        <input name="email" placeholder="Filter by email" value={filters.email} onChange={handleFilterChange} />
        <input name="address" placeholder="Filter by address" value={filters.address} onChange={handleFilterChange} />
        <select name="role" value={filters.role} onChange={handleFilterChange}>
          <option value="">All roles</option>
          <option value="admin">{ROLE_LABELS.admin}</option>
          <option value="user">{ROLE_LABELS.user}</option>
          <option value="owner">{ROLE_LABELS.owner}</option>
        </select>
        {hasFilters && (
          <button className="btn btn-outline btn-sm" onClick={() => setFilters({ name: '', email: '', address: '', role: '' })}>
            Clear
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {loading ? (
          <Loader />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <SortableTh label="Name" column="name" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Email" column="email" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Address" column="address" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Role" column="role" sort={sort} onSort={toggleSort} />
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr><td colSpan="5" className="empty">No users match your filters.</td></tr>
                )}
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.address}</td>
                    <td><span className={`role-badge role-${user.role}`}>{ROLE_LABELS[user.role]}</span></td>
                    <td><Link to={`/admin/users/${user.id}`}>View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && <p className="muted table-count">{users.length} user(s)</p>}
      </div>
    </>
  );
}
