const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { promisify } = require("util");
const mongoose = require("mongoose");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const emailService = require("../services/emailService");
const Doctor = require("../models/doctorModel");
const Patient = require("../models/patientModel");
// ================= AUTH =================
const createSendToken = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

const signupPatient = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1️⃣ Create User
    const user = await User.create(
      [
        {
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
          passwordConfirm: req.body.passwordConfirm,
          role: "patient",
        },
      ],
      { session },
    );
    console.log("BODY:", req.body);
    console.log("DOB:", req.body.dateOfBirth);
    console.log("TYPE:", typeof req.body.dateOfBirth);

    // 2️⃣ Create Patient
    const patient = await Patient.create(
      [
        {
          user: user[0]._id,
          displayName: req.body.displayName,
          phone: req.body.phone,
          address: req.body.address,
          bloodType: req.body.bloodType,
          dateOfBirth: req.body.dateOfBirth,
          medicalHistory: req.body.medicalHistory, // Optional, can be empty array or not provided
          // chronicConditions default from schema
        },
      ],
      { session },
    );

    // 3️⃣ Commit
    await session.commitTransaction();
    session.endSession();

    createSendToken(user[0], 201, res);
  } catch (err) {
    // 4️⃣ Rollback
    await session.abortTransaction();
    session.endSession();
    throw err; // catchAsync handles it
  }
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  createSendToken(user, 200, res);
});
// ================= PASSWORD =================
const forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    email: req.body.email,
  });

  if (!user) {
    return res.status(200).json({
      status: "success",
      message: "If that email is registered, a reset link has been sent.",
    });
  }

  const resetToken = user.createPasswordResetToken();

  await user.save({
    validateBeforeSave: false,
  });

  const resetURL = `${req.protocol}://${req.get(
    "host",
  )}/api/v1/users/resetPassword/${resetToken}`;

  try {
    await emailService({
      email: user.email,
      subject: "Password Reset",
      message: `Reset your password: ${resetURL}`,
    });

    res.status(200).json({
      status: "success",
      message: "Reset token sent to email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({
      validateBeforeSave: false,
    });

    return next(new AppError("There was an error sending the email.", 500));
  }
});
const resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  createSendToken(user, 200, res);
});
const updatePassword = catchAsync(async (req, res, next) => {
  // ✅ FIX HERE
  const user = await User.findById(req.user.id).select("+password");

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createSendToken(user, 200, res);
});

// ================= EXPORT =================
module.exports = {
  signupPatient,
  login,
  forgotPassword,
  resetPassword,
  updatePassword,
  createSendToken,
};
