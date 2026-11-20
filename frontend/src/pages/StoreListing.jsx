import { useEffect, useState } from 'react';
import { storeApi } from '../services/endpoints';
import { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import useDebounce from '../hooks/useDebounce';
import useSort from '../hooks/useSort';
import Loader from '../components/Loader';
import SortableTh from '../components/SortableTh';
import AverageRating from '../components/AverageRating';
import StarRating from '../components/StarRating';

// One table row. It remembers the star the user picked until they press the button.
function StoreRow({ store, onSaved }) {
  const { showToast } = useToast();
  const [selected, setSelected] = useState(store.my_rating || 0);
  const [saving, setSaving] = useState(false);

  // Reset the picked stars whenever fresh data arrives from the server.
  useEffect(() => setSelected(store.my_rating || 0), [store.my_rating]);

  const alreadyRated = store.my_rating !== null;
  const unchanged = selected === (store.my_rating || 0);

  async function saveRating() {
    setSaving(true);
    try {
      // First rating = POST (creates the row). Later changes = PUT (updates the same row).
      if (alreadyRated) await storeApi.updateRating(store.id, selected);
      else await storeApi.submitRating(store.id, selected);
      showToast(alreadyRated ? 'Rating updated' : 'Rating submitted');
      onSaved();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr>
      <td>{store.name}</td>
      <td>{store.address}</td>
      <td><AverageRating average={store.average_rating} count={store.rating_count} /></td>
      <td>{alreadyRated ? <strong>{store.my_rating} / 5</strong> : <span className="muted">Not rated</span>}</td>
      <td>
        <div className="rate-cell">
          <StarRating value={selected} onChange={setSelected} />
          <button className="btn btn-primary btn-sm" disabled={saving || selected === 0 || unchanged} onClick={saveRating}>
            {saving ? 'Saving...' : alreadyRated ? 'Update' : 'Submit'}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function StoreListing() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const { sort, toggleSort } = useSort('name');

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0); // bump to refetch after a rating is saved

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    storeApi
      .list({ search: debouncedSearch, ...sort })
      .then((res) => { if (!ignore) { setStores(res.stores); setError(''); } })
      .catch((err) => { if (!ignore) setError(getErrorMessage(err)); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [debouncedSearch, sort, reloadKey]);

  return (
    <>
      <h1>Stores</h1>

      <div className="card filter-bar">
        <input
          className="search-input"
          placeholder="Search by store name or address"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {search && <button className="btn btn-outline btn-sm" onClick={() => setSearch('')}>Clear</button>}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {loading && stores.length === 0 ? (
          <Loader />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <SortableTh label="Store Name" column="name" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Address" column="address" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Overall Rating" column="average_rating" sort={sort} onSort={toggleSort} />
                  <SortableTh label="Your Rating" column="my_rating" sort={sort} onSort={toggleSort} />
                  <th>Rate this store</th>
                </tr>
              </thead>
              <tbody>
                {stores.length === 0 && (
                  <tr><td colSpan="5" className="empty">No stores found.</td></tr>
                )}
                {stores.map((store) => (
                  <StoreRow key={store.id} store={store} onSaved={() => setReloadKey((key) => key + 1)} />
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
