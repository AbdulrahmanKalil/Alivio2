const mongoose = require("mongoose");
const validator = require("validator");

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
      validate: {
        validator: function(val) {
          return /^(\+20|0)?1[0125][0-9]{8}$/.test(val);
        },
        message: "Please provide a valid Egyptian phone number",
      },
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    address: {
      street: {
        type: String,
        default: null,
      },
      city: {
        type: String,
        default: null,
      },
      country: {
        type: String,
        default: "Egypt",
      },
    },

    gender: {
      type: String,
      enum: ["male", "female"],
      default: "male",
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
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

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
patientSchema.virtual("age").get(function() {
  if (!this.dateOfBirth) return null;

  const today = new Date();
  const birth = new Date(this.dateOfBirth);

  let age = today.getFullYear() - birth.getFullYear();

  const m = today.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
});

const Patient = mongoose.model("Patient", patientSchema);
module.exports = Patient;
