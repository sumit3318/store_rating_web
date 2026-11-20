import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '../services/endpoints';
import { getErrorMessage } from '../services/api';
import Loader from '../components/Loader';
import AverageRating from '../components/AverageRating';
import { ROLE_LABELS } from '../utils/roles';

export default function AdminUserDetails() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setUser(null);
    adminApi.getUser(id).then((res) => setUser(res.user)).catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  return (
    <>
      <p><Link to="/admin/users">← Back to users</Link></p>
      {error && <div className="alert alert-error">{error}</div>}
      {!user && !error && <Loader />}

      {user && (
        <div className="card">
          <h1>User Details</h1>
          <dl className="details-list">
            <dt>Name</dt><dd>{user.name}</dd>
            <dt>Email</dt><dd>{user.email}</dd>
            <dt>Address</dt><dd>{user.address}</dd>
            <dt>Role</dt><dd><span className={`role-badge role-${user.role}`}>{ROLE_LABELS[user.role]}</span></dd>
            <dt>Joined</dt><dd>{new Date(user.created_at).toLocaleDateString()}</dd>

            {/* Only store owners have a store and a rating to show */}
            {user.role === 'owner' && (
              <>
                <dt>Store</dt>
                <dd>{user.store ? user.store.name : <span className="muted">No store assigned yet</span>}</dd>
                {user.store && (
                  <>
                    <dt>Store rating</dt>
                    <dd><AverageRating average={user.store.average_rating} count={user.store.rating_count} /></dd>
                  </>
                )}
              </>
            )}
          </dl>
        </div>
      )}
    </>
  );
}
