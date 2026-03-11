const Doctor = require("../models/doctorModel");
const factory = require("../controllers/handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");

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

exports.getAllDoctors = factory.getAll(Doctor);
exports.getDoctor = factory.getOne(Doctor);
exports.createDoctor = factory.createOne(Doctor);
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
