const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./middlewares/errorMiddleware");

const userRouter = require("./routes/userRoutes");
const doctorRouter = require("./routes/doctorRoutes");
const patientRouter = require("./routes/patientRoutes");

const appointmentRouter = require("./routes/appointmentRoutes");

const app = express();

// 1) MIDDLEWARES
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  message: "Too many requests from this IP, please try again in an hour!",
});
// Apply the rate limiting middleware to all requests.
app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "100kb" }));

app.use((req, res, next) => {
  // eslint-disable-next-line no-console
  console.log("Hello From Middleware");
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 2) ROUTES
app.use("/api/v1/doctors", doctorRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/patients", patientRouter);
app.use("/api/v1/appointments", appointmentRouter);

// 3) ERROR HANDLING
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
