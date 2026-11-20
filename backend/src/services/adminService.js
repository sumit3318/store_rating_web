const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const v = require('../utils/validators');
const { buildOrderBy, likePattern } = require('../utils/listQuery');

const USER_SORT_COLUMNS = {
  id: 'u.id',
  name: 'u.name',
  email: 'u.email',
  address: 'u.address',
  // ENUM columns sort by their definition order; CAST makes it sort alphabetically.
  role: 'CAST(u.role AS CHAR)',
};

const STORE_SORT_COLUMNS = {
  id: 's.id',
  name: 's.name',
  email: 's.email',
  address: 's.address',
  average_rating: 'average_rating',
};

// 409 Conflict = the data is valid, but it clashes with something that already exists.
const storeEmailTakenError = () =>
  new AppError('A store with this email already exists', 409, { email: 'A store with this email already exists' });
const ownerHasStoreError = () =>
  new AppError('This owner already has a store', 409, { ownerId: 'This owner already has a store' });

async function getStats() {
  const [[users]] = await pool.query('SELECT COUNT(*) AS total FROM users');
  const [[stores]] = await pool.query('SELECT COUNT(*) AS total FROM stores');
  const [[ratings]] = await pool.query('SELECT COUNT(*) AS total FROM ratings');
  return { totalUsers: users.total, totalStores: stores.total, totalRatings: ratings.total };
}

// Filters: name, email, address, role (each is a "contains" match, role is exact).
async function listUsers({ name, email, address, role, sortBy, order }) {
  const conditions = [];
  const params = [];

  if (name) { conditions.push('u.name LIKE ?'); params.push(likePattern(name)); }
  if (email) { conditions.push('u.email LIKE ?'); params.push(likePattern(email)); }
  if (address) { conditions.push('u.address LIKE ?'); params.push(likePattern(address)); }
  if (role) {
    if (v.checkRole(role)) throw new AppError('Invalid role filter', 400);
    conditions.push('u.role = ?');
    params.push(role);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderBy = buildOrderBy(sortBy, order, USER_SORT_COLUMNS, 'name');

  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.address, u.role
     FROM users u ${where} ${orderBy}`,
    params
  );
  return rows;
}

async function getUserDetails(userId) {
  const [rows] = await pool.query(
    'SELECT id, name, email, address, role, created_at FROM users WHERE id = ?',
    [userId]
  );
  if (rows.length === 0) throw new AppError('User not found', 404);
  const user = rows[0];

  // For store owners, also show their store and its average rating.
  if (user.role === 'owner') {
    const [stores] = await pool.query(
      `SELECT s.id, s.name, ROUND(AVG(r.rating), 1) AS average_rating, COUNT(r.id) AS rating_count
       FROM stores s LEFT JOIN ratings r ON r.store_id = s.id
       WHERE s.owner_id = ? GROUP BY s.id`,
      [userId]
    );
    user.store = stores[0] || null;
  }
  return user;
}

async function listStores({ name, email, address, sortBy, order }) {
  const conditions = [];
  const params = [];

  if (name) { conditions.push('s.name LIKE ?'); params.push(likePattern(name)); }
  if (email) { conditions.push('s.email LIKE ?'); params.push(likePattern(email)); }
  if (address) { conditions.push('s.address LIKE ?'); params.push(likePattern(address)); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderBy = buildOrderBy(sortBy, order, STORE_SORT_COLUMNS, 'name');

  const [rows] = await pool.query(
    `SELECT s.id, s.name, s.email, s.address,
            ROUND(AVG(r.rating), 1) AS average_rating, COUNT(r.id) AS rating_count
     FROM stores s LEFT JOIN ratings r ON r.store_id = s.id
     ${where} GROUP BY s.id ${orderBy}`,
    params
  );
  return rows;
}

async function createStore({ name, email, address, ownerId }) {
  const nameError = typeof name !== 'string' || name.trim().length === 0
    ? 'Store name is required'
    : name.trim().length > 100 ? 'Store name must be at most 100 characters' : null;

  v.throwIfInvalid({
    name: nameError,
    email: v.checkEmail(email),
    address: v.checkAddress(address),
  });

  const [emailTaken] = await pool.query('SELECT id FROM stores WHERE email = ?', [email.trim().toLowerCase()]);
  if (emailTaken.length > 0) throw storeEmailTakenError();

  let owner = null;
  if (ownerId) {
    const [owners] = await pool.query('SELECT id, role FROM users WHERE id = ?', [ownerId]);
    if (owners.length === 0 || owners[0].role !== 'owner') {
      throw new AppError('Validation failed', 400, { ownerId: 'Selected user is not a store owner' });
    }
    const [taken] = await pool.query('SELECT id FROM stores WHERE owner_id = ?', [ownerId]);
    if (taken.length > 0) throw ownerHasStoreError();
    owner = ownerId;
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), address.trim(), owner]
    );
    return { id: result.insertId, name: name.trim(), email: email.trim().toLowerCase(), address: address.trim(), owner_id: owner };
  } catch (err) {
    // Same-moment duplicates are caught by the UNIQUE keys; tell the admin which one was hit.
    if (err.code === 'ER_DUP_ENTRY') {
      throw String(err.message).includes('uq_stores_owner') ? ownerHasStoreError() : storeEmailTakenError();
    }
    throw err;
  }
}

// Owners who do not have a store yet (used by the "Add Store" dropdown).
async function listAvailableOwners() {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email FROM users u
     LEFT JOIN stores s ON s.owner_id = u.id
     WHERE u.role = 'owner' AND s.id IS NULL ORDER BY u.name`
  );
  return rows;
}

module.exports = { getStats, listUsers, getUserDetails, listStores, createStore, listAvailableOwners };
