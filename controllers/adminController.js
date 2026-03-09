const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Doctor = require("../models/doctorModel");
const Patient = require("../models/patientModel");
const Appointment = require("../models/appointmentModel");

const getDashboard = catchAsync(async (req, res, next) => {
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

    // 3️⃣ Total Appointments
    Appointment.countDocuments(),

    // 4️⃣ Total Revenue
    Appointment.aggregate([
      {
        $match: { status: "completed" },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$price" },
        },
      },
    ]),

    // 5️⃣ Top Doctors
    Appointment.aggregate([
      {
        $match: { status: "completed" },
      },
      {
        $group: {
          _id: "$doctor",
          totalRevenue: { $sum: "$price" },
          totalAppointments: { $sum: 1 },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: "doctors",
          localField: "_id",
          foreignField: "_id",
          as: "doctor",
        },
      },
      {
        $unwind: "$doctor",
      },
    ]),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      totalDoctors,
      totalPatients,
      totalAppointments,
      revenue: revenueResult[0]?.totalRevenue || 0,
      topDoctors,
    },
  });
});

const getAppointmentStats = catchAsync(async (req, res, next) => {
  // 6️⃣ Appointment Stats
  const appointmentStats = await Appointment.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const statsObject = {};

  appointmentStats.forEach((stat) => {
    statsObject[stat._id] = stat.count;
  });

  res.status(200).json({
    status: "success",
    data: {
      appointmentStats,
    },
  });
});

module.exports = {
  getDashboard,
  getAppointmentStats,
};
