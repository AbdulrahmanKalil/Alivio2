const mongoose = require("mongoose");

const PrescriptionSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },

    diagnosis: {
      type: String,
      required: true,
    },

    medications: [
      {
        name: { type: String, required: true },
        strength: String,
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        instructions: String,
        startDate: Date,
        stopDate: Date,
      },
    ],

    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },

    notes: {
      type: String,
      required: true,
    },

    followUpDate: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Prescription", PrescriptionSchema);
