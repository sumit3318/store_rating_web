const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const v = require('../utils/validators');
const { buildOrderBy, likePattern } = require('../utils/listQuery');

const STORE_SORT_COLUMNS = {
  id: 's.id',
  name: 's.name',
  address: 's.address',
  average_rating: 'average_rating',
  my_rating: 'my_rating',
};

// Store list for a normal user: overall rating + the user's own rating.
// "search" matches the store name OR address.
async function listStoresForUser(userId, { search, sortBy, order }) {
  const params = [userId];
  let where = '';
  if (search) {
    where = 'WHERE (s.name LIKE ? OR s.address LIKE ?)';
    params.push(likePattern(search), likePattern(search));
  }
  const orderBy = buildOrderBy(sortBy, order, STORE_SORT_COLUMNS, 'name');

  const [rows] = await pool.query(
    `SELECT s.id, s.name, s.address,
            ROUND(AVG(r.rating), 1) AS average_rating,
            COUNT(r.id) AS rating_count,
            (SELECT mr.rating FROM ratings mr WHERE mr.user_id = ? AND mr.store_id = s.id) AS my_rating
     FROM stores s LEFT JOIN ratings r ON r.store_id = s.id
     ${where} GROUP BY s.id ${orderBy}`,
    params
  );
  return rows;
}

async function assertStoreExists(storeId) {
  const [rows] = await pool.query('SELECT id FROM stores WHERE id = ?', [storeId]);
  if (rows.length === 0) throw new AppError('Store not found', 404);
}

function parseRating(value) {
  const rating = Number(value);
  v.throwIfInvalid({ rating: v.checkRating(rating) });
  return rating;
}

// Creates a rating. The UNIQUE(user_id, store_id) key blocks duplicates.
async function submitRating(userId, storeId, value) {
  const rating = parseRating(value);
  await assertStoreExists(storeId);

  try {
    await pool.query('INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)', [userId, storeId, rating]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError('You have already rated this store. Update your rating instead.', 409);
    }
    throw err;
  }
  return { storeId, rating };
}

// Updates the existing row, never inserts a second one.
async function updateRating(userId, storeId, value) {
  const rating = parseRating(value);
  await assertStoreExists(storeId);

  const [result] = await pool.query(
    'UPDATE ratings SET rating = ? WHERE user_id = ? AND store_id = ?',
    [rating, userId, storeId]
  );
  if (result.affectedRows === 0) {
    throw new AppError('You have not rated this store yet', 404);
  }
  return { storeId, rating };
}

// Columns the rating-history table may be sorted by (whitelist, see buildOrderBy).
const HISTORY_SORT_COLUMNS = {
  store_name: 's.name',
  store_address: 's.address',
  rating: 'r.rating',
  date: 'r.updated_at',
};

// Default order (no sortBy given): most recently changed first.
async function getRatingHistory(userId, { sortBy, order } = {}) {
  const orderBy = sortBy
    ? buildOrderBy(sortBy, order, HISTORY_SORT_COLUMNS, 'date')
    : 'ORDER BY r.updated_at DESC, r.id DESC';

  const [rows] = await pool.query(
    `SELECT r.id, r.rating, r.created_at, r.updated_at,
            s.id AS store_id, s.name AS store_name, s.address AS store_address
     FROM ratings r JOIN stores s ON s.id = r.store_id
     WHERE r.user_id = ? ${orderBy}`,
    [userId]
  );
  return rows;
}

module.exports = { listStoresForUser, submitRating, updateRating, getRatingHistory };
