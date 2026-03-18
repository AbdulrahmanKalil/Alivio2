const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: [true, "الصورة مطلوبة"],
    },
    publicId: {
      type: String,
      required: [true, "الـ public_id مطلوب"],
    },
    scanType: {
      type: String,
      required: [true, "نوع الفحص مطلوب"],
      enum: ["skin", "breast", "eye", "brain", "heart", "lung", "kidney"],
    },
    aiResult: {
      type: mongoose.Schema.Types.Mixed, // بيحفظ أي شكل JSON جاي من الـ AI
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    errorMessage: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "المستخدم مطلوب"],
    },
  },
  {
    timestamps: true,
  },
);

const Scan = mongoose.model("Scan", scanSchema);

module.exports = Scan;
