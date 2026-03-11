/* eslint-disable no-shadow */
const Patient = require("../models/patientModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("../controllers/handlerFactory");
const apiFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const Appointment = require("../models/appointmentModel");
const mongoose = require("mongoose");

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

exports.getMyPatients = catchAsync(async (req, res, next) => {
  const doctorId = req.user.doctorId;
  const patients = await Appointment.aggregate([
    {
      $match: {
        doctor: new mongoose.Types.ObjectId(doctorId),
        status: "completed",
      },
    },
    {
      $group: {
        _id: "$patient",
      },
    },
    {
      $lookup: {
        from: "patients",
        localField: "_id",
        foreignField: "_id",
        as: "patient",
      },
    },
    {
      $unwind: "$patient",
    },
    {
      $replaceRoot: { newRoot: "$patient" },
    },
  ]);

  res.status(200).json({
    status: "success",
    results: patients.length,
    data: patients,
  });
});

exports.getAllPatients = factory.getAll(Patient);
exports.getPatient = factory.getOne(Patient);
exports.createPatient = factory.createOne(Patient);
exports.updatePatient = factory.updateOne(Patient);
exports.deletePatient = factory.deleteOne(Patient);
