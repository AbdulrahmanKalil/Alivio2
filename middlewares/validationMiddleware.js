const AppError = require("../utils/appError");

const validationMiddleware = (schema) => {
  return (req, res, next) => {
    const errors = [];
    const sanitized = {};
    const parts = ["body", "params", "query"];
    for (const part of parts) {
      if (!schema[part]) continue;
      const { error, value } = schema[part].validate(req[part], {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        error.details.forEach((detail) => {
          errors.push({
            location: part,
            field: detail.path.join("."),
            message: detail.message.replace(/"/g, ""),
          });
        });
      } else {
        sanitized[part] = value;
      }
    }
    if (errors.length > 0) {
      const formattedErrors = errors.reduce((acc, err) => {
        const key = `${err.location}.${err.field}`;
        acc[key] = err.message;
        return acc;
      }, {});
      return next(new AppError("Validation error", 400, formattedErrors));
    }
    Object.assign(req, sanitized);
    next();
  };
};

module.exports = validationMiddleware;
