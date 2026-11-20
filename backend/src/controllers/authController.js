const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

exports.signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body);
  res.status(201).json(result);
});

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

// JWTs are stateless, so the server has nothing to destroy.
// The frontend deletes the token; this endpoint exists so logout is an explicit API call.
exports.logout = (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

exports.me = (req, res) => {
  res.json({ user: req.user });
};

exports.changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  res.json({ message: 'Password updated successfully' });
});
