const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const AppError = require('../utils/AppError');
const v = require('../utils/validators');

// Used when the email does not exist, so "unknown email" costs the same time as "wrong password".
// Without this, an attacker could tell which emails are registered by measuring response time.
// Cost 10 matches the cost used for real password hashes.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing-only', 10);

const emailTakenError = () =>
  new AppError('This email is already registered', 409, { email: 'This email is already registered' });

function createToken(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, address: user.address, role: user.role };
}

// Shared by signup (always role 'user') and the admin "add user" feature.
async function createUser({ name, email, password, address, role }) {
  v.throwIfInvalid({
    name: v.checkName(name),
    email: v.checkEmail(email),
    address: v.checkAddress(address),
    password: v.checkPassword(password),
    role: v.checkRole(role),
  });

  const cleanEmail = email.trim().toLowerCase();
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
  if (existing.length > 0) throw emailTakenError();

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, address, role) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), cleanEmail, passwordHash, address.trim(), role]
    );
    return { id: result.insertId, name: name.trim(), email: cleanEmail, address: address.trim(), role };
  } catch (err) {
    // Two requests with the same email at the same moment: the UNIQUE key rejects the second one.
    if (err.code === 'ER_DUP_ENTRY') throw emailTakenError();
    throw err;
  }
}

async function signup({ name, email, password, address }) {
  // Role is forced to 'user' here, so nobody can sign up as admin or owner.
  const user = await createUser({ name, email, password, address, role: 'user' });
  return { token: createToken(user), user: publicUser(user) };
}

async function login({ email, password }) {
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  const user = rows[0];
  // Always run one bcrypt comparison (against a dummy hash if the user does not exist) and
  // give the same message, so neither the text nor the timing reveals whether the email exists.
  const passwordMatches = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !passwordMatches) {
    throw new AppError('Invalid email or password', 401);
  }

  return { token: createToken(user), user: publicUser(user) };
}

async function changePassword(userId, { currentPassword, newPassword }) {
  if (typeof currentPassword !== 'string' || !currentPassword) {
    throw new AppError('Validation failed', 400, { currentPassword: 'Current password is required' });
  }
  v.throwIfInvalid({ newPassword: v.checkPassword(newPassword) });

  const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
  const matches = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!matches) {
    throw new AppError('Validation failed', 400, { currentPassword: 'Current password is incorrect' });
  }
  if (currentPassword === newPassword) {
    throw new AppError('Validation failed', 400, { newPassword: 'New password must be different from the current one' });
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
}

module.exports = { signup, login, changePassword, createUser, publicUser };
