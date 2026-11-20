import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { storeApi } from '../services/endpoints';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import StatCard from '../components/StatCard';
import StarRating from '../components/StarRating';
import SortableTh from '../components/SortableTh';
import useSort from '../hooks/useSort';

export default function UserDashboard() {
  const { user } = useAuth();
  const [ratings, setRatings] = useState(null);
  const [error, setError] = useState('');

  const { sort, toggleSort } = useSort('date', 'desc'); // newest first, like before

  // Sorting happens in the database; we re-fetch when the sorted column changes.
  useEffect(() => {
    let ignore = false;
    storeApi
      .myRatings(sort)
      .then((res) => { if (!ignore) { setRatings(res.ratings); setError(''); } })
      .catch((err) => { if (!ignore) setError(getErrorMessage(err)); });
    return () => { ignore = true; };
  }, [sort]);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!ratings) return <Loader />;

  const average = ratings.length
    ? (ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length).toFixed(1)
    : '-';

  return (
    <>
      <div className="page-header">
        <h1>Welcome, {user.name}</h1>
        <Link className="btn btn-primary" to="/user/stores">Browse &amp; rate stores</Link>
      </div>

      <div className="stat-grid">
        <StatCard label="Stores you rated" value={ratings.length} />
        <StatCard label="Your average rating" value={average} />
      </div>

      <div className="card">
        <h2>Your rating history</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <SortableTh label="Store" column="store_name" sort={sort} onSort={toggleSort} />
                <SortableTh label="Address" column="store_address" sort={sort} onSort={toggleSort} />
                <SortableTh label="Your rating" column="rating" sort={sort} onSort={toggleSort} />
                <SortableTh label="Last updated" column="date" sort={sort} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {ratings.length === 0 && (
                <tr><td colSpan="4" className="empty">You have not rated any store yet.</td></tr>
              )}
              {ratings.map((item) => (
                <tr key={item.id}>
                  <td>{item.store_name}</td>
                  <td>{item.store_address}</td>
                  <td><StarRating value={item.rating} size="sm" /></td>
                  <td>{new Date(item.updated_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
