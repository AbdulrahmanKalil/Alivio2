const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Doctor must be linked to a user"],
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

    specialty: {
      type: String,
      required: true,
    },

    yearsOfExperience: {
      type: Number,
      min: 0,
    },

    price: {
      type: Number,
      required: true,
    },

    schedule: [
      {
        type: String,
      },
    ],

    workingHours: {
      start: String,
      end: String,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
    },

    description: String,

    image: String,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Hide inactive doctors
doctorSchema.pre(/^find/, function (next) {
  this.find({ isActive: { $ne: false } });
});

// Delete doctor appointments when doctor deleted
doctorSchema.pre("findOneAndDelete", async function (next) {
  const doctor = await this.model.findOne(this.getFilter());

  if (doctor) {
    await mongoose.model("Appointment").deleteMany({ doctor: doctor._id });
  }
});

module.exports = mongoose.model("Doctor", doctorSchema);
