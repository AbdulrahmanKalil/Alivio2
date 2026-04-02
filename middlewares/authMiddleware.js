const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const User = require("../models/userModel");
const Doctor = require("../models/doctorModel");
const Patient = require("../models/patientModel");

const protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401),
    );
  }
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401,
      ),
    );
  }
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401),
    );
  }
  req.user = currentUser;
  if (currentUser.role === "doctor") {
    const doctor = await Doctor.findOne({ user: currentUser._id });
    if (!doctor)
      return next(new AppError("Doctor profile not found for this user", 404));
    req.user.doctorId = doctor._id;
  }
  if (currentUser.role === "patient") {
    const patient = await Patient.findOne({ user: currentUser._id });
    if (!patient)
      return next(new AppError("Patient profile not found for this user", 404));
    req.user.patientId = patient._id;
  }
  next();
});

const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          status: "fail",
          message: "You do not have permission to perform this action",
        });
    }
    next();
  };

module.exports = { protect, restrictTo };
