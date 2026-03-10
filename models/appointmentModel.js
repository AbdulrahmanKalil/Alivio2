const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Appointment must belong to a patient"],
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Appointment must belong to a doctor"],
    },

    startTime: {
      type: Date,
      required: [true, "Appointment must have a start time"],
    },

    endTime: {
      type: Date,
      required: [true, "Appointment must have an end time"],
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },

    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    location: {
      clinicName: {
        type: String,
        trim: true,
      },
    },

    price: Number,
  },
  { timestamps: true },
);

// indexes
appointmentSchema.index({ doctor: 1, startTime: 1, endTime: 1 });
appointmentSchema.index({ patient: 1 });
appointmentSchema.index({ startTime: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
