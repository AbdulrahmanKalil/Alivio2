class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.errors = errors; // ← دي كانت ناقصة
    this.isOprational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
