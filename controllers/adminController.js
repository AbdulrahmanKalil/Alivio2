const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Doctor = require("../models/doctorModel");
const Patient = require("../models/patientModel");
const Appointment = require("../models/appointmentModel");

const getDashboard = catchAsync(async (req, res, next) => {
  try {
    const [
      totalDoctors,
      totalPatients,
      totalAppointments,
      revenueResult,
      topDoctors,
      appointmentStats,
    ] = await Promise.all([
      // 1️⃣ Total Doctors
      Doctor.countDocuments(),
      // 2️⃣ Total Patients
      Patient.countDocuments(),
      // Total Appointments
      Appointment.countDocuments(),

      // 4️⃣ Total Revenue ()
      Appointment.aggregate([
        {
          $match: { status: "completed" }, // فقط المواعيد المكتملة
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$price" }, // جمع أسعار المواعيد
          },
        },
      ]),
      // populate doctor
      Appointment.aggregate([
        {
          $match: { status: "completed" }, // فقط المواعيد المكتملة
        },
        {
          $group: {
            _id: "$doctorId",
            totalRevenue: { $sum: "$price" }, // جمع أسعار المواعيد لكل طبيب
            totalAppointments: { $sum: 1 }, // عد عدد المواعيد لكل طبيب
          },
        },
      ]),
      Appointment.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // 👇 هنا المكان الصحيح
    const statsObject = {};

    appointmentStats.forEach((stat) => {
      statsObject[stat._id] = stat.count;
    });
  } catch (error) {
    return next(new AppError("Failed to load dashboard data", 500));
  }
});
