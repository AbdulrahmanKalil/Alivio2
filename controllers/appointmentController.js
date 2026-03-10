const Appointment = require("../models/appointmentModel");
const catchAsync = require("../utils/catchAsync");
const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const Doctor = require("../models/doctorModel");
const Patient = require("../models/patientModel");
const { mapAppointments } = require("../utils/appointmentMapper");

exports.setDoctorId = (req, res, next) => {
  if (!req.body.doctor && req.params.doctorId) {
    req.body.doctor = req.params.doctorId;
  }
  next();
};

exports.bookAppointment = catchAsync(async (req, res, next) => {
  const patientId = req.user.patientId;
  const doctorId = req.params.doctorId;

  const doctor = await Doctor.findById(doctorId);

  if (!doctor) {
    return next(new AppError("Doctor not found", 404));
  }

  const start = new Date(req.body.startTime);

  const duration = 15;

  const end = new Date(start.getTime() + duration * 60000);

  const conflict = await Appointment.findOne({
    doctor: doctorId,
    startTime: { $lt: end },
    endTime: { $gt: start },
  });

  if (conflict) {
    return next(new AppError("This time slot is already booked", 400));
  }

  const appointment = await Appointment.create({
    patient: patientId,
    doctor: doctorId,
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

exports.getAllAppointments = async (req, res, next) => {
  const features = new APIFeatures(Appointment.find(), req.query)
    .search()
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const appointments = await features.query
    .select("doctor patient startTime  status")
    .populate("doctor", "displayName ")
    .populate("patient", "displayName ");

  res.status(200).json({
    results: appointments.length,
    data: appointments,
  });
};

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

  const appointments = await features.query
    .populate({
      path: "doctor",
      select: "displayName specialty price",
    })
    .populate({
      path: "patient",
      select: "displayName email",
    });

  const cleanAppointments = mapAppointments(appointments);

  res.status(200).json({
    status: "success",
    results: cleanAppointments.length,
    data: { appointments: cleanAppointments },
  });
});

// exports.updateAppointmentStatus = catchAsync(async (req, res, next) => {
//   const { status } = req.body;

//   const allowedStatus = ["confirmed", "cancelled"];

//   if (!allowedStatus.includes(status)) {
//     return next(new AppError("Invalid status value", 400));
//   }

//   const appointment = await Appointment.findOneAndUpdate(
//     {
//       _id: req.params.id,
//       doctor: req.user.doctorId,
//     },
//     { status },
//     {
//       new: true,
//       runValidators: true,
//     },
//   );

//   if (!appointment) {
//     return next(new AppError("Appointment not found or not authorized", 404));
//   }

//   res.status(200).json({
//     status: "success",
//     data: {
//       appointment,
//     },
//   });
// });

exports.cancelAppointmentByDoctor = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  // مسموح يعمل ايه
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
    // مينفعش إلغاء موعد تم إلغاؤه أو إكماله
    if (["cancelled", "completed"].includes(appointment.status)) {
      return next(
        new AppError(
          `Cannot cancel an appointment that is already ${appointment.status}`,
          400,
        ),
      );
    }
  }
  // مينفعش إلغاء موعد بدأ بالفعل
  if (now >= appointmentTime) {
    return next(
      new AppError(
        "Cannot cancel an appointment that has already started",
        400,
      ),
    );
  }
  // لازم يكون في مرحله pending
  if (status === "confirmed") {
    if (appointment.status !== "pending") {
      return next(
        new AppError("Only pending appointments can be confirmed", 400),
      );
    }
  }

  // لازم يكون في
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

  // 4. تحضير بيانات التحديث
  const updateData = {
    status,
    updatedBy: req.user._id,
  };
  // إضافة حقول خاصة بكل حالة
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
  // 5. تحديث الموعد
  appointment.set(updateData);
  await appointment.save({ validateBeforeSave: true });

  res.status(200).json({
    status: "success",
    data: {
      appointment,
    },
  });
});

exports.cancelAppointmentByPatient = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findOne({
    _id: req.params.id,
    patient: req.user.patientId,
  })
    .populate({
      path: "doctor",
      select: "displayName specialty price",
    })
    .populate({
      path: "patient",
      select: "displayName email",
    });

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

  await appointment.save({
    validateBeforeSave: true,
  });

  const cleanAppointment = mapAppointments([appointment]);

  res.status(200).json({
    status: "success",
    data: {
      appointment: cleanAppointment[0],
    },
  });
});
