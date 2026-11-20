const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { loginRateLimiter } = require('../middleware/rateLimiter');
const auth = require('../controllers/authController');
const admin = require('../controllers/adminController');
const store = require('../controllers/storeController');
const owner = require('../controllers/ownerController');

const router = express.Router();

// ---- Public ----
router.post('/auth/signup', auth.signup);
router.post('/auth/login', loginRateLimiter, auth.login);

// ---- Any logged-in user ----
router.post('/auth/logout', authenticate, auth.logout);
router.get('/auth/me', authenticate, auth.me);
router.put('/auth/password', authenticate, auth.changePassword);

// ---- Admin only ----
router.get('/admin/stats', authenticate, authorize('admin'), admin.getStats);
router.get('/admin/users', authenticate, authorize('admin'), admin.listUsers);
router.post('/admin/users', authenticate, authorize('admin'), admin.createUser);
router.get('/admin/users/:id', authenticate, authorize('admin'), admin.getUser);
router.get('/admin/stores', authenticate, authorize('admin'), admin.listStores);
router.post('/admin/stores', authenticate, authorize('admin'), admin.createStore);
router.get('/admin/owners/available', authenticate, authorize('admin'), admin.listAvailableOwners);

// ---- Normal user only ----
router.get('/stores', authenticate, authorize('user'), store.listStores);
router.post('/stores/:storeId/rating', authenticate, authorize('user'), store.submitRating);
router.put('/stores/:storeId/rating', authenticate, authorize('user'), store.updateRating);
router.get('/ratings/me', authenticate, authorize('user'), store.myRatings);

// ---- Store owner only ----
router.get('/owner/dashboard', authenticate, authorize('owner'), owner.getDashboard);

module.exports = router;
