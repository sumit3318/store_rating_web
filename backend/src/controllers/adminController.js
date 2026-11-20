const asyncHandler = require('../utils/asyncHandler');
const adminService = require('../services/adminService');
const authService = require('../services/authService');
const AppError = require('../utils/AppError');

exports.getStats = asyncHandler(async (req, res) => {
  res.json(await adminService.getStats());
});

exports.listUsers = asyncHandler(async (req, res) => {
  res.json({ users: await adminService.listUsers(req.query) });
});

exports.getUser = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) throw new AppError('Invalid user id', 400);
  res.json({ user: await adminService.getUserDetails(id) });
});

exports.createUser = asyncHandler(async (req, res) => {
  const user = await authService.createUser(req.body);
  res.status(201).json({ user });
});

exports.listStores = asyncHandler(async (req, res) => {
  res.json({ stores: await adminService.listStores(req.query) });
});

exports.createStore = asyncHandler(async (req, res) => {
  const { name, email, address, ownerId } = req.body;
  const store = await adminService.createStore({ name, email, address, ownerId: ownerId ? Number(ownerId) : null });
  res.status(201).json({ store });
});

exports.listAvailableOwners = asyncHandler(async (req, res) => {
  res.json({ owners: await adminService.listAvailableOwners() });
});
