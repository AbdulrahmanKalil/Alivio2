const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { promisify } = require("util");
const mongoose = require("mongoose");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");
const Doctor = require("../models/doctorModel");
const Patient = require("../models/patientModel");

// ================= TOKEN =================
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() +
        Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
  }

  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};
// ================= AUTH =================
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

    // 2️⃣ Create Patient
    const patient = await Patient.create(
      [
        {
          user: user[0]._id,
          displayName: req.body.displayName,
          phone: req.body.phone,
          address: req.body.address,
          bloodType: req.body.bloodType,
          // chronicConditions default from schema
        },
      ],
      { session },
    );

    // 3️⃣ Commit
    await session.commitTransaction();
    session.endSession();

    createSendToken(user[0], 200, res);
  } catch (err) {
    // 4️⃣ Rollback
    await session.abortTransaction();
    session.endSession();
    throw err; // catchAsync handles it
  }
});
const signupDoctor = catchAsync(async (req, res, next) => {
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
          role: "doctor",
        },
      ],
      { session },
    );

    // 2️⃣ Create Doctor Profile
    const doctor = await Doctor.create(
      [
        {
          user: user[0]._id,

          displayName: req.body.displayName,
          phone: req.body.phone,
          specialty: req.body.specialty,
          yearsOfExperience: req.body.yearsOfExperience,
          price: req.body.price,
          schedule: req.body.schedule,
          workingHours: {
            start: req.body.workingHours.start,
            end: req.body.workingHours.end,
          },
          gender: req.body.gender,
          description: req.body.description,
        },
      ],
      { session },
    );

    // 3️⃣ Commit Transaction
    await session.commitTransaction();
    session.endSession();

    createSendToken(user[0], 200, res);
  } catch (err) {
    // ❌ Rollback if anything fails
    await session.abortTransaction();
    session.endSession();
    throw err; // catchAsync will handle it
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
// ================= PROTECT =================
const protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
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

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401,
      ),
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401),
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;

  if (currentUser.role === "doctor") {
    const doctor = await Doctor.findOne({ user: currentUser._id });

    if (!doctor) {
      return next(new AppError("Doctor profile not found for this user", 404));
    }

    req.user.doctorId = doctor._id;
  }

  if (currentUser.role === "patient") {
    const patient = await Patient.findOne({ user: currentUser._id });

    if (!patient) {
      return next(new AppError("Patient profile not found for this user", 404));
    }

    req.user.patientId = patient._id;
  }

  next();
});
// ================= RESTRICT =================
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      status: "fail",
      message: "You do not have permission to perform this action",
    });
  }
  next();
};
// ================= PASSWORD =================
const forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    "host",
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to:\n${resetURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 min)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the email. Try again later!",
        500,
      ),
    );
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
  signupDoctor,
  login,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
  updatePassword,
};
