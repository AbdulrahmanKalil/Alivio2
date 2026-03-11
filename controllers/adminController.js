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

// ai
const getFilteredAppointments = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      status,
      location,
      doctor,
      search,
      page = 1,
      limit = 10,
    } = req.query;
    const match = {};
    // Date filter
    if (startDate || endDate) {
      match.startTime = {
        ...(startDate && { $gte: new Date(startDate) }),
        ...(endDate && { $lte: new Date(endDate) }),
      };
    }
    // Status
    if (status) match.status = status;
    // Location
    if (location) match["location.clinicName"] = location;
    // Doctor
    if (doctor && mongoose.Types.ObjectId.isValid(doctor)) {
      match.doctor = new mongoose.Types.ObjectId(doctor);
    }
    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: "patients",
          localField: "patient",
          foreignField: "_id",
          as: "patient",
        },
      },
      { $unwind: "$patient" },
      {
        $lookup: {
          from: "doctors",
          localField: "doctor",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: "$doctor" },
      // 🔎 search
      ...(search
        ? [
            {
              $match: {
                $or: [
                  {
                    "patient.displayName": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                  {
                    "doctor.user.name": {
                      $regex: search,
                      $options: "i",
                    },
                  },
                ],
              },
            },
          ]
        : []),
      {
        $project: {
          patientName: "$patient.displayName",
          contactInfo: "$patient.phone",
          dateTime: {
            $dateToString: {
              format: "%Y-%m-%d %H:%M",
              date: "$startTime",
            },
          },
          invoiceId: {
            $concat: ["#INV", { $toString: "$invoiceNumber" }],
          },
          practitioner: "$doctor.user.name",
          location: "$location.clinicName",
          status: 1,
        },
      },
      { $sort: { startTime: -1 } },
      { $skip: (+page - 1) * +limit },
      { $limit: +limit },
    ];
    const docs = await Appointment.aggregate(pipeline);
    const total = await Appointment.countDocuments(match);
    res.status(200).json({
      status: "success",
      total,
      page: +page,
      pages: Math.ceil(total / limit),
      stats: statsObject,
      docs,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboard,
  getAppointmentStats,
  getFilteredAppointments,
};
