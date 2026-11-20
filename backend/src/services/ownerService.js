const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const { buildOrderBy } = require('../utils/listQuery');

const RATER_SORT_COLUMNS = {
  name: 'u.name',
  email: 'u.email',
  rating: 'r.rating',
  date: 'r.updated_at',
};

// The store is found through the logged-in owner's id, so an owner can never
// ask for another store's data.
async function getDashboard(ownerId, { sortBy, order }) {
  const [stores] = await pool.query(
    `SELECT s.id, s.name, s.email, s.address,
            ROUND(AVG(r.rating), 1) AS average_rating, COUNT(r.id) AS rating_count
     FROM stores s LEFT JOIN ratings r ON r.store_id = s.id
     WHERE s.owner_id = ? GROUP BY s.id`,
    [ownerId]
  );
  if (stores.length === 0) {
    throw new AppError('No store is linked to your account yet. Please contact the administrator.', 404);
  }
  const store = stores[0];

  const orderBy = buildOrderBy(sortBy, order, RATER_SORT_COLUMNS, 'date');
  const [raters] = await pool.query(
    `SELECT r.id, u.name, u.email, r.rating, r.updated_at
     FROM ratings r JOIN users u ON u.id = r.user_id
     WHERE r.store_id = ? ${orderBy}`,
    [store.id]
  );

  return { store, raters };
}

module.exports = { getDashboard };
