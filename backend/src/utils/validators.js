const AppError = require('./AppError');

// Standard email format: letters/digits/allowed symbols in the local part (no leading, trailing or double dots),
// a domain made of labels without leading/trailing hyphens, and a letters-only top-level domain of 2+ letters.
const EMAIL_REGEX =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+(?:[A-Za-z]{2,}|xn--[A-Za-z0-9-]{2,})$/;
const MAX_EMAIL_LOCAL_PART = 64;
const UPPERCASE_REGEX = /\p{Lu}/u; // any uppercase letter
const SPECIAL_CHAR_REGEX = /[^\p{L}\p{N}\s]/u; // not a letter, not a digit, not a space (so "é" is NOT special, "!" and "€" are)

// Each validator returns an error message, or null when the value is fine.
function checkName(name) {
  if (typeof name !== 'string') return 'Name is required';
  const length = name.trim().length;
  if (length < 20) return 'Name must be at least 20 characters';
  if (length > 60) return 'Name must be at most 60 characters';
  return null;
}

function checkAddress(address) {
  if (typeof address !== 'string' || address.trim().length === 0) return 'Address is required';
  if (address.trim().length > 400) return 'Address must be at most 400 characters';
  return null;
}

function checkEmail(email) {
  if (typeof email !== 'string' || email.trim().length === 0) return 'Email is required';
  if (email.length > 100) return 'Email must be at most 100 characters';
  const cleanEmail = email.trim();
  if (!EMAIL_REGEX.test(cleanEmail) || cleanEmail.split('@')[0].length > MAX_EMAIL_LOCAL_PART) {
    return 'Enter a valid email address';
  }
  return null;
}

function checkPassword(password) {
  if (typeof password !== 'string' || password.length === 0) return 'Password is required';
  if (password.length < 8 || password.length > 16) return 'Password must be 8 to 16 characters';
  if (!UPPERCASE_REGEX.test(password)) return 'Password must include at least one uppercase letter';
  if (!SPECIAL_CHAR_REGEX.test(password)) return 'Password must include at least one special character';
  return null;
}

function checkRating(rating) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return 'Rating must be a whole number from 1 to 5';
  return null;
}

function checkRole(role) {
  if (!['admin', 'user', 'owner'].includes(role)) return 'Role must be admin, user or owner';
  return null;
}

// Runs a { field: errorMessage } map and throws one 400 error if anything failed.
function throwIfInvalid(checks) {
  const errors = {};
  for (const [field, message] of Object.entries(checks)) {
    if (message) errors[field] = message;
  }
  if (Object.keys(errors).length > 0) {
    throw new AppError('Validation failed', 400, errors);
  }
}

module.exports = {
  checkName,
  checkAddress,
  checkEmail,
  checkPassword,
  checkRating,
  checkRole,
  throwIfInvalid,
};
