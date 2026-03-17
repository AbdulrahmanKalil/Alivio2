const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Prescription = require("../models/PrescriptionModels");
const Appointment = require("../models/appointmentModel");
const Doctor = require("../models/doctorModel");
const Patient = require("../models/patientModel");
const APIFeatures = require("../utils/apiFeatures");

exports.createPrescription = catchAsync(async (req, res, next) => {
  const { diagnosis, medications, notes, followUpDate } = req.body;
  const appointmentId = req.params.appointmentId;

  if (!diagnosis || !medications || medications.length === 0) {
    return next(new AppError("Diagnosis and medications are required", 400));
  }
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    return next(new AppError("Appointment not found", 404));
  }

  // هات الدكتور المرتبط باليوزر اللي عامل login
  const doctor = await Doctor.findOne({ user: req.user.id });

  if (!doctor) {
    return next(new AppError("Doctor profile not found", 404));
  }

  // قارن Doctor._id مع appointment.doctor
  if (appointment.doctor.toString() !== doctor._id.toString()) {
    return next(
      new AppError(
        "Not authorized to create prescription for this appointment",
        403,
      ),
    );
  }

  const existingPrescription = await Prescription.findOne({
    appointment: appointmentId,
  });

  if (existingPrescription) {
    return next(new AppError("Prescription already exists", 400));
  }
  if (
    appointment.status !== "completed" &&
    appointment.status !== "confirmed"
  ) {
    return next(
      new AppError(
        "Prescription can only be created after appointment is confirmed or completed",
        400,
      ),
    );
  }

  const prescription = await Prescription.create({
    appointment: appointmentId,
    doctor: req.user.doctorId,
    patient: appointment.patient,
    diagnosis: req.body.diagnosis,
    medications: req.body.medications,
    notes: req.body.notes,
  });
  res.status(201).json({
    status: "success",
    data: { prescription },
  });
});

exports.getAllPrescriptions = catchAsync(async (req, res, next) => {
  let filter = {};

  if (req.user.role === "doctor") {
    const doctor = await Doctor.findOne({ user: req.user._id });

    if (!doctor) {
      return next(new AppError("Doctor profile not found", 404));
    }

    filter.doctor = doctor._id;
  }

  if (req.user.role === "patient") {
    const patient = await Patient.findOne({ user: req.user._id });

    if (!patient) {
      return next(new AppError("Patient profile not found", 404));
    }

    filter.patient = patient._id;
  }
  const prescriptions = await Prescription.find(filter)
    .populate({ path: "doctor", select: "displayName specialty" })
    .populate({ path: "patient", select: "displayName email" })
    .populate({ path: "appointment", select: "startTime" });

  res.status(200).json({
    status: "success",
    results: prescriptions.length,
    data: { prescriptions },
  });
});

// /my-prescriptions
exports.getPrescription = catchAsync(async (req, res, next) => {
  let filter = {};

  if (req.user.role === "doctor") {
    const doctor = await Doctor.findOne({ user: req.user._id });

    if (!doctor) {
      return next(new AppError("Doctor profile not found", 404));
    }

    filter.doctor = doctor._id;
  }

  if (req.user.role === "patient") {
    const patient = await Patient.findOne({ user: req.user._id });

    if (!patient) {
      return next(new AppError("Patient profile not found", 404));
    }

    filter.patient = patient._id;
  }

  const features = new APIFeatures(Prescription.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const prescriptions = await features.query
    .populate({
      path: "doctor",
      select: "displayName specialty",
    })
    .populate({
      path: "patient",
      select: "displayName ",
    })
    .populate({
      path: "appointment",
      select: "startTime",
    });

  res.status(200).json({
    status: "success",
    results: prescriptions.length,
    data: { prescriptions },
  });
});

exports.getPrescriptionByAppointmentId = catchAsync(async (req, res, next) => {
  const { appointmentId } = req.params;

  const prescription = await Prescription.findOne({
    appointment: appointmentId,
  })
    .populate({ path: "doctor", select: "displayName specialty" })
    .populate({ path: "patient", select: "displayName email" })
    .populate({ path: "appointment", select: "startTime" });

  if (!prescription) {
    return next(new AppError("Prescription not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { prescription },
  });
});

exports.updatePrescription = catchAsync(async (req, res, next) => {
  const { prescriptionId } = req.params;

  const prescription = await Prescription.findByIdAndUpdate(
    prescriptionId,
    {
      diagnosis: req.body.diagnosis,
      medications: req.body.medications, // هنا يمكن تغيير status
      notes: req.body.notes,
      followUpDate: req.body.followUpDate,
      status: req.body.status,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!prescription) {
    return next(new AppError("Prescription not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { prescription },
  });
});
