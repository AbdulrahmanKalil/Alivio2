const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const User = require("../models/userModel");
const Doctor = require("../models/doctorModel");
const Patient = require("../models/patientModel");
const Appointment = require("../models/appointmentModel");

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD,
);

// اتصال MongoDB (بدون options القديمة)
mongoose
  .connect(DB)
  .then(() => console.log("DB connection successful!"))
  .catch((err) => console.log(err));

// READ JSON FILES
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));

const doctors = JSON.parse(
  fs.readFileSync(`${__dirname}/doctor.json`, "utf-8"),
);

const patients = JSON.parse(
  fs.readFileSync(`${__dirname}/patient.json`, "utf-8"),
);

const appointments = JSON.parse(
  fs.readFileSync(`${__dirname}/appointment.json`, "utf-8"),
);

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    // 1️⃣ إنشاء المستخدمين
    const createdUsers = await User.create(users);

    // 2️⃣ ربط الدكاترة باليوزر
    const doctorUsers = createdUsers.filter((u) => u.role === "doctor");

    doctors.forEach((doc, i) => {
      doc.user = doctorUsers[i]._id;
    });

    await Doctor.create(doctors);

    // 3️⃣ ربط المرضى باليوزر
    const patientUsers = createdUsers.filter((u) => u.role === "patient");

    patients.forEach((pat, i) => {
      pat.user = patientUsers[i]._id;
    });

    await Patient.create(patients);

    // 4️⃣ إدخال المواعيد
    if (appointments.length) {
      await Appointment.create(appointments);
    }

    console.log("Data successfully loaded!");
  } catch (err) {
    console.log(err);
  }

  process.exit();
};

// DELETE ALL DATA
const deleteData = async () => {
  try {
    await Appointment.deleteMany();
    await Doctor.deleteMany();
    await Patient.deleteMany();
    await User.deleteMany();

    console.log("Data successfully deleted!");
  } catch (err) {
    console.log(err);
  }

  process.exit();
};

if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}
