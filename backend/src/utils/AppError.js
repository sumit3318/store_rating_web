// Error with an HTTP status code. Services throw it, the error middleware turns it into a response.
class AppError extends Error {
  constructor(message, statusCode = 400, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors; // optional { field: message } object for form validation
  }
}

module.exports = AppError;
