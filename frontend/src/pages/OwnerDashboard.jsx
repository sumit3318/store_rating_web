import { useEffect, useState } from 'react';
import { ownerApi } from '../services/endpoints';
import { getErrorMessage } from '../services/api';
import useSort from '../hooks/useSort';
import Loader from '../components/Loader';
import SortableTh from '../components/SortableTh';
import StatCard from '../components/StatCard';
import StarRating from '../components/StarRating';
import AverageRating from '../components/AverageRating';

export default function OwnerDashboard() {
  const { sort, toggleSort } = useSort('date', 'desc');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    ownerApi
      .dashboard(sort)
      .then((res) => { if (!ignore) { setData(res); setError(''); } })
      .catch((err) => { if (!ignore) setError(getErrorMessage(err)); });
    return () => { ignore = true; };
  }, [sort]);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return <Loader />;

  const { store, raters } = data;

  return (
    <>
      <h1>{store.name}</h1>
      <p className="muted">{store.address}</p>

      <div className="stat-grid">
        <StatCard label="Average rating" value={store.average_rating === null ? '-' : Number(store.average_rating).toFixed(1)}>
          {store.average_rating !== null && <AverageRating average={store.average_rating} />}
        </StatCard>
        <StatCard label="Total ratings" value={store.rating_count} />
      </div>

      <div className="card">
        <h2>Users who rated your store</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <SortableTh label="Name" column="name" sort={sort} onSort={toggleSort} />
                <SortableTh label="Email" column="email" sort={sort} onSort={toggleSort} />
                <SortableTh label="Rating" column="rating" sort={sort} onSort={toggleSort} />
                <SortableTh label="Date" column="date" sort={sort} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {raters.length === 0 && (
                <tr><td colSpan="4" className="empty">No one has rated your store yet.</td></tr>
              )}
              {raters.map((rater) => (
                <tr key={rater.id}>
                  <td>{rater.name}</td>
                  <td>{rater.email}</td>
                  <td><StarRating value={rater.rating} size="sm" /></td>
                  <td>{new Date(rater.updated_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
