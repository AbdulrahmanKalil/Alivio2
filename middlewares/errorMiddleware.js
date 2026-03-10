const AppError = require("../utils/appError");

// ───────────── MongoDB Errors ─────────────
const handleCastErrorDB = (err) => {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = Object.values(err.keyValue)[0];
  return new AppError(
    `Duplicate value: "${value}". Please use another value.`,
    409,
  );
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  return new AppError(`Invalid input data. ${errors.join(". ")}`, 400);
};

// ───────────── JWT Errors ─────────────
const handleJWTError = () =>
  new AppError("Invalid token. Please log in again.", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired. Please log in again.", 401);

// ───────────── JSON Syntax Error ─────────────
const handleSyntaxError = () =>
  new AppError("Invalid JSON in request body.", 400);

// ───────────── Development Response ─────────────
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    errors: err.errors || null,
    stack: err.stack,
  });
};

// ───────────── Production Response ─────────────
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      errors: err.errors || null,
    });
  }

  console.error("UNHANDLED ERROR 💥", err);

  res.status(500).json({
    status: "error",
    message: "Something went very wrong!",
  });
};

// ───────────── Main Middleware ─────────────
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else {
    // Preserve important properties
    let error = {
      ...err,
      name: err.name,
      message: err.message,
      stack: err.stack,
    };

    if (error instanceof SyntaxError && error.status === 400)
      error = handleSyntaxError();

    if (error.name === "CastError") error = handleCastErrorDB(error);

    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);

    if (error.name === "JsonWebTokenError") error = handleJWTError();

    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
