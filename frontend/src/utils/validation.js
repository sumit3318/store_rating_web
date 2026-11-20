// Same rules as the backend (backend/src/utils/validators.js).
// Each function returns an error message, or '' when the value is valid.

// Same rules as the backend. Standard email format: no leading/trailing/double dots in the local part,
// valid domain labels, and a letters-only top-level domain of 2+ letters.
const EMAIL_REGEX =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+(?:[A-Za-z]{2,}|xn--[A-Za-z0-9-]{2,})$/;
const MAX_EMAIL_LOCAL_PART = 64;

export function validateName(name) {
  const length = name.trim().length;
  if (length < 20) return 'Name must be at least 20 characters';
  if (length > 60) return 'Name must be at most 60 characters';
  return '';
}

export function validateAddress(address) {
  if (!address.trim()) return 'Address is required';
  if (address.trim().length > 400) return 'Address must be at most 400 characters';
  return '';
}

export function validateEmail(email) {
  if (!email.trim()) return 'Email is required';
  if (!EMAIL_REGEX.test(email.trim()) || email.trim().split('@')[0].length > MAX_EMAIL_LOCAL_PART) {
    return 'Enter a valid email address';
  }
  return '';
}

export function validatePassword(password) {
  if (!password) return 'Password is required';
  if (password.length < 8 || password.length > 16) return 'Password must be 8 to 16 characters';
  if (!/\p{Lu}/u.test(password)) return 'Password must include at least one uppercase letter';
  if (!/[^\p{L}\p{N}\s]/u.test(password)) return 'Password must include at least one special character';
  return '';
}

export function validateStoreName(name) {
  if (!name.trim()) return 'Store name is required';
  if (name.trim().length > 100) return 'Store name must be at most 100 characters';
  return '';
}

// Takes { field: message } and keeps only the fields that have an error.
export function onlyErrors(checks) {
  return Object.fromEntries(Object.entries(checks).filter(([, message]) => message));
}
