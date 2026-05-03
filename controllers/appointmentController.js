const Appointment = require("../models/appointmentModel");
const catchAsync = require("../utils/catchAsync");
const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const Doctor = require("../models/doctorModel");
const Patient = require("../models/patientModel");
const factory = require("../services/factoryService");
const { mapAppointments } = require("../utils/helpers/appointmentMapper");
const mongoose = require("mongoose");

exports.setDoctorId = (req, res, next) => {
  if (!req.body.doctor && req.params.doctorId) {
    req.body.doctor = req.params.doctorId;
  }
  next();
};

exports.bookAppointment = catchAsync(async (req, res, next) => {
  const doctorId = req.body.doctor;

  // 1) Check doctor
  const doctor = await Doctor.findById(doctorId).lean();
  if (!doctor) {
    return next(new AppError("Doctor not found", 404));
  }

  // 2) Determine patient based on role
  if (req.user.role === "patient") {
    // المريض بيحجز لنفسه
    const patient = await Patient.findOne({ user: req.user._id });

    if (!patient) {
      return next(new AppError("Patient not found", 404));
    }
  } else if (req.user.role === "admin") {
    // الأدمن لازم يبعت patient id
    const patientId = req.body.patient;

    if (!patientId) {
      return next(new AppError("Patient ID is required for admin", 400));
    }

    patient = await Patient.findById(patientId);

    if (!patient) {
      return next(new AppError("Patient not found", 404));
    }
  } else {
    return next(new AppError("Unauthorized role", 403));
  }

  // 3) Time calculation
  const start = new Date(req.body.startTime);
  const duration = 15;
  const end = new Date(start.getTime() + duration * 60000);

  // 4) Check conflict
  const conflict = await Appointment.findOne({
    doctor: doctorId,
    startTime: { $lt: end },
    endTime: { $gt: start },
  }).lean();

  if (conflict) {
    return next(new AppError("This time slot is already booked", 400));
  }

  // 5) Create appointment
  const appointment = await Appointment.create({
    patient: patient._id,
    doctor: doctor._id,
    startTime: start,
    endTime: end,
    bookedBy: req.user._id,
    price: doctor.price,
  });

  res.status(201).json({
    status: "success",
    data: { appointment },
  });
});

// ✅ Fixed: added catchAsync + lean()
exports.getAllAppointments = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Appointment.find().lean(), req.query)
    .search()
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const appointments = await features.query
    .select("-createdAt -updatedAt")
    .populate("doctor", "displayName")
    .populate("patient", "displayName dateOfBirth");

  res.status(200).json({
    status: "success",
    results: appointments.length,
    data: appointments,
  });
});

