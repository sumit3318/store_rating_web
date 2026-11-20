const AppError = require('../utils/AppError');

function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

// Express recognises this as an error handler because it has 4 arguments.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }

  if (err instanceof AppError) {
    const body = { message: err.message };
    if (err.errors) body.errors = err.errors;
    return res.status(err.statusCode).json(body);
  }

  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
}

module.exports = { notFound, errorHandler };
