const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const AppError = require('../utils/AppError');

const WINDOW_MINUTES = 15;
const MAX_FAILED_ATTEMPTS = 10;

// Allows 10 FAILED logins per 15 minutes for each (IP address + email) pair.
// Successful logins are not counted, so normal users are never locked out by using the app.
// Once the limit is hit, the next login attempt gets HTTP 429 until the window passes.
const loginRateLimiter = rateLimit({
  windowMs: WINDOW_MINUTES * 60 * 1000,
  limit: MAX_FAILED_ATTEMPTS,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7', // adds RateLimit and Retry-After headers
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 100) : '';
    return `${ipKeyGenerator(req.ip)}|${email}`;
  },
  handler: (req, res, next) =>
    next(new AppError(`Too many failed login attempts. Please try again in ${WINDOW_MINUTES} minutes.`, 429)),
});

module.exports = { loginRateLimiter };
