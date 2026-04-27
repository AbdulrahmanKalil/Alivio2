const mongoose = require("mongoose");
const User = require("../models/userModel");
const Doctor = require("../models/doctorModel");
const factory = require("../services/factoryService");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");
const { createSendToken } = require("../controllers/authController");

// getMyProfile
exports.getMyProfile = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findOne({ user: req.user.id }).populate(
    "user",
    "name email photo phone",
  );
  if (!doctor) {
    return next(new AppError("Doctor profile not found", 404));
  }
  res.status(201).json({
    status: "success",
    data: {
      doctor,
    },
  });
});

exports.createDoctor = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      role: "doctor",
    });
    await user.save({ session });

    const doctor = new Doctor({
      user: user._id,
      displayName: req.body.displayName,
      phone: req.body.phone,
      specialty: req.body.specialty,
      yearsOfExperience: req.body.yearsOfExperience,
      price: req.body.price,
      schedule: req.body.schedule,
      workingHours: req.body.workingHours,
      dateOfBirth: req.body.dateOfBirth,
      address: req.body.address,
      gender: req.body.gender,
      description: req.body.description,
    });
    await doctor.save({ session });

    await session.commitTransaction();
    session.endSession();

    // ✅ بعد ما نخلص من الـ session
    createSendToken(user, 201, res);
  } catch (err) {
    // ✅ تحقق إن الـ transaction لسه مفعلش commit
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    next(err);
  }
});
exports.getAllDoctors = factory.getAll(Doctor);
exports.getDoctor = factory.getOne(Doctor);
// exports.createDoctor = factory.createOne(Doctor);
exports.updateDoctor = factory.updateOne(Doctor);

exports.getDoctorSchedule = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id).select("schedule");

  if (!doctor) {
    return next(new AppError("Doctor not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      schedule: doctor.schedule,
    },
  });
});
