const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const ratingService = require('../services/ratingService');

function parseStoreId(req) {
  const id = Number(req.params.storeId);
  if (!Number.isInteger(id) || id < 1) throw new AppError('Invalid store id', 400);
  return id;
}

exports.listStores = asyncHandler(async (req, res) => {
  res.json({ stores: await ratingService.listStoresForUser(req.user.id, req.query) });
});

exports.submitRating = asyncHandler(async (req, res) => {
  const result = await ratingService.submitRating(req.user.id, parseStoreId(req), req.body.rating);
  res.status(201).json({ message: 'Rating submitted', ...result });
});

exports.updateRating = asyncHandler(async (req, res) => {
  const result = await ratingService.updateRating(req.user.id, parseStoreId(req), req.body.rating);
  res.json({ message: 'Rating updated', ...result });
});

exports.myRatings = asyncHandler(async (req, res) => {
  res.json({ ratings: await ratingService.getRatingHistory(req.user.id, req.query) });
});
