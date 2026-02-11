const Appointment = require("../models/appointmentModel");
const catchAsync = require("../utils/catchAsync");
const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const Doctor = require("../models/doctorModel");
const Patient = require("../models/patientModel");
const { mapAppointments } = require("../utils/appointmentMapper");

// exports.getAllappointment = catchAsync(async (_req, res) => {
//     const features = new features(Appointment.find(), _req.query)
//     .search()
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();

//   const appointment = await features.query;

//   res.status(200).json({
//     status: "succsess",
//     data: {
//       appointment,
//     },
//   });
// });

exports.setDoctorId = (req, res, next) => {
  req.body.doctor = req.params.doctorId;
  next();
};

exports.bookAppointment = catchAsync(async (req, res, next) => {
  const { doctor: doctorId, date } = req.body;

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return next(new AppError("Doctor not found", 404));
  }

  const appointmentDate = new Date(date);
  if (appointmentDate < Date.now()) {
    return next(new AppError("Invalid appointment date", 400));
  }

  const conflict = await Appointment.findOne({
    doctor: doctorId,
    date: appointmentDate,
    status: { $ne: "cancelled" },
  });

  if (conflict) {
    return next(new AppError("Time slot already booked", 400));
  }

  const appointment = await Appointment.create({
    patient: req.user.patientId,
    doctor: doctorId,
    date: appointmentDate,
    status: "pending",
  });

  res.status(201).json({
    status: "success",
    data: { appointment },
  });
});

// exports.getMyAppointments = catchAsync(async (req, res) => {
//   const filter = {};

//   if (req.user.role === "doctor") {
//     filter.doctor = req.user.doctorId;
//   }

//   if (req.user.role === "patient") {
//     filter.patient = req.user.patientId;
//   }

//   const appointments = await Appointment.find(filter);

//   res.status(200).json({
//     status: "success",
//     results: appointments.length,
//     data: { appointments },
//   });
// });
exports.getMyAppointments = catchAsync(async (req, res) => {
  let filter = {};

  if (req.user.role === "doctor") {
    filter.doctor = req.user.doctorId;
  }

  if (req.user.role === "patient") {
    filter.patient = req.user.patientId;
  }

  const features = new APIFeatures(Appointment.find(filter), req.query)
    .search()
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
      select: "displayName email", //
    });
  const cleanAppointments = mapAppointments(appointments);

  res.status(200).json({
    status: "success",
    results: cleanAppointments.length,
    data: {
      appointments: cleanAppointments,
    },
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
  const appointmentTime = new Date(appointment.date);
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
  // 1️⃣ هات الموعد وتأكد إنه بتاع المريض
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

  const appointmentTime = new Date(appointment.date);
  const now = new Date();

  const hoursDiff =
    (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  // 2️⃣ مينفعش تلغي موعد متلغي أو مخلص
  if (["cancelled", "completed"].includes(appointment.status)) {
    return next(
      new AppError(
        `Cannot cancel an appointment that is already ${appointment.status}`,
        400,
      ),
    );
  }

  // 3️⃣ pending أو confirmed → لازم 24 ساعة
  if (["pending", "confirmed"].includes(appointment.status)) {
    if (hoursDiff < 24) {
      return next(
        new AppError(
          "Appointments can only be cancelled at least 24 hours before the scheduled time",
          400,
        ),
      );
    }
  }

  // 4️⃣ مينفعش تلغي لو الموعد بدأ
  if (now >= appointmentTime) {
    return next(
      new AppError(
        "Cannot cancel an appointment that has already started",
        400,
      ),
    );
  }

  // 5️⃣ حدّث الموعد
  appointment.set({
    status: "cancelled",
    cancelledBy: req.user._id,
    cancelledAt: now,
    updatedBy: req.user._id,
  });

  await appointment.save({ validateBeforeSave: true });

  const cleanAppointments = mapAppointments(appointments);
  res.status(200).json({
    status: "success",
    data: {
      appointments: cleanAppointments,
    },
  });
});
