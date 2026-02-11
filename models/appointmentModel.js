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

    date: {
      type: Date,
      required: [true, "Appointment must have a date"],
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

exports.setDoctorId = (req, res, next) => {
  req.body.doctor = req.params.doctorId;
  next();
};
/**
 * Index مهم جدًا
 * يمنع تكرار نفس المعاد لنفس الدكتور (تقنيًا)
 */

appointmentSchema.index({ doctor: 1, date: 1 }, { unique: true });

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
