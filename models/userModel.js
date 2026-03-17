const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "User must have a name"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "User must have an email"],
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: [true, "User must have a password"],
      minlength: 8,
      select: false,
    },

    passwordConfirm: {
      type: String,
      required: [true, "Please confirm your password"],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "Passwords are not the same",
      },
    },
    profilePic: {
      url: {
        type: String,
        default: "default.jpg",
      },
      public_id: {
        type: String,
      },
    },

    role: {
      type: String,
      enum: ["admin", "doctor", "patient"],
      default: "patient",
    },

    passwordChangedAt: Date,

    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Cascade delete profiles when user deleted
userSchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    try {
      if (this.role === "patient") {
        await mongoose.model("Patient").deleteOne({ user: this._id });
      } else if (this.role === "doctor") {
        await mongoose.model("Doctor").deleteOne({ user: this._id });
      }

      next();
    } catch (err) {
      next(err);
    }
  },
);

const User = mongoose.model("User", userSchema);

module.exports = User;
