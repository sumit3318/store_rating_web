import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../services/endpoints';
import { getErrorMessage } from '../services/api';
import useDebounce from '../hooks/useDebounce';
import useSort from '../hooks/useSort';
import Loader from '../components/Loader';
import SortableTh from '../components/SortableTh';
import AverageRating from '../components/AverageRating';

export default function AdminStores() {
  const [filters, setFilters] = useState({ name: '', email: '', address: '' });
  const debouncedFilters = useDebounce(filters);
  const { sort, toggleSort } = useSort('name');

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    adminApi
      .listStores({ ...debouncedFilters, ...sort })
      .then((res) => { if (!ignore) { setStores(res.stores); setError(''); } })
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
        <h1>Stores</h1>
        <Link className="btn btn-primary" to="/admin/stores/new">+ Add Store</Link>
      </div>

      <div className="card filter-bar">
        <input name="name" placeholder="Filter by name" value={filters.name} onChange={handleFilterChange} />
        <input name="email" placeholder="Filter by email" value={filters.email} onChange={handleFilterChange} />
        <input name="address" placeholder="Filter by address" value={filters.address} onChange={handleFilterChange} />
        {hasFilters && (
          <button className="btn btn-outline btn-sm" onClick={() => setFilters({ name: '', email: '', address: '' })}>
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
                  <SortableTh label="Average Rating" column="average_rating" sort={sort} onSort={toggleSort} />
                </tr>
              </thead>
              <tbody>
                {stores.length === 0 && (
                  <tr><td colSpan="4" className="empty">No stores match your filters.</td></tr>
                )}
                {stores.map((store) => (
                  <tr key={store.id}>
                    <td>{store.name}</td>
                    <td>{store.email}</td>
                    <td>{store.address}</td>
                    <td><AverageRating average={store.average_rating} count={store.rating_count} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && <p className="muted table-count">{stores.length} store(s)</p>}
      </div>
    </>
  );
}
