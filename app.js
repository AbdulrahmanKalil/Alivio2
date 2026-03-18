const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./middlewares/errorMiddleware");

const userRouter = require("./routes/userRoutes");
const doctorRouter = require("./routes/doctorRoutes");
const patientRouter = require("./routes/patientRoutes");
const appointmentRouter = require("./routes/appointmentRoutes");
const adminRouter = require("./routes/adminRoutes");
const prescriptionRouter = require("./routes/prescriptionRoutes");
const app = express();

// ───────── Security Headers ─────────
app.use(helmet());

// ───────── CORS ─────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  }),
);

// ───────── Logging ─────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.set("trust proxy", 1);
// ───────── Rate Limiting ─────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many attempts, please try again later.",
});

app.use("/api/v1/users/login", authLimiter);
app.use("/api/v1/users/forgotPassword", authLimiter);

if (process.env.NODE_ENV === "production") {
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
  });

  app.use("/api", apiLimiter);
}

// ───────── Body Parser ─────────
app.use(express.json({ limit: "10kb" }));

// ───────── Security Sanitizers ─────────
app.use(mongoSanitize());
app.use(xss());
app.use(
  hpp({
    whitelist: ["sort", "fields", "page", "limit", "status", "specialty"],
  }),
);

// ───────── Routes ─────────
app.use("/api/v1/doctors", doctorRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/patients", patientRouter);
app.use("/api/v1/appointments", appointmentRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/prescriptions", prescriptionRouter);

// ───────── Health Check / Home Route ─────────
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to Alivio2 API! The server is running smoothly.",
  });
});

// ───────── 404 Handler ─────────
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
