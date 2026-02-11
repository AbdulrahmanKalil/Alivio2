const Doctor = require("../models/doctorModel");
// const APIFeatures = require("./../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");

exports.getAllDoctors = async (req, res, next) => {
  const features = new APIFeatures(Doctor.find(), req.query)
    .search()
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const doctors = await features.query;

  res.status(200).json({
    results: doctors.length,
    data: doctors,
  });
};

// getDoctor
exports.getDoctor = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id).populate(
    "user",
    "name email",
  );
  if (!doctor) {
    return next(new AppError("No doctor found with that ID", 404));
  }
  res.status(200).json({
    status: "success",
    data: { doctor },
  });
});

//Update doctor
exports.updateDoctor = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
    new: true, //ترجّعلك الـ document بعد التعديل
    runValidators: true,
  });

  if (!doctor) {
    return next(new AppError("No doctor found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: { doctor },
  });
});

// Delete doctor
exports.deleteDoctor = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findByIdAndDelete(req.params.id);

  if (!doctor) {
    return next(new AppError("No doctor found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

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