exports.getMyAppointments = catchAsync(async (req, res) => {
  let filter = {};

  if (req.user.role === "doctor") {
    filter.doctor = req.user.doctorId;
  }

  if (req.user.role === "patient") {
    filter.patient = req.user.patientId;
  }

  const features = new APIFeatures(Appointment.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // ✅ Fixed: added lean()
  const appointments = await features.query
    .lean()
    .populate({ path: "doctor", select: "displayName specialty price" })
    .populate({ path: "patient", select: "displayName email" });

  const cleanAppointments = mapAppointments(appointments);

  res.status(200).json({
    status: "success",
    results: cleanAppointments.length,
    data: { appointments: cleanAppointments },
  });
});

exports.cancelAppointmentByDoctor = catchAsync(async (req, res, next) => {
  const { status } = req.body;

  const allowedStatus = ["confirmed", "cancelled", "completed"];
  if (!allowedStatus.includes(status)) {
    return next(new AppError("Invalid status value", 400));
  }

  const appointment = await Appointment.findOne({
    _id: req.params.id,
    doctor: req.user.doctorId,
  });

  if (!appointment) {
    return next(new AppError("Appointment not found or not authorized", 404));
  }

  const appointmentTime = new Date(appointment.startTime);
  const now = new Date();

  if (status === "cancelled") {
    if (["cancelled", "completed"].includes(appointment.status)) {
      return next(
        new AppError(
          `Cannot cancel an appointment that is already ${appointment.status}`,
          400,
        ),
      );
    }
  }

  if (now >= appointmentTime) {
    return next(
      new AppError(
        "Cannot cancel an appointment that has already started",
        400,
      ),
    );
  }

  if (status === "confirmed") {
    if (appointment.status !== "pending") {
      return next(
        new AppError("Only pending appointments can be confirmed", 400),
      );
    }
  }

  if (status === "completed") {
    if (appointment.status !== "confirmed") {
      return next(
        new AppError(
          "Only confirmed appointments can be marked as completed",
          400,
        ),
      );
    }

    if (now < appointmentTime) {
      return next(
        new AppError(
          "Cannot complete an appointment before its scheduled time",
          400,
        ),
      );
    }
  }

  const updateData = {
    status,
    updatedBy: req.user._id,
  };

  if (status === "cancelled") {
    updateData.cancelledBy = req.user._id;
    updateData.cancelledAt = now;
  } else if (status === "confirmed") {
    updateData.confirmedBy = req.user._id;
    updateData.confirmedAt = now;
  } else if (status === "completed") {
    updateData.completedBy = req.user._id;
    updateData.completedAt = now;
  }

  appointment.set(updateData);
  await appointment.save({ validateBeforeSave: true });

  res.status(200).json({
    status: "success",
    data: { appointment },
  });
});

exports.cancelAppointmentByPatient = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findOne({
    _id: req.params.id,
    patient: req.user.patientId,
  })
    .populate({ path: "doctor", select: "displayName specialty price" })
    .populate({ path: "patient", select: "displayName email" });

  if (!appointment) {
    return next(new AppError("Appointment not found or not authorized", 404));
  }

  const appointmentTime = new Date(appointment.startTime);
  const now = new Date();
  const hoursDiff =
    (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (["cancelled", "completed"].includes(appointment.status)) {
    return next(
      new AppError(
        `Cannot cancel an appointment that is already ${appointment.status}`,
        400,
      ),
    );
  }

  if (now >= appointmentTime) {
    return next(
      new AppError(
        "Cannot cancel an appointment that has already started",
        400,
      ),
    );
  }

  if (["pending", "confirmed"].includes(appointment.status) && hoursDiff < 24) {
    return next(
      new AppError(
        "Appointments must be cancelled at least 24 hours before the scheduled time",
        400,
      ),
    );
  }

  appointment.set({
    status: "cancelled",
    cancelledBy: req.user._id,
    cancelledAt: now,
    updatedBy: req.user._id,
  });

  await appointment.save({ validateBeforeSave: true });

  const cleanAppointment = mapAppointments([appointment]);

  res.status(200).json({
    status: "success",
    data: { appointment: cleanAppointment[0] },
  });
});

exports.getAppointment = catchAsync(async (req, res, next) => {
  const doctor = await Doctor.findOne({ user: req.user.id });

  const appointment = await Appointment.findOne({
    _id: req.params.id,
    doctor: doctor._id,
  }).populate("patient", "name email");

  if (!appointment) {
    return next(new AppError("Appointment not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      appointment,
    },
  });
});

exports.getPatientScansForDoctor = catchAsync(async (req, res, next) => {
  const { appointmentId } = req.params;

  // 1) جيب الـ appointment وتأكد إنه موجود
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    return next(new AppError("Appointment not found", 404));
  }

  // 2) تأكد إن الدكتور اللي بيطلب هو نفس دكتور الـ appointment
  const doctor = await Doctor.findOne({ user: req.user.id });
  if (appointment.doctor.toString() !== doctor.id) {
    return next(new AppError("Not authorized", 403));
  }

  // 3) جيب السكانز الخاصة بالـ appointment ده
  const scans = await Scan.find({ appointment: appointmentId })
    .sort("-createdAt")
    .lean();

  res.status(200).json({
    status: "success",
    results: scans.length,
    data: { scans },
  });
});
