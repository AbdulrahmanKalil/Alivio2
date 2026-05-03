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
const Scan = require("../models/scanModel");
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

exports.createPatient = catchAsync(async (req, res, next) => {
  // 1) تأكد إن اليوزر مسجل دخول
  if (!req.user) {
    return next(new AppError("You are not logged in", 401));
  }

  // 2) امنع إنشاء أكتر من profile لنفس اليوزر
  const existingPatient = await Patient.findOne({ user: req.user.id });

  if (existingPatient) {
    return next(new AppError("You already have a patient profile", 400));
  }

  // 3) إنشاء المريض
  const patient = await Patient.create({
    ...req.body,
    user: req.user.id, // 🔥 أهم سطر
  });

  res.status(201).json({
    status: "success",
    data: patient,
  });
});

exports.getPatientScansForDoctor = catchAsync(async (req, res, next) => {
  const { patientId } = req.params;

  // 1) تأكد إن الدكتور موجود
  const doctor = await Doctor.findOne({ user: req.user.id });
  if (!doctor) {
    return next(new AppError("Doctor profile not found", 404));
  }

  // 2) تأكد إن في appointment بين الدكتور ده والمريض ده
  const appointment = await Appointment.findOne({
    doctor: doctor.id,
    patient: patientId,
  });
  if (!appointment) {
    return next(new AppError("Not authorized", 403));
  }

  // 3) جيب السكانز
  const scans = await Scan.find({ patient: patientId })
    .sort("-createdAt")
    .lean();

  res.status(200).json({
    status: "success",
    results: scans.length,
    data: { scans },
  });
});

exports.getAllPatients = factory.getAll(Patient);
exports.getPatient = factory.getOne(Patient);

exports.updatePatient = factory.updateOne(Patient);
exports.deletePatient = factory.deleteOne(Patient);
