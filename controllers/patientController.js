/* eslint-disable no-shadow */
const Patient = require("../models/patientModel");
const Doctor = require("../models/doctorModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("../services/factoryService");
const apiFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const Appointment = require("../models/appointmentModel");
const mongoose = require("mongoose");
const Prescription = require("../models/prescriptionModel");

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

exports.getPatientMedicalHistory = catchAsync(async (req, res, next) => {
  // 1) هات الدكتور من اليوزر
  const doctor = await Doctor.findOne({ user: req.user.id });

  if (!doctor) {
    return next(new AppError("Doctor profile not found", 404));
  }
  // 1) تأكد إن المريض موجود
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    return next(new AppError("Patient not found", 404));
  }

  // 2) 🔐 تأكد إن الدكتور له علاقة بالمريض
  const hasAccess = await Appointment.exists({
    doctor: doctor._id,
    patient: patient._id,
  });

  if (!hasAccess) {
    return next(new AppError("Not authorized to view this patient", 403));
  }

  // 3) هات التاريخ الطبي
  const medicalHistory = await Prescription.find({
    patient: patient._id,
  })
    .populate({ path: "doctor", select: "displayName specialty" })
    .populate({ path: "patient", select: "displayName" })
    .populate({ path: "appointment", select: "startTime" })
    .lean();

  res.status(200).json({
    status: "success",
    results: medicalHistory.length,
    data: medicalHistory,
  });
});

exports.getMyMedicalHistory = catchAsync(async (req, res, next) => {
  // 1) هات الـ patient المرتبط باليوزر
  const patient = await Patient.findOne({ user: req.user.id });

  if (!patient) {
    return next(new AppError("Patient profile not found", 404));
  }

  // 2) هات التاريخ الطبي
  const medicalHistory = await Prescription.find({
    patient: patient._id,
  })
    .populate({ path: "doctor", select: "displayName specialty" })
    .populate({ path: "appointment", select: "startTime" })
    .lean();

  res.status(200).json({
    status: "success",
    results: medicalHistory.length,
    data: medicalHistory,
  });
});

exports.getAllPatients = factory.getAll(Patient);
exports.getPatient = factory.getOne(Patient);
exports.createPatient = factory.createOne(Patient);
exports.updatePatient = factory.updateOne(Patient);
exports.deletePatient = factory.deleteOne(Patient);
