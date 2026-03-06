const mongoose = require("mongoose");
const validator = require("validator");

const patientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  displayName: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function(val) {
        return /^(\+20|0)?1[0125][0-9]{8}$/.test(val);
      },
      message: "Please provide a valid Egyptian phone number",
    },
  },

  address: {
    type: String,
    trim: true,
  },

  bloodType: {
    type: String,
    enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    default: "A+",
  },

  medicalHistory: {
    type: String,
    required: true,
    trim: true,
    default: "None",
  },
});
// patientModel.js

// Middleware للحذف المتتالي (Cascade Delete)
patientSchema.pre("findOneAndDelete", async function() {
  try {
    // 1. جلب بيانات المريض قبل الحذف
    const patient = await this.model.findOne(this.getFilter());

    // 🔐 Authorization check
    if (patient.doctor.toString() !== req.user._id.toString()) {
      return next(new AppError("Not your patient", 403));
    }

    // 2. التأكد من وجود المريض ووجود user مرتبط به
    if (patient && patient.user) {
      // حذف الـ User المرتبط بهذا المريض
      await mongoose.model("User").deleteOne({ _id: patient.user });

      console.log(
        `Successfully deleted User associated with Patient ID: ${patient._id}`,
      );
    }
  } catch (err) {
    console.error("Error during cascade delete of User from Patient:", err);
    throw err;
  }
});

const Patient = mongoose.model("Patient", patientSchema);
module.exports = Patient;
