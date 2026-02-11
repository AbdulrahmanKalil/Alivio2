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
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    default: null,
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

const Patient = mongoose.model("Patient", patientSchema);
module.exports = Patient;
