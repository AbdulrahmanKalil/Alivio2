/* eslint-disable no-shadow */
const Patient = require("../models/patientModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("../controllers/handlerFactory");
const apiFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");

// getMyProfile
exports.getMyProfile = catchAsync(async (req, res, next) => {
  const patient = await Patient.findOne({ user: req.user.id }).populate(
    "user",
    "name email photo phone",
  );
  if (!patient) {
    return next(new AppError("patient profile not found", 404));
  }
  res.status(201).json({
    status: "success",
    data: {
      patient,
    },
  });
});

exports.getAllPatients = factory.getAll(Patient);
exports.getPatient = factory.getOne(Patient);
exports.createPatient = factory.createOne(Patient);
exports.updatePatient = factory.updateOne(Patient);

// // getAllPatient
// exports.getAllPatient = catchAsync(async (req, res, next) => {
//   const patient = await Patient.find();
//   res.status(200).json({
//     status: "success",
//     data: {
//       patient,
//     },
//   });
// });

// exports.getPatient = catchAsync(async (req, res, next) => {
//   const patient = await Patient.findById(req.params.id);
//   if (!patient) {
//     return next(new AppError("No patient found with that ID", 404));
//   }
//   res.status(200).json({
//     status: "success",
//     data: {
//       patient,
//     },
//   });
// });

// exports.updatePatient = catchAsync(async (req, res, next) => {
//   const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   });

//   if (!patient) {
//     return next(new AppError("No patient found with that ID", 404));
//   }

//   res.status(200).json({
//     status: "success",
//     data: {
//       updatedFields: req.body,
//     },
//   });
// });

// // exports.deletePatient = catchAsync(async (req, res, next) => {
// //   const patient = await Patient.findById(req.params.id);

// //   if (!patient) {
// //     return next(new AppError("No patient found with that ID", 404));
// //   }

// //   await Patient.findByIdAndDelete(req.params.id);

// //   res.status(204).json({
// //     status: "success",
// //     data: null,
// //   });
// // });
