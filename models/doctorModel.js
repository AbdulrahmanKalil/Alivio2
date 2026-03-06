const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    // required: true,
    unique: true,
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: [true, "A doctor must have a phone number"],
    unique: true,
    match: [/^01[0-9]{9}$/, "Phone must be a valid Egyptian number"],
  },
  specialty: {
    type: String,
    required: [true, "A doctor must have a specialty"],
    lowercase: true,
    trim: true,
    enum: {
      values: [
        "cardiology",
        "dermatology",
        "neurology",
        "pediatrics",
        "general",
        "orthopedics",
        "dentistry",
        "psychiatry",
      ],
      message: "Specialty is not valid",
    },
  },
  yearsOfExperience: {
    type: Number,
    required: [true, "Years of experience is required"],
    min: [0, "Experience must be 0 or more"],
    max: [50, "Experience must be less than 60 years"],
  },
  price: {
    type: Number,
    required: [true, "A doctor must have a consultation price"],
    min: [50, "Price must be at least 50 EGP"],
  },
  schedule: {
    type: [String],
    required: [true, "Please specify available days"],
    enum: {
      values: [
        "saturday",
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
      ],
      message: "Invalid day provided",
    },
  },
  workingHours: {
    type: {
      start: {
        type: String,
        required: [true, "Please specify start time"],
        match: [
          /^([01]\d|2[0-3]):([0-5]\d)$/,
          "Invalid time format (use HH:MM)",
        ],
      },
      end: {
        type: String,
        required: [true, "Please specify end time"],
        match: [
          /^([01]\d|2[0-3]):([0-5]\d)$/,
          "Invalid time format (use HH:MM)",
        ],
      },
    },
    required: [true, "Please specify working hours"],
  },
  gender: {
    type: String,
    enum: {
      values: ["male", "female"],
      message: "Gender must be either male or female",
    },
    default: "male",
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description too long"],
  },
  image: {
    type: String,
    default: "default-doctor.jpg",
  },
  isActive: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// // Indexes for better performance
// doctorSchema.index({ specialty: 1, ratingsAverage: -1 });
// doctorSchema.index({ slug: 1 });
// doctorSchema.index({ email: 1 });
// doctorSchema.index({ hospital: 1 });
// doctorSchema.index({ price: 1 });

// Virtual property
doctorSchema.virtual("experienceLevel").get(function() {
  if (this.yearsOfExperience < 3) return "Junior";
  if (this.yearsOfExperience < 10) return "Mid-level";
  return "Senior";
});

// // Document middleware: runs before .save() and .create()
// doctorSchema.pre("save", function (next) {
//   this.slug = slugify(this.name, { lower: true });
// });

// Query middleware: runs before any find query
doctorSchema.pre(/^find/, function() {
  this.find({ isActive: { $ne: false } });
});

// Aggregation middleware
doctorSchema.pre("aggregate", function(next) {
  this.pipeline().unshift({ $match: { isActive: { $ne: false } } });
  next();
});

// ... (بعد الـ Virtuals والـ find middleware)

// Middleware للحذف المتتالي (Cascade Delete)
// عند حذف طبيب، يتم حذف حساب المستخدم (User) المرتبط به تلقائيًا
doctorSchema.pre("findOneAndDelete", async function(next) {
  try {
    // 1. جلب بيانات الدكتور قبل الحذف للوصول لمعرف المستخدم (user ID)
    const doctor = await this.model.findOne(this.getFilter());

    if (doctor && doctor.user) {
      // 2. حذف الوثيقة من مجموعة الـ Users
      // نستخدم mongoose.model لتجنب مشاكل الاستيراد الدائري (Circular Dependency)
      await mongoose.model("User").deleteOne({ _id: doctor.user });
      console.log(
        `Successfully deleted User associated with Doctor: ${doctor._id}`,
      );
    }
  } catch (err) {
    console.error("Error during cascade delete of User:", err);
  }
});

module.exports = mongoose.model("Doctor", doctorSchema);
module.exports = mongoose.model("Doctor", doctorSchema);
