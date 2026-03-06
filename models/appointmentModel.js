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
      required: true,
    },
    endTime: {
      type: Date,
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
  },
  {
    timestamps: true,
  },
);

// exports.setDoctorId = (req, res, next) => {
//   req.body.doctor = req.params.doctorId;
//   next();
// };
/**
 * Index مهم جدًا
 * يمنع تكرار نفس المعاد لنفس الدكتور (تقنيًا)
 */

appointmentSchema.index({ doctor: 1, startTime: 1 }, { unique: true });
appointmentSchema.index({ patient: 1 });
appointmentSchema.index({ startTime: 1 });
const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
