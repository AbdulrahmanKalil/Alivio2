const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), "config.env") });

const cloudinary = require("cloudinary").v2;
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const User = require("../models/userModel");
const factory = require("../services/factoryService");

// 🧠 helper
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// ───────── Update Photo ─────────
exports.updatePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("برجاء رفع صورة", 400));
  }

  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // حذف الصورة القديمة
  if (user.profilePic?.public_id) {
    try {
      await cloudinary.uploader.destroy(user.profilePic.public_id);
    } catch (err) {
      console.error("Cloudinary delete failed:", err.message);
    }
  }

  // تحديث الصورة
  user.profilePic = {
    url: req.file.path,
    public_id: req.file.filename,
  };

  await user.save();

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

// ───────── Get Me ─────────
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// ───────── Update Me ─────────
exports.updateMe = catchAsync(async (req, res, next) => {
  // ❌ منع تغيير الباسورد
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400,
      ),
    );
  }

  const filteredBody = filterObj(req.body, "name", "email");

  if (req.file) {
    filteredBody.profilePic = {
      url: req.file.path,
      public_id: req.file.filename,
    };
  }

  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  Object.assign(user, filteredBody);
  await user.save();

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

// ───────── Factory Controllers ─────────
exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);

// ⚠️ admin only
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
