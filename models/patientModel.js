const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
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
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    address: {
      street: String,
      city: String,
      country: { type: String, default: "Egypt" },
    },

    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
    },

    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },

    medicalHistory: {
      type: String,
      trim: true,
      default: "None",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// cascade delete user
patientSchema.pre("findOneAndDelete", async function (next) {
  const patient = await this.model.findOne(this.getFilter());

  if (patient?.user) {
    await mongoose.model("User").deleteOne({ _id: patient.user });
  }

  next();
});

// virtual age
patientSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;

  const today = new Date();

  const birth = new Date(this.dateOfBirth);

  let age = today.getFullYear() - birth.getFullYear();

  const m = today.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

  return age;
});

module.exports = mongoose.model("Patient", patientSchema);
