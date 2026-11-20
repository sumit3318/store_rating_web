const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Checks the JWT, then loads the user from the database.
// The role always comes from the database, never from the frontend.
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Authentication required', 401);
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError('Invalid or expired token', 401);
  }

  const [rows] = await pool.query(
    'SELECT id, name, email, address, role FROM users WHERE id = ?',
    [payload.id]
  );
  if (rows.length === 0) {
    throw new AppError('User no longer exists', 401);
  }

  req.user = rows[0];
  next();
});

// Usage: authorize('admin') or authorize('admin', 'owner')
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to do this', 403));
  }
  next();
};

module.exports = { authenticate, authorize };
