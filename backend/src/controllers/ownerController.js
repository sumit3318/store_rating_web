const asyncHandler = require('../utils/asyncHandler');
const ownerService = require('../services/ownerService');

exports.getDashboard = asyncHandler(async (req, res) => {
  res.json(await ownerService.getDashboard(req.user.id, req.query));
});
